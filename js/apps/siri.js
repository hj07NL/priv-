/* BROWSER: een browser in je browser, met tabbladen en een adresbalk.
   Deze versie blijft binnen de app en gebruikt leesmodus als een site niet in een iframe mag. */

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
  tabs: [],
  actief: null,

  nieuwTab(url) {
    const tab = { id: Math.random().toString(36).slice(2), url: '', geschiedenis: [], plek: -1 };
    this.tabs.push(tab);
    this.actief = tab.id;
    if (url) this.ga(url, tab); else this.tekenAlles();
  },

  tab() { return this.tabs.find(t => t.id === this.actief); },

  maakUrl(tekst) {
    tekst = tekst.trim();
    if (!tekst) return null;
    const lijktOpSite = /^[^\s]+\.[a-z]{2,}(\/.*)?$/i.test(tekst) || /^https?:\/\//i.test(tekst);
    if (!lijktOpSite) return { zoek: tekst };
    let url = /^https?:\/\//i.test(tekst) ? tekst : 'https://' + tekst;

    const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([\w-]{11})/);
    if (yt) url = 'https://www.youtube.com/embed/' + yt[1];
    const tt = url.match(/tiktok\.com\/.*video\/(\d+)/);
    if (tt) url = 'https://www.tiktok.com/embed/v2/' + tt[1];
    return { url };
  },

  isGeblokkeerd(url) {
    if (/youtube\.com\/embed|tiktok\.com\/embed|r\.jina\.ai\//.test(url)) return false;
    try {
      const host = new URL(url).hostname;
      return GEBLOKKEERD.some(g => host.includes(g));
    } catch (e) { return false; }
  },

  leesLink(url) {
    try {
      const u = new URL(url);
      const host = u.hostname;
      const rest = u.pathname + u.search + u.hash;
      if (host === 'r.jina.ai') return url;
      return 'https://r.jina.ai/http://' + host + rest;
    } catch (e) {
      return url;
    }
  },

  ga(tekst, tab = this.tab()) {
    const r = this.maakUrl(tekst);
    if (!r) return;
    if (r.zoek) {
      this.nieuwTab('https://www.google.com/search?q=' + encodeURIComponent(r.zoek));
      return;
    }

    const url = r.url;
    if (tab) {
      tab.geschiedenis = tab.geschiedenis.slice(0, tab.plek + 1);
      tab.geschiedenis.push(url);
      tab.plek = tab.geschiedenis.length - 1;
      tab.url = url;
    }
    this.tekenAlles();
  },

  terug() {
    const t = this.tab();
    if (t && t.plek > 0) {
      t.plek--;
      t.url = t.geschiedenis[t.plek];
      this.tekenAlles();
    }
  },

  vooruit() {
    const t = this.tab();
    if (t && t.plek < t.geschiedenis.length - 1) {
      t.plek++;
      t.url = t.geschiedenis[t.plek];
      this.tekenAlles();
    }
  },

  sluitTab(id) {
    this.tabs = this.tabs.filter(t => t.id !== id);
    if (!this.tabs.length) return this.nieuwTab();
    if (this.actief === id) this.actief = this.tabs[this.tabs.length - 1].id;
    this.tekenAlles();
  },

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
        <button type="button" class="ronde-knop" data-a="lees" aria-label="Open in leesmodus" title="Open in leesmodus">☰</button>
      </form>
      <div class="pagina-vak"></div>`;

    body.querySelector('form').addEventListener('submit', e => { e.preventDefault(); this.ga(e.target.adres.value); });
    body.querySelector('[data-a="terug"]').addEventListener('click', () => this.terug());
    body.querySelector('[data-a="vooruit"]').addEventListener('click', () => this.vooruit());
    body.querySelector('[data-a="herlaad"]').addEventListener('click', () => this.tekenAlles(true));
    body.querySelector('[data-a="lees"]').addEventListener('click', () => {
      const t = this.tab();
      if (!t || !t.url) return;
      const lees = this.leesLink(t.url);
      if (lees !== t.url) {
        t.url = lees;
        this.tekenAlles(true);
      }
    });

    if (opties && opties.url) this.nieuwTab(opties.url);
    else if (!this.tabs.length) this.nieuwTab();
    else this.tekenAlles();
  },

  tekenAlles(herlaad) {
    const body = this.body;
    if (!body || !body.isConnected) return;
    const tab = this.tab();

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

    if (!tab || !tab.url) {
      vak.innerHTML = `
        <div class="startpagina">
          <h3>Favorieten</h3>
          <div class="favorieten">${FAVORIETEN.map(f => `
            <button type="button" class="favoriet" data-url="${f.url}">
              <span class="fav-letter" style="background:${f.kleur}">${f.naam[0]}</span>${veilig(f.naam)}
            </button>`).join('')}
          </div>
          <p class="klein">Tip: plak een YouTube- of TikTok-videolink in de adresbalk; die wordt hier automatisch afgespeeld.</p>
        </div>`;
      vak.querySelectorAll('.favoriet').forEach(f => f.addEventListener('click', () => this.ga(f.dataset.url)));
      return;
    }

    const isLees = /r\.jina\.ai\//i.test(tab.url);
    const echteUrl = isLees ? tab.url.replace(/^https:\/\/r\.jina\.ai\/http:\/\//i, 'https://').replace(/^https:\/\/r\.jina\.ai\/https:\/\//i, 'https://') : tab.url;

    if (this.isGeblokkeerd(echteUrl)) {
      vak.innerHTML = `
        <div class="geblokkeerd">
          <p class="groot-icoon">☰</p>
          <h3>${veilig(Websites.naamVan(echteUrl))} laat zich niet inbedden</h3>
          <p>Open deze site in leesmodus binnen de app, of bekijk hem in een echt tabblad.</p>
          <button type="button" class="knop blauw" data-lees="${this.leesLink(echteUrl)}">Open in leesmodus</button>
        </div>`;
      vak.querySelector('[data-lees]').addEventListener('click', e => {
        const url = e.currentTarget.dataset.lees;
        if (url) {
          tab.url = url;
          this.tekenAlles();
        }
      });
      return;
    }

    const bestaand = vak.querySelector('iframe');
    if (!herlaad && bestaand && bestaand.dataset.url === tab.url) return;

    vak.innerHTML = `
      <iframe src="${veilig(tab.url)}" data-url="${veilig(tab.url)}" title="Website"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-presentation"
              allow="fullscreen; encrypted-media; autoplay"></iframe>
      <p class="iframe-hint">Als de pagina wit blijft, dan blokkeert de site de embed. Gebruik de knop met ☰ voor leesmodus.</p>`;
  }
};

prive.registreer({
  id: 'browser',
  naam: 'Browser',
  kleur: 'linear-gradient(160deg, #64D2FF, #0A84FF)',
  icoon: '<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="#fff" stroke-width="1.6"/><path d="M15.8 8.2l-2.4 5.2-5.2 2.4 2.4-5.2z" fill="#fff"/><path d="M15.8 8.2l-5.2 2.4 2.4-5.2z" fill="#fff" opacity="0.6"/></svg>',
  maak(body, opties) { Browser.maak(body, opties); }
});
