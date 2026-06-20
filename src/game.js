import { TILE_SIZE, CHUNK_WIDTH } from './config.js';
import { SFX } from './audio.js';
import { Input }         from './input.js';
import { Camera }        from './camera.js';
import { Player }        from './player.js';
import { WorldMap }      from './world/worldMap.js';
import { Renderer }      from './renderer.js';
import { EntityManager } from './entities/entityManager.js';
import { TitleScreen }   from './ui/titleScreen.js';
import { LevelUpScreen } from './ui/levelUpScreen.js';
import { GameOverScreen } from './ui/gameOverScreen.js';
import { PauseScreen }        from './ui/pauseScreen.js';
import { WeaponSelectScreen } from './ui/weaponSelectScreen.js';

const STATE = { TITLE: 'title', WEAPON_SELECT: 'weapon_select', PLAYING: 'playing', LEVEL_UP: 'level_up', GAME_OVER: 'game_over', PAUSED: 'paused' };

export class Game {
  constructor(canvas) {
    this.canvas   = canvas;
    this.input    = new Input();
    this.camera   = new Camera(canvas.width, canvas.height);
    this.renderer = new Renderer(canvas);

    // Null until a game starts
    this.world    = null;
    this.entities = null;
    this.player   = null;

    this._state     = STATE.TITLE;
    this._prevLevel = 1;
    this._running   = false;
    this._playTime  = 0;   // seconds elapsed while in PLAYING state

    // UI screens
    this._titleScreen       = new TitleScreen(() => this._startGame());
    this._weaponSelectScreen = new WeaponSelectScreen(p => this._onWeaponSelected(p));
    this._levelUpScreen     = new LevelUpScreen(p => this._applyPowerup(p));
    this._gameOverScreen    = new GameOverScreen(() => this._setState(STATE.TITLE));
    this._pauseScreen       = new PauseScreen(() => this._setState(STATE.PLAYING));

    this._handleResize();
    window.addEventListener('resize', () => this._handleResize());

    // Show title on load
    this._setState(STATE.TITLE);
  }

  // ---- State management ----

  _setState(state) {
    this._state = state;
    this._titleScreen.setVisible(state        === STATE.TITLE);
    this._weaponSelectScreen.setVisible(state === STATE.WEAPON_SELECT);
    this._levelUpScreen.setVisible(state      === STATE.LEVEL_UP);
    this._gameOverScreen.setVisible(state     === STATE.GAME_OVER);
    this._pauseScreen.setVisible(state        === STATE.PAUSED);

    const showPauseBtn = state === STATE.PLAYING || state === STATE.PAUSED;
    document.getElementById('pause-btn').classList.toggle('hidden', !showPauseBtn);

    if (state === STATE.PLAYING) {
      this.canvas.focus();
    }
  }

  togglePause() {
    if (this._state === STATE.PLAYING) {
      this._pauseScreen.show(this.player);
      this._setState(STATE.PAUSED);
    } else if (this._state === STATE.PAUSED) {
      this._setState(STATE.PLAYING);
    }
  }

  _startGame() {
    // Random seed so terrain and enemy placement differ each run
    const seed = Math.floor(Math.random() * 999983); // large prime-ish range
    this.world    = new WorldMap('grasslands', seed);
    this.entities = new EntityManager('grasslands', seed);

    const spawnTileX = 4;
    const groundY    = this.world.generator.getGroundY(spawnTileX);
    this.player = new Player(spawnTileX * TILE_SIZE, (groundY - 4) * TILE_SIZE);
    this._prevLevel = 1;

    this._weaponSelectScreen.show();
    this._setState(STATE.WEAPON_SELECT);
  }

  _onWeaponSelected(powerup) {
    powerup.apply(this.player, this.entities);
    this._playTime = 0;
    this._setState(STATE.PLAYING);
  }

  _applyPowerup(powerup) {
    if (powerup === null) {
      // Player skipped — award one reroll for next level-up
      this.player.rerolls++;
      this._prevLevel = this.player.level;
      this._setState(STATE.PLAYING);
      return;
    }

    powerup.apply(this.player, this.entities);

    // Non-weapon cards go to the acquired-upgrades side panel
    if (!powerup.isWeaponCard) {
      this.player.addAcquiredUpgrade(powerup);
    }

    this._prevLevel = this.player.level;
    this._setState(STATE.PLAYING);
  }

  // ---- Loop ----

  start() {
    this._running = true;
    requestAnimationFrame(t => this._loop(t));
  }

  _loop(timestamp) {
    if (!this._running) return;
    this._update();
    this._render();
    this.input.flush();
    requestAnimationFrame(t => this._loop(t));
  }

  // ---- Update ----

  _update() {
    // ESC toggles pause from either playing or paused state
    if ((this._state === STATE.PLAYING || this._state === STATE.PAUSED) && this.input.wasPressed('escape')) {
      this.togglePause();
      return;
    }

    if (this._state !== STATE.PLAYING) return;

    this._playTime += 1 / 60;

    this.player.update(this.input, this.world);

    // All equipped weapons auto-fire toward nearby enemies
    for (const weapon of this.player.weapons) {
      const defs = weapon.tryAutoFire(this.player, this.entities.enemies);
      for (const def of defs) {
        // Overcharge: bonus spell damage while at full HP
        if (this.player.overchargeBonus > 0 && this.player.hp >= this.player.maxHp) {
          def.damage = Math.round(def.damage * (1 + this.player.overchargeBonus));
        }
        this.entities.addProjectile(def);
        // Arcane Echo: chance to fire a free copy (doesn't count against weapon cap)
        if (this.player.echoChance > 0 && Math.random() < this.player.echoChance) {
          this.entities.addProjectile({
            ...def,
            weaponRef: null,
            x: def.x + (Math.random() - 0.5) * 10,
            y: def.y + (Math.random() - 0.5) * 10,
          });
        }
      }
    }

    this.entities.update(this.world, this.player, this._playTime);
    this.camera.follow(this.player);

    // Player death
    if (this.player.isDead) {
      this._gameOverScreen.show(this.player, this.entities);
      this._setState(STATE.GAME_OVER);
      return;
    }

    // Level-up detection — compare against the level before this session's last level-up
    if (this.player.level > this._prevLevel) {
      SFX.powerUp();
      this._levelUpScreen.show(this.player);
      this._setState(STATE.LEVEL_UP);
      // _prevLevel is updated in _applyPowerup so the next frame won't re-trigger
      return;
    }

    const playerChunkX = this.world.pixelToChunkX(this.player.x);
    this.world.unloadDistantChunks(playerChunkX);
  }

  // ---- Render ----

  _render() {
    const { ctx } = this.renderer;
    this.renderer.clear();

    if (this.world) {
      this.renderer.drawWorld(this.world, this.camera);
    }
    if (this._state !== STATE.TITLE && this.player) {
      this.entities.draw(ctx, this.camera);
      this.renderer.drawPlayer(this.player, this.camera);
      this.renderer.drawHUD(this.player, this._playTime);
    }
  }

  // ---- Resize ----

  _handleResize() {
    this.canvas.width   = window.innerWidth;
    this.canvas.height  = window.innerHeight;
    this.camera.width   = this.canvas.width;
    this.camera.height  = this.canvas.height;
    this.renderer._skyGrad = null;
  }
}
