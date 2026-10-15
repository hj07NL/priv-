/* HOME: de widgets op het beginscherm.
   Elke widget is een glazen kaart. Klik je erop, dan opent de app die erbij hoort.
   De widgets worden opnieuw getekend als er iets verandert (taken, weer of instellingen). */

const Home = {
  teken() {
    const b = document.getElementById('bureaublad');
    b.innerHTML = `
      <section class="widget klok-widget" data-app="planner">
        <p class="groet"></p>
        <p class="klok-tijd"></p>
        <p class="klok-datum"></p>
      </section>
      <section class="widget weer-widget" data-app="instellingen"></section>
      <section class="widget taken-widget" data-app="planner"></section>
      <section class="widget wedstrijd-widget" data-app="instellingen"></section>
      <section class="widget websites-widget" data-app="websites"></section>`;

    // klik op een widget = de app openen (behalve als je op een knop of link in de widget klikt)
    b.querySelectorAll('.widget').forEach(w => w.addEventListener('click', e => {
      if (e.target.closest('a, button')) return;
      priv-.start(w.dataset.app);
    }));

    this.klok();
    this.taken();
    this.websites();
    this.wedstrijd();
    this.weer();
  },

  /* ---------- klok ---------- */
  klok() {
    const nu = new Date();
    const uur = nu.getHours();
    const deel = uur < 6 ? 'Goedenacht' : uur < 12 ? 'Goedemorgen' : uur < 18 ? 'Goedemiddag' : 'Goedenavond';
    const w = document.querySelector('.klok-widget');
    if (!w) return;
    w.querySelector('.groet').textContent = deel + ', ' + instellingen().naam;
    w.querySelector('.klok-tijd').textContent = String(uur).padStart(2, '0') + ':' + String(nu.getMinutes()).padStart(2, '0');
    w.querySelector('.klok-datum').textContent = DAGEN[nu.getDay()] + ' ' + nu.getDate() + ' ' + MAANDEN[nu.getMonth()];
  },

  /* ---------- taken van vandaag ---------- */
  taken() {
    const w = document.querySelector('.taken-widget');
    if (!w) return;
    const lijst = Planner.gesorteerd(Planner.taken().filter(t => !t.klaar && t.datum <= vandaag()));
    w.innerHTML = `
      <h2 class="widget-kop">Vandaag ${lijst.length ? `<span class="teller">${lijst.length}</span>` : ''}</h2>
      ${lijst.length ? `<ul class="mini-taken">${lijst.slice(0, 4).map(t => `
        <li><i style="background:${LIJSTEN[t.lijst] || '#0A84FF'}"></i>${veilig(t.titel)}<small>${t.datum < vandaag() ? 'te laat' : (t.tijd || '')}</small></li>`).join('')}
        </ul>${lijst.length > 4 ? `<p class="meer">en nog ${lijst.length - 4}</p>` : ''}`
      : '<p class="widget-leeg">Niks meer te doen vandaag.</p>'}`;
  },

  /* ---------- websites uit TikTok ---------- */
  websites() {
    const w = document.querySelector('.websites-widget');
    if (!w) return;
    const lijst = Websites.lijst();
    const beste = lijst.slice().sort((a, b) => (b.cijfer || 0) - (a.cijfer || 0))[0];
    w.innerHTML = `
      <h2 class="widget-kop">Websites</h2>
      <p class="groot-getal">${lijst.length}</p>
      <p class="widget-sub">${beste ? 'Hoogste cijfer: ' + veilig(beste.naam) + ' (' + beste.cijfer + ')' : 'Nog geen websites uit TikTok'}</p>`;
  },

  /* ---------- volgende wedstrijd ---------- */
  wedstrijd() {
    const w = document.querySelector('.wedstrijd-widget');
    if (!w) return;
    const m = instellingen().wedstrijd;
    const start = m.datum ? new Date(m.datum + 'T' + (m.tijd || '12:00')) : null;
    document.body.classList.toggle('matchday', !!start && m.datum === vandaag());

    if (!start || start < Date.now() - 2 * 3600000) {
      w.innerHTML = `<h2 class="widget-kop">Hockey</h2><p class="widget-leeg">Zet je volgende wedstrijd in Instellingen, dan tel ik af.</p>`;
      return;
    }
    const over = start - Date.now();
    const dagen = Math.floor(over / 86400000), uren = Math.floor(over / 3600000) % 24, min = Math.floor(over / 60000) % 60;
    const aftellen = over <= 0 ? 'Bezig!' : dagen > 0 ? `${dagen}d ${uren}u` : `${uren}u ${min}m`;

    // als het weer bekend is: het weer op het moment van de wedstrijd
    let weer = '';
    if (Weer.data && Weer.data.hourly) {
      const i = Weer.data.hourly.time.indexOf(m.datum + 'T' + (m.tijd || '12:00').slice(0, 2) + ':00');
      if (i >= 0) {
        const b = Weer.beschrijf(Weer.data.hourly.weather_code[i]);
        const uur = +(m.tijd || '12:00').slice(0, 2);
        weer = `<p class="widget-sub">${Weer.icoon(b.soort, uur >= 7 && uur <= 19)} ${Math.round(Weer.data.hourly.temperature_2m[i])}° · ${b.tekst} · ${Weer.data.hourly.precipitation_probability[i]}% kans op regen</p>`;
      }
    }
    w.innerHTML = `
      <h2 class="widget-kop">${m.datum === vandaag() ? 'Matchday' : 'Volgende wedstrijd'}</h2>
      <p class="groot-getal">${aftellen}</p>
      <p class="widget-sub">${m.thuis ? 'Thuis' : 'Uit'} tegen ${veilig(m.tegenstander || '?')} · ${mooieDatum(m.datum)}${m.tijd ? ' ' + m.tijd : ''}</p>
      ${weer}`;
  },

  /* ---------- weer ---------- */
  async weer() {
    const w = document.querySelector('.weer-widget');
    if (!w) return;
    const s = instellingen();
    if (s.lat === null) {
      w.innerHTML = `<h2 class="widget-kop">Weer</h2><p class="widget-leeg">Stel je plaats in om het weer te zien.</p>`;
      return;
    }
    const d = await Weer.haal();
    if (!d || !d.current) { w.innerHTML = `<h2 class="widget-kop">Weer</h2><p class="widget-leeg">Geen verbinding.</p>`; return; }
    const b = Weer.beschrijf(d.current.weather_code);
    const start = d.hourly.time.findIndex(t => new Date(t) >= new Date(new Date().setMinutes(0, 0, 0)));
    const uren = [1, 2, 3, 4, 5].map(n => start + n).filter(i => i < d.hourly.time.length);
    w.innerHTML = `
      <h2 class="widget-kop">${veilig(s.plaats || 'Weer')}</h2>
      <div class="weer-nu">${Weer.icoon(b.soort, d.current.is_day)}<span class="groot-getal">${Math.round(d.current.temperature_2m)}°</span></div>
      <p class="widget-sub">${b.tekst} · max ${Math.round(d.daily.temperature_2m_max[0])}° min ${Math.round(d.daily.temperature_2m_min[0])}°</p>
      <ol class="weer-uren">${uren.map(i => {
        const u = new Date(d.hourly.time[i]).getHours();
        const ub = Weer.beschrijf(d.hourly.weather_code[i]);
        return `<li><small>${u}u</small>${Weer.icoon(ub.soort, u >= 7 && u <= 19)}<span>${Math.round(d.hourly.temperature_2m[i])}°</span></li>`;
      }).join('')}</ol>`;
  }
};

/* Home staat niet in het dock, het is het bureaublad zelf */
priv-.registreer({ id: 'home', naam: 'Home', inDock: false, start() { priv-.sluit(); } });
