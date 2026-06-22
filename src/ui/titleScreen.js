import { MetaProgress } from '../metaProgress.js';

export class TitleScreen {
  constructor(onNewGame, onShop) {
    this._el       = document.getElementById('title-screen');
    this._shardsEl = document.getElementById('ts-shards-val');

    document.getElementById('ts-new-game-btn').addEventListener('click', () => onNewGame());
    document.getElementById('ts-shop-btn').addEventListener('click', () => onShop());

    const infoOverlay = document.getElementById('info-overlay');
    document.getElementById('ts-info-btn').addEventListener('click', () => {
      infoOverlay.classList.add('info-visible');
    });
    document.getElementById('info-close-btn').addEventListener('click', () => {
      infoOverlay.classList.remove('info-visible');
    });
    infoOverlay.addEventListener('click', e => {
      if (e.target === infoOverlay) infoOverlay.classList.remove('info-visible');
    });
    window.addEventListener('keydown', e => {
      if (e.key === 'Escape') infoOverlay.classList.remove('info-visible');
    });
  }

  setVisible(v) {
    this._el.classList.toggle('screen--hidden', !v);
    if (v && this._shardsEl) {
      this._shardsEl.textContent = MetaProgress.shards.toLocaleString();
    }
  }
}
