/* HOME: de widgets op het beginscherm. */
const Home = {
  teken() {
    const b = document.getElementById('bureaublad');
    if (!b) return;

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
        <div class="widget-kop-row">
          <h2 class="widget-kop">Weer</h2>
          <span class="widget-chip">Live</span>
        </div>
        <p class="widget-sub">Loading…</p>
      </section>

      <section class="widget glas taken-widget" data-app="planner">
        <div class="widget-kop-row">
          <h2 class="widget-kop">Vandaag</h2>
          <span class="widget-chip">Taak</span>
        </div>
        <p class="widget-sub">Taken laden…</p>
      </section>

      <section class="widget glas wedstrijd-widget" data-app="instellingen">
        <div class="widget-kop-row">
          <h2 class="widget-kop">Wedstrijd</h2>
          <span class="widget-chip">Sport</span>
        </div>
        <p class="widget-sub">Geen wedstrijd ingesteld</p>
      </section>

      <section class="widget glas websites-widget" data-app="websites">
        <div class="widget-kop-row">
          <h2 class="widget-kop">Websites</h2>
          <span class="widget-chip">Favorieten</span>
        </div>
        <p class="widget-sub">Geen websites gevonden</p>
      </section>
    `;

    b.querySelectorAll('.widget').forEach(w => w.addEventListener('click', e => {
      if (e.target.closest('a, button')) return;
      const app = w.dataset.app;
      if (app && Prive && Prive.start) Prive.start(app);
    }));

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
    el.textContent = String(nu.getHours()).padStart(2, '0') + ':' + String(nu.getMinutes()).padStart(2, '0');
    elDatum.textContent = DAGEN[nu.getDay()] + ' ' + nu.getDate() + ' ' + MAANDEN[nu.getMonth()];
  },

  taken() {
    const w = document.querySelector('.taken-widget');
    if (!w) return;
    try {
      if (window.Planner && Planner.taken) {
        const lijst = (Planner.gesorteerd && Planner.gesorteerd(Planner.taken())) || Planner.taken();
        if (!lijst || lijst.length === 0) {
          w.innerHTML = `
            <div class="widget-kop-row"><h2 class="widget-kop">Vandaag</h2><span class="widget-chip">Taak</span></div>
            <p class="widget-sub">Niks meer te doen vandaag.</p>`;
          return;
        }

        const eerste = lijst.slice(0, 3).map(t => `<li>${veilig(t.titel)}</li>`).join('');
        w.innerHTML = `
          <div class="widget-kop-row">
            <h2 class="widget-kop">Vandaag</h2>
            <span class="widget-chip">${lijst.length}</span>
          </div>
          <ul class="widget-list">${eerste}</ul>`;
      } else {
        w.querySelector('.widget-sub').textContent = 'Planner niet beschikbaar.';
      }
    } catch (e) {
      w.querySelector('.widget-sub').textContent = 'Fout bij laden taken.';
    }
  },

  websites() {
    const w = document.querySelector('.websites-widget');
    if (!w) return;
    try {
      if (window.Websites && Websites.lijst) {
        const lijst = Websites.lijst() || [];
        const top = lijst[0] ? veilig(lijst[0].naam || '?') : 'Geen';
        w.innerHTML = `
          <div class="widget-kop-row"><h2 class="widget-kop">Websites</h2><span class="widget-chip">${lijst.length}</span></div>
          <p class="groot-getal">${lijst.length}</p>
          <p class="widget-sub">${lijst.length ? 'Top: ' + top : 'Nog geen websites opgeslagen.'}</p>`;
      } else {
        w.querySelector('.widget-sub').textContent = 'Websites module niet geladen.';
      }
    } catch (e) {
      w.querySelector('.widget-sub').textContent = 'Fout bij laden websites.';
    }
  },

  wedstrijd() {
    const w = document.querySelector('.wedstrijd-widget');
    if (!w) return;
    try {
      const s = typeof instellingen === 'function' ? instellingen() : {};
      const m = s.wedstrijd || {};
      if (!m || !m.datum) {
        w.querySelector('.widget-sub').textContent = 'Geen wedstrijd ingesteld';
        return;
      }

      const dag = m.datum === vandaag() ? 'Matchday' : 'Volgende wedstrijd';
      const tijd = m.tijd ? ' · ' + m.tijd : '';
      w.innerHTML = `
        <div class="widget-kop-row"><h2 class="widget-kop">${dag}</h2><span class="widget-chip">Hockey</span></div>
        <p class="groot-getal">${mooieDatum(m.datum)}</p>
        <p class="widget-sub">${veilig(m.tegenstander || 'Wedstrijd')} ${tijd}</p>`;
    } catch (e) {
      w.querySelector('.widget-sub').textContent = 'Fout bij laden wedstrijd.';
    }
  },

  async weer() {
    const w = document.querySelector('.weer-widget');
    if (!w) return;
    try {
      if (!window.Weer || !Weer.haal) {
        w.querySelector('.widget-sub').textContent = 'Weer module niet geladen.';
        return;
      }
      const d = await Weer.haal();
      if (!d || !d.current) {
        w.querySelector('.widget-sub').textContent = 'Geen verbinding.';
        return;
      }
      const b = Weer.beschrijf(d.current.weather_code);
      w.innerHTML = `
        <div class="widget-kop-row"><h2 class="widget-kop">Weer</h2><span class="widget-chip">${b}</span></div>
        <div class="widget-metriek">
          <span class="groot-getal">${Math.round(d.current.temperature_2m)}°</span>
        </div>
        <p class="widget-sub">${b} · ${Math.round(d.current.wind_speed_10m)} km/u</p>`;
    } catch (e) {
      w.querySelector('.widget-sub').textContent = 'Fout bij ophalen weer.';
    }
  }
};

if (Prive && Prive.registreer) {
  Prive.registreer({ id: 'home', naam: 'Home', inDock: false, start() { Prive.sluit(); } });
}
