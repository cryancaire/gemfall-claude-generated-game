import { POWERUP_POOL, RARITY_COLOR } from '../data/powerups.js';
import { RARITIES } from '../data/rarities.js';
import { MetaProgress } from '../metaProgress.js';

// Base weight for each rarity — higher = more likely to appear
const RARITY_WEIGHT = {
  common:    100,
  uncommon:   60,
  rare:       25,
  epic:        8,
  legendary:   3,
  mythic:      1,
};

// Each luck point boosts rarer items relative to common ones.
// At luck=50 legendary is ~2x its base weight; at luck=100 it's ~4x.
function _cardWeight(card, luck) {
  const base = RARITY_WEIGHT[card.rarity] ?? 50;
  const idx  = RARITIES.indexOf(card.rarity);
  const norm = idx / Math.max(1, RARITIES.length - 1); // 0 = common, 1 = mythic
  return base * (1 + norm * luck * 0.03);
}

// Pick n unique cards from pool using weighted random, influenced by luck.
function _weightedSample(pool, n, luck) {
  if (pool.length <= n) return [...pool];
  const result    = [];
  const remaining = [...pool];

  for (let i = 0; i < n; i++) {
    const weights = remaining.map(c => _cardWeight(c, luck));
    const total   = weights.reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    let idx = remaining.length - 1;
    for (let j = 0; j < weights.length; j++) {
      r -= weights[j];
      if (r <= 0) { idx = j; break; }
    }
    result.push(remaining[idx]);
    remaining.splice(idx, 1);
  }

  return result;
}

// ---- Helpers for dynamic weapon-upgrade cards ----

function _nextRarity(current) {
  const idx = RARITIES.indexOf(current);
  return (idx >= 0 && idx < RARITIES.length - 1) ? RARITIES[idx + 1] : null;
}

function _makeWeaponUpgradeCard(weapon, newRarity) {
  const rarityLabel = newRarity.charAt(0).toUpperCase() + newRarity.slice(1);
  const baseType = weapon.type;
  return {
    id: `upgrade_${baseType.id}_to_${newRarity}`,
    name: `${rarityLabel} ${baseType.name}`,
    icon: baseType.icon ?? '⭐',
    rarity: newRarity,
    isWeaponCard: true,
    isWeaponUpgrade: true,
    description: `Upgrade ${baseType.name} to ${rarityLabel}\nMore damage · faster fire · longer range`,
    apply(player) {
      const existing = player.weapons.find(w => w.type.id === baseType.id);
      if (existing) existing.applyRarity(newRarity);
    },
  };
}

// ---- LevelUpScreen ----

export class LevelUpScreen {
  constructor(onPowerupChosen) {
    this._el        = document.getElementById('levelup-screen');
    this._levelEl   = document.getElementById('lu-level');
    this._cardsEl   = document.getElementById('lu-cards');
    this._actionsEl = document.getElementById('lu-actions');
    this._onChosen  = onPowerupChosen;
    this._player    = null;
  }

  show(player) {
    this._player = player;
    this._levelEl.textContent = `Level ${player.level}`;
    this._renderAll();
    this.setVisible(true);
  }

  _renderAll() {
    this._renderCards(this._pickOptions(this._player));
    this._renderActions();
  }

  _renderActions() {
    this._actionsEl.innerHTML = '';

    if (this._player.rerolls > 0) {
      const rerollBtn = document.createElement('button');
      rerollBtn.className = 'lu-action-btn lu-reroll-btn';
      rerollBtn.textContent = `🎲 Reroll (${this._player.rerolls} left)`;
      rerollBtn.addEventListener('click', () => {
        this._player.rerolls--;
        this._renderAll();
      });
      this._actionsEl.appendChild(rerollBtn);
    }

    const skipBtn = document.createElement('button');
    skipBtn.className = 'lu-action-btn lu-skip-btn';
    skipBtn.textContent = 'Skip → earn a reroll';
    skipBtn.addEventListener('click', () => {
      this.setVisible(false);
      this._onChosen(null);
    });
    this._actionsEl.appendChild(skipBtn);
  }

  _pickOptions(player) {
    const luck      = player.luck ?? 0;
    const hasSlot   = player.weapons.length < player.maxWeaponSlots;
    const ownedIds  = new Set(player.weapons.map(w => w.type.id));
    const hasWeapons = player.weapons.length > 0;

    const hasOrb = player.weapons.some(w => w.type.id === 'orb');
    const ORB_UPGRADE_IDS = new Set(['orb_nova', 'orb_surge', 'orb_mastery']);

    // Filter base pool to valid options
    const base = POWERUP_POOL.filter(p => {
      if (p.requiresUnlock && !MetaProgress.isUnlocked(p.requiresUnlock)) return false;
      if (p.requiresWeapon && !ownedIds.has(p.requiresWeapon)) return false;
      if (p.weaponId) return hasSlot && !ownedIds.has(p.weaponId);
      if (p.id === 'weapon_slot') return true;
      if ((p.id === 'eagle_eye' || p.id === 'speed_loader') && !hasWeapons) return false;
      if (ORB_UPGRADE_IDS.has(p.id) && !hasOrb) return false;
      return true;
    });

    // Luck scales the weapon upgrade chance: 18% base, +0.4% per luck point, capped at 70%
    const upgradeChance = Math.min(0.70, 0.18 + luck * 0.004);
    const upgradeCandidates = [];
    for (const w of player.weapons) {
      const next = _nextRarity(w.rarity);
      if (next && Math.random() < upgradeChance) {
        upgradeCandidates.push(_makeWeaponUpgradeCard(w, next));
      }
    }

    let upgradeCard = null;
    if (upgradeCandidates.length > 0) {
      upgradeCard = upgradeCandidates[Math.floor(Math.random() * upgradeCandidates.length)];
    }

    // Weighted sample from base pool using luck
    const basePicks = _weightedSample(base, upgradeCard ? 2 : 3, luck);

    if (!upgradeCard) return basePicks;

    // Guarantee the upgrade card appears; shuffle so it isn't always first
    return [upgradeCard, ...basePicks].sort(() => Math.random() - 0.5);
  }

  _renderCards(picks) {
    this._cardsEl.innerHTML = '';
    for (const p of picks) {
      const btn = document.createElement('button');
      btn.className = 'lu-card';
      btn.style.setProperty('--rarity-color', RARITY_COLOR[p.rarity] ?? '#aaa');

      const rarityLabel = p.rarity.charAt(0).toUpperCase() + p.rarity.slice(1);
      const upgradeTag  = p.isWeaponUpgrade
        ? `<span class="lu-card-upgrade-tag">UPGRADE</span>` : '';

      btn.innerHTML = `
        <span class="lu-card-icon">${p.icon}</span>
        <span class="lu-card-rarity">${rarityLabel}${p.isWeaponUpgrade ? ' ↑' : ''}</span>
        <span class="lu-card-name">${p.name}</span>
        ${upgradeTag}
        <span class="lu-card-desc">${p.description.replace(/\n/g, '<br>')}</span>
      `;
      btn.addEventListener('click', () => {
        this.setVisible(false);
        this._onChosen(p);
      });
      this._cardsEl.appendChild(btn);
    }
  }

  setVisible(v) {
    this._el.classList.toggle('screen--hidden', !v);
  }
}
