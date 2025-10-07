
import type { LearnState } from './learning';

export function snapshotLearning(state: LearnState) {
  return {
    commander: { ...state.commanderWeights },
    unitCount: Object.keys(state.unitWeights).length,
  };
}
