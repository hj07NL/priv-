:root {
  --bg: #05070f;
  --bg-2: #0a1220;
  --bg-3: #0f1d31;
  --glas: rgba(255, 255, 255, 0.12);
  --glas-sterk: rgba(255, 255, 255, 0.18);
  --rand: rgba(255, 255, 255, 0.22);
  --tekst: #edf5ff;
  --tekst-2: #aebdd6;
  --zacht: rgba(237, 245, 255, 0.72);
  --accent-blauw: #7cc8ff;
  --accent-blauw-2: #5b8cff;
  --accent-oranje: #ffbf7a;
  --accent-oranje-2: #ff7a59;
  --success: #7df9c8;
  --shadow: 0 22px 60px rgba(6, 10, 22, 0.52);
}

* { box-sizing: border-box; }
html, body {
  margin: 0;
  min-height: 100%;
  font-family: 'Inter', 'SF Pro Display', system-ui, sans-serif;
  background: radial-gradient(circle at top, rgba(92, 124, 255, 0.28), transparent 35%), linear-gradient(180deg, var(--bg) 0%, var(--bg-2) 100%);
  color: var(--tekst);
}
body {
  min-height: 100vh;
  padding: max(22px, env(safe-area-inset-top)) 16px calc(120px + env(safe-area-inset-bottom));
  overflow-x: hidden;
}
button, input, select, textarea { font: inherit; }

#achtergrond {
  position: fixed;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  pointer-events: none;
}
.aurora, .wolken {
  position: absolute;
  inset: auto auto 0 0;
  width: 120%;
  height: 120%;
  filter: blur(40px);
  opacity: 0.7;
}
.aurora.a1 { background: radial-gradient(circle at 18% 28%, rgba(122, 149, 255, 0.8), transparent 18%); transform: translate(-8%, 10%); }
.aurora.a2 { background: radial-gradient(circle at 60% 20%, rgba(72, 214, 255, 0.65), transparent 20%); transform: translate(14%, -8%); }
.aurora.a3 { background: radial-gradient(circle at 78% 32%, rgba(255, 166, 103, 0.38), transparent 20%); transform: translate(8%, 10%); }
.wolken { background: linear-gradient(180deg, rgba(255,255,255,0.12), transparent 42%); opacity: 0.25; }

#bureaublad {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
  max-width: 1200px;
  margin: 0 auto;
}

.glas {
  background: linear-gradient(180deg, rgba(255,255,255,0.18), rgba(255,255,255,0.07));
  border: 1px solid var(--rand);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.28), inset 0 -8px 18px rgba(255,255,255,0.04), var(--shadow);
  -webkit-backdrop-filter: blur(22px) saturate(150%);
  backdrop-filter: blur(22px) saturate(150%);
}

.widget {
  position: relative;
  padding: 18px;
  border-radius: 28px;
  min-height: 160px;
  overflow: hidden;
}
.widget::before {
  content: "";
  position: absolute;
  inset: 1px;
  border-radius: inherit;
  background: linear-gradient(135deg, rgba(255,255,255,0.12), rgba(255,255,255,0.02));
  pointer-events: none;
}
.widget > * { position: relative; z-index: 1; }

.widget-kop-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.widget-kop {
  margin: 0;
  font-size: 0.8rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--zacht);
}
.widget-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4px 8px;
  border-radius: 999px;
  background: rgba(255,255,255,0.08);
  color: var(--tekst);
  font-size: 0.68rem;
  border: 1px solid rgba(255,255,255,0.12);
}
.groet, .klok-tijd, .klok-datum, .widget-sub, .groot-getal { margin: 0; }
.groet {
  font-size: 0.8rem;
  color: var(--zacht);
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
.klok-tijd {
  font-size: clamp(2.5rem, 7vw, 4.2rem);
  line-height: 1;
  margin-top: 10px;
  font-weight: 600;
}
.klok-datum {
  margin-top: 8px;
  color: var(--tekst-2);
}
.groot-getal {
  font-size: clamp(2rem, 5vw, 3rem);
  font-weight: 600;
  margin-top: 10px;
}
.widget-sub {
  margin-top: 10px;
  color: var(--tekst-2);
  line-height: 1.45;
}
.widget-list {
  margin: 12px 0 0 0;
  padding-left: 18px;
  color: var(--tekst);
  line-height: 1.65;
}

#dock {
  position: fixed;
  left: 50%;
  bottom: calc(18px + env(safe-area-inset-bottom));
  transform: translateX(-50%);
  z-index: 8;
  width: min(92vw, 760px);
  display: flex;
  justify-content: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 28px;
  background: rgba(18, 24, 39, 0.36);
  border: 1px solid rgba(255,255,255,0.16);
  box-shadow: 0 16px 42px rgba(0,0,0,0.28);
  -webkit-backdrop-filter: blur(22px) saturate(150%);
  backdrop-filter: blur(22px) saturate(150%);
}
.dock-app {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  min-width: 68px;
  padding: 8px 10px 6px;
  border: 0;
  border-radius: 18px;
  background: transparent;
  color: var(--tekst);
  cursor: pointer;
  transition: transform 0.2s ease, background 0.2s ease;
}
.dock-app:hover, .dock-app:focus-visible {
  background: rgba(255,255,255,0.07);
  transform: translateY(-2px);
  outline: none;
}
.app-icoon {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: 14px;
  font-size: 1.1rem;
  background: linear-gradient(135deg, rgba(255,255,255,0.25), rgba(255,255,255,0.08));
  border: 1px solid rgba(255,255,255,0.18);
}
.dock-naam { font-size: 0.7rem; color: var(--zacht); }

