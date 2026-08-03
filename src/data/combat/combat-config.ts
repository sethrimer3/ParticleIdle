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
/** Minimum time between hits from the same particle, so a resting particle can't melt an enemy in one frame. */
export const PARTICLE_HIT_COOLDOWN_MS = 250;
export const PARTICLE_BASE_DAMAGE = 4;
/** Extra damage per px/s of impact speed above the threshold (extension point for velocity scaling). */
export const PARTICLE_VELOCITY_DAMAGE_SCALE = 0.15;
/** A particle that lands a hit is consumed (removed) rather than dealing unbounded repeat damage. */
export const PARTICLE_CONSUMED_ON_HIT = true;

// ─── Fluid damage (background RPG fluid sim drives Defense damage) ──

/** Baseline damage-per-second dealt to any enemy standing in sufficiently charged fluid. */
export const FLUID_BASE_DAMAGE = 3;
/** Fluid speed (canvas px/s) above which extra velocity-scaled damage kicks in. */
export const FLUID_SPEED_THRESHOLD = 18;
/** Extra DPS per px/s of fluid speed above FLUID_SPEED_THRESHOLD. */
export const FLUID_VELOCITY_DAMAGE_SCALE = 0.12;
/** Minimum charge value at a sample point before any fluid damage is dealt. */
export const CHARGE_DAMAGE_THRESHOLD = 0.05;
/** Fraction of charge that decays per second when not being re-energized (informational; actual decay lives in rpg-fluid-constants CHARGE_RETAIN_PER_SEC). */
export const CHARGE_DECAY_RATE = 0.5;
/** Radius (px) around an active attractor within which fluid is energized each tick. */
export const CHARGE_ENERGIZE_RADIUS = 40;
/** Charge added per tick within CHARGE_ENERGIZE_RADIUS of an active attractor. */
export const CHARGE_ENERGIZE_AMOUNT = 0.6;

// ─── Attractors (shared) ─────────────────────────────────────────────

export const MAX_ATTRACTORS = 12;

export interface AttractorConfig {
  readonly id: 'repulsor' | 'vortex_cannon';
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

export const ATTRACTOR_CONFIGS: readonly AttractorConfig[] = [REPULSOR_CONFIG, VORTEX_CONFIG];
