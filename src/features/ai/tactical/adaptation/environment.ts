
import type { BattleState } from '../../../battle/types';
import type { UnitBlackboard, UnitIntent } from '../unit/types';

export function adaptToEnvironment(state: BattleState, _bb: UnitBlackboard, base: UnitIntent): UnitIntent {
  const weather = state.environment?.weather;
  if (!weather) return base;
  if (weather.precipitation > 70 && base.kind === 'Attack') {
    return { ...base, kind: 'Hold', urgency: base.urgency - 10 };
  }
  if (weather.temperature > 30 && base.kind === 'Move') {
    return { ...base, urgency: base.urgency - 5 };
  }
  return base;
}
