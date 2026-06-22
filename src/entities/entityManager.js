import { TILE_SIZE, CHUNK_WIDTH, BOSS_SPAWN_TIME } from '../config.js';
import { Enemy }      from './enemy.js';
import { Boss }       from './boss.js';
import { Gem }        from './gem.js';
import { Projectile } from '../weapons/projectile.js';
import { ENEMY_TYPES } from './enemyTypes.js';
import { getBossType }  from '../data/bossTypes.js';

const SPAWN_TABLES = {
  grasslands: [
    { key: 'slime',    weight: 5 },
    { key: 'goblin',   weight: 3 },
    { key: 'spikebot', weight: 1 },
    { key: 'bird',     weight: 2 },
  ],
  desert: [
    { key: 'goblin',   weight: 5 },
    { key: 'spikebot', weight: 3 },
    { key: 'specter',  weight: 3 },
    { key: 'slime',    weight: 1 },
  ],
  cavern: [
    { key: 'slime',    weight: 1 },
    { key: 'goblin',   weight: 2 },
    { key: 'spikebot', weight: 4 },
    { key: 'specter',  weight: 2 },
    { key: 'bat',      weight: 4 },
  ],
};

const CULL_CHUNK_RADIUS  = 12;
const SPAWN_CHUNK_RADIUS = 3;
const SAFE_CHUNK         = 0;

export class EntityManager {
  constructor(mapName = 'grasslands', seed = 0) {
    this.enemies     = [];
    this.gems        = [];
    this.projectiles = [];
    this.arcEffects  = [];
    this.clouds      = [];
    this.enemiesDefeated = 0;

    this.boss          = null;
    this._bossSpawned  = false;
    this._mapName      = mapName;
    this._endlessMode  = false;

    this._populatedChunks = new Set();
    this._globalSpeedMult = 1;
    this._crowdsActive    = false;
    this._eliteRateMult   = 1;  // multiplier on base 12% elite chance (Elite Surge challenge)
    this._hpBonusMult     = 1;  // extra HP multiplier for spawned enemies (Juggernaut challenge)
    this._seed = seed; // randomises enemy placement per session

    // Difficulty scaling (updated each frame from playTime)
    this._hpMult      = 1;
    this._dmgMult     = 1;
    this._spawnTimer  = 180;  // frames until first dynamic spawn (~3s)
    this._lastSwarmTime = -25; // first swarm arrives at 5 seconds (30 - 25)

    const table = SPAWN_TABLES[mapName] ?? SPAWN_TABLES.grasslands;
    this._spawnTable  = table;
    this._totalWeight = table.reduce((s, e) => s + e.weight, 0);
  }

  // ---- Speed debuff (Quagmire powerup) ----

  applySpeedDebuff(mult) {
    this._globalSpeedMult *= mult;
    for (const e of this.enemies) {
      e.speed = Math.max(0.15, e.speed * mult);
    }
  }

  // ---- Elite enemy creation ----

  _makeElite(enemy) {
    const TYPES    = ['blazing', 'glacial', 'overloaded'];
    const t        = TYPES[Math.floor(Math.random() * TYPES.length)];
    enemy.elite     = true;
    enemy.eliteType = t;
    enemy.gemValue  = Math.round(enemy.gemValue * 2.5);
    enemy.gemCount += 1;

    // Scale up the hitbox — shift y up so feet stay on the ground
    const SIZE_SCALE = 1.35;
    const origW = enemy.width;
    const origH = enemy.height;
    enemy.width  = Math.round(origW * SIZE_SCALE);
    enemy.height = Math.round(origH * SIZE_SCALE);
    enemy.y     -= (enemy.height - origH);

    // Scale the sprite draw if present
    if (enemy._sprite) {
      const origDrawnW  = enemy._drawnW;
      const origDrawnH  = enemy._drawnH;
      const footOffsetY = enemy._spriteOffY - (origH - origDrawnH);
      enemy._drawScale *= SIZE_SCALE;
      enemy._drawnW     = Math.round(origDrawnW * SIZE_SCALE);
      enemy._drawnH     = Math.round(origDrawnH * SIZE_SCALE);
      enemy._spriteOffX = Math.round(enemy.width / 2 - enemy._drawnW / 2);
      enemy._spriteOffY = enemy.height - enemy._drawnH + footOffsetY;
    }

    if (t === 'blazing') {
      enemy.maxHp  = Math.round(enemy.maxHp  * 1.5);
      enemy.hp     = enemy.maxHp;
      enemy.damage = Math.round(enemy.damage * 1.25);
    } else if (t === 'glacial') {
      enemy.maxHp  = Math.round(enemy.maxHp  * 1.3);
      enemy.hp     = enemy.maxHp;
      enemy.speed  = enemy.speed * 1.2;
    } else {
      enemy.maxHp  = Math.round(enemy.maxHp  * 1.4);
      enemy.hp     = enemy.maxHp;
      enemy.eliteShootTimer = 120;
    }
  }

