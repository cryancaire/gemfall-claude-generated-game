import { MetaProgress } from '../metaProgress.js';
import { RARITY_COLOR, RARITY_LABEL } from '../data/rarities.js';

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

export class GameOverScreen {
  constructor(onRestart) {
    this._el         = document.getElementById('gameover-screen');
    this._statsEl    = document.getElementById('go-stats');
    this._weaponsEl  = document.getElementById('go-weapons');
    this._upgradesEl = document.getElementById('go-upgrades');
    document.getElementById('go-retry-btn').addEventListener('click', () => {
      _hideTip();
      this.setVisible(false);
      onRestart();
    });
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

    this._renderStats(player, entities, playTime, earned);
    this._renderWeapons(player);
    this._renderUpgrades(player);
    this.setVisible(true);
  }

  setVisible(v) {
    this._el.classList.toggle('screen--hidden', !v);
    if (!v) _hideTip();
  }

  _renderStats(player, entities, playTime, earned) {
    const m = Math.floor(playTime / 60);
    const s = Math.floor(playTime) % 60;
    const timeStr = `${m}:${s.toString().padStart(2, '0')}`;

    this._statsEl.innerHTML = `
      <div class="go-stat">
        <span class="go-stat-label">Level</span>
        <span class="go-stat-val">${player.level}</span>
      </div>
      <div class="go-stat">
        <span class="go-stat-label">Time</span>
        <span class="go-stat-val">${timeStr}</span>
      </div>
      <div class="go-stat">
        <span class="go-stat-label">Kills</span>
        <span class="go-stat-val">${entities.enemiesDefeated}</span>
      </div>
      <div class="go-stat">
        <span class="go-stat-label">XP</span>
        <span class="go-stat-val">${player.totalXpCollected}</span>
      </div>
      <div class="go-stat go-stat--shards">
        <span class="go-stat-label">Shards</span>
        <span class="go-stat-val go-shard-val">+${earned}</span>
      </div>
    `;
  }

  _renderWeapons(player) {
    this._weaponsEl.innerHTML = '';
    if (player.weapons.length === 0) {
      this._weaponsEl.innerHTML = '<span class="go-empty">None</span>';
      return;
    }
    const grid = document.createElement('div');
    grid.className = 'vc-icon-grid';
    for (const w of player.weapons) {
      const color   = RARITY_COLOR[w.rarity] ?? '#aaa';
      const label   = RARITY_LABEL[w.rarity]  ?? w.rarity;
      const tipText = `${w.type.name}\n${label.toUpperCase()}${w.type.description ? '\n' + w.type.description : ''}`;
      grid.appendChild(this._makeTile(w.type.displayIcon ?? w.type.icon ?? '?', color, tipText));
    }
    this._weaponsEl.appendChild(grid);
  }

  _renderUpgrades(player) {
    this._upgradesEl.innerHTML = '';
    if (player.acquiredUpgrades.length === 0) {
      this._upgradesEl.innerHTML = '<span class="go-empty">None</span>';
      return;
    }
    const grid = document.createElement('div');
    grid.className = 'vc-icon-grid';
    for (const u of player.acquiredUpgrades) {
      const tipText = `${u.name}${u.description ? '\n' + u.description : ''}`;
      grid.appendChild(this._makeTile(u.icon, null, tipText));
    }
    this._upgradesEl.appendChild(grid);
  }

  _makeTile(icon, borderColor, tipText) {
    const tile = document.createElement('div');
    tile.className = 'vc-icon-tile';
    if (borderColor) tile.style.setProperty('--tile-color', borderColor);
    tile.textContent = icon;
    tile.addEventListener('mouseenter', () => _showTip(tile, tipText));
    tile.addEventListener('mouseleave', _hideTip);
    return tile;
  }
}
