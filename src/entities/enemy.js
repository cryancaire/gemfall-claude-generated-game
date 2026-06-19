import { TILE_SIZE, GRAVITY, TERMINAL_VELOCITY, CHUNK_HEIGHT } from '../config.js';

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

    // --- Stats copied from type def (overridable per instance) ---
    this.maxHp         = typeDef.hp;
    this.hp            = typeDef.hp;
    this.damage        = typeDef.damage;
    this.speed         = typeDef.speed;
    this.stompKillable = typeDef.stompKillable;
    this.stompDamage   = typeDef.stompDamage;
    this.gemValue      = typeDef.gemValue;
    this.gemCount      = typeDef.gemCount;
    this.detectionRange = typeDef.detectionRange;

    // --- Visuals (swap these for sprite sheets later) ---
    this.color    = typeDef.color;
    this.eyeColor = typeDef.eyeColor;

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

  // Returns an array of { x, y, value } for gem drops
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
    const distX = Math.abs((player.x + player.width  / 2) - (this.x + this.width  / 2));
    const distY = Math.abs((player.y + player.height / 2) - (this.y + this.height / 2));
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

    // Ledge / wall detection — don't walk off edges or into walls
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
  }

  // ---- Physics (mirrors Player's approach) ----

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
      this._dir *= -1; // turn around on wall hit
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

  // ---- Draw (replace ctx calls with sprite sheet later) ----

  draw(ctx, camera) {
    if (this.dead) return;

    const sx = Math.round(this.x - camera.x);
    const sy = Math.round(this.y - camera.y);

    // Flash white on hurt
    ctx.fillStyle = (this._hurtFrames > 0 && Math.floor(this._hurtFrames / 3) % 2 === 0)
      ? '#ffffff'
      : this.color;
    ctx.fillRect(sx, sy, this.width, this.height);

    // Eye
    const eyeW  = Math.max(4, Math.floor(this.width  * 0.28));
    const eyeH  = Math.max(4, Math.floor(this.height * 0.28));
    const eyeX  = this.facingRight
      ? sx + this.width  - eyeW - 3
      : sx + 3;
    const eyeY  = sy + Math.floor(this.height * 0.2);
    ctx.fillStyle = '#fff';
    ctx.fillRect(eyeX, eyeY, eyeW, eyeH);
    ctx.fillStyle = this.eyeColor;
    ctx.fillRect(eyeX + (this.facingRight ? eyeW / 2 : 0), eyeY + 1, eyeW / 2, eyeH / 2);

    // HP bar (visible only when below max hp)
    if (this.hp < this.maxHp) {
      const bw = this.width;
      ctx.fillStyle = '#400';
      ctx.fillRect(sx, sy - 7, bw, 4);
      ctx.fillStyle = '#e33';
      ctx.fillRect(sx, sy - 7, Math.round(bw * this.hp / this.maxHp), 4);
    }
  }
}
