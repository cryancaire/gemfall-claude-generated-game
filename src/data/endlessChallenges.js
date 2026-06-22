// Challenge modifiers offered at each endless-mode milestone.
// Player picks one — the penalty is applied immediately but so is the reward.
// shardBonus stacks across all picked challenges for the run summary.
//
// isApplicable(player, entities) → false means this challenge is filtered out
// (already active, would have no effect, or logically can't stack).

export const ENDLESS_CHALLENGES = [
  {
    id: 'cha_relentless',
    name: 'Relentless Horde',
    icon: '👥',
    description: 'Enemy spawns are 80% more frequent.\n\n⚡ Reward: +25% spell damage',
    shardBonus: 0.30,
    isApplicable: (_p, entities) => !entities._crowdsActive,
    apply(player, entities) {
      entities._crowdsActive = true;
      player.spellDamageBonus += 0.25;
      player.activeChallengeIds.add(this.id);
    },
  },
  {
    id: 'cha_iron_gauntlet',
    name: 'Iron Gauntlet',
    icon: '🗡️',
    description: 'You take 75% more damage from all sources.\n\n⚡ Reward: +3 Max HP, restored to full',
    shardBonus: 0.50,
    endlessOnly: true,
    isApplicable: (player) => !player.activeChallengeIds.has('cha_iron_gauntlet'),
    apply(player) {
      player.damageTakenMult *= 1.75;
      player.maxHp += 3;
      player.hp = player.maxHp;
      player.activeChallengeIds.add(this.id);
    },
  },
  {
    id: 'cha_death_wish',
    name: 'Death Wish',
    icon: '💀',
    description: 'HP regeneration is completely disabled.\n\n⚡ Reward: +4 Max HP, restored to full',
    shardBonus: 0.35,
    endlessOnly: true,
    isApplicable: (player) => !player.regenDisabled,
    apply(player) {
      player.regenDisabled = true;
      player.maxHp += 4;
      player.hp = player.maxHp;
      player.activeChallengeIds.add(this.id);
    },
  },
  {
    id: 'cha_glass_cannon',
    name: 'Glass Cannon',
    icon: '💥',
    description: 'Your Max HP is cut in half (minimum 3).\n\n⚡ Reward: +80% spell damage',
    shardBonus: 0.65,
    isApplicable: (player) => !player.activeChallengeIds.has('cha_glass_cannon') && player.maxHp > 3,
    apply(player) {
      player.maxHp = Math.max(3, Math.floor(player.maxHp / 2));
      player.hp = Math.min(player.hp, player.maxHp);
      player.spellDamageBonus += 0.80;
      player.activeChallengeIds.add(this.id);
    },
  },
  {
    id: 'cha_hunted',
    name: 'Hunted',
    icon: '🐺',
    description: 'All enemies move 50% faster.\n\n⚡ Reward: +30% movement speed',
    shardBonus: 0.35,
    isApplicable: (player) => {
      const stacks = [...player.activeChallengeIds].filter(id => id === 'cha_hunted').length;
      return stacks < 2;
    },
    apply(player, entities) {
      entities._globalSpeedMult *= 1.5;
      for (const e of entities.enemies) e.speed = Math.max(0.15, e.speed * 1.5);
      player.speed *= 1.3;
      player.activeChallengeIds.add(this.id);
    },
  },
  {
    id: 'cha_elite_surge',
    name: 'Elite Surge',
    icon: '👑',
    description: 'Elite enemy spawn chance is tripled.\n\n⚡ Reward: Enemy gems worth 2× more XP',
    shardBonus: 0.45,
    isApplicable: (player) => !player.activeChallengeIds.has('cha_elite_surge'),
    apply(player, entities) {
      entities._eliteRateMult = (entities._eliteRateMult ?? 1) * 3;
      player.gemValueMultiplier *= 2;
      player.activeChallengeIds.add(this.id);
    },
  },
  {
    id: 'cha_juggernaut',
    name: 'Juggernaut',
    icon: '🪨',
    description: 'All enemies spawn with double HP.\n\n⚡ Reward: Enemy gems worth 3× more XP',
    shardBonus: 0.40,
    isApplicable: (player) => !player.activeChallengeIds.has('cha_juggernaut'),
    apply(player, entities) {
      entities._hpBonusMult = (entities._hpBonusMult ?? 1) * 2;
      player.gemValueMultiplier *= 3;
      player.activeChallengeIds.add(this.id);
    },
  },
  {
    id: 'cha_sluggish_fire',
    name: 'Sluggish Fire',
    icon: '🐢',
    description: 'All equipped weapons fire 40% slower.\n\n⚡ Reward: +70% spell damage',
    shardBonus: 0.55,
    isApplicable: (player) => !player.activeChallengeIds.has('cha_sluggish_fire'),
    apply(player) {
      for (const w of player.weapons) {
        w.attackInterval = Math.round(w.attackInterval * 1.4);
      }
      player.spellDamageBonus += 0.70;
      player.activeChallengeIds.add(this.id);
    },
  },
  {
    id: 'cha_cursed',
    name: 'Cursed',
    icon: '🔮',
    description: 'Lose 1 HP every 25 seconds.\n\n⚡ Reward: Lifesteal — heal 1 HP every 8 kills',
    shardBonus: 0.30,
    isApplicable: () => true,
    apply(player) {
      player.hpDrainRate += 1 / 25;
      // Lifesteal: reduce kills-per-heal counter (lower = more frequent)
      player.lifestealKills = player.lifestealKills > 0
        ? Math.max(3, player.lifestealKills - 4)
        : 8;
      player.activeChallengeIds.add(this.id);
    },
  },
  {
    id: 'cha_doomed',
    name: 'Doomed',
    icon: '☠️',
    description: 'Take +1 extra damage from every hit.\n\n⚡ Reward: +5 Max HP, restored to full',
    shardBonus: 0.45,
    endlessOnly: true,
    isApplicable: () => true,
    apply(player) {
      player.damageTakenFlat = (player.damageTakenFlat ?? 0) + 1;
      player.maxHp += 5;
      player.hp = player.maxHp;
      player.activeChallengeIds.add(this.id);
    },
  },
];
