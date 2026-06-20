import { TILE_SIZE, CHUNK_WIDTH } from '../config.js';
import { Enemy }      from './enemy.js';
import { Gem }        from './gem.js';
import { Projectile } from '../weapons/projectile.js';
import { ENEMY_TYPES } from './enemyTypes.js';

const SPAWN_TABLES = {
  grasslands: [
    { key: 'slime',    weight: 5 },
    { key: 'goblin',   weight: 3 },
    { key: 'spikebot', weight: 1 },
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
    this.enemiesDefeated = 0;

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

    // Stomp: player falling AND feet land in the top 55 % of enemy
    const isStomp = player.vy > 1 &&
      (player.y + player.height) < (enemy.y + enemy.height * 0.55);

    if (isStomp && enemy.stompKillable) {
      enemy.takeDamage(player.damage * (enemy.stompDamage || 1));
      player.vy = -9;
    } else {
      // Side/bottom contact OR failed stomp on non-stompable — deal normal damage
      player.takeDamage(enemy.damage);
      const dir = (player.x + player.width / 2) < (enemy.x + enemy.width / 2) ? -1 : 1;
      player.vx = dir * 6;
      player.vy = -4;
    }
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

  update(world, player, playTime = 0) {
    // Update difficulty multipliers and drive dynamic spawn timer
    if (playTime > 0) {
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
        for (const drop of e.getDrops()) {
          this.gems.push(new Gem(drop.x, drop.y, drop.value));
        }
      }
    }

    for (const g of this.gems) g.update(world, player);

    // Update projectiles (they self-check enemy collisions)
    for (const p of this.projectiles) p.update(this.enemies);

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
    for (const e of this.enemies)     e.draw(ctx, camera);
  }
}
