import type { CanvasContext } from '../canvas';
import type { DefenseState } from '../../sim/combat';
import { getTargetPosition, getActiveZoneId } from '../../sim/combat';
import { TARGET_RADIUS, REPULSOR_CONFIG, VORTEX_CONFIG } from '../../data/combat/combat-config';
import { getEnemyDef } from '../../data/combat/enemy-codex';
import type { RpgZoneId } from '../../data/rpg/rpg-zone-definitions';
import { getRpgZoneTerrainProfile } from '../../data/rpg/rpg-zone-definitions';

/**
 * Simplified per-zone background palette/lighting, keyed by the same
 * `visualProfile` values as the RPG tab's zone definitions (see
 * rpg-zone-definitions.ts). This is a Defense-only fallback rather than a
 * full extraction of RPG's terrain drawers (drawCausticsBackground, etc.) —
 * those are heavily entangled with RPG-only state (player position, active
 * weapon effects, procedural terrain caches) and extracting them safely for
 * every zone was out of scope for this pass. The palettes below are tuned to
 * evoke the same profile (mineral / space / underwater / bioluminescent /
 * transcendent / cellular) so Defense at least *reads* as the matching zone.
 */
interface ZoneBackgroundPalette {
  top: string;
  bottom: string;
  accent: string;
}

const ZONE_PALETTES: Record<string, ZoneBackgroundPalette> = {
  mineral:        { top: '#241c30', bottom: '#100c18', accent: '#8f7cff' }, // euhedral
  space:          { top: '#0a0e24', bottom: '#03040c', accent: '#5ac8ff' }, // impetus
  underwater:     { top: '#062230', bottom: '#01080e', accent: '#2ad6c8' }, // caustics
  bioluminescent: { top: '#0e2a18', bottom: '#04120a', accent: '#7cff8f' }, // verdure
  transcendent:   { top: '#301428', bottom: '#120610', accent: '#ffb060' }, // horizon
  cellular:       { top: '#161a10', bottom: '#080a05', accent: '#c8e050' }, // life
};

function drawZoneBackground(cc: CanvasContext, zoneId: RpgZoneId, nowMs: number): void {
  const { ctx, widthPx, heightPx } = cc;
  const { visualProfile } = getRpgZoneTerrainProfile(zoneId);
  const palette = ZONE_PALETTES[visualProfile ?? 'mineral'] ?? ZONE_PALETTES.mineral;

  const grad = ctx.createLinearGradient(0, 0, 0, heightPx);
  grad.addColorStop(0, palette.top);
  grad.addColorStop(1, palette.bottom);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, widthPx, heightPx);

  // Slow-drifting ambient accent glow, unique per zone but cheap to compute —
  // gives each zone a distinct "lighting" feel even without full terrain art.
  const t = nowMs * 0.0002;
  const glowX = widthPx * (0.5 + 0.35 * Math.sin(t));
  const glowY = heightPx * (0.3 + 0.15 * Math.cos(t * 0.7));
  const glowR = Math.max(widthPx, heightPx) * 0.5;
  const glow = ctx.createRadialGradient(glowX, glowY, 0, glowX, glowY, glowR);
  glow.addColorStop(0, palette.accent + '22');
  glow.addColorStop(1, palette.accent + '00');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, widthPx, heightPx);
}

/** Draws the target/core marker at the bottom-center of the field. */
function drawTarget(cc: CanvasContext, x: number, y: number, lives: number): void {
  const { ctx } = cc;
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, TARGET_RADIUS, 0, Math.PI * 2);
  ctx.fillStyle = lives > 0 ? 'rgba(120, 200, 255, 0.25)' : 'rgba(255, 80, 80, 0.25)';
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = lives > 0 ? '#78c8ff' : '#ff5050';
  ctx.stroke();
  ctx.restore();
}

function drawAttractors(cc: CanvasContext, state: DefenseState): void {
  const { ctx } = cc;
  for (const a of state.attractorField.attractors) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(a.x, a.y, a.config.radius, 0, Math.PI * 2);
    ctx.strokeStyle = a.config.color + '55';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(a.x, a.y, 4, 0, Math.PI * 2);
    ctx.fillStyle = a.config.color;
    ctx.fill();

    if (a.kind === 'vortex_cannon' && a.isCharging) {
      const chargeFrac = a.chargeCount / 6;
      ctx.beginPath();
      ctx.arc(a.x, a.y, 4 + chargeFrac * 6, 0, Math.PI * 2);
      ctx.strokeStyle = a.config.effectColor;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    ctx.restore();
  }
}

function drawEnemies(cc: CanvasContext, state: DefenseState): void {
  const { ctx } = cc;
  for (const e of state.enemyWave.enemies) {
    const def = getEnemyDef(e.defId);
    ctx.beginPath();
    ctx.arc(e.x, e.y, def.radius, 0, Math.PI * 2);
    ctx.fillStyle = def.color;
    ctx.fill();
    ctx.lineWidth = 0.75;
    ctx.strokeStyle = def.outlineColor;
    ctx.stroke();

    // Health bar.
    const barW = def.radius * 2.4;
    const barH = 1.6;
    const barX = e.x - barW / 2;
    const barY = e.y - def.radius - 4;
    const healthFrac = Math.max(0, e.health / e.maxHealth);
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(barX, barY, barW, barH);
    ctx.fillStyle = healthFrac > 0.4 ? '#5ad65a' : '#e0c03a';
    ctx.fillRect(barX, barY, barW * healthFrac, barH);
  }
}

/** Optional placement-preview ring, shown while the player has an attractor selected. */
function drawPlacementPreview(cc: CanvasContext, state: DefenseState, previewX: number | null, previewY: number | null): void {
  if (previewX === null || previewY === null || !state.selectedAttractor) return;
  const { ctx } = cc;
  const config = state.selectedAttractor === 'repulsor' ? REPULSOR_CONFIG : VORTEX_CONFIG;
  const radius = config.radius;
  ctx.save();
  ctx.setLineDash([2, 2]);
  ctx.beginPath();
  ctx.arc(previewX, previewY, radius, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();
}

export function drawDefenseScene(
  cc: CanvasContext,
  state: DefenseState,
  previewX: number | null = null,
  previewY: number | null = null,
  nowMs: number = Date.now(),
): void {
  const zoneId = getActiveZoneId(state);
  drawZoneBackground(cc, zoneId, nowMs);
  state.fluid.render(cc.ctx);

  const target = getTargetPosition(cc.widthPx, cc.heightPx);
  drawTarget(cc, target.x, target.y, state.lives);
  drawAttractors(cc, state);
  drawEnemies(cc, state);
  drawPlacementPreview(cc, state, previewX, previewY);
}
