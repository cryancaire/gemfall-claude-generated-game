// Shared cache so all enemies of the same type use one Image load.
const _cache = new Map();

export class SpriteSheet {
  static get(src, frameW, frameH) {
    if (!_cache.has(src)) _cache.set(src, new SpriteSheet(src, frameW, frameH));
    return _cache.get(src);
  }

  constructor(src, frameW, frameH) {
    this.frameW = frameW;
    this.frameH = frameH;
    this._img   = new Image();
    this._ready = false;
    this._img.onload = () => { this._ready = true; };
    this._img.src = src;
  }

  get ready() { return this._ready; }

  // col/row are 0-based frame indices within the sheet. dstW/dstH allow scaling.
  draw(ctx, col, row, dx, dy, flipX = false, dstW = null, dstH = null) {
    if (!this._ready) return false;
    const { frameW: fw, frameH: fh } = this;
    const w = dstW ?? fw;
    const h = dstH ?? fh;
    if (flipX) {
      ctx.save();
      ctx.translate(Math.round(dx + w), Math.round(dy));
      ctx.scale(-1, 1);
      ctx.drawImage(this._img, col * fw, row * fh, fw, fh, 0, 0, w, h);
      ctx.restore();
    } else {
      ctx.drawImage(this._img, col * fw, row * fh, fw, fh, Math.round(dx), Math.round(dy), w, h);
    }
    return true;
  }
}

export class AnimatedSprite {
  constructor(sheet, animations, defaultAnim) {
    this._sheet   = sheet;
    this._anims   = animations; // { name: { row, frames, fps } }
    this._current = defaultAnim;
    this._frame   = 0;
    this._timer   = 0;
  }

  // Switch to a named animation; resets to frame 0 only when changing
  play(name) {
    if (!this._anims[name]) return;
    if (name !== this._current) {
      this._current = name;
      this._frame   = 0;
      this._timer   = 0;
    }
  }

  update() {
    const anim = this._anims[this._current];
    if (!anim) return;
    const interval = Math.round(60 / (anim.fps ?? 8));
    if (++this._timer >= interval) {
      this._timer = 0;
      this._frame = (this._frame + 1) % anim.frames;
    }
  }

  // dx/dy = top-left of where to blit. flipX = mirror for left-facing sprites. scale = draw multiplier.
  draw(ctx, dx, dy, flipX = false, scale = 1) {
    const anim = this._anims[this._current];
    if (!anim) return false;
    const col  = (anim.colStart ?? 0) + this._frame;
    const dstW = scale !== 1 ? this._sheet.frameW * scale : null;
    const dstH = scale !== 1 ? this._sheet.frameH * scale : null;
    return this._sheet.draw(ctx, col, anim.row, dx, dy, flipX, dstW, dstH);
  }
}
