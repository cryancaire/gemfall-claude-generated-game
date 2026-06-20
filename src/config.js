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
};

// Base player stats — weapons and level-ups will derive from / override these
export const PLAYER_DEFAULTS = {
  maxHp: 6,
  damage: 1, // stomp / future weapon damage
  speed: 4.5,
  maxJumps: 1, // >1 enables multi-jump (double, triple, etc.)
};

// XP needed to advance from `level` to `level + 1`
export function xpForLevel(level) {
  return Math.floor(20 * Math.pow(level, 1.4));
}
