export class Input {
  constructor() {
    this._keys = new Set();
    this._justPressed = new Set();
    this._justReleased = new Set();

    window.addEventListener('keydown', e => {
      const k = e.key.toLowerCase();
      if (!this._keys.has(k)) this._justPressed.add(k);
      this._keys.add(k);
      // Prevent page scroll on arrow/space keys
      if ([' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) {
        e.preventDefault();
      }
    });

    window.addEventListener('keyup', e => {
      const k = e.key.toLowerCase();
      this._keys.delete(k);
      this._justReleased.add(k);
    });
  }

  isDown(key) { return this._keys.has(key); }
  wasPressed(key) { return this._justPressed.has(key); }

  // Call once per frame after reading input
  flush() {
    this._justPressed.clear();
    this._justReleased.clear();
  }
}
