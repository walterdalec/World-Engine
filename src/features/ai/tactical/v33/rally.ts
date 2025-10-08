import { statusOf } from './morale';

export function shouldRally(turn: number, laneCollapsed: boolean, routingCount: number, shakenRatio: number): boolean {
  if (routingCount >= 2) return true;
  if (laneCollapsed) return true;
  if (shakenRatio > 0.4) return true;
  return false;
}

export function applyRally(units: any[], center: { q: number; r: number }, radius = 4, amount = 18) {
  const affected: Array<{ id: string; morale: any }> = [];
  for (const unit of units) {
    if (!unit?.pos || !unit?.aiMorale) continue;
    if (hexDist(unit.pos, center) > radius) continue;
    const nextValue = Math.min(100, (unit.aiMorale.value ?? 0) + amount);
    const nextStatus = statusOf(nextValue);
    const next = {
      ...unit.aiMorale,
      value: nextValue,
      status: nextStatus,
    };
    if (next.status === 'Routing') {
      next.status = 'Wavering';
      next.regroupTimer = 1;
    }
    unit.aiMorale = next;
    affected.push({ id: unit.id, morale: next });
  }
  return { kind: 'Rally', center, radius, amount, affected };
}

function hexDist(a: { q: number; r: number }, b: { q: number; r: number }): number {
  const ax = a.q;
  const ay = a.r;
  const az = -ax - ay;
  const bx = b.q;
  const by = b.r;
  const bz = -bx - by;
  return Math.max(Math.abs(ax - bx), Math.abs(ay - by), Math.abs(az - bz));
}
