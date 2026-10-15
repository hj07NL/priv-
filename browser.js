/* BROWSER: een browser in je browser, met tabbladen en een adresbalk.
   Hoe het werkt: elke website wordt geladen in een <iframe> (een venster in je pagina).

   EERLIJK: veel grote websites (Google, TikTok, Instagram, YouTube zelf) blokkeren dat met een
   beveiliging die X-Frame-Options heet. Dan blijft het tabblad wit. Daarom:
   - bekende sites die blokkeren openen meteen in een echt nieuw tabblad
   - YouTube- en TikTok-videolinks worden automatisch omgezet naar hun "embed"-versie, die WEL werkt
   - bovenin staat altijd een knop om de site in een echt tabblad te openen */

const GEBLOKKEERD = ['google.', 'tiktok.com', 'youtube.com', 'instagram.com', 'facebook.com', 'x.com', 'twitter.com',
  'github.com', 'netflix.com', 'reddit.com', 'linkedin.com', 'snapchat.com', 'whatsapp.com', 'spotify.com', 'apple.com',
  'bol.com', 'magister.net', 'somtoday.nl', 'chatgpt.com', 'claude.ai', 'discord.com', 'twitch.tv'];

const FAVORIETEN = [
  { naam: 'Mijn schoolsite', url: 'https://hj07nl.github.io', kleur: '#0b2545' },
  { naam: 'Wikipedia', url: 'https://nl.m.wikipedia.org', kleur: '#636366' },
  { naam: 'TikTok', url: 'https://www.tiktok.com', kleur: '#000000' },
  { naam: 'YouTube', url: 'https://www.youtube.com', kleur: '#FF0000' },
  { naam: 'Google', url: 'https://www.google.com', kleur: '#4285F4' },
  { naam: 'Open-Meteo', url: 'https://open-meteo.com', kleur: '#0A84FF' }
];

