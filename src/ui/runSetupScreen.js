import { POWERUP_POOL, RARITY_COLOR } from '../data/powerups.js';
import { CLASSES } from '../data/classes.js';
import { ENDLESS_CHALLENGES } from '../data/endlessChallenges.js';
import { MetaProgress } from '../metaProgress.js';

const MAPS = [
  {
    id: 'grasslands',
    name: 'Grasslands',
    icon: '🌿',
    color: '#33ee88',
    difficulty: 'Beginner',
    description: 'Gentle rolling hills & floating platforms\nSlimes, Goblins, and Birds wander these lands\nBoss appears at 10 minutes',
  },
  {
    id: 'desert',
    name: 'Sunken Sands',
    icon: '🏜️',
    color: '#e8a030',
    difficulty: 'Adept',
    description: 'Sweeping dunes & crumbling sandstone pillars\nGoblins and Spikebots roam the wastes\nBoss appears at 10 minutes',
    requiresUnlock: 'unlock_desert',
  },
  {
    id: 'cavern',
    name: 'Volcanic Cavern',
    icon: '🌋',
    color: '#ff5533',
    difficulty: 'Veteran',
    description: 'Jagged lava terrain & stone ledges\nSpikebots, Specters, and Bat swarms lurk here\nBoss appears at 10 minutes',
    requiresUnlock: 'unlock_volcano',
  },
  {
    id: null,
    name: 'Random',
    icon: '🎲',
    color: '#aa66ff',
    difficulty: '???',
    description: 'Let fate decide your world\nA different adventure each run',
  },
];

export class RunSetupScreen {
  constructor(onStart, onBack) {
    this._el      = document.getElementById('run-setup-screen');
    this._mapsEl  = document.getElementById('rss-maps');
    this._clsEl   = document.getElementById('rss-classes');
    this._modEl   = document.getElementById('rss-modifiers');
    this._wpnSect = document.getElementById('rss-weapon-section');
    this._wpnEl   = document.getElementById('rss-weapons');
    this._tipEl   = document.getElementById('rss-tooltip');
    this._onStart = onStart;

    document.getElementById('rss-back-btn').addEventListener('click', () => {
      this.setVisible(false);
      onBack();
    });
    document.getElementById('rss-start-btn').addEventListener('click', () => this._tryStart());
  }

  show() {
    this._sel = { mapId: null, mapSelected: false, endless: false, classObj: null, modifier: null, weaponPowerup: null };
    this._render();
    this.setVisible(true);
  }

  setVisible(v) {
    this._el.classList.toggle('screen--hidden', !v);
    if (!v) this._hideTooltip();
  }

  _render() {
    this._renderMaps();
    this._renderClasses();
    this._renderModifiers();
    this._renderWeapons();
    this._syncWeaponSection();
    this._syncStartBtn();
  }

  // ---- Sections ----

  _renderMaps() {
    this._mapsEl.innerHTML = '';
    const available = MAPS.filter(m => !m.requiresUnlock || MetaProgress.isUnlocked(m.requiresUnlock));
    const lockedCount = MAPS.filter(m => m.requiresUnlock && !MetaProgress.isUnlocked(m.requiresUnlock)).length;

    for (const map of available) {
      const tile = this._tile(map.icon, map.name, map.difficulty, map.color, map.description);
      tile.addEventListener('click', () => {
        this._sel.mapId = map.id;
        this._sel.endless = false;
        this._sel.mapSelected = true;
        this._selectIn(this._mapsEl, tile);
        this._syncStartBtn();
      });
      this._mapsEl.appendChild(tile);
    }

    // Endless variants
    for (const map of available.filter(m => m.id && MetaProgress.isUnlocked('unlock_endless_' + m.id))) {
      const tile = this._tile('♾', map.name, 'Endless', '#aa55ff',
        `${map.name} — Endless Mode\nNo boss · new modifier every 5 minutes\nSurvive as long as possible`);
      tile.addEventListener('click', () => {
        this._sel.mapId = map.id;
        this._sel.endless = true;
        this._sel.mapSelected = true;
        this._selectIn(this._mapsEl, tile);
        this._syncStartBtn();
      });
      this._mapsEl.appendChild(tile);
    }

    if (lockedCount > 0) {
      const hint = document.createElement('span');
      hint.className = 'rss-locked-hint';
      hint.textContent = `🔒 ${lockedCount} more world${lockedCount > 1 ? 's' : ''} in the Shop`;
      this._mapsEl.appendChild(hint);
    }

    // Auto-select first tile
    this._mapsEl.querySelector('.rss-tile')?.click();
  }

