
import { createFormation, type Formation } from '../commander_v24/formations';
import type { CommanderIntent } from '../commander/types';

export type ScenarioKind = 'Siege' | 'Ambush' | 'Bridge';

export interface ScenarioPlan {
  intent: CommanderIntent;
  formation: Formation;
  rules: string[];
}

export function makeScenario(kind: ScenarioKind, anchor: { q: number; r: number }, facing: 0 | 1 | 2 | 3 | 4 | 5): ScenarioPlan {
  switch (kind) {
    case 'Siege':
      return {
        intent: { stance: 'Aggressive', objective: 'Seize', riskTolerance: 65 },
        formation: createFormation('Line', anchor, facing),
        rules: ['prefer_cover', 'focus_gate', 'avoid_murderholes'],
      };
    case 'Ambush':
      return {
        intent: { stance: 'Opportunistic', objective: 'Raid', riskTolerance: 55 },
        formation: createFormation('Wedge', anchor, facing),
        rules: ['alpha_strike', 'hit_and_fade', 'avoid_frontals'],
      };
    case 'Bridge':
    default:
      return {
        intent: { stance: 'Defensive', objective: 'Hold', riskTolerance: 50 },
        formation: createFormation('Column', anchor, facing),
        rules: ['chokepoint_hold', 'rotate_ranks', 'no_overextend'],
      };
  }
}

export function applyScenarioRules(plan: ScenarioPlan, scoring: Record<string, number>) {
  const next = { ...scoring };
  if (plan.rules.includes('prefer_cover')) next.Hold = (next.Hold ?? 0) + 5;
  if (plan.rules.includes('focus_gate')) next.AdvanceLine = (next.AdvanceLine ?? 0) + 4;
  if (plan.rules.includes('alpha_strike')) next.FocusFire = (next.FocusFire ?? 0) + 8;
  if (plan.rules.includes('chokepoint_hold')) next.Hold = (next.Hold ?? 0) + 10;
  return next;
}
