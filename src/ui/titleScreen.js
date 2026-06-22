import { MetaProgress } from '../metaProgress.js';

export class TitleScreen {
  constructor(onNewGame, onShop) {
    this._el       = document.getElementById('title-screen');
    this._shardsEl = document.getElementById('ts-shards-val');
    document.getElementById('ts-new-game-btn').addEventListener('click', () => onNewGame());
    document.getElementById('ts-shop-btn').addEventListener('click', () => onShop());
  }

  setVisible(v) {
    this._el.classList.toggle('screen--hidden', !v);
    if (v && this._shardsEl) {
      this._shardsEl.textContent = MetaProgress.shards.toLocaleString();
    }
  }
}
