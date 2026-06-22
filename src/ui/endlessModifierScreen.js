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
    this._player     = player;
    this._gpFocusIdx = 0;
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
    const cards = this._cardsEl.querySelectorAll('.mod-card');
    cards.forEach((el, i) => el.classList.toggle('gp-focus', i === 0));
  }

  gamepadNavigate(input) {
    const cards = Array.from(this._cardsEl.querySelectorAll('.mod-card'));
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
