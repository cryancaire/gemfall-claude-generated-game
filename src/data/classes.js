import { Weapon } from "../weapons/weapon.js";
import { WEAPON_TYPES } from "../weapons/weaponTypes.js";

export const CLASSES = [
  {
    id: "archmage",
    name: "Archmage",
    icon: "🧙",
    color: "#aa77ff",
    description:
      "Master of elemental magic.\n+25% spell damage · +10 luck\nThunder, Ice & Fire only",
    apply(player) {
      player.spellDamageBonus += 0.25;
      player.luck += 10;
      const w = new Weapon(WEAPON_TYPES.lightning_bolt);
      w.applyRarity("uncommon");
      player.weapons.push(w);
      // Lock everything that isn't thunder / ice / fire
      for (const id of [
        "weapon_magic_missile",
        "weapon_void_bolt",
        "weapon_orb",
        "weapon_arcane_burst",
        "weapon_shadow_bolt",
        "weapon_spectral_arrow",
        "weapon_boulder_toss",
        "weapon_venom_dart",
        "weapon_slot",
      ])
        player.lockedPowerupIds.add(id);
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
