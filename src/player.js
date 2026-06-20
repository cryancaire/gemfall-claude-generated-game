import {
  TILE_SIZE, GRAVITY, JUMP_FORCE, TERMINAL_VELOCITY,
  CHUNK_HEIGHT, PLAYER_DEFAULTS, xpForLevel,
} from './config.js';
import { SpriteSheet, AnimatedSprite } from './sprites/spriteSheet.js';
import { SFX } from './audio.js';

const W = 22;
const H = 34;
const RESOLVE_SLOP = 0.1;

// Sprite is 48×48 frames; drawn at 2x to fill the screen properly
const SPRITE_W = 48;
const SPRITE_H = 48;
const DRAW_SCALE   = 2;
const DRAWN_W      = SPRITE_W * DRAW_SCALE;  // 96
const DRAWN_H      = SPRITE_H * DRAW_SCALE;  // 96
// footOffsetY: pixels to shift sprite down so visual feet align with hitbox bottom.
// Tune this if the character still hovers: FOOT_OFFSET_Y = DRAWN_H - feet_pixel_from_top
const FOOT_OFFSET_Y = 18;
const SPRITE_OFF_X = Math.round(W / 2 - DRAWN_W / 2);  // center horizontally on hitbox
const SPRITE_OFF_Y = H - DRAWN_H + FOOT_OFFSET_Y;       // feet at bottom of hitbox

