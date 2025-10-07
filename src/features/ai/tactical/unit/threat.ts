
import type { BattleState, Unit } from '../../../battle/types';
import type { UnitBlackboard } from './types';

export interface TargetScore {
  unitId: string;
  score: number;
  dist: number;
}

export function scoreTargets(state: BattleState, bb: UnitBlackboard): TargetScore[] {
  const enemies = state.units.filter((u) => u.faction !== bb.team && !u.isDead && u.pos);
  const scores: TargetScore[] = [];
  for (const enemy of enemies) {
    if (!enemy.pos) continue;
    const dist = hexDist(bb.pos, enemy.pos);
    const hp = enemy.stats.hp ?? enemy.stats.maxHp ?? 0;
    const maxHp = enemy.stats.maxHp ?? enemy.stats.hp ?? 1;
    const hpFactor = 1 - hp / maxHp;
    const rangeBias = dist <= bb.range ? 0.2 : -0.1 * Math.max(0, dist - bb.range);
    const focusBias = bb.currentOrder?.kind === 'FocusFire' && bb.currentOrder.targetUnitId === enemy.id ? 0.5 : 0;
    const score = 0.6 * hpFactor - 0.3 * dist + rangeBias + focusBias;
    scores.push({ unitId: enemy.id, score, dist });
  }
  return scores.sort((a, b) => b.score - a.score);
}

function hexDist(a: { q: number; r: number }, b: { q: number; r: number }): number {
  const ax = a.q;
  const ay = a.r;
  const az = -a.q - a.r;
  const bx = b.q;
  const by = b.r;
  const bz = -b.q - b.r;
  return Math.max(Math.abs(ax - bx), Math.abs(ay - by), Math.abs(az - bz));
}
