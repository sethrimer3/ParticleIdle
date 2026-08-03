/**
 * game-app.ts — Application entry point and bootstrap.
 *
 * The game-app orchestrator has been split into focused modules:
 *   - app-types.ts      — AppState and UIPanels interfaces
 *   - app-actions.ts    — action dispatch, tab switching, UI updates
 *   - app-game-loop.ts  — frame-by-frame game loop and render pipeline
 *   - game-app.ts       — this file: bootstrap wiring only
 */

import { createGameState } from '../sim';
import type { TierId } from '../data/tiers';
import {
  createGameCanvas,
  resizeCanvas,
  ParticleSystem,
} from '../render';
import { preloadGeneratorSprites } from '../render/generators/generator-renderer';
import { preloadForgeSprites } from '../render/forge/forge-renderer';
<<<<<<< HEAD
import { preloadRefinedGemSprites } from '../render/assets/refined-gem-preload';
import { createBackgroundAnimation, createVermiculateEffect, createSubstrateEffect } from '../render/background';
import { type GameAction } from '../input';
import { createParticleDragState } from '../input/particle-drag';
import { createTabBar } from '../ui/tabs';
import { createUpgradePanel, createResourcePanel, createSettingsPanel, createLoomPanel, createEquationPanel, createAchievementsPanel } from '../ui/panels';
import { createHudOverlay } from '../ui/hud/hud-overlay';
import { createLoadingScreen, selectStartupTip } from '../ui/loading';
import { applyFontSizeOffset, loadSettings, saveGame, loadGame, deleteSave, readLastActiveTimestamp, writeLastActiveTimestamp, saveSettings } from '../settings';
=======
import { createBackgroundAnimation, type BackgroundAnimation, createVermiculateEffect, type VermiculateEffect } from '../render/background';
import { setupInputListeners, type GameAction, type TabId } from '../input';
import {
  createParticleDragState,
  handleParticleDragDown,
  handleParticleDragMove,
  handleParticleDragUp,
  type ParticleDragState,
} from '../input/particle-drag';
import { createTabBar, type TabBar } from '../ui/tabs';
import { createUpgradePanel, createResourcePanel, createSettingsPanel, createLoomPanel, createEquationPanel, createDefensePanel, createAttackPanel } from '../ui/panels';
import type { UpgradePanel } from '../ui/panels/upgrade-panel';
import type { ResourcePanel } from '../ui/panels/resource-panel';
import type { SettingsPanel } from '../ui/panels/settings-panel';
import type { LoomPanel } from '../ui/panels/loom-panel';
import type { EquationPanel } from '../ui/panels/equation-panel';
import type { DefensePanel } from '../ui/panels/defense-panel';
import { createLoadingScreen } from '../ui/loading';
import { createGameCanvas as createDefenseCanvas, resizeCanvas as resizeDefenseCanvas, clearCanvas as clearDefenseCanvas, drawBackground as drawDefenseBackground } from '../render/canvas';
import { createDefenseState, tickDefense, tryPlaceAttractor, type DefenseState } from '../sim/combat';
import { drawDefenseScene } from '../render/combat';
import { loadSettings, saveGame, loadGame, deleteSave } from '../settings';
import { AUTO_SAVE_INTERVAL_MS } from '../data/balance';
>>>>>>> codex/fix-render-screen-issues-and-pop-up-loop
import { TIERS } from '../data/tiers';
// createForgeCrunchState no longer needed here; appState.forge === game.forge directly
import {
  createGeneratorState,
  computeGeneratorPositions,
} from '../sim/particles';
import { SPAWNER_GRAVITY_RADIUS } from '../data/particles/particle-config';
import { createAudioSystem } from '../audio';
import { MAX_OFFLINE_HOURS } from '../data/balance';
import { createTraceEffect } from '../render/ui/trace-effect';
import { createRpgRender } from '../render/rpg/rpg-render';
import { createRpgMenuPanel } from '../ui/panels/rpg-menu-panel';
import { addMotes } from '../sim/resources/resource-state';
import {
  ENEMY_CODEX_GLOW_ICON_PATH,
  ENEMY_CODEX_ICON_PATH,
  ENEMY_CODEX_SHARD_ICON_PATHS,
  SKILL_CODEX_GLOW_ICON_PATH,
  SKILL_CODEX_ICON_PATH,
  SKILL_CODEX_SHARD_ICON_PATHS,
} from '../render/assets/asset-paths';

<<<<<<< HEAD
import type { AppState, UIPanels } from './app-types';
import { handleAction as handleActionImpl, setActiveTab } from './app-actions';
import { createGameLoop } from './app-game-loop';
import { applyIdleRewardsIfEligible } from './game-app-idle';
import { wireCanvasPointerInput } from './game-app-canvas-input';
import { createIdleOverlay } from '../ui/idle/idle-overlay';
import { makePageBreak } from '../ui/ui-helpers';
import { AchievementService } from '../achievements/achievementService';
import { clearAchievementService, setAchievementService } from '../achievements/achievementHooks';
import { createAppRuntimeOwner, type AppRuntime, type AppRuntimeOwner } from './app-runtime';
import { createAppWindowLifecycle, createSkillPointUnreadTracker } from './app-lifecycle';
=======
// ─── App state ──────────────────────────────────────────────────

interface AppState {
  game: GameState;
  activeTab: TabId;
  tapFlashAlpha: number;
  animPulse: number;
  forge: ForgeCrunchState;
  generatorState: GeneratorState;
  particleDrag: ParticleDragState;
  defense: DefenseState;
}
>>>>>>> codex/fix-render-screen-issues-and-pop-up-loop

