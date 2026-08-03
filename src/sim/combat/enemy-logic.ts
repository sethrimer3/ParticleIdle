import type { Enemy } from './types';
import { MAX_ENEMIES, ENEMY_SPAWN_EDGE_MARGIN } from '../../data/combat/combat-config';
import { getEnemyDef } from '../../data/combat/enemy-codex';

export interface EnemyWave {
  enemies: Enemy[];
  nextId: number;
}

export function createEnemyWave(): EnemyWave {
  return { enemies: [], nextId: 1 };
}

/**
 * Spawns one enemy of the given codex `defId` near the top or side edges of the field
 * (biased toward the upper band), with stats scaled by `statScale` (zone-loop difficulty).
 */
export function spawnEnemy(
  wave: EnemyWave,
  defId: string,
  fieldWidth: number,
  fieldHeight: number,
  statScale = 1,
): void {
  if (wave.enemies.length >= MAX_ENEMIES) return;

  const def = getEnemyDef(defId);

  let x: number;
  let y: number;
  const edge = Math.random();
  if (edge < 0.6) {
    // Top edge
    x = ENEMY_SPAWN_EDGE_MARGIN + Math.random() * (fieldWidth - ENEMY_SPAWN_EDGE_MARGIN * 2);
    y = ENEMY_SPAWN_EDGE_MARGIN;
  } else if (edge < 0.8) {
    // Left edge
    x = ENEMY_SPAWN_EDGE_MARGIN;
    y = ENEMY_SPAWN_EDGE_MARGIN + Math.random() * (fieldHeight * 0.5);
  } else {
    // Right edge
    x = fieldWidth - ENEMY_SPAWN_EDGE_MARGIN;
    y = ENEMY_SPAWN_EDGE_MARGIN + Math.random() * (fieldHeight * 0.5);
  }

  const maxHealth = def.baseHealth * statScale;

  wave.enemies.push({
    isActive: true,
    id: wave.nextId++,
    defId,
    x,
    y,
    health: maxHealth,
    maxHealth,
    statScale,
  });
}

export interface EnemyTickResult {
  killedCount: number;
  killedReward: number;
  escapedCount: number;
  /** defIds of enemies killed this tick, for codex-discovery bookkeeping upstream. */
  killedDefIds: string[];
}

/** Moves enemies toward the target, removes dead/escaped ones, and reports outcomes. */
export function updateEnemies(
  wave: EnemyWave,
  deltaMs: number,
  targetX: number,
  targetY: number,
  targetRadius: number,
): EnemyTickResult {
  const dtSec = deltaMs / 1000;
  let killedCount = 0;
  let killedReward = 0;
  let escapedCount = 0;
  const killedDefIds: string[] = [];

  for (let i = wave.enemies.length - 1; i >= 0; i--) {
    const e = wave.enemies[i];
    const def = getEnemyDef(e.defId);

    if (e.health <= 0) {
      killedCount++;
      killedReward += def.rewardValue * e.statScale;
      killedDefIds.push(e.defId);
      wave.enemies.splice(i, 1);
      continue;
    }

    const dx = targetX - e.x;
    const dy = targetY - e.y;
    const dist = Math.hypot(dx, dy);

    if (dist <= targetRadius + def.radius) {
      escapedCount++;
      wave.enemies.splice(i, 1);
      continue;
    }

    const speed = def.baseSpeed * e.statScale;
    const invDist = 1 / (dist || 1);
    e.x += dx * invDist * speed * dtSec;
    e.y += dy * invDist * speed * dtSec;
  }

  return { killedCount, killedReward, escapedCount, killedDefIds };
}
