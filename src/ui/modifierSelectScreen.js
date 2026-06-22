import { MODIFIERS } from '../data/modifiers.js';

export class ModifierSelectScreen {
  constructor(onSelect) {
    this._el       = document.getElementById('modifier-select-screen');
    this._cardsEl  = document.getElementById('mod-cards');
    this._onSelect = onSelect;

    document.getElementById('mod-skip-btn').addEventListener('click', () => {
      this.setVisible(false);
      onSelect(null);
    });
  }

  show() {
    this._gpFocusIdx = 0;
    this._render();
    this.setVisible(true);
  }

  setVisible(v) {
    this._el.classList.toggle('screen--hidden', !v);
  }

  _render() {
    this._cardsEl.innerHTML = '';
    for (const mod of MODIFIERS) {
      const card = document.createElement('div');
      card.className = 'mod-card';
      card.innerHTML = `
        <div class="mod-card-icon">${mod.icon}</div>
        <div class="mod-card-name">${mod.name}</div>
        <div class="mod-card-desc">${mod.description.replace(/\n/g, '<br>')}</div>
        <div class="mod-card-bonus">+${Math.round(mod.shardBonus * 100)}% ✦ Shards</div>
      `;
      card.addEventListener('click', () => {
        this.setVisible(false);
        this._onSelect(mod);
      });
      this._cardsEl.appendChild(card);
    }
    // Skip button gets focus index after all cards
    const cards = this._cardsEl.querySelectorAll('.mod-card');
    cards.forEach((el, i) => el.classList.toggle('gp-focus', i === 0));
  }

  gamepadNavigate(input) {
    const cards  = Array.from(this._cardsEl.querySelectorAll('.mod-card'));
    const skipEl = document.getElementById('mod-skip-btn');
    const items  = skipEl ? [...cards, skipEl] : cards;
    if (!items.length) return;
    if (this._gpFocusIdx === undefined || this._gpFocusIdx >= items.length) this._gpFocusIdx = 0;

    if (input.wasPressed('gp_left') || input.wasPressed('gp_up')) {
      this._gpFocusIdx = (this._gpFocusIdx - 1 + items.length) % items.length;
    } else if (input.wasPressed('gp_right') || input.wasPressed('gp_down')) {
      this._gpFocusIdx = (this._gpFocusIdx + 1) % items.length;
    } else if (input.wasPressed('gp_confirm')) {
      items[this._gpFocusIdx]?.click();
      return;
    }
    items.forEach((el, i) => el.classList.toggle('gp-focus', i === this._gpFocusIdx));
  }
}
