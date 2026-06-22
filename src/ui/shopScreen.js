import { MetaProgress } from '../metaProgress.js';
import { SHOP_ITEMS }   from '../data/shopItems.js';

const CATEGORY_LABELS = {
  stat:    'Permanent Upgrades',
  map:     'Map Unlocks',
  weapon:  'Weapon Unlocks',
  powerup: 'Power Card Unlocks',
};

// Reuse the shared tooltip element (lives on <body>)
const _tip = document.getElementById('ps-tooltip');

function _showTip(el, text) {
  _tip.textContent = text;
  _tip.style.display = 'block';
  const r  = el.getBoundingClientRect();
  const tw = _tip.offsetWidth;
  const th = _tip.offsetHeight;
  let left = r.left + r.width / 2 - tw / 2;
  let top  = r.top - th - 9;
  left = Math.max(8, Math.min(left, window.innerWidth  - tw - 8));
  top  = Math.max(8, Math.min(top,  window.innerHeight - th - 8));
  _tip.style.left = `${left}px`;
  _tip.style.top  = `${top}px`;
}

function _hideTip() { _tip.style.display = 'none'; }

export class ShopScreen {
  constructor(onBack) {
    this._el       = document.getElementById('shop-screen');
    this._bodyEl   = document.getElementById('shop-body');
    this._shardsEl = document.getElementById('shop-shards-val');
    document.getElementById('shop-back-btn').addEventListener('click', () => { _hideTip(); onBack(); });
  }

  show() {
    this._render();
    this.setVisible(true);
  }

  setVisible(v) {
    this._el.classList.toggle('screen--hidden', !v);
    if (!v) _hideTip();
  }

  _render() {
    this._shardsEl.textContent = MetaProgress.shards.toLocaleString();
    this._bodyEl.innerHTML = '';

    for (const [key, label] of Object.entries(CATEGORY_LABELS)) {
      const items = SHOP_ITEMS.filter(i => i.category === key);
      if (items.length === 0) continue;

      const section = document.createElement('div');
      section.className = 'shop-section';

      const heading = document.createElement('h3');
      heading.className = 'shop-section-title';
      heading.textContent = label;
      section.appendChild(heading);

      for (const item of items) section.appendChild(this._createRow(item));
      this._bodyEl.appendChild(section);
    }
  }

  _createRow(item) {
    const count     = MetaProgress.getPurchaseCount(item.id);
    const isOwned   = !item.repeatable && MetaProgress.isUnlocked(item.id);
    const isMax     = item.repeatable  && count >= item.maxStack;
    const cost      = item.repeatable
      ? item.baseCost + count * item.costScale
      : item.cost;
    const canAfford = !isOwned && !isMax && MetaProgress.shards >= cost;
    const done      = isOwned || isMax;

    const row = document.createElement('div');
    row.className = 'shop-row' + (done ? ' shop-row--done' : '');
    row.addEventListener('mouseenter', () => _showTip(row, item.description));
    row.addEventListener('mouseleave', _hideTip);

    // Icon + name
    const label = document.createElement('div');
    label.className = 'shop-row-label';
    label.innerHTML = `<span class="shop-row-icon">${item.icon}</span>
                       <span class="shop-row-name">${item.name}</span>`;
    row.appendChild(label);

    // Current stat value (stat items only)
    if (item.currentStat) {
      const stat = document.createElement('span');
      stat.className = 'shop-stat';
      stat.textContent = item.currentStat(count);
      row.appendChild(stat);
    }

    // Stack badge (repeatable only)
    if (item.repeatable && item.maxStack > 1) {
      const stack = document.createElement('span');
      stack.className = 'shop-stack';
      stack.textContent = `${count} / ${item.maxStack}`;
      row.appendChild(stack);
    }

    // Right side: status label or buy button
    if (isOwned) {
      const s = document.createElement('span');
      s.className = 'shop-status shop-status--owned';
      s.textContent = 'OWNED';
      row.appendChild(s);
    } else if (isMax) {
      const s = document.createElement('span');
      s.className = 'shop-status shop-status--max';
      s.textContent = 'MAX';
      row.appendChild(s);
    } else {
      const btn = document.createElement('button');
      btn.className = 'shop-buy-btn' + (canAfford ? '' : ' shop-buy-btn--poor');
      btn.textContent = `✦ ${cost}`;
      btn.addEventListener('click', e => {
        e.stopPropagation();
        if (MetaProgress.purchase(item)) this._render();
      });
      row.appendChild(btn);
    }

    return row;
  }
}
