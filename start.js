/* START: dit bestand start alles op, nadat alle andere scripts geladen zijn. */

Prive.bouwDock();
Home.teken();
Achtergrond.werkBij();
Eiland.rust();
Eiland.bewaak();
document.getElementById('eiland').addEventListener('click', () => Eiland.klik());

// als er iets verandert, de juiste stukken opnieuw tekenen
Prive.luister('taken', () => Home.taken());
Prive.luister('websites', () => Home.websites());
Prive.luister('weer', () => { Home.wedstrijd(); Achtergrond.werkBij(); });
Prive.luister('instellingen', () => { Home.teken(); Achtergrond.werkBij(); });

// klok elke 10 seconden bijwerken, de wedstrijd-aftelling elke minuut, het weer elke 15 minuten
setInterval(() => Home.klok(), 10000);
setInterval(() => Home.wedstrijd(), 60000);
setInterval(() => { Home.weer(); Achtergrond.werkBij(); }, 15 * 60000);

// om middernacht moet het agenda-icoon de nieuwe datum krijgen
setInterval(() => Prive.bouwDock(), 60 * 60000);

// sneltoetsen: Esc sluit alles, Ctrl/Cmd + J opent Siri
addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    if (document.getElementById('siri-laag').classList.contains('actief')) Siri.sluit();
    else Prive.sluit();
  }
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'j') { e.preventDefault(); Siri.start(); }
});

// staat er een app in het adres (bv. #planner)? Dan die app meteen openen
if (location.hash.length > 1) Prive.start(location.hash.slice(1));

// PWA: de service worker zorgt dat Privé als app werkt en ook offline opent
if ('serviceWorker' in navigator && location.protocol === 'https:') {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
