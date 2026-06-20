import { Weapon }       from '../weapons/weapon.js';
import { WEAPON_TYPES } from '../weapons/weaponTypes.js';

// All base-rarity powerup definitions.
// apply(player, entities) mutates game state directly.
// To add new powerups: append an entry here — the level-up screen picks randomly from this pool.
export const POWERUP_POOL = [
  // ---- Weapons — picking one you already have upgrades its fire rate instead ----
  {
    id: 'weapon_magic_missile',
    name: 'Magic Missile',
    icon: '🔮',
    rarity: 'common',
    description: 'Homing magic orb\nUpgrades fire rate if already equipped',
    apply(player) { player.addOrUpgradeWeapon(new Weapon(WEAPON_TYPES.magic_missile)); },
  },
  {
    id: 'weapon_ice_bolt',
    name: 'Ice Bolt',
    icon: '❄️',
    rarity: 'common',
    description: 'Homing ice shard\nUpgrades fire rate if already equipped',
    apply(player) { player.addOrUpgradeWeapon(new Weapon(WEAPON_TYPES.ice_bolt)); },
  },
  {
    id: 'weapon_fire_bolt',
    name: 'Fireball',
    icon: '🔥',
    rarity: 'uncommon',
    description: 'Homing fireball — high damage\nUpgrades fire rate if already equipped',
    apply(player) { player.addOrUpgradeWeapon(new Weapon(WEAPON_TYPES.fire_bolt)); },
  },
  {
    id: 'weapon_lightning_bolt',
    name: 'Lightning',
    icon: '⚡',
    rarity: 'uncommon',
    description: 'Homing lightning — rapid fire\nUpgrades fire rate if already equipped',
    apply(player) { player.addOrUpgradeWeapon(new Weapon(WEAPON_TYPES.lightning_bolt)); },
  },

  // ---- Weapon upgrades — affect ALL equipped weapons ----
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
    apply(player, _entities) {
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
    apply(player, _entities) {
      player.heal(4);
    },
  },
  {
    id: 'extra_jump',
    name: 'Featherweight',
    icon: '⬆️',
    rarity: 'uncommon',
    description: '+1 Jump\nDouble jump, triple jump...',
    apply(player, _entities) {
      player.maxJumps += 1;
    },
  },
  {
    id: 'damage',
    name: 'Crushing Force',
    icon: '💪',
    rarity: 'common',
    description: '+1 Stomp Damage\nKill enemies faster',
    apply(player, _entities) {
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
    apply(player, _entities) {
      player.gemValueMultiplier *= 1.5;
    },
  },
];

export const RARITY_COLOR = {
  common:   '#aaaaaa',
  uncommon: '#3ab464',
  rare:     '#cc55ff',
};
