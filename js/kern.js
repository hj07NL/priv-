/* KERN: het "besturingssysteem" van Privé.
   - houdt een lijst bij van alle apps
   - bouwt het dock
   - opent en sluit app-vensters
   - laat onderdelen met elkaar praten (zend / luister)

   ZELF EEN APP TOEVOEGEN:
   1. maak een bestand in js/apps/, bijvoorbeeld js/apps/cijfers.js
   2. zet daarin:  privé.registreer({ id: 'cijfers', naam: 'Cijfers', kleur: '...', icoon: '<svg>...</svg>', maak(body) { ... } });
   3. zet in index.html een <script src="js/apps/cijfers.js"></script> bij de andere apps
   Klaar: hij staat vanzelf in het dock. */

const Prive = {
  apps: [],
  open: null,

  registreer(app) {
    this.apps.push(app);
  },

  app(id) {
    return this.apps.find(a => a.id === id);
  },

  zend(naam, data) {
    window.dispatchEvent(new CustomEvent('privé:' + naam, { detail: data }));
  },
  luister(naam, functie) {
    window.addEventListener('privé:' + naam, e => functie(e.detail));
  },

  bouwDock() {
    const dock = document.getElementById('dock');
    if (!dock) return;
    dock.innerHTML = '';
    this.apps.filter(a => a.inDock !== false).forEach(app => {
      const knop = el('button', {
        class: 'dock-app',
        type: 'button',
        'aria-label': app.naam,
        title: app.naam,
        tabindex: '0'
      });
      knop.innerHTML = `<span class="app-icoon ${app.kleur === 'oranje' ? 'oranje' : 'blauw'}">${typeof app.icoon === 'function' ? app.icoon() : app.icoon}</span>
                        <span class="dock-naam">${app.naam}</span>`;
      knop.addEventListener('click', () => this.start(app.id));
      knop.addEventListener('keyup', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.start(app.id);
        }
      });
      dock.appendChild(knop);
    });
  },

  start(id, opties) {
    const app = this.app(id);
    if (!app) return;
    if (app.start) { app.start(opties); return; }
    this.openVenster(app, opties);
  },

  openVenster(app, opties) {
    this.sluit(true);
    const laag = document.getElementById('venster-laag');
    const venster = el('section', { class: 'venster', role: 'dialog', 'aria-label': app.naam });
    venster.innerHTML = `
      <header class="venster-balk">
        <div class="lampjes">
          <button class="lampje rood" type="button" aria-label="Sluiten"></button>
          <span class="lampje geel"></span><span class="lampje groen"></span>
        </div>
        <h2>${app.naam}</h2>
        <button class="klaar-knop" type="button">Klaar</button>
      </header>
      <div class="venster-inhoud"></div>`;
    laag.appendChild(venster);
    laag.classList.add('actief');
    document.body.classList.add('venster-open');

    venster.querySelector('.rood').addEventListener('click', () => this.sluit());
    venster.querySelector('.klaar-knop').addEventListener('click', () => this.sluit());
    laag.onclick = e => { if (e.target === laag) this.sluit(); };

    this.open = app;
    app.maak(venster.querySelector('.venster-inhoud'), opties);
    history.replaceState(null, '', '#' + app.id);
  },

  sluit(direct) {
    const laag = document.getElementById('venster-laag');
    const venster = laag.querySelector('.venster');
    if (this.open && this.open.sluit) this.open.sluit();
    this.open = null;
    document.body.classList.remove('venster-open');
    if (!venster) return;
    history.replaceState(null, '', location.pathname);
    if (direct) { venster.remove(); laag.classList.remove('actief'); return; }
    venster.classList.add('weg');
    laag.classList.remove('actief');
    setTimeout(() => venster.remove(), 220);
  }
};

function el(tag, attrs = {}, tekst) {
  const e = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, v));
  if (tekst !== undefined) e.textContent = tekst;
  return e;
}

function veilig(tekst) {
  return String(tekst ?? '').replace(/[&<>"']/g, t => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[t]));
}

const DAGEN = ['zondag', 'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag'];
const MAANDEN = ['januari', 'februari', 'maart', 'april', 'mei', 'juni', 'juli', 'augustus', 'september', 'oktober', 'november', 'december'];

function datumTekst(d) {
  const p = n => String(n).padStart(2, '0');
  return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
}
function vandaag() { return datumTekst(new Date()); }
function plusDagen(n) { const d = new Date(); d.setDate(d.getDate() + n); return datumTekst(d); }

function mooieDatum(tekst) {
  if (tekst === vandaag()) return 'vandaag';
  if (tekst === plusDagen(1)) return 'morgen';
  if (tekst === plusDagen(-1)) return 'gisteren';
  const d = new Date(tekst + 'T12:00');
  return DAGEN[d.getDay()] + ' ' + d.getDate() + ' ' + MAANDEN[d.getMonth()];
}

function googleAgendaLink(titel, datum, tijd, minuten = 60) {
  const schoon = s => s.replace(/[-:]/g, '');
  let dates;
  if (tijd) {
    const begin = new Date(datum + 'T' + tijd);
    const eind = new Date(begin.getTime() + minuten * 60000);
    const t = d => datumTekst(d).replace(/-/g, '') + 'T' + String(d.getHours()).padStart(2, '0') + String(d.getMinutes()).padStart(2, '0') + '00';
    dates = t(begin) + '/' + t(eind);
  } else {
    const volgende = new Date(datum + 'T12:00'); volgende.setDate(volgende.getDate() + 1);
    dates = schoon(datum) + '/' + schoon(datumTekst(volgende));
  }
  return 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=' + encodeURIComponent(titel) + '&dates=' + dates;
}

try { window.Prive = Prive; window.prive = Prive; window['privé'] = Prive; } catch (e) {}
