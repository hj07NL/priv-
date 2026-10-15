/* INSTELLINGEN: zoals de Instellingen-app op een iPhone, met groepjes en schakelaars. */

const Instellingen = {
  teken(body) {
    const s = instellingen();
    const m = s.wedstrijd;
    body.innerHTML = `
      <div class="inst-groep">
        <h3>Jij</h3>
        <label class="inst-rij">Naam <input name="naam" value="${veilig(s.naam)}"></label>
      </div>

      <div class="inst-groep">
        <h3>Weer</h3>
        <form class="inst-rij plaats-form">
          <span>Plaats</span>
          <input name="plaats" value="${veilig(s.plaats)}" placeholder="bv. Leiden">
          <button class="knop" type="submit">Zoek</button>
          <button class="knop" type="button" data-actie="locatie">Mijn locatie</button>
        </form>
        <label class="inst-rij schakel-rij">
          <span>Weer-achtergrond<small>De achtergrond laat het echte weer en de tijd van de dag zien</small></span>
          <input type="checkbox" class="schakelaar" name="weerAchtergrond" ${s.weerAchtergrond ? 'checked' : ''}>
        </label>
      </div>
      <p class="inst-melding"></p>

      <div class="inst-groep">
        <h3>Volgende hockeywedstrijd</h3>
        <label class="inst-rij">Datum <input type="date" name="w-datum" value="${m.datum}"></label>
        <label class="inst-rij">Tijd <input type="time" name="w-tijd" value="${m.tijd}"></label>
        <label class="inst-rij">Tegenstander <input name="w-tegen" value="${veilig(m.tegenstander)}" placeholder="bv. HC Rotterdam"></label>
        <label class="inst-rij schakel-rij"><span>Thuiswedstrijd</span><input type="checkbox" class="schakelaar" name="w-thuis" ${m.thuis ? 'checked' : ''}></label>
      </div>

      <div class="inst-groep">
        <h3>Siri</h3>
        <label class="inst-rij schakel-rij"><span>Hardop antwoorden</span><input type="checkbox" class="schakelaar" name="siriPraat" ${s.siriPraat ? 'checked' : ''}></label>
      </div>

      <div class="inst-groep">
        <h3>Agenda</h3>
        <div class="inst-rij"><span>${s.agendaLink ? 'Google Agenda is gekoppeld' : 'Nog niet gekoppeld'}</span>
          ${s.agendaLink ? '<button class="knop rood-tekst" type="button" data-actie="ontkoppel">Ontkoppel</button>' : '<button class="knop" type="button" data-actie="agenda">Koppelen</button>'}
        </div>
      </div>

      <div class="inst-groep">
        <h3>Als app installeren</h3>
        <p class="inst-tekst"><b>iPhone:</b> open je site in Safari, tik op het deel-icoon en kies <i>Zet op beginscherm</i>.<br>
           <b>Computer (Chrome/Edge):</b> klik rechts in de adresbalk op het installeer-icoon.</p>
      </div>

      <div class="inst-groep">
        <h3>Back-up</h3>
        <p class="inst-tekst">Je taken en instellingen staan alleen op dit apparaat. Met een back-up zet je ze op een ander apparaat.</p>
        <div class="inst-rij">
          <button class="knop" type="button" data-actie="export">Back-up downloaden</button>
          <label class="knop">Back-up terugzetten<input type="file" accept=".json" hidden data-actie="import"></label>
        </div>
      </div>`;

    // gewone tekstvakjes en schakelaars: meteen opslaan als je iets verandert
    body.querySelector('[name="naam"]').addEventListener('change', e => bewaarInstelling('naam', e.target.value.trim() || 'jij'));
    body.querySelector('[name="weerAchtergrond"]').addEventListener('change', e => bewaarInstelling('weerAchtergrond', e.target.checked));
    body.querySelector('[name="siriPraat"]').addEventListener('change', e => bewaarInstelling('siriPraat', e.target.checked));

    // de wedstrijd: alle 4 vakjes samen opslaan
    const bewaarWedstrijd = () => bewaarInstelling('wedstrijd', {
      datum: body.querySelector('[name="w-datum"]').value,
      tijd: body.querySelector('[name="w-tijd"]').value,
      tegenstander: body.querySelector('[name="w-tegen"]').value.trim(),
      thuis: body.querySelector('[name="w-thuis"]').checked
    });
    ['w-datum', 'w-tijd', 'w-tegen', 'w-thuis'].forEach(n => body.querySelector(`[name="${n}"]`).addEventListener('change', bewaarWedstrijd));

    // plaats zoeken of je locatie gebruiken
    const melding = body.querySelector('.inst-melding');
    const zetPlaats = p => {
      const nu = instellingen();
      Opslag.schrijf('instellingen', { ...nu, plaats: p.naam, lat: p.lat, lon: p.lon });
      Weer.data = null;
      priv-.zend('instellingen');
      body.querySelector('[name="plaats"]').value = p.naam;
      melding.textContent = 'Weer staat nu op ' + p.naam + '.';
    };
    body.querySelector('.plaats-form').addEventListener('submit', async e => {
      e.preventDefault();
      melding.textContent = 'Zoeken…';
      try {
        const p = await Weer.zoekPlaats(e.target.plaats.value);
        if (!p) { melding.textContent = 'Die plaats kan ik niet vinden.'; return; }
        zetPlaats(p);
      } catch (err) { melding.textContent = 'Geen verbinding.'; }
    });
    body.querySelector('[data-actie="locatie"]').addEventListener('click', async () => {
      melding.textContent = 'Locatie bepalen…';
      try { zetPlaats(await Weer.mijnLocatie()); } catch (err) { melding.textContent = err.message; }
    });

    // agenda
    const ontkoppel = body.querySelector('[data-actie="ontkoppel"]');
    if (ontkoppel) ontkoppel.addEventListener('click', () => { bewaarInstelling('agendaLink', ''); this.teken(body); });
    const koppel = body.querySelector('[data-actie="agenda"]');
    if (koppel) koppel.addEventListener('click', () => priv-.start('agenda'));

    // back-up downloaden als .json-bestand
    body.querySelector('[data-actie="export"]').addEventListener('click', () => {
      const blob = new Blob([JSON.stringify(Opslag.alles(), null, 2)], { type: 'application/json' });
      const a = el('a', { href: URL.createObjectURL(blob), download: 'priv--backup-' + vandaag() + '.json' });
      a.click();
    });
    // back-up terugzetten
    body.querySelector('[data-actie="import"]').addEventListener('change', async e => {
      const bestand = e.target.files[0];
      if (!bestand) return;
      try {
        Opslag.zetTerug(JSON.parse(await bestand.text()));
        Eiland.melding('Back-up teruggezet', 'Alles staat er weer', '✓');
        priv-.zend('instellingen'); priv-.zend('taken'); priv-.zend('websites');
        this.teken(body);
      } catch (err) { alert('Dit is geen geldige back-up.'); }
    });
  }
};

priv-.registreer({
  id: 'instellingen',
  naam: 'Instellingen',
  kleur: 'linear-gradient(160deg, #AEAEB2, #636366)',
  icoon: '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.7"><circle cx="12" cy="12" r="3.2"/><path d="M12 2.8v2.6M12 18.6v2.6M21.2 12h-2.6M5.4 12H2.8M18.5 5.5l-1.8 1.8M7.3 16.7l-1.8 1.8M18.5 18.5l-1.8-1.8M7.3 7.3L5.5 5.5"/><circle cx="12" cy="12" r="6.6"/></svg>',
  maak(body) { Instellingen.teken(body); }
});
