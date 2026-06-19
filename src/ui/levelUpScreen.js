import { POWERUP_POOL, RARITY_COLOR } from '../data/powerups.js';

export class LevelUpScreen {
  constructor(onPowerupChosen) {
    this._el       = document.getElementById('levelup-screen');
    this._levelEl  = document.getElementById('lu-level');
    this._cardsEl  = document.getElementById('lu-cards');
    this._onChosen = onPowerupChosen;
  }

  show(playerLevel) {
    this._levelEl.textContent = `Level ${playerLevel}`;
    this._renderCards(this._pickThree());
    this.setVisible(true);
  }

  _pickThree() {
    return [...POWERUP_POOL]
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);
  }

  _renderCards(picks) {
    this._cardsEl.innerHTML = '';
    for (const p of picks) {
      const btn = document.createElement('button');
      btn.className = 'lu-card';
      btn.style.setProperty('--rarity-color', RARITY_COLOR[p.rarity] ?? '#aaa');
      btn.innerHTML = `
        <span class="lu-card-icon">${p.icon}</span>
        <span class="lu-card-rarity">${p.rarity}</span>
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
