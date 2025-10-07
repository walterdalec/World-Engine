
import { planCollapseToAnchor, planRefuseFlank, planStagedAdvance, type ManeuverPlan } from '../formations_v25/maneuvers';
import type { Formation } from '../commander_v24/formations';
import type { DangerMap } from '../commander_v24/memory';
import { dangerAt } from '../commander_v24/memory';

export type ScenarioKind = 'Siege' | 'Ambush' | 'Bridge';

export function scenarioPlans(kind: ScenarioKind, current: Formation, danger: DangerMap): ManeuverPlan[] {
  switch (kind) {
    case 'Siege':
      return siegePlans(current, danger);
    case 'Ambush':
      return ambushPlans(current);
    case 'Bridge':
    default:
      return bridgePlans(current);
  }
}

function siegePlans(current: Formation, danger: DangerMap): ManeuverPlan[] {
  const frontHeat = dangerAt(danger, current.anchor);
  if (frontHeat < 2) return [planStagedAdvance(current)];
  return [planRefuseFlank(current, danger, true)];
}

function ambushPlans(current: Formation): ManeuverPlan[] {
  return [planStagedAdvance(current)];
}

function bridgePlans(current: Formation): ManeuverPlan[] {
  return [planCollapseToAnchor(current)];
}
