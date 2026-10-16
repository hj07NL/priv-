/* ACHTERGROND
   Standaard: zacht bewegend gekleurd licht (aurora).
   Staat "Weer-achtergrond" aan in Instellingen? Dan zie je de lucht van NU:
   - de kleur hangt af van de tijd: nacht, ochtend, dag of avond (met de echte zonsopkomst en -ondergang)
   - regen, sneeuw, wolken, sterren of onweer volgens het echte weer
   De lucht-kleuren staan in de CSS bij [data-lucht], de deeltjes (regen, sneeuw, sterren) worden hier op een canvas getekend. */

const Achtergrond = {
  deeltjes: [],
  soort: null,
  bezig: false,

  async werkBij() {
    const s = instellingen();
    const body = document.body;

    if (!s.weerAchtergrond) {                      // instelling uit: gewoon de aurora
      body.removeAttribute('data-lucht');
      body.removeAttribute('data-weer');
      this.zetDeeltjes(null);
      return;
    }

    const weer = await Weer.haal();
    body.dataset.lucht = this.dagdeel(weer);
    const soort = weer ? Weer.beschrijf(weer.current.weather_code).soort : 'zon';
    body.dataset.weer = soort;

    // welke deeltjes moeten er vallen of twinkelen?
    if (soort === 'regen' || soort === 'onweer') this.zetDeeltjes('regen');
    else if (soort === 'sneeuw') this.zetDeeltjes('sneeuw');
    else if (body.dataset.lucht === 'nacht' && (soort === 'zon' || soort === 'halfbewolkt')) this.zetDeeltjes('sterren');
    else this.zetDeeltjes(null);
  },

  /* welk deel van de dag is het? */
  dagdeel(weer) {
    const nu = new Date();
    let op, onder;
    if (weer && weer.daily) {
      op = new Date(weer.daily.sunrise[0]);
      onder = new Date(weer.daily.sunset[0]);
    } else {                                          // geen weer bekend: schatting
      op = new Date(); op.setHours(7, 30, 0);
      onder = new Date(); onder.setHours(18, 30, 0);
    }
    const uur = 60 * 60000;
    if (nu < op - uur / 2 || nu > onder.getTime() + uur) return 'nacht';
    if (nu < op.getTime() + uur) return 'ochtend';
    if (nu > onder - uur) return 'avond';
    return 'dag';
  },

  /* ---------- deeltjes op het canvas ---------- */
  zetDeeltjes(soort) {
    const canvas = document.getElementById('weer-canvas');
    const ctx = canvas.getContext('2d');
    this.soort = soort;
    this.maakDeeltjes();
    if (!soort) { ctx.clearRect(0, 0, canvas.width, canvas.height); return; }
    if (!this.bezig) { this.bezig = true; requestAnimationFrame(() => this.teken()); }
  },

  maakDeeltjes() {
    const canvas = document.getElementById('weer-canvas');
    canvas.width = innerWidth * devicePixelRatio;     // scherp op een retina-scherm
    canvas.height = innerHeight * devicePixelRatio;
    const w = canvas.width, h = canvas.height;
    const aantal = { regen: 220, sneeuw: 140, sterren: 180 }[this.soort] || 0;
    this.deeltjes = Array.from({ length: aantal }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      snelheid: this.soort === 'regen' ? 14 + Math.random() * 10 : 0.6 + Math.random() * 1.4,
      grootte: Math.random(),
      fase: Math.random() * Math.PI * 2
    }));
  },

  teken() {
    const canvas = document.getElementById('weer-canvas');
    const ctx = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height, r = devicePixelRatio;
    ctx.clearRect(0, 0, w, h);
    if (!this.soort) { this.bezig = false; return; }

    // wil iemand geen beweging (instelling van het apparaat)? Dan teken ik 1 stilstaand beeld
    const stil = matchMedia('(prefers-reduced-motion: reduce)').matches;

    this.deeltjes.forEach(d => {
      if (this.soort === 'regen') {
        ctx.strokeStyle = 'rgba(180, 210, 255, 0.35)';
        ctx.lineWidth = 1.2 * r;
        ctx.beginPath(); ctx.moveTo(d.x, d.y); ctx.lineTo(d.x - 3 * r, d.y + 18 * r); ctx.stroke();
        if (!stil) { d.y += d.snelheid * r; d.x -= 1.5 * r; }
      } else if (this.soort === 'sneeuw') {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.beginPath(); ctx.arc(d.x, d.y, (1 + d.grootte * 2.5) * r, 0, Math.PI * 2); ctx.fill();
        if (!stil) { d.y += d.snelheid * r; d.x += Math.sin(d.y / 40 + d.fase) * 0.6 * r; }
      } else if (this.soort === 'sterren') {
        const licht = 0.35 + 0.65 * Math.abs(Math.sin(d.fase + Date.now() / 1400 * (0.3 + d.grootte)));
        ctx.fillStyle = `rgba(255, 255, 255, ${stil ? 0.7 : licht})`;
        ctx.beginPath(); ctx.arc(d.x, d.y * 0.7, (0.4 + d.grootte * 1.2) * r, 0, Math.PI * 2); ctx.fill();
      }
      if (d.y > h) { d.y = -20 * r; d.x = Math.random() * w; }   // onderaan weg? weer bovenaan beginnen
    });

    // bij onweer heel soms een bliksemflits
    if (document.body.dataset.weer === 'onweer' && !stil && Math.random() < 0.004) {
      document.body.classList.add('flits');
      setTimeout(() => document.body.classList.remove('flits'), 120);
    }

    if (stil) { this.bezig = false; return; }
    requestAnimationFrame(() => this.teken());   // volgende beeldje, ongeveer 60 keer per seconde
  }
};

addEventListener('resize', () => { if (Achtergrond.soort) Achtergrond.maakDeeltjes(); });