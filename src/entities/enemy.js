import { TILE_SIZE, GRAVITY, TERMINAL_VELOCITY, CHUNK_HEIGHT } from '../config.js';
import { SpriteSheet, AnimatedSprite } from '../sprites/spriteSheet.js';

const RESOLVE_SLOP = 0.1;

export class Enemy {
  constructor(x, y, typeDef) {
    this.x = x;
    this.y = y;
    this.width  = typeDef.width;
    this.height = typeDef.height;
    this.vx = 0;
    this.vy = 0;
    this.onGround = false;
    this.facingRight = true;
    this.dead = false;

    // --- Stats ---
    this.maxHp         = typeDef.hp;
    this.hp            = typeDef.hp;
    this.damage        = typeDef.damage;
    this.speed         = typeDef.speed;
    this.stompKillable = typeDef.stompKillable;
    this.stompDamage   = typeDef.stompDamage;
    this.gemValue      = typeDef.gemValue;
    this.gemCount      = typeDef.gemCount;
    this.detectionRange = typeDef.detectionRange;

    // --- Placeholder visuals ---
    this.color    = typeDef.color;
    this.eyeColor = typeDef.eyeColor;

    // --- Sprite (optional) ---
    this._sprite = null;
    if (typeDef.sprite) {
      const cfg    = typeDef.sprite;
      const sheet  = SpriteSheet.get(cfg.src, cfg.frameW, cfg.frameH);
      this._sprite = new AnimatedSprite(sheet, cfg.anims, 'idle');
      this._drawScale = cfg.scale ?? 1;
      const drawnW = cfg.frameW * this._drawScale;
      const drawnH = cfg.frameH * this._drawScale;
      this._drawnW = drawnW;
      this._drawnH = drawnH;
      // Offsets: center horizontally, align feet to hitbox bottom with optional foot padding correction
      this._spriteOffX = Math.round(this.width  / 2 - drawnW / 2);
      this._spriteOffY = this.height - drawnH + (cfg.footOffsetY ?? 0);
    }

    // --- AI state ---
    this._dir          = Math.random() < 0.5 ? 1 : -1;
    this._patrolTimer  = 0;
    this._hurtFrames   = 0;
    this._dropsSpawned = false;
  }

  // ---- Combat ----

  takeDamage(amount) {
    this.hp -= amount;
    this._hurtFrames = 14;
    if (this.hp <= 0) {
      this.hp   = 0;
      this.dead = true;
    }
  }

  getDrops() {
    const drops = [];
    for (let i = 0; i < this.gemCount; i++) {
      drops.push({ x: this.x + this.width / 2, y: this.y, value: this.gemValue });
    }
    return drops;
  }

  // ---- Update ----

  update(world, player) {
    if (this.dead) return;
    if (this._hurtFrames > 0) this._hurtFrames--;

    // AI: chase if player is close, otherwise patrol
    const distX  = Math.abs((player.x + player.width  / 2) - (this.x + this.width  / 2));
    const distY  = Math.abs((player.y + player.height / 2) - (this.y + this.height / 2));
    const chasing = distX < this.detectionRange && distY < 120;

    if (chasing) {
      const toPlayer = (player.x + player.width / 2) - (this.x + this.width / 2);
      this._dir = toPlayer > 0 ? 1 : -1;
    } else {
      this._patrolTimer++;
      if (this._patrolTimer > 100 + Math.floor(Math.random() * 80)) {
        this._dir *= -1;
        this._patrolTimer = 0;
      }
    }

    this.facingRight = this._dir > 0;
    this.vx = this.speed * this._dir;

    // Ledge / wall detection
    if (this.onGround) {
      const frontX  = this.x + (this._dir > 0 ? this.width + 2 : -2);
      const wallTX  = Math.floor(frontX / TILE_SIZE);
      const bodyTY  = Math.floor((this.y + this.height / 2) / TILE_SIZE);
      const floorTY = Math.floor((this.y + this.height + 4) / TILE_SIZE);

      const wallAhead  = world.getTile(wallTX, bodyTY);
      const floorAhead = world.getTile(wallTX, floorTY);

      if ((wallAhead && wallAhead.solid) || !floorAhead || !floorAhead.solid) {
        this._dir *= -1;
        this.vx = this.speed * this._dir;
        this._patrolTimer = 0;
      }
    }

    // Gravity
    this.vy += GRAVITY;
    if (this.vy > TERMINAL_VELOCITY) this.vy = TERMINAL_VELOCITY;

    // Move & collide
    this.x += this.vx;
    this._resolveX(world);

    this.onGround = false;
    this.y += this.vy;
    this._resolveY(world);

    if (this.y > CHUNK_HEIGHT * TILE_SIZE + 400) this.dead = true;

    // Animate sprite
    if (this._sprite) {
      const moving = this.onGround && Math.abs(this.vx) > 0.1;
      this._sprite.play(moving ? 'walk' : 'idle');
      this._sprite.update();
    }
  }

