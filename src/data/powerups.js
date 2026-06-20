import { Weapon }       from '../weapons/weapon.js';
import { WEAPON_TYPES } from '../weapons/weaponTypes.js';
// Re-export so existing imports from this file still work
export { RARITY_COLOR, RARITY_LABEL } from './rarities.js';

// All base-rarity powerup definitions.
// isWeaponCard: true  → adds/upgrades a weapon; NOT tracked in the acquired-upgrades panel
// weaponId            → the WEAPON_TYPES key this card equips (used to filter duplicates)
// apply(player, entities) mutates game state directly.
export const POWERUP_POOL = [

  // ---- Weapons ----
  {
    id: 'weapon_magic_missile',
    name: 'Magic Missile',
    icon: '🔮',
    rarity: 'common',
    isWeaponCard: true,
    weaponId: 'magic_missile',
    description: 'Homing magic orb\nPick again to upgrade fire rate',
    apply(player) {
      const w = new Weapon(WEAPON_TYPES.magic_missile);
      w.applyRarity(this.rarity);
      player.addOrUpgradeWeapon(w);
    },
  },
  {
    id: 'weapon_ice_bolt',
    name: 'Ice Bolt',
    icon: '❄️',
    rarity: 'common',
    isWeaponCard: true,
    weaponId: 'ice_bolt',
    description: 'Homing ice shard — fast & accurate\nPick again to upgrade fire rate',
    apply(player) {
      const w = new Weapon(WEAPON_TYPES.ice_bolt);
      w.applyRarity(this.rarity);
      player.addOrUpgradeWeapon(w);
    },
  },
  {
    id: 'weapon_fire_bolt',
    name: 'Fireball',
    icon: '🔥',
    rarity: 'uncommon',
    isWeaponCard: true,
    weaponId: 'fire_bolt',
    description: 'Homing fireball — high damage\nPick again to upgrade fire rate',
    apply(player) {
      const w = new Weapon(WEAPON_TYPES.fire_bolt);
      w.applyRarity(this.rarity);
      player.addOrUpgradeWeapon(w);
    },
  },
  {
    id: 'weapon_lightning_bolt',
    name: 'Lightning',
    icon: '⚡',
    rarity: 'uncommon',
    isWeaponCard: true,
    weaponId: 'lightning_bolt',
    description: 'Homing lightning — rapid fire\nPick again to upgrade fire rate',
    apply(player) {
      const w = new Weapon(WEAPON_TYPES.lightning_bolt);
      w.applyRarity(this.rarity);
      player.addOrUpgradeWeapon(w);
    },
  },

  {
    id: 'weapon_orb',
    name: 'Arcane Orb',
    icon: '💠',
    rarity: 'common',
    isWeaponCard: true,
    weaponId: 'orb',
    description: 'Orbiting magic orb\nHits enemies on contact\nPick again to add another orb',
    apply(player) {
      const existing = player.weapons.find(w => w.type.id === 'orb');
      if (existing) {
        existing.orbCount += 1;
        existing.damage = Math.round(existing.damage * 1.1);
      } else if (player.weapons.length < player.maxWeaponSlots) {
        const w = new Weapon(WEAPON_TYPES.orb);
        w.applyRarity(this.rarity);
        player.weapons.push(w);
      }
    },
  },

  // ---- Weapon slot unlock (rare) ----
  {
    id: 'weapon_slot',
    name: 'Arcane Arsenal',
    icon: '⊕',
    rarity: 'rare',
    isWeaponCard: true,
    description: 'Unlock an additional weapon slot\nWield more spells simultaneously',
    apply(player) { player.maxWeaponSlots += 1; },
  },

  // ---- Weapon upgrades (affect all equipped weapons) ----
  {
    id: 'eagle_eye',
    name: 'Eagle Eye',
    icon: '👁️',
    rarity: 'uncommon',
    description: '+80px attack range\nApplies to all equipped weapons',
    apply(player) {
      for (const w of player.weapons) w.attackRange += 80;
    },
  },
  {
    id: 'speed_loader',
    name: 'Speed Loader',
    icon: '💨',
    rarity: 'uncommon',
    description: '18% faster attack speed\nApplies to all equipped weapons',
    apply(player) {
      for (const w of player.weapons) {
        w.attackInterval = Math.max(12, Math.round(w.attackInterval * 0.82));
      }
    },
  },

  // ---- Stat upgrades ----
  {
    id: 'max_hp',
    name: 'Iron Constitution',
    icon: '❤️',
    rarity: 'common',
    description: '+2 Max HP\nAlso restores the added amount',
    apply(player) {
      player.maxHp += 2;
      player.hp = Math.min(player.hp + 2, player.maxHp);
    },
  },
  {
    id: 'heal',
    name: 'Second Wind',
    icon: '✨',
    rarity: 'common',
    description: 'Restore 4 HP',
    apply(player) {
      player.heal(4);
    },
  },
  {
    id: 'extra_jump',
    name: 'Featherweight',
    icon: '⬆️',
    rarity: 'uncommon',
    description: '+1 Jump\nDouble jump, triple jump...',
    apply(player) {
      player.maxJumps += 1;
    },
  },
  {
    id: 'damage',
    name: 'Crushing Force',
    icon: '💪',
    rarity: 'common',
    description: '+1 Stomp Damage\nKill enemies faster underfoot',
    apply(player) {
      player.damage += 1;
    },
  },
  {
    id: 'slow_enemies',
    name: 'Quagmire',
    icon: '🌀',
    rarity: 'uncommon',
    description: 'All enemies move 25% slower\nStacks with future picks',
    apply(_player, entities) {
      entities.applySpeedDebuff(0.75);
    },
  },
  {
    id: 'gem_value',
    name: 'Gilded Touch',
    icon: '💎',
    rarity: 'uncommon',
    description: 'XP gems grant 50% more XP',
    apply(player) {
      player.gemValueMultiplier *= 1.5;
    },
  },

  // ---- Projectile cap upgrades ----
  {
    id: 'proj_cap_sm',
    name: 'Arcane Focus',
    icon: '🎯',
    rarity: 'rare',
    description: '+1 max projectile per weapon\nMore missiles in flight simultaneously',
    apply(player) { player.projCapBonus += 1; },
  },
  {
    id: 'proj_cap_lg',
    name: 'Storm Caller',
    icon: '🌪️',
    rarity: 'epic',
    description: '+2 max projectiles per weapon\nUnleash a barrage of spells',
    apply(player) { player.projCapBonus += 2; },
  },

  // ---- HP Regeneration ----
  {
    id: 'hp_regen_sm',
    name: 'Vital Pulse',
    icon: '💗',
    rarity: 'uncommon',
    description: '+0.5 HP regen/sec\nSlowly regenerate health over time',
    apply(player) { player.hpRegen += 0.5; },
  },
  {
    id: 'hp_regen_lg',
    name: 'Mending Surge',
    icon: '💖',
    rarity: 'rare',
    description: '+1 HP regen/sec\nRecover health steadily in combat',
    apply(player) { player.hpRegen += 1; },
  },

  // ---- Orb upgrades ----
  {
    id: 'orb_nova',
    name: 'Orb Nova',
    icon: '💠',
    rarity: 'uncommon',
    description: '+1 Arcane Orb\n+15% orb damage',
    apply(player) {
      const orb = player.weapons.find(w => w.type.id === 'orb');
      if (!orb) return;
      orb.orbCount += 1;
      orb.damage = Math.round(orb.damage * 1.15);
    },
  },
  {
    id: 'orb_surge',
    name: 'Orbital Surge',
    icon: '🌐',
    rarity: 'rare',
    description: '+1 Arcane Orb\n+25% orb damage & speed',
    apply(player) {
      const orb = player.weapons.find(w => w.type.id === 'orb');
      if (!orb) return;
      orb.orbCount += 1;
      orb.damage = Math.round(orb.damage * 1.25);
      orb.orbitSpeed *= 1.25;
    },
  },
  {
    id: 'orb_mastery',
    name: 'Orbital Mastery',
    icon: '🌌',
    rarity: 'epic',
    description: '+2 Arcane Orbs\n+40% orb damage & speed',
    apply(player) {
      const orb = player.weapons.find(w => w.type.id === 'orb');
      if (!orb) return;
      orb.orbCount += 2;
      orb.damage = Math.round(orb.damage * 1.4);
      orb.orbitSpeed *= 1.4;
    },
  },

  // ---- Luck ----
  {
    id: 'luck_sm',
    name: "Fortune's Touch",
    icon: '🍀',
    rarity: 'uncommon',
    description: '+10 Luck\nImproves odds of rarer upgrade cards',
    apply(player) { player.luck += 10; },
  },
  {
    id: 'luck_md',
    name: 'Silver Lining',
    icon: '🌟',
    rarity: 'rare',
    description: '+25 Luck\nBetter chance at epic upgrade cards',
    apply(player) { player.luck += 25; },
  },
  {
    id: 'luck_lg',
    name: 'Blessed',
    icon: '⭐',
    rarity: 'epic',
    description: '+50 Luck\nLegendary upgrades become within reach',
    apply(player) { player.luck += 50; },
  },
];
