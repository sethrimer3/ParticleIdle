import type { DefenseState } from '../../sim/combat';
import type { AttractorKind } from '../../sim/combat';
import { ATTRACTOR_CONFIGS } from '../../data/combat/combat-config';
import { ENEMY_CODEX, ENEMY_CODEX_ORDER } from '../../data/combat/enemy-codex';
import { getZone } from '../../data/combat/zone-definitions';

export interface DefensePanel {
  element: HTMLElement;
  update(state: DefenseState): void;
}

/**
 * Attractor-selection strip + HUD + enemy codex for the Defense tab. Placement itself
 * happens on the dedicated defense canvas (wired up in game-app.ts), so this panel only
 * owns the UI chrome — it never touches simulation state directly.
 */
export function createDefensePanel(onSelectAttractor: (kind: AttractorKind) => void): DefensePanel {
  const panel = document.createElement('div');
  panel.className = 'panel defense-panel';

  const hud = document.createElement('div');
  hud.className = 'defense-hud';
  panel.appendChild(hud);

  const hudLeft = document.createElement('div');
  hudLeft.className = 'defense-hud-col';
  const hudRight = document.createElement('div');
  hudRight.className = 'defense-hud-col defense-hud-col-right';
  hud.appendChild(hudLeft);
  hud.appendChild(hudRight);

  const zoneEl = document.createElement('span');
  zoneEl.className = 'defense-hud-zone';
  const waveEl = document.createElement('span');
  waveEl.className = 'defense-hud-wave';
  const enemiesEl = document.createElement('span');
  enemiesEl.className = 'defense-hud-enemies';
  hudLeft.appendChild(zoneEl);
  hudLeft.appendChild(waveEl);
  hudLeft.appendChild(enemiesEl);

  const scoreEl = document.createElement('span');
  scoreEl.className = 'defense-hud-score';
  const killsEl = document.createElement('span');
  killsEl.className = 'defense-hud-kills';
  const livesEl = document.createElement('span');
  livesEl.className = 'defense-hud-lives';
  hudRight.appendChild(scoreEl);
  hudRight.appendChild(killsEl);
  hudRight.appendChild(livesEl);

  // ── Enemy codex overlay ──
  const codexOverlay = document.createElement('div');
  codexOverlay.className = 'enemy-codex-overlay';
  codexOverlay.style.display = 'none';

  const codexCard = document.createElement('div');
  codexCard.className = 'enemy-codex-card';
  codexOverlay.appendChild(codexCard);

  const codexHeader = document.createElement('div');
  codexHeader.className = 'enemy-codex-header';
  codexHeader.innerHTML = `<span>Enemy Codex</span>`;
  const codexCloseBtn = document.createElement('button');
  codexCloseBtn.className = 'enemy-codex-close';
  codexCloseBtn.textContent = '✕';
  codexCloseBtn.addEventListener('pointerdown', (e) => {
    e.stopPropagation();
    codexOverlay.style.display = 'none';
  });
  codexHeader.appendChild(codexCloseBtn);
  codexCard.appendChild(codexHeader);

  const codexList = document.createElement('div');
  codexList.className = 'enemy-codex-list';
  codexCard.appendChild(codexList);

  const codexRows: Map<string, { row: HTMLElement; swatch: HTMLElement; name: HTMLElement; stats: HTMLElement }> = new Map();
  for (const defId of ENEMY_CODEX_ORDER) {
    const row = document.createElement('div');
    row.className = 'enemy-codex-row';

    const swatch = document.createElement('span');
    swatch.className = 'enemy-codex-swatch';

    const info = document.createElement('div');
    info.className = 'enemy-codex-info';
    const name = document.createElement('div');
    name.className = 'enemy-codex-name';
    const stats = document.createElement('div');
    stats.className = 'enemy-codex-stats';
    info.appendChild(name);
    info.appendChild(stats);

    row.appendChild(swatch);
    row.appendChild(info);
    codexList.appendChild(row);
    codexRows.set(defId, { row, swatch, name, stats });
  }
  panel.appendChild(codexOverlay);

  const toolbar = document.createElement('div');
  toolbar.className = 'defense-toolbar';
  panel.appendChild(toolbar);

  const buttons: Map<AttractorKind, HTMLButtonElement> = new Map();

  for (const config of ATTRACTOR_CONFIGS) {
    const btn = document.createElement('button');
    btn.className = 'defense-attractor-btn';
    btn.innerHTML = `<span class="defense-attractor-icon">${config.icon}</span><span class="defense-attractor-label">${config.label}</span>`;
    btn.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      for (const [, b] of buttons) b.classList.remove('selected');
      btn.classList.add('selected');
      onSelectAttractor(config.id);
    });
    toolbar.appendChild(btn);
    buttons.set(config.id, btn);
  }

  const codexBtn = document.createElement('button');
  codexBtn.className = 'defense-attractor-btn defense-codex-btn';
  codexBtn.innerHTML = `<span class="defense-attractor-icon">📖</span><span class="defense-attractor-label">Codex</span>`;
  codexBtn.addEventListener('pointerdown', (e) => {
    e.stopPropagation();
    codexOverlay.style.display = codexOverlay.style.display === 'none' ? '' : 'none';
  });
  toolbar.appendChild(codexBtn);

  function update(state: DefenseState): void {
    const zone = getZone(state.zoneIndex);
    zoneEl.textContent = `${zone.name}`;
    waveEl.textContent = `Wave ${state.waveIndex + 1}/${zone.waves.length}`;
    const remaining = Math.max(0, state.waveTotalEnemies - state.waveResolvedCount);
    enemiesEl.textContent = `Enemies: ${remaining} left · ${state.waveKilledCount} killed`;

    scoreEl.textContent = `Score: ${Math.floor(state.score)}`;
    killsEl.textContent = `Kills: ${state.totalKills}`;
    livesEl.textContent = `Lives: ${Math.max(0, state.lives)}`;
    livesEl.classList.toggle('defense-hud-danger', state.lives <= 1);

    for (const [defId, refs] of codexRows) {
      const discovered = state.discoveredEnemyIds.has(defId);
      refs.row.classList.toggle('enemy-codex-discovered', discovered);
      if (discovered) {
        const def = ENEMY_CODEX[defId];
        refs.swatch.style.background = def.color;
        refs.name.textContent = def.name;
        refs.stats.textContent = `HP ${def.baseHealth} · SPD ${def.baseSpeed} · Reward ${def.rewardValue}`;
      } else {
        refs.swatch.style.background = '#3a3a44';
        refs.name.textContent = '???';
        refs.stats.textContent = '???';
      }
    }
  }

  return { element: panel, update };
}
