import { Weapon } from "../weapons/weapon.js";
import { WEAPON_TYPES } from "../weapons/weaponTypes.js";

export const CLASSES = [
  {
    id: "archmage",
    name: "Archmage",
    icon: "🧙",
    color: "#aa77ff",
    description:
      "Master of arcane arts.\n+25% spell damage · +10 luck\nStarts with Void Bolt",
    apply(player) {
      player.spellDamageBonus += 0.25;
      player.luck += 10;
      const w = new Weapon(WEAPON_TYPES.void_bolt);
      w.applyRarity("uncommon");
      player.weapons.push(w);
      player.lockedPowerupIds.add("weapon_boulder_toss");
      player.lockedPowerupIds.add("weapon_slot");
    },
  },
  {
    id: "iron_knight",
    name: "Iron Knight",
    icon: "⚔️",
    color: "#aabbcc",
    description:
      "Unyielding warrior.\n+4 Max HP · +1 damage reduction\nSword only — no magic allowed",
    apply(player) {
      player.maxHp += 4;
      player.hp = Math.min(player.hp + 4, player.maxHp);
      player.damageReduction += 1;
      const w = new Weapon(WEAPON_TYPES.sword);
      w.applyRarity("uncommon");
      player.weapons.push(w);
      for (const id of [
        "weapon_magic_missile",
        "weapon_ice_bolt",
        "weapon_fire_bolt",
        "weapon_lightning_bolt",
        "weapon_chain_lightning",
        "weapon_void_bolt",
        "weapon_orb",
        "weapon_arcane_burst",
        "weapon_shadow_bolt",
        "weapon_spectral_arrow",
        "weapon_boulder_toss",
        "weapon_venom_dart",
      ])
        player.lockedPowerupIds.add(id);
      player.lockedPowerupIds.add("weapon_slot");
    },
  },
  {
    id: "ranger",
    name: "Ranger",
    icon: "🏹",
    color: "#66cc88",
    description:
      "Swift hunter of the wilds.\n+20% move speed · +1 max jump\nStarts with Spectral Arrow",
    apply(player) {
      player.speed *= 1.2;
      player.maxJumps += 1;
      player.jumpsLeft = player.maxJumps;
      const w = new Weapon(WEAPON_TYPES.spectral_arrow);
      w.applyRarity("uncommon");
      player.weapons.push(w);
      player.lockedPowerupIds.add("weapon_orb");
      player.lockedPowerupIds.add("weapon_arcane_burst");
      player.lockedPowerupIds.add("weapon_boulder_toss");
      player.lockedPowerupIds.add("weapon_slot");
    },
  },
  {
    id: "stormcaller",
    name: "Stormcaller",
    icon: "⚡",
    color: "#ffcc44",
    description:
      "Crackles with lightning.\n+15% spell damage · chains hit more targets\nStarts with Chain Lightning (+1 chain)",
    apply(player) {
      player.spellDamageBonus += 0.15;
      player.chainLightningBonus += 1;
      const w = new Weapon(WEAPON_TYPES.chain_lightning);
      w.applyRarity("uncommon");
      w.chainCountBonus = 1;
      player.weapons.push(w);
      player.lockedPowerupIds.add("weapon_boulder_toss");
      player.lockedPowerupIds.add("weapon_orb");
      player.lockedPowerupIds.add("weapon_venom_dart");
      player.lockedPowerupIds.add("weapon_slot");
    },
  },
];
