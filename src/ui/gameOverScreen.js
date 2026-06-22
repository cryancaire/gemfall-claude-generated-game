import { MetaProgress } from '../metaProgress.js';

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

  show(player, entities, playTime = 0) {
    const earned = MetaProgress.calcShards({
      enemiesDefeated:  entities.enemiesDefeated,
      secondsSurvived:  Math.floor(playTime),
      totalXpCollected: player.totalXpCollected,
      weaponsCount:     player.weapons.length,
      upgradesCount:    player.acquiredUpgrades.length,
      isVictory:        false,
    });
    MetaProgress.addShards(earned);

    const m   = Math.floor(playTime / 60);
    const s   = Math.floor(playTime) % 60;
    const timeStr = `${m}:${s.toString().padStart(2, '0')}`;

    this._statsEl.innerHTML = `
      <div class="go-stat">
        <span class="go-stat-label">Level Reached</span>
        <span class="go-stat-val">${player.level}</span>
      </div>
      <div class="go-stat">
        <span class="go-stat-label">Time Survived</span>
        <span class="go-stat-val">${timeStr}</span>
      </div>
      <div class="go-stat">
        <span class="go-stat-label">Enemies Defeated</span>
        <span class="go-stat-val">${entities.enemiesDefeated}</span>
      </div>
      <div class="go-stat">
        <span class="go-stat-label">XP Collected</span>
        <span class="go-stat-val">${player.totalXpCollected}</span>
      </div>
      <div class="go-stat go-stat--shards">
        <span class="go-stat-label">✦ Shards Earned</span>
        <span class="go-stat-val go-shard-val">+${earned}</span>
      </div>
    `;
    this.setVisible(true);
  }

  setVisible(v) {
    this._el.classList.toggle('screen--hidden', !v);
  }
}
