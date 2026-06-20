export const Settings = {
  uiScale: 1.0,

  load() {
    try {
      const raw = localStorage.getItem('gemfall-settings');
      if (raw) {
        const data = JSON.parse(raw);
        if (typeof data.uiScale === 'number') {
          this.uiScale = Math.max(0.75, Math.min(1.75, data.uiScale));
        }
      }
    } catch {}
    return this;
  },

  save() {
    localStorage.setItem('gemfall-settings', JSON.stringify({ uiScale: this.uiScale }));
  },
};

Settings.load();
