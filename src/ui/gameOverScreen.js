export class GameOverScreen {
  constructor(onRestart) {
    this._el      = document.getElementById('gameover-screen');
    this._statsEl = document.getElementById('go-stats');
    document.getElementById('go-retry-btn')
      .addEventListener('click', () => {
        this.setVisible(false);
        onRestart();
      });
  }

  show(player, entities) {
    this._statsEl.innerHTML = `
      <div class="go-stat"><span class="go-stat-label">Level Reached</span><span class="go-stat-val">${player.level}</span></div>
      <div class="go-stat"><span class="go-stat-label">XP Collected</span><span class="go-stat-val">${player.totalXpCollected}</span></div>
      <div class="go-stat"><span class="go-stat-label">Enemies Defeated</span><span class="go-stat-val">${entities.enemiesDefeated}</span></div>
    `;
    this.setVisible(true);
  }

  setVisible(v) {
    this._el.classList.toggle('screen--hidden', !v);
  }
}
