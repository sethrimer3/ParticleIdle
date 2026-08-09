import type { Attractor } from '../../sim/combat/types';

export interface TowerUpgradeDef {
  id: string;
  label: string;
  description: string;
  cost: number;
  applyUpgrade: (attractor: Attractor) => void;
}

export interface TowerDef {
  id: string;
  name: string;
  description: string;
  baseCost: number;
  upgrades: TowerUpgradeDef[];
}

export const REPULSOR_TOWER_DEF: TowerDef = {
  id: 'repulsor',
  name: 'Repulsor',
  description: 'Pushes particles outward, accelerating them into enemies.',
  baseCost: 0,
  upgrades: [
    {
      id: 'stronger_push',
      label: 'Stronger Push',
      description: 'Increases push force by 40%.',
      cost: 40,
      applyUpgrade: (a) => { a.pushForce *= 1.4; },
    },
    {
      id: 'wider_range',
      label: 'Wider Range',
      description: 'Increases influence radius by 25px.',
      cost: 80,
      applyUpgrade: (a) => { a.radius += 25; },
    },
    {
      id: 'burst_mode',
      label: 'Burst Mode',
      description: 'Adds a periodic pulse that briefly triples push force every 3s.',
      cost: 160,
      applyUpgrade: (a) => { a.burstModeEnabled = true; },
    },
  ],
};

export const VORTEX_TOWER_DEF: TowerDef = {
  id: 'vortex_cannon',
  name: 'Vortex Cannon',
  description: 'Captures particles and releases them in a radial burst.',
  baseCost: 0,
  upgrades: [
    {
      id: 'faster_charge',
      label: 'Faster Charge',
      description: 'Reduces charge time by 30%.',
      cost: 50,
      applyUpgrade: (a) => { a.chargeDurationMs *= 0.7; },
    },
    {
      id: 'wider_cone',
      label: 'Wider Cone',
      description: 'Increases release spread angle.',
      cost: 90,
      applyUpgrade: (a) => { a.releaseSpread += 0.6; },
    },
    {
      id: 'overcharge',
      label: 'Overcharge',
      description: 'Allows charge to build past the normal cap for 50% more peak force.',
      cost: 170,
      applyUpgrade: (a) => {
        a.overchargeEnabled = true;
        a.maxChargeCount = Math.round(a.maxChargeCount * 1.5);
        a.releaseSpeed *= 1.5;
      },
    },
  ],
};

export const ORBIT_TOWER_DEF: TowerDef = {
  id: 'orbit',
  name: 'Orbit Ring',
  description: 'Pulls nearby particles into a stable, spinning orbit.',
  baseCost: 0,
  upgrades: [
    {
      id: 'wider_orbit',
      label: 'Wider Orbit',
      description: 'Increases orbit radius by 20px.',
      cost: 40,
      applyUpgrade: (a) => { a.orbitRadius += 20; },
    },
    {
      id: 'faster_spin',
      label: 'Faster Spin',
      description: 'Increases tangential orbit speed.',
      cost: 80,
      applyUpgrade: (a) => { a.orbitSpeedMultiplier += 0.3; },
    },
    {
      id: 'dual_ring',
      label: 'Dual Ring',
      description: 'Adds a second orbit at 1.6x radius, capturing more particles.',
      cost: 140,
      applyUpgrade: (a) => { a.dualRingEnabled = true; },
    },
    {
      id: 'gravity_well',
      label: 'Gravity Well',
      description: 'Doubles centripetal pull strength, making orbits very stable.',
      cost: 220,
      applyUpgrade: (a) => { a.centripetalMultiplier *= 2; },
    },
  ],
};

export const TOWER_DEFS: Record<string, TowerDef> = {
  repulsor: REPULSOR_TOWER_DEF,
  vortex_cannon: VORTEX_TOWER_DEF,
  orbit: ORBIT_TOWER_DEF,
};

export function getTowerDef(towerId: string): TowerDef | null {
  return TOWER_DEFS[towerId] ?? null;
}
