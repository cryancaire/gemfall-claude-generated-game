import { MetaProgress } from '../metaProgress.js';
import { SHOP_ITEMS }   from '../data/shopItems.js';

const CATEGORY_LABELS = {
  stat:    'Permanent Upgrades',
  map:     'Map Unlocks',
  weapon:  'Weapon Unlocks',
  powerup: 'Power Card Unlocks',
};

export class ShopScreen {
  constructor(onBack) {
    this._el       = document.getElementById('shop-screen');
    this._bodyEl   = document.getElementById('shop-body');
    this._shardsEl = document.getElementById('shop-shards-val');
    document.getElementById('shop-back-btn').addEventListener('click', () => onBack());
  }

  show() {
    this._render();
    this.setVisible(true);
  }

  setVisible(v) {
    this._el.classList.toggle('screen--hidden', !v);
  }

  _render() {
    this._shardsEl.textContent = MetaProgress.shards.toLocaleString();
    this._bodyEl.innerHTML = '';

    for (const [key, label] of Object.entries(CATEGORY_LABELS)) {
      const items = SHOP_ITEMS.filter(item => item.category === key);
      if (items.length === 0) continue;

      const section = document.createElement('div');
      section.className = 'shop-section';

      const heading = document.createElement('h3');
      heading.className = 'shop-section-title';
      heading.textContent = label;
      section.appendChild(heading);

      const grid = document.createElement('div');
      grid.className = 'shop-grid';
      for (const item of items) grid.appendChild(this._createCard(item));
      section.appendChild(grid);

      this._bodyEl.appendChild(section);
    }
  }

  _createCard(item) {
    const count   = MetaProgress.getPurchaseCount(item.id);
    const isOwned = !item.repeatable && MetaProgress.isUnlocked(item.id);
    const isMax   = item.repeatable  && count >= item.maxStack;
    const cost    = item.repeatable
      ? item.baseCost + count * item.costScale
      : item.cost;
    const canAfford = !isOwned && !isMax && MetaProgress.shards >= cost;

    const card = document.createElement('div');
    card.className = 'shop-card' + (isOwned || isMax ? ' shop-card--done' : '');

    let badgeHtml = '';
    if (isOwned)  badgeHtml = '<span class="shop-badge shop-badge--owned">OWNED</span>';
    else if (isMax) badgeHtml = '<span class="shop-badge shop-badge--max">MAX</span>';

    const stackHtml = (item.repeatable && item.maxStack > 1)
      ? `<span class="shop-stack">${count} / ${item.maxStack}</span>` : '';

    let btnHtml;
    if (isOwned || isMax) {
      btnHtml = `<button class="shop-buy-btn" disabled>—</button>`;
    } else {
      const cls = canAfford ? 'shop-buy-btn' : 'shop-buy-btn shop-buy-btn--poor';
      btnHtml = `<button class="${cls}">✦ ${cost}</button>`;
    }

    card.innerHTML = `
      ${badgeHtml}
      <span class="shop-card-icon">${item.icon}</span>
      <span class="shop-card-name">${item.name}</span>
      ${stackHtml}
      <span class="shop-card-desc">${item.description.replace(/\n/g, '<br>')}</span>
      ${btnHtml}
    `;

    if (!isOwned && !isMax) {
      card.querySelector('.shop-buy-btn').addEventListener('click', () => {
        if (MetaProgress.purchase(item)) this._render();
      });
    }

    return card;
  }
}
