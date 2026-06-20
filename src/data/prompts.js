// Every user prompt that shaped this game, in chronological order.
// Add a new entry here each time a major feature prompt is fulfilled.
export const PROMPTS = [
  {
    id: 1,
    title: "Initial Game Setup",
    date: "2026-06-19",
    text: `im thinking i would like you to create a basic web based video game. you can make this in react or vanilla javascript, whatever you think will work better.

lets focus on a few things first:
this should be a 2d sidescrolling game
there should be infinite generation of the map, there should only be one map for now (but maybe make this scalable for when we are ready to make more than one map)
make the map out of tiles that are currently just basic squares/rectangles for now, but build this so we can add assets later
i would like the map to have varying y-levels that the player can traverse, with collision
the player character should be movable with wasd and should be a basic shape for now (but we will be adding assets later)
lets start with this`,
  },

  {
    id: 2,
    title: "Enemies, XP Gems & Player Stats",
    date: "2026-06-19",
    text: `i would like to, next, add a few enemies to the game.
they should, like the player, be built in a way that we can add sprite sheets in later. they should have configurable values for their health and the amount of damage they do to the player on contact, as well as if the player can damage/kill them by jumping on top of them. enemies should drop experience gems that the player can pick up and level up when gaining an amount that varies with the player's level.
the player should get configurable properties for health, damage, speed, number of jumps - so that in a future iteration, the we can design/develop weapons for the player which will make them damage the enemies.`,
  },

  {
    id: 3,
    title: "Prompt History Modal",
    date: "2026-06-19",
    text: `i would like to add a UI button which opens a model which can show a list of all the prompts used to build this game. lets start by adding all of the previous prompts to a file and use that file for the modal`,
  },

  {
    id: 4,
    title: "Death, Title Screen, Level-Up Cards & Gem Fixes",
    date: "2026-06-19",
    text: `So i noticed that upon killing an enemy, i just gain the experience.
also make the enemy drop a gem of experience that can be picked up by the player. this gem should fly a tile or 2 to the left or right for some visual flair.
also, the player currently can take damage forever and not actually die. when the player gets to 0 hp, they should die and the game should restart.
lets also build in a title screen for this game that has a "New Game" button. the title of the game should be some fun title that you come up with, related to this game.
I would also like it so that when the player collects enough xp and levels up, a "level up" screen should appear. during this time, the game should pause and the player should be presented 3 cards on screen which each represent a type of powerup. the base rarity powerups should be from this list:
additional max hp,
heal hp,
additional jump,
additional damage,
slow enemies down
xp gems are worth more xp`,
  },

  {
    id: 5,
    title: "Weapons, Randomization & Spikebot Fix",
    date: "2026-06-19",
    text: `I noticed that there are enemies which the player cannot hurt by jumping on them, this is fine for now. However, the player shouldn't instantly die, but take a little damage from touching them.
Also, are the level elements and enemies' placement random? Seems to be the same each time i reload. I would like to at least randomize the placement of enemies. If we can make the level generation at least appear to be more random, that would be great too!
I would also like to start building out a simple weapon system. These weapons should be entities that i can add assets to later, but for now there should be a few weapons like different guns, a sword, and some magic-missile-like projectile.
These weapons should appear in the level up card selection.
Can we also add a bit of clarity on the main title screen that states the code in this game was generated with Claude?`,
  },

  {
    id: 6,
    title: "Auto-fire Weapons & Mystic Woods Sprites",
    date: "2026-06-19",
    text: `So instead of the player having to press a key (you have set as j currently), i would really like the weapons to trigger automatically at a set, configurable interval, when you reach within a certain distance of an enemy. The range and also interval should be a configurable value, that can be increased and changed via upgrade card selections.
I have added a folder in /assets called 'mystic-woods' with some characters, objects, and projectiles sprite sheets. Im not sure the size of the actual sprites. Can you look through these and see if they would fit for the player character, and maybe at least one enemy type, and update them to use the assets?`,
  },

  {
    id: 7,
    title: "Fix some issues with player sprites",
    date: "2026-06-20",
    text: `I have a few observations - the player and the slime, now that they have sprites, seem to be quite a bit smaller than they should be. Can we scale them up a bit? Maybe I need to find bigger sprites? Let me know if thats the case. 
Another observation regarding both the player AND the slime, their sprites hover a bit off the ground. Probably something to do with the sprite scaling. Lets try to fix that.
Also, maybe we get rid of the "gun" type weapons and stick to homing magic attacks. The guns dont feel good, but the magic missile does. Maybe have homing ice, fire, lightning attacks along with the magic missile. Lets start there.`,
  },

  {
    id: 8,
    title: "More cleanup",
    date: "2026-06-20",
    text: `The player and the slime both still hover off the ground a bit, lets fix that. I noticed that the slime sprite flickers invisible now and then, consistently. Maybe the animation is missing a frame or something? 
Also, every time the user levels up, they should gain some amount of max hp.
I noticed that the sword powerup is still there, lets get rid of that.
I think it would be nice if we could have multiple different weapons such as the lightning and fire both at the same time. Lets update to have that happen.`,
  },

  {
    id: 9,
    title: "Add UI for weapons and upgrades.",
    date: "2026-06-20",
    text: `I would like some UI in the bottom of the screen with boxes that show the number of weapons the player can acquire, which by default will be 1 weapon. And when they have acquired a weapon, it should show information about the weapon (icon, name, level, any pertinent stats you think could be displayed) and upon leveling up, there should be a decently high rarity (epic or better essentially) option for getting a new weapon slot as an upgrade. The UI should update to reflect having a new, empty weapon slot. 
There should also be similar UI maybe on the middle left of the screen, which shows little boxes that display the upgrades the player has gotten. 
One more thing, if the player has already acquired one of the weapons, there should be a pretty low chance that the player could get a weapon upgrade of that same weapon (from current rarity -> up one rarity) but the player should not be able to have duplicate weapons, just upgraded rarity which improves the stats.`,
  },

  {
    id: 10,
    title: "UI Rework",
    date: "2026-06-20",
    text: `Before we move on to any new features, i think we should make some changes to the UI. 
First, I think we should move the HP bar and Level/exp bar to be just above the weapon section. 
Second: I think the level's lowest ground should be higher than the lowest UI so lets start the ground generation a bit higher up.
Third: The section that shows all the powerups on the left side, instead of only being 2 upgrades per row, lets make it up to 5 upgrades in a row. 
Fourth: Lets add a pause menu that opens when the player presses ESC or clicks the pause button. The pause menu should, naturally, pause the game. On the pause menu, the player should see detailed stats about their run that displays stats with all upgrades calculated in them. show a nice list of all their upgrades and explanation of each.`,
  },

  {
    id: 11,
    title: "Added settings screen with UI scaling",
    date: "2026-06-20",
    text: `I would like there to be a settings menu thats accessible via the pause menu. Currently the only setting I want is UI scaling. 
Also, I would like to add 2 new stats: 
HP Regeneration per second, which starts as 0, but can be upgraded via the level up upgrade cards
Luck - this should start with 0 bonus, but can also be upgraded via the level up upgrade cards.

Modify the level up upgrade cards selection system to incorporate luck the luck stat, with the higher rarities obviously being harder to get (using luck)`,
  },

  {
    id: 12,
    title: "Added starting weapon selection",
    date: "2026-06-20",
    text: `When the player starts a new game, they should be prompted to pick a starting weapon and get a choice of just 2 of the available weapons`,
  },

  {
    id: 13,
    title: "Fixed starting weapon selection",
    date: "2026-06-20",
    text: `Lets make the weapons be two in a row, next to each other, rather than one column`,
  },
];
