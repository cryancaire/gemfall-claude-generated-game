export class TitleScreen {
  constructor(onNewGame) {
    this._el = document.getElementById('title-screen');
    document.getElementById('ts-new-game-btn')
      .addEventListener('click', () => onNewGame());
  }

  setVisible(v) {
    this._el.classList.toggle('screen--hidden', !v);
  }
}
