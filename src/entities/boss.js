import { TILE_SIZE, GRAVITY, TERMINAL_VELOCITY } from '../config.js';
import { SpriteSheet } from '../sprites/spriteSheet.js';

const RESOLVE_SLOP = 0.1;

export class Boss {
  constructor(x, y, typeDef) {
    this.x = x;
    this.y = y;
    this.width  = typeDef.hitboxW;
    this.height = typeDef.hitboxH;
    this.vx = 0;
    this.vy = 0;
    this.onGround = false;
    this.facingRight = false;
    this.dead = false;

    this.name         = typeDef.name;
    this.maxHp        = typeDef.hp;
    this.hp           = typeDef.hp;
    this.speed        = typeDef.speed;
    this.attackDamage = typeDef.attackDamage;
    this.attackRange  = typeDef.attackRange;

    this._scale = typeDef.scale ?? 1;
    this._color = typeDef.color ?? '#8b0000';

    // Per-animation sprite sheets (each animation can have its own frame dimensions)
    this._sheets = {};
    for (const [key, cfg] of Object.entries(typeDef.sprites ?? {})) {
      this._sheets[key] = {
        sheet:  SpriteSheet.get(cfg.src, cfg.frameW, cfg.frameH),
        frames: cfg.frames,
        fps:    cfg.fps,
        frameW: cfg.frameW,
        frameH: cfg.frameH,
      };
    }

    // Animation state
    this._state     = 'walk';
    this._animFrame = 0;
    this._animTimer = 0;
    this._hurtFrames    = 0;
    this._attackCooldown = 0;
    this._attackHit     = false;
    this._deathDone     = false;

    // Brief boss-warning text displayed for the first 3 seconds
    this._warnFrames = 180;
  }

  // ---- Public ----

  takeDamage(amount) {
    if (this._state === 'death') return;
    this.hp = Math.max(0, this.hp - amount);
    this._hurtFrames = 14;
    if (this.hp <= 0) {
      this._setState('death');
    } else if (this._state === 'walk') {
      this._setState('hurt');
    }
    // Attacks are not interrupted
  }

  // ---- Update ----

  update(world, player) {
    if (this._deathDone) return;
    if (this._hurtFrames > 0) this._hurtFrames--;
    if (this._warnFrames > 0) this._warnFrames--;

    if (this._state === 'death') {
      this._tickAnim(false, () => {
        this._deathDone = true;
        this.dead = true;
      });
      this._applyGravity();
      this.y += this.vy;
      this._resolveY(world);
      return;
    }

    if (this._state === 'hurt') {
      this._tickAnim(false, () => this._setState('walk'));
      this._applyGravity();
      this.y += this.vy;
      this._resolveY(world);
      return;
    }

    if (this._state === 'attack') {
      this._tickAnim(false, () => {
        this._attackCooldown = 140;
        this._attackHit = false;
        this._setState('walk');
      });

      // Damage window: frames 6–11 of the 16-frame attack
      if (this._animFrame >= 6 && this._animFrame <= 11 && !this._attackHit) {
        const dx = (player.x + player.width  / 2) - (this.x + this.width  / 2);
        const dy = Math.abs((player.y + player.height / 2) - (this.y + this.height / 2));
        if (Math.abs(dx) < this.attackRange && dy < this.height * 0.9) {
          this._attackHit = true;
          player.takeDamage(this.attackDamage);
          const dir = dx > 0 ? 1 : -1;
          player.vx = dir * 10;
          player.vy = -6;
        }
      }

      this._applyGravity();
      this.y += this.vy;
      this._resolveY(world);
      return;
    }

    // Walk state — move toward player, trigger attack when in range
    if (this._attackCooldown > 0) this._attackCooldown--;

    const dx = (player.x + player.width  / 2) - (this.x + this.width  / 2);
    const dy = Math.abs((player.y + player.height / 2) - (this.y + this.height / 2));

    if (Math.abs(dx) < this.attackRange && dy < this.height && this._attackCooldown <= 0) {
      this._attackHit = false;
      this._setState('attack');
      return;
    }

    const dir = dx > 0 ? 1 : -1;
    this.facingRight = dir > 0;
    this.vx = dir * this.speed;

    this._applyGravity();

    if (this.onGround) {
      const frontX = this.x + (dir > 0 ? this.width + 2 : -2);
      const wallTX = Math.floor(frontX / TILE_SIZE);

      // Check wall at both body center AND near feet — boss is tall so center probe
      // can be well above ground level and miss foot-height walls entirely
      const bodyTY = Math.floor((this.y + this.height * 0.5) / TILE_SIZE);
      const feetTY = Math.floor((this.y + this.height - 4)   / TILE_SIZE);
      const wallAhead = world.getTile(wallTX, bodyTY)?.solid ||
                        world.getTile(wallTX, feetTY)?.solid;

      if (wallAhead && this.vy >= 0) {
        this.vy = -14;  // jump over the wall
      }
      // No ledge reversal — boss always walks off edges to chase the player below
    }

    this.x += this.vx;
    this._resolveX(world);

    this.onGround = false;
    this.y += this.vy;
    this._resolveY(world);

    this._tickAnim(true, null);
  }

