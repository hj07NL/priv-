/* PLANNER: taken en huiswerk plannen, in de stijl van Apple Herinneringen.
   Een taak ziet er in de opslag zo uit:
   { id: 'abc', titel: 'Wiskunde H3 leren', datum: '2026-10-16', tijd: '15:00', lijst: 'School', klaar: false } */

const LIJSTEN = {                      // de lijsten met hun kleur
  School: '#0A84FF',
  Hockey: '#FF9F0A',
  Privé: '#BF5AF2'
};

const Planner = {
  /* ---------- de gegevens ---------- */
  taken() { return Opslag.lees('taken', []); },

  bewaar(lijst) {
    Opslag.schrijf('taken', lijst);
    Prive.zend('taken');                 // widgets en het eiland werken zich bij
  },

  voegToe(taak) {
    const nieuw = { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), klaar: false, lijst: 'School', tijd: '', ...taak };
    this.bewaar([...this.taken(), nieuw]);
    return nieuw;
  },

  wijzig(id, veranderingen) {
    this.bewaar(this.taken().map(t => t.id === id ? { ...t, ...veranderingen } : t));
  },

  verwijder(id) {
    this.bewaar(this.taken().filter(t => t.id !== id));
  },

  /* gesorteerd op datum en tijd. Taken zonder tijd komen eerst op een dag */
  gesorteerd(lijst) {
    return lijst.slice().sort((a, b) => (a.datum + (a.tijd || '00:00')).localeCompare(b.datum + (b.tijd || '00:00')));
  },

  takenOp(datum) {
    return this.gesorteerd(this.taken().filter(t => t.datum === datum && !t.klaar));
  },

  volgendeTaak() {
    return this.gesorteerd(this.taken().filter(t => !t.klaar && t.datum >= vandaag()))[0] || null;
  },

  /* ---------- het scherm ---------- */
  filter: 'vandaag',

  teken(body) {
    const filters = [['vandaag', 'Vandaag'], ['morgen', 'Morgen'], ['week', 'Komende week'], ['alles', 'Alles'], ['klaar', 'Klaar']];
    body.innerHTML = `
      <form class="planner-nieuw glas-vlak">
        <input name="titel" placeholder="Nieuwe taak, bv. Engels woordjes H4" required autocomplete="off">
        <input name="datum" type="date" value="${vandaag()}" required>
        <input name="tijd" type="time" aria-label="Tijd (mag leeg)">
        <select name="lijst">${Object.keys(LIJSTEN).map(l => `<option>${l}</option>`).join('')}</select>
        <button class="knop blauw" type="submit">Toevoegen</button>
      </form>
      <div class="segment">${filters.map(([k, n]) => `<button type="button" data-f="${k}" class="${this.filter === k ? 'aan' : ''}">${n}</button>`).join('')}</div>
      <div class="planner-lijst"></div>`;

    // een taak toevoegen met het formulier
    body.querySelector('form').addEventListener('submit', e => {
      e.preventDefault();                                   // anders herlaadt de pagina
      const f = new FormData(e.target);
      const taak = this.voegToe({ titel: f.get('titel').trim(), datum: f.get('datum'), tijd: f.get('tijd'), lijst: f.get('lijst') });
      Eiland.melding('Taak toegevoegd', taak.titel + ' · ' + mooieDatum(taak.datum), '☑');
      e.target.titel.value = '';
      this.tekenLijst(body);
    });

    // de filterknoppen
    body.querySelectorAll('.segment button').forEach(b => b.addEventListener('click', () => {
      this.filter = b.dataset.f;
      body.querySelectorAll('.segment button').forEach(x => x.classList.toggle('aan', x === b));
      this.tekenLijst(body);
    }));

    this.tekenLijst(body);
  },

  tekenLijst(body) {
    const doos = body.querySelector('.planner-lijst');
    let lijst = this.taken();
    const v = vandaag();
    if (this.filter === 'vandaag') lijst = lijst.filter(t => !t.klaar && t.datum <= v);   // te laat telt ook als vandaag
    if (this.filter === 'morgen') lijst = lijst.filter(t => !t.klaar && t.datum === plusDagen(1));
    if (this.filter === 'week') lijst = lijst.filter(t => !t.klaar && t.datum >= v && t.datum <= plusDagen(7));
    if (this.filter === 'alles') lijst = lijst.filter(t => !t.klaar);
    if (this.filter === 'klaar') lijst = lijst.filter(t => t.klaar);
    lijst = this.gesorteerd(lijst);

    if (!lijst.length) {
      doos.innerHTML = `<p class="leeg">Niks hier. ${this.filter === 'klaar' ? '' : 'Typ hierboven een taak, of zeg tegen Siri: "plan Engels leren morgen om 4 uur".'}</p>`;
      return;
    }

    // taken per dag groeperen
    const perDag = {};
    lijst.forEach(t => (perDag[t.datum] = perDag[t.datum] || []).push(t));

    doos.innerHTML = Object.entries(perDag).map(([datum, taken]) => `
      <h3 class="dag-kop ${datum < v && this.filter !== 'klaar' ? 'te-laat' : ''}">${mooieDatum(datum)}${datum < v && this.filter !== 'klaar' ? ' · te laat' : ''}</h3>
      <ul class="taken">
        ${taken.map(t => `
          <li class="taak ${t.klaar ? 'is-klaar' : ''}" data-id="${t.id}">
            <button class="vinkje" type="button" style="--kleur:${LIJSTEN[t.lijst] || '#0A84FF'}" aria-label="Klaar"></button>
            <span class="taak-tekst">${veilig(t.titel)}<small>${t.tijd ? t.tijd + ' · ' : ''}${veilig(t.lijst)}</small></span>
            <a class="mini-knop" href="${googleAgendaLink(t.titel, t.datum, t.tijd)}" target="_blank" rel="noopener" title="Zet in Google Agenda">+ Agenda</a>
            <button class="mini-knop weg" type="button" title="Verwijderen" aria-label="Verwijderen">✕</button>
          </li>`).join('')}
      </ul>`).join('');

    // klikken op het rondje = klaar (of weer niet klaar)
    doos.querySelectorAll('.vinkje').forEach(b => b.addEventListener('click', () => {
      const li = b.closest('.taak');
      const t = this.taken().find(x => x.id === li.dataset.id);
      li.classList.add('afvinken');                           // eerst even de animatie laten zien
      setTimeout(() => { this.wijzig(t.id, { klaar: !t.klaar }); this.tekenLijst(body); }, 350);
    }));
    doos.querySelectorAll('.weg').forEach(b => b.addEventListener('click', () => {
      this.verwijder(b.closest('.taak').dataset.id);
      this.tekenLijst(body);
    }));
  }
};

Prive.registreer({
  id: 'planner',
  naam: 'Planner',
  kleur: 'linear-gradient(160deg, #FF9F0A, #FF6B00)',
  icoon: '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"><circle cx="5" cy="6.5" r="1.6" fill="#fff" stroke="none"/><circle cx="5" cy="12" r="1.6" fill="#fff" stroke="none"/><circle cx="5" cy="17.5" r="1.6" fill="#fff" stroke="none"/><path d="M9.5 6.5h10M9.5 12h10M9.5 17.5h7"/></svg>',
  maak(body) { Planner.teken(body); }
});
