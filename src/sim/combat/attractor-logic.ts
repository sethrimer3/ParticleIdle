import type { Attractor, AttractorKind, GameplayParticle } from './types';
import type { GameplayParticlePool } from './particle-logic';
import { applyForceToParticle, spawnPooledParticle } from './particle-logic';
import {
  getAttractorConfig,
  REPULSOR_FORCE,
  REPULSOR_BURST_INTERVAL_MS,
  REPULSOR_BURST_DURATION_MS,
  REPULSOR_BURST_MULTIPLIER,
  VORTEX_PULL_FORCE,
  VORTEX_CAPTURE_RADIUS,
  VORTEX_MAX_CHARGE,
  VORTEX_CHARGE_DURATION_MS,
  VORTEX_RELEASE_SPEED,
  VORTEX_RELEASE_SPREAD_BASE,
  VORTEX_COOLDOWN_MS,
  ORBIT_DEFAULT_RADIUS,
  ORBIT_CAPTURE_BAND,
  ORBIT_CENTRIPETAL_STRENGTH,
  ORBIT_TANGENT_BLEND,
  ORBIT_MIN_SPEED,
  MAX_ATTRACTORS,
} from '../../data/combat/combat-config';

export interface AttractorField {
  attractors: Attractor[];
  nextId: number;
}

export function createAttractorField(): AttractorField {
  return { attractors: [], nextId: 1 };
}

export function placeAttractor(field: AttractorField, kind: AttractorKind, x: number, y: number, nowMs: number): Attractor | null {
  if (field.attractors.length >= MAX_ATTRACTORS) return null;
  const config = getAttractorConfig(kind);
  const attractor: Attractor = {
    id: field.nextId++,
    kind,
    config,
    x,
    y,
    chargeCount: 0,
    chargeStartMs: nowMs,
    cooldownUntilMs: 0,
    isCharging: false,

    towerId: kind,
    upgradeIndex: 0,
    level: 1,

    radius: config.radius,

    pushForce: REPULSOR_FORCE,
    burstModeEnabled: false,
    lastBurstMs: nowMs,

    pullForce: VORTEX_PULL_FORCE,
    chargeDurationMs: VORTEX_CHARGE_DURATION_MS,
    maxChargeCount: VORTEX_MAX_CHARGE,
    releaseSpeed: VORTEX_RELEASE_SPEED,
    releaseSpread: VORTEX_RELEASE_SPREAD_BASE,
    overchargeEnabled: false,

    orbitRadius: ORBIT_DEFAULT_RADIUS,
    orbitSpeedMultiplier: 1,
    centripetalMultiplier: 1,
    dualRingEnabled: false,
  };
  field.attractors.push(attractor);
  return attractor;
}

/** Returns the placed attractor whose center is within `hitRadius` of (x, y), if any. */
export function findAttractorAt(field: AttractorField, x: number, y: number, hitRadius = 12): Attractor | null {
  for (const attractor of field.attractors) {
    if (Math.hypot(attractor.x - x, attractor.y - y) <= hitRadius) return attractor;
  }
  return null;
}

/**
 * Applies each attractor's force field to nearby particles, and advances vortex
 * charge/release cycles. This is the extension point for future attractor kinds:
 * add a case to the switch and a config block in combat-config.ts.
 */
export function applyAttractorForces(
  field: AttractorField,
  pool: GameplayParticlePool,
  nowMs: number,
  deltaMs: number,
): void {
  for (const attractor of field.attractors) {
    switch (attractor.kind) {
      case 'repulsor':
        applyRepulsorForce(attractor, pool.particles, nowMs);
        break;
      case 'vortex_cannon':
        applyVortexForce(attractor, pool, nowMs);
        break;
      case 'orbit':
        applyOrbitForce(attractor, pool.particles, deltaMs);
        break;
    }
  }
}

function applyRepulsorForce(attractor: Attractor, particles: GameplayParticle[], nowMs: number): void {
  let force = attractor.pushForce;
  if (attractor.burstModeEnabled) {
    if (nowMs - attractor.lastBurstMs >= REPULSOR_BURST_INTERVAL_MS) {
      attractor.lastBurstMs = nowMs;
    }
    if (nowMs - attractor.lastBurstMs < REPULSOR_BURST_DURATION_MS) {
      force *= REPULSOR_BURST_MULTIPLIER;
    }
  }

  const radius = attractor.radius;
  const radius2 = radius * radius;
  for (const p of particles) {
    const dx = p.x - attractor.x;
    const dy = p.y - attractor.y;
    const dist2 = dx * dx + dy * dy;
    if (dist2 > radius2 || dist2 < 0.01) continue;
    const dist = Math.sqrt(dist2);
    const falloff = 1 - dist / radius;
    const fx = (dx / dist) * force * falloff;
    const fy = (dy / dist) * force * falloff;
    applyForceToParticle(p, fx, fy, 'repulsed', attractor.config.effectColor, attractor.id);
  }
}