  _renderClasses() {
    this._clsEl.innerHTML = '';

    for (const cls of CLASSES) {
      const tile = this._tile(cls.icon, cls.name, '', cls.color, cls.description);
      tile.addEventListener('click', () => {
        this._sel.classObj = cls;
        this._selectIn(this._clsEl, tile);
        this._syncWeaponSection();
        this._syncStartBtn();
      });
      this._clsEl.appendChild(tile);
    }

    const freeTile = this._tile('⚗️', 'Free Build', '', '#888899',
      'No class restrictions.\nPick any starting weapon.\nAll upgrades available.');
    freeTile.addEventListener('click', () => {
      this._sel.classObj = null;
      this._selectIn(this._clsEl, freeTile);
      this._syncWeaponSection();
      this._syncStartBtn();
    });
    this._clsEl.appendChild(freeTile);

    freeTile.click(); // default
  }

  _renderModifiers() {
    this._modEl.innerHTML = '';

    const noneTile = this._tile('✦', 'No Modifier', '', '#666677',
      'No challenge modifier.\nNo shard bonus.');
    noneTile.addEventListener('click', () => {
      this._sel.modifier = null;
      this._selectIn(this._modEl, noneTile);
    });
    this._modEl.appendChild(noneTile);
    noneTile.click(); // default

    for (const mod of ENDLESS_CHALLENGES.filter(c => !c.endlessOnly)) {
      const sub = `+${Math.round(mod.shardBonus * 100)}% shards`;
      const tile = this._tile(mod.icon, mod.name, sub, '#c8a048', mod.description);
      tile.addEventListener('click', () => {
        this._sel.modifier = mod;
        this._selectIn(this._modEl, tile);
      });
      this._modEl.appendChild(tile);
    }
  }

  _renderWeapons() {
    this._wpnEl.innerHTML = '';
    const weapons = POWERUP_POOL.filter(p =>
      p.weaponId &&
      (!p.requiresUnlock || MetaProgress.isUnlocked(p.requiresUnlock))
    );
    for (const wpn of weapons) {
      const sub = wpn.rarity.charAt(0).toUpperCase() + wpn.rarity.slice(1);
      const color = RARITY_COLOR[wpn.rarity] ?? '#aaa';
      const tile = this._tile(wpn.icon, wpn.name, sub, color, wpn.description);
      tile.addEventListener('click', () => {
        this._sel.weaponPowerup = wpn;
        this._selectIn(this._wpnEl, tile);
        this._syncStartBtn();
      });
      this._wpnEl.appendChild(tile);
    }
  }

  // ---- Sync helpers ----

  _syncWeaponSection() {
    const isFree = this._sel.classObj === null;
    this._wpnSect.classList.toggle('rss-section--hidden', !isFree);
    if (!isFree) {
      // Clear weapon selection when switching to a class
      this._sel.weaponPowerup = null;
      this._wpnEl.querySelectorAll('.rss-tile').forEach(t => t.classList.remove('rss-tile--selected'));
    }
  }

  _syncStartBtn() {
    const btn  = document.getElementById('rss-start-btn');
    const hint = document.getElementById('rss-start-hint');
    const isFree = this._sel.classObj === null;
    const ready = this._sel.mapSelected &&
                  (isFree ? this._sel.weaponPowerup !== null : true);
    btn.disabled = !ready;
    if (hint) hint.textContent = (!ready && isFree) ? 'Pick a starting weapon to continue' : '';
  }

  _selectIn(container, activeTile) {
    container.querySelectorAll('.rss-tile').forEach(t => t.classList.remove('rss-tile--selected'));
    activeTile.classList.add('rss-tile--selected');
  }

  // ---- Tooltip ----

  _tile(icon, name, sub, color, tooltipText) {
    const el = document.createElement('div');
    el.className = 'rss-tile';
    el.style.setProperty('--rss-color', color);
    el.innerHTML = `
      <span class="rss-tile-icon">${icon}</span>
      <span class="rss-tile-name">${name}</span>
      ${sub ? `<span class="rss-tile-sub">${sub}</span>` : ''}
    `;
    el.addEventListener('mouseenter', e => this._showTip(e, name, tooltipText));
    el.addEventListener('mousemove',  e => this._moveTip(e));
    el.addEventListener('mouseleave', () => this._hideTooltip());
    return el;
  }

  _showTip(e, name, text) {
    this._tipEl.innerHTML = `<strong>${name}</strong>${text.replace(/\n/g, '<br>')}`;
    this._tipEl.classList.add('rss-tooltip--visible');
    this._moveTip(e);
  }

  _moveTip(e) {
    const tt = this._tipEl;
    const x  = e.clientX + 16;
    const y  = e.clientY - 6;
    tt.style.left = Math.min(x, window.innerWidth  - tt.offsetWidth  - 10) + 'px';
    tt.style.top  = Math.max(8, y - Math.max(0, y + tt.offsetHeight - window.innerHeight + 10)) + 'px';
  }

  _hideTooltip() {
    this._tipEl.classList.remove('rss-tooltip--visible');
  }

  // ---- Start ----

  _tryStart() {
    const { classObj, weaponPowerup } = this._sel;
    if (classObj === null && !weaponPowerup) return;
    this.setVisible(false);
    this._onStart({ ...this._sel });
  }
}
