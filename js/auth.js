/* OAuth & PKCE helper
   Nederlandse commentaar: hiermee kun je Google Calendar en Spotify koppelen via OAuth met PKCE.
   Werkt alleen als je je eigen client-id aanmaakt bij Spotify en Google en de redirect-URI instelt
   op dezelfde URL als deze pagina (bijv. https://hj07nl.github.io/priv-/).

   Opslag gebruikt 'auth_spotify' en 'auth_google' om tokens te bewaren.
*/

const Auth = (function () {
  // helper: veilige willekeurige string
  function randomString(l = 64) {
    const rand = new Uint8Array(l);
    crypto.getRandomValues(rand);
    return btoa(String.fromCharCode(...rand)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '').slice(0, l);
  }

  // base64url-encode een ArrayBuffer
  function base64url(buffer) {
    const bytes = new Uint8Array(buffer);
    let str = '';
    for (let i = 0; i < bytes.byteLength; i++) str += String.fromCharCode(bytes[i]);
    return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  async function sha256(text) {
    const enc = new TextEncoder();
    const data = enc.encode(text);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return base64url(hash);
  }

  // start de OAuth-flow voor provider 'spotify' of 'google'
  async function start(provider) {
    const oauth = Opslag.lees('oauth', {});
    const redirect = location.origin + location.pathname; // moet precies overeenkomen met geregistreerde URI

    const staat = randomString(12);
    const code_verifier = randomString(96);
    const code_challenge = await sha256(code_verifier);
    sessionStorage.setItem('oauth.' + staat, JSON.stringify({ provider, code_verifier, redirect }));

    if (provider === 'spotify') {
      const client_id = oauth.spotifyClientId;
      if (!client_id) return alert('Zet eerst je Spotify Client ID in Instellingen.');
      const scope = encodeURIComponent('user-read-playback-state user-read-currently-playing user-modify-playback-state');
      const url = 'https://accounts.spotify.com/authorize' +
        '?response_type=code' +
        '&client_id=' + encodeURIComponent(client_id) +
        '&scope=' + scope +
        '&redirect_uri=' + encodeURIComponent(redirect) +
        '&code_challenge_method=S256' +
        '&code_challenge=' + encodeURIComponent(code_challenge) +
        '&state=' + encodeURIComponent(staat) +
        '&show_dialog=true';
      location.href = url;
    } else if (provider === 'google') {
      const client_id = oauth.googleClientId;
      if (!client_id) return alert('Zet eerst je Google Client ID in Instellingen.');
      const scope = encodeURIComponent('openid profile https://www.googleapis.com/auth/calendar.readonly');
      const url = 'https://accounts.google.com/o/oauth2/v2/auth' +
        '?response_type=code' +
        '&client_id=' + encodeURIComponent(client_id) +
        '&redirect_uri=' + encodeURIComponent(redirect) +
        '&scope=' + scope +
        '&code_challenge_method=S256' +
        '&code_challenge=' + encodeURIComponent(code_challenge) +
        '&access_type=offline' +
        '&prompt=consent' +
        '&state=' + encodeURIComponent(staat);
      location.href = url;
    }
  }

  // na redirect: check URL params en wissel code in
  async function handleRedirect() {
    const params = new URLSearchParams(location.search);
    if (!params.has('code') || !params.has('state')) return;
    const code = params.get('code');
    const staat = params.get('state');
    const data = sessionStorage.getItem('oauth.' + staat);
    if (!data) return; // geen staat gevonden
    sessionStorage.removeItem('oauth.' + staat);
    const { provider, code_verifier, redirect } = JSON.parse(data);
    try {
      await exchangeCode(provider, code, code_verifier, redirect);
      // verwijder code uit URL
      history.replaceState(null, '', redirect);
      // laat andere onderdelen weten dat auth veranderd is
      if (window.privé && privé.zend) privé.zend('auth');
      else window.dispatchEvent(new CustomEvent('auth')); 
    } catch (err) {
      console.error('OAuth fout', err);
      alert('Koppelen mislukt: ' + (err && err.message ? err.message : err));
    }
  }

  // wissel code in voor tokens
  async function exchangeCode(provider, code, code_verifier, redirect_uri) {
    if (provider === 'spotify') {
      const oauth = Opslag.lees('oauth', {});
      const client_id = oauth.spotifyClientId;
      const body = new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri,
        client_id,
        code_verifier
      });
      const r = await fetch('https://accounts.spotify.com/api/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body });
      if (!r.ok) throw new Error('Spotify token endpoint gaf fout: ' + r.status);
      const json = await r.json();
      json.obtained_at = Date.now();
      Opslag.schrijf('auth_spotify', json);
      // haal gebruiker op ter controle
      try { const me = await fetchSpotify('https://api.spotify.com/v1/me'); Opslag.schrijf('auth_spotify_user', me); } catch (e) {}
    } else if (provider === 'google') {
      const oauth = Opslag.lees('oauth', {});
      const client_id = oauth.googleClientId;
      const body = new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri,
        client_id,
        code_verifier
      });
      const r = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body });
      if (!r.ok) throw new Error('Google token endpoint gaf fout: ' + r.status);
      const json = await r.json();
      json.obtained_at = Date.now();
      Opslag.schrijf('auth_google', json);
      // optioneel: fetch calendars om te controleren
      try { const cal = await fetchGoogle('https://www.googleapis.com/calendar/v3/users/me/calendarList'); Opslag.schrijf('auth_google_user', cal); } catch (e) {}
    }
  }

  // helper: haal geldige access_token, vernieuw als nodig
  async function krijgToken(provider) {
    const key = provider === 'spotify' ? 'auth_spotify' : 'auth_google';
    let tok = Opslag.lees(key, null);
    if (!tok) return null;
    const vervaltOm = (tok.obtained_at || 0) + (tok.expires_in || 0) * 1000 - 60000; // 1 min eerder
    if (Date.now() < vervaltOm) return tok.access_token;
    // vernieuw
    if (!tok.refresh_token) return null;
    const oauth = Opslag.lees('oauth', {});
    const body = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: tok.refresh_token,
      client_id: provider === 'spotify' ? oauth.spotifyClientId : oauth.googleClientId
    });
    const url = provider === 'spotify' ? 'https://accounts.spotify.com/api/token' : 'https://oauth2.googleapis.com/token';
    const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body });
    if (!r.ok) { console.warn('Refresh token mislukt', r.status); return null; }
    const nieuw = await r.json();
    nieuw.refresh_token = nieuw.refresh_token || tok.refresh_token; // soms geeft provider geen nieuwe refresh_token
    nieuw.obtained_at = Date.now();
    Opslag.schrijf(key, nieuw);
    if (window.privé && privé.zend) privé.zend('auth');
    return nieuw.access_token;
  }

  async function fetchSpotify(url, opts = {}) {
    const token = await krijgToken('spotify');
    if (!token) throw new Error('Geen Spotify-token');
    const r = await fetch(url, { ...opts, headers: { ...(opts.headers || {}), Authorization: 'Bearer ' + token } });
    if (!r.ok) throw new Error('Spotify API gaf fout ' + r.status);
    return await r.json();
  }

  async function fetchGoogle(url, opts = {}) {
    const token = await krijgToken('google');
    if (!token) throw new Error('Geen Google-token');
    const r = await fetch(url + (url.includes('?') ? '&' : '?') + 'access_token=' + encodeURIComponent(token), opts);
    if (!r.ok) throw new Error('Google API gaf fout ' + r.status);
    return await r.json();
  }

  function ontkoppel(provider) {
    if (provider === 'spotify') { Opslag.schrijf('auth_spotify', null); Opslag.schrijf('auth_spotify_user', null); }
    else { Opslag.schrijf('auth_google', null); Opslag.schrijf('auth_google_user', null); }
    if (window.privé && privé.zend) privé.zend('auth');
  }

  return { start, handleRedirect, krijgToken, fetchSpotify, fetchGoogle, ontkoppel };
})();

// direct afhandelen als we met code terugkomen
document.addEventListener('DOMContentLoaded', () => { Auth.handleRedirect().catch(() => {}); });
