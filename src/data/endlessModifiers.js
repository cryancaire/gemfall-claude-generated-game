// Positive modifiers offered at 10-minute milestones in endless mode,
// and available for purchase via the in-run shard shop.
// apply(player) mutates the current-run player state directly.
export const ENDLESS_MODIFIERS = [
  {
    id: 'em_bloodthirst',
    name: 'Bloodthirst',
    icon: '🩸',
    description: 'Every 15 kills, heal 1 HP',
    shardCost: 80,
    apply(player) { player.lifestealKills = Math.min(player.lifestealKills > 0 ? player.lifestealKills : 15, 15); },
  },
  {
    id: 'em_speed_rush',
    name: 'Speed Rush',
    icon: '💨',
    description: '+25% movement speed',
    shardCost: 100,
    apply(player) { player.speed *= 1.25; },
  },
  {
    id: 'em_overpower',
    name: 'Overpower',
    icon: '🔱',
    description: '+30% spell damage this run',
    shardCost: 150,
    apply(player) { player.spellDamageBonus = (player.spellDamageBonus ?? 0) + 0.30; },
  },
  {
    id: 'em_thick_skin',
    name: 'Thick Skin',
    icon: '🛡️',
    description: '+3 Max HP',
    shardCost: 120,
    apply(player) { player.maxHp += 3; player.hp = Math.min(player.hp + 3, player.maxHp); },
  },
  {
    id: 'em_arcane_echo',
    name: 'Arcane Echo',
    icon: '✨',
    description: '+20% chance to echo each spell for free',
    shardCost: 180,
    apply(player) { player.echoChance = Math.min(0.95, (player.echoChance ?? 0) + 0.20); },
  },
  {
    id: 'em_charged_core',
    name: 'Charged Core',
    icon: '🔋',
    description: '+25% spell damage while at full HP',
    shardCost: 160,
    apply(player) { player.overchargeBonus = (player.overchargeBonus ?? 0) + 0.25; },
  },
  {
    id: 'em_rapid_fire',
    name: 'Rapid Fire',
    icon: '🎯',
    description: 'All weapons fire 20% faster',
    shardCost: 200,
    apply(player) {
      for (const w of player.weapons) {
        w.attackInterval = Math.max(12, Math.round(w.attackInterval * 0.80));
      }
    },
  },
  {
    id: 'em_gem_magnet',
    name: 'Gem Magnet',
    icon: '💎',
    description: '+150 XP gem pickup range',
    shardCost: 60,
    apply(player) { player.expPickupRange += 150; },
  },
  {
    id: 'em_iron_resolve',
    name: 'Iron Resolve',
    icon: '⚙️',
    description: 'Reduce all incoming damage by 1 (minimum 1)',
    shardCost: 220,
    apply(player) { player.damageReduction = (player.damageReduction ?? 0) + 1; },
  },
  {
    id: 'em_second_chance',
    name: 'Last Stand',
    icon: '💫',
    description: 'Once per run, survive a killing blow with 1 HP',
    shardCost: 300,
    apply(player) { if (!player.deathDefiance) player.deathDefiance = true; },
  },
];
