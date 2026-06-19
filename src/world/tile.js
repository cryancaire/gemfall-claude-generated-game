import { TILE_TYPES } from '../config.js';

export const TILE_DEFS = {
  [TILE_TYPES.GROUND]: {
    solid: true,
    color: '#6b4f2e',
    topColor: '#4a8c5c',
  },
  [TILE_TYPES.PLATFORM]: {
    solid: true,
    onewayDown: true,  // placeholder for future one-way platforms
    color: '#8b6914',
    topColor: '#c4a035',
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
