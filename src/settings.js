export const Settings = {
  uiScale:      1.0,
  sfxVolume:    1.0,
  sfxMuted:     false,
  musicVolume:  0.5,
  musicMuted:   false,

  load() {
    try {
      const raw = localStorage.getItem('gemfall-settings');
      if (raw) {
        const data = JSON.parse(raw);
        if (typeof data.uiScale      === 'number')  this.uiScale      = Math.max(0.75, Math.min(1.75, data.uiScale));
        if (typeof data.sfxVolume    === 'number')  this.sfxVolume    = Math.max(0, Math.min(1, data.sfxVolume));
        if (typeof data.sfxMuted     === 'boolean') this.sfxMuted     = data.sfxMuted;
        if (typeof data.musicVolume  === 'number')  this.musicVolume  = Math.max(0, Math.min(1, data.musicVolume));
        if (typeof data.musicMuted   === 'boolean') this.musicMuted   = data.musicMuted;
      }
    } catch {}
    return this;
  },

  save() {
    localStorage.setItem('gemfall-settings', JSON.stringify({
      uiScale:     this.uiScale,
      sfxVolume:   this.sfxVolume,
      sfxMuted:    this.sfxMuted,
      musicVolume: this.musicVolume,
      musicMuted:  this.musicMuted,
    }));
  },
};

Settings.load();
