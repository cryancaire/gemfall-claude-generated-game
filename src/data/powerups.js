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
    apply(player) { player.addOrUpgradeWeapon(new Weapon(WEAPON_TYPES.magic_missile)); },
  },
  {
    id: 'weapon_ice_bolt',
    name: 'Ice Bolt',
    icon: '❄️',
    rarity: 'common',
    isWeaponCard: true,
    weaponId: 'ice_bolt',
    description: 'Homing ice shard — fast & accurate\nPick again to upgrade fire rate',
    apply(player) { player.addOrUpgradeWeapon(new Weapon(WEAPON_TYPES.ice_bolt)); },
  },
  {
    id: 'weapon_fire_bolt',
    name: 'Fireball',
    icon: '🔥',
    rarity: 'uncommon',
    isWeaponCard: true,
    weaponId: 'fire_bolt',
    description: 'Homing fireball — high damage\nPick again to upgrade fire rate',
    apply(player) { player.addOrUpgradeWeapon(new Weapon(WEAPON_TYPES.fire_bolt)); },
  },
  {
    id: 'weapon_lightning_bolt',
    name: 'Lightning',
    icon: '⚡',
    rarity: 'uncommon',
    isWeaponCard: true,
    weaponId: 'lightning_bolt',
    description: 'Homing lightning — rapid fire\nPick again to upgrade fire rate',
    apply(player) { player.addOrUpgradeWeapon(new Weapon(WEAPON_TYPES.lightning_bolt)); },
  },

  // ---- Weapon slot unlock (epic) ----
  {
    id: 'weapon_slot',
    name: 'Arcane Arsenal',
    icon: '⊕',
    rarity: 'epic',
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
    description: '25% faster attack speed\nApplies to all equipped weapons',
    apply(player) {
      for (const w of player.weapons) {
        w.attackInterval = Math.max(6, Math.round(w.attackInterval * 0.75));
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
];
