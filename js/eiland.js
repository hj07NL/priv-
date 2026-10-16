/* DYNAMIC ISLAND (met Spotify SDK-ondersteuning)
   Nederlandse commentaar: toont Spotify-track en play/pause via Web Playback SDK als die beschikbaar is.
   Fallback: als SDK niet werkt, gebruiken we de Web API (zoals eerder). */

const Eiland = {
  timerEinde: null,
  timerLabel: '',
  timerKlok: null,
  meldingKlok: null,
  luistert: false,

  get knop() { return document.getElementById('eiland'); },

  vorm(naam) { this.knop.className = naam; },

  vul(links, midden, rechts) {
    this.knop.querySelector('.eiland-links').innerHTML = links || '';
    this.knop.querySelector('.eiland-midden').innerHTML = midden || '';
    this.knop.querySelector('.eiland-rechts').innerHTML = rechts || '';
  },

  rust() {
    if (this.luistert) return this.siri(true);
    if (this.timerEinde) return this.toonTimer();
    this.vorm('rust');
    this.vul();
  },

  melding(titel, tekst, icoon = '●', ms = 3800) {
    clearTimeout(this.meldingKlok);
    this.vorm('groot');
    this.vul(`<span class="eiland-icoon">${icoon}</span>`,
             `<strong>${veilig(titel)}</strong><small>${veilig(tekst || '')}</small>`, '');
    this.meldingKlok = setTimeout(() => this.rust(), ms);
  },

  timer(seconden, label = 'Timer') {
    this.timerEinde = Date.now() + seconden * 1000;
    this.timerLabel = label;
    clearInterval(this.timerKlok);
    this.timerKlok = setInterval(() => this.tik(), 250);
    this.toonTimer();
  },

  stopTimer() { clearInterval(this.timerKlok); this.timerEinde = null; this.rust(); },

  tik() {
    const over = this.timerEinde - Date.now();
    if (over <= 0) {
      this.stopTimer();
      piep();
      this.melding('Timer klaar', this.timerLabel, '⏰', 6000);
      if (typeof Siri !== 'undefined') Siri.zeg('Je timer is klaar.');
      return;
    }
    if (this.knop.classList.contains('breed')) this.toonTimer();
  },

  toonTimer() {
    const over = Math.max(0, Math.ceil((this.timerEinde - Date.now()) / 1000));
    const min = Math.floor(over / 60), sec = String(over % 60).padStart(2, '0');
    this.vorm('breed');
    this.vul('<span class="eiland-timer-icoon">⏱</span>', '', `<span class="eiland-tijd">${min}:${sec}</span>`);
  },

  siri(aan) {
    this.luistert = aan;
    if (!aan) return this.rust();
    this.vorm('siri');
    this.vul('<span class="mini-bol"></span>', '', '<span class="golf"><i></i><i></i><i></i><i></i><i></i></span>');
  },

  klik() {
    if (this.timerEinde) {
      if (confirm('Timer "' + this.timerLabel + '" stoppen?')) this.stopTimer();
      return;
    }
    const volgende = Planner.volgendeTaak();
    if (volgende) this.melding('Volgende taak', volgende.titel + ' · ' + mooieDatum(volgende.datum) + (volgende.tijd ? ' ' + volgende.tijd : ''), '☑');
    else this.melding('Niks gepland', 'Je planner is leeg', '☑');
  },

  bewaak() {
    setInterval(() => {
      const nu = Date.now();
      Planner.taken().forEach(t => {
        if (t.klaar || !t.tijd || t.gemeld) return;
        const start = new Date(t.datum + 'T' + t.tijd).getTime();
        if (start - nu < 10 * 60000 && start - nu > -60000) {
          Planner.wijzig(t.id, { gemeld: true });
          piep();
          this.melding('Over ' + Math.max(0, Math.round((start - nu) / 60000)) + ' min', t.titel, '☑', 8000);
        }
      });
    }, 30000);
  }
};

/* ---------- Spotify weergave: gebruik eerst de SDK-manager, anders fallback naar Web API ---------- */
Eiland.spotifyInterval = null;
Eiland.spotifyListener = null;

