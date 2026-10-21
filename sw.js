/* START: dit bestand start alles op, nadat alle andere scripts geladen zijn. */

document.addEventListener('DOMContentLoaded', () => {
  try {
    Prive.bouwDock();
  } catch (e) { console.warn('Prive niet klaar voor bouwDock()', e); }

  try { Home.teken(); } catch (e) { console.warn('Home.teken faalde:', e); }
  try { Achtergrond.werkBij(); } catch (e) { /* optioneel */ }
  try { Eiland.rust(); Eiland.bewaak(); } catch (e) { /* optioneel */ }
  try { Bediening.init(); } catch (e) { /* optioneel */ }

  try {
    if (window.Opslag && Opslag.lees('auth_spotify')) Eiland.startSpotifyPoll();
  } catch (e) {}

  const eilandEl = document.getElementById('eiland');
  if (eilandEl) eilandEl.addEventListener('click', () => { try { Eiland.klik(); } catch (e) {} });

  try { Prive.luister('taken', () => Home.taken()); } catch (e) {}
  try { Prive.luister('websites', () => Home.websites()); } catch (e) {}
  try { Prive.luister('weer', () => { Home.wedstrijd(); Achtergrond.werkBij(); }); } catch (e) {}
  try { Prive.luister('instellingen', () => { Home.teken(); Achtergrond.werkBij(); }); } catch (e) {}
  try { Prive.luister('auth', () => {
    if (Opslag.lees('auth_spotify')) Eiland.startSpotifyPoll();
    else Eiland.stopSpotifyPoll();
  }); } catch (e) {}

  const respectReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!respectReducedMotion) {
    try { setInterval(() => Home.klok(), 10000); } catch (e) {}
    try { setInterval(() => Home.wedstrijd(), 60000); } catch (e) {}
    try { setInterval(() => { Home.weer(); Achtergrond.werkBij(); }, 15 * 60000); } catch (e) {}
  }

  try { setInterval(() => Prive.bouwDock(), 60 * 60000); } catch (e) {}

  addEventListener('keydown', e => {
    try {
      if (e.key === 'Escape') {
        if (document.getElementById('siri-laag') && document.getElementById('siri-laag').classList.contains('actief')) Siri.sluit();
        else Prive.sluit();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'j') { e.preventDefault(); Siri.start(); }

      const focus = document.activeElement;
      if (focus && focus.classList && focus.classList.contains('dock-app')) {
        if (e.key === 'ArrowRight') { e.preventDefault(); focus.nextElementSibling?.focus(); }
        if (e.key === 'ArrowLeft') { e.preventDefault(); focus.previousElementSibling?.focus(); }
      }
    } catch (err) { /* swallow */ }
  });

  if (location.hash.length > 1) {
    try { Prive.start(location.hash.slice(1)); } catch (e) { console.warn('Prive.start faalde', e); }
  }

  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
});
