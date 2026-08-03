import type { Attractor, AttractorKind, GameplayParticle } from './types';
import type { GameplayParticlePool } from './particle-logic';
import { applyForceToParticle, spawnPooledParticle } from './particle-logic';
import {
  REPULSOR_CONFIG,
  VORTEX_CONFIG,
  REPULSOR_FORCE,
  VORTEX_PULL_FORCE,
  VORTEX_CAPTURE_RADIUS,
  VORTEX_MAX_CHARGE,
  VORTEX_CHARGE_DURATION_MS,
  VORTEX_RELEASE_SPEED,
  VORTEX_COOLDOWN_MS,
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
  const config = kind === 'repulsor' ? REPULSOR_CONFIG : VORTEX_CONFIG;
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
  };
  field.attractors.push(attractor);
  return attractor;
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
): void {
  for (const attractor of field.attractors) {
    switch (attractor.kind) {
      case 'repulsor':
        applyRepulsorForce(attractor, pool.particles);
        break;
      case 'vortex_cannon':
        applyVortexForce(attractor, pool, nowMs);
        break;
    }
  }
}

function applyRepulsorForce(attractor: Attractor, particles: GameplayParticle[]): void {
  const radius = attractor.config.radius;
  const radius2 = radius * radius;
  for (const p of particles) {
    const dx = p.x - attractor.x;
    const dy = p.y - attractor.y;
    const dist2 = dx * dx + dy * dy;
    if (dist2 > radius2 || dist2 < 0.01) continue;
    const dist = Math.sqrt(dist2);
    const falloff = 1 - dist / radius;
    const fx = (dx / dist) * REPULSOR_FORCE * falloff;
    const fy = (dy / dist) * REPULSOR_FORCE * falloff;
    applyForceToParticle(p, fx, fy, 'repulsed', attractor.config.effectColor, attractor.id);
  }
}

function applyVortexForce(attractor: Attractor, pool: GameplayParticlePool, nowMs: number): void {
  const radius = attractor.config.radius;
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

    if (dist <= VORTEX_CAPTURE_RADIUS && attractor.chargeCount < VORTEX_MAX_CHARGE) {
      p.isActive = false;
      attractor.chargeCount++;
      if (!attractor.isCharging) {
        attractor.isCharging = true;
        attractor.chargeStartMs = nowMs;
      }
      continue;
    }

    const falloff = 1 - dist / radius;
    const fx = (dx / dist) * VORTEX_PULL_FORCE * falloff;
    const fy = (dy / dist) * VORTEX_PULL_FORCE * falloff;
    applyForceToParticle(p, fx, fy, 'vortex_charging', attractor.config.effectColor, attractor.id);
  }

  if (attractor.isCharging) {
    const chargeElapsed = nowMs - attractor.chargeStartMs;
    if (chargeElapsed >= VORTEX_CHARGE_DURATION_MS || attractor.chargeCount >= VORTEX_MAX_CHARGE) {
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
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.3;
    const p = spawnPooledParticle(
      pool,
      attractor.x,
      attractor.y,
      Math.cos(angle) * VORTEX_RELEASE_SPEED,
      Math.sin(angle) * VORTEX_RELEASE_SPEED,
    );
    if (!p) continue;
    applyForceToParticle(p, 0, 0, 'vortex_released', attractor.config.effectColor, attractor.id);
  }
}
