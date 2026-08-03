import type { GameplayParticlePool } from './particle-logic';
import type { EnemyWave } from './enemy-logic';
import { getEnemyDef } from '../../data/combat/enemy-codex';
import {
  PARTICLE_IMPACT_SPEED_THRESHOLD,
  PIERCE_HIT_COOLDOWN_MS,
  BASE_PARTICLE_DAMAGE,
  DAMAGE_PER_SPEED_UNIT,
} from '../../data/combat/combat-config';

/**
 * Energized, fast-moving particles pierce through any enemy they physically touch, dealing
 * damage and continuing on their path rather than being consumed. A per-particle, per-enemy
 * hit cooldown (and an impact-speed threshold) prevents a particle resting/orbiting against
 * an enemy from dealing damage every frame.
 */
export function resolveParticleEnemyCollisions(pool: GameplayParticlePool, wave: EnemyWave, nowMs: number): void {
  for (const p of pool.particles) {
    if (!p.isEnergized) continue;

    const speed = Math.hypot(p.vx, p.vy);
    if (speed < PARTICLE_IMPACT_SPEED_THRESHOLD) continue;

    for (const e of wave.enemies) {
      const dx = p.x - e.x;
      const dy = p.y - e.y;
      const dist = Math.hypot(dx, dy);
      const radius = getEnemyDef(e.defId).radius;
      if (dist > radius) continue;

      const lastHit = p.hitCooldowns.get(e.id) ?? 0;
      if (nowMs - lastHit < PIERCE_HIT_COOLDOWN_MS) continue;

      const damage = BASE_PARTICLE_DAMAGE + DAMAGE_PER_SPEED_UNIT * speed;
      e.health -= damage;
      p.damage = damage;
      p.hitCooldowns.set(e.id, nowMs);
    }
  }
}
