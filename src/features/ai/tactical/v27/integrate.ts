
import { derivePsyche } from './psyche';
import { makeThresholds, type Thresholds } from './thresholds';
import type { ScenarioKind } from './maneuvers.scenario';

export interface V27Runtime {
  psyche: ReturnType<typeof derivePsyche>;
  thresholds: Thresholds;
  scenario?: ScenarioKind;
}

export function attachV27(brain: any, state: any) {
  const personality = state.context?.personality;
  const psyche = derivePsyche(personality);
  brain.v27 = {
    psyche,
    thresholds: makeThresholds({ fallback: 12, rally: 8, advance: 2, rotate: 6 }, psyche),
    scenario: brain.v26?.scenario,
  } as V27Runtime;
}

export function v27Tick(brain: any, state: any) {
  if (!brain.v27) return;
  state.events.push({ t: state.time ?? 0, kind: 'PsycheSnapshot', psyche: brain.v27.psyche });
}
