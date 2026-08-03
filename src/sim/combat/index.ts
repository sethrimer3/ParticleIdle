export type { GameplayParticle, Enemy, Attractor, AttractorKind, ParticleEffectType } from './types';
export { createParticlePool, spawnAmbientParticle, updateGameplayParticles, spawnPooledParticle, applyForceToParticle } from './particle-logic';
export type { GameplayParticlePool } from './particle-logic';
export { createEnemyWave, spawnEnemy, updateEnemies } from './enemy-logic';
export type { EnemyWave, EnemyTickResult } from './enemy-logic';
export { createAttractorField, placeAttractor, applyAttractorForces } from './attractor-logic';
export type { AttractorField } from './attractor-logic';
export { resolveParticleEnemyCollisions } from './collision-logic';
export {
  createDefenseState,
  getTargetPosition,
  tryPlaceAttractor,
  tickDefense,
  resetDefenseState,
} from './defense-state';
export type { DefenseState } from './defense-state';
export { loadDiscoveredEnemyIds, saveDiscoveredEnemyIds } from './enemy-codex-progress';
