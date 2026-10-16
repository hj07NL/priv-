// Laad de Spotify Web Playback SDK en maak een manager die de speler bestuurt.
// Nederlandse commentaar: deze module maakt van de browser een Spotify Connect-apparaat.
// Vereisten: gebruiker heeft Spotify Premium en is aangemeld (Auth.krijgToken('spotify') gebruikt PKCE).

const SpotifyManager = (function () {
  let player = null;
  let deviceId = null;
  let state = null;
  const listeners = [];

  async function wachtOpSDK() {
    if (window.Spotify) return;
    // de SDK roept window.onSpotifyWebPlaybackSDKReady als hij geladen is
    await new Promise(resolve => {
      const bestaand = !!window.onSpotifyWebPlaybackSDKReady;
      if (bestaand && window.Spotify) return resolve();
      window.onSpotifyWebPlaybackSDKReady = () => resolve();
      // als SDK niet geladen is, het is oké — index.html laadt de externe script
    });
  }

  async function init() {
    try {
      const token = await Auth.krijgToken('spotify');
      if (!token) return; // niet gekoppeld of geen token
      await wachtOpSDK();
      if (!window.Spotify) return; // SDK niet beschikbaar

      if (player) {
        try { player.disconnect(); } catch (e) {}
        player = null; deviceId = null; state = null;
      }

      player = new Spotify.Player({
        name: 'Privé Web Player',
        getOAuthToken: cb => { Auth.krijgToken('spotify').then(t => cb(t)).catch(() => cb(token)); }
      });

      player.addListener('ready', ({ device_id }) => {
        deviceId = device_id;
        // transfer playback naar deze browser (zonder automatisch afspelen)
        transferPlayback().catch(() => {});
        window.dispatchEvent(new CustomEvent('spotify:ready', { detail: device_id }));
      });

      player.addListener('not_ready', ({ device_id }) => {
        if (deviceId === device_id) deviceId = null;
        window.dispatchEvent(new CustomEvent('spotify:not_ready', { detail: device_id }));
      });

      player.addListener('player_state_changed', s => {
        state = s;
        window.dispatchEvent(new CustomEvent('spotify:state', { detail: state }));
        listeners.forEach(cb => { try { cb(state); } catch (e) {} });
      });

      await player.connect();
    } catch (e) {
      console.warn('SpotifyManager init fout', e);
    }
  }

  async function transferPlayback() {
    try {
      const token = await Auth.krijgToken('spotify');
      if (!token || !deviceId) return;
      await fetch('https://api.spotify.com/v1/me/player', {
        method: 'PUT',
        headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
        body: JSON.stringify({ device_ids: [deviceId], play: false })
      });
    } catch (e) { console.warn('transferPlayback fout', e); }
  }

  async function play() {
    try {
      const token = await Auth.krijgToken('spotify');
      if (!token || !deviceId) throw new Error('Geen token of device');
      await fetch('https://api.spotify.com/v1/me/player/play?device_id=' + deviceId, { method: 'PUT', headers: { Authorization: 'Bearer ' + token } });
    } catch (e) { throw e; }
  }
  async function pause() {
    try {
      const token = await Auth.krijgToken('spotify');
      if (!token || !deviceId) throw new Error('Geen token of device');
      await fetch('https://api.spotify.com/v1/me/player/pause?device_id=' + deviceId, { method: 'PUT', headers: { Authorization: 'Bearer ' + token } });
    } catch (e) { throw e; }
  }
  async function toggle() {
    if (!state) return;
    try {
      if (state.paused) await play(); else await pause();
    } catch (e) { throw e; }
  }

  function getState() { return state; }
  function onState(cb) { listeners.push(cb); }

  // herinit als auth verandert
  window.addEventListener('privé:auth', () => { setTimeout(init, 200); });
  // kleine startpoging
  setTimeout(() => init(), 800);

  return { init, play, pause, toggle, getState, onState };
})();

// expose voor andere modules
window.SpotifyManager = SpotifyManager;
