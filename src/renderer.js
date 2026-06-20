import { TILE_SIZE, CHUNK_HEIGHT, TILE_TYPES } from './config.js';
import { TILE_DEFS } from './world/tile.js';
import { RARITY_COLOR } from './data/rarities.js';
import { Settings } from './settings.js';

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

        ctx.fillStyle = def.color;
        ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);

        const above = world.getTile(tx, ty - 1);
        if (!above || !above.solid) {
          ctx.fillStyle = def.topColor;
          ctx.fillRect(sx, sy, TILE_SIZE, 5);
        }

        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.fillRect(sx, sy + TILE_SIZE - 3, TILE_SIZE, 3);
        ctx.fillRect(sx + TILE_SIZE - 3, sy, 3, TILE_SIZE);
      }
    }
  }

  drawPlayer(player, camera) {
    player.draw(this.ctx, camera);
  }

  drawHUD(player) {
    const ctx = this.ctx;
    const s   = Settings.uiScale;

    // Upgrades panel scales from top-left corner
    ctx.save();
    ctx.scale(s, s);
    this._drawAcquiredUpgrades(player);
    ctx.restore();

    // Weapon slots + bars scale from bottom-center so they stay anchored to the bottom
    ctx.save();
    ctx.translate(this.canvas.width / 2, this.canvas.height);
    ctx.scale(s, s);
    ctx.translate(-this.canvas.width / 2, -this.canvas.height);
    this._drawWeaponSlots(player);
    this._drawBars(player);
    ctx.restore();
  }

  // ---- HP / XP bars (centered, just above weapon slots) ----

  _drawBars(player) {
    const ctx  = this.ctx;
    const barW = 220;
    const barH = 14;
    const gap  = 5;

    const slotTop = this.canvas.height - 82 - 14;  // weapon slot top edge
    const xpY = slotTop - 8 - barH;
    const hpY = xpY - gap - barH;
    const barX = Math.round((this.canvas.width - barW) / 2);

    // HP bar
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(barX - 1, hpY - 1, barW + 2, barH + 2);
    ctx.fillStyle = '#3a0000';
    ctx.fillRect(barX, hpY, barW, barH);
    ctx.fillStyle = '#e03030';
    ctx.fillRect(barX, hpY, Math.round(barW * Math.max(0, player.hp) / player.maxHp), barH);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`HP  ${player.hp} / ${player.maxHp}`, barX + 4, hpY + barH - 2);

    // XP bar
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(barX - 1, xpY - 1, barW + 2, barH + 2);
    ctx.fillStyle = '#001a33';
    ctx.fillRect(barX, xpY, barW, barH);
    ctx.fillStyle = '#2a9fff';
    ctx.fillRect(barX, xpY, Math.round(barW * player.xp / player.xpToNext), barH);
    ctx.fillStyle = '#fff';
    ctx.fillText(`LV ${player.level}   ${player.xp} / ${player.xpToNext} XP`, barX + 4, xpY + barH - 2);
  }

  // ---- Weapon slots (bottom-center) ----

  _drawWeaponSlots(player) {
    const ctx    = this.ctx;
    const slotW  = 108;
    const slotH  = 82;
    const gap    = 8;
    const n      = player.maxWeaponSlots;
    const totalW = n * slotW + (n - 1) * gap;
    const startX = Math.round((this.canvas.width - totalW) / 2);
    const startY = this.canvas.height - slotH - 14;

    ctx.save();

    for (let i = 0; i < n; i++) {
      const x      = startX + i * (slotW + gap);
      const y      = startY;
      const weapon = player.weapons[i] ?? null;

      // Slot background
      ctx.fillStyle = 'rgba(0,0,0,0.62)';
      this._roundRect(ctx, x, y, slotW, slotH, 6);
      ctx.fill();

      if (weapon) {
        const rarityCol = RARITY_COLOR[weapon.rarity] ?? '#aaa';

        // Rarity-colored border
        ctx.strokeStyle = rarityCol;
        ctx.lineWidth   = 2;
        this._roundRect(ctx, x + 1, y + 1, slotW - 2, slotH - 2, 5);
        ctx.stroke();

        // Subtle rarity glow at top
        const grad = ctx.createLinearGradient(x, y, x, y + slotH * 0.4);
        grad.addColorStop(0, rarityCol + '44');
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        this._roundRect(ctx, x + 1, y + 1, slotW - 2, slotH - 2, 5);
        ctx.fill();

        // Weapon icon
        ctx.font      = '26px serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#fff';
        ctx.fillText(weapon.type.icon ?? '?', x + slotW / 2, y + 30);

        // Weapon name
        ctx.font      = 'bold 9px monospace';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(weapon.type.name, x + slotW / 2, y + 44);

        // Rarity label
        ctx.font      = 'bold 8px monospace';
        ctx.fillStyle = rarityCol;
        ctx.fillText(weapon.rarity.toUpperCase(), x + slotW / 2, y + 54);

        // Stats row
        ctx.font      = '8px monospace';
        ctx.fillStyle = '#cccccc';
        ctx.fillText(`DMG ${weapon.damage}   RNG ${weapon.attackRange}`, x + slotW / 2, y + 65);
        ctx.fillText(`SPD ${weapon.attackInterval}f`, x + slotW / 2, y + 74);

      } else {
        // Empty slot — dashed border
        ctx.strokeStyle = 'rgba(255,255,255,0.22)';
        ctx.lineWidth   = 1;
        ctx.setLineDash([5, 4]);
        this._roundRect(ctx, x + 2, y + 2, slotW - 4, slotH - 4, 4);
        ctx.stroke();
        ctx.setLineDash([]);

        // Plus symbol
        ctx.font      = '22px monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(255,255,255,0.25)';
        ctx.fillText('+', x + slotW / 2, y + slotH / 2 + 8);
      }
    }

    ctx.textAlign = 'left';
    ctx.restore();
  }

  // ---- Acquired upgrades panel (top-left, 5 per row) ----

  _drawAcquiredUpgrades(player) {
    const upgrades = player.acquiredUpgrades;
    if (upgrades.length === 0) return;

    const ctx     = this.ctx;
    const box     = 30;
    const gap     = 4;
    const cols    = 5;
    const panelX  = 12;
    const panelY  = 12;

    const rows    = Math.ceil(upgrades.length / cols);
    const panelW  = cols * (box + gap) - gap + 8;
    const panelH  = rows * (box + gap) - gap + 8;

    ctx.save();

    // Panel background
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    this._roundRect(ctx, panelX - 4, panelY - 4, panelW, panelH, 5);
    ctx.fill();

    upgrades.forEach((upg, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const bx  = panelX + col * (box + gap);
      const by  = panelY + row * (box + gap);

      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      this._roundRect(ctx, bx, by, box, box, 4);
      ctx.fill();

      ctx.font      = '16px serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(upg.icon, bx + box / 2, by + box / 2 + 5);
    });

    ctx.textAlign = 'left';
    ctx.restore();
  }

  // ---- Utility ----

  _roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }
}
