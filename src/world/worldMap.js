import { CHUNK_WIDTH, CHUNK_HEIGHT, TILE_SIZE } from '../config.js';
import { Chunk } from './chunk.js';
import { GrasslandsGenerator } from './grasslandsMap.js';
import { CavernGenerator }     from './cavernMap.js';
import { DesertGenerator }     from './desertMap.js';

const MAP_GENERATORS = {
  grasslands: GrasslandsGenerator,
  cavern:     CavernGenerator,
  desert:     DesertGenerator,
};

export class WorldMap {
  constructor(mapName = 'grasslands', seed = 73219) {
    const Gen = MAP_GENERATORS[mapName];
    if (!Gen) throw new Error(`Unknown map: ${mapName}`);
    this.mapName   = mapName;
    this.generator = new Gen(seed);
    this._chunks   = new Map();
  }

  // --- Chunk management ---

  getChunk(chunkX) {
    if (!this._chunks.has(chunkX)) {
      const chunk = new Chunk(chunkX, (cx, w, h) => this.generator.generate(cx, w, h));
      this._chunks.set(chunkX, chunk);
    }
    return this._chunks.get(chunkX);
  }

  unloadDistantChunks(centerChunkX, radius = 6) {
    for (const cx of this._chunks.keys()) {
      if (Math.abs(cx - centerChunkX) > radius) this._chunks.delete(cx);
    }
  }

  // --- Tile access (world tile coords) ---

  getTile(tileX, tileY) {
    if (tileY < 0 || tileY >= CHUNK_HEIGHT) return null;
    const chunkX = Math.floor(tileX / CHUNK_WIDTH);
    const localX = ((tileX % CHUNK_WIDTH) + CHUNK_WIDTH) % CHUNK_WIDTH;
    return this.getChunk(chunkX).getTile(localX, tileY);
  }

  // Pixel coords -> tile
  getTileAtPixel(px, py) {
    const tileX = Math.floor(px / TILE_SIZE);
    const tileY = Math.floor(py / TILE_SIZE);
    return { tile: this.getTile(tileX, tileY), tileX, tileY };
  }

  // Pixel x -> chunk index
  pixelToChunkX(px) {
    return Math.floor(px / (TILE_SIZE * CHUNK_WIDTH));
  }
}
