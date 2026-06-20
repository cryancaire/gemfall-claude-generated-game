import { TILE_SIZE, CHUNK_HEIGHT, TILE_TYPES } from './config.js';
import { TILE_DEFS } from './world/tile.js';
import { RARITY_COLOR } from './data/rarities.js';
import { Settings } from './settings.js';

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this._skyGrad = null;
    this._imgCache = new Map();
  }

  _img(src) {
    if (!this._imgCache.has(src)) {
      const img = new Image();
      img.src = src;
      this._imgCache.set(src, img);
    }
    return this._imgCache.get(src);
  }

  _getSkyGradient(h, mapName = 'grasslands') {
    const key = `${mapName}:${h}`;
    if (this._skyGrad && this._skyKey === key) return this._skyGrad;
    this._skyKey  = key;
    this._skyGrad = this.ctx.createLinearGradient(0, 0, 0, h);
    if (mapName === 'cavern') {
      this._skyGrad.addColorStop(0,   '#0a0814');
      this._skyGrad.addColorStop(0.5, '#1c0a06');
      this._skyGrad.addColorStop(1,   '#331200');
    } else {
      this._skyGrad.addColorStop(0,   '#4a90d9');
      this._skyGrad.addColorStop(0.6, '#87ceeb');
      this._skyGrad.addColorStop(1,   '#b0e0f8');
    }
    return this._skyGrad;
  }

  clear(mapName = 'grasslands') {
    this.ctx.fillStyle = this._getSkyGradient(this.canvas.height, mapName);
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  drawWorld(world, camera) {
    const ctx = this.ctx;

    const startTX = Math.floor(camera.x / TILE_SIZE) - 1;
    const endTX   = Math.ceil((camera.x + camera.width)  / TILE_SIZE) + 1;
    const startTY = Math.max(0, Math.floor(camera.y / TILE_SIZE) - 1);
    const endTY   = Math.min(CHUNK_HEIGHT - 1, Math.ceil((camera.y + camera.height) / TILE_SIZE) + 1);

    ctx.imageSmoothingEnabled = false;

    for (let ty = startTY; ty <= endTY; ty++) {
      for (let tx = startTX; tx <= endTX; tx++) {
        const tile = world.getTile(tx, ty);
        if (!tile || tile.type === TILE_TYPES.EMPTY) continue;

        const def = TILE_DEFS[tile.type];
        if (!def) continue;

        const sx = Math.round(tx * TILE_SIZE - camera.x);
        const sy = Math.round(ty * TILE_SIZE - camera.y);

        const above     = world.getTile(tx, ty - 1);
        const isSurface = !above || !above.solid;

        // Pick tile region: dedicated surface texture > body texture > nothing (flat color)
        const tset = (isSurface && def.tilesetSurface) ? def.tilesetSurface
                   : def.tileset ?? null;

        // Fill base color first (shows through transparent pixels / before image loads)
        ctx.fillStyle = def.color;
        ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);

        // Overlay tileset texture
        if (def.tilesetSrc && tset) {
          const img = this._img(def.tilesetSrc);
          if (img.complete && img.naturalWidth > 0) {
            ctx.drawImage(img, tset.sx, tset.sy, tset.sw, tset.sh, sx, sy, TILE_SIZE, TILE_SIZE);
          }
        }

        // Flat topColor strip — only when no dedicated surface texture handles it
        if (isSurface && !def.tilesetSurface) {
          ctx.fillStyle = def.topColor;
          ctx.fillRect(sx, sy, TILE_SIZE, 5);
        }

        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.fillRect(sx, sy + TILE_SIZE - 3, TILE_SIZE, 3);
        ctx.fillRect(sx + TILE_SIZE - 3, sy, 3, TILE_SIZE);
      }
    }

    ctx.imageSmoothingEnabled = true;
  }

  // Parallax background layers — drawn after clear(), before drawWorld()
  drawParallax(camera, mapName = 'grasslands') {
    if (mapName !== 'grasslands') return;

    const ctx = this.ctx;
    const W   = this.canvas.width;
    const H   = this.canvas.height;

    // baseY is the fraction of canvas height at which the BOTTOM of each layer sits.
    // Terrain in grasslands typically appears around 50–65 % down the canvas.
    // Layers are drawn back-to-front; each one sits slightly lower than the last.
    const LAYERS = [
      { src: 'src/assets/Grasslands/PNG/bg4.png', speedX: 0.05, baseY: 0.45 },
      { src: 'src/assets/Grasslands/PNG/bg3.png', speedX: 0.15, baseY: 0.50 },
      { src: 'src/assets/Grasslands/PNG/bg2.png', speedX: 0.30, baseY: 0.55 },
      { src: 'src/assets/Grasslands/PNG/bg1.png', speedX: 0.50, baseY: 0.62 },
    ];

    ctx.save();
    ctx.imageSmoothingEnabled = false;

    for (const { src, speedX, baseY } of LAYERS) {
      const img = this._img(src);
      if (!img.complete || img.naturalWidth === 0) continue;

      const iw = img.naturalWidth;
      const ih = img.naturalHeight;
      const dy = Math.round(H * baseY) - ih;    // bottom of layer at baseY % of canvas
      const startX = -((camera.x * speedX) % iw);

      for (let x = startX; x < W; x += iw) ctx.drawImage(img, x, dy);
      if (startX > 0) ctx.drawImage(img, startX - iw, dy);
    }

    ctx.restore();
  }

  drawPlayer(player, camera) {
    player.draw(this.ctx, camera);
  }

  drawHUD(player, playTime = 0) {
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

    // Timer + difficulty — anchored to top-center so it scales with UI scale
    ctx.save();
    ctx.translate(this.canvas.width / 2, 0);
    ctx.scale(s, s);
    ctx.translate(-this.canvas.width / 2, 0);
    this._drawTimer(playTime);
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
        ctx.fillText(weapon.type.displayIcon ?? weapon.type.icon ?? '?', x + slotW / 2, y + 30);

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
        ctx.fillText(`SPD ${weapon.attackInterval}`, x + slotW / 2, y + 74);

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

  // ---- Timer + difficulty bar (top-center) ----

  _drawTimer(playTime) {
    const ctx = this.ctx;

    const totalSec = Math.floor(playTime);
    const m        = Math.floor(totalSec / 60);
    const sec      = totalSec % 60;
    const timeText = `${m}:${sec.toString().padStart(2, '0')}`;

    // Wave increments every 20 seconds — matches entityManager._scaleDifficulty
    const wave     = Math.floor(playTime / 20);
    const waveProg = (playTime % 20) / 20;  // 0–1 within current wave

    const waveColor = wave === 0 ? '#55ccff'
                    : wave <= 2  ? '#66ff55'
                    : wave <= 4  ? '#ffcc00'
                    : wave <= 7  ? '#ff8800'
                    :              '#ff3300';

    const cx   = this.canvas.width / 2;
    const boxW = 168;
    const bx   = cx - boxW / 2;
    const by   = 10;

    ctx.save();
    ctx.textBaseline = 'top';
    ctx.textAlign    = 'center';

    // Background box (taller to fit timer + wave bar)
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    this._roundRect(ctx, bx, by, boxW, 46, 5);
    ctx.fill();

    // Timer text
    ctx.font      = 'bold 16px monospace';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(timeText, cx, by + 8);

    // Wave label (left of bar)
    const rowY = by + 30;
    ctx.font      = 'bold 9px monospace';
    ctx.textAlign = 'left';
    ctx.fillStyle = waveColor;
    ctx.fillText(`W${wave}`, bx + 12, rowY + 1);

    // Segmented progress bar — fills as the wave timer counts up
    const labelW   = 24;
    const barX     = bx + 12 + labelW;
    const barAvail = boxW - 12 * 2 - labelW;
    const SEGS     = 10;
    const segW     = barAvail / SEGS;
    const filled   = Math.round(waveProg * SEGS);

    for (let i = 0; i < SEGS; i++) {
      ctx.fillStyle = i < filled ? waveColor : 'rgba(255,255,255,0.13)';
      ctx.fillRect(Math.round(barX + i * segW + 1), rowY, Math.round(segW) - 2, 7);
    }

    ctx.restore();
  }

  // ---- Boss HP bar (top-center, above timer) ----

  drawBossHUD(boss) {
    if (!boss || boss.dead) return;
    const ctx  = this.ctx;
    const W    = this.canvas.width;
    const barW = Math.min(520, W - 80);
    const cx   = W / 2;
    const bx   = cx - barW / 2;
    const by   = 64;   // just below the timer box
    const barH = 18;

    // Background panel
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.72)';
    this._roundRect(ctx, bx - 4, by - 4, barW + 8, barH + 26, 6);
    ctx.fill();

    // Name label
    ctx.font      = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffcc00';
    ctx.fillText(boss.name.toUpperCase(), cx, by + 8);

    // Track
    ctx.fillStyle = '#400';
    ctx.fillRect(bx, by + 13, barW, barH);

    // HP fill — shifts red→orange as health drops
    const ratio = Math.max(0, boss.hp / boss.maxHp);
    const r = Math.round(200 + 55 * (1 - ratio));
    const g = Math.round(30  + 80 * ratio);
    ctx.fillStyle = `rgb(${r},${g},30)`;
    ctx.fillRect(bx, by + 13, Math.round(barW * ratio), barH);

    // HP text
    ctx.font      = 'bold 10px monospace';
    ctx.fillStyle = '#fff';
    ctx.fillText(`${boss.hp} / ${boss.maxHp}`, cx, by + 13 + barH - 3);

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
