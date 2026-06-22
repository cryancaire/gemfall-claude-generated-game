import { RARITY_COLOR, RARITY_LABEL } from '../data/rarities.js';
import { MetaProgress } from '../metaProgress.js';

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

export class VictoryScreen {
  constructor(onMainMenu) {
    this._el = document.getElementById('victory-screen');
    document.getElementById('victory-menu-btn').addEventListener('click', () => { _hideTip(); onMainMenu(); });
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

    // Weapons — icon tiles with tooltip
    const weaponsEl = document.getElementById('victory-weapons');
    weaponsEl.innerHTML = '';
    if (player.weapons.length === 0) {
      weaponsEl.innerHTML = '<span class="vc-empty">None</span>';
    } else {
      weaponsEl.className = 'vc-icon-grid';
      for (const w of player.weapons) {
        const color   = RARITY_COLOR[w.rarity] ?? '#aaa';
        const label   = RARITY_LABEL[w.rarity]  ?? w.rarity;
        const tipText = `${w.type.name}\n${label.toUpperCase()}${w.type.description ? '\n' + w.type.description : ''}`;
        const tile = this._makeTile(w.type.displayIcon ?? w.type.icon ?? '?', color, tipText);
        weaponsEl.appendChild(tile);
      }
    }

    // Upgrades — icon tiles with tooltip
    const upgradesEl = document.getElementById('victory-upgrades');
    upgradesEl.innerHTML = '';
    if (player.acquiredUpgrades.length === 0) {
      upgradesEl.innerHTML = '<span class="vc-empty">None</span>';
    } else {
      upgradesEl.className = 'vc-icon-grid';
      for (const u of player.acquiredUpgrades) {
        const tipText = `${u.name}${u.description ? '\n' + u.description : ''}`;
        const tile = this._makeTile(u.icon, null, tipText);
        upgradesEl.appendChild(tile);
      }
    }
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

  _formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }
}
