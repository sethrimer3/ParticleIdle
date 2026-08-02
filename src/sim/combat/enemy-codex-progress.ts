import { ENEMY_CODEX_DISCOVERED_STORAGE_KEY } from '../../data/combat/combat-config';

/** Reads the set of enemy defIds the player has discovered (spawned/killed at least once). */
export function loadDiscoveredEnemyIds(): Set<string> {
  try {
    const raw = localStorage.getItem(ENEMY_CODEX_DISCOVERED_STORAGE_KEY);
    if (!raw) return new Set();
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((id): id is string => typeof id === 'string'));
  } catch {
    return new Set();
  }
}

export function saveDiscoveredEnemyIds(discovered: ReadonlySet<string>): void {
  try {
    localStorage.setItem(ENEMY_CODEX_DISCOVERED_STORAGE_KEY, JSON.stringify(Array.from(discovered)));
  } catch {
    // Ignore storage errors (private browsing, quota exceeded, etc.) — discovery is cosmetic.
  }
}
