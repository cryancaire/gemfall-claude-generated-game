import { POWERUP_POOL, RARITY_COLOR } from '../data/powerups.js';
import { MetaProgress } from '../metaProgress.js';

export class WeaponSelectScreen {
  constructor(onChosen) {
    this._el      = document.getElementById('weapon-select-screen');
    this._cardsEl = document.getElementById('ws-cards');
    this._onChosen = onChosen;
  }

  show() {
    const weapons  = POWERUP_POOL.filter(p =>
      p.weaponId &&
      (p.rarity === 'common' || (p.requiresUnlock && MetaProgress.isUnlocked(p.requiresUnlock)))
    );
    const shuffled = [...weapons].sort(() => Math.random() - 0.5);
    const count    = 1 + MetaProgress.getPurchaseCount('starting_choices');
    this._gpFocusIdx = 0;
    this._renderCards(shuffled.slice(0, count));
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
    // Apply initial gamepad focus
    const cards = this._cardsEl.querySelectorAll('.lu-card');
    cards.forEach((el, i) => el.classList.toggle('gp-focus', i === 0));
  }

  setVisible(v) {
    this._el.classList.toggle('screen--hidden', !v);
  }

  gamepadNavigate(input) {
    const cards = Array.from(this._cardsEl.querySelectorAll('.lu-card'));
    if (!cards.length) return;
    if (this._gpFocusIdx === undefined || this._gpFocusIdx >= cards.length) this._gpFocusIdx = 0;

    if (input.wasPressed('gp_left') || input.wasPressed('gp_up')) {
      this._gpFocusIdx = (this._gpFocusIdx - 1 + cards.length) % cards.length;
    } else if (input.wasPressed('gp_right') || input.wasPressed('gp_down')) {
      this._gpFocusIdx = (this._gpFocusIdx + 1) % cards.length;
    } else if (input.wasPressed('gp_confirm')) {
      cards[this._gpFocusIdx]?.click();
      return;
    }
    cards.forEach((el, i) => el.classList.toggle('gp-focus', i === this._gpFocusIdx));
  }
}