  // ---- Physics ----

  _tileBox(tx, ty) {
    return { x: tx * TILE_SIZE, y: ty * TILE_SIZE, w: TILE_SIZE, h: TILE_SIZE };
  }

  _overlaps(a, b) {
    return a.x < b.x + b.w - RESOLVE_SLOP &&
           a.x + a.w > b.x + RESOLVE_SLOP &&
           a.y < b.y + b.h - RESOLVE_SLOP &&
           a.y + a.h > b.y + RESOLVE_SLOP;
  }

  _tilesAround(world) {
    const minTX = Math.floor(this.x / TILE_SIZE) - 1;
    const maxTX = Math.floor((this.x + this.width)  / TILE_SIZE) + 1;
    const minTY = Math.floor(this.y / TILE_SIZE) - 1;
    const maxTY = Math.floor((this.y + this.height) / TILE_SIZE) + 1;
    const out = [];
    for (let ty = minTY; ty <= maxTY; ty++) {
      for (let tx = minTX; tx <= maxTX; tx++) {
        const tile = world.getTile(tx, ty);
        if (tile && tile.solid) out.push({ tx, ty });
      }
    }
    return out;
  }

  _resolveX(world) {
    const box = { x: this.x, y: this.y, w: this.width, h: this.height };
    for (const { tx, ty } of this._tilesAround(world)) {
      const tb = this._tileBox(tx, ty);
      if (!this._overlaps(box, tb)) continue;
      if (this.vx > 0) this.x = tb.x - this.width;
      else if (this.vx < 0) this.x = tb.x + tb.w;
      this.vx = 0;
      this._dir *= -1;
      box.x = this.x;
    }
  }

  _resolveY(world) {
    const box = { x: this.x, y: this.y, w: this.width, h: this.height };
    for (const { tx, ty } of this._tilesAround(world)) {
      const tb = this._tileBox(tx, ty);
      if (!this._overlaps(box, tb)) continue;
      if (this.vy >= 0) {
        this.y = tb.y - this.height;
        this.onGround = true;
      } else {
        this.y = tb.y + tb.h;
      }
      this.vy = 0;
      box.y = this.y;
    }
  }

  // ---- Draw ----

  draw(ctx, camera) {
    if (this.dead) return;

    const sx = Math.round(this.x - camera.x);
    const sy = Math.round(this.y - camera.y);

    // Flash white on hurt using globalAlpha / composite trick
    const hurt = this._hurtFrames > 0 && Math.floor(this._hurtFrames / 3) % 2 === 0;

    let spriteDrawn = false;
    if (this._sprite) {
      if (hurt) {
        spriteDrawn = this._sprite.draw(ctx, sx + this._spriteOffX, sy + this._spriteOffY, !this.facingRight, this._drawScale);
        if (spriteDrawn) {
          ctx.save();
          ctx.globalCompositeOperation = 'source-atop';
          ctx.globalAlpha = 0.65;
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(sx + this._spriteOffX, sy + this._spriteOffY, this._drawnW, this._drawnH);
          ctx.restore();
        }
      } else {
        spriteDrawn = this._sprite.draw(ctx, sx + this._spriteOffX, sy + this._spriteOffY, !this.facingRight, this._drawScale);
      }
    }

    if (!spriteDrawn) {
      // Placeholder rectangle
      ctx.fillStyle = hurt ? '#ffffff' : this.color;
      ctx.fillRect(sx, sy, this.width, this.height);

      // Eye
      const eyeW = Math.max(4, Math.floor(this.width  * 0.28));
      const eyeH = Math.max(4, Math.floor(this.height * 0.28));
      const eyeX = this.facingRight ? sx + this.width - eyeW - 3 : sx + 3;
      const eyeY = sy + Math.floor(this.height * 0.2);
      ctx.fillStyle = '#fff';
      ctx.fillRect(eyeX, eyeY, eyeW, eyeH);
      ctx.fillStyle = this.eyeColor;
      ctx.fillRect(eyeX + (this.facingRight ? eyeW / 2 : 0), eyeY + 1, eyeW / 2, eyeH / 2);
    }

    // HP bar
    if (this.hp < this.maxHp) {
      const bw = this.width;
      ctx.fillStyle = '#400';
      ctx.fillRect(sx, sy - 7, bw, 4);
      ctx.fillStyle = '#e33';
      ctx.fillRect(sx, sy - 7, Math.round(bw * this.hp / this.maxHp), 4);
    }
  }
}
