import { CHUNK_WIDTH, CHUNK_HEIGHT, TILE_TYPES } from '../config.js';
import { Tile } from './tile.js';

export const MAP_NAME = 'desert';

export class DesertGenerator {
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
    // Wide sweeping dunes with moderate variation — between grasslands and cavern
    const base   = CHUNK_HEIGHT * 0.50;
    const dune   = this._smooth(tileX,        10) * 7;  // wide dune rolls
    const medium = this._smooth(tileX +  400,  4) * 3;  // smaller ridges
    const ripple = this._smooth(tileX + 1100, 1.8) * 1.2; // surface texture
    const h = Math.round(base + dune + medium + ripple);
    const clamped = Math.max(5, Math.min(CHUNK_HEIGHT - 7, h));
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
        tiles[ly][lx] = new Tile(TILE_TYPES.DESERT_GROUND);
      }
    }

    // Sandstone ledge platforms: 1-3 per chunk, wider than grasslands
    const platformCount = 1 + Math.floor(this._rand(chunkX * 17 + 3) * 3);
    for (let i = 0; i < platformCount; i++) {
      const seed2   = chunkX * 31 + i * 97;
      const startLX = Math.floor(this._rand(seed2) * (width - 4));
      const platLen = 3 + Math.floor(this._rand(seed2 + 1) * 5); // 3-7 tiles — wider than grasslands
      const endLX   = Math.min(startLX + platLen, width - 1);

      let minGroundY = CHUNK_HEIGHT;
      for (let px = startLX; px <= endLX; px++) {
        minGroundY = Math.min(minGroundY, this.getGroundY(chunkX * width + px));
      }

      const platY = minGroundY - 5 - Math.floor(this._rand(seed2 + 2) * 5);
      if (platY < 3 || platY >= minGroundY - 3) continue;

      for (let px = startLX; px <= endLX; px++) {
        tiles[platY][px] = new Tile(TILE_TYPES.DESERT_PLATFORM);
      }
    }

    return tiles;
  }
}
