/* AGENDA: je Google Agenda in Privé.
   Dat werkt met de "insluitcode" van Google Agenda. Je hoeft geen moeilijke koppeling te maken.
   Is je agenda privé? Dan zie alleen JIJ hem, als je in die browser bent ingelogd bij Google.
   Anderen die je site openen zien dan niks van je afspraken. */

const Agenda = {
  weergave: 'WEEK',

  /* uit de geplakte code de link halen. Je mag de hele <iframe ...> plakken of alleen de link */
  haalLink(tekst) {
    const m = String(tekst).match(/https:\/\/calendar\.google\.com\/calendar\/(?:u\/\d+\/)?embed\?[^"'\s<>]+/);
    return m ? m[0].replace(/&amp;/g, '&') : null;
  },

  /* de weergave (week, maand of lijst) in de link zetten */
  linkMet(weergave) {
    const url = new URL(instellingen().agendaLink);
    url.searchParams.set('mode', weergave);
    url.searchParams.set('showPrint', '0');
    url.searchParams.set('showTitle', '0');
    return url.toString();
  },

  teken(body) {
    const link = instellingen().agendaLink;

    if (!link) {
      body.innerHTML = `
        <div class="uitleg-kaart glas-vlak">
          <h3>Koppel je Google Agenda</h3>
          <ol class="stappen">
            <li>Open <a href="https://calendar.google.com/calendar/r/settings" target="_blank" rel="noopener">Google Agenda instellingen</a> op een computer.</li>
            <li>Klik links bij <b>Instellingen voor mijn agenda's</b> op je agenda.</li>
            <li>Scroll naar <b>Agenda integreren</b> en kopieer de <b>Insluitcode</b>.</li>
            <li>Plak hem hieronder en klik op Koppelen.</li>
          </ol>
          <form class="rij-form">
            <input name="code" placeholder="Plak hier de insluitcode" required>
            <button class="knop blauw" type="submit">Koppelen</button>
          </form>
          <p class="fout"></p>
        </div>`;
      body.querySelector('form').addEventListener('submit', e => {
        e.preventDefault();
        const gevonden = this.haalLink(e.target.code.value);
        if (!gevonden) { body.querySelector('.fout').textContent = 'Dat is geen insluitcode van Google Agenda. Kopieer het stuk dat begint met <iframe.'; return; }
        bewaarInstelling('agendaLink', gevonden);
        Eiland.melding('Agenda gekoppeld', 'Google Agenda staat nu in Privé', '📅');
        this.teken(body);
      });
      return;
    }

    body.innerHTML = `
      <div class="balk-rij">
        <div class="segment">
          ${[['WEEK', 'Week'], ['MONTH', 'Maand'], ['AGENDA', 'Lijst']].map(([k, n]) => `<button type="button" data-w="${k}" class="${this.weergave === k ? 'aan' : ''}">${n}</button>`).join('')}
        </div>
        <a class="knop blauw" href="https://calendar.google.com/calendar/r/eventedit" target="_blank" rel="noopener">+ Afspraak</a>
      </div>
      <div class="agenda-vak"><iframe src="${veilig(this.linkMet(this.weergave))}" title="Google Agenda"></iframe></div>
      <p class="klein">Zie je niks? Log dan in deze browser in bij Google met het account van je agenda.</p>`;

    body.querySelectorAll('[data-w]').forEach(b => b.addEventListener('click', () => {
      this.weergave = b.dataset.w;
      this.teken(body);
    }));
  }
};

Prive.registreer({
  id: 'agenda',
  naam: 'Agenda',
  kleur: '#ffffff',
  // het icoon laat de datum van vandaag zien, net als op een iPhone
  icoon() {
    const nu = new Date();
    return `<svg viewBox="0 0 24 24"><text x="12" y="8.2" text-anchor="middle" font-size="4.6" font-weight="700" fill="#FF3B30" font-family="Inter, -apple-system, sans-serif">${DAGEN[nu.getDay()].slice(0, 2).toUpperCase()}</text><text x="12" y="19.5" text-anchor="middle" font-size="11.5" font-weight="500" fill="#1c1c1e" font-family="Inter, -apple-system, sans-serif">${nu.getDate()}</text></svg>`;
  },
  maak(body) { Agenda.teken(body); }
});