import { Settings } from './settings.js';

// ── Sound Effects ──────────────────────────────────────────────────────────

const BASE = 'src/assets/sounds/';
const _cache = {};

function _get(name) {
  if (!_cache[name]) {
    const a = new Audio(BASE + name);
    a.preload = 'auto';
    _cache[name] = a;
  }
  return _cache[name];
}

function play(name, baseVolume = 1) {
  if (Settings.sfxMuted) return;
  try {
    const clone = _get(name).cloneNode();
    clone.volume = Math.max(0, Math.min(1, baseVolume * Settings.sfxVolume));
    clone.play().catch(() => {});
  } catch {}
}

export const SFX = {
  gem()    { play('exp.wav',      0.55); },
  hurt()   { play('hurt.wav',     0.65); },
  powerUp(){ play('power_up.wav', 0.75); },
  tap()    { play('tap.wav',      0.45); },
};

// Sync SFX mute UI elements to current Settings state.
export function syncMuteUI() {
  const muted = Settings.sfxMuted;

  const topBtn = document.getElementById('mute-btn');
  if (topBtn) topBtn.textContent = muted ? '🔇' : '🔊';

  const panelBtn = document.getElementById('sfx-mute-btn');
  if (panelBtn) {
    panelBtn.textContent = muted ? '🔇 Muted' : '🔊 Enabled';
    panelBtn.classList.toggle('ps-toggle-btn--muted', muted);
  }
}

// ── Background Music ───────────────────────────────────────────────────────

const MAP_TRACKS = {
  grasslands: `${BASE}GrasslandLoop.mp3`,
  cavern:     `${BASE}VolcanoLoop.mp3`,
};

export const Music = {
  _node:    null,
  _current: null,

  playForMap(mapName) {
    const src = MAP_TRACKS[mapName];
    if (!src) return;
    if (this._current === src) {
      // Resume if paused (e.g. returning from title)
      if (this._node?.paused) this._node.play().catch(() => {});
      return;
    }
    this.stop();
    this._current = src;
    if (Settings.musicMuted) return;
    const a = new Audio(src);
    a.loop   = true;
    a.volume = Math.max(0, Math.min(1, Settings.musicVolume));
    a.play().catch(() => {});
    this._node = a;
  },

  stop() {
    if (this._node) {
      this._node.pause();
      this._node = null;
    }
    this._current = null;
  },

  syncVolume() {
    if (this._node) {
      this._node.volume = Settings.musicMuted ? 0 : Math.max(0, Math.min(1, Settings.musicVolume));
    }
  },
};

// Sync music mute UI elements to current Settings state.
export function syncMusicUI() {
  const muted = Settings.musicMuted;
  const panelBtn = document.getElementById('music-mute-btn');
  if (panelBtn) {
    panelBtn.textContent = muted ? '🔇 Muted' : '🎵 Enabled';
    panelBtn.classList.toggle('ps-toggle-btn--muted', muted);
  }
  Music.syncVolume();
}
