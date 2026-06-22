import { CLASSES } from '../data/classes.js';

export class ClassSelectScreen {
  constructor(onSelect) {
    this._el       = document.getElementById('class-select-screen');
    this._cardsEl  = document.getElementById('cs-cards');
    this._onSelect = onSelect;

    document.getElementById('cs-free-build-btn').addEventListener('click', () => {
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
    for (const cls of CLASSES) {
      const card = document.createElement('div');
      card.className = 'cs-card';
      card.style.setProperty('--cs-color', cls.color);
      card.innerHTML = `
        <div class="cs-card-icon">${cls.icon}</div>
        <div class="cs-card-name">${cls.name}</div>
        <div class="cs-card-desc">${cls.description.replace(/\n/g, '<br>')}</div>
      `;
      card.addEventListener('click', () => {
        this.setVisible(false);
        this._onSelect(cls);
      });
      this._cardsEl.appendChild(card);
    }
    const cards = this._cardsEl.querySelectorAll('.cs-card');
    cards.forEach((el, i) => el.classList.toggle('gp-focus', i === 0));
  }

  gamepadNavigate(input) {
    const cards   = Array.from(this._cardsEl.querySelectorAll('.cs-card'));
    const freeBtn = document.getElementById('cs-free-build-btn');
    const items   = freeBtn ? [...cards, freeBtn] : cards;
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
