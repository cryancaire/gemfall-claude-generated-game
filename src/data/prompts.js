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

  {
    id: 14,
    title: "Fixed a bug with the color blue... lol",
    date: "2026-06-20",
    text: `
can you update the rare color from "blue" to a hex value? apparently blue crashes the app`,
  },

  {
    id: 15,
    title: "Added sounds",
    date: "2026-06-20",
    text: `I noticed that sometimes, when choosing a weapon, it will say that its uncommon rarity, but if its the first time you collected that weapon, it will end up just giving you the common version.
Also, i would love to add some sounds to the game, i have added some files under the /assets/sounds folder and i would like to use them as follows: 
exp.wav for when you pick up a gem, 
hurt.wav when a projectile hits an enemy as well as when the player gets hurt
power_up.wav should play when the player levels up and is presented with the levelup screen
tap.wav is when the user clicks any UI button`,
  },

  {
    id: 16,
    title: "Fixed rarity of starting weapons",
    date: "2026-06-20",
    text: `On game start, when the player is presented a choice of 2 weapons to start with, they should only be presented with common rarity.
In the settings screen, I would like to add a slider to control specifically the sound effects volume. As well as a mute for the sound effects.
(later we will add music and that will need to be controlled separately)
I would also like a mute toggle on the top right of the game screen next to the pause button`,
  },

  {
    id: 17,
    title: "Move the weapons to above player head",
    date: "2026-06-20",
    text: `i would like it so that the weapons actually float in a bit of a wiggly pattern over the head of the player, and not stacked on top of each other. 
along with that, i would like to add another weapon that can start off as common rarity - an orb that rotates around the player character and will hit enemies. this orb should be upgradable with its damage, and speed. it should also have upgrades that add additional orbs. increased rarity upgrades should always add an orb and some power.`,
  },

  {
    id: 18,
    title: "Changes to the upgrades selection logic",
    date: "2026-06-20",
    text: `Ive noticed that im not seeing weapon slots or additional weapons in the levelup upgrades lately. did we change something to not show them?`,
  },

  {
    id: 19,
    title: "Add a timer and scaling difficulty",
    date: "2026-06-20",
    text: `i would like it so that the projectiles actually spawn from the icon above the player's head rather than from the player itself.
next, add a timer in the top middle of the screen. this timer should count up from 0, starting when the player selects their starting weapon. it should pause the timer when the player is in the pause screen.
i would also like to start adding some kind of scaling difficulty, but not totally sure. maybe the longer the timer goes, the more enemies start spawning? and maybe the enemies also scale in health and damage dealt`,
  },

  {
    id: 20,
    title: "Change projectiles to their icons",
    date: "2026-06-20",
    text: `i would like it if the projectiles that fire from the weapon icons were actually also the weapon icon instead of a colored shape.`,
  },

  {
    id: 21,
    title: "Adding skip/reroll",
    date: "2026-06-20",
    text: `
i would like to allow the player, on the level up screen, to skip selecting powerup. if they do, they are awarded a reroll, with which next level up they can reroll the options for the upgrades available`,
  },

  {
    id: 22,
    title: "Trying to scale difficulty better",
    date: "2026-06-20",
    text: `i think the difficulty needs to scale up a bit faster/harder. this feels kind of boring`,
  },

  {
    id: 23,
    title: "Redesign the Pause menu",
    date: "2026-06-20",
    text: `lets redesign the pause menu a bit. instead of having the descriptions of the weapons and upgrades making them wide, lets have a little square with the icon and then on hover it shows the description`,
  },

  {
    id: 24,
    title: "Fix a bug with the tooltip",
    date: "2026-06-20",
    text: `on the pause menu, the weapons' hover tool tip needs a higher z-index, as its behind the top of the menu`,
  },

  {
    id: 25,
    title: "Soft projectile cap, upgradable up to a hard cap",
    date: "2026-06-20",
    text: `there should probably be a limit to the number of projectiles that can exist at once per weapon. this should be upgradable via the levelup upgrades menu. but it should be hard capped via a config variable. this will help the player not become incredibly overpowered and invincible.`,
  },

  {
    id: 26,
    title: "Tweaking projectile count",
    date: "2026-06-20",
    text: `default max projectiles for every weapon should be 1, and then it can be upgraded. but i think the upgrades should be a little rarer than they are`,
  },

  {
    id: 27,
    title: "Tweaked attack speed",
    date: "2026-06-20",
    text: `i feel like attack speed is starting too high, and ramping up too quickly. im trying to balance difficulty here`,
  },

  {
    id: 28,
    title: "Get some information on leaderboards",
    date: "2026-06-20",
    text: `i was thinking it would be really neat to add in a leaderboard for players to compare scores. can you look up free leaderboards services that work with vanilla javascript`,
  },

  {
    id: 29,
    title: "Add a leaderboard?",
    date: "2026-06-20",
    text: `can you add a leaderboard with dreamlo`,
  },

  {
    id: 30,
    title: "Debugging leaderboard",
    date: "2026-06-20",
    text: `i replaced those keys and still got an error "could not load leaderboard"`,
  },

  {
    id: 31,
    title: "Debugging leaderboard",
    date: "2026-06-20",
    text: `Could not load leaderboard: Unexpected token 'E', "ERROR:SSL "... is not valid JSON`,
  },

  {
    id: 32,
    title: "Decided to revert the leaderboard",
    date: "2026-06-20",
    text: `forget it, lets revert and remove the leaderboard for now`,
  },

  {
    id: 33,
    title: "Added exp pickup range",
    date: "2026-06-20",
    text: `Can you look and see how many upgrades we have available in the game, just for the record?
I would like to add in some upgrades which will increase the exp pickup range. Can you do that please`,
  },

  {
    id: 34,
    title: "Small UI tweaks",
    date: "2026-06-20",
    text: `can we change it from showing the px on the ui and make it maybe say something like "units"? also, the speed stats for projectiles, shows the f for float, can we remove that also?`,
  },

  {
    id: 35,
    title: "Brainstorm for more powerups",
    date: "2026-06-20",
    text: `Can you think of anymore fun powerups or new weapon types that would go well with the magic theme we have currently?`,
  },

  {
    id: 36,
    title: "Build out a few new powerups",
    date: "2026-06-20",
    text: `yes build all three of them please! i want chain lightning to either not be super powerful so it doesnt break the game, or it needs to be very rare... lets make it fairly weak and common, so the player can experience it early, but it takes a while to build up`,
  },

  {
    id: 37,
    title: "tweak chain lightning",
    date: "2026-06-20",
    text: `Can you slow down the chain lightning its waaaaaay too fast? also make its icon something lighting related. also, how about showing some arcing animation between targets?`,
  },

  {
    id: 38,
    title: "More tweaks to chain lightning",
    date: "2026-06-20",
    text: `Okay so the chain lighntning icon on the actual upgrade/pickup screen is a storm cloud, but the icon in game is the lightning bolt... lets make all the icons for the chain lightning into the storm cloud... but KEEP the projectile icon as the lightning bult emoji.
Also, lets make the chain lightning arc animation more visible, its very difficult to see it.`,
  },

  {
    id: 39,
    title: "Tweaking projectile animations",
    date: "2026-06-20",
    text: `i would really like it so that each weapon projectile has its own animation type. maybe magic missile does an arc above the players head and then homes in on the enemy. and some others for different projectiles`,
  },

  {
    id: 40,
    title: "More brainstorming",
    date: "2026-06-20",
    text: `Excellent! can we revisit some of the other powers and upgrades you suggested earlier?`,
  },

  {
    id: 41,
    title: "Adding Void Bolt + Arcane Echo + Overcharge",
    date: "2026-06-20",
    text: `sure Void Bolt + Arcane Echo + Overcharge sounds good`,
  },

  {
    id: 42,
    title: "Xp gem disappear time tweak",
    date: "2026-06-20",
    text: `XP gems should stay on the ground waaaaaaaay longer than they do currently. they seem to disappear after just a few seconds... but with the update to the projectiles, enemies die much further away and i cant always get to the xp before it disappears`,
  },

  {
    id: 43,
    title: "More Enemies",
    date: "2026-06-20",
    text: `Great! Lets make more enemy types and ramp up the danger some... enemies currently cant walk off ledges or jump or fly... lets change that... make it so the slimes can jump over blocks. and lets make a slow, flying enemy type`,
  },

  {
    id: 44,
    title: "Tweak enemy ai and projectiles",
    date: "2026-06-20",
    text: `One observation is that the slimes can jump UP in elevation, but when they reach the edge where it goes down, they just turn around... i would like them to go down to the next elevation level. 
Also, i think we should change the way projectiles behave a bit, with the new update to their arcing, i think their "range" is cut off and sometimes i cant even hit close enemies because the projectile arcs up and then comes down. lets fix that, and also try to priortize the closer enemies`,
  },

  {
    id: 45,
    title: "A new level",
    date: "2026-06-20",
    text: `Great! lets make a second level, themed a bit differently... whatever you think and make the game randomly choose between the levels`,
  },

  {
    id: 46,
    title: "Tweaked the height of the lava level",
    date: "2026-06-20",
    text: `like the other level, we need the terrain to start a little higher, lest it will be below the UI`,
  },

  {
    id: 47,
    title: "Added lava level tileset",
    date: "2026-06-20",
    text: `I added LavaTileSet.png to /src/assets folder, can you see if you can use that for the lava world's tileset`,
  },

  {
    id: 48,
    title: "Added grasslands tileset",
    date: "2026-06-20",
    text: `Looks good! ive added a folder /assets/Grasslands and there are assets there... can you analyze and see if you can use those assets for the grasslands level`,
  },

  {
    id: 49,
    title: "Tweak grasslands tileset",
    date: "2026-06-20",
    text: `the grasslands dont look quite right`,
  },

  {
    id: 50,
    title: "Difficulty scaling visual representation",
    date: "2026-06-20",
    text: `this is fine for now, but still a bit weird. lets move on to some features next. we have the timer at the top (which doesnt seem to scale with the UI scale setting, so lets fix that now), under or next to that timer, lets show a sort of "difficulty scale" visual slider or something - just so we can represent to the player how the difficulty is scaling.`,
  },

  {
    id: 51,
    title: "Level Select",
    date: "2026-06-20",
    text: `Great! next feature is upon clicking "new game" the player should be presented with an option to choose any available level, or click random.`,
  },

  {
    id: 52,
    title: "Revisiting the slime sprite bug, and adding ghost.png",
    date: "2026-06-20",
    text: `interesting, it seems like the slimes are still flickering but only on the grasslands map, is there something different about them on that map compared to the volcano map? 
Also, i added "Ghost.png" to the assets folder, can you analyze it and see if you can use it for the spectre enemy`,
  },

  {
    id: 53,
    title: "Troubleshooting sprites",
    date: "2026-06-20",
    text: `now the slime flickers in both maps. and the ghost i think has too many frames, as it seems to shrink to a different unrelated frame every so often. can you tell me the size dimensions and number of frames a spritesheet should be for it work with this system`,
  },

  {
    id: 54,
    title: "Changed sprites for ghost and slime",
    date: "2026-06-20",
    text: `okay lets try something else. can you analyze /assets/ghost_sprite_sheet.png and use it for the spectre. also i added a folder /assets/slime with a sprite sheet in it for walking "mini_slime_walk.png" ... can you analyze and see if you can use it for the slime?`,
  },

  {
    id: 55,
    title: "Addressed a slight issue with the ghost.",
    date: "2026-06-20",
    text: `This looks so much better, thanks! My only slight issue is that the ghosts have a square around them that flashes when they get hit or killed`,
  },

  {
    id: 56,
    title: "End Run button",
    date: "2026-06-20",
    text: `I would like a button on the pause menu to end the run`,
  },

  {
    id: 57,
    title: "Slime bug",
    date: "2026-06-20",
    text: `locally i see the new slime sprite, but when i deploy the code, i just see these instead of slimes`,
  },

  {
    id: 58,
    title: "Responding to a question",
    date: "2026-06-20",
    text: `not right now, no`,
  },

  {
    id: 59,
    title: "Add goblin spritesheet",
    date: "2026-06-20",
    text: `I have added a /goblin folder with a few spritesheets. can you analyze the goblin-scout.png file and use it for the goblin enemy?`,
  },

  {
    id: 60,
    title: "Fix goblin sprite issues",
    date: "2026-06-20",
    text: `the goblin frames arent lining up correctly. can we fix that please? also make the goblin a bit bigger as its very tiny`,
  },

  {
    id: 61,
    title: "Goblins can jump!",
    date: "2026-06-20",
    text: `This looks great! lets also make the goblin able to jump and even fall down off ledges`,
  },

  {
    id: 62,
    title: "Add boss mechanics",
    date: "2026-06-20",
    text: `I have added a dragonlord folder to the /assets folder. What i want is to make it so that at about the 10 minute mark, we should spawn a boss, that is the dragon lord, and it should have walking and attack animations (which are in the folder) and killing it should end the run with a clean victory screen which will show all of the weapons and upgrades you had, as well as how many enemies and the time, calculating a score and displaying it to the user as well

for now i only have one set of boss spritesheets, but in the future, i would like to be able to change the boss of each level to something different.`,
  },

  {
    id: 63,
    title: "Add music",
    date: "2026-06-20",
    text: `is it configurable how long the round lasts before the boss spawns? i would like to be able to configure that within the config.js file
also i added VolcanoLoop.mp3 and GrasslandLoop.mp3 to /assests/sounds and would like to use them as background music for the lava level and grassland levels respectively. 
While doing this, also add a music volume slider and mute toggle in the same way you did for the sounds toggle and sliders please, but they are separate from the sound effects one`,
  },

  {
    id: 64,
    title: "Boss bug",
    date: "2026-06-20",
    text: `when the boss spawns, it doesnt trigger any of my abillities and so i cant kill it`,
  },

  {
    id: 65,
    title: "More boss tweaks",
    date: "2026-06-20",
    text: `great, the boss should also be able to jump and fall off ledges`,
  },

  {
    id: 66,
    title: "Meta Progression ground work",
    date: "2026-06-21",
    text: `I would like to lay the groundwork for "meta progression" and turn this from a rogue LIKE game into a rogue LITE game. 

First, whenever the player wins or loses a run, they should be granted an amount of "meta currency" (you can come up with a fun name for it) that is based on a formula around - how many enemies they killed, how many seconds they survived, the amount of exp attained, and the powerups and weapons acquired through the run. 

The player should see the total amount of this meta currency on the title screen. Also the title screen "new game" button, should be renamed to "New Run" to fit with the roguelite style.

Now that the player can earn meta currency, which will allow them in the future to do unlocks and upgrades, we should think of a good way to save the player's progress.

Lets start with these things first.`,
  },

  {
    id: 67,
    title: "Starting to convert to rogueLite",
    date: "2026-06-21",
    text: `I would like to make it so that when the player clicks on "end run" from the pause menu, they are also awarded meta currency with the same calculation. 
also on the run end screen, it should have 2 options - "New Run" and "Main Menu" which should start a new run, or bring the player to the main menu, respectively`,
  },

  {
    id: 68,
    title: "Okay, lets work on the meta progression unlock shop",
    date: "2026-06-21",
    text: `Okay, lets work on the meta progression unlock shop. we should start with unlocks that focus on health  and attack power upgrades. 

I think it would also be fun if we had some of the magic attacks locked behind meta progression. Do you think we should lock out some of the existing ones or work on some brand new powers that can be added to the shop for unlocking?`,
  },

  {
    id: 69,
    title: "Actually before we move on to this, lets remove the ability...",
    date: "2026-06-21",
    text: `Actually before we move on to this, lets remove the ability to jump on enemies at all. this was part of the groundwork for the game before it came to be what it is now. No need to jump on enemies, or have any "stomp damage" or upgrades for it`,
  },

  {
    id: 70,
    title: "Great",
    date: "2026-06-21",
    text: `Great! I did notice though, that suddenly the player can chose from 3 weapons to start with. Lets actually reduce that down all the way to just one random starting weapon, and then have a permanent unlock for additional choices of starting weapons, up to a total of 3 choices of starting weapons`,
  },

  {
    id: 71,
    title: "Awesome",
    date: "2026-06-22",
    text: `Awesome! I would like to lock the volcano level behind meta progression - kind of a lot of progression, so that its not too quick to unlock... but shouldnt take hours and hours either. 

also, im not a huge fan of the layout of the shop, can you change it from one vertical column... there are going to be a lot of upgrades as we evolve this game and i dont want the user to have to scroll a huge list.`,
  },

  {
    id: 72,
    title: "First: if there is only 1 unlocked map, then the random...",
    date: "2026-06-22",
    text: `First: if there is only 1 unlocked map, then the random button shouldnt be visible or should be disabled. 
Second: The volcanic cavern level being locked isnt very clear on the level select screen and the "locked" text is pretty hard to read. Lets make locked levels either not visible on the level select screen, or make it more visually clear that they are locked. 
Maybe this means making the unlocked levels have a bit more flair on the level select screen.

Also, the shop redesign - how about we redesign it to use the little icon boxes and tool tips kind of like on the game's pause screen? Maybe not just a tiny square with the icon, but a rectangle with the icon and name, then the other info next to it. i want each upgrade line to be concise and not take up a TON of space, because there will be many many upgrades in the future`,
  },

  {
    id: 73,
    title: "On the level select screen, lets add a button to return to...",
    date: "2026-06-22",
    text: `On the level select screen, lets add a button to return to the menu.`,
  },

  {
    id: 74,
    title: "I feel like the shop should have some reprentation of the...",
    date: "2026-06-22",
    text: `I feel like the shop should have some reprentation of the different stats that are modifiable via the shop unlocks. So like for max health, on the shop maybe show the players current max health after any health unlocks, etc etc`,
  },

  {
    id: 75,
    title: "I would like to add unlocks which add a few different...",
    date: "2026-06-22",
    text: `I would like to add unlocks which add a few different things: 
starting rerolls: starting from 1 and incrementing up to 3
rerolls on level up as a standard unlock, just 1 per level once unlocked

can you think of some other fun or common meta progression unlocks to add?`,
  },
  {
    id: 76,
    title: "lets start by adding gem sense, bounty hunter, arcane...",
    date: "2026-06-22",
    text: `lets start by adding gem sense, bounty hunter, arcane attunement, and vital surge unlocks to the shop`,
  },

  {
    id: 77,
    title: "I would really like to redesign the shop to look more like...",
    date: "2026-06-22",
    text: `I would really like to redesign the shop to look more like this image here. can we rework it to fit our style but also more like this? https://thumbs.dreamstime.com/b/game-inventory-fantasy-rpg-interface-frame-elements-adventure-icons-weapon-armor-food-potions-stats-gold-vector-425962241.jpg`,
  },

  {
    id: 78,
    title: 'i think the prompt log should be reversed, so that it shows...',
    date: '2026-06-22',
    text: `i think the prompt log should be reversed, so that it shows the latest log first`,
  },

  {
    id: 79,
    title: 'Redesign the level select screen to be a modal like the...',
    date: '2026-06-22',
    text: `Redesign the level select screen to be a modal like the shop and pause menu screens, and also redesign the run end screen in the same way as well`,
  },

  {
    id: 80,
    title: 'Now also make the starting weapon selection use the same...',
    date: '2026-06-22',
    text: `Now also make the starting weapon selection use the same modal as well. Also, can you add a temporary shortcut key or button that will allow me to trigger the win condition, so i can see the win screen please`,
  },

  {
    id: 81,
    title: 'Okay awesome, please redesign the victory screen to use the...',
    date: '2026-06-22',
    text: `Okay awesome, please redesign the victory screen to use the modal as well`,
  },

  {
    id: 82,
    title: 'Okay i have a big one for you',
    date: '2026-06-22',
    text: `Okay i have a big one for you. 
First, lets make sure the victory screen displays the weapons and upgrades as icons with tooltips like the other screens do.
Second, add a way to "respec" meta progression. Maybe it costs some of that meta progression currency in order to do that, and costs more each time? What do you think about that?
Third, lets create another level - maybe this level is desert themed? maybe its difficulty is between the grasslands and volcano levels? we will add assets for it later on.`,
  },

  {
    id: 83,
    title: 'Redesign the title screen - make it fit more in line with...',
    date: '2026-06-22',
    text: `Redesign the title screen - make it fit more in line with the other menus - doesnt need to be a modal, but just make it fall in line with the other screens.
Ive noticed the respec system resets all the upgrades, but it should also give back the currency spent previously, minus the cost to respec. 
Also, create a hotkey that i can use to fully reset all progress of the game as well.
The desert level seems to generate with some pillars that i cant get over or go through, boxing me into a small area, lets not have that.`,
  },

  {
    id: 84,
    title: 'Great, the desert seems better but im seeing 2 issues still',
    date: '2026-06-22',
    text: `Great, the desert seems better but im seeing 2 issues still.
First, did you implement the shortcut for full resetting the data?
Also, the respec button says something like "Reset all. Fee: 3401" then i click it and it says "Confirm reset. Refund 0" - it doesnt consume the cost, nor does it ever refund anything. Also, if the player doesnt have enough currency to respec, then the button should be disabled`,
  },

  {
    id: 85,
    title: 'For the reset using ctrl+shift+delete, lets just make it...',
    date: '2026-06-22',
    text: `For the reset using ctrl+shift+delete, lets just make it delete the "gemfall-meta" out of local storage. that seems easier than what you initially set up`,
  },

  {
    id: 86,
    title: 'actually that combination brings up the delete browsing...',
    date: '2026-06-22',
    text: `actually that combination brings up the delete browsing history dialog in chrome, lets change the key combination`,
  },

  {
    id: 87,
    title: 'Also, instead of using a confirm dialog from javascript,...',
    date: '2026-06-22',
    text: `Also, instead of using a confirm dialog from javascript, can you make it pop up a small modal styled the same way as the other modals, asking for confirmation to delete progress`,
  },

  {
    id: 88,
    title: 'Okay I would like to redesign the title screen again with a...',
    date: '2026-06-22',
    text: `Okay I would like to redesign the title screen again with a few things in mind.
Keep it the same style as it is now
Move the "shards" count to maybe next to the shop button.
The "New Run" button should be above the shop and shards, and it should be decenlty bigger than them.
Instead of having the movement instructions where they are, create a button next to the new run button (after moving and changing the new run button), and this button could be an "information" type of "i" or a button that says "instructions" or something like that.
upon clicking the new button, a modal styled the same as the shop and all, should appear, showing any pertenant information about the game, its controls, shop, meta currency, etc.`,
  },

  {
    id: 89,
    title: 'Lets actually move the info button on the title screen down...',
    date: '2026-06-22',
    text: `Lets actually move the info button on the title screen down to the row with the shop and shards, and place it to the left of them.`,
  },
];