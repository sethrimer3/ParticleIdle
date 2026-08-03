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
import type { RpgZoneId } from '../rpg/rpg-zone-definitions';

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
  readonly id: RpgZoneId;
  readonly name: string;
  readonly waves: readonly WaveDef[];
}

/** Multiplier applied to enemy health/speed/reward each time the zone list loops back to the start. */
export const ZONE_LOOP_STAT_SCALE = 1.35;

// Defense reuses the same 6 zone ids as the RPG tab (euhedral → life), so its
// background/terrain rendering can match. There are only 8 enemy defs in the
// combat codex (vs. RPG's much larger roster), so composition below is about
// pacing/difficulty progression rather than a 1:1 enemy-roster match.

// ─── Zone 1: Euhedral ──────────────────────────────────────────────
// Gentle introduction: single enemy type, then a mix, slow pacing.

const EUHEDRAL: ZoneDef = {
  id: 'euhedral',
  name: 'Euhedral',
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

// ─── Zone 2: Impetus ───────────────────────────────────────────────
// Space/momentum themed — erratic sprinters and wisps drifting in.

const IMPETUS: ZoneDef = {
  id: 'impetus',
  name: 'Impetus',
  waves: [
    { spawns: [{ defId: ENEMY_SPRINTER.id, count: 8 }], spawnIntervalMs: 1400 },
    {
      spawns: [
        { defId: ENEMY_WISP.id, count: 6 },
        { defId: ENEMY_SPRINTER.id, count: 4 },
      ],
      spawnIntervalMs: 1300,
    },
    {
      spawns: [
        { defId: ENEMY_MOTELING.id, count: 4 },
        { defId: ENEMY_WISP.id, count: 6 },
      ],
      spawnIntervalMs: 1200,
    },
    {
      spawns: [
        { defId: ENEMY_SHARD.id, count: 6 },
        { defId: ENEMY_SPRINTER.id, count: 6 },
        { defId: ENEMY_WISP.id, count: 4 },
      ],
      spawnIntervalMs: 1100,
    },
  ],
};

// ─── Zone 3: Caustics ──────────────────────────────────────────────
// Introduces tanky and erratic enemies, faster pacing.

const CAUSTICS: ZoneDef = {
  id: 'caustics',
  name: 'Caustics',
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

// ─── Zone 4: Verdure ───────────────────────────────────────────────
// Overgrowth theme — splitters (spawn-on-death "seeds") and bulwarks.

const VERDURE: ZoneDef = {
  id: 'verdure',
  name: 'Verdure',
  waves: [
    { spawns: [{ defId: ENEMY_SPLITTER.id, count: 6 }], spawnIntervalMs: 1100 },
    {
      spawns: [
        { defId: ENEMY_BULWARK.id, count: 3 },
        { defId: ENEMY_WISP.id, count: 6 },
      ],
      spawnIntervalMs: 1000,
    },
    {
      spawns: [
        { defId: ENEMY_SPLITTER.id, count: 6 },
        { defId: ENEMY_SPRINTER.id, count: 6 },
      ],
      spawnIntervalMs: 950,
    },
    {
      spawns: [
        { defId: ENEMY_BULWARK.id, count: 5 },
        { defId: ENEMY_SPLITTER.id, count: 5 },
        { defId: ENEMY_WISP.id, count: 5 },
      ],
      spawnIntervalMs: 850,
    },
  ],
};

// ─── Zone 5: Horizon ───────────────────────────────────────────────
// Full roster, tight pacing, ends with a Colossus-heavy finale.

const HORIZON: ZoneDef = {
  id: 'horizon',
  name: 'Horizon',
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

// ─── Zone 6: Life ──────────────────────────────────────────────────
// Secret capstone zone — the hardest composition, colossus-heavy throughout.

const LIFE: ZoneDef = {
  id: 'life',
  name: 'Life',
  waves: [
    {
      spawns: [
        { defId: ENEMY_VOIDLING.id, count: 8 },
        { defId: ENEMY_SPLITTER.id, count: 8 },
      ],
      spawnIntervalMs: 700,
    },
    {
      spawns: [
        { defId: ENEMY_COLOSSUS.id, count: 2 },
        { defId: ENEMY_BULWARK.id, count: 6 },
        { defId: ENEMY_SHARD.id, count: 8 },
      ],
      spawnIntervalMs: 650,
    },
    {
      spawns: [
        { defId: ENEMY_VOIDLING.id, count: 8 },
        { defId: ENEMY_SPRINTER.id, count: 10 },
        { defId: ENEMY_WISP.id, count: 8 },
      ],
      spawnIntervalMs: 600,
    },
    {
      spawns: [
        { defId: ENEMY_COLOSSUS.id, count: 4 },
        { defId: ENEMY_VOIDLING.id, count: 6 },
        { defId: ENEMY_SPLITTER.id, count: 8 },
      ],
      spawnIntervalMs: 600,
    },
  ],
};

export const ZONES: readonly ZoneDef[] = [EUHEDRAL, IMPETUS, CAUSTICS, VERDURE, HORIZON, LIFE];

export function getZone(zoneIndex: number): ZoneDef {
  const clamped = ((zoneIndex % ZONES.length) + ZONES.length) % ZONES.length;
  return ZONES[clamped];
}

/** How many times the zone list has fully looped by the time `zoneIndex` is reached. */
export function getLoopCount(zoneIndex: number): number {
  return Math.floor(zoneIndex / ZONES.length);
}
