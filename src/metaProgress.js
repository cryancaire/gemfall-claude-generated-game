import { SHOP_ITEMS } from './data/shopItems.js';

export const MetaProgress = {
  shards:      0,
  purchases:   {},  // { [itemId]: count }
  unlocks:     [],  // array of one-time unlock IDs
  shardsSpent: 0,   // running total of shards spent on purchases (used for respec refund)
  respecCount: 0,   // number of times the player has respecced (drives escalating cost)

  load() {
    try {
      const raw = localStorage.getItem('gemfall-meta');
      if (raw) {
        const data = JSON.parse(raw);
        if (typeof data.shards      === 'number') this.shards      = Math.max(0, Math.floor(data.shards));
        if (typeof data.shardsSpent === 'number') this.shardsSpent = Math.max(0, Math.floor(data.shardsSpent));
        if (typeof data.respecCount === 'number') this.respecCount = Math.max(0, Math.floor(data.respecCount));
        if (data.purchases && typeof data.purchases === 'object') this.purchases = data.purchases;
        if (Array.isArray(data.unlocks)) this.unlocks = data.unlocks;
      }
    } catch {}
    return this;
  },

  save() {
    localStorage.setItem('gemfall-meta', JSON.stringify({
      shards:      this.shards,
      shardsSpent: this.shardsSpent,
      respecCount: this.respecCount,
      purchases:   this.purchases,
      unlocks:     this.unlocks,
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

    this.shards      -= cost;
    this.shardsSpent += cost;
    if (item.repeatable) {
      this.purchases[item.id] = count + 1;
    } else {
      this.unlocks.push(item.id);
    }
    this.save();
    return true;
  },

  calcRespecCost() {
    return Math.floor(100 * Math.pow(1.8, this.respecCount));
  },

  // Calculates the total shards actually spent on current purchases, derived from
  // SHOP_ITEMS so it works even for purchases made before shardsSpent tracking existed.
  calcTotalSpent() {
    let total = 0;
    for (const item of SHOP_ITEMS) {
      if (item.repeatable) {
        const count = this.getPurchaseCount(item.id);
        for (let i = 0; i < count; i++) total += item.baseCost + i * item.costScale;
      } else if (this.isUnlocked(item.id)) {
        total += item.cost;
      }
    }
    return total;
  },

  hasAnyPurchases() {
    return Object.keys(this.purchases).length > 0 || this.unlocks.length > 0;
  },

  // Charges the respec fee, refunds all spent shards, resets purchases/unlocks.
  // Returns false if the player can't afford the fee.
  respec() {
    const actualSpent = this.calcTotalSpent();
    const fee         = this.calcRespecCost();
    if (this.shards < fee) return false;
    this.shards      -= fee;
    this.shards      += actualSpent;
    this.purchases    = {};
    this.unlocks      = [];
    this.shardsSpent  = 0;
    this.respecCount += 1;
    this.save();
    return true;
  },

  // Hard reset — wipes everything including respec history.
  reset() {
    this.shards      = 0;
    this.purchases   = {};
    this.unlocks     = [];
    this.shardsSpent = 0;
    this.respecCount = 0;
    this.save();
  },

  calcShards({ enemiesDefeated, secondsSurvived, totalXpCollected, weaponsCount, upgradesCount, isVictory, modifierBonus = 0 }) {
    const base = Math.floor(
      enemiesDefeated              *  3   +
      Math.floor(secondsSurvived / 10)    +
      totalXpCollected             *  0.1 +
      weaponsCount                 * 10   +
      upgradesCount                *  5   +
      (isVictory ? 100 : 0)
    );
    const bountyMult = 1 + this.getPurchaseCount('bounty_hunter') * 0.10;
    return Math.floor(base * bountyMult * (1 + modifierBonus));
  },
};

MetaProgress.load();
