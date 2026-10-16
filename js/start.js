/* START: dit bestand start alles op, nadat alle andere scripts geladen zijn. */

// Wacht met opstarten tot de DOM klaar is, anders kan #bureaublad ontbreken.
document.addEventListener('DOMContentLoaded', () => {
  try {
    // Bouw dock en tekenschermen pas nádat alle apps geregistreerd zijn
    Prive.bouwDock();
  } catch (e) { console.warn('Prive niet klaar voor bouwDock()', e); }

  try { Home.teken(); } catch (e) { console.warn('Home.teken faalde:', e); }
  try { Achtergrond.werkBij(); } catch (e) { /* optioneel */ }
  try { Eiland.rust(); Eiland.bewaak(); } catch (e) { /* optioneel */ }

  try {
    if (window.Opslag && Opslag.lees('auth_spotify')) Eiland.startSpotifyPoll();
  } catch (e) {}

  const eilandEl = document.getElementById('eiland');
  if (eilandEl) eilandEl.addEventListener('click', () => { try { Eiland.klik(); } catch (e) {} });

  // als er iets verandert, de juiste stukken opnieuw tekenen
  try { Prive.luister('taken', () => Home.taken()); } catch (e) {}
  try { Prive.luister('websites', () => Home.websites()); } catch (e) {}
  try { Prive.luister('weer', () => { Home.wedstrijd(); Achtergrond.werkBij(); }); } catch (e) {}
  try { Prive.luister('instellingen', () => { Home.teken(); Achtergrond.werkBij(); }); } catch (e) {}
  try { Prive.luister('auth', () => {
    if (Opslag.lees('auth_spotify')) Eiland.startSpotifyPoll();
    else Eiland.stopSpotifyPoll();
  }); } catch (e) {}

  // klok, wedstrijd en weer — respecteer reduced motion voorkeur
  const respectReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!respectReducedMotion) {
    try { setInterval(() => Home.klok(), 10000); } catch (e) {}
    try { setInterval(() => Home.wedstrijd(), 60000); } catch (e) {}
    try { setInterval(() => { Home.weer(); Achtergrond.werkBij(); }, 15 * 60000); } catch (e) {}
  }

  // om middernacht moet het agenda-icoon de nieuwe datum krijgen
  try { setInterval(() => Prive.bouwDock(), 60 * 60000); } catch (e) {}

  // sneltoetsen: Esc sluit alles, Ctrl/Cmd + J opent Siri, pijlen in dock
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

  // staat er een app in het adres (bv. #planner)? Dan die app meteen openen
  if (location.hash.length > 1) {
    try { Prive.start(location.hash.slice(1)); } catch (e) { console.warn('Prive.start faalde', e); }
  }

  // PWA: de service worker zorgt dat Privé als app werkt en ook offline opent
  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
});
