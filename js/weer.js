/* WEER: haalt het weer op bij Open-Meteo. Dat is gratis en je hebt geen account of sleutel nodig.
   fetch() = een verzoek naar een andere website sturen en het antwoord (JSON) teruglezen. */

const Weer = {
  data: null,        // het laatst opgehaalde weer
  tijd: 0,           // wanneer dat was

  /* het weer ophalen, maar hooguit 1 keer per 15 minuten */
  async haal(forceer) {
    const s = instellingen();
    if (s.lat === null || s.lon === null) return null;          // nog geen plaats ingesteld
    if (!forceer && this.data && Date.now() - this.tijd < 15 * 60000) return this.data;

    const url = 'https://api.open-meteo.com/v1/forecast'
      + '?latitude=' + s.lat + '&longitude=' + s.lon
      + '&current=temperature_2m,weather_code,is_day,wind_speed_10m'
      + '&hourly=temperature_2m,weather_code,precipitation_probability'
      + '&daily=sunrise,sunset,temperature_2m_max,temperature_2m_min,weather_code'
      + '&timezone=auto&forecast_days=7';
    try {
      const antwoord = await fetch(url);
      this.data = await antwoord.json();
      this.tijd = Date.now();
      privé.zend('weer', this.data);
      return this.data;
    } catch (e) {
      return null;                                               // geen internet: dan maar geen weer
    }
  },

  /* een plaatsnaam opzoeken, bv. 'Leiden' -> breedtegraad en lengtegraad */
  async zoekPlaats(naam) {
    const url = 'https://geocoding-api.open-meteo.com/v1/search?count=1&language=nl&name=' + encodeURIComponent(naam);
    const antwoord = await fetch(url);
    const data = await antwoord.json();
    if (!data.results || !data.results.length) return null;
    const r = data.results[0];
    return { naam: r.name, lat: r.latitude, lon: r.longitude };
  },

  /* de locatie van je apparaat gebruiken (de browser vraagt eerst toestemming) */
  mijnLocatie() {
    return new Promise((klaar, fout) => {
      if (!navigator.geolocation) return fout(new Error('Je browser kan je locatie niet bepalen.'));
      navigator.geolocation.getCurrentPosition(
        p => klaar({ naam: 'Mijn locatie', lat: +p.coords.latitude.toFixed(3), lon: +p.coords.longitude.toFixed(3) }),
        () => fout(new Error('Je hebt geen toestemming gegeven voor je locatie.')),
        { timeout: 10000 }
      );
    });
  },

  /* de weercode van Open-Meteo omzetten naar Nederlands + een soort (voor het icoon en de achtergrond) */
  beschrijf(code) {
    if (code === 0) return { tekst: 'onbewolkt', soort: 'zon' };
    if (code <= 2) return { tekst: 'licht bewolkt', soort: 'halfbewolkt' };
    if (code === 3) return { tekst: 'bewolkt', soort: 'wolk' };
    if (code <= 48) return { tekst: 'mist', soort: 'mist' };
    if (code <= 57) return { tekst: 'motregen', soort: 'regen' };
    if (code <= 67) return { tekst: 'regen', soort: 'regen' };
    if (code <= 77) return { tekst: 'sneeuw', soort: 'sneeuw' };
    if (code <= 82) return { tekst: 'regenbuien', soort: 'regen' };
    if (code <= 86) return { tekst: 'sneeuwbuien', soort: 'sneeuw' };
    return { tekst: 'onweer', soort: 'onweer' };
  },

  /* kleine weericoontjes, getekend met SVG */
  icoon(soort, dag = true) {
    const zon = '<circle cx="12" cy="12" r="4.5" fill="#FFD60A"/><g stroke="#FFD60A" stroke-width="1.8" stroke-linecap="round"><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/></g>';
    const maan = '<path d="M15.5 3.5a8.5 8.5 0 1 0 5 15 7 7 0 0 1-5-15z" fill="#E5E5EA"/>';
    const wolk = (x = 0, y = 0, kleur = '#F2F2F7') => `<path transform="translate(${x} ${y})" d="M7 18h10a4 4 0 0 0 .4-8 5.5 5.5 0 0 0-10.6 1.2A3.4 3.4 0 0 0 7 18z" fill="${kleur}"/>`;
    const druppels = '<g stroke="#64D2FF" stroke-width="1.8" stroke-linecap="round"><path d="M9 20l-1 2.5M13 20l-1 2.5M17 20l-1 2.5"/></g>';
    const vlokken = '<g fill="#fff"><circle cx="9" cy="21.5" r="1.1"/><circle cx="13" cy="22" r="1.1"/><circle cx="17" cy="21.5" r="1.1"/></g>';
    const bliksem = '<path d="M13 17l-3 4h3l-2 3.5" stroke="#FFD60A" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>';
    const mist = '<g stroke="#D1D1D6" stroke-width="1.8" stroke-linecap="round"><path d="M4 10h16M6 14h12M4 18h16"/></g>';
    const delen = {
      zon: dag ? zon : maan,
      halfbewolkt: (dag ? '<g transform="translate(-3 -3) scale(.8)">' + zon + '</g>' : '<g transform="translate(-2 -3) scale(.75)">' + maan + '</g>') + wolk(1, 1),
      wolk: wolk(0, -1),
      regen: wolk(0, -3) + druppels,
      sneeuw: wolk(0, -3) + vlokken,
      onweer: wolk(0, -4, '#AEAEB2') + bliksem,
      mist: mist
    };
    return '<svg viewBox="0 0 24 24" class="weer-icoon" aria-hidden="true">' + (delen[soort] || delen.wolk) + '</svg>';
  }
};