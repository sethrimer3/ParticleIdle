import type { GameplayParticlePool } from './particle-logic';
import { createParticlePool, spawnAmbientParticle, updateGameplayParticles } from './particle-logic';
import type { EnemyWave } from './enemy-logic';
import { createEnemyWave, spawnEnemy, updateEnemies } from './enemy-logic';
import type { AttractorField } from './attractor-logic';
import { createAttractorField, placeAttractor, applyAttractorForces } from './attractor-logic';
import { resolveParticleEnemyCollisions } from './collision-logic';
import type { AttractorKind } from './types';
import { loadDiscoveredEnemyIds, saveDiscoveredEnemyIds } from './enemy-codex-progress';
import { getZone, getLoopCount, ZONE_LOOP_STAT_SCALE, type WaveDef } from '../../data/combat/zone-definitions';
import { getTowerDef } from '../../data/combat/tower-defs';
import {
  AMBIENT_PARTICLE_SPAWN_INTERVAL_MS,
  TARGET_OFFSET_FROM_BOTTOM,
  TARGET_RADIUS,
  STARTING_LIVES,
} from '../../data/combat/combat-config';

export interface DefenseState {
  particlePool: GameplayParticlePool;
  enemyWave: EnemyWave;
  attractorField: AttractorField;
  score: number;
  lives: number;
  escapedCount: number;
  selectedAttractor: AttractorKind | null;
  /** id of a placed attractor selected for the tower upgrade panel (null = none selected). */
  selectedAttractorId: number | null;
  lastEnemySpawnMs: number;
  lastParticleSpawnMs: number;
  isGameOver: boolean;

  // ── Zone / wave progression ──
  zoneIndex: number;
  waveIndex: number;
  /** Remaining defIds still to be spawned this wave, in spawn order. */
  waveSpawnQueue: string[];
  /** Total enemies this wave will spawn (spawned + still queued). */
  waveTotalEnemies: number;
  /** Enemies from this wave that have been killed or have escaped. */
  waveResolvedCount: number;
  /** Enemies from this wave killed specifically (subset of waveResolvedCount), for HUD display. */
  waveKilledCount: number;
  /** Lifetime kill count across the whole run, for HUD/score display. */
  totalKills: number;

  // ── Enemy codex discovery ──
  discoveredEnemyIds: Set<string>;
}

function buildWaveQueue(wave: WaveDef): string[] {
  const queue: string[] = [];
  for (const entry of wave.spawns) {
    for (let i = 0; i < entry.count; i++) queue.push(entry.defId);
  }
  // Shuffle so mixed-composition waves don't spawn in predictable blocks.
  for (let i = queue.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [queue[i], queue[j]] = [queue[j], queue[i]];
  }
  return queue;
}

function startWave(state: DefenseState): void {
  const zone = getZone(state.zoneIndex);
  const wave = zone.waves[state.waveIndex];
  state.waveSpawnQueue = buildWaveQueue(wave);
  state.waveTotalEnemies = state.waveSpawnQueue.length;
  state.waveResolvedCount = 0;
  state.waveKilledCount = 0;
}

export function createDefenseState(): DefenseState {
  const state: DefenseState = {
    particlePool: createParticlePool(),
    enemyWave: createEnemyWave(),
    attractorField: createAttractorField(),
    score: 0,
    lives: STARTING_LIVES,
    escapedCount: 0,
    selectedAttractor: null,
    selectedAttractorId: null,
    lastEnemySpawnMs: 0,
    lastParticleSpawnMs: 0,
    isGameOver: false,
    zoneIndex: 0,
    waveIndex: 0,
    waveSpawnQueue: [],
    waveTotalEnemies: 0,
    waveResolvedCount: 0,
    waveKilledCount: 0,
    totalKills: 0,
    discoveredEnemyIds: loadDiscoveredEnemyIds(),
  };
  startWave(state);
  return state;
}

export function getTargetPosition(fieldWidth: number, fieldHeight: number): { x: number; y: number } {
  return { x: fieldWidth / 2, y: fieldHeight - TARGET_OFFSET_FROM_BOTTOM };
}

