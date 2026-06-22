import { ENDLESS_MODIFIERS } from '../data/endlessModifiers.js';
import { MetaProgress } from '../metaProgress.js';

// In-run shard shop — spend meta shards during a run to buy powerful modifiers.
// Accessible via the 'B' key during PLAYING state.
export class InRunShopScreen {
  constructor(onClose) {
    this._el       = document.getElementById('inrun-shop-screen');
    this._gridEl   = document.getElementById('inrun-shop-grid');
    this._shardsEl = document.getElementById('inrun-shop-shards');
    this._onClose  = onClose;
    this._player   = null;

    document.getElementById('inrun-shop-close-btn').addEventListener('click', () => {
      this.setVisible(false);
      onClose();
    });
  }

  show(player) {
    this._player = player;
    this._render();
    this.setVisible(true);
  }

  setVisible(v) {
    this._el.classList.toggle('screen--hidden', !v);
  }

  _render() {
    this._shardsEl.textContent = MetaProgress.shards.toLocaleString();
    this._gridEl.innerHTML = '';

    for (const mod of ENDLESS_MODIFIERS) {
      const cost      = mod.shardCost ?? 100;
      const canAfford = MetaProgress.shards >= cost;

      const card = document.createElement('div');
      card.className = 'inrun-shop-card' + (canAfford ? '' : ' inrun-shop-card--poor');
      card.innerHTML = `
        <div class="inrun-shop-card-icon">${mod.icon}</div>
        <div class="inrun-shop-card-name">${mod.name}</div>
        <div class="inrun-shop-card-desc">${mod.description.replace(/\n/g, '<br>')}</div>
        <div class="inrun-shop-card-cost ${canAfford ? 'inrun-shop-card-cost--ok' : 'inrun-shop-card-cost--poor'}">✦ ${cost}</div>
      `;
      if (canAfford) {
        card.addEventListener('click', () => {
          if (MetaProgress.shards < cost) return;
          MetaProgress.shards -= cost;
          MetaProgress.save();
          mod.apply(this._player);
          this.setVisible(false);
          this._onClose();
        });
      }
      this._gridEl.appendChild(card);
    }
  }
}