Eiland.toonSpotify = async function () {
  try {
    // eerst de SDK-status proberen
    if (window.SpotifyManager && SpotifyManager.getState) {
      const s = SpotifyManager.getState();
      if (s && s.track_window && s.track_window.current_track) {
        const track = s.track_window.current_track;
        const titel = track.name;
        const artiest = track.artists.map(a => a.name).join(', ');
        const img = track.album.images && track.album.images[0] ? track.album.images[0].url : '';
        const playing = !s.paused;
        this.vorm('groot');
        const rechts = `<button class="eiland-spotify-knop" type="button" aria-label="${playing ? 'Pauzeer' : 'Speel'}">${playing ? '⏸' : '▶'}</button>`;
        this.vul(`<img src="${img}" alt="" style="width:44px;height:44px;border-radius:8px;object-fit:cover">`,
                 `<strong>${veilig(titel)}</strong><small>${veilig(artiest)}</small>`,
                 rechts);
        const knop = this.knop.querySelector('.eiland-spotify-knop');
        if (knop) knop.onclick = async e => { e.stopPropagation(); try { await SpotifyManager.toggle(); } catch (err) { Eiland.melding('Spotify', 'Besturing mislukt', '⛔', 2500); } };
        return;
      }
    }

    // fallback: gebruik Web API zoals vroeger
    if (!Opslag.lees('auth_spotify')) { this.rust(); return; }
    const nu = await Auth.fetchSpotify('https://api.spotify.com/v1/me/player/currently-playing');
    if (!nu || !nu.item) { this.rust(); return; }
    const track = nu.item;
    const titel = track.name;
    const artiest = track.artists.map(a => a.name).join(', ');
    const img = track.album.images && track.album.images[0] ? track.album.images[0].url : '';
    this.vorm('groot');
    const rechts = `<button class="eiland-spotify-knop" type="button" aria-label="${nu.is_playing ? 'Pauzeer' : 'Speel'}">${nu.is_playing ? '⏸' : '▶'}</button>`;
    this.vul(`<img src="${img}" alt="" style="width:44px;height:44px;border-radius:8px;object-fit:cover">`,
             `<strong>${veilig(titel)}</strong><small>${veilig(artiest)}</small>`,
             rechts);
    const knop = this.knop.querySelector('.eiland-spotify-knop');
    if (knop) {
      knop.onclick = async e => {
        e.stopPropagation();
        try {
          const token = await Auth.krijgToken('spotify');
          if (!token) throw new Error('Geen Spotify-token');
          if (nu.is_playing) await fetch('https://api.spotify.com/v1/me/player/pause', { method: 'PUT', headers: { Authorization: 'Bearer ' + token } });
          else await fetch('https://api.spotify.com/v1/me/player/play', { method: 'PUT', headers: { Authorization: 'Bearer ' + token } });
          setTimeout(() => this.toonSpotify(), 500);
        } catch (err) { console.warn('Spotify play/pause mislukt', err); Eiland.melding('Spotify', 'Besturing mislukt', '⛔', 2500); }
      };
    }
  } catch (e) {
    this.rust();
  }
};

Eiland.startSpotifyPoll = function () {
  // als SDK-manager er is: luister naar events
  if (window.SpotifyManager && SpotifyManager.getState) {
    if (this.spotifyListener) return;
    this.spotifyListener = () => this.toonSpotify();
    window.addEventListener('spotify:state', this.spotifyListener);
    window.addEventListener('spotify:ready', this.spotifyListener);
    this.toonSpotify();
    return;
  }
  // fallback: poll via Web API
  if (this.spotifyInterval) return;
  this.toonSpotify();
  this.spotifyInterval = setInterval(() => this.toonSpotify(), 8000);
};

Eiland.stopSpotifyPoll = function () {
  if (this.spotifyListener) {
    window.removeEventListener('spotify:state', this.spotifyListener);
    window.removeEventListener('spotify:ready', this.spotifyListener);
    this.spotifyListener = null;
  }
  if (this.spotifyInterval) { clearInterval(this.spotifyInterval); this.spotifyInterval = null; }
  this.rust();
};

window.addEventListener('privé:auth', () => {
  if (Opslag.lees('auth_spotify')) Eiland.startSpotifyPoll(); else Eiland.stopSpotifyPoll();
});

/* een kort geluidje maken met de Web Audio API (geen geluidsbestand nodig) */
function piep() {
  try {
    const ac = new (window.AudioContext || window.webkitAudioContext)();
    [0, 0.18].forEach(t => {
      const osc = ac.createOscillator(), vol = ac.createGain();
      osc.frequency.value = 880; osc.type = 'sine';
      vol.gain.setValueAtTime(0.0001, ac.currentTime + t);
      vol.gain.exponentialRampToValueAtTime(0.25, ac.currentTime + t + 0.02);
      vol.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + t + 0.15);
      osc.connect(vol).connect(ac.destination);
      osc.start(ac.currentTime + t); osc.stop(ac.currentTime + t + 0.16);
    });
  } catch (e) {}
}