export function tryPlaceAttractor(state: DefenseState, kind: AttractorKind, x: number, y: number, nowMs: number): boolean {
  const attractor = placeAttractor(state.attractorField, kind, x, y, nowMs);
  return attractor !== null;
}

/** Attempts to purchase the next upgrade for a placed attractor, deducting `score`. */
export function tryUpgradeAttractor(state: DefenseState, attractorId: number): boolean {
  const attractor = state.attractorField.attractors.find((a) => a.id === attractorId);
  if (!attractor) return false;
  const towerDef = getTowerDef(attractor.towerId);
  if (!towerDef) return false;
  const upgrade = towerDef.upgrades[attractor.upgradeIndex];
  if (!upgrade) return false;
  if (state.score < upgrade.cost) return false;

  state.score -= upgrade.cost;
  upgrade.applyUpgrade(attractor);
  attractor.upgradeIndex += 1;
  attractor.level = attractor.upgradeIndex + 1;
  return true;
}

function markDiscovered(state: DefenseState, defId: string): void {
  if (state.discoveredEnemyIds.has(defId)) return;
  state.discoveredEnemyIds.add(defId);
  saveDiscoveredEnemyIds(state.discoveredEnemyIds);
}

/** Advances to the next wave, or the next zone (looping with escalating stats) once a zone is cleared. */
function advanceWave(state: DefenseState): void {
  const zone = getZone(state.zoneIndex);
  if (state.waveIndex + 1 < zone.waves.length) {
    state.waveIndex += 1;
  } else {
    state.waveIndex = 0;
    state.zoneIndex += 1;
  }
  startWave(state);
}

/** Effective stat multiplier for enemies spawned right now (escalates each time the zone list loops). */
function currentStatScale(state: DefenseState): number {
  const loops = getLoopCount(state.zoneIndex);
  return Math.pow(ZONE_LOOP_STAT_SCALE, loops);
}

/** Advances the whole Defense simulation by one frame. Pure function over `state`. */
export function tickDefense(state: DefenseState, deltaMs: number, nowMs: number, fieldWidth: number, fieldHeight: number): void {
  if (state.isGameOver) return;

  if (nowMs - state.lastParticleSpawnMs >= AMBIENT_PARTICLE_SPAWN_INTERVAL_MS) {
    state.lastParticleSpawnMs = nowMs;
    spawnAmbientParticle(state.particlePool, fieldWidth);
  }

  const zone = getZone(state.zoneIndex);
  const wave = zone.waves[state.waveIndex];

  if (state.waveSpawnQueue.length > 0 && nowMs - state.lastEnemySpawnMs >= wave.spawnIntervalMs) {
    state.lastEnemySpawnMs = nowMs;
    const defId = state.waveSpawnQueue.shift() as string;
    spawnEnemy(state.enemyWave, defId, fieldWidth, fieldHeight, currentStatScale(state));
    markDiscovered(state, defId);
  }

  applyAttractorForces(state.attractorField, state.particlePool, nowMs, deltaMs);
  resolveParticleEnemyCollisions(state.particlePool, state.enemyWave, nowMs);
  updateGameplayParticles(state.particlePool, deltaMs, fieldWidth, fieldHeight);

  const target = getTargetPosition(fieldWidth, fieldHeight);
  const result = updateEnemies(state.enemyWave, deltaMs, target.x, target.y, TARGET_RADIUS);

  if (result.killedCount > 0 || result.escapedCount > 0) {
    state.waveResolvedCount += result.killedCount + result.escapedCount;
    state.waveKilledCount += result.killedCount;
    state.totalKills += result.killedCount;
  }

  state.score += result.killedReward;
  if (result.escapedCount > 0) {
    state.escapedCount += result.escapedCount;
    state.lives = Math.max(0, state.lives - result.escapedCount);
    if (state.lives <= 0) {
      state.isGameOver = true;
    }
  }

  if (!state.isGameOver && state.waveSpawnQueue.length === 0 && state.waveResolvedCount >= state.waveTotalEnemies) {
    advanceWave(state);
  }
}

export function resetDefenseState(state: DefenseState): void {
  const discovered = state.discoveredEnemyIds;
  Object.assign(state, createDefenseState());
  // Discovery is persistent across runs — keep whatever was already loaded/merged.
  state.discoveredEnemyIds = discovered;
}
