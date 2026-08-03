import {
  ENEMY_MOTELING,
  ENEMY_SHARD,
  ENEMY_SPRINTER,
  ENEMY_BULWARK,
  ENEMY_WISP,
  ENEMY_VOIDLING,
  ENEMY_SPLITTER,
  ENEMY_COLOSSUS,
} from './enemy-codex';

/** One entry in a wave's spawn list: how many of a given enemy type spawn this wave. */
export interface WaveSpawnEntry {
  readonly defId: string;
  readonly count: number;
}

export interface WaveDef {
  readonly spawns: readonly WaveSpawnEntry[];
  /** Milliseconds between individual enemy spawns within this wave. */
  readonly spawnIntervalMs: number;
}

export interface ZoneDef {
  readonly id: string;
  readonly name: string;
  readonly waves: readonly WaveDef[];
}

/** Multiplier applied to enemy health/speed/reward each time the zone list loops back to the start. */
export const ZONE_LOOP_STAT_SCALE = 1.35;

// ─── Zone 1: Outer Drift ───────────────────────────────────────────
// Gentle introduction: single enemy type, then a mix, slow pacing.

const OUTER_DRIFT: ZoneDef = {
  id: 'outer_drift',
  name: 'Outer Drift',
  waves: [
    { spawns: [{ defId: ENEMY_MOTELING.id, count: 6 }], spawnIntervalMs: 1800 },
    { spawns: [{ defId: ENEMY_SHARD.id, count: 6 }], spawnIntervalMs: 1700 },
    {
      spawns: [
        { defId: ENEMY_MOTELING.id, count: 5 },
        { defId: ENEMY_SHARD.id, count: 5 },
      ],
      spawnIntervalMs: 1500,
    },
    {
      spawns: [
        { defId: ENEMY_SHARD.id, count: 6 },
        { defId: ENEMY_SPRINTER.id, count: 3 },
      ],
      spawnIntervalMs: 1400,
    },
  ],
};

// ─── Zone 2: Shard Belt ────────────────────────────────────────────
// Introduces tanky and erratic enemies, faster pacing.

const SHARD_BELT: ZoneDef = {
  id: 'shard_belt',
  name: 'Shard Belt',
  waves: [
    {
      spawns: [
        { defId: ENEMY_SHARD.id, count: 8 },
        { defId: ENEMY_SPRINTER.id, count: 4 },
      ],
      spawnIntervalMs: 1300,
    },
    { spawns: [{ defId: ENEMY_WISP.id, count: 8 }], spawnIntervalMs: 1200 },
    {
      spawns: [
        { defId: ENEMY_BULWARK.id, count: 3 },
        { defId: ENEMY_SHARD.id, count: 6 },
      ],
      spawnIntervalMs: 1200,
    },
    {
      spawns: [
        { defId: ENEMY_SPLITTER.id, count: 5 },
        { defId: ENEMY_WISP.id, count: 5 },
        { defId: ENEMY_SPRINTER.id, count: 4 },
      ],
      spawnIntervalMs: 1000,
    },
    {
      spawns: [
        { defId: ENEMY_BULWARK.id, count: 4 },
        { defId: ENEMY_SPLITTER.id, count: 4 },
        { defId: ENEMY_SPRINTER.id, count: 6 },
      ],
      spawnIntervalMs: 900,
    },
  ],
};

// ─── Zone 3: Void Reach ────────────────────────────────────────────
// Full roster, tight pacing, ends with a Colossus-heavy finale.

const VOID_REACH: ZoneDef = {
  id: 'void_reach',
  name: 'Void Reach',
  waves: [
    {
      spawns: [
        { defId: ENEMY_VOIDLING.id, count: 4 },
        { defId: ENEMY_SHARD.id, count: 8 },
      ],
      spawnIntervalMs: 900,
    },
    {
      spawns: [
        { defId: ENEMY_SPLITTER.id, count: 6 },
        { defId: ENEMY_SPRINTER.id, count: 8 },
        { defId: ENEMY_WISP.id, count: 6 },
      ],
      spawnIntervalMs: 800,
    },
    {
      spawns: [
        { defId: ENEMY_VOIDLING.id, count: 6 },
        { defId: ENEMY_BULWARK.id, count: 5 },
      ],
      spawnIntervalMs: 800,
    },
    {
      spawns: [
        { defId: ENEMY_SHARD.id, count: 10 },
        { defId: ENEMY_SPRINTER.id, count: 10 },
        { defId: ENEMY_VOIDLING.id, count: 4 },
      ],
      spawnIntervalMs: 650,
    },
    {
      spawns: [
        { defId: ENEMY_COLOSSUS.id, count: 2 },
        { defId: ENEMY_VOIDLING.id, count: 4 },
        { defId: ENEMY_SPLITTER.id, count: 6 },
      ],
      spawnIntervalMs: 700,
    },
  ],
};

export const ZONES: readonly ZoneDef[] = [OUTER_DRIFT, SHARD_BELT, VOID_REACH];

export function getZone(zoneIndex: number): ZoneDef {
  const clamped = ((zoneIndex % ZONES.length) + ZONES.length) % ZONES.length;
  return ZONES[clamped];
}

/** How many times the zone list has fully looped by the time `zoneIndex` is reached. */
export function getLoopCount(zoneIndex: number): number {
  return Math.floor(zoneIndex / ZONES.length);
}
