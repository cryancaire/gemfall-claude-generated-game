import { MetaProgress } from '../metaProgress.js';

export class RunSummaryScreen {
  constructor(onNewRun, onMainMenu) {
    this._el      = document.getElementById('run-summary-screen');
    this._statsEl = document.getElementById('rs-stats');
    document.getElementById('rs-new-run-btn').addEventListener('click', onNewRun);
    document.getElementById('rs-main-menu-btn').addEventListener('click', onMainMenu);
  }

  show(player, entities, playTime = 0, modifierBonus = 0) {
    const earned = MetaProgress.calcShards({
      enemiesDefeated:  entities.enemiesDefeated,
      secondsSurvived:  Math.floor(playTime),
      totalXpCollected: player.totalXpCollected,
      weaponsCount:     player.weapons.length,
      upgradesCount:    player.acquiredUpgrades.length,
      isVictory:        false,
      modifierBonus,
    });
    MetaProgress.addShards(earned);

    const m   = Math.floor(playTime / 60);
    const s   = Math.floor(playTime) % 60;
    const timeStr = `${m}:${s.toString().padStart(2, '0')}`;

    this._statsEl.innerHTML = `
      <div class="rs-stat">
        <span class="rs-stat-label">Level Reached</span>
        <span class="rs-stat-val">${player.level}</span>
      </div>
      <div class="rs-stat">
        <span class="rs-stat-label">Time Survived</span>
        <span class="rs-stat-val">${timeStr}</span>
      </div>
      <div class="rs-stat">
        <span class="rs-stat-label">Enemies Defeated</span>
        <span class="rs-stat-val">${entities.enemiesDefeated}</span>
      </div>
      <div class="rs-stat">
        <span class="rs-stat-label">XP Collected</span>
        <span class="rs-stat-val">${player.totalXpCollected}</span>
      </div>
      <div class="rs-stat rs-stat--shards">
        <span class="rs-stat-label">✦ Shards Earned</span>
        <span class="rs-stat-val rs-shard-val">+${earned}</span>
      </div>
    `;
    this.setVisible(true);
  }

  setVisible(v) {
    this._el.classList.toggle('screen--hidden', !v);
  }
}
