/* AGENDA: Google Agenda tonen met OAuth-optie.
   Nederlandse commentaar: als je Google gekoppeld hebt (Auth/PKCE) gebruiken we de Google Calendar API.
   Als niet gekoppeld: fallback naar de insluit-iframe zoals vroeger. */

const Agenda = {
  weergave: 'WEEK',
  geselecteerdeCalendarId: null,
  calendars: [],

  haalLink(tekst) {
    const m = String(tekst).match(/https:\/\/calendar\.google\.com\/calendar\/(?:u\/\d+\/)?embed\?[^"'\s<>]+/);
    return m ? m[0].replace(/&amp;/g, '&') : null;
  },

  linkMet(weergave) {
    const url = new URL(instellingen().agendaLink);
    url.searchParams.set('mode', weergave);
    url.searchParams.set('showPrint', '0');
    url.searchParams.set('showTitle', '0');
    return url.toString();
  },

  /* helpers om datum/tijd leesbaar te maken */
  leesDatumTijd(iso) {
    try {
      const d = new Date(iso);
      const dag = mooieDatum(datumTekst(d));
      const tijd = d.getHours() || d.getMinutes() ? ' ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0') : '';
      return dag + tijd;
    } catch (e) { return iso; }
  },

  async haalCalendars() {
    try {
      const res = await Auth.fetchGoogle('https://www.googleapis.com/calendar/v3/users/me/calendarList');
      this.calendars = (res.items || []).map(c => ({ id: c.id, naam: c.summary, achtergrond: c.backgroundColor || '#333' }));
      if (!this.geselecteerdeCalendarId) {
        const prim = this.calendars.find(c => c.id && c.id.includes('primary')) || this.calendars[0];
        this.geselecteerdeCalendarId = prim ? prim.id : null;
      }
    } catch (e) {
      console.warn('Calendars ophalen mislukt', e);
      this.calendars = [];
      this.geselecteerdeCalendarId = null;
    }
  },

  async haalEvents(calendarId, dagen = 7) {
    if (!calendarId) return [];
    const nu = new Date();
    const einde = new Date(nu.getTime() + dagen * 24 * 60 * 60 * 1000);
    const timeMin = nu.toISOString();
    const timeMax = einde.toISOString();
    const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?singleEvents=true&orderBy=startTime&timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}&maxResults=50`;
    try {
      const res = await Auth.fetchGoogle(url);
      return res.items || [];
    } catch (e) {
      console.warn('Events ophalen mislukt', e);
      return [];
    }
  },

  async teken(body) {
    const link = instellingen().agendaLink;
    const heeftGoogleAuth = !!Opslag.lees('auth_google');

    if (heeftGoogleAuth) {
      body.innerHTML = '<div class="uitleg-kaart glas-vlak"><h3>Agenda laden…</h3></div>';
      await this.haalCalendars();
      const kalenderOpties = this.calendars.map(c => `<option value="${veilig(c.id)}"${c.id === this.geselecteerdeCalendarId ? ' selected' : ''}>${veilig(c.naam)}</option>`).join('') || '<option>Geen agenda\'s gevonden</option>';
      body.innerHTML = `
        <div class="balk-rij">
          <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;">
            <select name="kalender">${kalenderOpties}</select>
            <div class="segment">
              ${[['7', '7 dagen'], ['30', '30 dagen']].map(([d, n]) => `<button type="button" data-days="${d}" class="${d === '7' ? 'aan' : ''}">${n}</button>`).join('')}
            </div>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <button class="knop blauw" data-actie="nieuw">+ Afspraak</button>
            <button class="knop" data-actie="ontkoppel">Ontkoppel Google</button>
          </div>
        </div>
        <div class="agenda-vak glas-vlak" style="padding:12px;">
          <div class="fout klein" style="margin-bottom:8px;"></div>
          <ul class="agenda-events" style="list-style:none;padding:0;margin:0;"></ul>
        </div>`;

      const select = body.querySelector('[name="kalender"]');
      const knopNieuw = body.querySelector('[data-actie="nieuw"]');
      const knopOntkoppel = body.querySelector('[data-actie="ontkoppel"]');

      select.addEventListener('change', () => {
        this.geselecteerdeCalendarId = select.value;
        this.verversEvents(body, 7);
      });
      knopNieuw.addEventListener('click', () => window.open('https://calendar.google.com/calendar/r/eventedit', '_blank', 'noopener'));
      knopOntkoppel.addEventListener('click', () => {
        Auth.ontkoppel('google');
        Eiland.melding('Google ontkoppeld', '', '✓');
        this.teken(body);
      });

      body.querySelectorAll('[data-days]').forEach(b => b.addEventListener('click', () => {
        const dagen = b.dataset.days;
        body.querySelectorAll('[data-days]').forEach(x => x.classList.remove('aan'));
        b.classList.add('aan');
        this.verversEvents(body, Number(dagen));
      }));

      await this.verversEvents(body, 7);
      return;
    }

    if (!link) {
      body.innerHTML = `
        <div class="uitleg-kaart glas-vlak">
          <h3>Koppel je Google Agenda</h3>
          <ol class="stappen">
            <li>Open <a href="https://calendar.google.com/calendar/r/settings" target="_blank" rel="noopener">Google Agenda instellingen</a>.</li>
            <li>Klik bij <b>Instellingen voor mijn agenda's</b> op je agenda, dan <b>Agenda integreren</b>.</li>
            <li>Kopieer de <b>Insluitcode</b> en plak hier.</li>
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
  },

  async verversEvents(body, dagen) {
    const foutVak = body.querySelector('.fout');
    const lijstVak = body.querySelector('.agenda-events');
    if (!lijstVak) return;
    foutVak.textContent = 'Laden…';
    lijstVak.innerHTML = '';
    try {
      const events = await this.haalEvents(this.geselecteerdeCalendarId, dagen);
      if (!events.length) {
        lijstVak.innerHTML = '<li class="leeg">Geen afspraken in de komende dagen</li>';
        foutVak.textContent = '';
        return;
      }
      const items = events.map(ev => {
        const start = ev.start?.dateTime || ev.start?.date;
        const tijdTekst = start ? this.leesDatumTijd(start) : '';
        const samenv = veilig(ev.summary || '(Geen titel)');
        return `<li style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,.06)"><div style="font-weight:600">${samenv}</div><div class="klein" style="color:var(--zacht)">${tijdTekst}${ev.location ? ' · ' + veilig(ev.location) : ''}</div></li>`;
      }).join('');
      lijstVak.innerHTML = items;
      foutVak.textContent = '';
    } catch (e) {
      foutVak.textContent = 'Fout bij laden van afspraken.';
      console.warn(e);
    }
  }
};

privé.registreer({
  id: 'agenda',
  naam: 'Agenda',
  kleur: '#ffffff',
  icoon() {
    const nu = new Date();
    const dagNum = String(nu.getDate()).padStart(2, '0');
    return `<svg viewBox="0 0 24 24"><text x="12" y="16" text-anchor="middle" font-size="10" font-weight="700" fill="#fff" font-family="Inter, -apple-system, sans-serif">${dagNum}</text></svg>`;
  },
  maak(body) { Agenda.teken(body); }
});
