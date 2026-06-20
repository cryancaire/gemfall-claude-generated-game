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
  }

  update(enemies) {
    if (this.dead) return;

    // Homing — steer toward nearest live enemy
    if (this.homing) {
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
      this._trail.push({ x: this.x + this.width / 2, y: this.y + this.height / 2 });
      if (this._trail.length > 6) this._trail.shift();
    }

    this.x += this.vx;
    this.y += this.vy;
    this.distanceTraveled += Math.hypot(this.vx, this.vy);
    if (this.distanceTraveled > this.maxRange) {
      this.dead = true;
      if (this._weaponRef) this._weaponRef._activeProjectiles--;
      return;
    }

    // Enemy collision
    for (const e of enemies) {
      if (e.dead) continue;
      if (this.x < e.x + e.width  &&
          this.x + this.width  > e.x &&
          this.y < e.y + e.height &&
          this.y + this.height > e.y) {
        e.takeDamage(this.damage);
        SFX.hurt();
        this.dead = true;
        if (this._weaponRef) this._weaponRef._activeProjectiles--;
        return;
      }
    }
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
      if (this.homing && this.width > 5) {
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.fillRect(sx + 2, sy + 1, this.width - 4, this.height - 2);
      }
    }
  }
}