.venster {
  position: fixed;
  left: 50%;
  top: 50%;
  width: min(92vw, 900px);
  max-height: min(78vh, 760px);
  transform: translate(-50%, -50%);
  border-radius: 28px;
  overflow: hidden;
  background: rgba(8, 12, 22, 0.45);
  border: 1px solid rgba(255,255,255,0.18);
  box-shadow: 0 30px 90px rgba(0,0,0,0.5);
  z-index: 7;
}
.venster-balk {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(255,255,255,0.09);
  background: rgba(255,255,255,0.03);
}
.lampjes { display: flex; align-items: center; gap: 8px; }
.lampje {
  width: 11px; height: 11px; border-radius: 50%; display: block; box-shadow: inset 0 1px 2px rgba(255,255,255,0.2);
}
.lampje.rood { background: #ff5f57; }
.lampje.geel { background: #ffbd2f; }
.lampje.groen { background: #28c840; }
.venster-balk h2 {
  flex: 1; margin: 0; font-size: 1rem; text-align: center; color: var(--tekst);
}
.klaar-knop {
  border: 0; border-radius: 12px; padding: 8px 12px; background: rgba(255,255,255,0.08); color: var(--tekst); cursor: pointer;
}
.venster-inhoud { padding: 18px; overflow: auto; }

#venster-laag, #siri-laag {
  position: fixed;
  inset: 0;
  z-index: 6;
  background: rgba(10,12,18,0.28);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s ease;
}
#venster-laag.actief, #siri-laag.actief { opacity: 1; pointer-events: auto; }

.bediening-knop {
  position: fixed;
  right: max(20px, env(safe-area-inset-right));
  top: max(24px, env(safe-area-inset-top));
  z-index: 20;
  width: 52px; height: 52px;
  border-radius: 18px; border: 1px solid rgba(255,255,255,0.18); background: rgba(255,255,255,0.1); color: var(--tekst); cursor: pointer; box-shadow: 0 18px 32px rgba(0,0,0,0.18);
}
.bediening-paneel {
  position: fixed;
  right: max(20px, env(safe-area-inset-right));
  top: calc(88px + env(safe-area-inset-top));
  z-index: 19;
  width: min(300px, calc(100vw - 32px));
  padding: 14px;
  border-radius: 24px;
  opacity: 0;
  transform: translateY(-10px) scale(0.98);
  pointer-events: none;
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.bediening-paneel.actief { opacity: 1; transform: translateY(0) scale(1); pointer-events: auto; }
.bediening-kop {
  font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--zacht); margin-bottom: 12px;
}
.bediening-item {
  width: 100%; border: 0; border-radius: 14px; padding: 12px 14px; margin-top: 8px; text-align: left; background: rgba(255,255,255,0.06); color: var(--tekst); cursor: pointer;
}

.browser-body {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-height: 420px;
}
.tab-balk {
  display: flex;
  align-items: center;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 4px;
}
.tab {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-width: 120px;
  max-width: 180px;
  padding: 8px 10px;
  border-radius: 12px;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.08);
  color: var(--tekst);
  cursor: pointer;
}
.tab.aan {
  background: rgba(124, 200, 255, 0.18);
  border-color: rgba(124, 200, 255, 0.3);
}
.tab span { overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.tab-sluit, .tab-plus {
  border: 0; background: transparent; color: var(--tekst); cursor: pointer; opacity: 0.8; font-size: 1rem;
}
.tab-plus { padding: 6px 8px; }

.adres-balk {
  display: grid;
  grid-template-columns: auto auto minmax(0, 1fr) auto auto;
  gap: 8px; align-items: center;
  padding: 10px 12px;
  border-radius: 16px;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.08);
}
.adres-balk input {
  width: 100%;
  border: 0; background: transparent; color: var(--tekst); font-size: 0.96rem;
}
.adres-balk input::placeholder { color: rgba(237,245,255,0.6); }
.ronde-knop {
  width: 34px; height: 34px; border: 1px solid rgba(255,255,255,0.1); border-radius: 50%; background: rgba(255,255,255,0.04); color: var(--tekst); cursor: pointer;
}

.pagina-vak {
  flex: 1;
  min-height: 360px;
  border-radius: 18px;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.08);
  overflow: hidden;
}
.startpagina, .geblokkeerd {
  display: flex; flex-direction: column; gap: 18px; padding: 20px;
}
.favorieten {
  display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px;
}
.favoriet {
  display: flex; align-items: center; gap: 10px; text-align: left; padding: 12px 12px; border-radius: 14px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); color: var(--tekst); cursor: pointer;
}
.fav-letter {
  display: inline-grid; place-items: center; width: 28px; height: 28px; border-radius: 10px; font-weight: 700;
}
.klein { color: var(--tekst-2); margin: 0; }
.geblokkeerd h3 { margin: 0; }
.groot-icoon { font-size: 2.6rem; margin: 0; }
iframe {
  width: 100%; height: 100%; min-height: 360px; border: 0; background: white;
}
.iframe-hint {
  padding: 12px 16px 16px; margin: 0; color: var(--tekst-2); font-size: 0.85rem;
}

