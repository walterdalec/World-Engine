
import type { BattleState } from '../../../battle/types';
import type { UnitBlackboard, UnitIntent } from './types';
import { scoreTargets } from './threat';
import { firstStep } from './path';
import { enforceCohesion } from './cohesion';

export function decideIntent(state: BattleState, bb: UnitBlackboard): UnitIntent {
  if (shouldRetreat(bb)) {
    return { unitId: bb.myId, kind: 'Retreat', urgency: 90 };
  }

  if (bb.currentOrder?.kind === 'HoldPosition') {
    return { unitId: bb.myId, kind: 'Hold', urgency: 50 };
  }

  if (bb.currentOrder?.kind === 'AdvanceLine') {
    const dest = bb.currentOrder.targetHex;
    if (dest) {
      const step = firstStep(state, bb.pos, dest);
      const safe = enforceCohesion(state, bb, step);
      return { unitId: bb.myId, kind: 'Move', targetHex: safe, urgency: 70 };
    }
  }

  const targets = scoreTargets(state, bb);
  const primary = targets[0];
  if (primary && primary.dist <= bb.range) {
    return { unitId: bb.myId, kind: 'Attack', targetUnitId: primary.unitId, urgency: 80 };
  }

  if (primary && primary.dist > 0) {
    const step = firstStep(state, bb.pos, estimateEnemyHex(state, primary.unitId) ?? bb.pos);
    const safe = enforceCohesion(state, bb, step);
    return { unitId: bb.myId, kind: 'Move', targetHex: safe, urgency: 65 };
  }

  return { unitId: bb.myId, kind: 'Hold', urgency: 20 };
}

function shouldRetreat(bb: UnitBlackboard) {
  const hpRatio = bb.maxHp > 0 ? bb.hp / bb.maxHp : 1;
  return hpRatio <= 0.25 || bb.morale <= 20;
}

function estimateEnemyHex(state: BattleState, unitId: string) {
  const enemy = state.units.find((u) => u.id === unitId);
  return enemy?.pos ?? null;
}