const Browser = {
  tabs: [],            // { id, url, geschiedenis: [], plek }
  actief: null,

  nieuwTab(url) {
    const tab = { id: Math.random().toString(36).slice(2), url: '', geschiedenis: [], plek: -1 };
    this.tabs.push(tab);
    this.actief = tab.id;
    if (url) this.ga(url, tab); else this.tekenAlles();
  },

  tab() { return this.tabs.find(t => t.id === this.actief); },

  /* van wat je typt een echte link maken */
  maakUrl(tekst) {
    tekst = tekst.trim();
    if (!tekst) return null;
    const lijktOpSite = /^[^\s]+\.[a-z]{2,}(\/.*)?$/i.test(tekst) || /^https?:\/\//i.test(tekst);
    if (!lijktOpSite) return { zoek: tekst };                       // geen website? dan is het een zoekvraag
    let url = /^https?:\/\//i.test(tekst) ? tekst : 'https://' + tekst;

    // video-links omzetten naar de versie die in een iframe mag
    const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([\w-]{11})/);
    if (yt) url = 'https://www.youtube.com/embed/' + yt[1];
    const tt = url.match(/tiktok\.com\/.*video\/(\d+)/);
    if (tt) url = 'https://www.tiktok.com/embed/v2/' + tt[1];
    return { url };
  },

  isGeblokkeerd(url) {
    if (/youtube\.com\/embed|tiktok\.com\/embed/.test(url)) return false;
    try {
      const host = new URL(url).hostname;
      return GEBLOKKEERD.some(g => host.includes(g));
    } catch (e) { return false; }
  },

  /* naar een website gaan in een tabblad */
  ga(tekst, tab = this.tab()) {
    const r = this.maakUrl(tekst);
    if (!r) return;
    if (r.zoek) {                                                   // zoeken gaat via Google in een echt tabblad
      window.open('https://www.google.com/search?q=' + encodeURIComponent(r.zoek), '_blank', 'noopener');
      return;
    }
    tab.geschiedenis = tab.geschiedenis.slice(0, tab.plek + 1);     // vooruit-geschiedenis weggooien
    tab.geschiedenis.push(r.url);
    tab.plek = tab.geschiedenis.length - 1;
    tab.url = r.url;
    this.tekenAlles();
  },

  terug() { const t = this.tab(); if (t && t.plek > 0) { t.plek--; t.url = t.geschiedenis[t.plek]; this.tekenAlles(); } },
  vooruit() { const t = this.tab(); if (t && t.plek < t.geschiedenis.length - 1) { t.plek++; t.url = t.geschiedenis[t.plek]; this.tekenAlles(); } },

  sluitTab(id) {
    this.tabs = this.tabs.filter(t => t.id !== id);
    if (!this.tabs.length) return this.nieuwTab();
    if (this.actief === id) this.actief = this.tabs[this.tabs.length - 1].id;
    this.tekenAlles();
  },

  /* ---------- het scherm ---------- */
  body: null,

  maak(body, opties) {
    this.body = body;
    body.classList.add('browser-body');
    body.innerHTML = `
      <div class="tab-balk"></div>
      <form class="adres-balk">
        <button type="button" class="ronde-knop" data-a="terug" aria-label="Terug">‹</button>
        <button type="button" class="ronde-knop" data-a="vooruit" aria-label="Vooruit">›</button>
        <input name="adres" placeholder="Zoek of typ een website" autocomplete="off" spellcheck="false">
        <button type="button" class="ronde-knop" data-a="herlaad" aria-label="Herladen">↻</button>
        <button type="button" class="ronde-knop" data-a="extern" aria-label="Open in nieuw tabblad" title="Open in echt tabblad">↗</button>
      </form>
      <div class="pagina-vak"></div>`;

    body.querySelector('form').addEventListener('submit', e => { e.preventDefault(); this.ga(e.target.adres.value); });
    body.querySelector('[data-a="terug"]').addEventListener('click', () => this.terug());
    body.querySelector('[data-a="vooruit"]').addEventListener('click', () => this.vooruit());
    body.querySelector('[data-a="herlaad"]').addEventListener('click', () => this.tekenAlles(true));
    body.querySelector('[data-a="extern"]').addEventListener('click', () => { const t = this.tab(); if (t && t.url) window.open(t.url, '_blank', 'noopener'); });

    if (opties && opties.url) this.nieuwTab(opties.url);     // geopend met een link? dan in een nieuw tabblad
    else if (!this.tabs.length) this.nieuwTab();
    else this.tekenAlles();
  },

  tekenAlles(herlaad) {
    const body = this.body;
    if (!body || !body.isConnected) return;
    const tab = this.tab();

    // tabbladen
    body.querySelector('.tab-balk').innerHTML = this.tabs.map(t => `
      <div class="tab ${t.id === this.actief ? 'aan' : ''}" data-id="${t.id}">
        <span>${t.url ? veilig(Websites.naamVan(t.url)) : 'Startpagina'}</span>
        <button type="button" class="tab-sluit" aria-label="Tab sluiten">✕</button>
      </div>`).join('') + '<button type="button" class="tab-plus" aria-label="Nieuw tabblad">+</button>';
    body.querySelectorAll('.tab').forEach(t => t.addEventListener('click', e => {
      if (e.target.closest('.tab-sluit')) return this.sluitTab(t.dataset.id);
      this.actief = t.dataset.id; this.tekenAlles();
    }));
    body.querySelector('.tab-plus').addEventListener('click', () => this.nieuwTab());

    body.querySelector('[name="adres"]').value = tab && tab.url ? tab.url : '';
    const vak = body.querySelector('.pagina-vak');

    // startpagina met favorieten
    if (!tab || !tab.url) {
      vak.innerHTML = `
        <div class="startpagina">
          <h3>Favorieten</h3>
          <div class="favorieten">${FAVORIETEN.map(f => `
            <button type="button" class="favoriet" data-url="${f.url}">
              <span class="fav-letter" style="background:${f.kleur}">${f.naam[0]}</span>${veilig(f.naam)}
            </button>`).join('')}
          </div>
          <p class="klein">Tip: plak een YouTube- of TikTok-videolink in de adresbalk, die wordt hier gewoon afgespeeld.</p>
        </div>`;
      vak.querySelectorAll('.favoriet').forEach(f => f.addEventListener('click', () => this.ga(f.dataset.url)));
      return;
    }

    // bekende site die zich niet laat insluiten
    if (this.isGeblokkeerd(tab.url)) {
      vak.innerHTML = `
        <div class="geblokkeerd">
          <p class="groot-icoon">↗</p>
          <h3>${veilig(Websites.naamVan(tab.url))} laat zich niet openen in een andere website</h3>
          <p>Die site blokkeert dat voor de veiligheid. Open hem in een echt tabblad.</p>
          <a class="knop blauw" href="${veilig(tab.url)}" target="_blank" rel="noopener">Open ${veilig(Websites.naamVan(tab.url))}</a>
        </div>`;
      return;
    }

    const bestaand = vak.querySelector('iframe');
    if (!herlaad && bestaand && bestaand.dataset.url === tab.url) return;
    vak.innerHTML = `
      <iframe src="${veilig(tab.url)}" data-url="${veilig(tab.url)}" title="Website"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-presentation"
              allow="fullscreen; encrypted-media; autoplay"></iframe>
      <p class="iframe-hint">Blijft het wit? Dan blokkeert deze site het. Klik op ↗ om hem in een echt tabblad te openen.</p>`;
  }
};

Prive.registreer({
  id: 'browser',
  naam: 'Browser',
  kleur: 'linear-gradient(160deg, #64D2FF, #0A84FF)',
  icoon: '<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="#fff" stroke-width="1.6"/><path d="M15.8 8.2l-2.4 5.2-5.2 2.4 2.4-5.2z" fill="#fff"/><path d="M15.8 8.2l-5.2 2.4 2.8 2.8z" fill="#FF453A"/></svg>',
  maak(body, opties) { Browser.maak(body, opties); }
});
