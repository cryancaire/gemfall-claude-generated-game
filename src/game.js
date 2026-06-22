import { TILE_SIZE, CHUNK_WIDTH } from './config.js';
import { MetaProgress } from './metaProgress.js';
import { SFX, Music } from './audio.js';
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
import { MapSelectScreen, getAvailableMapIds } from './ui/mapSelectScreen.js';
import { VictoryScreen }      from './ui/victoryScreen.js';
import { RunSummaryScreen }   from './ui/runSummaryScreen.js';
import { ShopScreen }             from './ui/shopScreen.js';
import { ModifierSelectScreen }  from './ui/modifierSelectScreen.js';

const STATE = { TITLE: 'title', SHOP: 'shop', MAP_SELECT: 'map_select', MODIFIER_SELECT: 'modifier_select', WEAPON_SELECT: 'weapon_select', PLAYING: 'playing', LEVEL_UP: 'level_up', GAME_OVER: 'game_over', PAUSED: 'paused', VICTORY: 'victory', END_RUN: 'end_run' };

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

    this._state              = STATE.TITLE;
    this._prevLevel          = 1;
    this._running            = false;
    this._playTime           = 0;   // seconds elapsed while in PLAYING state
    this._modifierShardBonus = 0;

    // UI screens
    this._titleScreen          = new TitleScreen(() => this._startGame(), () => this._openShop());
    this._shopScreen           = new ShopScreen(() => this._setState(STATE.TITLE));
    this._mapSelectScreen      = new MapSelectScreen(mapName => this._onMapSelected(mapName), () => this._setState(STATE.TITLE));
    this._modifierSelectScreen = new ModifierSelectScreen(mod => this._onModifierSelected(mod));
    this._weaponSelectScreen = new WeaponSelectScreen(p => this._onWeaponSelected(p));
    this._levelUpScreen     = new LevelUpScreen(p => this._applyPowerup(p));
    this._gameOverScreen    = new GameOverScreen(() => this._setState(STATE.TITLE));
    this._victoryScreen     = new VictoryScreen(() => this._endRun());
    this._runSummaryScreen  = new RunSummaryScreen(
      () => this._endRunThenNew(),
      () => this._endRun(),
    );
    this._pauseScreen       = new PauseScreen(
      () => this._setState(STATE.PLAYING),
      () => this._onEndRun(),
    );

    // Size canvas to match the CSS-laid-out canvas-wrap element.
    // Use ResizeObserver so we react to frame reflows, not just window resize.
    const canvasWrap = document.getElementById('game-canvas-wrap');
    this._resizeObserver = new ResizeObserver(() => this._handleResize());
    this._resizeObserver.observe(canvasWrap);
    requestAnimationFrame(() => this._handleResize()); // initial size after first layout

    // DEBUG: F8 wipes all meta-progress
    const _confirmOverlay = document.getElementById('confirm-overlay');
    document.getElementById('confirm-ok-btn').addEventListener('click', () => {
      localStorage.removeItem('gemfall-meta');
      window.location.reload();
    });
    document.getElementById('confirm-cancel-btn').addEventListener('click', () => {
      _confirmOverlay.classList.remove('confirm-visible');
    });
    window.addEventListener('keydown', e => {
      if (e.key === 'F8') _confirmOverlay.classList.add('confirm-visible');
      if (e.key === 'Escape' && _confirmOverlay.classList.contains('confirm-visible')) {
        _confirmOverlay.classList.remove('confirm-visible');
      }
    });

    // Show title on load
    this._setState(STATE.TITLE);
  }

  // ---- State management ----

  _setState(state) {
    this._state = state;
    this._titleScreen.setVisible(state             === STATE.TITLE);
    this._shopScreen.setVisible(state              === STATE.SHOP);
    this._mapSelectScreen.setVisible(state         === STATE.MAP_SELECT);
    this._modifierSelectScreen.setVisible(state    === STATE.MODIFIER_SELECT);
    this._weaponSelectScreen.setVisible(state      === STATE.WEAPON_SELECT);
    this._levelUpScreen.setVisible(state      === STATE.LEVEL_UP);
    this._gameOverScreen.setVisible(state     === STATE.GAME_OVER);
    this._victoryScreen.setVisible(state      === STATE.VICTORY);
    this._runSummaryScreen.setVisible(state   === STATE.END_RUN);
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

  _openShop() {
    this._shopScreen.show();
    this._setState(STATE.SHOP);
  }

  _onEndRun() {
    Music.stop();
    this._runSummaryScreen.show(this.player, this.entities, this._playTime, this._modifierShardBonus);
    this._setState(STATE.END_RUN);
  }

  _endRun() {
    Music.stop();
    this.world    = null;
    this.entities = null;
    this.player   = null;
    this._setState(STATE.TITLE);
  }

  _endRunThenNew() {
    this.world    = null;
    this.entities = null;
    this.player   = null;
    this._startGame();   // opens map select for a fresh run
  }

  _startGame() {
    this._mapSelectScreen.show();
    this._setState(STATE.MAP_SELECT);
  }

  _onMapSelected(mapName) {
    const seed    = Math.floor(Math.random() * 999983);
    const avail   = getAvailableMapIds();
    const chosen  = mapName ?? avail[Math.floor(Math.random() * avail.length)];
    this.world    = new WorldMap(chosen, seed);
    this.entities = new EntityManager(chosen, seed);

    const spawnTileX = 4;
    const groundY    = this.world.generator.getGroundY(spawnTileX);
    this.player = new Player(spawnTileX * TILE_SIZE, (groundY - 4) * TILE_SIZE);
    this._prevLevel = 1;

    this._modifierSelectScreen.show();
    this._setState(STATE.MODIFIER_SELECT);
  }

  _onModifierSelected(modifier) {
    this._modifierShardBonus = 0;
    if (modifier !== null) {
      modifier.apply(this.player, this.entities);
      this._modifierShardBonus = modifier.shardBonus;
    }
    this._weaponSelectScreen.show();
    this._setState(STATE.WEAPON_SELECT);
  }

  _onWeaponSelected(powerup) {
    powerup.apply(this.player, this.entities);
    this._playTime = 0;
    Music.playForMap(this.world.mapName);
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

    // DEBUG: F9 instantly triggers victory
    if (this._state === STATE.PLAYING && this.input.wasPressed('f9')) {
      Music.stop();
      this._victoryScreen.show(this.player, this.entities, this._playTime, this._modifierShardBonus);
      this._setState(STATE.VICTORY);
      return;
    }

    if (this._state !== STATE.PLAYING) return;

    this._playTime += 1 / 60;

    this.player.update(this.input, this.world);

    // All equipped weapons auto-fire — include boss in targets so all weapon types can hit it
    const _boss = this.entities.boss;
    const _targets = (_boss && !_boss.dead)
      ? [...this.entities.enemies, _boss]
      : this.entities.enemies;

    for (const weapon of this.player.weapons) {
      const defs = weapon.tryAutoFire(this.player, _targets);
      for (const def of defs) {
        // Overcharge: bonus spell damage while at full HP
        if (this.player.overchargeBonus > 0 && this.player.hp >= this.player.maxHp) {
          def.damage = Math.round(def.damage * (1 + this.player.overchargeBonus));
        }
        // Glass Cannon: flat spell damage bonus
        if (this.player.spellDamageBonus > 0) {
          def.damage = Math.round(def.damage * (1 + this.player.spellDamageBonus));
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
      Music.stop();
      this._gameOverScreen.show(this.player, this.entities, this._playTime, this._modifierShardBonus);
      this._setState(STATE.GAME_OVER);
      return;
    }

    // Boss defeated → victory
    if (this.entities.boss?.dead) {
      Music.stop();
      this._victoryScreen.show(this.player, this.entities, this._playTime, this._modifierShardBonus);
      this._setState(STATE.VICTORY);
      return;
    }

    // Level-up detection — compare against the level before this session's last level-up
    if (this.player.level > this._prevLevel) {
      SFX.powerUp();
      if (MetaProgress.isUnlocked('reroll_on_levelup')) this.player.rerolls++;
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
    this.renderer.clear(this.world?.mapName ?? 'grasslands');

    if (this.world) {
      this.renderer.drawParallax(this.camera, this.world.mapName);
      this.renderer.drawWorld(this.world, this.camera);
    }
    if (this._state !== STATE.TITLE && this.player) {
      this.entities.draw(ctx, this.camera);
      this.renderer.drawPlayer(this.player, this.camera);
      this.renderer.drawHUD(this.player, this._playTime);
      if (this.entities.boss && !this.entities.boss.dead) {
        this.renderer.drawBossHUD(this.entities.boss);
      }
    }
  }

  // ---- Resize ----

  _handleResize() {
    const w = this.canvas.offsetWidth;
    const h = this.canvas.offsetHeight;
    if (!w || !h) return;
    this.canvas.width  = w;
    this.canvas.height = h;
    this.camera.width  = w;
    this.camera.height = h;
    this.renderer._skyKey = null;
  }
}
