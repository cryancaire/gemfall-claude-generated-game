export const TILE_SIZE = 32;
export const CHUNK_WIDTH = 16; // tiles wide per chunk
export const CHUNK_HEIGHT = 30; // tiles tall (world height)

export const GRAVITY = 0.55;
export const JUMP_FORCE = -13;
export const TERMINAL_VELOCITY = 22;

export const TILE_TYPES = {
  EMPTY: 0,
  GROUND: 1,
  PLATFORM: 2,
  CAVE_GROUND: 3,
  CAVE_PLATFORM: 4,
};

// Base player stats — weapons and level-ups will derive from / override these
export const PLAYER_DEFAULTS = {
  maxHp: 6,
  damage: 1, // stomp / future weapon damage
  speed: 4.5,
  maxJumps: 1, // >1 enables multi-jump (double, triple, etc.)
};

// Hard cap on simultaneous projectiles per weapon — upgradable up to this value via level-up cards
export const MAX_PROJECTILES_PER_WEAPON = 10;

// Seconds of play time before the boss spawns (600 = 10 minutes)
export const BOSS_SPAWN_TIME = 600;

// XP needed to advance from `level` to `level + 1`
export function xpForLevel(level) {
  return Math.floor(20 * Math.pow(level, 1.4));
}