  // ---- Draw ----

  draw(ctx, camera) {
    if (this._deathDone) return;

    const anim = this._sheets[this._state] ?? this._sheets.walk ?? this._sheets.idle;
    if (!anim) {
      // Fallback rectangle
      ctx.fillStyle = this._color;
      ctx.fillRect(Math.round(this.x - camera.x), Math.round(this.y - camera.y), this.width, this.height);
      return;
    }

    const scale = this._scale;
    const dw = anim.frameW * scale;
    const dh = anim.frameH * scale;

    // Center horizontally on hitbox, bottom-align sprite to hitbox bottom
    const sx = Math.round(this.x + this.width  / 2 - camera.x - dw / 2);
    const sy = Math.round(this.y + this.height      - camera.y - dh);

    const hurt = this._hurtFrames > 0 && Math.floor(this._hurtFrames / 3) % 2 === 0;
    if (hurt) {
      ctx.save();
      ctx.globalAlpha = 0.25;
    }

    const drawn = anim.sheet.draw(ctx, this._animFrame, 0, sx, sy, !this.facingRight, dw, dh);

    if (hurt) ctx.restore();

    if (!drawn) {
      ctx.fillStyle = this._color;
      ctx.fillRect(Math.round(this.x - camera.x), Math.round(this.y - camera.y), this.width, this.height);
    }

    // Warning text during intro
    if (this._warnFrames > 0) {
      const alpha = Math.min(1, this._warnFrames / 30);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.font = 'bold 18px monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffcc00';
      ctx.fillText('⚠ BOSS INCOMING ⚠', Math.round(this.x + this.width / 2 - camera.x), Math.round(this.y - camera.y) - 18);
      ctx.restore();
    }
  }

  // ---- Internal helpers ----

  _setState(state) {
    if (this._state === state) return;
    this._state     = state;
    this._animFrame = 0;
    this._animTimer = 0;
  }

  _tickAnim(loop, onComplete) {
    const anim = this._sheets[this._state];
    if (!anim) return;
    const interval = Math.round(60 / (anim.fps ?? 8));
    if (++this._animTimer >= interval) {
      this._animTimer = 0;
      this._animFrame++;
      if (this._animFrame >= anim.frames) {
        if (loop) {
          this._animFrame = 0;
        } else {
          this._animFrame = anim.frames - 1; // hold last frame
          if (onComplete) onComplete();
        }
      }
    }
  }

  _applyGravity() {
    this.vy += GRAVITY;
    if (this.vy > TERMINAL_VELOCITY) this.vy = TERMINAL_VELOCITY;
  }

  // ---- Tile collision ----

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
}
