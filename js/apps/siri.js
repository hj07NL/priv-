/* SIRI: een eigen spraakassistent.
   - luisteren: met de Web Speech API (SpeechRecognition). Werkt in Chrome, Edge en Safari, niet in Firefox.
   - terugpraten: met speechSynthesis, de stem die al in je apparaat zit.
   - snappen wat je bedoelt: met "regels". Elke regel kijkt of je zin op iets lijkt (een regex),
     en zo ja, dan doet hij iets. Zelf een commando toevoegen? Zet een nieuwe regel in REGELS hieronder.

   Waarom geen echte AI zoals ChatGPT? Daarvoor heb je een geheime sleutel nodig, en je site is openbaar.
   Iedereen zou die sleutel dan kunnen stelen en op jouw kosten gebruiken. */

const Siri = {
  herkenning: null,
  luistert: false,

  /* ---------- openen en sluiten ---------- */
  start() {
    const laag = document.getElementById('siri-laag');
    if (laag.classList.contains('actief')) return this.luister();
    laag.innerHTML = `
      <div class="siri-rand"></div>
      <div class="siri-paneel">
        <div class="siri-gesprek" aria-live="polite"></div>
        <form class="siri-invoer">
          <input name="vraag" placeholder="Typ of tik op de bol en praat" autocomplete="off">
          <button type="button" class="siri-bol" aria-label="Praat met Siri"><span></span><span></span><span></span></button>
        </form>
      </div>`;
    laag.classList.add('actief');
    document.body.classList.add('siri-open');

    laag.onclick = e => { if (e.target === laag) this.sluit(); };
    laag.querySelector('.siri-bol').addEventListener('click', () => this.luistert ? this.stopLuisteren() : this.luister());
    laag.querySelector('form').addEventListener('submit', e => {
      e.preventDefault();
      const v = e.target.vraag.value.trim();
      if (v) { e.target.vraag.value = ''; this.verwerk(v); }
    });

    if (!this.gesprekGehad) this.antwoord({ tekst: 'Hoi ' + instellingen().naam + ', waarmee kan ik helpen?' }, false);
    this.gesprekGehad = true;
    if (this.kanLuisteren()) this.luister();
    else laag.querySelector('input').focus();
  },

  sluit() {
    this.stopLuisteren();
    speechSynthesis && speechSynthesis.cancel();
    const laag = document.getElementById('siri-laag');
    laag.classList.remove('actief');
    document.body.classList.remove('siri-open');
    this.gesprekGehad = false;
    setTimeout(() => { if (!laag.classList.contains('actief')) laag.innerHTML = ''; }, 300);
  },

  /* ---------- luisteren ---------- */
  kanLuisteren() {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  },

  luister() {
    if (!this.kanLuisteren()) {
      this.antwoord({ tekst: 'Praten werkt niet in deze browser. Gebruik Chrome, Edge of Safari, of typ je vraag.' }, false);
      return;
    }
    speechSynthesis && speechSynthesis.cancel();      // eerst stoppen met praten
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.herkenning = new SR();
    this.herkenning.lang = 'nl-NL';
    this.herkenning.interimResults = true;              // al tekst laten zien terwijl je praat

    let laatste = '';
    const live = this.bubbel('jij', '…');
    this.herkenning.onresult = e => {
      laatste = Array.from(e.results).map(r => r[0].transcript).join('');
      live.textContent = laatste;
    };
    this.herkenning.onerror = e => {
      live.remove();
      if (e.error === 'not-allowed') this.antwoord({ tekst: 'Ik mag je microfoon niet gebruiken. Geef toestemming via het slotje naast de adresbalk.' }, false);
    };
    this.herkenning.onend = () => {
      this.zetLuisteren(false);
      if (laatste.trim()) { live.remove(); this.verwerk(laatste.trim()); }
      else live.remove();
    };
    try { this.herkenning.start(); this.zetLuisteren(true); } catch (e) {}
  },

  stopLuisteren() {
    if (this.herkenning) try { this.herkenning.stop(); } catch (e) {}
    this.zetLuisteren(false);
  },

  zetLuisteren(aan) {
    this.luistert = aan;
    const laag = document.getElementById('siri-laag');
    laag.classList.toggle('luistert', aan);
    Eiland.siri(aan);
  },

  /* ---------- praten ---------- */
  zeg(tekst) {
    if (!instellingen().siriPraat || !window.speechSynthesis) return;
    const u = new SpeechSynthesisUtterance(tekst);
    u.lang = 'nl-NL';
    const stem = speechSynthesis.getVoices().find(v => v.lang.replace('_', '-').startsWith('nl'));
    if (stem) u.voice = stem;
    u.rate = 1.05;
    const laag = document.getElementById('siri-laag');
    u.onstart = () => laag.classList.add('praat');
    u.onend = () => laag.classList.remove('praat');
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
  },

  /* ---------- het gesprek op het scherm ---------- */
  bubbel(wie, tekst) {
    const g = document.querySelector('.siri-gesprek');
    const b = el('div', { class: 'siri-bubbel ' + wie }, tekst);
    g.appendChild(b);
    g.scrollTop = g.scrollHeight;
    return b;
  },

  antwoord(a, praat = true) {
    const b = this.bubbel('siri', a.tekst);
    if (a.extra) b.insertAdjacentHTML('beforeend', a.extra);
    if (a.knop) {
      const k = el('button', { class: 'knop blauw', type: 'button' }, a.knop.tekst);
      k.addEventListener('click', a.knop.doe);
      b.appendChild(k);
    }
    if (praat) this.zeg(a.gezegd || a.tekst);
  },

  async verwerk(tekst) {
    this.bubbel('jij', tekst);
    const t = tekst.toLowerCase().replace(/[?!.]+$/, '').trim();
    for (const regel of REGELS) {
      if (regel.past(t)) {
        const a = await regel.doe(t, tekst);
        if (a) this.antwoord(a);
        return;
      }
    }
    this.antwoord({
      tekst: 'Dat snap ik nog niet. Zal ik het opzoeken?',
      knop: { tekst: 'Zoek op Google', doe: () => window.open('https://www.google.com/search?q=' + encodeURIComponent(tekst), '_blank', 'noopener') }
    });
  }
};


