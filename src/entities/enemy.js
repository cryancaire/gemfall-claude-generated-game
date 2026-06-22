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

    // --- Behaviour flags ---
    this.flying       = typeDef.flying       ?? false;
    this.avoidsGround = typeDef.avoidsGround ?? false;
    this.canJump      = typeDef.canJump      ?? false;
    this.jumpForce    = typeDef.jumpForce    ?? -10;
    this.canDropDown  = typeDef.canDropDown  ?? false;

    // --- AI state ---
    this._dir          = Math.random() < 0.5 ? 1 : -1;
    this._patrolTimer  = 0;
    this._hurtFrames   = 0;
    this._dropsSpawned = false;
    this._flyPhase     = 0;
    this._offGroundFrames = 0; // debounces idle↔walk animation switches

    // --- Swarm state (set by entityManager on dynamic spawns) ---
    this._inSwarm  = false;
    this._swarmDir = 0;

    // --- Elite state ---
    this.elite           = false;
    this.eliteType       = null;
    this._eliteGlowPhase = 0;
    this.eliteShootTimer = 120;
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
    if (this.elite) this._eliteGlowPhase += 0.06;

    if (this.flying) {
      if (this._inSwarm) {
        this._flySwarm();
      } else {
        this._flyTowardPlayer(player);
      }
      this.x += this.vx;
      this.y += this.vy;
      if (this.avoidsGround) this._resolveFlying(world);
    } else {
      // Grounded AI: chase if close, otherwise patrol
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

      // Ledge / wall detection — jumping enemies leap walls, all enemies respect ledges
      if (this.onGround) {
        const frontX  = this.x + (this._dir > 0 ? this.width + 2 : -2);
        const wallTX  = Math.floor(frontX / TILE_SIZE);
        const bodyTY  = Math.floor((this.y + this.height / 2) / TILE_SIZE);
        const floorTY = Math.floor((this.y + this.height + 4) / TILE_SIZE);

        const wallAhead  = world.getTile(wallTX, bodyTY);
        const floorAhead = world.getTile(wallTX, floorTY);
        const ledgeAhead = !floorAhead || !floorAhead.solid;

        if (wallAhead && wallAhead.solid && this.canJump && this.vy >= 0) {
          this.vy = this.jumpForce;  // jump over the wall
        } else if ((wallAhead && wallAhead.solid) || (ledgeAhead && !this.canDropDown)) {
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
    }

    if (this.y > CHUNK_HEIGHT * TILE_SIZE + 400) this.dead = true;

    // Animate sprite — debounce idle switch so 1-2 frame airtime on bumpy terrain
    // doesn't cause a constant walk→idle→walk frame-0 reset flicker
    if (this._sprite) {
      if (this.onGround && Math.abs(this.vx) > 0.1) {
        this._offGroundFrames = 0;
        this._sprite.play('walk');
      } else {
        if (++this._offGroundFrames >= 4) this._sprite.play('idle');
      }
      this._sprite.update();
    }
  }

  _flyTowardPlayer(player) {
    const pcx = player.x + player.width  / 2;
    const pcy = player.y + player.height / 2;
    const ecx = this.x   + this.width    / 2;
    const ecy = this.y   + this.height   / 2;
    const dx   = pcx - ecx;
    const dy   = pcy - ecy;
    const dist = Math.hypot(dx, dy) || 1;

    this._flyPhase += 0.05;
    this.vx = (dx / dist) * this.speed;
    this.vy = (dy / dist) * this.speed + Math.sin(this._flyPhase) * 1.5;
    this.facingRight = this.vx >= 0;
  }

  _flySwarm() {
    this.vx = this.speed * this._swarmDir;
    this._flyPhase += 0.05;
    this.vy = Math.sin(this._flyPhase) * 0.9;
    this.facingRight = this._swarmDir > 0;
  }

  // Push flying enemy out of solid tiles (Y axis — prevents clipping through ground/ceiling).
  _resolveFlying(world) {
    const cx = this.x + this.width / 2;
    // Floor
    const { tile: below } = world.getTileAtPixel(cx, this.y + this.height);
    if (below?.solid) {
      this.y = Math.floor((this.y + this.height) / TILE_SIZE) * TILE_SIZE - this.height;
      if (this.vy > 0) this.vy = -Math.abs(this.vy) * 0.25;
    }
    // Ceiling
    const { tile: above } = world.getTileAtPixel(cx, this.y);
    if (above?.solid) {
      this.y = (Math.floor(this.y / TILE_SIZE) + 1) * TILE_SIZE;
      if (this.vy < 0) this.vy = 0;
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

    const hurt = this._hurtFrames > 0 && Math.floor(this._hurtFrames / 3) % 2 === 0;

    let spriteDrawn = false;
    if (this._sprite) {
      if (hurt) {
        // Fade-out flash: works for both transparent and opaque-background sprites.
        // source-atop would paint a white box over opaque-background sheets (e.g. ghost).
        ctx.save();
        ctx.globalAlpha = 0.25;
        spriteDrawn = this._sprite.draw(ctx, sx + this._spriteOffX, sy + this._spriteOffY, !this.facingRight, this._drawScale);
        ctx.restore();
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

    // Elite: pulsing glowing outline + floating type icon above head
    if (this.elite && !hurt) {
      const COLORS = { blazing: '#ff5500', glacial: '#00aaff', overloaded: '#ffcc00' };
      const ICONS  = { blazing: '🔥', glacial: '❄️', overloaded: '⚡' };
      const gc     = COLORS[this.eliteType] ?? '#ffffff';
      const pulse  = 0.5 + 0.5 * Math.sin(this._eliteGlowPhase * 2.2);

      const bx = spriteDrawn ? sx + this._spriteOffX : sx;
      const by = spriteDrawn ? sy + this._spriteOffY : sy;
      const bw = spriteDrawn ? this._drawnW : this.width;
      const bh = spriteDrawn ? this._drawnH : this.height;

      ctx.save();
      ctx.strokeStyle = gc;
      ctx.lineWidth   = 2 + pulse * 2;
      ctx.shadowColor = gc;
      ctx.shadowBlur  = 10 + pulse * 14;
      ctx.globalAlpha = 0.6 + pulse * 0.4;
      ctx.strokeRect(bx - 3, by - 3, bw + 6, bh + 6);
      ctx.restore();

      const eliteIcon = ICONS[this.eliteType] ?? '⭐';
      const iconX = bx + bw / 2;
      const iconY = by - 12 + Math.sin(this._eliteGlowPhase) * 2;
      ctx.save();
      ctx.font          = '13px serif';
      ctx.textAlign     = 'center';
      ctx.textBaseline  = 'alphabetic';
      ctx.globalAlpha   = 0.85 + pulse * 0.15;
      ctx.shadowColor   = gc;
      ctx.shadowBlur    = 6;
      ctx.fillText(eliteIcon, iconX, iconY);
      ctx.restore();
    }

    // Overloaded telegraph: bright outline before pulse fires
    if (this.elite && this.eliteType === 'overloaded' && this.eliteShootTimer <= 30) {
      const t = 1 - this.eliteShootTimer / 30;
      ctx.save();
      ctx.globalAlpha = t * 0.9;
      ctx.strokeStyle = '#ffcc00';
      ctx.lineWidth   = 4;
      ctx.shadowColor = '#ffcc00';
      ctx.shadowBlur  = 24;
      ctx.strokeRect(sx - 3, sy - 3, this.width + 6, this.height + 6);
      ctx.restore();
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
