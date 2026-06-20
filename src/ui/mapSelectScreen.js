const MAPS = [
  {
    id:          'grasslands',
    name:        'Grasslands',
    icon:        '🌿',
    color:       '#33ee88',
    difficulty:  'Beginner',
    description: 'Gentle rolling hills & floating platforms\nSlimes, Goblins, and wandering Specters',
  },
  {
    id:          'cavern',
    name:        'Volcanic Cavern',
    icon:        '🌋',
    color:       '#ff5533',
    difficulty:  'Veteran',
    description: 'Jagged lava terrain & stone ledges\nSpikebots and Specters dominate',
  },
  {
    id:          null,
    name:        'Random',
    icon:        '🎲',
    color:       '#aa66ff',
    difficulty:  '???',
    description: 'Let fate decide your world\nA different adventure each run',
  },
];

export class MapSelectScreen {
  constructor(onChosen) {
    this._el      = document.getElementById('map-select-screen');
    this._cardsEl = document.getElementById('ms-cards');
    this._onChosen = onChosen;
  }

  show() {
    this._render();
    this.setVisible(true);
  }

  _render() {
    this._cardsEl.innerHTML = '';
    for (const map of MAPS) {
      const btn = document.createElement('button');
      btn.className = 'lu-card ms-card';
      btn.style.setProperty('--rarity-color', map.color);
      btn.innerHTML = `
        <span class="lu-card-icon">${map.icon}</span>
        <span class="lu-card-rarity">${map.difficulty}</span>
        <span class="lu-card-name">${map.name}</span>
        <span class="lu-card-desc">${map.description.replace(/\n/g, '<br>')}</span>
      `;
      btn.addEventListener('click', () => {
        this.setVisible(false);
        this._onChosen(map.id);
      });
      this._cardsEl.appendChild(btn);
    }
  }

  setVisible(v) {
    this._el.classList.toggle('screen--hidden', !v);
  }
}
