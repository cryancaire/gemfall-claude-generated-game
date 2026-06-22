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
    { key: 'specter',  weight: 2 },
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
    { key: 'specter',  weight: 4 },
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
    this.enemiesDefeated = 0;

    this.boss          = null;
    this._bossSpawned  = false;
    this._mapName      = mapName;

    this._populatedChunks = new Set();
    this._globalSpeedMult = 1;
    this._seed = seed; // randomises enemy placement per session

    // Difficulty scaling (updated each frame from playTime)
    this._hpMult      = 1;
    this._dmgMult     = 1;
    this._spawnTimer  = 180;  // frames until first dynamic spawn (~3s)

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
      enemy.maxHp  = Math.round(enemy.maxHp  * this._hpMult);
      enemy.hp     = enemy.maxHp;
      enemy.damage = Math.max(1, Math.round(enemy.damage * this._dmgMult));
      enemy.speed  = Math.max(0.15, enemy.speed * this._globalSpeedMult);
      this.enemies.push(enemy);
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
      const side    = Math.random() < 0.5 ? -1 : 1;
      const dist    = 680 + Math.random() * 220;
      const tileX   = Math.round((player.x + side * dist) / TILE_SIZE);
      const groundY = world.generator.getGroundY(tileX);

      const typeDef = this._pickTypeDef(Math.floor(Math.random() * 99991));
      const enemy   = new Enemy(
        tileX * TILE_SIZE - typeDef.width / 2,
        (groundY - 1) * TILE_SIZE - typeDef.height,
        typeDef
      );
      enemy.maxHp  = Math.round(enemy.maxHp  * this._hpMult);
      enemy.hp     = enemy.maxHp;
      enemy.damage = Math.max(1, Math.round(enemy.damage * this._dmgMult));
      enemy.speed  = Math.max(0.15, enemy.speed * this._globalSpeedMult);
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
    // Boss spawn at 10 minutes; suppress dynamic spawns during boss fight
    if (!this._bossSpawned && playTime >= BOSS_SPAWN_TIME) {
      this._bossSpawned = true;
      this._spawnBoss(world, player);
    }

    // Update difficulty multipliers and drive dynamic spawn timer (pause during boss)
    if (playTime > 0 && !this.boss) {
      const { interval, spawnCount } = this._scaleDifficulty(playTime);
      this._spawnTimer--;
      if (this._spawnTimer <= 0) {
        this._dynamicSpawn(world, player, spawnCount);
        this._spawnTimer = interval;
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
    }

    // Drop gems from freshly killed enemies
    for (const e of this.enemies) {
      if (e.dead && !e._dropsSpawned) {
        e._dropsSpawned = true;
        this.enemiesDefeated++;

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

    // Update projectiles; collect chain spawns and arc effects
    const _newProj = [];
    for (const p of this.projectiles) {
      p.update(_allTargets);
      if (p.pendingChains.length > 0) {
        for (const def of p.pendingChains) _newProj.push(new Projectile(def));
        p.pendingChains.length = 0;
      }
      if (p.pendingArcs.length > 0) {
        for (const arc of p.pendingArcs) this.arcEffects.push({ ...arc, life: 24, maxLife: 24 });
        p.pendingArcs.length = 0;
      }
    }
    for (const p of _newProj) this.projectiles.push(p);

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
    for (const g of this.gems)        g.draw(ctx, camera);
    for (const p of this.projectiles) p.draw(ctx, camera);
    this._drawArcs(ctx, camera);
    for (const e of this.enemies)     e.draw(ctx, camera);
    if (this.boss) this.boss.draw(ctx, camera);
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
