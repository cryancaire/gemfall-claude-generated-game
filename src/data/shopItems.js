// Meta-progression shop item definitions.
// repeatable: true  → cost = baseCost + purchaseCount * costScale; limited by maxStack
// repeatable: false → one-time unlock; fixed cost
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
