// Each entry defines a fully-configurable enemy archetype.
// To add a new enemy: add an entry here and register it in entityManager.js SPAWN_TABLES.
export const ENEMY_TYPES = {

  slime: {
    width: 28, height: 20,
    hp: 2, damage: 1, speed: 0.8,
    stompKillable: true,
    stompDamage: 1,
    color: '#22cc44', eyeColor: '#005500',
    gemValue: 4, gemCount: 1,
    detectionRange: 180,
    xpReward: 5,
    canJump: true, jumpForce: -9,
    canDropDown: true,
    // Sprite config (frame size matches slime.png: 224×416, 32×32 per frame)
    sprite: {
      src:    'src/assets/mystic-woods/characters/slime.png',
      frameW: 32, frameH: 32,
      scale: 2,           // drawn at 64×64
      footOffsetY: 14,    // shift down so visual feet align with hitbox bottom
      anims: {
        idle: { row: 0, frames: 5, fps: 8  },
        walk: { row: 1, frames: 6, fps: 10 }, // col 6 is empty in this sheet
      },
    },
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
    stompKillable: false,
    stompDamage: 0,
    color: '#778899', eyeColor: '#ff2200',
    gemValue: 15, gemCount: 3,
    detectionRange: 300,
    xpReward: 25,
  },

  specter: {
    width: 24, height: 28,
    hp: 6, damage: 2, speed: 0.9,
    stompKillable: false,
    stompDamage: 0,
    color: '#cc44ff', eyeColor: '#ffffff',
    gemValue: 10, gemCount: 2,
    detectionRange: 999,
    xpReward: 18,
    flying: true,
  },

};
