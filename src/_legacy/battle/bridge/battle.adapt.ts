
import type { BattleState } from '../types';

export function applyBattleModifiers(state: BattleState) {
  const modifiers = state.modifiers ?? [];
  const environment = state.environment;
  if (!environment) {
    state.modifiers = modifiers;
    return;
  }

  const weather = environment.weather;
  if (weather) {
    if (weather.precipitation > 70) modifiers.push({ type: 'Accuracy', value: -10 });
    if (weather.temperature < 0) modifiers.push({ type: 'Movement', value: -10 });
    if (weather.temperature > 30) modifiers.push({ type: 'Fatigue', value: +10 });
  }

  if ((environment.moraleShift ?? 0) < 0) {
    modifiers.push({ type: 'Morale', value: environment.moraleShift ?? 0 });
  }

  if ((environment.supplyShift ?? 0) < 0) {
    modifiers.push({ type: 'Stamina', value: environment.supplyShift ?? 0 });
  }

  state.modifiers = modifiers;
}
