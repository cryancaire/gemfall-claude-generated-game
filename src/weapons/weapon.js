// Weapon instance held by the player.
// tryAutoFire() fires when an enemy is within attackRange, returning projectile defs.
// For melee/orb, it directly damages enemies and returns [].

import { SFX } from '../audio.js';
import { MAX_PROJECTILES_PER_WEAPON } from '../config.js';

const RARITY_SCALE = {
  common:    { dmg: 1.0,  intervalMult: 1.00, rangeMult: 1.00 },
  uncommon:  { dmg: 1.3,  intervalMult: 0.88, rangeMult: 1.10 },
  rare:      { dmg: 1.7,  intervalMult: 0.75, rangeMult: 1.20 },
  epic:      { dmg: 2.4,  intervalMult: 0.60, rangeMult: 1.35 },
  legendary: { dmg: 3.5,  intervalMult: 0.45, rangeMult: 1.50 },
  mythic:    { dmg: 5.0,  intervalMult: 0.35, rangeMult: 1.65 },
};

export class Weapon {
  constructor(typeDef) {
    this.type = typeDef;
    this.rarity = 'common';

    // Instance-level stats — can be scaled by rarity or runtime upgrades
    this.damage         = typeDef.damage ?? 0;
    this.attackRange    = typeDef.attackRange ?? 0;
    this.attackInterval = typeDef.attackInterval ?? 30;

    this._cooldown    = 0;
    this._swingFrames = 0;

    // Projectile cap — enforced in tryAutoFire; raised by player.projCapBonus at fire-time
    this.maxProjectiles     = typeDef.maxProjectiles ?? 3;
    this._activeProjectiles = 0;

    // Orb-specific state
    if (typeDef.type === 'orb') {
      this.orbCount       = 1;
      this.orbitSpeed     = typeDef.orbitSpeed;
      this._orbAngle      = 0;
      this._orbHitCooldowns = new Map();
    }
  }

  // Scale this weapon's stats to a new rarity tier in place.
  applyRarity(rarity) {
    this.rarity = rarity;
    const scale = RARITY_SCALE[rarity] ?? RARITY_SCALE.common;
    this.damage         = Math.round(this.type.damage * scale.dmg);
    this.attackInterval = Math.max(12, Math.round(this.type.attackInterval * scale.intervalMult));
    this.attackRange    = Math.round(this.type.attackRange * scale.rangeMult);

    if (this.type.type === 'orb') {
      const TIERS = ['common','uncommon','rare','epic','legendary','mythic'];
      this.orbCount = 1 + Math.max(0, TIERS.indexOf(rarity));
    }
  }

  update() {
    if (this._cooldown    > 0) this._cooldown--;
    if (this._swingFrames > 0) this._swingFrames--;
    if (this.type.type === 'orb') {
      this._orbAngle += this.orbitSpeed;
      for (const [e, cd] of this._orbHitCooldowns) {
        if (cd <= 1 || e.dead) this._orbHitCooldowns.delete(e);
        else this._orbHitCooldowns.set(e, cd - 1);
      }
    }
  }

  // Auto-fires toward the nearest enemy within attackRange.
  // Returns array of projectile defs (projectile) or [] (melee/orb / not in range / on cooldown).
  tryAutoFire(player, enemies) {
    if (this.type.type === 'orb') return this._orbCollide(player, enemies);
    if (this._cooldown > 0) return [];

    const cap = Math.min(MAX_PROJECTILES_PER_WEAPON, this.maxProjectiles + (player.projCapBonus ?? 0));
    if (this.type.type === 'magic' && this._activeProjectiles >= cap) return [];

    const px = player.x + player.width  / 2;
    const py = player.y + player.height / 2;

    let nearest = null;
    let nearestDist = Infinity;
    for (const e of enemies) {
      if (e.dead) continue;
      const ex   = e.x + e.width  / 2;
      const ey   = e.y + e.height / 2;
      const dist = Math.sqrt((ex - px) ** 2 + (ey - py) ** 2);
      if (dist < nearestDist) { nearestDist = dist; nearest = e; }
    }

    if (!nearest || nearestDist > this.attackRange) return [];

    this._cooldown = this.attackInterval;

    const toRight = (nearest.x + nearest.width / 2) > px;

    return this.type.type === 'melee'
      ? this._meleeSwing(player, enemies, toRight)
      : this._spawnProjectiles(player, toRight);
  }

  _meleeSwing(player, enemies, facingRight = player.facingRight) {
    this._swingFrames = this.type.swingDuration;
    const range = this.type.range;
    const hitX  = facingRight ? player.x + player.width : player.x - range;
    const hitY  = player.y + 4;
    const hitH  = player.height - 8;

    for (const e of enemies) {
      if (e.dead) continue;
      if (hitX         < e.x + e.width  &&
          hitX + range > e.x            &&
          hitY         < e.y + e.height &&
          hitY + hitH  > e.y) {
        e.takeDamage(this.damage);
      }
    }
    return [];
  }

