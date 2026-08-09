import type { GameplayParticle } from './types';
import {
  MAX_GAMEPLAY_PARTICLES,
  AMBIENT_PARTICLE_BASE_SPEED,
  AMBIENT_PARTICLE_DOWNDRIFT,
  PARTICLE_DRAG,
  PARTICLE_DEFAULT_COLOR,
  PARTICLE_TRAIL_LENGTH,
  PARTICLE_EFFECT_DECAY_MS,
} from '../../data/combat/combat-config';

function createBlankParticle(): GameplayParticle {
  return {
    isActive: false,
    x: 0, y: 0, vx: 0, vy: 0, ax: 0, ay: 0,
    isEnergized: false,
    damage: 0,
    lastAttractorId: null,
    effectType: 'none',
    effectColor: PARTICLE_DEFAULT_COLOR,
    effectIntensity: 0,
    trail: [],
    effectRemainingMs: 0,
    hitCooldowns: new Map(),
  };
}

export interface GameplayParticlePool {
  particles: GameplayParticle[];
  readonly _pool: GameplayParticle[];
}

export function createParticlePool(): GameplayParticlePool {
  return { particles: [], _pool: [] };
}

/** Acquires a particle from the pool's free list (or allocates one) and activates it at (x, y). */
export function spawnPooledParticle(pool: GameplayParticlePool, x: number, y: number, vx: number, vy: number): GameplayParticle | null {
  if (pool.particles.length >= MAX_GAMEPLAY_PARTICLES) return null;
  const p = pool._pool.pop() ?? createBlankParticle();
  p.isActive = true;
  p.x = x;
  p.y = y;
  p.vx = vx;
  p.vy = vy;
  p.ax = 0;
  p.ay = 0;
  p.isEnergized = false;
  p.damage = 0;
  p.lastAttractorId = null;
  p.effectType = 'none';
  p.effectColor = PARTICLE_DEFAULT_COLOR;
  p.effectIntensity = 0;
  p.trail.length = 0;
  p.effectRemainingMs = 0;
  p.hitCooldowns.clear();
  pool.particles.push(p);
  return p;
}

export function spawnAmbientParticle(pool: GameplayParticlePool, fieldWidth: number): void {
  const angle = Math.random() * Math.PI * 2;
  spawnPooledParticle(
    pool,
    Math.random() * fieldWidth,
    0,
    Math.cos(angle) * AMBIENT_PARTICLE_BASE_SPEED,
    Math.sin(angle) * AMBIENT_PARTICLE_BASE_SPEED,
  );
}

function releaseParticle(pool: GameplayParticlePool, index: number): void {
  const p = pool.particles[index];
  p.isActive = false;
  pool._pool.push(p);
  pool.particles[index] = pool.particles[pool.particles.length - 1];
  pool.particles.pop();
}

/** Integrates motion, decays effect state/trails, bounces off field edges, and prunes dead particles. */
export function updateGameplayParticles(
  pool: GameplayParticlePool,
  deltaMs: number,
  fieldWidth: number,
  fieldHeight: number,
): void {
  const dtSec = deltaMs / 1000;
  for (let i = pool.particles.length - 1; i >= 0; i--) {
    const p = pool.particles[i];

    // Ambient (non-energized) particles get a steady downward drift so they flow through
    // the field toward the target, like the enemies, instead of wandering at random.
    if (!p.isEnergized) {
      p.ay += AMBIENT_PARTICLE_DOWNDRIFT;
    }

    p.vx += p.ax * dtSec;
    p.vy += p.ay * dtSec;
    // Only energized particles (mid-effect) settle via drag; ambient particles drift freely
    // so they keep circulating through the field for attractors to catch.
    if (p.isEnergized) {
      const dragFactor = Math.pow(PARTICLE_DRAG, deltaMs / (1000 / 60));
      p.vx *= dragFactor;
      p.vy *= dragFactor;
    }
    p.x += p.vx * dtSec;
    p.y += p.vy * dtSec;

    if (p.x < 0) { p.x = 0; p.vx *= -0.6; }
    if (p.x > fieldWidth) { p.x = fieldWidth; p.vx *= -0.6; }
    if (p.y < 0) { p.y = 0; p.vy *= -0.6; }

    if (p.y > fieldHeight) {
      if (p.isEnergized) {
        p.y = fieldHeight;
        p.vy *= -0.6;
      } else {
        // Recycle ambient particles back to the top so the field keeps a steady flow.
        p.y = 0;
        p.x = Math.random() * fieldWidth;
        p.vy = Math.abs(p.vy) * 0.3;
      }
    }

    if (p.effectType !== 'none') {
      p.trail.unshift({ x: p.x, y: p.y });
      if (p.trail.length > PARTICLE_TRAIL_LENGTH) p.trail.pop();
      p.effectRemainingMs -= deltaMs;
      if (p.effectRemainingMs <= 0) {
        p.effectType = 'none';
        p.isEnergized = false;
        p.effectIntensity = 0;
      } else {
        p.effectIntensity = Math.max(0, p.effectRemainingMs / PARTICLE_EFFECT_DECAY_MS);
      }
    } else if (p.trail.length > 0) {
      p.trail.pop();
    }

    p.ax = 0;
    p.ay = 0;

    if (!p.isActive) releaseParticle(pool, i);
  }
}

export function applyForceToParticle(
  p: GameplayParticle,
  fx: number,
  fy: number,
  effectType: GameplayParticle['effectType'],
  effectColor: string,
  attractorId: number,
): void {
  p.ax += fx;
  p.ay += fy;
  p.isEnergized = true;
  p.lastAttractorId = attractorId;
  p.effectType = effectType;
  p.effectColor = effectColor;
  p.effectIntensity = 1;
  p.effectRemainingMs = PARTICLE_EFFECT_DECAY_MS;
}
