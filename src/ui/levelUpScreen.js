import { POWERUP_POOL, RARITY_COLOR } from '../data/powerups.js';
import { RARITIES } from '../data/rarities.js';

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
    this._el       = document.getElementById('levelup-screen');
    this._levelEl  = document.getElementById('lu-level');
    this._cardsEl  = document.getElementById('lu-cards');
    this._onChosen = onPowerupChosen;
  }

  // Receives the full player object so we can tailor options to their state.
  show(player) {
    this._levelEl.textContent = `Level ${player.level}`;
    this._renderCards(this._pickOptions(player));
    this.setVisible(true);
  }

  _pickOptions(player) {
    const hasSlot    = player.weapons.length < player.maxWeaponSlots;
    const ownedIds   = new Set(player.weapons.map(w => w.type.id));
    const hasWeapons = player.weapons.length > 0;

    // Base pool filters
    const base = POWERUP_POOL.filter(p => {
      // New weapon: only offer if a slot is free and player doesn't own it
      if (p.weaponId) return hasSlot && !ownedIds.has(p.weaponId);
      // Weapon slot upgrade: always available (no hard cap)
      if (p.id === 'weapon_slot') return true;
      // weapon-affecting stat upgrades: skip if no weapons yet
      if ((p.id === 'eagle_eye' || p.id === 'speed_loader') && !hasWeapons) return false;
      return true;
    });

    // Roll for weapon rarity upgrade cards (~18% per owned weapon)
    let upgradeCard = null;
    const upgradeCandidates = [];
    for (const w of player.weapons) {
      const next = _nextRarity(w.rarity);
      if (next && Math.random() < 0.18) {
        upgradeCandidates.push(_makeWeaponUpgradeCard(w, next));
      }
    }
    if (upgradeCandidates.length > 0) {
      upgradeCard = upgradeCandidates[Math.floor(Math.random() * upgradeCandidates.length)];
    }

    const shuffledBase = [...base].sort(() => Math.random() - 0.5);

    if (!upgradeCard) {
      return shuffledBase.slice(0, 3);
    }

    // Guarantee the upgrade card appears; fill remaining slots from base pool
    const rest = shuffledBase.slice(0, 2);
    return [upgradeCard, ...rest].sort(() => Math.random() - 0.5);
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
