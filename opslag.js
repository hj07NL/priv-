/* OPSLAG
   Alles wat je in Privé maakt (taken, instellingen, websites) wordt bewaard in je browser (localStorage).
   Let op: dat staat alleen op DIT apparaat. Met Instellingen > Back-up kun je het naar een ander apparaat zetten.
   try/catch: in een privévenster kan opslaan mislukken, dan gaat de site gewoon door zonder te crashen. */

const Opslag = {
  // iets lezen. Is er nog niks opgeslagen? Dan krijg je de standaardwaarde terug
  lees(sleutel, standaard) {
    try {
      const tekst = localStorage.getItem('prive.' + sleutel);
      return tekst === null ? standaard : JSON.parse(tekst);
    } catch (e) {
      return standaard;
    }
  },

  // iets opslaan. JSON.stringify maakt van een lijst of object een stuk tekst
  schrijf(sleutel, waarde) {
    try {
      localStorage.setItem('prive.' + sleutel, JSON.stringify(waarde));
    } catch (e) { /* opslaan lukt niet, niks aan te doen */ }
  },

  // alles van Privé in 1 object, voor de back-up
  alles() {
    const uit = {};
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k.startsWith('prive.')) uit[k] = localStorage.getItem(k);
      }
    } catch (e) {}
    return uit;
  },

  // een back-up terugzetten
  zetTerug(data) {
    try {
      Object.keys(data).forEach(k => {
        if (k.startsWith('prive.')) localStorage.setItem(k, data[k]);
      });
    } catch (e) {}
  }
};

/* INSTELLINGEN met standaardwaardes. Nieuwe instelling nodig? Zet hem hier bij */
const STANDAARD_INSTELLINGEN = {
  naam: 'Hai-Jun',
  plaats: '',            // naam van je plaats, voor het weer
  lat: null,             // breedtegraad van je plaats
  lon: null,             // lengtegraad van je plaats
  weerAchtergrond: false,// de achtergrond met het echte weer en de tijd
  agendaLink: '',        // de insluit-link van Google Agenda
  wedstrijd: { datum: '', tijd: '', tegenstander: '', thuis: true },
  siriPraat: true        // praat Siri hardop terug?
};

function instellingen() {
  // ... = alles uit de standaard, en daaroverheen wat je zelf hebt veranderd
  return { ...STANDAARD_INSTELLINGEN, ...Opslag.lees('instellingen', {}) };
}

function bewaarInstelling(sleutel, waarde) {
  const nu = instellingen();
  nu[sleutel] = waarde;
  Opslag.schrijf('instellingen', nu);
  Prive.zend('instellingen');   // laat de rest van de site weten dat er iets veranderd is
}
