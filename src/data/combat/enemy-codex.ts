/**
 * Enemy codex: typed definitions for every enemy type that can appear in Defense mode.
 * Stat values are rebalanced against combat-config.ts's existing scale (base health ~30,
 * base speed ~14px/s, base reward ~1) rather than ported verbatim from any other project.
 * No other module should hardcode enemy stats — read them from ENEMY_CODEX by defId.
 */

/** Extension point for future gameplay behaviors (unused today, kept typed for later logic). */
export interface EnemyBehaviorFlags {
  /** Speeds up as it takes damage instead of slowing down. */
  readonly enrages: boolean;
  /** Splits into weaker enemies on death (future feature). */
  readonly splitsOnDeath: boolean;
  /** Periodically changes direction instead of beelining for the target. */
  readonly erratic: boolean;
  /** Resists particle impacts below a higher speed threshold (future feature). */
  readonly armored: boolean;
}

const NO_BEHAVIORS: EnemyBehaviorFlags = {
  enrages: false,
  splitsOnDeath: false,
  erratic: false,
  armored: false,
};

export interface EnemyDef {
  readonly id: string;
  readonly name: string;
  readonly baseHealth: number;
  readonly baseSpeed: number;
  readonly radius: number;
  readonly rewardValue: number;
  readonly color: string;
  readonly outlineColor: string;
  /** Short flavor line shown once the enemy has been discovered. */
  readonly description: string;
  readonly behaviors: EnemyBehaviorFlags;
}

function defineEnemy(def: EnemyDef): EnemyDef {
  return def;
}

// ─── Codex roster ────────────────────────────────────────────────────
// Scaling is relative to the historical single-enemy baseline (health 30, speed 14, reward 1).

export const ENEMY_MOTELING: EnemyDef = defineEnemy({
  id: 'moteling',
  name: 'Moteling',
  baseHealth: 18,
  baseSpeed: 16,
  radius: 5,
  rewardValue: 1,
  color: '#e05a5a',
  outlineColor: '#8a1f1f',
  description: 'A frail drifting spark. Dies to nearly any hit.',
  behaviors: NO_BEHAVIORS,
});

export const ENEMY_SHARD: EnemyDef = defineEnemy({
  id: 'shard',
  name: 'Shard',
  baseHealth: 30,
  baseSpeed: 14,
  radius: 6,
  rewardValue: 1,
  color: '#e0895a',
  outlineColor: '#8a4a1f',
  description: 'A standard crystalline fragment. The baseline threat.',
  behaviors: NO_BEHAVIORS,
});

export const ENEMY_SPRINTER: EnemyDef = defineEnemy({
  id: 'sprinter',
  name: 'Sprinter',
  baseHealth: 22,
  baseSpeed: 30,
  radius: 5,
  rewardValue: 2,
  color: '#e0d05a',
  outlineColor: '#8a7a1f',
  description: 'Darts toward the core far faster than it can absorb hits.',
  behaviors: NO_BEHAVIORS,
});

export const ENEMY_BULWARK: EnemyDef = defineEnemy({
  id: 'bulwark',
  name: 'Bulwark',
  baseHealth: 90,
  baseSpeed: 8,
  radius: 9,
  rewardValue: 4,
  color: '#5a8ee0',
  outlineColor: '#1f4a8a',
  description: 'A slow, heavily plated bruiser. Soaks up sustained fire.',
  behaviors: { ...NO_BEHAVIORS, armored: true },
});

export const ENEMY_WISP: EnemyDef = defineEnemy({
  id: 'wisp',
  name: 'Wisp',
  baseHealth: 14,
  baseSpeed: 20,
  radius: 4,
  rewardValue: 2,
  color: '#9adfe0',
  outlineColor: '#1f6a6a',
  description: 'Weaves unpredictably instead of beelining for the core.',
  behaviors: { ...NO_BEHAVIORS, erratic: true },
});

export const ENEMY_VOIDLING: EnemyDef = defineEnemy({
  id: 'voidling',
  name: 'Voidling',
  baseHealth: 60,
  baseSpeed: 11,
  radius: 8,
  rewardValue: 5,
  color: '#a06be0',
  outlineColor: '#4a1f8a',
  description: 'A dense purple mass that grows angrier as it is wounded.',
  behaviors: { ...NO_BEHAVIORS, enrages: true },
});

export const ENEMY_SPLITTER: EnemyDef = defineEnemy({
  id: 'splitter',
  name: 'Splitter',
  baseHealth: 40,
  baseSpeed: 15,
  radius: 7,
  rewardValue: 3,
  color: '#5ae08e',
  outlineColor: '#1f8a4a',
  description: 'Unstable — rumored to fracture into smaller motes on death.',
  behaviors: { ...NO_BEHAVIORS, splitsOnDeath: true },
});

export const ENEMY_COLOSSUS: EnemyDef = defineEnemy({
  id: 'colossus',
  name: 'Colossus',
  baseHealth: 220,
  baseSpeed: 6,
  radius: 13,
  rewardValue: 12,
  color: '#e05ac2',
  outlineColor: '#8a1f6f',
  description: 'A rare, towering mass. Immense health, glacial pace.',
  behaviors: { ...NO_BEHAVIORS, armored: true },
});

export const ENEMY_CODEX: Record<string, EnemyDef> = {
  [ENEMY_MOTELING.id]: ENEMY_MOTELING,
  [ENEMY_SHARD.id]: ENEMY_SHARD,
  [ENEMY_SPRINTER.id]: ENEMY_SPRINTER,
  [ENEMY_BULWARK.id]: ENEMY_BULWARK,
  [ENEMY_WISP.id]: ENEMY_WISP,
  [ENEMY_VOIDLING.id]: ENEMY_VOIDLING,
  [ENEMY_SPLITTER.id]: ENEMY_SPLITTER,
  [ENEMY_COLOSSUS.id]: ENEMY_COLOSSUS,
};

/** Stable display order for the codex UI (roughly weakest to strongest). */
export const ENEMY_CODEX_ORDER: readonly string[] = [
  ENEMY_MOTELING.id,
  ENEMY_SHARD.id,
  ENEMY_SPRINTER.id,
  ENEMY_WISP.id,
  ENEMY_BULWARK.id,
  ENEMY_SPLITTER.id,
  ENEMY_VOIDLING.id,
  ENEMY_COLOSSUS.id,
];

export function getEnemyDef(defId: string): EnemyDef {
  const def = ENEMY_CODEX[defId];
  if (!def) throw new Error(`Unknown enemy defId: ${defId}`);
  return def;
}
