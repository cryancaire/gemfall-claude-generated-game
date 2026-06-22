import { SFX } from '../audio.js';

export class Projectile {
  constructor(def) {
    this.x      = def.x;
    this.y      = def.y;
    this.width  = def.width;
    this.height = def.height;
    this.vx     = def.vx;
    this.vy     = def.vy;
    this.damage = def.damage;
    this.icon       = def.icon      ?? null;
    this._weaponRef = def.weaponRef ?? null;
    this.color  = def.color;
    this.homing          = def.homing ?? false;
    this.homingTurnRate  = def.homingTurnRate ?? 0;
    this.trailColor      = def.trailColor ?? [180, 80, 255];  // [r, g, b]
    this.maxRange        = def.maxRange;
    this.distanceTraveled = 0;
    this.dead   = false;
    this._trail = [];

    // Pierce fields
    this.pierce          = def.pierce ?? false;
    this._piercedEnemies = new Set();

    // Chain lightning fields
    this.chainCount     = def.chainCount     ?? 0;
    this.chainDamage    = def.chainDamage    ?? Math.ceil(this.damage * 0.5);
    this.chainRange     = def.chainRange     ?? 0;
    this._chainExcluded = def._chainExcluded ?? new Set();
    this.pendingChains  = [];
    this.pendingArcs    = [];

    // Launch animation fields
    this.launchFrames   = def.launchFrames  ?? 0;
    this.launchGravity  = def.launchGravity ?? 0;
    this.persistGravity = def.persistGravity ?? false;
    this.groundRoll     = def.groundRoll    ?? false;
    this._rolling       = false;
    this.wobble         = def.wobble        ?? 0;
    this.wobbleRate     = def.wobbleRate    ?? 0.4;
    this._wobbleAngle   = 0;

    // Poison cloud fields
    this.poisonOnDeath  = def.poisonOnDeath  ?? false;
    this.poisonRadius   = def.poisonRadius   ?? 50;
    this.poisonDuration = def.poisonDuration ?? 180;
    this.poisonDamage   = def.poisonDamage   ?? 2;
    this.poisonTickRate = def.poisonTickRate ?? 20;
    this.pendingCloud   = null;
  }

  _die() {
    this.dead = true;
    if (this._weaponRef) this._weaponRef._activeProjectiles--;
    if (this.poisonOnDeath) {
      this.pendingCloud = {
        x: this.x + this.width  / 2,
        y: this.y + this.height / 2,
        radius:   this.poisonRadius,
        damage:   this.poisonDamage,
        tickRate: this.poisonTickRate,
        life:     this.poisonDuration,
        maxLife:  this.poisonDuration,
        _tick:    0,
      };
    }
  }

