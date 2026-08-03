import type { GameplayParticlePool } from './particle-logic';
import type { EnemyWave } from './enemy-logic';
import { getEnemyDef } from '../../data/combat/enemy-codex';
import {
  PARTICLE_IMPACT_SPEED_THRESHOLD,
  PARTICLE_HIT_COOLDOWN_MS,
  PARTICLE_BASE_DAMAGE,
  PARTICLE_VELOCITY_DAMAGE_SCALE,
  PARTICLE_CONSUMED_ON_HIT,
} from '../../data/combat/combat-config';

/**
 * Energized, fast-moving particles damage any enemy they physically touch.
 * A per-particle hit cooldown and impact-speed threshold prevent a particle
 * resting against an enemy from dealing damage every frame.
 */
export function resolveParticleEnemyCollisions(pool: GameplayParticlePool, wave: EnemyWave): void {
  for (const p of pool.particles) {
    if (!p.isEnergized || p.hitCooldownMs > 0) continue;

    const speed = Math.hypot(p.vx, p.vy);
    if (speed < PARTICLE_IMPACT_SPEED_THRESHOLD) continue;

    for (const e of wave.enemies) {
      const dx = p.x - e.x;
      const dy = p.y - e.y;
      const dist = Math.hypot(dx, dy);
      const radius = getEnemyDef(e.defId).radius;
      if (dist > radius) continue;

      const overSpeed = Math.max(0, speed - PARTICLE_IMPACT_SPEED_THRESHOLD);
      const damage = PARTICLE_BASE_DAMAGE + overSpeed * PARTICLE_VELOCITY_DAMAGE_SCALE;
      e.health -= damage;
      p.damage = damage;
      p.hitCooldownMs = PARTICLE_HIT_COOLDOWN_MS;

      if (PARTICLE_CONSUMED_ON_HIT) {
        p.isActive = false;
      }
      break;
    }
  }
}
