import { RARITY_COLOR, RARITY_LABEL } from '../data/rarities.js';
import { Settings } from '../settings.js';
import { syncMuteUI } from '../audio.js';

// Shared fixed-position tooltip — lives on <body> so overflow:hidden on #pause-panel can't clip it.
const _tip = document.getElementById('ps-tooltip');

function _showTip(el, text) {
  _tip.textContent = text;
  _tip.style.display = 'block';
  _placeTip(el);
}

function _hideTip() {
  _tip.style.display = 'none';
}

function _placeTip(el) {
  const r   = el.getBoundingClientRect();
  const tw  = _tip.offsetWidth;
  const th  = _tip.offsetHeight;
  let left  = r.left + r.width / 2 - tw / 2;
  let top   = r.top - th - 9;
  // keep inside viewport
  left = Math.max(8, Math.min(left, window.innerWidth  - tw - 8));
  top  = Math.max(8, Math.min(top,  window.innerHeight - th - 8));
  _tip.style.left = `${left}px`;
  _tip.style.top  = `${top}px`;
}

export class PauseScreen {
  constructor(onResume) {
    this._el         = document.getElementById('pause-screen');
    this._statsEl    = document.getElementById('pause-stats');
    this._weaponsEl  = document.getElementById('pause-weapons');
    this._upgradesEl = document.getElementById('pause-upgrades');
    this._mainBody   = document.getElementById('pause-main-body');
    this._settingsBody = document.getElementById('pause-settings-body');
    this._settingsBtn  = document.getElementById('pause-settings-btn');

    document.getElementById('pause-resume-btn').addEventListener('click', onResume);

    this._settingsBtn.addEventListener('click', () => this._toggleSettings());

    // UI scale slider
    const slider = document.getElementById('ui-scale-slider');
    const valEl  = document.getElementById('ui-scale-val');
    slider.value      = Settings.uiScale;
    valEl.textContent = `${Settings.uiScale}×`;
    slider.addEventListener('input', () => {
      const v = parseFloat(slider.value);
      Settings.uiScale = v;
      valEl.textContent = `${v}×`;
      Settings.save();
    });

    // SFX volume slider
    const sfxSlider = document.getElementById('sfx-volume-slider');
    const sfxValEl  = document.getElementById('sfx-volume-val');
    sfxSlider.value   = Settings.sfxVolume;
    sfxValEl.textContent = `${Math.round(Settings.sfxVolume * 100)}%`;
    sfxSlider.addEventListener('input', () => {
      const v = parseFloat(sfxSlider.value);
      Settings.sfxVolume = v;
      sfxValEl.textContent = `${Math.round(v * 100)}%`;
      Settings.save();
    });

    // SFX mute toggle (panel button)
    document.getElementById('sfx-mute-btn').addEventListener('click', () => {
      Settings.sfxMuted = !Settings.sfxMuted;
      Settings.save();
      syncMuteUI();
    });
  }

  show(player) {
    // Always open on the main view
    this._showMain();
    this._renderStats(player);
    this._renderWeapons(player);
    this._renderUpgrades(player);
    this.setVisible(true);
  }

  setVisible(v) {
    this._el.classList.toggle('screen--hidden', !v);
  }

  _toggleSettings() {
    const inSettings = !this._settingsBody.classList.contains('pause-view--hidden');
    if (inSettings) {
      this._showMain();
    } else {
      this._mainBody.classList.add('pause-view--hidden');
      this._settingsBody.classList.remove('pause-view--hidden');
      this._settingsBtn.textContent = '← Back';
    }
  }

  _showMain() {
    this._mainBody.classList.remove('pause-view--hidden');
    this._settingsBody.classList.add('pause-view--hidden');
    this._settingsBtn.textContent = '⚙';
  }

  _renderStats(player) {
    const gemBonus  = Math.round((player.gemValueMultiplier - 1) * 100);
    const regenStr  = player.hpRegen > 0 ? `${player.hpRegen}/s` : '—';
    const luckStr   = player.luck   > 0 ? `+${player.luck}`     : '0';
    const rows = [
      ['Level',        player.level],
      ['HP',           `${player.hp} / ${player.maxHp}`],
      ['HP Regen',     regenStr],
      ['Speed',        player.speed],
      ['Max Jumps',    player.maxJumps],
      ['Stomp Damage', player.damage],
      ['Gem XP Bonus', gemBonus > 0 ? `+${gemBonus}%` : '—'],
      ['Luck',         luckStr],
      ['Weapon Slots', player.maxWeaponSlots],
      ['Proj. Cap',    `${player.projCapBonus > 0 ? `base +${player.projCapBonus}` : 'base'}`],
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
    this._weaponsEl.innerHTML = '';
    const grid = document.createElement('div');
    grid.className = 'ps-icon-grid';

    for (const w of player.weapons) {
      const color = RARITY_COLOR[w.rarity] ?? '#aaa';
      const label = RARITY_LABEL[w.rarity] ?? w.rarity;
      const stats = w.type.type === 'orb'
        ? `DMG ${w.damage}  ·  ${w.orbCount} orb${w.orbCount !== 1 ? 's' : ''}  ·  ${(w.orbitSpeed * 60).toFixed(1)}°/s`
        : `DMG ${w.damage}  ·  RNG ${w.attackRange}  ·  every ${(w.attackInterval / 60).toFixed(2)}s`;
      const tooltip = `${w.type.name}\n${label.toUpperCase()}\n${stats}`;

      const item = document.createElement('div');
      item.className = 'ps-icon-item';
      item.style.borderColor = color;
      item.style.boxShadow = `0 0 8px ${color}44`;
      item.textContent = w.type.icon ?? '?';
      item.addEventListener('mouseenter', () => _showTip(item, tooltip));
      item.addEventListener('mouseleave', _hideTip);
      grid.appendChild(item);
    }

    this._weaponsEl.appendChild(grid);
  }

  _renderUpgrades(player) {
    if (player.acquiredUpgrades.length === 0) {
      this._upgradesEl.innerHTML = '<p class="ps-empty">No upgrades yet</p>';
      return;
    }
    this._upgradesEl.innerHTML = '';
    const grid = document.createElement('div');
    grid.className = 'ps-icon-grid';

    for (const u of player.acquiredUpgrades) {
      const tooltip = `${u.name}\n${u.description ?? ''}`;
      const item = document.createElement('div');
      item.className = 'ps-icon-item';
      item.textContent = u.icon;
      item.addEventListener('mouseenter', () => _showTip(item, tooltip));
      item.addEventListener('mouseleave', _hideTip);
      grid.appendChild(item);
    }

    this._upgradesEl.appendChild(grid);
  }
}
