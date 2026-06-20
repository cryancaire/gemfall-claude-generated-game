// Boss definitions keyed by map name. Add a new entry here to assign a different boss to a map.
const DRAGON_LORD = {
  name: 'Dragon Lord',
  icon: '🐉',
  hp: 800,
  speed: 1.1,
  attackDamage: 10,
  attackRange: 110,
  hitboxW: 86,
  hitboxH: 110,
  color: '#8b0000',
  scale: 3,
  sprites: {
    idle:   { src: 'src/assets/dragonlord/dragon_lord_idle_basic_74x74.png',   frameW: 74,  frameH: 74,  frames: 4,  fps: 6  },
    walk:   { src: 'src/assets/dragonlord/dragon_lord_walk_basic_74x74.png',   frameW: 74,  frameH: 74,  frames: 8,  fps: 10 },
    attack: { src: 'src/assets/dragonlord/dragon_lord_attack_arms_90x70.png',  frameW: 90,  frameH: 70,  frames: 16, fps: 12 },
    hurt:   { src: 'src/assets/dragonlord/dragon_lord_hurt_basic_130x130.png', frameW: 130, frameH: 130, frames: 5,  fps: 10 },
    death:  { src: 'src/assets/dragonlord/dragon_lord_death_160x160.png',      frameW: 160, frameH: 160, frames: 36, fps: 15 },
  },
};

export const BOSS_TYPES = {
  grasslands: DRAGON_LORD,
  cavern:     DRAGON_LORD,
};

export function getBossType(mapName) {
  return BOSS_TYPES[mapName] ?? DRAGON_LORD;
}
