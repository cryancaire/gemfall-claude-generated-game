import { TILE_TYPES } from '../config.js';

// tilesetSrc    — path to the spritesheet image (shared across tileset/tilesetSurface)
// tilesetSurface — {sx,sy,sw,sh} used for tiles whose top face is open air (grass / lava glow)
//                  if present, suppresses the flat topColor strip
// tileset        — {sx,sy,sw,sh} used for underground tiles (or all tiles when no Surface variant)
export const TILE_DEFS = {
  [TILE_TYPES.GROUND]: {
    solid: true,
    color: '#6b4f2e',
    topColor: '#4a8c5c',
    tilesetSrc:     'src/assets/Grasslands/spritesheet/spritesheet.png',
    tilesetSurface: { sx:  48, sy: 32, sw: 16, sh: 16 }, // terrain_top_center_A
    tileset:        { sx:  64, sy: 48, sw: 16, sh: 16 }, // terrain_fill_top_center_A
  },
  [TILE_TYPES.PLATFORM]: {
    solid: true,
    onewayDown: true,
    color: '#8b6914',
    topColor: '#c4a035',
    tilesetSrc:     'src/assets/Grasslands/spritesheet/spritesheet.png',
    tileset:        { sx: 336, sy: 80, sw: 16, sh: 16 }, // terrain_platform_center_A
    tilesetSurface: { sx: 336, sy: 80, sw: 16, sh: 16 }, // same tile — suppresses topColor strip
  },
  [TILE_TYPES.CAVE_GROUND]: {
    solid: true,
    color: '#1a1410',
    topColor: '#992200',
    tilesetSrc: 'src/assets/LavaTileSet.png',
    tileset:    { sx: 0, sy:  0, sw: 32, sh: 32 },
  },
  [TILE_TYPES.CAVE_PLATFORM]: {
    solid: true,
    color: '#252030',
    topColor: '#5c1a00',
    tilesetSrc: 'src/assets/LavaTileSet.png',
    tileset:    { sx: 0, sy: 96, sw: 64, sh: 32 },
  },
};

export class Tile {
  constructor(type) {
    this.type = type;
    this.def = TILE_DEFS[type] ?? null;
  }

  get solid() {
    return this.def?.solid ?? false;
  }
}
