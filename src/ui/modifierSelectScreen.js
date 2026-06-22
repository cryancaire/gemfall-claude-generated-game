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
  }
}
