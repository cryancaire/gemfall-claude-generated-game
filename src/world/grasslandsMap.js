import { CHUNK_WIDTH, CHUNK_HEIGHT, TILE_TYPES } from '../config.js';
import { Tile } from './tile.js';

// Each map type exports a generator function and a name.
// To add a new map: create a new file like this one and register it in worldMap.js.
export const MAP_NAME = 'grasslands';

export class GrasslandsGenerator {
  constructor(seed = 73219) {
    this.seed = seed;
    // Per-column ground height cache (tileX -> groundY)
    this._colHeights = new Map();
  }

  // --- Noise helpers ---

  _rand(x) {
    const n = Math.sin(x * 127.1 + this.seed * 311.7) * 43758.5453;
    return n - Math.floor(n);
  }

  // Smooth (cubic-interpolated) noise over integer x values
  _smooth(x, scale) {
    const sx = x / scale;
    const ix = Math.floor(sx);
    const t = sx - ix;
    const st = t * t * (3 - 2 * t); // smoothstep
    return this._rand(ix) * (1 - st) + this._rand(ix + 1) * st;
  }

  // Ground tile Y for a given tile-column x (y=0 is top of world)
  getGroundY(tileX) {
    if (this._colHeights.has(tileX)) return this._colHeights.get(tileX);

    const base = CHUNK_HEIGHT * 0.52;
    const large = this._smooth(tileX, 12) * 5;   // slow hills
    const medium = this._smooth(tileX + 500, 5) * 2; // medium bumps
    const small = this._smooth(tileX + 1000, 2) * 1;  // small detail

    const h = Math.round(base + large + medium + small);
    const clamped = Math.max(5, Math.min(CHUNK_HEIGHT - 8, h));
    this._colHeights.set(tileX, clamped);
    return clamped;
  }

  generate(chunkX, width, height) {
    const tiles = Array.from({ length: height }, () =>
      Array.from({ length: width }, () => new Tile(TILE_TYPES.EMPTY))
    );

    for (let lx = 0; lx < width; lx++) {
      const tileX = chunkX * width + lx;
      const groundY = this.getGroundY(tileX);

      // Fill ground column
      for (let ly = groundY; ly < height; ly++) {
        tiles[ly][lx] = new Tile(TILE_TYPES.GROUND);
      }
    }

    // Floating platforms: 1-3 per chunk, random position above terrain
    const platformCount = Math.floor(this._rand(chunkX * 17 + 3) * 3);
    for (let i = 0; i < platformCount; i++) {
      const seed2 = chunkX * 31 + i * 97;
      const startLX = Math.floor(this._rand(seed2) * (width - 4));
      const platLen = 2 + Math.floor(this._rand(seed2 + 1) * 4); // 2-5 tiles wide
      const endLX = Math.min(startLX + platLen, width - 1);

      // Find min ground height in this x range for this platform's column span
      let minGroundY = CHUNK_HEIGHT;
      for (let px = startLX; px <= endLX; px++) {
        minGroundY = Math.min(minGroundY, this.getGroundY(chunkX * width + px));
      }

      const platY = minGroundY - 5 - Math.floor(this._rand(seed2 + 2) * 4); // 5-8 above terrain
      if (platY < 3 || platY >= minGroundY - 3) continue;

      for (let px = startLX; px <= endLX; px++) {
        tiles[platY][px] = new Tile(TILE_TYPES.PLATFORM);
      }
    }

    return tiles;
  }
}
