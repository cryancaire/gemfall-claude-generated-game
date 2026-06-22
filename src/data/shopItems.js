// Meta-progression shop item definitions.
// repeatable: true  → cost = baseCost + purchaseCount * costScale; limited by maxStack
// repeatable: false → one-time unlock; fixed cost
// currentStat(count) → returns a string showing the player's current value for this stat
export const SHOP_ITEMS = [

  // ---- Permanent stat upgrades ----
  {
    id: 'bonus_hp',
    name: 'Iron Flesh',
    icon: '❤️',
    category: 'stat',
    repeatable: true,
    maxStack: 10,
    baseCost: 25,
    costScale: 10,
    description: '+1 Max HP at the start of every run',
    currentStat: count => `Max HP: ${6 + count}`,
  },
  {
    id: 'bonus_speed',
    name: 'Fleet Foot',
    icon: '👟',
    category: 'stat',
    repeatable: true,
    maxStack: 5,
    baseCost: 35,
    costScale: 20,
    description: '+0.3 Move Speed at the start of every run',
    currentStat: count => `Speed: ${(4.5 + count * 0.3).toFixed(1)}`,
  },
  {
    id: 'bonus_jump',
    name: 'Springheels',
    icon: '🦘',
    category: 'stat',
    repeatable: true,
    maxStack: 2,
    baseCost: 60,
    costScale: 40,
    description: '+1 Max Jump at the start of every run',
    currentStat: count => `Jumps: ${1 + count}`,
  },
  {
    id: 'starting_choices',
    name: 'Arsenal Access',
    icon: '🎴',
    category: 'stat',
    repeatable: true,
    maxStack: 2,
    baseCost: 50,
    costScale: 40,
    description: '+1 starting weapon choice\nSee more options before each run begins',
    currentStat: count => `Choices: ${1 + count}`,
  },
  {
    id: 'starting_rerolls',
    name: 'Lucky Hand',
    icon: '🎲',
    category: 'stat',
    repeatable: true,
    maxStack: 3,
    baseCost: 30,
    costScale: 25,
    description: '+1 reroll available at the start of every run\nRerolls let you redraw level-up card offers',
    currentStat: count => `Starting Rerolls: ${count}`,
  },
  {
    id: 'reroll_on_levelup',
    name: 'Stroke of Luck',
    icon: '🍀',
    category: 'stat',
    repeatable: false,
    cost: 80,
    description: 'Gain 1 reroll each time you level up\nAlways have options when the cards fall short',
  },

  // ---- Map unlocks ----
  {
    id: 'unlock_volcano',
    name: 'Volcanic Cavern',
    icon: '🌋',
    category: 'map',
    repeatable: false,
    cost: 400,
    description: 'Unlock the Volcanic Cavern map\nHarder enemies, higher shard rewards',
  },

  // ---- One-time weapon unlocks ----
  {
    id: 'unlock_arcane_burst',
    name: 'Arcane Burst',
    icon: '💥',
    category: 'weapon',
    repeatable: false,
    cost: 75,
    description: 'Unlock Arcane Burst weapon\nShotgun — 5 bolts in a wide spread. Lethal at close range.',
  },
  {
    id: 'unlock_shadow_bolt',
    name: 'Shadow Bolt',
    icon: '🌑',
    category: 'weapon',
    repeatable: false,
    cost: 90,
    description: 'Unlock Shadow Bolt weapon\nFast, heavy projectile with massive single-target damage.',
  },

  // ---- One-time power card unlocks ----
  {
    id: 'unlock_glass_cannon',
    name: 'Glass Cannon',
    icon: '💀',
    category: 'powerup',
    repeatable: false,
    cost: 55,
    description: 'Unlock Glass Cannon upgrade card\n+80% spell damage, −3 Max HP. High risk, high reward.',
  },
  {
    id: 'unlock_iron_skin',
    name: 'Iron Skin',
    icon: '🛡️',
    category: 'powerup',
    repeatable: false,
    cost: 65,
    description: 'Unlock Iron Skin upgrade card\nReduce all incoming damage by 1 (minimum 1 per hit).',
  },
];