  // ---- Add a raw projectile def from a weapon fire ----

  addProjectile(def) {
    this.projectiles.push(new Projectile(def));
  }

  // ---- Seeded random (seed changes each session) ----

  _rand(x) {
    const n = Math.sin((x + this._seed * 31337) * 127.1 + 311.7) * 43758.5453;
    return n - Math.floor(n);
  }

  _pickTypeDef(seed) {
    let r = this._rand(seed) * this._totalWeight;
    for (const entry of this._spawnTable) {
      r -= entry.weight;
      if (r < 0) return ENEMY_TYPES[entry.key];
    }
    return ENEMY_TYPES[this._spawnTable[0].key];
  }

  // ---- Chunk population ----

  _populateChunk(chunkX, world) {
    if (this._populatedChunks.has(chunkX) || chunkX === SAFE_CHUNK) return;
    this._populatedChunks.add(chunkX);

    const count = 1 + Math.floor(this._rand(chunkX * 17 + 5) * 3);
    for (let i = 0; i < count; i++) {
      const seed    = chunkX * 97 + i * 31;
      const lx      = 1 + Math.floor(this._rand(seed) * (CHUNK_WIDTH - 2));
      const tileX   = chunkX * CHUNK_WIDTH + lx;
      const groundY = world.generator.getGroundY(tileX);

      const typeDef = this._pickTypeDef(seed + 13);
      const enemy   = new Enemy(
        tileX * TILE_SIZE - typeDef.width / 2,
        (groundY - 1) * TILE_SIZE - typeDef.height,
        typeDef
      );
      enemy.maxHp  = Math.round(enemy.maxHp  * this._hpMult * this._hpBonusMult);
      enemy.hp     = enemy.maxHp;
      enemy.damage = Math.max(1, Math.round(enemy.damage * this._dmgMult));
      enemy.speed  = Math.max(0.15, enemy.speed * this._globalSpeedMult);
      this.enemies.push(enemy);
      if (this._rand(seed + 77) < Math.min(0.8, 0.12 * this._eliteRateMult)) this._makeElite(enemy);
    }
  }

  // ---- Player ↔ enemy collision ----

  _resolvePlayerEnemy(player, enemy) {
    if (enemy.dead || player.isInvincible) return;

    const overlap =
      player.x < enemy.x + enemy.width  &&
      player.x + player.width  > enemy.x &&
      player.y < enemy.y + enemy.height &&
      player.y + player.height > enemy.y;

    if (!overlap) return;

    player.takeDamage(enemy.damage);
    if (enemy.elite && enemy.eliteType === 'glacial') {
      player._slowFrames = 150;
      player._slowMult   = 0.4;
    }
    const dir = (player.x + player.width / 2) < (enemy.x + enemy.width / 2) ? -1 : 1;
    player.vx = dir * 6;
    player.vy = -4;
  }

  // ---- Difficulty scaling ----

  _scaleDifficulty(playTime) {
    const wave = Math.floor(playTime / 20);          // new wave every 20 seconds
    this._hpMult  = 1 + wave * 0.22;                // +22% HP per wave
    this._dmgMult = 1 + wave * 0.15;                // +15% damage per wave
    const interval   = Math.max(50, 240 - wave * 20); // 4s → ~0.8s floor
    const spawnCount = Math.min(3, 1 + Math.floor(wave / 5)); // +1 enemy/spawn per 5 waves, cap 3
    return { interval, spawnCount };
  }

