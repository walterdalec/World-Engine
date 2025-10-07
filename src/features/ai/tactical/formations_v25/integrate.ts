
import type { CommanderBrain } from '../commander';
import { assignSlots } from './manager';
import { planCollapseToAnchor, planRefuseFlank, planStagedAdvance } from './maneuvers';
import { emitGesture } from './gestures';
import { pruneDanger } from './perf';
import { scenarioPlans } from '../v27/maneuvers.scenario';

export function commanderManeuverTick(brain: CommanderBrain, state: any, units: { id: string; role: string }[]) {
  const v24 = (brain as any).v24;
  if (!v24) return;

  pruneDanger(v24.danger);

  const thresholds = ((brain as any).v27?.thresholds ?? { fallback: 12, rotate: 6, advance: 2 });
  const hotCells = Object.keys(v24.danger.heat ?? {}).length;
  if (hotCells > thresholds.fallback) {
    const plan = planCollapseToAnchor(v24.formation);
    v24.formation = plan.formation;
    emitGesture(state, 'A', 'collapse', { reason: plan.reason });
  } else if (hotCells > thresholds.rotate) {
    const plan = planRefuseFlank(v24.formation, v24.danger, true);
    v24.formation = plan.formation;
    emitGesture(state, 'A', 'refuse_left', { reason: plan.reason });
  } else if (hotCells > thresholds.advance) {
    const plan = planStagedAdvance(v24.formation);
    v24.formation = plan.formation;
    emitGesture(state, 'A', 'advance_stage', {});
  }

  if ((brain as any).v26?.scenario) {
    const plans = scenarioPlans((brain as any).v26.scenario, v24.formation, v24.danger);
    if (plans.length) {
      const plan = plans[0];
      v24.formation = plan.formation;
      const gesture = plan.type === 'CollapseToAnchor' ? 'collapse' : plan.type === 'RefuseFlank' ? 'refuse_left' : plan.type === 'StagedAdvance' ? 'advance_stage' : 'rotate';
      emitGesture(state, 'A', gesture as any, { reason: plan.reason, scenario: (brain as any).v26.scenario });
    }
  }

  const desired = assignSlots(v24.formation, units as any);
  const events = ((state as any).events ??= []);
  events.push({ t: (state as any).time ?? 0, kind: 'FormationAssign', side: 'A', desired });
}
