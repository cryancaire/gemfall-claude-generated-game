import { RARITY_COLOR, RARITY_LABEL } from '../data/rarities.js';

export class PauseScreen {
  constructor(onResume) {
    this._el         = document.getElementById('pause-screen');
    this._statsEl    = document.getElementById('pause-stats');
    this._weaponsEl  = document.getElementById('pause-weapons');
    this._upgradesEl = document.getElementById('pause-upgrades');

    document.getElementById('pause-resume-btn').addEventListener('click', onResume);
  }

  show(player) {
    this._renderStats(player);
    this._renderWeapons(player);
    this._renderUpgrades(player);
    this.setVisible(true);
  }

  setVisible(v) {
    this._el.classList.toggle('screen--hidden', !v);
  }

  _renderStats(player) {
    const gemBonus = Math.round((player.gemValueMultiplier - 1) * 100);
    const rows = [
      ['Level',        player.level],
      ['HP',           `${player.hp} / ${player.maxHp}`],
      ['Speed',        player.speed],
      ['Max Jumps',    player.maxJumps],
      ['Stomp Damage', player.damage],
      ['Gem XP Bonus', gemBonus > 0 ? `+${gemBonus}%` : '—'],
      ['Weapon Slots', player.maxWeaponSlots],
    ];
    this._statsEl.innerHTML = rows.map(([label, value]) =>
      `<div class="ps-stat">
        <span class="ps-stat-label">${label}</span>
        <span class="ps-stat-value">${value}</span>
      </div>`
    ).join('');
  }

  _renderWeapons(player) {
    if (player.weapons.length === 0) {
      this._weaponsEl.innerHTML = '<p class="ps-empty">No weapons equipped</p>';
      return;
    }
    this._weaponsEl.innerHTML = player.weapons.map(w => {
      const color = RARITY_COLOR[w.rarity] ?? '#aaa';
      const label = RARITY_LABEL[w.rarity] ?? w.rarity;
      const spdSec = (w.attackInterval / 60).toFixed(2);
      return `<div class="ps-weapon" style="--rc: ${color}">
        <span class="ps-weapon-icon">${w.type.icon ?? '?'}</span>
        <div class="ps-weapon-info">
          <span class="ps-weapon-name">${w.type.name}</span>
          <span class="ps-weapon-rarity">${label}</span>
          <span class="ps-weapon-stats">DMG ${w.damage} &nbsp;·&nbsp; RNG ${w.attackRange} &nbsp;·&nbsp; every ${spdSec}s</span>
        </div>
      </div>`;
    }).join('');
  }

  _renderUpgrades(player) {
    if (player.acquiredUpgrades.length === 0) {
      this._upgradesEl.innerHTML = '<p class="ps-empty">No upgrades yet</p>';
      return;
    }
    this._upgradesEl.innerHTML = player.acquiredUpgrades.map(u =>
      `<div class="ps-upgrade">
        <span class="ps-upgrade-icon">${u.icon}</span>
        <div class="ps-upgrade-info">
          <span class="ps-upgrade-name">${u.name}</span>
          <span class="ps-upgrade-desc">${(u.description ?? '').replace(/\n/g, ' · ')}</span>
        </div>
      </div>`
    ).join('');
  }
}
