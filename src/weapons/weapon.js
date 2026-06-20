// Weapon instance held by the player.
// tryAutoFire() fires when an enemy is within attackRange, returning projectile defs.
// For melee, it directly damages enemies and returns [].

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
  }

  // Scale this weapon's stats to a new rarity tier in place.
  applyRarity(rarity) {
    this.rarity = rarity;
    const scale = RARITY_SCALE[rarity] ?? RARITY_SCALE.common;
    this.damage         = Math.round(this.type.damage * scale.dmg);
    this.attackInterval = Math.max(6, Math.round(this.type.attackInterval * scale.intervalMult));
    this.attackRange    = Math.round(this.type.attackRange * scale.rangeMult);
  }

  update() {
    if (this._cooldown    > 0) this._cooldown--;
    if (this._swingFrames > 0) this._swingFrames--;
  }

  // Auto-fires toward the nearest enemy within attackRange.
  // Returns array of projectile defs (projectile) or [] (melee / not in range / on cooldown).
  tryAutoFire(player, enemies) {
    if (this._cooldown > 0) return [];

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
    const dir    = facingRight ? 1 : -1;
    const startX = facingRight
      ? player.x + player.width + 2
      : player.x - this.type.projectileW - 2;
    const startY = player.y + Math.floor(player.height * 0.35);
    const spd    = this.type.projectileSpeed;

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
        color:          this.type.projectileColor,
        trailColor:     this.type.trailColor,
        homing:         this.type.homing         ?? false,
        homingTurnRate: this.type.homingTurnRate ?? 0,
        maxRange:       this.type.maxRange,
      });
    }
    return defs;
  }

  // ---- Rendering ----

  draw(ctx, camera, player) {
    if (this.type.type === 'melee') this._drawSword(ctx, camera, player);
    else if (this.type.type === 'magic') this._drawStaff(ctx, camera, player);
  }

  _drawStaff(ctx, camera, player) {
    const sx = Math.round(player.x - camera.x);
    const sy = Math.round(player.y - camera.y);
    const staffX = player.facingRight ? sx + player.width : sx - 3;
    const staffY = sy + 6;
    ctx.fillStyle = '#7a5230';
    ctx.fillRect(staffX, staffY, 3, player.height - 10);
    ctx.fillStyle = this.type.bodyColor;
    ctx.fillRect(staffX - 2, staffY - 4, 7, 7);
    ctx.fillStyle = '#ffffff';
    ctx.globalAlpha = 0.6;
    ctx.fillRect(staffX, staffY - 2, 3, 3);
    ctx.globalAlpha = 1;
  }

  _drawSword(ctx, camera, player) {
    const sx = Math.round(player.x - camera.x);
    const sy = Math.round(player.y - camera.y);

    if (this._swingFrames <= 0) {
      const bx = player.facingRight ? sx + player.width - 1 : sx - 3;
      ctx.fillStyle = this.type.bodyColor;
      ctx.fillRect(bx, sy + 6, 3, player.height - 10);
      return;
    }

    const t  = this._swingFrames / this.type.swingDuration;
    const sw = player.facingRight ? sx + player.width : sx - this.type.range;
    ctx.fillStyle = `rgba(180, 220, 255, ${t * 0.55})`;
    ctx.fillRect(sw, sy, this.type.range, player.height);
    const ex = player.facingRight ? sw + this.type.range - 4 : sw;
    ctx.fillStyle = `rgba(255, 255, 255, ${t})`;
    ctx.fillRect(ex, sy + 4, 4, player.height - 8);
  }
}
