import { RARITY_COLOR, RARITY_LABEL } from '../data/rarities.js';
import { MetaProgress } from '../metaProgress.js';

export class VictoryScreen {
  constructor(onMainMenu) {
    this._el = document.getElementById('victory-screen');
    document.getElementById('victory-menu-btn').addEventListener('click', onMainMenu);
  }

  show(player, entities, playTime) {
    this._render(player, entities, playTime);
    this.setVisible(true);
  }

  setVisible(v) {
    this._el.classList.toggle('screen--hidden', !v);
  }

  _render(player, entities, playTime) {
    const enemiesKilled = entities.enemiesDefeated;
    const seconds       = Math.floor(playTime);
    const score         = enemiesKilled * 100 + seconds * 2 + player.level * 500;

    const earned = MetaProgress.calcShards({
      enemiesDefeated:  enemiesKilled,
      secondsSurvived:  seconds,
      totalXpCollected: player.totalXpCollected,
      weaponsCount:     player.weapons.length,
      upgradesCount:    player.acquiredUpgrades.length,
      isVictory:        true,
    });
    MetaProgress.addShards(earned);

    document.getElementById('victory-score').textContent  = score.toLocaleString();
    document.getElementById('victory-time').textContent   = this._formatTime(seconds);
    document.getElementById('victory-kills').textContent  = enemiesKilled;
    document.getElementById('victory-level').textContent  = player.level;
    document.getElementById('victory-shards').textContent = `+${earned}`;

    // Weapons
    const weaponsEl = document.getElementById('victory-weapons');
    if (player.weapons.length === 0) {
      weaponsEl.innerHTML = '<span class="vc-empty">None</span>';
    } else {
      weaponsEl.innerHTML = player.weapons.map(w => {
        const color = RARITY_COLOR[w.rarity] ?? '#aaa';
        const label = RARITY_LABEL[w.rarity] ?? w.rarity;
        return `<div class="vc-item" style="border-color:${color}">
          <span class="vc-item-icon">${w.type.displayIcon ?? w.type.icon ?? '?'}</span>
          <div class="vc-item-info">
            <span class="vc-item-name">${w.type.name}</span>
            <span class="vc-item-sub" style="color:${color}">${label.toUpperCase()}</span>
          </div>
        </div>`;
      }).join('');
    }

    // Upgrades
    const upgradesEl = document.getElementById('victory-upgrades');
    if (player.acquiredUpgrades.length === 0) {
      upgradesEl.innerHTML = '<span class="vc-empty">None</span>';
    } else {
      upgradesEl.innerHTML = player.acquiredUpgrades.map(u =>
        `<div class="vc-item">
          <span class="vc-item-icon">${u.icon}</span>
          <div class="vc-item-info">
            <span class="vc-item-name">${u.name}</span>
          </div>
        </div>`
      ).join('');
    }
  }

  _formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }
}
