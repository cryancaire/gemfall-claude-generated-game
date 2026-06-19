// Each entry defines a fully-configurable enemy archetype.
// To add a new enemy: add an entry here and register it in entityManager.js SPAWN_TABLES.
export const ENEMY_TYPES = {

  slime: {
    width: 28, height: 20,
    hp: 2, damage: 1, speed: 0.8,
    stompKillable: true,   // player can kill by jumping on top
    stompDamage: 1,        // damage dealt on stomp (multiplied by player.damage)
    color: '#22cc44', eyeColor: '#005500',
    gemValue: 4, gemCount: 1,
    detectionRange: 180,   // px before chasing player
    xpReward: 5,
  },

  goblin: {
    width: 18, height: 30,
    hp: 5, damage: 2, speed: 2.0,
    stompKillable: true,
    stompDamage: 1,
    color: '#cc7722', eyeColor: '#440000',
    gemValue: 8, gemCount: 2,
    detectionRange: 240,
    xpReward: 12,
  },

  spikebot: {
    width: 26, height: 26,
    hp: 10, damage: 3, speed: 1.4,
    stompKillable: false,  // player takes damage when trying to stomp
    stompDamage: 0,
    color: '#778899', eyeColor: '#ff2200',
    gemValue: 15, gemCount: 3,
    detectionRange: 300,
    xpReward: 25,
  },

};
