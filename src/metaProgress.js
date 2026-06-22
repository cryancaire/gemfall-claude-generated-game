export const MetaProgress = {
  shards:    0,
  purchases: {},  // { [itemId]: count }
  unlocks:   [],  // array of one-time unlock IDs

  load() {
    try {
      const raw = localStorage.getItem('gemfall-meta');
      if (raw) {
        const data = JSON.parse(raw);
        if (typeof data.shards === 'number') this.shards = Math.max(0, Math.floor(data.shards));
        if (data.purchases && typeof data.purchases === 'object') this.purchases = data.purchases;
        if (Array.isArray(data.unlocks)) this.unlocks = data.unlocks;
      }
    } catch {}
    return this;
  },

  save() {
    localStorage.setItem('gemfall-meta', JSON.stringify({
      shards:    this.shards,
      purchases: this.purchases,
      unlocks:   this.unlocks,
    }));
  },

  addShards(amount) {
    this.shards += Math.max(0, Math.floor(amount));
    this.save();
  },

  getPurchaseCount(id) {
    return this.purchases[id] ?? 0;
  },

  isUnlocked(id) {
    return this.unlocks.includes(id);
  },

  // Returns true and deducts shards on success; false if can't afford or already owned/maxed.
  purchase(item) {
    const count = this.getPurchaseCount(item.id);
    if (!item.repeatable && this.isUnlocked(item.id)) return false;
    if (item.repeatable && count >= item.maxStack)     return false;

    const cost = item.repeatable
      ? item.baseCost + count * item.costScale
      : item.cost;
    if (this.shards < cost) return false;

    this.shards -= cost;
    if (item.repeatable) {
      this.purchases[item.id] = count + 1;
    } else {
      this.unlocks.push(item.id);
    }
    this.save();
    return true;
  },

  calcShards({ enemiesDefeated, secondsSurvived, totalXpCollected, weaponsCount, upgradesCount, isVictory }) {
    return Math.floor(
      enemiesDefeated              *  3   +
      Math.floor(secondsSurvived / 10)    +
      totalXpCollected             *  0.1 +
      weaponsCount                 * 10   +
      upgradesCount                *  5   +
      (isVictory ? 100 : 0)
    );
  },
};

MetaProgress.load();
