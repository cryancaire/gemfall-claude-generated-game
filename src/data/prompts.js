// Every user prompt that shaped this game, in chronological order.
// Add a new entry here each time a major feature prompt is fulfilled.
export const PROMPTS = [
  {
    id: 1,
    title: 'Initial Game Setup',
    date: '2026-06-19',
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
    title: 'Enemies, XP Gems & Player Stats',
    date: '2026-06-19',
    text: `i would like to, next, add a few enemies to the game.
they should, like the player, be built in a way that we can add sprite sheets in later. they should have configurable values for their health and the amount of damage they do to the player on contact, as well as if the player can damage/kill them by jumping on top of them. enemies should drop experience gems that the player can pick up and level up when gaining an amount that varies with the player's level.
the player should get configurable properties for health, damage, speed, number of jumps - so that in a future iteration, the we can design/develop weapons for the player which will make them damage the enemies.`,
  },

  {
    id: 3,
    title: 'Prompt History Modal',
    date: '2026-06-19',
    text: `i would like to add a UI button which opens a model which can show a list of all the prompts used to build this game. lets start by adding all of the previous prompts to a file and use that file for the modal`,
  },

  {
    id: 4,
    title: 'Death, Title Screen, Level-Up Cards & Gem Fixes',
    date: '2026-06-19',
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
];
