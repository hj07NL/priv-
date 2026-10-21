/* BEDIENING: rechtsboven een snelmenu met snelle acties en app-openers. */
const Bediening = {
  init() {
    if (document.getElementById('bediening-knop')) return;

    const knop = document.createElement('button');
    knop.id = 'bediening-knop';
    knop.type = 'button';
    knop.className = 'bediening-knop';
    knop.setAttribute('aria-label', 'Open bediening');
    knop.textContent = '⋯';

    const paneel = document.createElement('div');
    paneel.id = 'bediening-paneel';
    paneel.className = 'bediening-paneel glas';
    paneel.innerHTML = `
      <div class="bediening-kop">Privé</div>
      <button class="bediening-item" type="button" data-bediening="home">Home</button>
      <button class="bediening-item" type="button" data-bediening="planner">Planner</button>
      <button class="bediening-item" type="button" data-bediening="websites">Websites</button>
      <button class="bediening-item" type="button" data-bediening="instellingen">Instellingen</button>
      <button class="bediening-item" type="button" data-bediening="siri">Siri</button>
    `;

    document.body.appendChild(knop);
    document.body.appendChild(paneel);

    knop.addEventListener('click', e => {
      e.stopPropagation();
      this.toggle();
    });

    paneel.querySelectorAll('[data-bediening]').forEach(button => {
      button.addEventListener('click', () => {
        const app = button.dataset.bediening;
        this.sluit();
        if (app === 'siri' && window.Siri && typeof Siri.start === 'function') {
          Siri.start();
          return;
        }
        if (window.Prive && typeof Prive.start === 'function') {
          Prive.start(app);
        }
      });
    });

    document.addEventListener('click', e => {
      if (!paneel.contains(e.target) && e.target !== knop) {
        this.sluit();
      }
    });

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') this.sluit();
    });
  },

  toggle() {
    const paneel = document.getElementById('bediening-paneel');
    if (!paneel) return;
    paneel.classList.toggle('actief');
  },

  open() {
    const paneel = document.getElementById('bediening-paneel');
    if (!paneel) return;
    paneel.classList.add('actief');
  },

  sluit() {
    const paneel = document.getElementById('bediening-paneel');
    if (!paneel) return;
    paneel.classList.remove('actief');
  }
};

window.Bediening = Bediening;