// ─── Bootstrap ──────────────────────────────────────────────────

export async function startApp(): Promise<AppRuntime> {
  const root = document.getElementById('app')!;
  const runtimeOwner = createAppRuntimeOwner(root);
  root.replaceChildren();
  try {
    return await startOwnedApp(root, runtimeOwner);
  } catch (error) {
    runtimeOwner.runtime.dispose();
    throw error;
  }
}

async function startOwnedApp(root: HTMLElement, runtimeOwner: AppRuntimeOwner): Promise<AppRuntime> {

  // ── Loading screen ──
  const loadingScreen = await createLoadingScreen();
  root.appendChild(loadingScreen.element);
  runtimeOwner.addCleanup(() => loadingScreen.dispose());

  // ── Preload essential sprites ──
  preloadGeneratorSprites();
  preloadForgeSprites();
  preloadRefinedGemSprites();

  // ── Initialize game state ──
  const resetPending = sessionStorage.getItem('equatoria_reset_pending') === '1';
  if (resetPending) {
    deleteSave();
    sessionStorage.removeItem('equatoria_reset_pending');
  }
  const lastActiveTs = readLastActiveTimestamp();
  writeLastActiveTimestamp(); // immediately record so next session measures from now
  const savedGame = loadGame();
  const game = savedGame ?? createGameState();
  const achievementService = new AchievementService(game.platformAchievements);
  setAchievementService(achievementService);
  runtimeOwner.addCleanup(() => {
    clearAchievementService(achievementService);
    achievementService.dispose();
  });
  const settings = loadSettings();
  applyFontSizeOffset(settings.fontSizeOffsetPx);
  if (settings.showTipOnStartup) {
    const tip = selectStartupTip(game.startupTips);
    loadingScreen.setTip(tip?.text ?? null);
    if (tip) saveGame(game);
  }

  // ── Preload Poiret One font for canvas rendering ──
  try {
    await document.fonts.load("bold 12px 'Poiret One'");
  } catch (err) {
    console.warn('Failed to preload Poiret One font:', err);
  }

  // ── Preload Pixelify Sans font for damage numbers ──
  try {
    await document.fonts.load("bold 14px 'Pixelify Sans'");
  } catch {
    // non-critical
  }

  // ── Preload BJ Cree font for secret achievement display ──
  try {
    await document.fonts.load("400 14px 'BJ Cree'");
  } catch {
    // non-critical
  }

  const generatorState = createGeneratorState();

  // ── Audio system ──
  const audioSystem = createAudioSystem(settings.musicVolume, settings.sfxVolume);
  runtimeOwner.addCleanup(() => audioSystem.dispose());

  const appState: AppState = {
    game,
    activeTab: 'defense',
    tapFlashAlpha: 0,
    animPulse: 0,
    forge: game.forge,
    generatorState,
    particleDrag: createParticleDragState(),
<<<<<<< HEAD
    lastTapCanvasX: 0,
    lastTapCanvasY: 0,
    lastTapTimeMs: 0,
    forgeSacrificeFlashMs: 0,
    lastRefinedCrystalsGained: new Map(),
=======
    defense: createDefenseState(),
>>>>>>> codex/fix-render-screen-issues-and-pop-up-loop
  };

  // ── Background effects ──
  const bgAnimation = createBackgroundAnimation();
  root.appendChild(bgAnimation.canvas);
  runtimeOwner.addCleanup(() => bgAnimation.destroy());

  const vermiculateEffect = createVermiculateEffect();
  runtimeOwner.addCleanup(() => vermiculateEffect.destroy());
  const substrateEffect = createSubstrateEffect({
    quality: settings.graphicsQuality === 'low' ? 'low' : 'high',
  });
  runtimeOwner.addCleanup(() => substrateEffect.destroy());

  // ── Canvas container (full screen) ──
  const canvasContainer = document.createElement('div');
  canvasContainer.id = 'canvas-container';
  root.appendChild(canvasContainer);

  const cc = createGameCanvas(canvasContainer);

<<<<<<< HEAD
  // Apply the persisted idle canvas render style immediately so the first
  // frame already uses the correct backing store / image-rendering mode.
  cc.idleCanvasRenderStyle = settings.idleCanvasRenderStyle;
  cc.renderResolutionQuality = settings.renderResolutionQuality;
  resizeCanvas(cc, canvasContainer);

  // ── HUD overlay (DOM layer above canvas, non-pixelated) ──
  // Appended to cc.gameArea (not canvasContainer) so that percentage-based
  // generator-label positions remain correctly mapped to logical canvas
  // coordinates when the game area is letterboxed or pillarboxed.
  const hudOverlay = createHudOverlay();
  cc.gameArea.appendChild(hudOverlay.element);

  // ── Idle reward overlay ──
  const idleOverlay = createIdleOverlay();
  root.appendChild(idleOverlay.element);
  runtimeOwner.addCleanup(() => idleOverlay.dispose());
=======
  // ── Defense canvas (separate from the economy canvas; hidden except on Defense tab) ──
  const defenseCanvasContainer = document.createElement('div');
  defenseCanvasContainer.id = 'defense-canvas-container';
  root.appendChild(defenseCanvasContainer);
  const defenseCc = createDefenseCanvas(defenseCanvasContainer, 'defense-canvas');
>>>>>>> codex/fix-render-screen-issues-and-pop-up-loop

  // ── Panels overlay container ──
  const panelsContainer = document.createElement('div');
  panelsContainer.id = 'panels-container';
  root.appendChild(panelsContainer);

  const panelsInner = document.createElement('div');
  panelsInner.className = 'panels-inner';
  panelsContainer.appendChild(panelsInner);

<<<<<<< HEAD
  // ── Particle system ──
  const particles = new ParticleSystem();

  // ── Generator management ──
=======
  const dispatch = (action: GameAction): void => handleAction(appState, action);

  const upgradePanel = createUpgradePanel(dispatch);
  const resourcePanel = createResourcePanel();
  const settingsPanel = createSettingsPanel(settings, dispatch);
  const loomPanel = createLoomPanel(dispatch);
  const equationPanel = createEquationPanel();
  const defensePanel = createDefensePanel((kind) => {
    appState.defense.selectedAttractor = kind;
  });
  const attackPanel = createAttackPanel();

  panelsInner.appendChild(equationPanel.element);
  panelsInner.appendChild(loomPanel.element);
  panelsInner.appendChild(upgradePanel.element);
  panelsInner.appendChild(resourcePanel.element);
  panelsInner.appendChild(settingsPanel.element);
  panelsInner.appendChild(attackPanel.element);

  // Defense HUD/toolbar overlays the gameplay canvas directly (not the slide-in panel drawer).
  root.appendChild(defensePanel.element);

  const tabBar = createTabBar(dispatch);
  root.appendChild(tabBar.element);

  setActiveTab(appState, tabBar, upgradePanel, resourcePanel, settingsPanel, loomPanel, equationPanel, defensePanel, panelsContainer);

  // ── Particle system ──
  const particles = new ParticleSystem();

  let lastUnlockedTierCount = appState.game.progression.unlockedTierCount;

  // ── Input ──
  setupInputListeners(canvasContainer, dispatch);

  // Drag listeners for particle interaction
  const getCanvasCoords = (e: PointerEvent): { x: number; y: number } => {
    const rect = cc.canvas.getBoundingClientRect();
    const scaleX = cc.widthPx / rect.width;
    const scaleY = cc.heightPx / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  cc.canvas.addEventListener('pointerdown', (e: PointerEvent) => {
    const pos = getCanvasCoords(e);
    handleParticleDragDown(appState.particleDrag, pos.x, pos.y, e.timeStamp, particles.particles, cc.widthPx, cc.heightPx);
  });
  cc.canvas.addEventListener('pointermove', (e: PointerEvent) => {
    if (!appState.particleDrag.isDown) return;
    const pos = getCanvasCoords(e);
    handleParticleDragMove(appState.particleDrag, pos.x, pos.y, e.timeStamp, particles.particles);
  });
  cc.canvas.addEventListener('pointerup', (e: PointerEvent) => {
    const pos = getCanvasCoords(e);
    handleParticleDragUp(appState.particleDrag, pos.x, pos.y, e.timeStamp, particles.particles);
  });
  cc.canvas.addEventListener('pointercancel', (e: PointerEvent) => {
    const pos = getCanvasCoords(e);
    handleParticleDragUp(appState.particleDrag, pos.x, pos.y, e.timeStamp, particles.particles);
  });

  // ── Defense canvas placement input ──
  const getDefenseCanvasCoords = (e: PointerEvent): { x: number; y: number } => {
    const rect = defenseCc.canvas.getBoundingClientRect();
    const scaleX = defenseCc.widthPx / rect.width;
    const scaleY = defenseCc.heightPx / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  let defensePreviewX: number | null = null;
  let defensePreviewY: number | null = null;

  defenseCc.canvas.addEventListener('pointermove', (e: PointerEvent) => {
    const pos = getDefenseCanvasCoords(e);
    defensePreviewX = pos.x;
    defensePreviewY = pos.y;
  });
  defenseCc.canvas.addEventListener('pointerleave', () => {
    defensePreviewX = null;
    defensePreviewY = null;
  });
  defenseCc.canvas.addEventListener('pointerdown', (e: PointerEvent) => {
    if (!appState.defense.selectedAttractor) return;
    const pos = getDefenseCanvasCoords(e);
    // Keep placements off the bottom HUD/toolbar strip.
    if (pos.y < 6 || pos.y > defenseCc.heightPx - 6) return;
    tryPlaceAttractor(appState.defense, appState.defense.selectedAttractor, pos.x, pos.y, performance.now());
  });

  // ── Resize handler ──
  const onResize = (): void => {
    resizeCanvas(cc, canvasContainer);
    resizeDefenseCanvas(defenseCc, defenseCanvasContainer);
    const w = canvasContainer.clientWidth;
    const h = canvasContainer.clientHeight;
    bgAnimation.resize(w, h);
    vermiculateCanvas.width = w;
    vermiculateCanvas.height = h;
    recomputeGenerators();
  };
  window.addEventListener('resize', onResize);

  // Initial background size
  bgAnimation.resize(canvasContainer.clientWidth, canvasContainer.clientHeight);
  vermiculateCanvas.width = canvasContainer.clientWidth;
  vermiculateCanvas.height = canvasContainer.clientHeight;

  // ── Action handler ──
  function handleAction(state: AppState, action: GameAction): void {
    switch (action.kind) {
      case 'tap': {
        if (!state.game.equation.isForgeUnlocked) break;
        const result = tapEquation(state.game);
        state.tapFlashAlpha = 1;

        const rect = cc.canvas.getBoundingClientRect();
        const scaleX = cc.widthPx / rect.width;
        const scaleY = cc.heightPx / rect.height;
        const canvasX = (action.xScreen - rect.left) * scaleX;
        const canvasY = (action.yScreen - rect.top) * scaleY;

        for (const [tierId] of result.gains) {
          const count = settings.isReducedParticles
            ? Math.ceil(result.particleCount / 3)
            : result.particleCount;
          particles.emitAtPosition(canvasX, canvasY, count, tierId, performance.now());
        }
        break;
      }
      case 'purchase_upgrade':
        tryPurchaseUpgrade(state.game, action.upgradeId);
        break;
      case 'unlock_next_tier':
        tryUnlockNextTier(state.game);
        recomputeGenerators();
        break;
      case 'unlock_equation_forge':
        tryUnlockEquationForge(state.game);
        break;
      case 'upgrade_loom':
        tryUpgradeLoom(state.game, action.tierId as TierId);
        break;
      case 'set_active_tab':
        state.activeTab = action.tabId;
        setActiveTab(state, tabBar, upgradePanel, resourcePanel, settingsPanel, loomPanel, equationPanel, defensePanel, panelsContainer);
        break;
      case 'save_game':
        saveGame(state.game);
        break;
      case 'reset_game':
        deleteSave();
        Object.assign(state, { game: createGameState(), tapFlashAlpha: 0, activeTab: 'defense', defense: createDefenseState() });
        recomputeGenerators();
        setActiveTab(state, tabBar, upgradePanel, resourcePanel, settingsPanel, loomPanel, equationPanel, defensePanel, panelsContainer);
        break;
    }
  }

>>>>>>> codex/fix-render-screen-issues-and-pop-up-loop
  function recomputeGenerators(): void {
    const equationCenterX = cc.widthPx / 2;
    const equationCenterY = cc.heightPx / 2;
    const unlockedSet = new Set<TierId>();
    for (let i = 0; i < appState.game.progression.unlockedTierCount; i++) {
      if (TIERS[i]) unlockedSet.add(TIERS[i].id);
    }
    computeGeneratorPositions(
      appState.generatorState,
      cc.widthPx,
      cc.heightPx,
      equationCenterX,
      equationCenterY,
      unlockedSet,
      SPAWNER_GRAVITY_RADIUS,
    );
  }

  // ── Action dispatch ──
  let isResettingGame = false;

  const dispatch = (action: GameAction): void => {
    if (runtimeOwner.runtime.isDisposed) return;
    // Resume audio context on user interaction (autoplay policy)
    audioSystem.resumeContext().catch(() => { /* silently ignore */ });

<<<<<<< HEAD
    // Handle save/reset directly here since they need local closures
    if (action.kind === 'save_game') {
=======
    const simResult = simTick(appState.game, deltaMs);

    // Recompute generators when tiers are newly unlocked
    if (appState.game.progression.unlockedTierCount !== lastUnlockedTierCount) {
      lastUnlockedTierCount = appState.game.progression.unlockedTierCount;
      recomputeGenerators();
    }

    if (simResult.autoTapped && simResult.autoTapGains) {
      const cx = cc.widthPx / 2;
      const cy = cc.heightPx / 2;
      for (const [tierId] of simResult.autoTapGains) {
        particles.emitAtPosition(cx, cy, 2, tierId, nowMs);
      }
    }

    if (appState.tapFlashAlpha > 0) {
      appState.tapFlashAlpha = Math.max(0, appState.tapFlashAlpha - deltaMs / 200);
    }
    appState.animPulse += deltaMs / 500;

    const equationCenterX = cc.widthPx / 2;
    const equationCenterY = cc.heightPx / 2;

    // Ensure generators are initialized on first frame
    if (appState.generatorState.generators.length === 0) {
      recomputeGenerators();
    }

    particles.update(
      deltaMs,
      nowMs,
      appState.generatorState.generators,
      equationCenterX,
      equationCenterY,
      cc.widthPx,
      cc.heightPx,
      appState.forge,
    );

    // ── Update background animation ──
    bgAnimation.update(deltaMs);

    // ── Update and draw vermiculate background ──
    const vW = vermiculateCanvas.width;
    const vH = vermiculateCanvas.height;
    vermiculateEffect.update(nowMs, vW, vH);
    vermiculateCtx.clearRect(0, 0, vW, vH);
    vermiculateEffect.draw(vermiculateCtx);

    // ── Render ──
    clearCanvas(cc);
    drawBackground(cc, '#000000');

    drawGenerators(
      cc,
      appState.generatorState.generators,
      particles.spawnerRotations,
      appState.generatorState.fadeIns,
    );

    // Only draw forge and equation on canvas if forge is unlocked
    if (appState.game.equation.isForgeUnlocked) {
      drawForge(cc, equationCenterX, equationCenterY, particles.forgeRotation, appState.forge, nowMs);

      const terms = buildEquationView(appState.game.equation);
      drawEquation(cc, terms, appState.tapFlashAlpha);

      drawForgeCrunch(cc, equationCenterX, equationCenterY, appState.forge);

      if (appState.game.equation.totalTapCount < 3) {
        drawTapHint(cc, appState.animPulse);
      }
    }

    drawScore(cc, getScore(appState.game));

    particles.draw(cc);

    // ── Defense tab: only tick/render while active ──
    if (appState.activeTab === 'defense') {
      tickDefense(appState.defense, deltaMs, nowMs, defenseCc.widthPx, defenseCc.heightPx);
      clearDefenseCanvas(defenseCc);
      drawDefenseBackground(defenseCc, '#0a0e14');
      drawDefenseScene(defenseCc, appState.defense, defensePreviewX, defensePreviewY);
      defensePanel.update(appState.defense);
    }

    if (Math.floor(nowMs / 100) !== Math.floor((nowMs - deltaMs) / 100)) {
      updateUI();
    }

    if (nowMs - appState.game.lastSaveMs > AUTO_SAVE_INTERVAL_MS) {
      appState.game.lastSaveMs = nowMs;
>>>>>>> codex/fix-render-screen-issues-and-pop-up-loop
      saveGame(appState.game);
      return;
    }
    if (action.kind === 'reset_game') {
      // Clear the persisted game save (covers idle + RPG state), then refresh
      // the page. A page reload is required because RPG render holds significant
      // in-memory state (enemies, particles, weapons, wave manager) that cannot
      // be cleanly reset without re-running the full createRpgRender() bootstrap.
      isResettingGame = true;
      sessionStorage.setItem('equatoria_reset_pending', '1');
      deleteSave();
      location.reload();
      return;
    }
    handleActionImpl(appState, action, cc, particles, settings, uiPanels, recomputeGenerators, audioSystem);
  };

  // ── Focus-aware audio pause ──
  let isWindowFocused = document.visibilityState === 'visible';

  function applyFocusedAudio(): void {
    // If the setting is off, always keep audio running.
    audioSystem.setFocused(!settings.isMusicOnlyWhenFocused || isWindowFocused);
  }

  // ── Trace effect overlay (golden outline + tracer circles for UI highlights) ──
  const traceEffect = createTraceEffect(root);
  runtimeOwner.addCleanup(() => traceEffect.dispose());

  // ── UI panels ──
  const upgradePanel = createUpgradePanel(dispatch);
  // Equation panel is created first so we can pass its highlight callback to the resource panel.
  // We use a late-binding ref to avoid a circular setup order.
  let equationPanelRef: ReturnType<typeof createEquationPanel> | null = null;
  const resourcePanel = createResourcePanel((tierId) => {
    equationPanelRef?.setHighlightedTier(tierId);
  });
  // Late-bound so the render-resolution change handler can reach rpgRender,
  // which is created after the settings panel.
  let applyRenderResolutionQuality: () => void = () => {
    // Idle crisp canvas re-reads the policy on resize; RPG hook attached below.
    resizeCanvas(cc, canvasContainer);
    recomputeGenerators();
  };
  const settingsPanel = createSettingsPanel(settings, dispatch, audioSystem, applyFocusedAudio, () => {
    cc.idleCanvasRenderStyle = settings.idleCanvasRenderStyle;
    resizeCanvas(cc, canvasContainer);
    recomputeGenerators();
  }, () => { applyRenderResolutionQuality(); });
  runtimeOwner.addCleanup(() => settingsPanel.dispose());
  const achievementsPanel = createAchievementsPanel(dispatch, audioSystem);
  runtimeOwner.addCleanup(() => achievementsPanel.destroy());

  // Right column of the Equation sub-tab: mote resources on top, tier unlock
  // button at the bottom so new resources appear right above it when unlocked.
  const equationRightCol = document.createElement('div');
  equationRightCol.appendChild(resourcePanel.element);
  equationRightCol.appendChild(upgradePanel.element);

  // Equation panel with the right column injected into its two-column body.
  const equationPanel = createEquationPanel(dispatch, traceEffect, equationRightCol);
  equationPanelRef = equationPanel;

  // Wrap the equation panel in a thin container so it can be injected as the
  // "Equation" sub-tab of the combined Upgrades panel.
  const equationContentDiv = document.createElement('div');
  equationContentDiv.appendChild(equationPanel.element);

  const loomPanel = createLoomPanel(dispatch, traceEffect, equationContentDiv);
  runtimeOwner.addCleanup(() => loomPanel.dispose());

  // Prepend large page break to the top of each scrollable panel
  loomPanel.element.prepend(makePageBreak('large'));
  achievementsPanel.element.prepend(makePageBreak('large'));
  settingsPanel.element.prepend(makePageBreak('large'));

  panelsInner.appendChild(loomPanel.element);
  panelsInner.appendChild(achievementsPanel.element);
  panelsInner.appendChild(settingsPanel.element);

  // ── RPG container + render ──
  const rpgContainer = document.createElement('div');
  rpgContainer.id = 'rpg-container';
  rpgContainer.style.display = 'none';
  root.appendChild(rpgContainer);

  let setCodexUnread = (_unread: boolean): void => undefined;
  let setSkillCodexUnread = (_unread: boolean): void => undefined;
  const skillPointUnreadTracker = createSkillPointUnreadTracker({
    getUnspentSkillPoints: () => appState.game.rpg.unspentSkillPoints,
    setUnread: (unread) => { setSkillCodexUnread(unread); },
  });
  runtimeOwner.addCleanup(() => skillPointUnreadTracker.dispose());
  const rpgRender = createRpgRender(rpgContainer, appState.game.rpg, {
    onLuckyMoteCollected: (tierId: TierId, bonusPct: number) => {
      if (runtimeOwner.runtime.isDisposed) return;
      const current = appState.game.resources.moteTotals.get(tierId) ?? 0;
      // Apply percentage bonus; ensure at least 1 mote so the drop is never worthless
      // even when the player has not yet collected any motes of this tier.
      const bonus = Math.max(1, current * bonusPct / 100);
      addMotes(appState.game.resources, tierId, bonus);
    },
    getAchievementAtkBonus: () => appState.game.achievements.baseAtkBonus,
    onError: () => { audioSystem.onError(); },
    onNewCodexEntry: () => { setCodexUnread(true); },
    onBossCassetteStart: (path, onDone) => { audioSystem.bossCassetteStart(path, onDone); },
    onBossMusicStart: (beatLoop, bgLayers, onPrimaryTrackReady) => { audioSystem.startBossMusic(beatLoop, bgLayers, onPrimaryTrackReady); },
    onBossMusicStartWithCassette: (cassetteStart, beatLoop, bgLayers, onPrimaryTrackReady) => { audioSystem.startBossMusicWithCassette(cassetteStart, beatLoop, bgLayers, onPrimaryTrackReady); },
    onBossMusicStop: () => { audioSystem.stopBossMusic(); },
    onBossMusicStopWithCassette: (cassetteEnd, onDone) => { audioSystem.stopBossMusicWithCassette(cassetteEnd, onDone); },
    onBossMusicPhrase: (path) => { audioSystem.playBossMusicPhrase(path); },
    dispatch,
  });
  runtimeOwner.addCleanup(() => rpgRender.dispose());
  rpgRender.setNumberFormat(settings.numberFormat);
  rpgRender.setRenderResolutionQuality(settings.renderResolutionQuality);
  // Now that rpgRender exists, route render-resolution changes to both the RPG
  // renderer and the idle crisp canvas.
  applyRenderResolutionQuality = () => {
    rpgRender.setRenderResolutionQuality(settings.renderResolutionQuality);
    cc.renderResolutionQuality = settings.renderResolutionQuality;
    resizeCanvas(cc, canvasContainer);
    recomputeGenerators();
  };
  // Stats panel is positioned in the root (above the tab bar); visibility
  // is toggled by setActiveTab alongside rpgContainer.
  root.appendChild(rpgRender.statsPanel);

  // ── Wire dev panel hooks (dev playtesting tools) ──
  settingsPanel.registerDevHooks({
    rpgRender,
    getGame: () => appState.game,
  });

  // ── Helper: apply the RPG bar position setting to DOM elements ──
  function applyRpgRackPosition(position: 'bottom' | 'top' | 'hidden'): void {
    const atTop = position === 'top';
    rpgRender.statsPanel.classList.toggle('rpg-bar-at-top', atTop);
    rpgRender.statsPanel.classList.toggle('rpg-rack-hidden', position === 'hidden');
    rpgContainer.classList.toggle('rpg-bar-at-top', atTop);
    rpgContainer.classList.toggle('rpg-rack-hidden', position === 'hidden');
    rpgRender.resize(rpgContainer);
  }

  function applyRpgMenuButtonPosition(position: 'top' | 'bottom'): void {
    rpgContainer.classList.toggle('rpg-menu-button-at-bottom', position === 'bottom');
  }

  // ── RPG menu panel (replaces weapon store) ──
  const rpgMenuPanel = createRpgMenuPanel(
    dispatch,
    rpgRender.statsPanel,
    root,
    (position) => {
      settings.rpgRackPosition = position;
      saveSettings(settings);
      applyRpgRackPosition(position);
      rpgMenuPanel.setRpgRackPosition(position);
    },
    (position) => {
      settings.rpgMenuButtonPosition = position;
      saveSettings(settings);
      applyRpgMenuButtonPosition(position);
      rpgMenuPanel.setRpgMenuButtonPosition(position);
    },
    (position) => {
      settings.rpgZonePosition = position;
      saveSettings(settings);
      rpgRender.setZonePosition(position);
      rpgMenuPanel.setRpgZonePosition(position);
    },
  );
  runtimeOwner.addCleanup(() => rpgMenuPanel.dispose());
  rpgMenuPanel.element.style.display = 'none';
  root.appendChild(rpgMenuPanel.element);
  rpgRender.setRackAutoMoveToggleHandler(() => {
    rpgMenuPanel.setAutoMoveEnabled(!rpgMenuPanel.isAutoMoveEnabled);
    rpgRender.setRackAutoMoveEnabled(rpgMenuPanel.isAutoMoveEnabled);
  });
  rpgRender.setRackAutoMoveEnabled(rpgMenuPanel.isAutoMoveEnabled);

  // Apply saved bar position immediately after panel is in the DOM
  applyRpgRackPosition(settings.rpgRackPosition);
  rpgMenuPanel.setRpgRackPosition(settings.rpgRackPosition);
  applyRpgMenuButtonPosition(settings.rpgMenuButtonPosition);
  rpgMenuPanel.setRpgMenuButtonPosition(settings.rpgMenuButtonPosition);
  rpgRender.setZonePosition(settings.rpgZonePosition);
  rpgMenuPanel.setRpgZonePosition(settings.rpgZonePosition);
  rpgMenuPanel.setTopographicTerrainDebugEnabled(settings.isTopographicTerrainDebugEnabled);
  rpgMenuPanel.setSharpTopographyShadows(settings.isSharpTopographyShadows);
  rpgRender.setSharpTopographyShadows(settings.isSharpTopographyShadows);
  rpgMenuPanel.setDeveloperVisual('set_rpg_viewport_debug', settings.isRpgViewportDebugEnabled);
  rpgMenuPanel.setDeveloperVisual('set_rpg_pathfinding_debug', settings.isRpgPathfindingDebugEnabled);
  rpgMenuPanel.setDeveloperVisual('set_rpg_verdure_wall_debug', settings.isRpgVerdureWallDebugEnabled);
  rpgMenuPanel.setDeveloperVisual('set_rpg_nadir_anchor_debug', settings.isRpgNadirAnchorDebugEnabled);
  rpgMenuPanel.setDeveloperVisual('set_rpg_boss_stage_debug', settings.isRpgBossStageDebugEnabled);
  rpgMenuPanel.setDeveloperVisual('set_topography_lighting_debug', settings.isTopographyLightingDebugEnabled);
  rpgMenuPanel.setDeveloperVisual('set_soft_impetus_asteroid_shadows', settings.isSoftImpetusAsteroidShadows);
  rpgMenuPanel.setDeveloperVisual('set_rpg_debug_overlay', settings.isRpgDebugOverlayEnabled);
  rpgRender.setRpgDebugOverlay(settings.isRpgDebugOverlayEnabled);

  // ── Menu toggle button (appended to the stats panel by the renderer) ──
  const menuToggleBtn = document.createElement('button');
  menuToggleBtn.className = 'rpg-menu-btn';
  menuToggleBtn.textContent = '⚔ Menu';
  menuToggleBtn.setAttribute('aria-label', 'Open RPG menu');
  function toggleRpgMenu(): void {
    const nowVisible = !rpgMenuPanel.isVisible;
    rpgMenuPanel.setVisible(nowVisible);
    if (nowVisible) {
      rpgMenuPanel.update(appState.game.rpg, appState.game.resources, settings.numberFormat, settings.isDevMode);
    }
  }

<<<<<<< HEAD
  menuToggleBtn.addEventListener('click', toggleRpgMenu);
  rpgRender.menuButtonContainer.appendChild(menuToggleBtn);

  const hiddenRackMenuBtn = document.createElement('button');
  hiddenRackMenuBtn.className = 'rpg-hidden-rack-menu-btn';
  hiddenRackMenuBtn.textContent = menuToggleBtn.textContent;
  hiddenRackMenuBtn.setAttribute('aria-label', 'Open RPG menu');
  hiddenRackMenuBtn.addEventListener('click', toggleRpgMenu);
  rpgContainer.appendChild(hiddenRackMenuBtn);

  const codexBtn = document.createElement('button');
  codexBtn.className = 'rpg-codex-btn rpg-codex-shortcut';
  codexBtn.setAttribute('aria-label', 'Open enemy codex');
  const codexSpriteWrap = document.createElement('span');
  codexSpriteWrap.className = 'rpg-codex-shortcut__sprite';
  for (const [path, className] of [
    [ENEMY_CODEX_ICON_PATH, 'rpg-codex-shortcut__icon'],
    [ENEMY_CODEX_GLOW_ICON_PATH, 'rpg-codex-shortcut__icon rpg-codex-shortcut__icon--glow'],
  ] as const) {
    const image = document.createElement('img');
    image.src = path;
    image.className = className;
    image.alt = '';
    codexSpriteWrap.appendChild(image);
=======
  function setActiveTab(
    state: AppState,
    bar: TabBar,
    upPanel: UpgradePanel,
    resPanel: ResourcePanel,
    setPanel: SettingsPanel,
    lPanel: LoomPanel,
    eqPanel: EquationPanel,
    defPanel: DefensePanel,
    panelsCont: HTMLElement,
  ): void {
    bar.setActiveTab(state.activeTab);

    // Equation/Defense tabs render straight to a full-screen canvas; the rest use overlay panels.
    const shouldShowPanels = state.activeTab !== 'equation' && state.activeTab !== 'defense';
    panelsCont.classList.toggle('panels-visible', shouldShowPanels);

    // Only one of the two gameplay canvases is visible at a time.
    canvasContainer.style.display = state.activeTab === 'defense' ? 'none' : '';
    defenseCanvasContainer.style.display = state.activeTab === 'defense' ? '' : 'none';

    // Show/hide individual panels
    eqPanel.element.style.display = state.activeTab === 'equation' ? '' : 'none';
    lPanel.element.style.display = state.activeTab === 'looms' ? '' : 'none';
    upPanel.element.style.display = state.activeTab === 'resources' ? '' : 'none';
    resPanel.element.style.display = state.activeTab === 'resources' ? '' : 'none';
    setPanel.element.style.display = state.activeTab === 'settings' ? '' : 'none';
    defPanel.element.style.display = state.activeTab === 'defense' ? '' : 'none';
    attackPanel.element.style.display = state.activeTab === 'attack' ? '' : 'none';

    // Immediately update visible panel
    if (state.activeTab === 'looms') {
      lPanel.update(appState.game);
    } else if (state.activeTab === 'resources') {
      upPanel.update(appState.game);
      resPanel.update(appState.game);
    } else if (state.activeTab === 'defense') {
      defPanel.update(appState.defense);
    }
>>>>>>> codex/fix-render-screen-issues-and-pop-up-loop
  }
  ENEMY_CODEX_SHARD_ICON_PATHS.forEach((path, index) => {
    const shard = document.createElement('img');
    shard.src = path;
    shard.className = `rpg-codex-shortcut__shard rpg-codex-shortcut__shard--${index + 1}`;
    shard.alt = '';
    shard.setAttribute('aria-hidden', 'true');
    codexSpriteWrap.appendChild(shard);
  });
  codexBtn.appendChild(codexSpriteWrap);
  setCodexUnread = (unread) => { codexBtn.classList.toggle('rpg-codex-btn--unread', unread); };
  codexBtn.addEventListener('click', () => {
    setCodexUnread(false);
    rpgMenuPanel.update(appState.game.rpg, appState.game.resources, settings.numberFormat, settings.isDevMode);
    rpgMenuPanel.openEnemiesTab();
  });
  rpgContainer.appendChild(codexBtn);

  const skillTreeBtn = document.createElement('button');
  skillTreeBtn.className = 'rpg-skill-tree-btn rpg-codex-shortcut';
  skillTreeBtn.setAttribute('aria-label', 'Open skill tree');
  const skillSpriteWrap = document.createElement('span');
  skillSpriteWrap.className = 'rpg-codex-shortcut__sprite';
  for (const [path, className] of [
    [SKILL_CODEX_ICON_PATH, 'rpg-codex-shortcut__icon'],
    [SKILL_CODEX_GLOW_ICON_PATH, 'rpg-codex-shortcut__icon rpg-codex-shortcut__icon--glow'],
  ] as const) {
    const image = document.createElement('img');
    image.src = path;
    image.className = className;
    image.alt = '';
    skillSpriteWrap.appendChild(image);
  }
  SKILL_CODEX_SHARD_ICON_PATHS.forEach((path, index) => {
    const shard = document.createElement('img');
    shard.src = path;
    shard.className = `rpg-codex-shortcut__shard rpg-codex-shortcut__shard--${index + 1}`;
    shard.alt = '';
    shard.setAttribute('aria-hidden', 'true');
    skillSpriteWrap.appendChild(shard);
  });
  skillTreeBtn.appendChild(skillSpriteWrap);
  setSkillCodexUnread = (unread) => { skillTreeBtn.classList.toggle('rpg-skill-tree-btn--unread', unread); };
  skillTreeBtn.addEventListener('click', () => {
    skillPointUnreadTracker.markRead();
    rpgMenuPanel.update(appState.game.rpg, appState.game.resources, settings.numberFormat, settings.isDevMode);
    rpgMenuPanel.openSkillTreeTab();
  });
  rpgContainer.appendChild(skillTreeBtn);
  rpgRender.registerOverlayFadeElements([hiddenRackMenuBtn, codexBtn, skillTreeBtn]);

  const tabBar = createTabBar(dispatch);
  runtimeOwner.addCleanup(() => tabBar.dispose());
  root.appendChild(tabBar.element);

  const uiPanels: UIPanels = {
    tabBar,
    upgradePanel,
    resourcePanel,
    settingsPanel,
    loomPanel,
    equationPanel,
    achievementsPanel,
    panelsContainer,
    mainCanvasContainer: canvasContainer,
    rpgRender,
    rpgContainer,
    rpgMenuPanel,
  };

  setActiveTab(appState, uiPanels, appState.game, settings.isDevMode, settings.numberFormat);

  // ── Input listeners ──
  // Tap dispatch is handled inside wireCanvasPointerInput directly on cc.canvas,
  // which is more reliable on mobile (canvas has touch-action: none and pointer capture).
  const cleanupCanvasPointerInput = wireCanvasPointerInput(cc, appState, particles, audioSystem, dispatch);
  runtimeOwner.addCleanup(cleanupCanvasPointerInput);

  // ── Resize handler ──
  const onResize = (): void => {
    if (appState.activeTab !== 'rpg') {
      resizeCanvas(cc, canvasContainer);
      recomputeGenerators();
    }
    const w = canvasContainer.clientWidth;
    const h = canvasContainer.clientHeight;
    if (w > 0 && h > 0) {
      bgAnimation.resize(w, h);
      vermiculateEffect.reset();
      substrateEffect.reset();
    }
    rpgRender.resize(rpgContainer);
  };
  const appWindowLifecycle = createAppWindowLifecycle({
    isResetting: () => isResettingGame,
    save: () => { saveGame(game); },
    writeLastActiveTimestamp,
    readLastActiveTimestamp,
    applyIdleRewards: (elapsedMs) => { applyIdleRewardsIfEligible(game, elapsedMs, idleOverlay); },
    setAudioFocused: (focused) => {
      isWindowFocused = focused;
      applyFocusedAudio();
    },
    resize: onResize,
    maxIdleMs: MAX_OFFLINE_HOURS * 3_600_000,
  });
  runtimeOwner.addCleanup(() => appWindowLifecycle.dispose());
  bgAnimation.resize(canvasContainer.clientWidth, canvasContainer.clientHeight);

  // ── Game loop ──
  const gameLoop = createGameLoop({
    appState,
    cc,
    particles,
    settings,
    uiPanels,
    bgAnimation,
    vermiculateEffect,
    substrateEffect,
    recomputeGenerators,
    hudOverlay,
    lastUnlockedTierCount: { value: appState.game.progression.unlockedTierCount },
    lastFrameMs: { value: performance.now() },
    audioSystem,
  });
  runtimeOwner.addCleanup(() => gameLoop.dispose());

  // Initial generator setup
  recomputeGenerators();

  // ── Fade out loading screen and start game loop ──
  await loadingScreen.fadeOut();

  // ── Idle reward check ──
  if (lastActiveTs !== null) {
    const elapsedMs = Math.min(Date.now() - lastActiveTs, MAX_OFFLINE_HOURS * 3_600_000);
    applyIdleRewardsIfEligible(game, elapsedMs, idleOverlay, settings.skipIdlePopupAtStart);
  }

  gameLoop.start();
  return runtimeOwner.runtime;
}
