import { MetaProgress } from '../metaProgress.js';
import { SHOP_ITEMS }   from '../data/shopItems.js';

const CATEGORIES = [
  { key: 'stat',    label: 'Stat Upgrades', icon: '⚔️' },
  { key: 'map',     label: 'Map Unlocks',   icon: '🗺️' },
  { key: 'weapon',  label: 'Weapons',       icon: '⚡' },
  { key: 'powerup', label: 'Power Cards',   icon: '✨' },
  { key: 'endless', label: 'Endless Mode',  icon: '♾️' },
];

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
    this._el        = document.getElementById('shop-screen');
    this._sidebarEl = document.getElementById('shop-sidebar');
    this._gridEl    = document.getElementById('shop-grid');
    this._detailEl  = document.getElementById('shop-detail');
    this._shardsEl  = document.getElementById('shop-shards-val');
    this._activeCategory   = 'stat';
    this._selectedItem     = null;
    this._respecConfirming = false;
    document.getElementById('shop-back-btn').addEventListener('click', () => { _hideTip(); onBack(); });
  }

  show() {
    this._selectedItem     = null;
    this._respecConfirming = false;
    this._render();
    this.setVisible(true);
  }

  setVisible(v) {
    this._el.classList.toggle('screen--hidden', !v);
    if (!v) _hideTip();
  }

  _render() {
    this._shardsEl.textContent = MetaProgress.shards.toLocaleString();
    this._renderSidebar();
    this._renderGrid();
    this._renderDetail();
  }

  _renderSidebar() {
    this._sidebarEl.innerHTML = '';
    for (const cat of CATEGORIES) {
      const hasVisible = SHOP_ITEMS.some(i =>
        i.category === cat.key &&
        (!i.requiresVictory || MetaProgress.hasVictory(i.requiresVictory))
      );
      if (!hasVisible) continue;
      const btn = document.createElement('button');
      btn.className = 'shop-cat-btn' + (this._activeCategory === cat.key ? ' shop-cat-btn--active' : '');
      btn.innerHTML = `<span class="shop-cat-icon">${cat.icon}</span><span>${cat.label}</span>`;
      btn.addEventListener('click', () => {
        this._activeCategory   = cat.key;
        this._selectedItem     = null;
        this._respecConfirming = false;
        this._render();
      });
      this._sidebarEl.appendChild(btn);
    }

    // Respec button — pinned at bottom of sidebar
    const respecCost  = MetaProgress.calcRespecCost();
    const hasAnything = MetaProgress.hasAnyPurchases();
    const totalSpent  = hasAnything ? MetaProgress.calcTotalSpent() : 0;
    const canAfford   = hasAnything && MetaProgress.shards >= respecCost;

    const respecBtn = document.createElement('button');
    respecBtn.className = 'shop-respec-btn' + (this._respecConfirming ? ' shop-respec-btn--confirm' : '');

    if (this._respecConfirming) {
      const net = totalSpent - respecCost;
      const netLabel = net >= 0 ? `Refund: ✦ ${net}` : `Net cost: ✦ ${-net}`;
      respecBtn.innerHTML = `<span>⚠ Confirm Reset<br><small>${netLabel}</small></span>`;
      respecBtn.addEventListener('click', () => {
        MetaProgress.respec();
        this._respecConfirming = false;
        this._selectedItem     = null;
        this._activeCategory   = 'stat';
        this._render();
      });
    } else {
      const feeLabel = !hasAnything  ? 'Nothing to reset'
                     : !canAfford    ? `Need ✦ ${respecCost}`
                     :                 `Fee: ✦ ${respecCost}`;
      respecBtn.innerHTML = `<span class="shop-cat-icon">↺</span><span>Reset All<br><small>${feeLabel}</small></span>`;
      respecBtn.disabled  = !canAfford;
      respecBtn.addEventListener('click', () => {
        this._respecConfirming = true;
        this._renderSidebar();
      });
    }

    this._sidebarEl.appendChild(respecBtn);
  }

  _renderGrid() {
    this._gridEl.innerHTML = '';
    const items = SHOP_ITEMS.filter(i =>
      i.category === this._activeCategory &&
      (!i.requiresVictory || MetaProgress.hasVictory(i.requiresVictory))
    );
    for (const item of items) this._gridEl.appendChild(this._createTile(item));
  }

  _createTile(item) {
    const count     = MetaProgress.getPurchaseCount(item.id);
    const isOwned   = !item.repeatable && MetaProgress.isUnlocked(item.id);
    const isMax     = item.repeatable  && count >= item.maxStack;
    const done      = isOwned || isMax;
    const isSelected = this._selectedItem?.id === item.id;
    const cost      = item.repeatable ? item.baseCost + count * item.costScale : item.cost;
    const canAfford = !done && MetaProgress.shards >= cost;

    const tile = document.createElement('div');
    tile.className = 'shop-tile'
      + (done       ? ' shop-tile--done'     : '')
      + (isSelected ? ' shop-tile--selected' : '')
      + (canAfford  ? ' shop-tile--afford'   : '');

    const icon = document.createElement('div');
    icon.className = 'shop-tile-icon';
    icon.textContent = item.icon;

    const name = document.createElement('div');
    name.className = 'shop-tile-name';
    name.textContent = item.name;

    const badge = document.createElement('div');
    if (isOwned) {
      badge.className = 'shop-tile-badge shop-tile-badge--owned';
      badge.textContent = 'OWNED';
    } else if (isMax) {
      badge.className = 'shop-tile-badge shop-tile-badge--max';
      badge.textContent = 'MAX';
    } else {
      badge.className = 'shop-tile-badge' + (canAfford ? ' shop-tile-badge--cost' : ' shop-tile-badge--poor');
      badge.textContent = `✦ ${cost}`;
    }

    tile.appendChild(icon);
    tile.appendChild(name);
    if (item.repeatable && item.maxStack > 1) {
      const stack = document.createElement('div');
      stack.className = 'shop-tile-stack';
      stack.textContent = `${count} / ${item.maxStack}`;
      tile.appendChild(stack);
    }
    tile.appendChild(badge);

    tile.addEventListener('mouseenter', () => _showTip(tile, item.description));
    tile.addEventListener('mouseleave', _hideTip);
    tile.addEventListener('click', () => {
      _hideTip();
      this._selectedItem = item;
      this._renderGrid();
      this._renderDetail();
    });

    return tile;
  }

  _renderDetail() {
    this._detailEl.innerHTML = '';

    if (!this._selectedItem) {
      const hint = document.createElement('span');
      hint.className = 'shop-detail-hint';
      hint.textContent = 'Select an item to view details';
      this._detailEl.appendChild(hint);
      return;
    }

    const item    = this._selectedItem;
    const count   = MetaProgress.getPurchaseCount(item.id);
    const isOwned = !item.repeatable && MetaProgress.isUnlocked(item.id);
    const isMax   = item.repeatable  && count >= item.maxStack;
    const cost    = item.repeatable  ? item.baseCost + count * item.costScale : item.cost;
    const canAfford = !isOwned && !isMax && MetaProgress.shards >= cost;

    const desc = document.createElement('div');
    desc.className = 'shop-detail-desc';
    desc.innerHTML = item.description.replace(/\n/g, '<br>');
    this._detailEl.appendChild(desc);

    if (item.currentStat) {
      const stat = document.createElement('span');
      stat.className = 'shop-stat';
      stat.textContent = item.currentStat(count);
      this._detailEl.appendChild(stat);
    }

    if (item.repeatable && item.maxStack > 1) {
      const stack = document.createElement('span');
      stack.className = 'shop-stack';
      stack.textContent = `${count} / ${item.maxStack}`;
      this._detailEl.appendChild(stack);
    }

    if (isOwned) {
      const s = document.createElement('span');
      s.className = 'shop-status shop-status--owned';
      s.textContent = 'OWNED';
      this._detailEl.appendChild(s);
    } else if (isMax) {
      const s = document.createElement('span');
      s.className = 'shop-status shop-status--max';
      s.textContent = 'MAX';
      this._detailEl.appendChild(s);
    } else {
      const btn = document.createElement('button');
      btn.className = 'shop-buy-btn' + (canAfford ? '' : ' shop-buy-btn--poor');
      btn.textContent = `✦ ${cost}  BUY`;
      btn.addEventListener('click', () => {
        if (MetaProgress.purchase(item)) this._render();
      });
      this._detailEl.appendChild(btn);
    }
  }
}
