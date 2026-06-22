import { MetaProgress } from '../metaProgress.js';

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
    id:             'desert',
    name:           'Sunken Sands',
    icon:           '🏜️',
    color:          '#e8a030',
    difficulty:     'Adept',
    description:    'Sweeping dunes & crumbling sandstone pillars\nGoblins and Spikebots roam the wastes',
    requiresUnlock: 'unlock_desert',
    unlockCost:     200,
  },
  {
    id:             'cavern',
    name:           'Volcanic Cavern',
    icon:           '🌋',
    color:          '#ff5533',
    difficulty:     'Veteran',
    description:    'Jagged lava terrain & stone ledges\nSpikebots and Specters dominate',
    requiresUnlock: 'unlock_volcano',
    unlockCost:     400,
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

export function getAvailableMapIds() {
  return MAPS
    .filter(m => m.id !== null && (!m.requiresUnlock || MetaProgress.isUnlocked(m.requiresUnlock)))
    .map(m => m.id);
}

export class MapSelectScreen {
  constructor(onChosen, onBack) {
    this._el        = document.getElementById('map-select-screen');
    this._cardsEl   = document.getElementById('ms-cards');
    this._hintEl    = document.getElementById('ms-locked-hint');
    this._onChosen  = onChosen;
    document.getElementById('ms-back-btn').addEventListener('click', () => onBack());
  }

  show() {
    this._render();
    this.setVisible(true);
  }

  _render() {
    this._cardsEl.innerHTML = '';

    const unlockedReal = MAPS.filter(m => m.id !== null && (!m.requiresUnlock || MetaProgress.isUnlocked(m.requiresUnlock)));
    const lockedCount  = MAPS.filter(m => m.id !== null && m.requiresUnlock && !MetaProgress.isUnlocked(m.requiresUnlock)).length;
    const showRandom   = unlockedReal.length >= 2;

    const toShow = [...unlockedReal];
    if (showRandom) toShow.push(MAPS.find(m => m.id === null));

    for (const map of toShow) {
      const btn = document.createElement('button');
      btn.className = 'lu-card ms-card';
      btn.style.setProperty('--rarity-color', map.color);
      btn.innerHTML = `
        <span class="lu-card-icon ms-card-icon">${map.icon}</span>
        <span class="ms-card-difficulty">${map.difficulty}</span>
        <span class="lu-card-name">${map.name}</span>
        <span class="lu-card-desc">${map.description.replace(/\n/g, '<br>')}</span>
      `;
      btn.addEventListener('click', () => {
        this.setVisible(false);
        this._onChosen(map.id);
      });
      this._cardsEl.appendChild(btn);
    }

    this._hintEl.textContent = lockedCount > 0
      ? `🔒 ${lockedCount} world${lockedCount !== 1 ? 's' : ''} still to discover — visit the Shop`
      : '';
    this._hintEl.style.display = lockedCount > 0 ? '' : 'none';
  }

  setVisible(v) {
    this._el.classList.toggle('screen--hidden', !v);
  }
}
