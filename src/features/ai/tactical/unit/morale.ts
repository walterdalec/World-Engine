
import type { UnitIntent, UnitBlackboard } from './types';

export function convertRetreatToPath(bb: UnitBlackboard): UnitIntent {
  return {
    unitId: bb.myId,
    kind: 'Move',
    targetHex: { q: bb.pos.q - 1, r: bb.pos.r },
    urgency: 95,
  };
}

export function postCombatMoraleAdjust(bb: UnitBlackboard, damageTaken: number) {
  const delta = Math.round(damageTaken * 0.3);
  bb.morale = Math.max(0, bb.morale - delta);
}
