import { TILE_SIZE, CHUNK_HEIGHT, TILE_TYPES, BOSS_SPAWN_TIME, ENDLESS_MILESTONE_TIME } from './config.js';
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
    } else if (mapName === 'desert') {
      this._skyGrad.addColorStop(0,   '#c87830');
      this._skyGrad.addColorStop(0.5, '#e8a040');
      this._skyGrad.addColorStop(1,   '#f0c870');
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

    // Anchor layers to where the ground surface actually appears on screen.
    // This keeps layers properly aligned regardless of canvas height.
    // worldGroundY: nominal grasslands surface (52 % of world height in world-space px)
    const worldGroundY  = Math.round(CHUNK_HEIGHT * 0.52) * TILE_SIZE;
    const groundScreenY = Math.max(1, worldGroundY - camera.y);

    // baseY is now a multiplier of groundScreenY (not canvas height).
    // Values < 1 place the layer bottom above the ground (distant elements).
    // Values > 1 overlap into the terrain — those pixels are hidden by tiles.
    const LAYERS = [
      { src: 'src/assets/Grasslands/PNG/bg4.png', speedX: 0.05, baseY: 0.91 },
      { src: 'src/assets/Grasslands/PNG/bg3.png', speedX: 0.15, baseY: 1.01 },
      { src: 'src/assets/Grasslands/PNG/bg2.png', speedX: 0.30, baseY: 1.11 },
      { src: 'src/assets/Grasslands/PNG/bg1.png', speedX: 0.50, baseY: 1.25 },
    ];

    ctx.save();
    ctx.imageSmoothingEnabled = false;

    for (const { src, speedX, baseY } of LAYERS) {
      const img = this._img(src);
      if (!img.complete || img.naturalWidth === 0) continue;

      const iw = img.naturalWidth;
      const ih = img.naturalHeight;
      const dy = Math.round(groundScreenY * baseY) - ih;
      const startX = -((camera.x * speedX) % iw);

      for (let x = startX; x < W; x += iw) ctx.drawImage(img, x, dy);
      if (startX > 0) ctx.drawImage(img, startX - iw, dy);
    }

    ctx.restore();
  }

  drawPlayer(player, camera) {
    player.draw(this.ctx, camera);
  }

  drawHUD(player, playTime = 0, endlessMode = false) {
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
    this._drawTimer(playTime, endlessMode);
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
    const all      = player.acquiredUpgrades;
    const upgrades = all.filter(u => !u.id.startsWith('relic_'));
    const relics   = all.filter(u => u.id.startsWith('relic_'));
    if (upgrades.length === 0 && relics.length === 0) return;

    const ctx    = this.ctx;
    const box    = 30;
    const gap    = 4;
    const cols   = 5;
    const panelX = 12;
    const labelH = 13;
    let   curY   = 12;

    ctx.save();

    const drawSection = (items, label, labelColor, tileBg) => {
      if (items.length === 0) return;

      // Label
      ctx.font      = 'bold 9px monospace';
      ctx.textAlign = 'left';
      ctx.fillStyle = labelColor;
      ctx.fillText(label, panelX, curY + 9);
      curY += labelH + 2;

      const rows   = Math.ceil(items.length / cols);
      const panelW = cols * (box + gap) - gap + 8;
      const panelH = rows * (box + gap) - gap + 8;

      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      this._roundRect(ctx, panelX - 4, curY - 4, panelW, panelH, 5);
      ctx.fill();

      items.forEach((upg, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const bx  = panelX + col * (box + gap);
        const by  = curY + row * (box + gap);

        ctx.fillStyle = tileBg;
        this._roundRect(ctx, bx, by, box, box, 4);
        ctx.fill();

        ctx.font      = '16px serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(upg.icon, bx + box / 2, by + box / 2 + 5);
      });

      curY += rows * (box + gap) - gap + 8 + 7;
    };

    drawSection(upgrades, 'UPGRADES', 'rgba(255,255,255,0.5)',  'rgba(255,255,255,0.08)');
    drawSection(relics,   'RELICS',   'rgba(255,200,80,0.75)', 'rgba(255,200,80,0.10)');

    ctx.textAlign = 'left';
    ctx.restore();
  }

  // ---- Timer + difficulty HUD (top-center) ----

  _drawTimer(playTime, endlessMode = false) {
    const ctx = this.ctx;

    // ── Time display ──
    const totalSec = Math.floor(playTime);
    const m   = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    const timeText = `${m}:${sec.toString().padStart(2, '0')}`;

    // ── Difficulty tiers (each tier spans a range of 20-second waves) ──
    const wave = Math.floor(playTime / 20);
    const TIERS = [
      { minWave:  0, maxWave:  2, label: 'CALM',      color: '#55ccff' },
      { minWave:  3, maxWave:  6, label: 'RISING',     color: '#66ee44' },
      { minWave:  7, maxWave: 12, label: 'FIERCE',     color: '#ffcc00' },
      { minWave: 13, maxWave: 20, label: 'BRUTAL',     color: '#ff8800' },
      { minWave: 21, maxWave: 29, label: 'EXTREME',    color: '#ff4400' },
      { minWave: 30, maxWave: Infinity, label: 'NIGHTMARE', color: '#ff1111' },
    ];
    const tier = TIERS.find(t => wave >= t.minWave && wave <= t.maxWave) ?? TIERS[TIERS.length - 1];

    // Tier progress: 0–1 through the full tier duration
    const tierStartSec = tier.minWave * 20;
    const tierEndSec   = tier.maxWave === Infinity ? BOSS_SPAWN_TIME : (tier.maxWave + 1) * 20;
    const tierProg     = Math.min(1, (playTime - tierStartSec) / Math.max(1, tierEndSec - tierStartSec));

    // ── Next event countdown ──
    const bossIncoming = !endlessMode && playTime >= BOSS_SPAWN_TIME;
    const bossWarning  = !endlessMode && !bossIncoming && (BOSS_SPAWN_TIME - playTime) <= 45;

    let countdownText;
    if (bossIncoming) {
      countdownText = '⚠ BOSS INCOMING';
    } else if (endlessMode) {
      const nextMilestoneAt = (Math.floor(playTime / ENDLESS_MILESTONE_TIME) + 1) * ENDLESS_MILESTONE_TIME;
      const secsLeft = Math.ceil(nextMilestoneAt - playTime);
      const cm = Math.floor(secsLeft / 60), cs = secsLeft % 60;
      countdownText = `♾ milestone in ${cm}:${cs.toString().padStart(2, '0')}`;
    } else {
      const secsLeft = Math.ceil(BOSS_SPAWN_TIME - playTime);
      const cm = Math.floor(secsLeft / 60), cs = secsLeft % 60;
      countdownText = `Boss in ${cm}:${cs.toString().padStart(2, '0')}`;
    }

    // ── Layout ──
    const cx   = this.canvas.width / 2;
    const boxW = 220;
    const boxH = 60;
    const bx   = cx - boxW / 2;
    const by   = 10;
    const pad  = 12;

    ctx.save();
    ctx.textBaseline = 'top';

    // Background panel
    ctx.fillStyle = bossWarning || bossIncoming
      ? 'rgba(70, 15, 0, 0.80)'
      : 'rgba(0, 0, 0, 0.60)';
    this._roundRect(ctx, bx, by, boxW, boxH, 7);
    ctx.fill();

    // Warning border pulse
    if (bossWarning || bossIncoming) {
      const pulse = 0.5 + 0.5 * Math.sin(Date.now() / 180);
      ctx.strokeStyle = `rgba(255, 80, 0, ${0.35 + pulse * 0.65})`;
      ctx.lineWidth   = 2;
      this._roundRect(ctx, bx, by, boxW, boxH, 7);
      ctx.stroke();
    }

    // ── Row 1: time (left) + difficulty label (right) ──
    ctx.font      = 'bold 17px monospace';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(timeText, bx + pad, by + 9);

    ctx.font      = `bold 10px monospace`;
    ctx.textAlign = 'right';
    ctx.fillStyle = tier.color;
    ctx.shadowColor = tier.color;
    ctx.shadowBlur  = 6;
    ctx.fillText(tier.label, bx + boxW - pad, by + 11);
    ctx.shadowBlur = 0;

    // ── Row 2: segmented tier progress bar ──
    const barY  = by + 32;
    const barX  = bx + pad;
    const barW  = boxW - pad * 2;
    const barH  = 5;
    const SEGS  = 14;
    const segW  = barW / SEGS;
    const filled = Math.round(tierProg * SEGS);

    for (let i = 0; i < SEGS; i++) {
      const alpha = i < filled ? 1 : 0.14;
      ctx.fillStyle = i < filled ? tier.color : `rgba(255,255,255,0.14)`;
      ctx.fillRect(Math.round(barX + i * segW + 1), barY, Math.round(segW) - 2, barH);
    }

    // ── Row 3: countdown ──
    ctx.font      = 'bold 9px monospace';
    ctx.textAlign = 'left';
    ctx.fillStyle = bossIncoming ? '#ff4400'
                  : bossWarning  ? '#ff9900'
                  : 'rgba(255,255,255,0.45)';
    ctx.fillText(countdownText, bx + pad, by + 44);

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
