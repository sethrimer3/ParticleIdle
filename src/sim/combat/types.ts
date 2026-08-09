import type { AttractorConfig } from '../../data/combat/combat-config';

export type AttractorKind = 'repulsor' | 'vortex_cannon' | 'orbit';
export type ParticleEffectType = 'none' | 'repulsed' | 'vortex_charging' | 'vortex_released' | 'orbit';

/** A gameplay-capable particle. Simulation state only — rendering reads it but never mutates it. */
export interface GameplayParticle {
  isActive: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** Current net force/acceleration applied this frame (for damage scaling & telemetry). */
  ax: number;
  ay: number;
  /** True while under the influence of (or was recently released by) an attractor and able to damage enemies. */
  isEnergized: boolean;
  damage: number;
  lastAttractorId: number | null;
  effectType: ParticleEffectType;
  effectColor: string;
  effectIntensity: number;
  /** Recent trail positions, newest first. */
  trail: { x: number; y: number }[];
  effectRemainingMs: number;
  /** Particles pierce enemies rather than being consumed on hit; this tracks per-enemy hit
   * timestamps so the same enemy can't be re-damaged by the same particle every frame. */
  hitCooldowns: Map<number, number>;
}

/**
 * A live enemy in the sim. Visual identity and base stats are NOT duplicated here —
 * they're looked up from the enemy codex by `defId`. Only per-instance mutable state
 * (position, remaining health) and the current effective stat scale live on the instance.
 */
export interface Enemy {
  isActive: boolean;
  id: number;
  defId: string;
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  /** Multiplier applied to the codex base speed/reward for this instance (zone-loop scaling). */
  statScale: number;
}

export interface Attractor {
  id: number;
  kind: AttractorKind;
  config: AttractorConfig;
  x: number;
  y: number;
  /** Vortex-only: particles currently captured/stored, charge cycle timing. */
  chargeCount: number;
  chargeStartMs: number;
  cooldownUntilMs: number;
  isCharging: boolean;

  /** Tower upgrade progression (see data/combat/tower-defs.ts). */
  towerId: string;
  upgradeIndex: number;
  level: number;

  /** Generic influence radius (repulsor push range / vortex pull range). Upgradeable. */
  radius: number;

  // Repulsor
  pushForce: number;
  burstModeEnabled: boolean;
  lastBurstMs: number;

  // Vortex cannon
  pullForce: number;
  chargeDurationMs: number;
  maxChargeCount: number;
  releaseSpeed: number;
  releaseSpread: number;
  overchargeEnabled: boolean;

  // Orbit ring
  orbitRadius: number;
  orbitSpeedMultiplier: number;
  centripetalMultiplier: number;
  dualRingEnabled: boolean;
}
