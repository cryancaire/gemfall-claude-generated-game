// All base-rarity powerup definitions.
// apply(player, entities) mutates game state directly.
// To add new powerups: append an entry here — the level-up screen picks randomly from this pool.
export const POWERUP_POOL = [
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
    icon: '⚡',
    rarity: 'common',
    description: '+1 Stomp Damage\nKill enemies faster',
    apply(player, _entities) {
      player.damage += 1;
    },
  },
  {
    id: 'slow_enemies',
    name: 'Quagmire',
    icon: '❄️',
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
  rare:     '#a050dc',
};
