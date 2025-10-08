import type { Hex } from '../v30/field';

export interface StandardBearer {
  id: string;
  pos: Hex;
  radius: number;
  boost: number;
  alive: boolean;
}

export function auraFromStandard(bearers: StandardBearer[], unitPos: Hex): number {
  return bearers
    .filter(bearer => bearer.alive)
    .reduce((sum, bearer) => {
      const d = hexDist(bearer.pos, unitPos);
      if (d > bearer.radius) return sum;
      const falloff = 1 - d / Math.max(1, bearer.radius);
      return sum + bearer.boost * falloff;
    }, 0);
}

export function moralePulseFromStandards(state: any): void {
  const bearers = (state.units ?? []).filter((unit: any) => unit.role === 'StandardBearer' && !unit.isDead);
  if (!bearers.length) return;
  for (const unit of state.units ?? []) {
    if (!unit?.pos || !unit?.aiMorale) continue;
    const aura = auraFromStandard(bearers, unit.pos);
    if (aura > 0) {
      unit.aiMorale.value = Math.min(100, (unit.aiMorale.value ?? 0) + aura * 0.5);
    }
  }
}

function hexDist(a: Hex, b: Hex): number {
  const ax = a.q;
  const ay = a.r;
  const az = -ax - ay;
  const bx = b.q;
  const by = b.r;
  const bz = -bx - by;
  return Math.max(Math.abs(ax - bx), Math.abs(ay - by), Math.abs(az - bz));
}
