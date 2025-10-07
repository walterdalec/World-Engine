
import type { UnitBlackboard } from './types';

export function snapshotUnit(bb: UnitBlackboard) {
  return {
    id: bb.myId,
    hp: bb.hp,
    morale: bb.morale,
    order: bb.currentOrder?.kind ?? 'None',
  };
}
