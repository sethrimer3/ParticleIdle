/**
 * Tunable balance constants for the Defense gameplay tab.
 * No magic numbers should live outside this file for combat systems.
 */

// ─── Field / target ───────────────────────────────────────────────

/** Target ("core") sits at bottom-center of the field, this many px above the bottom edge. */
export const TARGET_OFFSET_FROM_BOTTOM = 24;
export const TARGET_RADIUS = 14;
export const STARTING_LIVES = 5;

// ─── Enemy spawning & movement ─────────────────────────────────────
// Per-wave spawn rate and enemy composition come from zone-definitions.ts;
// per-enemy stats (health/speed/radius/reward/color) come from enemy-codex.ts.

export const MAX_ENEMIES = 24;
/** Fraction of the field width/height inset used for the upper/edge spawn band. */
export const ENEMY_SPAWN_EDGE_MARGIN = 10;

// ─── Enemy codex discovery persistence ──────────────────────────────

export const ENEMY_CODEX_DISCOVERED_STORAGE_KEY = 'particleidle.enemyCodex.discovered';

// ─── Ambient gameplay particles ─────────────────────────────────────

export const MAX_GAMEPLAY_PARTICLES = 140;
export const AMBIENT_PARTICLE_SPAWN_INTERVAL_MS = 220;
export const AMBIENT_PARTICLE_BASE_SPEED = 14;
/** Gentle constant downward drift so ambient particles flow through the field (toward the
 * target, like the enemies) instead of relying on random walk to reach an attractor. */
export const AMBIENT_PARTICLE_DOWNDRIFT = 10;
export const PARTICLE_DRAG = 0.98;
export const PARTICLE_DEFAULT_COLOR = '#7fd3ff';
export const PARTICLE_TRAIL_LENGTH = 6;
export const PARTICLE_EFFECT_DECAY_MS = 900;

// ─── Collision / damage ─────────────────────────────────────────────

/** Minimum speed (px/s) an energized particle must have to deal damage on contact. */
export const PARTICLE_IMPACT_SPEED_THRESHOLD = 18;
/** Particles pierce enemies (never consumed on hit). Minimum time between two hits from the
 * SAME particle on the SAME enemy, so a particle resting/orbiting against an enemy can't melt
 * it in one frame — tracked per-particle, per-enemy (see GameplayParticle.hitCooldowns). */
export const PIERCE_HIT_COOLDOWN_MS = 400;
/** damage = BASE_PARTICLE_DAMAGE + DAMAGE_PER_SPEED_UNIT * particleSpeed. Rewards speed upgrades. */
export const BASE_PARTICLE_DAMAGE = 2;
export const DAMAGE_PER_SPEED_UNIT = 0.4;

// ─── Attractors (shared) ─────────────────────────────────────────────

export const MAX_ATTRACTORS = 12;

export interface AttractorConfig {
  readonly id: 'repulsor' | 'vortex_cannon' | 'orbit';
  readonly label: string;
  readonly icon: string;
  readonly cost: number;
  readonly radius: number;
  readonly color: string;
  readonly effectColor: string;
}

// ─── Repulsor ────────────────────────────────────────────────────────

export const REPULSOR_CONFIG: AttractorConfig = {
  id: 'repulsor',
  label: 'Repulsor',
  icon: '⊘',
  cost: 0,
  radius: 34,
  color: '#ff6b6b',
  effectColor: '#ff9a6b',
};
export const REPULSOR_FORCE = 260;

// ─── Vortex Cannon ───────────────────────────────────────────────────

export const VORTEX_CONFIG: AttractorConfig = {
  id: 'vortex_cannon',
  label: 'Vortex Cannon',
  icon: '◎',
  cost: 0,
  radius: 40,
  color: '#a06bff',
  effectColor: '#d6b8ff',
};
export const VORTEX_PULL_FORCE = 180;
/** How close a particle must be to the vortex center to be "captured" and stop drifting freely. */
export const VORTEX_CAPTURE_RADIUS = 8;
export const VORTEX_MAX_CHARGE = 6;
export const VORTEX_CHARGE_DURATION_MS = 1400;
export const VORTEX_RELEASE_SPEED = 220;
export const VORTEX_COOLDOWN_MS = 600;
/** Base randomized angular spread (radians) applied to each released particle's angle. */
export const VORTEX_RELEASE_SPREAD_BASE = 0.3;

// ─── Repulsor burst mode (upgrade) ────────────────────────────────────

export const REPULSOR_BURST_INTERVAL_MS = 3000;
export const REPULSOR_BURST_DURATION_MS = 400;
export const REPULSOR_BURST_MULTIPLIER = 3;

// ─── Orbit Ring ────────────────────────────────────────────────────────

export const ORBIT_CONFIG: AttractorConfig = {
  id: 'orbit',
  label: 'Orbit Ring',
  icon: '⟳',
  cost: 0,
  radius: 80,
  color: '#6bffb0',
  effectColor: '#a0ffd0',
};
export const ORBIT_DEFAULT_RADIUS = 50;
/** How far outside/inside a ring's radius a particle can be pulled into orbit. */
export const ORBIT_CAPTURE_BAND = 30;
/** Strength (px/s^2 per px of radial error) of the centripetal correction force. */
export const ORBIT_CENTRIPETAL_STRENGTH = 6;
/** Per-tick blend factor toward the target tangential velocity (0..1). */
export const ORBIT_TANGENT_BLEND = 0.12;
/** Minimum tangential speed granted to a freshly-captured, near-stationary particle. */
export const ORBIT_MIN_SPEED = 60;

export const ATTRACTOR_CONFIGS: readonly AttractorConfig[] = [REPULSOR_CONFIG, VORTEX_CONFIG, ORBIT_CONFIG];

export function getAttractorConfig(kind: AttractorConfig['id']): AttractorConfig {
  const found = ATTRACTOR_CONFIGS.find((c) => c.id === kind);
  if (!found) throw new Error(`Unknown attractor kind: ${kind}`);
  return found;
}
