import { CHUNK_HEIGHT, TILE_SIZE } from './config.js';

const WORLD_HEIGHT_PX = CHUNK_HEIGHT * TILE_SIZE;

export class Camera {
  constructor(viewWidth, viewHeight) {
    this.x = 0;
    this.y = 0;
    this.width = viewWidth;
    this.height = viewHeight;
  }

  follow(target) {
    // Horizontally: center on player
    this.x = target.x + target.width / 2 - this.width / 2;

    // Vertically: keep player in upper 40–60% of screen
    const targetY = target.y + target.height / 2 - this.height * 0.5;
    this.y += (targetY - this.y) * 0.1; // smooth

    // Clamp to world vertical bounds
    this.y = Math.max(0, Math.min(this.y, WORLD_HEIGHT_PX - this.height));
  }
}