  update(enemies, world = null) {
    if (this.dead) return;

    // Arc/lob: apply gravity during launch phase only
    if (this.launchGravity > 0 && this.launchFrames > 0) {
      this.vy += this.launchGravity;
    }

    // Persistent gravity continues after launch phase (e.g. boulder)
    if (this.persistGravity && this.launchFrames <= 0 && !this._rolling) {
      this.vy = Math.min(this.vy + this.launchGravity, 15);
    }

    // Rolling friction
    if (this._rolling) {
      this.vx *= 0.95;
      if (Math.abs(this.vx) < 0.5) { this._die(); return; }
    }

    // Wobble: perpetual sideways oscillation (lightning-style)
    if (this.wobble > 0) {
      this._wobbleAngle += this.wobbleRate;
      const spd = Math.hypot(this.vx, this.vy);
      if (spd > 0) {
        const ang  = Math.atan2(this.vy, this.vx);
        const perp = ang + Math.PI / 2;
        const kick = Math.sin(this._wobbleAngle) * this.wobble;
        this.vx += Math.cos(perp) * kick;
        this.vy += Math.sin(perp) * kick;
        const ns = Math.hypot(this.vx, this.vy);
        this.vx = (this.vx / ns) * spd;
        this.vy = (this.vy / ns) * spd;
      }
    }

    // Homing — steer toward nearest live enemy (suppressed during launch phase)
    if (this.homing) {
      if (this.launchFrames <= 0) {
        const target = this._nearest(enemies);
        if (target) {
          const tx = target.x + target.width  / 2;
          const ty = target.y + target.height / 2;
          const cx = this.x   + this.width    / 2;
          const cy = this.y   + this.height   / 2;
          const desired = Math.atan2(ty - cy, tx - cx);
          const current = Math.atan2(this.vy, this.vx);
          let diff = desired - current;
          while (diff >  Math.PI) diff -= Math.PI * 2;
          while (diff < -Math.PI) diff += Math.PI * 2;
          const turn = Math.sign(diff) * Math.min(Math.abs(diff), this.homingTurnRate);
          const spd  = Math.hypot(this.vx, this.vy);
          const newAngle = current + turn;
          this.vx = Math.cos(newAngle) * spd;
          this.vy = Math.sin(newAngle) * spd;
        }
      }
      this._trail.push({ x: this.x + this.width / 2, y: this.y + this.height / 2 });
      if (this._trail.length > 6) this._trail.shift();
    }

    if (this.launchFrames > 0) this.launchFrames--;

    this.x += this.vx;
    this.y += this.vy;
    this.distanceTraveled += Math.hypot(this.vx, this.vy);
    if (this.distanceTraveled > this.maxRange) {
      this._die();
      return;
    }

    // Ground detection for rolling (checked after movement so position is final for this frame)
    if (this.groundRoll && !this._rolling && world && this.vy > 2) {
      const { tile } = world.getTileAtPixel(this.x + this.width / 2, this.y + this.height);
      if (tile?.solid) {
        this._rolling = true;
        this.vy = 0;
      }
    }

    // Enemy collision
    for (const e of enemies) {
      if (e.dead || this._piercedEnemies.has(e)) continue;
      if (this.x < e.x + e.width  &&
          this.x + this.width  > e.x &&
          this.y < e.y + e.height &&
          this.y + this.height > e.y) {
        e.takeDamage(this.damage);
        SFX.hurt();
        // Chain lightning — queue next bolt before marking dead
        if (this.chainCount > 0 && this.chainRange > 0) {
          const excl = new Set(this._chainExcluded);
          excl.add(e);
          const next = this._nearestExcluding(enemies, excl);
          if (next) {
            const sx    = e.x    + e.width    / 2;
            const sy    = e.y    + e.height   / 2;
            const nx    = next.x + next.width  / 2;
            const ny    = next.y + next.height / 2;
            const angle = Math.atan2(ny - sy, nx - sx);
            this.pendingArcs.push({ x1: sx, y1: sy, x2: nx, y2: ny });
            this.pendingChains.push({
              x: sx - 3, y: sy - 2,
              width: 7, height: 4,
              vx: Math.cos(angle) * 9,
              vy: Math.sin(angle) * 9,
              damage:         this.chainDamage,
              color:          '#aaeeff',
              trailColor:     [120, 220, 255],
              homing:         false,
              homingTurnRate: 0,
              maxRange:       Math.hypot(nx - sx, ny - sy) + 80,
              chainCount:     this.chainCount - 1,
              chainDamage:    this.chainDamage,
              chainRange:     this.chainRange,
              _chainExcluded: excl,
            });
          }
        }
        if (this.pierce) {
          this._piercedEnemies.add(e);  // pass through — don't die
        } else {
          this._die();
          return;
        }
      }
    }
  }

  _nearestExcluding(enemies, excluded) {
    const cx = this.x + this.width  / 2;
    const cy = this.y + this.height / 2;
    let best = null, bestDist = Infinity;
    for (const e of enemies) {
      if (e.dead || excluded.has(e)) continue;
      const d = Math.hypot((e.x + e.width / 2) - cx, (e.y + e.height / 2) - cy);
      if (d < this.chainRange && d < bestDist) { bestDist = d; best = e; }
    }
    return best;
  }

  _nearest(enemies) {
    let best = null, bestDist = Infinity;
    const cx = this.x + this.width  / 2;
    const cy = this.y + this.height / 2;
    for (const e of enemies) {
      if (e.dead) continue;
      const d = Math.hypot((e.x + e.width / 2) - cx, (e.y + e.height / 2) - cy);
      if (d < bestDist) { bestDist = d; best = e; }
    }
    return best;
  }

  draw(ctx, camera) {
    if (this.dead) return;
    const cx = Math.round(this.x + this.width  / 2 - camera.x);
    const cy = Math.round(this.y + this.height / 2 - camera.y);

    // Homing trail
    if (this.homing && this._trail.length > 0) {
      const [tr, tg, tb] = this.trailColor;
      for (let i = 0; i < this._trail.length; i++) {
        const t = this._trail[i];
        const a = (i + 1) / this._trail.length * 0.35;
        const r = 4 * (i + 1) / this._trail.length;
        ctx.fillStyle = `rgba(${tr}, ${tg}, ${tb}, ${a})`;
        ctx.fillRect(
          Math.round(t.x - camera.x - r / 2),
          Math.round(t.y - camera.y - r / 2),
          r, r
        );
      }
    }

    if (this.icon) {
      const fontSize = Math.max(14, Math.round((this.width + this.height) * 0.8));
      ctx.save();
      ctx.font         = `${fontSize}px sans-serif`;
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor  = 'rgba(0,0,0,0.6)';
      ctx.shadowBlur   = 4;
      ctx.fillText(this.icon, cx, cy);
      ctx.restore();
    } else {
      // Fallback: colored rectangle
      const sx = Math.round(this.x - camera.x);
      const sy = Math.round(this.y - camera.y);
      ctx.fillStyle = this.color;
      ctx.fillRect(sx, sy, this.width, this.height);
      if (this.homing && this.width > 5 && !this.pierce) {
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.fillRect(sx + 2, sy + 1, this.width - 4, this.height - 2);
      }
    }
  }
}
