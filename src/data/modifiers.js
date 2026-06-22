export const MODIFIERS = [
  {
    id: 'crowds',
    name: 'Crowds',
    icon: '👥',
    description: 'Enemy spawns are 60% more frequent',
    shardBonus: 0.30,
    apply(_player, entities) { entities._crowdsActive = true; },
  },
  {
    id: 'fragile',
    name: 'Fragile',
    icon: '💔',
    description: 'You take double damage from all sources',
    shardBonus: 0.50,
    apply(player) { player.damageTakenMult *= 2; },
  },
  {
    id: 'no_mercy',
    name: 'No Mercy',
    icon: '☠️',
    description: 'HP regeneration is completely disabled',
    shardBonus: 0.25,
    apply(player) { player.regenDisabled = true; },
  },
];
