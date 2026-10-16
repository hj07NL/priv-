/* HOME: de widgets op het beginscherm.
   Deze versie zorgt dat er altijd fallback-widgets worden getekend als een dependency ontbreekt.
   Widgets gebruiken de .glas class zodat het design consistent blijft. */

const Home = {
  teken() {
    const b = document.getElementById('bureaublad');
    if (!b) return; // geen bureaublad gevonden

    // Basis widgets: klok, weer, taken, websites — gebruik fallback data als modules ontbreken
    const naam = (typeof instellingen === 'function' ? instellingen().naam : (window.Prive && Prive.naam) || 'Jij');

    b.innerHTML = `
      <section class="widget glas klok-widget" data-app="planner">
        <div>
          <p class="groet">Goedendag, ${veilig(naam)}</p>
          <p class="klok-tijd">--:--</p>
          <p class="klok-datum"></p>
        </div>
      </section>

      <section class="widget glas weer-widget" data-app="instellingen">
        <h2 class="widget-kop">Weer</h2>
        <p class="widget-sub">Loading…</p>
      </section>

      <section class="widget glas taken-widget" data-app="planner">
        <h2 class="widget-kop">Vandaag</h2>
        <p class="widget-sub">Taken laden…</p>
      </section>

      <section class="widget glas wedstrijd-widget" data-app="instellingen">
        <h2 class="widget-kop">Volgende wedstrijd</h2>
        <p class="widget-sub">Geen wedstrijd ingesteld</p>
      </section>

      <section class="widget glas websites-widget" data-app="websites">
        <h2 class="widget-kop">Websites</h2>
        <p class="widget-sub">Geen websites gevonden</p>
      </section>
    `;

    // klik op widget opent app
    b.querySelectorAll('.widget').forEach(w => w.addEventListener('click', e => {
      if (e.target.closest('a, button')) return;
      const app = w.dataset.app;
      if (app && Prive && Prive.start) Prive.start(app);
    }));

    // Start async updates where possible
    try { this.klok(); } catch (e) {}
    try { this.websites(); } catch (e) {}
    try { this.taken(); } catch (e) {}
    try { this.wedstrijd(); } catch (e) {}
    try { this.weer(); } catch (e) {}
  },

  klok() {
    const el = document.querySelector('.klok-tijd');
    const elDatum = document.querySelector('.klok-datum');
    if (!el) return;
    const nu = new Date();
    el.textContent = String(nu.getHours()).padStart(2,'0') + ':' + String(nu.getMinutes()).padStart(2,'0');
    elDatum.textContent = DAGEN[nu.getDay()] + ' ' + nu.getDate() + ' ' + MAANDEN[nu.getMonth()];
  },

  taken() {
    const w = document.querySelector('.taken-widget');
    if (!w) return;
    try {
      if (window.Planner && Planner.taken) {
        const lijst = (Planner.gesorteerd && Planner.gesorteerd(Planner.taken())) || Planner.taken();
        if (!lijst || lijst.length === 0) { w.querySelector('.widget-sub').textContent = 'Niks meer te doen vandaag.'; return; }
        w.innerHTML = `<h2 class="widget-kop">Vandaag <span class="teller">${lijst.length}</span></h2>` +
          `<ul>${lijst.slice(0,4).map(t => `<li>${veilig(t.titel)}</li>`).join('')}</ul>`;
      } else {
        w.querySelector('.widget-sub').textContent = 'Planner niet beschikbaar.';
      }
    } catch (e) { w.querySelector('.widget-sub').textContent = 'Fout bij laden taken.'; }
  },

  websites() {
    const w = document.querySelector('.websites-widget');
    if (!w) return;
    try {
      if (window.Websites && Websites.lijst) {
        const lijst = Websites.lijst() || [];
        w.innerHTML = `<h2 class="widget-kop">Websites</h2><p class="groot-getal">${lijst.length}</p><p class="widget-sub">${lijst.length ? 'Top: ' + veilig((lijst[0].naam||'?')) : 'Nog geen websites'}</p>`;
      } else {
        w.querySelector('.widget-sub').textContent = 'Websites module niet geladen.';
      }
    } catch (e) { w.querySelector('.widget-sub').textContent = 'Fout bij laden websites.'; }
  },

  wedstrijd() {
    const w = document.querySelector('.wedstrijd-widget');
    if (!w) return;
    try {
      const s = typeof instellingen === 'function' ? instellingen() : {};
      const m = s.wedstrijd || {};
      if (!m || !m.datum) { w.querySelector('.widget-sub').textContent = 'Geen wedstrijd ingesteld'; return; }
      w.innerHTML = `<h2 class="widget-kop">${m.datum === vandaag() ? 'Matchday' : 'Volgende wedstrijd'}</h2><p class="groot-getal">${mooieDatum(m.datum)}</p><p class="widget-sub">${m.tijd || ''} ${m.tegenstander || ''}</p>`;
    } catch (e) { w.querySelector('.widget-sub').textContent = 'Fout bij laden wedstrijd.'; }
  },

  async weer() {
    const w = document.querySelector('.weer-widget');
    if (!w) return;
    try {
      if (!window.Weer || !Weer.haal) { w.querySelector('.widget-sub').textContent = 'Weer module niet geladen.'; return; }
      const d = await Weer.haal();
      if (!d || !d.current) { w.querySelector('.widget-sub').textContent = 'Geen verbinding.'; return; }
      const b = Weer.beschrijf(d.current.weather_code);
      w.innerHTML = `<h2 class="widget-kop">Weer</h2><div style="display:flex;align-items:center;gap:14px"><div class="groot-getal">${Math.round(d.current.temperature_2m)}°</div><div class="widget-sub">${b.tekst}</div></div>`;
    } catch (e) { w.querySelector('.widget-sub').textContent = 'Fout bij ophalen weer.'; }
  }
};

// registreer Home als app (staat niet in dock)
if (Prive && Prive.registreer) Prive.registreer({ id: 'home', naam: 'Home', inDock: false, start() { Prive.sluit(); } });
