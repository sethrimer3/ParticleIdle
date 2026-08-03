import type { CanvasContext } from '../canvas';
import type { DefenseState } from '../../sim/combat';
import { getTargetPosition } from '../../sim/combat';
import { TARGET_RADIUS, PARTICLE_DEFAULT_COLOR, getAttractorConfig } from '../../data/combat/combat-config';
import { getEnemyDef } from '../../data/combat/enemy-codex';

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

    if (a.kind === 'orbit') {
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.orbitRadius, 0, Math.PI * 2);
      ctx.strokeStyle = a.config.color + '66';
      ctx.lineWidth = 1;
      ctx.stroke();
      if (a.dualRingEnabled) {
        ctx.beginPath();
        ctx.arc(a.x, a.y, a.orbitRadius * 1.6, 0, Math.PI * 2);
        ctx.strokeStyle = a.config.effectColor + '55';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    } else {
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
      ctx.strokeStyle = a.config.color + '55';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    if (a.id === state.selectedAttractorId) {
      ctx.beginPath();
      ctx.setLineDash([3, 3]);
      ctx.arc(a.x, a.y, 9, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255,255,255,0.8)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.beginPath();
    ctx.arc(a.x, a.y, 4, 0, Math.PI * 2);
    ctx.fillStyle = a.config.color;
    ctx.fill();

    if (a.kind === 'vortex_cannon' && a.isCharging) {
      const chargeFrac = a.chargeCount / a.maxChargeCount;
      ctx.beginPath();
      ctx.arc(a.x, a.y, 4 + chargeFrac * 6, 0, Math.PI * 2);
      ctx.strokeStyle = a.config.effectColor;
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    ctx.fillStyle = '#ffffff';
    ctx.font = '9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`L${a.level}`, a.x, a.y - 10);

    ctx.restore();
  }
}

function drawParticles(cc: CanvasContext, state: DefenseState): void {
  const { ctx } = cc;
  for (const p of state.particlePool.particles) {
    if (!p.isActive) continue;

    // Trail (rendered oldest-to-newest, fading out).
    if (p.trail.length > 1) {
      for (let i = p.trail.length - 1; i >= 0; i--) {
        const pt = p.trail[i];
        const trailAlpha = (1 - i / p.trail.length) * 0.35 * p.effectIntensity;
        if (trailAlpha <= 0) continue;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 1, 0, Math.PI * 2);
        ctx.fillStyle = p.effectColor;
        ctx.globalAlpha = trailAlpha;
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    const isEffect = p.effectType !== 'none';
    const color = isEffect ? p.effectColor : PARTICLE_DEFAULT_COLOR;
    const opacity = isEffect ? 0.55 + p.effectIntensity * 0.45 : 0.6;
    const radius = isEffect ? 1.6 : 1.2;

    ctx.beginPath();
    ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.globalAlpha = opacity;
    ctx.fill();
    ctx.globalAlpha = 1;
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
  const config = getAttractorConfig(state.selectedAttractor);
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
): void {
  const target = getTargetPosition(cc.widthPx, cc.heightPx);
  drawTarget(cc, target.x, target.y, state.lives);
  drawAttractors(cc, state);
  drawParticles(cc, state);
  drawEnemies(cc, state);
  drawPlacementPreview(cc, state, previewX, previewY);
}