const _sheet = new SpriteSheet('src/assets/mystic-woods/characters/player.png', SPRITE_W, SPRITE_H);
const PLAYER_ANIMS = {
  idle: { row: 0, frames: 6, fps: 8  },
  walk: { row: 1, frames: 6, fps: 12 },
};

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

    // --- Configurable stats ---
    this.maxHp    = stats.maxHp    ?? PLAYER_DEFAULTS.maxHp;
    this.damage   = stats.damage   ?? PLAYER_DEFAULTS.damage;
    this.speed    = stats.speed    ?? PLAYER_DEFAULTS.speed;
    this.maxJumps = stats.maxJumps ?? PLAYER_DEFAULTS.maxJumps;

    // --- Runtime combat state ---
    this.hp         = this.maxHp;
    this.jumpsLeft  = this.maxJumps;
    this._invFrames = 0;

    // --- Derived stats (upgraded via powerups) ---
    this.hpRegen        = 0;   // HP recovered per second
    this.luck           = 0;   // influences level-up card rarity
    this.rerolls        = 0;   // earned by skipping level-up choices
    this.projCapBonus   = 0;   // added to each weapon's maxProjectiles at fire-time
    this.expPickupRange   = 0;   // bonus pixels added to gem attract/collect radii
    this.bonusGemDrops   = 0;   // extra gem spawned per enemy kill (Soul Harvest)
    this.lifestealKills  = 0;   // heal 1 HP every N kills; 0 = disabled (Blood Price)
    this._lifestealCounter = 0;
    this._regenAccum      = 0;

    // --- Weapon slots ---
    this.maxWeaponSlots   = 1;
    this.weapons          = [];   // active Weapon instances (max = maxWeaponSlots)

    // --- Acquired non-weapon upgrades (for the side panel) ---
    this.acquiredUpgrades = [];

    // --- XP / leveling ---
    this.xp                = 0;
    this.level             = 1;
    this.xpToNext          = xpForLevel(1);
    this.totalXpCollected  = 0;
    this.gemValueMultiplier = 1;

    // --- Input state ---
    this._jumpBufferFrames = 0;

    // --- Sprite ---
    this._sprite = new AnimatedSprite(_sheet, PLAYER_ANIMS, 'idle');
  }

  // ---- Combat ----

  takeDamage(amount) {
    if (this._invFrames > 0) return false;
    this.hp = Math.max(0, this.hp - amount);
    this._invFrames = 90;
    SFX.hurt();
    return true;
  }

  heal(amount) {
    this.hp = Math.min(this.maxHp, this.hp + amount);
  }

  // Pass a pre-constructed Weapon.
  // If the type is already equipped, upgrades its fire rate.
  // If a slot is free, adds it to the arsenal.
  // Ignores silently if slots are full and type is new.
  addOrUpgradeWeapon(weapon) {
    const existing = this.weapons.find(w => w.type.id === weapon.type.id);
    if (existing) {
      existing.attackInterval = Math.max(12, Math.round(existing.attackInterval * 0.85));
    } else if (this.weapons.length < this.maxWeaponSlots) {
      this.weapons.push(weapon);
    }
  }

  // Track a non-weapon powerup for the acquired-upgrades side panel.
  addAcquiredUpgrade(powerup) {
    this.acquiredUpgrades.push({ id: powerup.id, name: powerup.name, icon: powerup.icon, description: powerup.description ?? '' });
  }

  collectGem(gem) {
    const earned = Math.round(gem.value * this.gemValueMultiplier);
    this.xp               += earned;
    this.totalXpCollected += earned;
    while (this.xp >= this.xpToNext) {
      this.xp -= this.xpToNext;
      this.level++;
      this.xpToNext = xpForLevel(this.level);
      // Gain 1 max HP per level
      this.maxHp += 1;
      this.hp = Math.min(this.hp + 1, this.maxHp);
    }
  }

  get isInvincible() { return this._invFrames > 0; }
  get isDead()       { return this.hp <= 0; }

  // Returns the world-space centre of a weapon's floating icon above the player's head.
  // Returns null for orb weapons (they have no floating icon).
  getWeaponIconWorldPos(weapon) {
    const floatWeapons = this.weapons.filter(w => w.type.type !== 'orb');
    const idx = floatWeapons.indexOf(weapon);
    if (idx === -1) return null;
    const spacing = 22;
    const totalW  = floatWeapons.length * spacing;
    const iconX   = this.x + this.width / 2 - totalW / 2 + spacing / 2 + idx * spacing;
    const iconY   = this.y + SPRITE_OFF_Y - 2;
    return { x: iconX, y: iconY };
  }

  // ---- Update ----

  update(input, world) {
    if (this._invFrames > 0) this._invFrames--;
    for (const w of this.weapons) w.update();

    // HP regeneration
    if (this.hpRegen > 0) {
      if (this.hp < this.maxHp) {
        this._regenAccum += this.hpRegen / 60;
        if (this._regenAccum >= 1) {
          const amount = Math.floor(this._regenAccum);
          this._regenAccum -= amount;
          this.heal(amount);
        }
      } else {
        this._regenAccum = 0;
      }
    }

    // Horizontal
    const left  = input.isDown('a') || input.isDown('arrowleft');
    const right = input.isDown('d') || input.isDown('arrowright');
    if (right)     { this.vx = this.speed;  this.facingRight = true;  }
    else if (left) { this.vx = -this.speed; this.facingRight = false; }
    else           { this.vx *= 0.75; }

    // Jump input buffer
    const jumpPressed = input.wasPressed('w') || input.wasPressed(' ') || input.wasPressed('arrowup');
    if (jumpPressed) this._jumpBufferFrames = 8;
    if (this._jumpBufferFrames > 0) this._jumpBufferFrames--;

    if (this.onGround) this.jumpsLeft = this.maxJumps;

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

    // Fell off world
    if (this.y > CHUNK_HEIGHT * TILE_SIZE + 200) {
      this.y = 0;
      this.vy = 0;
      this.takeDamage(1);
    }

    // Animate
    const moving = this.onGround && Math.abs(this.vx) > 0.5;
    this._sprite.play(moving ? 'walk' : 'idle');
    this._sprite.update();
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

    // Try sprite first; fall back to placeholder rectangles
    const spriteDrawn = this._sprite.draw(
      ctx,
      sx + SPRITE_OFF_X,
      sy + SPRITE_OFF_Y,
      !this.facingRight,  // sprite sheet faces right, flip when going left
      DRAW_SCALE
    );

    if (!spriteDrawn) {
      // Placeholder body
      ctx.fillStyle = '#3a86ff';
      ctx.fillRect(sx, sy, this.width, this.height);
      ctx.fillStyle = '#5a9fff';
      ctx.fillRect(sx + 2, sy + 2, this.width - 4, 10);
      const eyeOffX = this.facingRight ? this.width - 8 : 2;
      ctx.fillStyle = '#fff';
      ctx.fillRect(sx + eyeOffX, sy + 8, 6, 6);
      ctx.fillStyle = '#111';
      ctx.fillRect(sx + eyeOffX + (this.facingRight ? 2 : 0), sy + 10, 3, 3);
      ctx.fillStyle = '#2563eb';
      const legOff = this.onGround && Math.abs(this.vx) > 0.5
        ? Math.round(Math.sin(Date.now() / 80) * 3)
        : 0;
      ctx.fillRect(sx + 2,               sy + this.height - 8 + legOff, 8, 8);
      ctx.fillRect(sx + this.width - 10, sy + this.height - 8 - legOff, 8, 8);
    }

    // Draw orbiting orbs and melee swing arcs
    for (const w of this.weapons) w.draw(ctx, camera, this);

    // Draw floating weapon icons above player head for non-orb weapons
    const floatWeapons = this.weapons.filter(w => w.type.type !== 'orb');
    if (floatWeapons.length > 0) {
      const t = performance.now() / 1000;
      const spacing = 22;
      const totalW  = floatWeapons.length * spacing;
      const startX  = sx + this.width / 2 - totalW / 2 + spacing / 2;
      const baseY   = sy + SPRITE_OFF_Y - 2;

      ctx.save();
      ctx.font = '16px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.shadowColor = 'rgba(0,0,0,0.75)';
      ctx.shadowBlur = 4;
      for (let i = 0; i < floatWeapons.length; i++) {
        const wiggle = Math.sin(t * 2.5 + i * 1.3) * 3;
        ctx.fillText(floatWeapons[i].type.displayIcon ?? floatWeapons[i].type.icon ?? '⚔️', startX + i * spacing, baseY + wiggle);
      }
      ctx.restore();
    }
  }
}
