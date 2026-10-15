/* DYNAMIC ISLAND
   Het zwarte pilletje bovenin, net als op een iPhone. Het kan:
   - een melding laten zien      Eiland.melding('Taak toegevoegd', 'Wiskunde leren', '✓')
   - een timer laten aftellen    Eiland.timer(300, 'Pasta')
   - laten zien dat Siri luistert Eiland.siri(true)
   - je waarschuwen 10 minuten voor een taak met een tijd
   Het wisselen tussen de vormen gebeurt met CSS-classes, de animatie zit in de CSS. */

const Eiland = {
  timerEinde: null,
  timerLabel: '',
  timerKlok: null,
  meldingKlok: null,
  luistert: false,

  get knop() { return document.getElementById('eiland'); },

  /* vorm kiezen: 'rust', 'breed', 'groot' of 'siri' */
  vorm(naam) {
    this.knop.className = naam;
  },

  vul(links, midden, rechts) {
    this.knop.querySelector('.eiland-links').innerHTML = links || '';
    this.knop.querySelector('.eiland-midden').innerHTML = midden || '';
    this.knop.querySelector('.eiland-rechts').innerHTML = rechts || '';
  },

  /* terug naar de rustvorm, of naar de timer als die nog loopt */
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

  /* ---------- timer ---------- */
  timer(seconden, label = 'Timer') {
    this.timerEinde = Date.now() + seconden * 1000;
    this.timerLabel = label;
    clearInterval(this.timerKlok);
    this.timerKlok = setInterval(() => this.tik(), 250);
    this.toonTimer();
  },

  stopTimer() {
    clearInterval(this.timerKlok);
    this.timerEinde = null;
    this.rust();
  },

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

  /* ---------- Siri ---------- */
  siri(aan) {
    this.luistert = aan;
    if (!aan) return this.rust();
    this.vorm('siri');
    this.vul('<span class="mini-bol"></span>', '', '<span class="golf"><i></i><i></i><i></i><i></i><i></i></span>');
  },

  /* klik op het eiland: timer stoppen, of je volgende taak laten zien */
  klik() {
    if (this.timerEinde) {
      if (confirm('Timer "' + this.timerLabel + '" stoppen?')) this.stopTimer();
      return;
    }
    const volgende = Planner.volgendeTaak();
    if (volgende) this.melding('Volgende taak', volgende.titel + ' · ' + mooieDatum(volgende.datum) + (volgende.tijd ? ' ' + volgende.tijd : ''), '☑');
    else this.melding('Niks gepland', 'Je planner is leeg', '☑');
  },

  /* elke 30 seconden kijken of er over 10 minuten een taak begint */
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
