// Each entry defines a fully-configurable enemy archetype.
// To add a new enemy: add an entry here and register it in entityManager.js SPAWN_TABLES.
export const ENEMY_TYPES = {

  slime: {
    width: 28, height: 20,
    hp: 2, damage: 1, speed: 0.8,
    color: '#22cc44', eyeColor: '#005500',
    gemValue: 4, gemCount: 1,
    detectionRange: 180,
    xpReward: 5,
    canJump: true, jumpForce: -9,
    canDropDown: true,
    // mini_slime_walk.png: 256×32, 32×32 per frame, 8-frame walk strip (row 0 only)
    sprite: {
      src:    'src/assets/slime/Mini_Slime_Walk.png',
      frameW: 32, frameH: 32,
      scale: 2,
      footOffsetY: 8,
      anims: {
        idle: { row: 0, frames: 2, fps: 3  },
        walk: { row: 0, frames: 8, fps: 12 },
      },
    },
  },

  goblin: {
    width: 18, height: 30,
    hp: 5, damage: 2, speed: 2.0,
    color: '#cc7722', eyeColor: '#440000',
    gemValue: 8, gemCount: 2,
    detectionRange: 240,
    xpReward: 12,
    canJump: true, jumpForce: -11,
    canDropDown: true,
    // goblin-scout.png: 5400×2500, 600×500 per frame, 9 cols × 5 rows
    // Row 0 = run cycle (8 frames), Row 1 = patrol walk (6 frames)
    sprite: {
      src:         'src/assets/goblin/goblin-scout.png',
      frameW:      600, frameH: 500,
      scale:       0.1,        // drawn at 60×50px
      footOffsetY: 5,
      anims: {
        idle: { row: 1, frames: 6, fps: 6  },
        walk: { row: 0, frames: 8, fps: 12 },
      },
    },
  },

  spikebot: {
    width: 26, height: 26,
    hp: 10, damage: 3, speed: 1.4,
    color: '#778899', eyeColor: '#ff2200',
    gemValue: 15, gemCount: 3,
    detectionRange: 300,
    xpReward: 25,
  },

  specter: {
    width: 24, height: 28,
    hp: 6, damage: 2, speed: 0.9,
    color: '#cc44ff', eyeColor: '#ffffff',
    gemValue: 10, gemCount: 2,
    detectionRange: 999,
    xpReward: 18,
    flying: true,
    // ghost_sprite_sheet.png: 768×1792, 96×256 per frame, 8 cols × 7 rows
    // Row 0 = alert open-eyed float cycle (8 frames)
    sprite: {
      src:         'src/assets/ghost_sprite_sheet.png',
      frameW:      96, frameH: 256,
      scale:       0.25,       // drawn at 24×64
      footOffsetY: 20,
      anims: {
        idle: { row: 0, frames: 8, fps: 6 },
      },
    },
  },

};
