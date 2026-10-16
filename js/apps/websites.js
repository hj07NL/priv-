/* WEBSITES: websites uit TikTok-video's ("websites you should know").
   Bij elke website zie je de TikTok-video, de website zelf, een cijfer en een oordeel.
   Er zijn 2 soorten:
   - getest door Claude: staan in data/mijn-websites.js
   - zelf toegevoegd: worden op je apparaat bewaard */

const Websites = {
  lijst() {
    const eigen = Opslag.lees('websites', []).map(w => ({ ...w, eigen: true }));
    return [...PRIVE_WEBSITES, ...eigen];
  },

  /* het nummer van een TikTok-video uit de link halen: .../video/7301234567890 -> 7301234567890 */
  tiktokId(link) {
    const m = String(link || '').match(/video\/(\d+)/);
    return m ? m[1] : null;
  },

  naamVan(url) {
    try { return new URL(url).hostname.replace(/^www\./, ''); } catch (e) { return url; }
  },

  teken(body) {
    body.innerHTML = `
      <div class="balk-rij">
        <p class="uitleg-tekst">Stuur Claude een TikTok-link, dan haal ik de website eruit, test ik hem en krijg je een cijfer.</p>
        <button class="knop blauw" type="button" data-actie="nieuw">+ Toevoegen</button>
      </div>
      <form class="websites-nieuw glas-vlak verborgen">
        <input name="tiktok" placeholder="TikTok-link (mag leeg)">
        <input name="website" placeholder="Website, bv. https://..." required>
        <input name="naam" placeholder="Naam">
        <input name="cijfer" type="number" min="1" max="10" step="0.5" placeholder="Cijfer">
        <input name="oordeel" placeholder="Wat vind je ervan?">
        <button class="knop blauw" type="submit">Opslaan</button>
      </form>
      <div class="websites-raster"></div>`;

    const form = body.querySelector('form');
    body.querySelector('[data-actie="nieuw"]').addEventListener('click', () => form.classList.toggle('verborgen'));

    form.addEventListener('submit', e => {
      e.preventDefault();
      const f = new FormData(form);
      let website = f.get('website').trim();
      if (!/^https?:\/\//.test(website)) website = 'https://' + website;   // https:// vergeten? Dan zet ik het ervoor
      const nieuw = {
        id: Date.now().toString(36),
        tiktok: f.get('tiktok').trim(),
        website,
        naam: f.get('naam').trim() || this.naamVan(website),
        cijfer: f.get('cijfer') ? Number(f.get('cijfer')) : null,
        oordeel: f.get('oordeel').trim()
      };
      Opslag.schrijf('websites', [...Opslag.lees('websites', []), nieuw]);
      form.reset(); form.classList.add('verborgen');
      Prive.zend('websites');
      this.tekenRaster(body);
    });

    this.tekenRaster(body);
  },

  tekenRaster(body) {
    const raster = body.querySelector('.websites-raster');
    const lijst = this.lijst();
    if (!lijst.length) {
      raster.innerHTML = '<p class="leeg">Nog geen websites. Stuur Claude je eerste TikTok-link!</p>';
      return;
    }
    raster.innerHTML = lijst.map((w, i) => {
      const id = this.tiktokId(w.tiktok);
      return `
      <article class="site-kaart glas-vlak" data-i="${i}">
        <div class="tiktok-vak">
          ${id ? `<button class="tiktok-laad" type="button" data-id="${id}">▶<span>Video laden</span></button>`
               : '<div class="tiktok-leeg">Geen video</div>'}
        </div>
        <div class="site-info">
          <div class="site-kop">
            <h3>${veilig(w.naam || this.naamVan(w.website))}</h3>
            ${w.cijfer ? `<span class="cijfer ${w.cijfer >= 7.5 ? 'hoog' : w.cijfer < 5.5 ? 'laag' : ''}">${w.cijfer}</span>` : ''}
          </div>
          <p class="site-url">${veilig(this.naamVan(w.website))}</p>
          ${w.wat ? `<p>${veilig(w.wat)}</p>` : ''}
          ${w.oordeel ? `<p class="oordeel">${veilig(w.oordeel)}</p>` : ''}
          <p class="site-label">${w.eigen ? 'Zelf toegevoegd' : 'Getest door Claude' + (w.getest ? ' op ' + mooieDatum(w.getest) : '')}</p>
          <div class="knoppen-rij">
            <button class="knop" type="button" data-browser="${veilig(w.website)}">Open in Browser</button>
            <a class="knop" href="${veilig(w.website)}" target="_blank" rel="noopener">Nieuw tabblad</a>
            ${w.eigen ? `<button class="knop rood-tekst" type="button" data-weg="${veilig(w.id)}">Verwijder</button>` : ''}
          </div>
        </div>
      </article>`;
    }).join('');

    // de TikTok-video pas laden als je erop klikt (anders wordt de app traag)
    raster.querySelectorAll('.tiktok-laad').forEach(b => b.addEventListener('click', () => {
      b.parentElement.innerHTML = `<iframe src="https://www.tiktok.com/embed/v2/${b.dataset.id}" allow="encrypted-media; fullscreen" allowfullscreen title="TikTok-video"></iframe>`;
    }));
    raster.querySelectorAll('[data-browser]').forEach(b => b.addEventListener('click', () => Prive.start('browser', { url: b.dataset.browser })));
    raster.querySelectorAll('[data-weg]').forEach(b => b.addEventListener('click', () => {
      Opslag.schrijf('websites', Opslag.lees('websites', []).filter(w => w.id !== b.dataset.weg));
      Prive.zend('websites');
      this.tekenRaster(body);
    }));
  }
};

Prive.registreer({
  id: 'websites',
  naam: 'Websites',
  kleur: 'linear-gradient(160deg, #FF375F, #8A3FFC)',
  icoon: '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8"><circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.5 2.6 3.6 5.4 3.6 8.5s-1.1 5.9-3.6 8.5c-2.5-2.6-3.6-5.4-3.6-8.5S9.5 6.1 12 3.5z"/></svg>',
  maak(body) { Websites.teken(body); }
});