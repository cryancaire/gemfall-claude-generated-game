import { Settings } from './settings.js';

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

// Sync all mute-related UI elements to current Settings state.
// Called by any handler that toggles sfxMuted.
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