  _dynamicSpawn(world, player, count = 1) {
    for (let i = 0; i < count; i++) {
      const typeDef = this._pickTypeDef(Math.floor(Math.random() * 99991));
      const side    = Math.random() < 0.5 ? -1 : 1;
      const dist    = 680 + Math.random() * 220;
      const tileX   = Math.round((player.x + side * dist) / TILE_SIZE);
      const groundY = world.generator.getGroundY(tileX);

      const enemy   = new Enemy(
        tileX * TILE_SIZE - typeDef.width / 2,
        (groundY - 1) * TILE_SIZE - typeDef.height,
        typeDef
      );
      enemy.maxHp  = Math.round(enemy.maxHp  * this._hpMult * this._hpBonusMult);
      enemy.hp     = enemy.maxHp;
      enemy.damage = Math.max(1, Math.round(enemy.damage * this._dmgMult));
      enemy.speed  = Math.max(0.15, enemy.speed * this._globalSpeedMult);
      this.enemies.push(enemy);
      if (Math.random() < Math.min(0.8, 0.12 * this._eliteRateMult)) this._makeElite(enemy);
    }
  }

  _spawnBatSwarm(world, player) {
    const batDef    = ENEMY_TYPES.bat;
    const swarmSize = 5 + Math.floor(Math.random() * 6);   // 5–10 bats
    const side      = Math.random() < 0.5 ? -1 : 1;        // which side they spawn on
    const swarmDir  = -side;                                // they fly toward + past the player
    const baseX     = player.x + side * (820 + Math.random() * 160);
    const baseTileX = Math.round(baseX / TILE_SIZE);
    const groundY   = world.generator.getGroundY(baseTileX);
    // Spawn 4–6 tiles above ground so they are clearly airborne
    const baseY     = (groundY - (4 + Math.floor(Math.random() * 3))) * TILE_SIZE;

    // Tight formation: 3-column grid with 13–18px spacing
    const COLS = 3;
    for (let i = 0; i < swarmSize; i++) {
      const col = i % COLS;
      const row = Math.floor(i / COLS);
      const ex  = baseX + (col - 1) * (13 + Math.random() * 5);   // ±13–18px horizontal
      const ey  = baseY + row * (12 + Math.random() * 6);          // 12–18px vertical stagger
      const enemy = new Enemy(ex, ey, batDef);
      // Swarm bats: 75% HP, 1.6× speed, no elite chance
      enemy.maxHp  = Math.max(1, Math.round(batDef.hp * this._hpMult * 0.75));
      enemy.hp     = enemy.maxHp;
      enemy.damage = Math.max(1, Math.round(batDef.damage * this._dmgMult));
      enemy.speed  = batDef.speed * 1.6 * this._globalSpeedMult;
      enemy._inSwarm  = true;
      enemy._swarmDir = swarmDir;
      this.enemies.push(enemy);
    }
  }

  // ---- Update ----

  _spawnBoss(world, player) {
    const typeDef = getBossType(this._mapName);
    const tileX   = Math.round((player.x + 700) / TILE_SIZE);
    const groundY = world.generator.getGroundY(tileX);
    this.boss = new Boss(
      tileX * TILE_SIZE - typeDef.hitboxW / 2,
      (groundY - 1) * TILE_SIZE - typeDef.hitboxH,
      typeDef,
    );
  }