function applyVortexForce(attractor: Attractor, pool: GameplayParticlePool, nowMs: number): void {
  const radius = attractor.radius;
  const radius2 = radius * radius;

  if (nowMs < attractor.cooldownUntilMs) return;

  // Pull nearby particles inward; capture ones that reach the center (works while
  // charging too, so particles can keep feeding the vortex mid-charge).
  for (const p of pool.particles) {
    const dx = attractor.x - p.x;
    const dy = attractor.y - p.y;
    const dist2 = dx * dx + dy * dy;
    if (dist2 > radius2) continue;
    const dist = Math.sqrt(dist2) || 1;

    if (dist <= VORTEX_CAPTURE_RADIUS && attractor.chargeCount < attractor.maxChargeCount) {
      p.isActive = false;
      attractor.chargeCount++;
      if (!attractor.isCharging) {
        attractor.isCharging = true;
        attractor.chargeStartMs = nowMs;
      }
      continue;
    }

    const falloff = 1 - dist / radius;
    const fx = (dx / dist) * attractor.pullForce * falloff;
    const fy = (dy / dist) * attractor.pullForce * falloff;
    applyForceToParticle(p, fx, fy, 'vortex_charging', attractor.config.effectColor, attractor.id);
  }

  if (attractor.isCharging) {
    const chargeElapsed = nowMs - attractor.chargeStartMs;
    if (chargeElapsed >= attractor.chargeDurationMs || attractor.chargeCount >= attractor.maxChargeCount) {
      releaseVortex(attractor, pool, nowMs);
    }
  }
}

function releaseVortex(attractor: Attractor, pool: GameplayParticlePool, nowMs: number): void {
  const count = attractor.chargeCount;
  attractor.chargeCount = 0;
  attractor.isCharging = false;
  attractor.cooldownUntilMs = nowMs + VORTEX_COOLDOWN_MS;
  if (count <= 0) return;

  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + Math.random() * attractor.releaseSpread;
    const p = spawnPooledParticle(
      pool,
      attractor.x,
      attractor.y,
      Math.cos(angle) * attractor.releaseSpeed,
      Math.sin(angle) * attractor.releaseSpeed,
    );
    if (!p) continue;
    applyForceToParticle(p, 0, 0, 'vortex_released', attractor.config.effectColor, attractor.id);
  }
}

/**
 * Pulls nearby particles into a stable circular orbit: a centripetal correction pushes them
 * toward the ring radius, and their velocity is blended toward the tangent direction each tick
 * so they spin around the attractor rather than just oscillating radially.
 */
function applyOrbitForce(attractor: Attractor, particles: GameplayParticle[], deltaMs: number): void {
  const ringRadii = attractor.dualRingEnabled
    ? [attractor.orbitRadius, attractor.orbitRadius * 1.6]
    : [attractor.orbitRadius];
  const dtFactor = Math.max(0, Math.min(1, ORBIT_TANGENT_BLEND * (deltaMs / (1000 / 60))));

  for (const p of particles) {
    const dx = p.x - attractor.x;
    const dy = p.y - attractor.y;
    const dist = Math.hypot(dx, dy) || 0.01;

    let ringRadius: number | null = null;
    let bestDiff = ORBIT_CAPTURE_BAND;
    for (const r of ringRadii) {
      const diff = Math.abs(dist - r);
      if (diff <= bestDiff) {
        bestDiff = diff;
        ringRadius = r;
      }
    }
    if (ringRadius === null) continue;

    const nx = dx / dist;
    const ny = dy / dist;
    const tx = -ny;
    const ty = nx;

    // Centripetal correction: pull the particle back toward the ring radius.
    const radialError = dist - ringRadius;
    const centripetal = -radialError * ORBIT_CENTRIPETAL_STRENGTH * attractor.centripetalMultiplier;
    const fx = nx * centripetal;
    const fy = ny * centripetal;
    applyForceToParticle(p, fx, fy, 'orbit', attractor.config.effectColor, attractor.id);

    // Rotate velocity toward the tangent direction so the particle spins around the ring.
    const speed = Math.max(Math.hypot(p.vx, p.vy), ORBIT_MIN_SPEED);
    const targetVx = tx * speed * attractor.orbitSpeedMultiplier;
    const targetVy = ty * speed * attractor.orbitSpeedMultiplier;
    p.vx += (targetVx - p.vx) * dtFactor;
    p.vy += (targetVy - p.vy) * dtFactor;
  }
}
