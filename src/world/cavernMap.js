import { CHUNK_HEIGHT, TILE_TYPES } from '../config.js';
import { Tile } from './tile.js';

export const MAP_NAME = 'cavern';

export class CavernGenerator {
  constructor(seed = 73219) {
    this.seed = seed;
    this._colHeights = new Map();
  }

  _rand(x) {
    const n = Math.sin(x * 127.1 + this.seed * 311.7) * 43758.5453;
    return n - Math.floor(n);
  }

  _smooth(x, scale) {
    const sx = x / scale;
    const ix = Math.floor(sx);
    const t  = sx - ix;
    const st = t * t * (3 - 2 * t);
    return this._rand(ix) * (1 - st) + this._rand(ix + 1) * st;
  }

  getGroundY(tileX) {
    if (this._colHeights.has(tileX)) return this._colHeights.get(tileX);
    // More dramatic terrain: larger amplitude, sharper features
    const base   = CHUNK_HEIGHT * 0.44;
    const large  = this._smooth(tileX,        7) * 9;   // big rocky formations
    const medium = this._smooth(tileX +  800, 3) * 4;   // mid-size protrusions
    const small  = this._smooth(tileX + 1500, 1.5) * 2; // jagged edges
    const h = Math.round(base + large + medium + small);
    const clamped = Math.max(6, Math.min(CHUNK_HEIGHT - 6, h));
    this._colHeights.set(tileX, clamped);
    return clamped;
  }

  generate(chunkX, width, height) {
    const tiles = Array.from({ length: height }, () =>
      Array.from({ length: width }, () => new Tile(TILE_TYPES.EMPTY))
    );

    for (let lx = 0; lx < width; lx++) {
      const tileX  = chunkX * width + lx;
      const groundY = this.getGroundY(tileX);
      for (let ly = groundY; ly < height; ly++) {
        tiles[ly][lx] = new Tile(TILE_TYPES.CAVE_GROUND);
      }
    }

    // 2–5 stone ledge platforms per chunk, more aggressively placed
    const platformCount = 2 + Math.floor(this._rand(chunkX * 17 + 3) * 4);
    for (let i = 0; i < platformCount; i++) {
      const seed2   = chunkX * 31 + i * 97;
      const startLX = Math.floor(this._rand(seed2) * (width - 3));
      const platLen = 2 + Math.floor(this._rand(seed2 + 1) * 4);
      const endLX   = Math.min(startLX + platLen, width - 1);

      let minGroundY = CHUNK_HEIGHT;
      for (let px = startLX; px <= endLX; px++) {
        minGroundY = Math.min(minGroundY, this.getGroundY(chunkX * width + px));
      }

      // Platforms higher relative to terrain — feels like floating stone bridges
      const platY = minGroundY - 5 - Math.floor(this._rand(seed2 + 2) * 6);
      if (platY < 3 || platY >= minGroundY - 3) continue;

      for (let px = startLX; px <= endLX; px++) {
        tiles[platY][px] = new Tile(TILE_TYPES.CAVE_PLATFORM);
      }
    }

    return tiles;
  }
}
