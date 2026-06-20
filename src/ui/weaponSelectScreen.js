import { POWERUP_POOL, RARITY_COLOR } from '../data/powerups.js';

export class WeaponSelectScreen {
  constructor(onChosen) {
    this._el      = document.getElementById('weapon-select-screen');
    this._cardsEl = document.getElementById('ws-cards');
    this._onChosen = onChosen;
  }

  show() {
    const weapons  = POWERUP_POOL.filter(p => p.weaponId);
    const shuffled = [...weapons].sort(() => Math.random() - 0.5);
    this._renderCards(shuffled.slice(0, 2));
    this.setVisible(true);
  }

  _renderCards(picks) {
    this._cardsEl.innerHTML = '';
    for (const p of picks) {
      const btn = document.createElement('button');
      btn.className = 'lu-card ws-card';
      btn.style.setProperty('--rarity-color', RARITY_COLOR[p.rarity] ?? '#aaa');

      const rarityLabel = p.rarity.charAt(0).toUpperCase() + p.rarity.slice(1);
      btn.innerHTML = `
        <span class="lu-card-icon">${p.icon}</span>
        <span class="lu-card-rarity">${rarityLabel}</span>
        <span class="lu-card-name">${p.name}</span>
        <span class="lu-card-desc">${p.description.replace(/\n/g, '<br>')}</span>
      `;
      btn.addEventListener('click', () => {
        this.setVisible(false);
        this._onChosen(p);
      });
      this._cardsEl.appendChild(btn);
    }
  }

  setVisible(v) {
    this._el.classList.toggle('screen--hidden', !v);
  }
}
