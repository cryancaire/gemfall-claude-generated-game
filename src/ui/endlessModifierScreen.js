import { ENDLESS_MODIFIERS } from '../data/endlessModifiers.js';

// Shown at each 10-minute milestone in endless mode.
// Player picks one modifier from a random selection of 3 — free reward.
export class EndlessModifierScreen {
  constructor(onSelect) {
    this._el          = document.getElementById('endless-modifier-screen');
    this._cardsEl     = document.getElementById('endless-mod-cards');
    this._milestoneEl = document.getElementById('endless-mod-milestone');
    this._onSelect    = onSelect;
    this._player      = null;
  }

  show(player, milestoneNumber) {
    this._player = player;
    this._milestoneEl.textContent = `${milestoneNumber * 10}-Minute Milestone`;
    this._render();
    this.setVisible(true);
  }

  setVisible(v) {
    this._el.classList.toggle('screen--hidden', !v);
  }

  _render() {
    this._cardsEl.innerHTML = '';
    const picks = [...ENDLESS_MODIFIERS].sort(() => Math.random() - 0.5).slice(0, 3);

    for (const mod of picks) {
      const card = document.createElement('div');
      card.className = 'mod-card endless-milestone-card';
      card.innerHTML = `
        <div class="mod-card-icon">${mod.icon}</div>
        <div class="mod-card-name">${mod.name}</div>
        <div class="mod-card-desc">${mod.description.replace(/\n/g, '<br>')}</div>
        <div class="endless-milestone-badge">FREE — Milestone Reward</div>
      `;
      card.addEventListener('click', () => {
        mod.apply(this._player);
        this.setVisible(false);
        this._onSelect(mod);
      });
      this._cardsEl.appendChild(card);
    }
  }
}
