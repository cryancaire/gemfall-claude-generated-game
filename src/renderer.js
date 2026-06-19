import { TILE_SIZE, CHUNK_HEIGHT, TILE_TYPES } from './config.js';
import { TILE_DEFS } from './world/tile.js';

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this._skyGrad = null;
  }

  _getSkyGradient(h) {
    if (!this._skyGrad || this._lastH !== h) {
      this._skyGrad = this.ctx.createLinearGradient(0, 0, 0, h);
      this._skyGrad.addColorStop(0,   '#4a90d9');
      this._skyGrad.addColorStop(0.6, '#87ceeb');
      this._skyGrad.addColorStop(1,   '#b0e0f8');
      this._lastH = h;
    }
    return this._skyGrad;
  }

  clear() {
    this.ctx.fillStyle = this._getSkyGradient(this.canvas.height);
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  drawWorld(world, camera) {
    const ctx = this.ctx;

    const startTX = Math.floor(camera.x / TILE_SIZE) - 1;
    const endTX   = Math.ceil((camera.x + camera.width)  / TILE_SIZE) + 1;
    const startTY = Math.max(0, Math.floor(camera.y / TILE_SIZE) - 1);
    const endTY   = Math.min(CHUNK_HEIGHT - 1, Math.ceil((camera.y + camera.height) / TILE_SIZE) + 1);

    for (let ty = startTY; ty <= endTY; ty++) {
      for (let tx = startTX; tx <= endTX; tx++) {
        const tile = world.getTile(tx, ty);
        if (!tile || tile.type === TILE_TYPES.EMPTY) continue;

        const def = TILE_DEFS[tile.type];
        if (!def) continue;

        const sx = Math.round(tx * TILE_SIZE - camera.x);
        const sy = Math.round(ty * TILE_SIZE - camera.y);

        // Body
        ctx.fillStyle = def.color;
        ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);

        // Top stripe when exposed above
        const above = world.getTile(tx, ty - 1);
        if (!above || !above.solid) {
          ctx.fillStyle = def.topColor;
          ctx.fillRect(sx, sy, TILE_SIZE, 5);
        }

        // Subtle edge shading
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.fillRect(sx, sy + TILE_SIZE - 3, TILE_SIZE, 3); // bottom shadow
        ctx.fillRect(sx + TILE_SIZE - 3, sy, 3, TILE_SIZE); // right shadow
      }
    }
  }

  drawPlayer(player, camera) {
    player.draw(this.ctx, camera);
  }

  drawHUD(player) {
    const ctx  = this.ctx;
    const pad  = 12;
    const barW = 160;
    const barH = 14;

    // Health bar
    const hpY = pad;
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(pad - 1, hpY - 1, barW + 2, barH + 2);
    ctx.fillStyle = '#3a0000';
    ctx.fillRect(pad, hpY, barW, barH);
    ctx.fillStyle = '#e03030';
    ctx.fillRect(pad, hpY, Math.round(barW * Math.max(0, player.hp) / player.maxHp), barH);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 10px monospace';
    ctx.fillText(`HP  ${player.hp} / ${player.maxHp}`, pad + 4, hpY + barH - 2);

    // XP bar
    const xpY = hpY + barH + 5;
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(pad - 1, xpY - 1, barW + 2, barH + 2);
    ctx.fillStyle = '#001a33';
    ctx.fillRect(pad, xpY, barW, barH);
    ctx.fillStyle = '#2a9fff';
    ctx.fillRect(pad, xpY, Math.round(barW * player.xp / player.xpToNext), barH);
    ctx.fillStyle = '#fff';
    ctx.fillText(`LV ${player.level}   ${player.xp} / ${player.xpToNext} XP`, pad + 4, xpY + barH - 2);

    // Coords debug
    const dbY = xpY + barH + 6;
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(pad - 1, dbY, barW + 2, 17);
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = '10px monospace';
    ctx.fillText(`x:${Math.round(player.x)}  y:${Math.round(player.y)}`, pad + 3, dbY + 12);
  }
}
