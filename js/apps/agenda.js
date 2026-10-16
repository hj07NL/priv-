... (rest of file above unchanged)

Prive.registreer({
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
