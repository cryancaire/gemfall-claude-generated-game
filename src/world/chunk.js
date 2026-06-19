import { CHUNK_WIDTH, CHUNK_HEIGHT } from '../config.js';

export class Chunk {
  constructor(chunkX, generateFn) {
    this.chunkX = chunkX;
    // tiles[y][x], y=0 is top
    this.tiles = generateFn(chunkX, CHUNK_WIDTH, CHUNK_HEIGHT);
  }

  getTile(localX, localY) {
    if (localX < 0 || localX >= CHUNK_WIDTH || localY < 0 || localY >= CHUNK_HEIGHT) return null;
    return this.tiles[localY][localX];
  }
}
