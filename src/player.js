import {
  TILE_SIZE, GRAVITY, JUMP_FORCE, TERMINAL_VELOCITY,
  CHUNK_HEIGHT, PLAYER_DEFAULTS, xpForLevel,
} from './config.js';

const W = 22;
const H = 34;
const RESOLVE_SLOP = 0.1;

export class Player {
  constructor(x, y, stats = {}) {
    this.x = x;
    this.y = y;
    this.width  = W;
    this.height = H;
    this.vx = 0;
    this.vy = 0;
    this.onGround = false;
    this.facingRight = true;

    // --- Configurable stats (weapons / level-ups modify these at runtime) ---
    this.maxHp    = stats.maxHp    ?? PLAYER_DEFAULTS.maxHp;
    this.damage   = stats.damage   ?? PLAYER_DEFAULTS.damage;
    this.speed    = stats.speed    ?? PLAYER_DEFAULTS.speed;
    this.maxJumps = stats.maxJumps ?? PLAYER_DEFAULTS.maxJumps;

    // --- Runtime combat state ---
    this.hp         = this.maxHp;
    this.jumpsLeft  = this.maxJumps;
    this._invFrames = 0;  // frames of post-hit invincibility

    // --- XP / leveling ---
    this.xp                = 0;
    this.level             = 1;
    this.xpToNext          = xpForLevel(1);
    this.totalXpCollected  = 0;
    this.gemValueMultiplier = 1; // modified by "Gilded Touch" powerup

    // --- Input state ---
    this._jumpBufferFrames = 0;
  }

  // ---- Combat ----

  takeDamage(amount) {
    if (this._invFrames > 0) return false;
    this.hp = Math.max(0, this.hp - amount);
    this._invFrames = 90; // ~1.5 s at 60 fps
    return true;
  }

  heal(amount) {
    this.hp = Math.min(this.maxHp, this.hp + amount);
  }

  collectGem(gem) {
    const earned = Math.round(gem.value * this.gemValueMultiplier);
    this.xp               += earned;
    this.totalXpCollected += earned;
    while (this.xp >= this.xpToNext) {
      this.xp -= this.xpToNext;
      this.level++;
      this.xpToNext = xpForLevel(this.level);
    }
  }

  get isInvincible() { return this._invFrames > 0; }
  get isDead()       { return this.hp <= 0; }

  // ---- Update ----

  update(input, world) {
    if (this._invFrames > 0) this._invFrames--;

    // Horizontal
    const left  = input.isDown('a') || input.isDown('arrowleft');
    const right = input.isDown('d') || input.isDown('arrowright');
    if (right)     { this.vx = this.speed;  this.facingRight = true;  }
    else if (left) { this.vx = -this.speed; this.facingRight = false; }
    else           { this.vx *= 0.75; }

    // Jump input buffer (lets you press jump slightly before landing)
    const jumpPressed = input.wasPressed('w') || input.wasPressed(' ') || input.wasPressed('arrowup');
    if (jumpPressed) this._jumpBufferFrames = 8;
    if (this._jumpBufferFrames > 0) this._jumpBufferFrames--;

    // Reset available jumps the moment we touch ground
    if (this.onGround) this.jumpsLeft = this.maxJumps;

    // Execute jump (supports multi-jump: maxJumps > 1 = double/triple/etc.)
    if (this._jumpBufferFrames > 0 && this.jumpsLeft > 0) {
      this.vy = JUMP_FORCE;
      this.jumpsLeft--;
      this._jumpBufferFrames = 0;
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

    // Fell off world — reset position, lose a heart
    if (this.y > CHUNK_HEIGHT * TILE_SIZE + 200) {
      this.y = 0;
      this.vy = 0;
      this.takeDamage(1);
    }
  }

  // ---- Physics helpers ----

  _box() { return { x: this.x, y: this.y, w: this.width, h: this.height }; }

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
    const box = this._box();
    for (const { tx, ty } of this._tilesAround(world)) {
      const tb = this._tileBox(tx, ty);
      if (!this._overlaps(box, tb)) continue;
      if (this.vx > 0) this.x = tb.x - this.width;
      else if (this.vx < 0) this.x = tb.x + tb.w;
      this.vx = 0;
      box.x = this.x;
    }
  }

  _resolveY(world) {
    const box = this._box();
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
    // Blink every 4 frames during invincibility
    if (this._invFrames > 0 && Math.floor(this._invFrames / 4) % 2 === 0) return;

    const sx = Math.round(this.x - camera.x);
    const sy = Math.round(this.y - camera.y);

    // Body
    ctx.fillStyle = '#3a86ff';
    ctx.fillRect(sx, sy, this.width, this.height);

    // Head highlight
    ctx.fillStyle = '#5a9fff';
    ctx.fillRect(sx + 2, sy + 2, this.width - 4, 10);

    // Eye
    const eyeOffX = this.facingRight ? this.width - 8 : 2;
    ctx.fillStyle = '#fff';
    ctx.fillRect(sx + eyeOffX, sy + 8, 6, 6);
    ctx.fillStyle = '#111';
    ctx.fillRect(sx + eyeOffX + (this.facingRight ? 2 : 0), sy + 10, 3, 3);

    // Legs (walk animation)
    ctx.fillStyle = '#2563eb';
    const legOff = this.onGround && Math.abs(this.vx) > 0.5
      ? Math.round(Math.sin(Date.now() / 80) * 3)
      : 0;
    ctx.fillRect(sx + 2,               sy + this.height - 8 + legOff, 8, 8);
    ctx.fillRect(sx + this.width - 10, sy + this.height - 8 - legOff, 8, 8);
  }
}
