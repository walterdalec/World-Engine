
import type { BattleState } from '../../../battle/types';
import type { Hex } from './types';

export function pathTo(state: BattleState, from: Hex, to: Hex): Hex[] {
  const pathfinder = (state as any).pathfind;
  if (typeof pathfinder === 'function') {
    const result = pathfinder.call(state, from, to);
    if (Array.isArray(result)) return result;
  }
  return [from, to];
}

export function firstStep(state: BattleState, from: Hex, to: Hex): Hex {
  const path = pathTo(state, from, to);
  return path[1] ?? from;
}
