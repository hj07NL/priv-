/* SERVICE WORKER: een script dat op de achtergrond draait en de bestanden van Privé bewaart.
   Daardoor opent Privé ook zonder internet, en voelt het als een echte app.
   Pas je iets aan en zie je het niet? Verhoog dan het versienummer hieronder, bv. naar 'priv--v3'. */

const VERSIE = 'priv--v2';
const BESTANDEN = [
  './', 'index.html', 'manifest.webmanifest', 'css/stijl.css',
  'js/opslag.js', 'js/kern.js', 'js/weer.js', 'js/achtergrond.js', 'js/eiland.js', 'js/start.js',
  'js/apps/home.js', 'js/apps/websites.js', 'js/apps/agenda.js', 'js/apps/planner.js',
  'js/apps/browser.js', 'js/apps/siri.js', 'js/apps/instellingen.js', 'data/mijn-websites.js',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png'
];

// bij installeren: alle bestanden in de cache (opslag) zetten
self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSIE).then(c => c.addAll(BESTANDEN)));
  self.skipWaiting();
});

// oude versies van de cache weggooien
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(namen => Promise.all(namen.filter(n => n !== VERSIE).map(n => caches.delete(n)))));
  self.clients.claim();
});

// eerst het internet proberen (dan heb je altijd de nieuwste versie), lukt dat niet: uit de cache
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(
    fetch(e.request)
      .then(antwoord => { const kopie = antwoord.clone(); caches.open(VERSIE).then(c => c.put(e.request, kopie)); return antwoord; })
      .catch(() => caches.match(e.request))
  );
});