/* ---------- slim lezen: datums, tijden en getallen uit een zin halen ---------- */

const GETALWOORDEN = { een: 1, één: 1, twee: 2, drie: 3, vier: 4, vijf: 5, zes: 6, zeven: 7, acht: 8, negen: 9, tien: 10, elf: 11, twaalf: 12, twintig: 20, dertig: 30, veertig: 40, vijftig: 50 };

function getal(woord) {
  if (/^\d+([.,]\d+)?$/.test(woord)) return parseFloat(woord.replace(',', '.'));
  return GETALWOORDEN[woord] ?? null;
}

/* haalt 'morgen', 'vrijdag', 'om 4 uur', 'half 5' uit een zin.
   Een uur van 1 tot en met 7 zonder 'ochtend' wordt middag: 'om 4 uur' = 16:00 */
function leesWanneer(t) {
  let datum = null, tijd = '', rest = ' ' + t + ' ';

  if (/\bovermorgen\b/i.test(rest)) { datum = plusDagen(2); rest = rest.replace(/\bovermorgen\b/i, ' '); }
  else if (/\bmorgen\b/i.test(rest) && !/\bmorgenochtend\b/i.test(rest)) { datum = plusDagen(1); rest = rest.replace(/\bmorgen\b/i, ' '); }
  else if (/\bmorgenochtend\b/i.test(rest)) { datum = plusDagen(1); rest = rest.replace(/\bmorgenochtend\b/i, ' '); tijd = '09:00'; }
  else if (/\bvandaag\b/i.test(rest)) { datum = vandaag(); rest = rest.replace(/\bvandaag\b/i, ' '); }
  else {
    const dag = DAGEN.find(d => new RegExp('\\b' + d + '\\b', 'i').test(rest));
    if (dag) {
      let n = (DAGEN.indexOf(dag) - new Date().getDay() + 7) % 7;
      if (n === 0) n = 7;                                       // 'maandag' op een maandag = volgende week
      datum = plusDagen(n);
      rest = rest.replace(new RegExp('(op |volgende week )?\\b' + dag + '\\b', 'i'), ' ');
    }
  }

  const ochtend = /\b('s ochtends|ochtend|morgens)\b/i.test(rest);
  const maak = (u, m) => { if (!ochtend && u >= 1 && u <= 7) u += 12; return String(u).padStart(2, '0') + ':' + String(m).padStart(2, '0'); };
  let m;
  if ((m = rest.match(/\bom half (\w+)( uur)?\b/i))) { const u = getal(m[1].toLowerCase()); if (u) { tijd = maak(u - 1, 30); rest = rest.replace(m[0], ' '); } }
  else if ((m = rest.match(/\bom (\d{1,2})[:.](\d{2})( uur)?\b/i))) { tijd = maak(+m[1], +m[2]); rest = rest.replace(m[0], ' '); }
  else if ((m = rest.match(/\bom (\w+) uur\b/i)) || (m = rest.match(/\bom (\d{1,2})\b/))) { const u = getal(m[1].toLowerCase()); if (u !== null) { tijd = maak(u, 0); rest = rest.replace(m[0], ' '); } }
  rest = rest.replace(/\b('s ochtends|'s middags|'s avonds|ochtend|middag)\b/gi, ' ');

  return { datum, tijd, rest: rest.replace(/\s+/g, ' ').trim() };
}

/* een timer-duur lezen: '5 minuten', 'een kwartier', 'half uur', '30 seconden' -> seconden */
function leesDuur(t) {
  if (/\banderhalf uur\b/.test(t)) return 5400;
  if (/\bhalf uur\b/.test(t)) return 1800;
  if (/\bkwartier\b/.test(t)) return 900;
  const m = t.match(/(\d+(?:[.,]\d+)?|\w+)\s*(seconden|seconde|sec|minuten|minuut|min|uur|uren)\b/);
  if (!m) return null;
  const n = getal(m[1]);
  if (n === null) return null;
  return Math.round(n * (/^sec/.test(m[2]) ? 1 : /^min/.test(m[2]) ? 60 : 3600));
}

function duurTekst(sec) {
  if (sec % 3600 === 0) return (sec / 3600) + (sec === 3600 ? ' uur' : ' uur');
  if (sec % 60 === 0) return (sec / 60) + (sec === 60 ? ' minuut' : ' minuten');
  return sec + ' seconden';
}

const APP_NAMEN = { planner: 'planner', taken: 'planner', agenda: 'agenda', kalender: 'agenda', browser: 'browser', internet: 'browser',
  websites: 'websites', tiktok: 'websites', instellingen: 'instellingen', settings: 'instellingen', home: 'home', beginscherm: 'home' };

const GRAPPEN = [
  'Waarom nemen hockeyers altijd een potlood mee? Voor als ze moeten tekenen bij een nieuwe club.',
  'Wat zegt een nul tegen een acht? Mooie riem!',
  'Waarom ging de computer naar de dokter? Hij had een virus.',
  'Hoe noem je een beer zonder oren? B.',
  'Wat doet een HTML-bestand op vakantie? Gewoon een beetje <body> bruin worden.',
  'Waarom zijn programmeurs slecht in buiten zijn? Te veel bugs.'
];


/* ---------- DE REGELS: wat Siri allemaal snapt ----------
   past(t) = lijkt de zin hierop?   doe(t) = wat moet er gebeuren? Geeft een antwoord terug. */

const REGELS = [
  {
    past: t => /^(hoi|hallo|hey|hé|he|yo|goedemorgen|goedemiddag|goedenavond)\b/.test(t) && t.split(' ').length <= 3,
    doe: () => ({ tekst: 'Hoi ' + instellingen().naam + '! Wat kan ik voor je doen?' })
  },
  {
    past: t => /\b(dank|bedankt|thanks|top)\b/.test(t),
    doe: () => ({ tekst: 'Graag gedaan!' })
  },
  {
    past: t => /\bhoe laat\b/.test(t),
    doe: () => { const n = new Date(); return { tekst: 'Het is ' + n.getHours() + ':' + String(n.getMinutes()).padStart(2, '0') + '.' }; }
  },
  {
    past: t => /\b(welke|wat voor) (dag|datum)\b|\bwelke datum\b|\bwat is (het|de datum) vandaag\b/.test(t),
    doe: () => { const n = new Date(); return { tekst: 'Het is ' + DAGEN[n.getDay()] + ' ' + n.getDate() + ' ' + MAANDEN[n.getMonth()] + '.' }; }
  },
  {
    past: t => /\b(stop|annuleer|zet uit)\b.*\btimer\b|\btimer\b.*\b(stop|uit)\b/.test(t),
    doe: () => { if (!Eiland.timerEinde) return { tekst: 'Er loopt geen timer.' }; Eiland.stopTimer(); return { tekst: 'Timer gestopt.' }; }
  },
  {
    past: t => /\b(timer|wekker|kookwekker|aftellen)\b/.test(t),
    doe: t => {
      const sec = leesDuur(t);
      if (!sec) return { tekst: 'Hoe lang moet de timer duren? Zeg bijvoorbeeld: timer van 5 minuten.' };
      Eiland.timer(sec, duurTekst(sec));
      return { tekst: 'Timer van ' + duurTekst(sec) + ' loopt. Je ziet hem bovenin.' };
    }
  },
  {
    past: t => /^(plan|zet|herinner|maak (een )?(taak|herinnering)|nieuwe taak|taak|voeg)\b/.test(t),
    doe: (t, origineel) => {
      const w = leesWanneer(origineel.replace(/[?!.]+$/, ''));
      let titel = w.rest
        .replace(/^(plan|zet|voeg|maak( een)? (taak|herinnering)( aan| voor| om)?|nieuwe taak|taak|herinner me( eraan)?( om| dat| aan)?)\s*/i, '')
        .replace(/\b(in|op|aan) (mijn|de) (planner|agenda|lijst)\b/i, '')
        .replace(/\b(toe|in)$/i, '')
        .replace(/^(dat ik|om)\s+/i, '')
        .replace(/\s+(moet|in)$/i, '')
        .trim();
      if (!titel) return { tekst: 'Wat moet ik plannen? Zeg bijvoorbeeld: plan Engels leren morgen om 4 uur.' };
      titel = titel[0].toUpperCase() + titel.slice(1);
      const lijst = /\b(hockey|training|wedstrijd)\b/.test(t) ? 'Hockey' : /\b(leren|huiswerk|toets|maken|lezen|engels|wiskunde|nederlands|so|pw)\b/.test(t) ? 'School' : 'Privé';
      const taak = Planner.voegToe({ titel, datum: w.datum || vandaag(), tijd: w.tijd, lijst });
      Eiland.melding('Taak toegevoegd', taak.titel + ' · ' + mooieDatum(taak.datum) + (taak.tijd ? ' ' + taak.tijd : ''), '☑');
      return {
        tekst: 'Gepland: "' + taak.titel + '" voor ' + mooieDatum(taak.datum) + (taak.tijd ? ' om ' + taak.tijd : '') + '.',
        knop: { tekst: 'Ook in Google Agenda', doe: () => window.open(googleAgendaLink(taak.titel, taak.datum, taak.tijd), '_blank', 'noopener') }
      };
    }
  },
  {
    past: t => /\b(weer|regen|regent|temperatuur|graden|warm|koud|paraplu|zon|sneeuw)\b/.test(t),
    doe: async t => {
      if (instellingen().lat === null) return { tekst: 'Ik weet nog niet waar je bent. Stel je plaats in bij Instellingen.', knop: { tekst: 'Open Instellingen', doe: () => { Siri.sluit(); Prive.start('instellingen'); } } };
      const d = await Weer.haal();
      if (!d) return { tekst: 'Ik kan het weer nu niet ophalen.' };
      if (/\bmorgen\b/.test(t)) {
        const b = Weer.beschrijf(d.daily.weather_code[1]);
        return { tekst: 'Morgen wordt het ' + b.tekst + ', tussen de ' + Math.round(d.daily.temperature_2m_min[1]) + ' en ' + Math.round(d.daily.temperature_2m_max[1]) + ' graden.' };
      }
      const b = Weer.beschrijf(d.current.weather_code);
      const regenStraks = d.hourly.precipitation_probability.slice(new Date().getHours(), new Date().getHours() + 6);
      const kans = Math.max(...regenStraks);
      return { tekst: 'Het is nu ' + Math.round(d.current.temperature_2m) + ' graden en ' + b.tekst + '. ' + (kans >= 50 ? 'Neem een paraplu mee, de kans op regen is ' + kans + ' procent.' : 'De komende uren blijft het waarschijnlijk droog.') };
    }
  },
  {
    past: t => /\b(wedstrijd|hockey)\b/.test(t),
    doe: () => {
      const m = instellingen().wedstrijd;
      if (!m.datum) return { tekst: 'Ik weet je volgende wedstrijd nog niet. Zet hem in Instellingen.' };
      return { tekst: 'Je volgende wedstrijd is ' + mooieDatum(m.datum) + (m.tijd ? ' om ' + m.tijd : '') + ', ' + (m.thuis ? 'thuis' : 'uit') + ' tegen ' + (m.tegenstander || 'een onbekende tegenstander') + '. Succes!' };
    }
  },
  {
    past: t => /\b(wat|welke)\b.*\b(moet ik|heb ik|staat er|taken|planning|huiswerk)\b/.test(t),
    doe: t => {
      const dag = /\bovermorgen\b/.test(t) ? plusDagen(2) : /\bmorgen\b/.test(t) ? plusDagen(1) : vandaag();
      const lijst = Planner.takenOp(dag);
      if (!lijst.length) return { tekst: 'Je hebt ' + mooieDatum(dag) + ' niks gepland.' };
      return {
        tekst: mooieDatum(dag)[0].toUpperCase() + mooieDatum(dag).slice(1) + ' heb je ' + lijst.length + (lijst.length === 1 ? ' taak' : ' taken') + ': ' + lijst.map(x => x.titel + (x.tijd ? ' om ' + x.tijd : '')).join(', ') + '.'
      };
    }
  },
  {
    past: t => /\b(ga naar|open|bezoek)\s+\S+\.[a-z]{2,}\b/.test(t),
    doe: t => {
      const url = t.match(/\b(?:ga naar|open|bezoek)\s+(\S+\.[a-z]{2,}\S*)/)[1];
      Siri.sluit();
      Prive.start('browser', { url });
      return null;
    }
  },
  {
    past: t => /\b(open|start|ga naar|laat .* zien)\b/.test(t) && Object.keys(APP_NAMEN).some(n => t.includes(n)),
    doe: t => {
      const id = APP_NAMEN[Object.keys(APP_NAMEN).find(n => t.includes(n))];
      Siri.sluit();
      Prive.start(id);
      return null;
    }
  },
  {
    past: t => /\d/.test(t) && /\b(plus|min|keer|maal|gedeeld|delen|x|\+|-|\*|\/)\b|[+\-*/]/.test(t) && /\b(hoeveel|wat is|reken|is)\b|^\d/.test(t),
    doe: t => {
      const som = t.replace(/^.*?(?=\d|\()/, '')
        .replace(/gedeeld door|delen door/g, '/').replace(/\bkeer\b|\bmaal\b|\bx\b/g, '*')
        .replace(/\bplus\b/g, '+').replace(/\bmin\b/g, '-').replace(/(\d),(\d)/g, '$1.$2')
        .replace(/[^0-9+\-*/(). ]/g, '');
      if (!/^[0-9+\-*/(). ]+$/.test(som)) return { tekst: 'Die som snap ik niet.' };
      try {
        const uitkomst = Function('return (' + som + ')')();       // veilig: alleen cijfers en + - * / mogen erin
        const mooi = Math.round(uitkomst * 1000) / 1000;
        return { tekst: som.trim().replace(/\*/g, '×').replace(/\//g, '÷') + ' = ' + String(mooi).replace('.', ','), gezegd: 'Dat is ' + String(mooi).replace('.', ',') };
      } catch (e) { return { tekst: 'Die som snap ik niet.' }; }
    }
  },
  {
    past: t => /\b(grap|mop|grappig)\b/.test(t),
    doe: () => ({ tekst: GRAPPEN[Math.floor(Math.random() * GRAPPEN.length)] })
  },
  {
    past: t => /\b(kop of munt|muntje|munt opgooien)\b/.test(t),
    doe: () => ({ tekst: Math.random() < 0.5 ? 'Kop!' : 'Munt!' })
  },
  {
    past: t => /\b(dobbelsteen|gooi een dobbel|dobbel)\b/.test(t),
    doe: () => ({ tekst: 'Je gooit ' + (1 + Math.floor(Math.random() * 6)) + '.' })
  },
  {
    past: t => /\b(wie ben jij|wat ben jij|hoe heet jij|wie ben je)\b/.test(t),
    doe: () => ({ tekst: 'Ik ben Siri van Privé. Ik kan plannen, timers zetten, het weer vertellen, apps openen, rekenen en grapjes maken.' })
  },
  {
    past: t => /\b(wat kun je|wat kan je|help)\b/.test(t),
    doe: () => ({ tekst: 'Probeer bijvoorbeeld: "plan wiskunde leren morgen om 4 uur", "wat moet ik vandaag doen", "timer van 10 minuten", "wat voor weer wordt het morgen", "open de browser", "hoeveel is 12 keer 8", of "vertel een grap".' })
  },
  {
    past: t => /\bhoe gaat het\b/.test(t),
    doe: () => ({ tekst: 'Met mij gaat het goed, ik ben tenslotte een website. En met jou?' })
  },
  {
    past: t => /^(zoek|google)\b/.test(t),
    doe: t => {
      const vraag = t.replace(/^(zoek|google)( op| naar)?\s*/, '');
      return { tekst: 'Zoeken naar "' + vraag + '"?', knop: { tekst: 'Zoek op Google', doe: () => window.open('https://www.google.com/search?q=' + encodeURIComponent(vraag), '_blank', 'noopener') } };
    }
  }
];

Prive.registreer({
  id: 'siri',
  naam: 'Siri',
  kleur: 'radial-gradient(circle at 30% 25%, #64D2FF, #5E5CE6 45%, #BF5AF2 70%, #FF375F)',
  icoon: '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round"><path d="M4 12c1.5-4 3-4 4.5 0s3 4 4.5 0 3-4 4.5 0 1.8 2.5 2.5 1.5"/><path d="M5.5 12c1-2 2-2 3 0s2.2 2.4 3.4 0" opacity=".6"/></svg>',
  start() { Siri.start(); }
});

/* de stemmen worden soms pas later geladen, daarom 1 keer opvragen */
if (window.speechSynthesis) speechSynthesis.getVoices();