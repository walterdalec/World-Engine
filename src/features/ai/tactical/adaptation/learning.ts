
import type { UnitIntent } from '../unit/types';

export interface UnitWeights {
  aggression: number;
  caution: number;
  focus: number;
  cohesion: number;
}

export interface CommanderWeights {
  aggression: number;
  discipline: number;
  focus: number;
}

export interface LearnState {
  unitWeights: Record<string, UnitWeights>;
  commanderWeights: CommanderWeights;
}

export function createLearnState(): LearnState {
  return {
    unitWeights: {},
    commanderWeights: { aggression: 0, discipline: 0, focus: 0 },
  };
}

export function rewardUnit(state: LearnState, unitId: string, delta: Partial<UnitWeights>) {
  const weights = (state.unitWeights[unitId] ??= {
    aggression: 0,
    caution: 0,
    focus: 0,
    cohesion: 0,
  });
  if (delta.aggression) weights.aggression += delta.aggression;
  if (delta.caution) weights.caution += delta.caution;
  if (delta.focus) weights.focus += delta.focus;
  if (delta.cohesion) weights.cohesion += delta.cohesion;
}

export function rewardCommander(state: LearnState, delta: Partial<CommanderWeights>) {
  const commander = state.commanderWeights;
  commander.aggression += delta.aggression ?? 0;
  commander.discipline += delta.discipline ?? 0;
  commander.focus += delta.focus ?? 0;
}

export function onDamageDealt(state: LearnState, unitId: string, amount: number) {
  rewardUnit(state, unitId, { aggression: amount * 0.02, focus: 0.01 });
}

export function onDamageTaken(state: LearnState, unitId: string, amount: number) {
  rewardUnit(state, unitId, { caution: amount * 0.02, cohesion: 0.01 });
}

export function onKill(state: LearnState, unitId: string) {
  rewardUnit(state, unitId, { aggression: 0.5, focus: 0.2 });
}

export function onFriendlyDown(state: LearnState, unitId: string) {
  rewardUnit(state, unitId, { caution: 0.3 });
}

export function onObjectiveProgress(state: LearnState, commanderInvolved: boolean) {
  if (commanderInvolved) rewardCommander(state, { discipline: 0.5, focus: 0.3 });
}

export function applyLearnedBias(state: LearnState, unitId: string, intent: UnitIntent): UnitIntent {
  const weights = state.unitWeights[unitId];
  if (!weights) return intent;
  const adjusted: UnitIntent = { ...intent };
  if (adjusted.kind === 'Attack') {
    adjusted.urgency += weights.aggression * 2;
  }
  if (adjusted.kind === 'Retreat') {
    adjusted.urgency += weights.caution * 2;
  }
  if (adjusted.kind === 'Move') {
    adjusted.urgency += weights.cohesion;
  }
  return adjusted;
}