  update(world, player, playTime = 0) {
    // Boss spawn at 10 minutes; suppressed in endless mode
    if (!this._bossSpawned && !this._endlessMode && playTime >= BOSS_SPAWN_TIME) {
      this._bossSpawned = true;
      this._spawnBoss(world, player);
    }

    // Update difficulty multipliers and drive dynamic spawn timer (pause during boss)
    if (playTime > 0 && !this.boss) {
      const { interval, spawnCount } = this._scaleDifficulty(playTime);
      this._spawnTimer--;
      if (this._spawnTimer <= 0) {
        const effCount = this._crowdsActive ? spawnCount + 1 : spawnCount;
        this._dynamicSpawn(world, player, effCount);
        this._spawnTimer = this._crowdsActive ? Math.max(30, Math.round(interval * 0.55)) : interval;
      }

      // Dedicated bat swarm every 30 seconds in cavern
      if (this._mapName === 'cavern' && playTime - this._lastSwarmTime >= 30) {
        this._lastSwarmTime = playTime;
        this._spawnBatSwarm(world, player);
      }
    }

    const playerChunk = Math.floor(player.x / (TILE_SIZE * CHUNK_WIDTH));
    for (let cx = playerChunk - SPAWN_CHUNK_RADIUS; cx <= playerChunk + SPAWN_CHUNK_RADIUS; cx++) {
      this._populateChunk(cx, world);
    }

    // Boss update + projectile collision
    if (this.boss && !this.boss._deathDone) {
      this.boss.update(world, player);

      // Player contact damage (when not in invincibility frames)
      if (!player.isInvincible) {
        const bossOverlap =
          player.x < this.boss.x + this.boss.width  &&
          player.x + player.width  > this.boss.x    &&
          player.y < this.boss.y + this.boss.height  &&
          player.y + player.height > this.boss.y;
        if (bossOverlap) {
          player.takeDamage(this.boss.attackDamage);
          const dir = (player.x + player.width / 2) < (this.boss.x + this.boss.width / 2) ? -1 : 1;
          player.vx = dir * 7;
          player.vy = -5;
        }
      }

    }

    for (const e of this.enemies) {
      if (e.dead) continue;
      e.update(world, player);
      this._resolvePlayerEnemy(player, e);
      // Overloaded elite: periodic shock pulse if player is nearby
      if (e.elite && e.eliteType === 'overloaded') {
        if (--e.eliteShootTimer <= 0) {
          e.eliteShootTimer = 120;
          const dx = (player.x + player.width / 2) - (e.x + e.width / 2);
          const dy = (player.y + player.height / 2) - (e.y + e.height / 2);
          if (Math.hypot(dx, dy) < 170 && !player.isInvincible) {
            player.takeDamage(Math.max(1, e.damage));
            player.vx = (dx > 0 ? 1 : -1) * 7;
            player.vy = -4;
          }
        }
      }
    }

    // Drop gems from freshly killed enemies
    for (const e of this.enemies) {
      if (e.dead && !e._dropsSpawned) {
        e._dropsSpawned = true;
        this.enemiesDefeated++;

        // Blazing elite: death explosion damages player if nearby
        if (e.elite && e.eliteType === 'blazing') {
          const dx = (player.x + player.width / 2) - (e.x + e.width / 2);
          const dy = (player.y + player.height / 2) - (e.y + e.height / 2);
          if (Math.hypot(dx, dy) < 130 && !player.isInvincible) {
            player.takeDamage(3);
            player.vx = (dx > 0 ? 1 : -1) * 5;
            player.vy = -3;
          }
        }

        // Blood Price lifesteal
        if (player.lifestealKills > 0) {
          player._lifestealCounter++;
          if (player._lifestealCounter >= player.lifestealKills) {
            player._lifestealCounter = 0;
            player.heal(1);
          }
        }

        const drops = e.getDrops();
        for (const drop of drops) {
          this.gems.push(new Gem(drop.x, drop.y, drop.value));
        }
        // Soul Harvest: bonus gem per kill
        if (player.bonusGemDrops > 0 && drops.length > 0) {
          const ref = drops[0];
          for (let b = 0; b < player.bonusGemDrops; b++) {
            this.gems.push(new Gem(
              ref.x + (Math.random() - 0.5) * 20,
              ref.y,
              Math.round(ref.value * 0.5),
            ));
          }
        }
      }
    }

    for (const g of this.gems) g.update(world, player);

    // Build target list — boss is included so homing, chain, and hit all work against it
    const _allTargets = (this.boss && !this.boss._deathDone)
      ? [...this.enemies, this.boss]
      : this.enemies;

    // Update projectiles; collect chain spawns, arc effects, and poison clouds
    const _newProj = [];
    for (const p of this.projectiles) {
      p.update(_allTargets, world);
      if (p.pendingChains.length > 0) {
        for (const def of p.pendingChains) _newProj.push(new Projectile(def));
        p.pendingChains.length = 0;
      }
      if (p.pendingArcs.length > 0) {
        for (const arc of p.pendingArcs) this.arcEffects.push({ ...arc, life: 24, maxLife: 24 });
        p.pendingArcs.length = 0;
      }
      if (p.pendingCloud) {
        this.clouds.push(p.pendingCloud);
        p.pendingCloud = null;
      }
    }
    for (const p of _newProj) this.projectiles.push(p);

    // Update poison clouds
    for (const c of this.clouds) {
      c._tick++;
      c.life--;
      if (c._tick >= c.tickRate) {
        c._tick = 0;
        for (const e of _allTargets) {
          if (e.dead) continue;
          if (Math.hypot((e.x + e.width / 2) - c.x, (e.y + e.height / 2) - c.y) < c.radius + e.width / 2) {
            e.takeDamage(c.damage);
          }
        }
      }
    }
    this.clouds = this.clouds.filter(c => c.life > 0);

    // Decay arc effects
    this.arcEffects = this.arcEffects.filter(a => --a.life > 0);

    // Cull dead entities
    this.enemies     = this.enemies.filter(e => !(e.dead && e._dropsSpawned));
    this.gems        = this.gems.filter(g => !g.dead);
    this.projectiles = this.projectiles.filter(p => !p.dead);

    // Cull enemies far from player
    const cullDist = CULL_CHUNK_RADIUS * CHUNK_WIDTH * TILE_SIZE;
    this.enemies = this.enemies.filter(e => Math.abs(e.x - player.x) < cullDist);
  }

