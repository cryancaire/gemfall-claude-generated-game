import { TILE_SIZE, GRAVITY } from '../config.js';

const COLLECT_RADIUS  = 20;
const ATTRACT_RADIUS  = 80;
const ATTRACT_SPEED   = 5;
const DESPAWN_FRAMES  = 600; // ~10 s at 60 fps
const COLLECT_DELAY   = 30;  // frames before gem becomes collectible (prevents instant pickup on stomp)

export class Gem {
  constructor(x, y, value) {
    this.x     = x;
    this.y     = y;
    this.value = value;
    this.width  = 10;
    this.height = 10;

    // Shoot left or right with a clear horizontal arc (1–2 tiles range)
    const dir  = Math.random() < 0.5 ? -1 : 1;
    this.vx    = dir * (3 + Math.random() * 3);  // 3–6 px/frame → ~1–2 tiles before stopping
    this.vy    = -(7 + Math.random() * 4);        // strong upward pop

    this.dead          = false;
    this.collected     = false;
    this._age          = 0;
    this._settled      = false;
    this._bobPhase     = Math.random() * Math.PI * 2;
    this._collectDelay = COLLECT_DELAY;
  }

  update(world, player) {
    if (this.dead) return;
    this._age++;

    if (this._collectDelay > 0) this._collectDelay--;

    if (!this._settled) {
      this.vy += GRAVITY * 0.55;
      if (this.vy > 14) this.vy = 14;
      this.vx *= 0.88; // friction

      this.x += this.vx;
      this.y += this.vy;

      // Tile floor collision
      const tileX = Math.floor((this.x + this.width / 2) / TILE_SIZE);
      const tileY = Math.floor((this.y + this.height)    / TILE_SIZE);
      const below = world.getTile(tileX, tileY);
      if (below && below.solid && this.vy >= 0) {
        this.y  = tileY * TILE_SIZE - this.height;
        this.vy = -this.vy * 0.3;
        this.vx *= 0.5;
        if (Math.abs(this.vy) < 0.8) {
          this.vy = 0;
          this.vx = 0;
          this._settled = true;
        }
      }

      if (this._age > 60 && Math.abs(this.vy) < 0.5 && Math.abs(this.vx) < 0.3) {
        this._settled = true;
      }
    }

    // Attract and collect only after the delay expires
    if (this._collectDelay <= 0) {
      const pcx  = player.x + player.width  / 2;
      const pcy  = player.y + player.height / 2;
      const gcx  = this.x   + this.width    / 2;
      const gcy  = this.y   + this.height   / 2;
      const dist = Math.hypot(pcx - gcx, pcy - gcy);

      if (dist < ATTRACT_RADIUS) {
        const dx  = pcx - gcx;
        const dy  = pcy - gcy;
        const len = dist || 1;
        const spd = ATTRACT_SPEED * (1 + (ATTRACT_RADIUS - dist) / ATTRACT_RADIUS);
        this.x += (dx / len) * spd;
        this.y += (dy / len) * spd;
        this._settled = false;
      }

      if (dist < COLLECT_RADIUS) {
        player.collectGem(this);
        this.collected = true;
        this.dead      = true;
      }
    }

    if (this._age > DESPAWN_FRAMES) this.dead = true;
  }

  draw(ctx, camera) {
    if (this.dead) return;

    const bob = this._settled ? Math.sin(this._age * 0.09 + this._bobPhase) * 2.5 : 0;
    const sx  = Math.round(this.x - camera.x);
    const sy  = Math.round(this.y - camera.y + bob);
    const cx  = sx + this.width  / 2;
    const cy  = sy + this.height / 2;
    const hw  = this.width  / 2;
    const hh  = this.height / 2;

    // Glow
    ctx.fillStyle = 'rgba(80, 255, 120, 0.18)';
    ctx.beginPath();
    ctx.arc(cx, cy, hw + 5, 0, Math.PI * 2);
    ctx.fill();

    // Diamond body
    ctx.fillStyle = '#33ee55';
    ctx.beginPath();
    ctx.moveTo(cx,      cy - hh);
    ctx.lineTo(cx + hw, cy);
    ctx.lineTo(cx,      cy + hh);
    ctx.lineTo(cx - hw, cy);
    ctx.closePath();
    ctx.fill();

    // Highlight
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.beginPath();
    ctx.moveTo(cx,            cy - hh);
    ctx.lineTo(cx + hw * 0.5, cy - hh * 0.2);
    ctx.lineTo(cx,            cy - hh * 0.15);
    ctx.lineTo(cx - hw * 0.5, cy - hh * 0.2);
    ctx.closePath();
    ctx.fill();
  }
}