#siri-laag {
  display: flex; align-items: center; justify-content: center;
}
.siri-rand {
  position: absolute; inset: 0; background: radial-gradient(circle at center, rgba(113,224,255,0.14), transparent 52%);
}
.siri-paneel {
  position: relative;
  width: min(560px, calc(100vw - 32px));
  max-height: min(78vh, 720px);
  background: rgba(9, 14, 25, 0.76);
  backdrop-filter: blur(22px);
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 28px;
  box-shadow: 0 26px 90px rgba(0,0,0,0.45);
  display: flex; flex-direction: column; padding: 18px;
}
.siri-gesprek {
  flex: 1; overflow: auto; display: flex; flex-direction: column; gap: 10px; min-height: 180px; max-height: 52vh; padding-right: 4px;
}
.siri-bubbel {
  max-width: 82%; padding: 12px 14px; border-radius: 18px; line-height: 1.45;
}
.siri-bubbel.siri {
  align-self: flex-start; background: rgba(255,255,255,0.08); color: var(--tekst);
}
.siri-bubbel.jij {
  align-self: flex-end; background: linear-gradient(135deg, rgba(124,200,255,0.65), rgba(91,140,255,0.8)); color: #041321; font-weight: 600;
}
.siri-invoer {
  display: grid; grid-template-columns: minmax(0,1fr) auto; gap: 10px; margin-top: 12px;
}
.siri-invoer input {
  width: 100%; padding: 12px 14px; border-radius: 999px; border: 1px solid rgba(255,255,255,0.12); background: rgba(255,255,255,0.04); color: var(--tekst);
}
.siri-bol {
  width: 54px; height: 54px; border-radius: 50%; border: 0; background: linear-gradient(135deg, #7cc8ff, #5b8cff 60%, #bf7aff); box-shadow: 0 14px 30px rgba(91,140,255,0.4); position: relative; cursor: pointer;
}
.siri-bol span {
  position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); width: 8px; height: 8px; border-radius: 50%; background: rgba(255,255,255,0.9);
}
.siri-bol span:nth-child(2) { transform: translate(-50%, -50%) translateY(-10px); }
.siri-bol span:nth-child(3) { transform: translate(-50%, -50%) translateY(10px); }

.knop {
  display: inline-flex; align-items: center; justify-content: center;
  border: 0; border-radius: 12px; padding: 10px 14px; background: linear-gradient(135deg, var(--accent-oranje), var(--accent-oranje-2)); color: #08101b; cursor: pointer; font-weight: 600;
}
.knop.blauw {
  background: linear-gradient(135deg, rgba(124, 200, 255, 0.9), rgba(91, 140, 255, 0.9)); color: #08101b;
}

@media (max-width: 700px) {
  body { padding-left: 12px; padding-right: 12px; }
  #bureaublad { grid-template-columns: 1fr; gap: 12px; }
  #dock { width: min(94vw, 420px); gap: 8px; padding: 10px; }
  .dock-app { min-width: 56px; padding-inline: 6px; }
  .app-icoon { width: 36px; height: 36px; }
  .venster { width: min(96vw, 640px); border-radius: 20px; }
  .adres-balk { grid-template-columns: auto auto 1fr auto; }
  .adres-balk > *:nth-child(5) { display: none; }
}
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { transition-duration: 0.01ms !important; animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; scroll-behavior: auto !important; }
}

.inst-groep { margin-bottom: 18px; }
.inst-groep h3 { margin: 0 0 10px 0; font-size: 1.1rem; }
.inst-rij { display: flex; gap: 10px; align-items: center; margin: 8px 0; }
.inst-rij input[type="text"], .inst-rij input[type="date"], .inst-rij input[type="time"], .inst-rij input[type="email"], .inst-rij input:not([type="checkbox"]) { padding: 8px 10px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.06); background: rgba(0,0,0,0.25); color: var(--tekst); }
.knop { background: linear-gradient(135deg, var(--accent-oranje), var(--accent-oranje-2)); color: #08101b; padding: 8px 12px; border-radius: 8px; border:none; cursor:pointer; }
.inst-tekst { color: var(--zacht); }
.inst-melding { color: var(--accent-oranje); margin: 6px 0 12px 0; }
.schakelaar { width: 20px; height: 20px; }
input:focus, button:focus-visible { outline: 2px solid rgba(124, 200, 255, 0.75); outline-offset: 2px; }
@media (max-width: 390px) { .dock-naam { display: none; } #dock { justify-content: space-evenly; } }