  _spawnProjectiles(player, facingRight = player.facingRight) {
    const dir     = facingRight ? 1 : -1;
    const iconPos = player.getWeaponIconWorldPos?.(this);
    const startX  = iconPos
      ? iconPos.x - Math.round((this.type.projectileW ?? 8) / 2)
      : (facingRight ? player.x + player.width + 2 : player.x - this.type.projectileW - 2);
    const startY  = iconPos
      ? iconPos.y - Math.round((this.type.projectileH ?? 8) / 2)
      : player.y + Math.floor(player.height * 0.35);
    const spd     = this.type.projectileSpeed;

    const defs   = [];
    const count  = this.type.count  ?? 1;
    const spread = this.type.spread ?? 0;

    for (let i = 0; i < count; i++) {
      const angle = count > 1 ? (i / (count - 1) - 0.5) * spread : 0;
      defs.push({
        x: startX, y: startY,
        width:  this.type.projectileW,
        height: this.type.projectileH,
        vx: Math.cos(angle) * spd * dir,
        vy: Math.sin(angle) * spd,
        damage:         this.damage,
        icon:           this.type.icon,
        color:          this.type.projectileColor,
        trailColor:     this.type.trailColor,
        homing:         this.type.homing         ?? false,
        homingTurnRate: this.type.homingTurnRate ?? 0,
        maxRange:       this.type.maxRange,
        weaponRef:      this,
        pierce:        this.type.pierce ?? false,
        chainCount:    this.type.chainCountByRarity?.[this.rarity] ?? this.type.chainCount ?? 0,
        chainDamage:   Math.ceil(this.damage * 0.5),
        chainRange:    this.type.chainRange   ?? 0,
        launchFrames:  this.type.launchFrames  ?? 0,
        launchGravity: this.type.launchGravity ?? 0,
        wobble:        this.type.wobble        ?? 0,
        wobbleRate:    this.type.wobbleRate     ?? 0.4,
      });

      // Override initial velocity for special launch styles
      const d  = defs[defs.length - 1];
      const ls = this.type.launchStyle;
      if (ls === 'arc') {
        // Rises upward from weapon icon, then homes in after launch phase
        d.vx = dir * 1.5;
        d.vy = -spd * 1.1;
      } else if (ls === 'lob') {
        // Lobbed forward with gravity arc, then homes in
        d.vx = dir * spd * 0.65;
        d.vy = -spd * 1.0;
      }
      // 'straight' and undefined keep the default horizontal velocity

      this._activeProjectiles++;
    }
    return defs;
  }

  _orbCollide(player, enemies) {
    const px = player.x + player.width  / 2;
    const py = player.y + player.height / 2;
    const radius  = this.type.orbitRadius;
    const orbSize = this.type.orbitSize;

    for (let i = 0; i < this.orbCount; i++) {
      const angle = this._orbAngle + (i * Math.PI * 2) / this.orbCount;
      const ox = px + Math.cos(angle) * radius;
      const oy = py + Math.sin(angle) * radius;

      for (const e of enemies) {
        if (e.dead || this._orbHitCooldowns.has(e)) continue;
        const ex   = e.x + e.width  / 2;
        const ey   = e.y + e.height / 2;
        const dist = Math.sqrt((ox - ex) ** 2 + (oy - ey) ** 2);
        if (dist < orbSize + e.width / 2) {
          e.takeDamage(this.damage);
          SFX.hurt();
          this._orbHitCooldowns.set(e, 30);
        }
      }
    }
    return [];
  }

  // ---- Rendering ----

  draw(ctx, camera, player) {
    if (this.type.type === 'melee') this._drawSword(ctx, camera, player);
    else if (this.type.type === 'orb') this._drawOrbs(ctx, camera, player);
    // magic: no persistent body draw; floating icon rendered by player.draw()
  }

  _drawSword(ctx, camera, player) {
    if (this._swingFrames <= 0) return;

    const sx = Math.round(player.x - camera.x);
    const sy = Math.round(player.y - camera.y);
    const t  = this._swingFrames / this.type.swingDuration;
    const sw = player.facingRight ? sx + player.width : sx - this.type.range;
    ctx.fillStyle = `rgba(180, 220, 255, ${t * 0.55})`;
    ctx.fillRect(sw, sy, this.type.range, player.height);
    const ex = player.facingRight ? sw + this.type.range - 4 : sw;
    ctx.fillStyle = `rgba(255, 255, 255, ${t})`;
    ctx.fillRect(ex, sy + 4, 4, player.height - 8);
  }

  _drawOrbs(ctx, camera, player) {
    const px = Math.round(player.x + player.width  / 2 - camera.x);
    const py = Math.round(player.y + player.height / 2 - camera.y);
    const radius  = this.type.orbitRadius;
    const orbSize = this.type.orbitSize;

    for (let i = 0; i < this.orbCount; i++) {
      const angle = this._orbAngle + (i * Math.PI * 2) / this.orbCount;
      const ox = px + Math.cos(angle) * radius;
      const oy = py + Math.sin(angle) * radius;

      // Glow
      const glow = ctx.createRadialGradient(ox, oy, 0, ox, oy, orbSize * 2);
      glow.addColorStop(0, this.type.bodyColor + 'aa');
      glow.addColorStop(1, this.type.bodyColor + '00');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(ox, oy, orbSize * 2, 0, Math.PI * 2);
      ctx.fill();

      // Core
      ctx.fillStyle = this.type.bodyColor;
      ctx.beginPath();
      ctx.arc(ox, oy, orbSize, 0, Math.PI * 2);
      ctx.fill();

      // Highlight
      ctx.fillStyle = '#ffffff';
      ctx.globalAlpha = 0.65;
      ctx.beginPath();
      ctx.arc(ox - orbSize * 0.3, oy - orbSize * 0.35, orbSize * 0.35, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }
}