  // ---- Draw ----

  draw(ctx, camera) {
    for (const c of this.clouds)      this._drawCloud(ctx, camera, c);
    for (const g of this.gems)        g.draw(ctx, camera);
    for (const p of this.projectiles) p.draw(ctx, camera);
    this._drawArcs(ctx, camera);
    for (const e of this.enemies)     e.draw(ctx, camera);
    if (this.boss) this.boss.draw(ctx, camera);
  }

  _drawCloud(ctx, camera, c) {
    const alpha = (c.life / c.maxLife) * 0.55;
    const cx = Math.round(c.x - camera.x);
    const cy = Math.round(c.y - camera.y);
    const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, c.radius);
    grd.addColorStop(0,   `rgba(80, 200, 20, ${alpha})`);
    grd.addColorStop(0.6, `rgba(40, 160, 10, ${alpha * 0.6})`);
    grd.addColorStop(1,   'rgba(0, 100, 0, 0)');
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(cx, cy, c.radius, 0, Math.PI * 2);
    ctx.fill();
  }

  _drawArcs(ctx, camera) {
    if (this.arcEffects.length === 0) return;
    ctx.save();
    for (const arc of this.arcEffects) {
      const alpha = arc.life / arc.maxLife;
      const x1 = Math.round(arc.x1 - camera.x);
      const y1 = Math.round(arc.y1 - camera.y);
      const x2 = Math.round(arc.x2 - camera.x);
      const y2 = Math.round(arc.y2 - camera.y);
      const dx  = x2 - x1;
      const dy  = y2 - y1;
      const len = Math.hypot(dx, dy) || 1;
      const nx  = -dy / len;
      const ny  =  dx / len;
      const jitter = Math.min(len * 0.45, 28);

      // Pre-compute zigzag points so both passes share the same shape
      const pts = [[x1, y1]];
      for (let i = 1; i < 8; i++) {
        const t = i / 8;
        pts.push([
          x1 + dx * t + nx * (Math.random() - 0.5) * jitter * 2,
          y1 + dy * t + ny * (Math.random() - 0.5) * jitter * 2,
        ]);
      }
      pts.push([x2, y2]);

      // Pass 1 — thick outer glow
      ctx.globalAlpha = alpha * 0.55;
      ctx.strokeStyle = '#44aaff';
      ctx.lineWidth   = 6;
      ctx.shadowColor = '#00aaff';
      ctx.shadowBlur  = 20;
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
      ctx.stroke();

      // Pass 2 — thin bright core
      ctx.globalAlpha = alpha * 0.95;
      ctx.strokeStyle = '#ddf6ff';
      ctx.lineWidth   = 1.5;
      ctx.shadowColor = '#aaeeff';
      ctx.shadowBlur  = 10;
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
      ctx.stroke();
    }
    ctx.restore();
  }
}
