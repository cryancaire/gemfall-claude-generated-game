export class Input {
  constructor() {
    this._keys         = new Set();
    this._justPressed  = new Set();
    this._justReleased = new Set();

    // Gamepad virtual state — rebuilt each frame in pollGamepad()
    this._gpHeld = new Set();
    this._gpPrev = new Set();

    window.addEventListener('keydown', e => {
      const k = e.key.toLowerCase();
      if (!this._keys.has(k)) this._justPressed.add(k);
      this._keys.add(k);
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

  isDown(key)    { return this._keys.has(key)    || this._gpHeld.has(key); }
  wasPressed(key){ return this._justPressed.has(key) || (this._gpHeld.has(key) && !this._gpPrev.has(key)); }

  // Returns true if at least one gamepad is connected.
  hasGamepad() {
    if (!navigator.getGamepads) return false;
    return Array.from(navigator.getGamepads()).some(g => g && g.connected);
  }

  // Poll the Gamepad API and inject state into the virtual key sets.
  // Must be called once per frame BEFORE reading input (i.e. at the top of the game loop).
  pollGamepad() {
    // Snapshot previous frame so wasPressed() can detect transitions
    this._gpPrev = new Set(this._gpHeld);
    this._gpHeld.clear();

    if (!navigator.getGamepads) return;
    const gp = Array.from(navigator.getGamepads()).find(g => g && g.connected);
    if (!gp) return;

    const DEAD = 0.25;
    const lx = gp.axes[0] ?? 0;
    const ly = gp.axes[1] ?? 0;

    const dpadUp    = gp.buttons[12]?.pressed;
    const dpadDown  = gp.buttons[13]?.pressed;
    const dpadLeft  = gp.buttons[14]?.pressed;
    const dpadRight = gp.buttons[15]?.pressed;
    const btnA      = gp.buttons[0]?.pressed;   // confirm / jump
    const btnB      = gp.buttons[1]?.pressed;   // back
    const btnStart  = gp.buttons[9]?.pressed;   // pause / start

    // ---- Gameplay keys (merged with keyboard via standard names) ----
    if (lx < -DEAD || dpadLeft)  this._gpHeld.add('arrowleft');
    if (lx > DEAD  || dpadRight) this._gpHeld.add('arrowright');
    // A button or D-Pad Up = jump
    if (btnA || dpadUp)           this._gpHeld.add('arrowup');
    // Start = pause/escape
    if (btnStart)                 this._gpHeld.add('escape');

    // ---- Menu-specific virtual keys ----
    // These are separate so menu navigation doesn't interfere with gameplay inputs
    if (dpadLeft  || lx < -DEAD)                              this._gpHeld.add('gp_left');
    if (dpadRight || lx > DEAD)                               this._gpHeld.add('gp_right');
    if (dpadUp    || (ly < -DEAD && Math.abs(ly) > Math.abs(lx))) this._gpHeld.add('gp_up');
    if (dpadDown  || (ly > DEAD  && Math.abs(ly) > Math.abs(lx))) this._gpHeld.add('gp_down');
    if (btnA)     this._gpHeld.add('gp_confirm');
    if (btnB)     this._gpHeld.add('gp_back');
    if (btnStart) this._gpHeld.add('gp_start');
  }

  // Call once per frame AFTER reading all input
  flush() {
    this._justPressed.clear();
    this._justReleased.clear();
  }
}
