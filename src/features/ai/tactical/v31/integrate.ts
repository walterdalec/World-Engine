import {
  createSiegeGrid,
  registerSegment,
  damageSegment,
  type SiegeGrid,
  type Segment,
} from './destructibles';
import { neighbors6, pathfind, type PathContext } from './breach.path';
import { computeLaneHealth, reassignPrimary, type LaneState } from './lanes.dynamic';
import { calibrateCoeffs, type AutoCoeffs, type TacticalOutcomeSnapshot } from './calibrator';

export interface V31Runtime {
  siege: SiegeGrid;
  coeffs: AutoCoeffs;
  laneStates: LaneState[];
}

export function attachV31(brain: any, state: any): void {
  if (!brain) return;
  const siege = createSiegeGrid();
  const segments: Segment[] = state?.siege?.segments ?? state?.siege?.objects ?? [];
  for (const seg of segments) {
    registerSegment(siege, seg);
  }

  brain.v31 = {
    siege,
    coeffs: {
      kAtk: 1,
      kDef: 1,
      kRange: 0.1,
      kFocus: 0.05,
      rounds: 8,
    },
    laneStates: [],
  } as V31Runtime;
}

export function v31Tick(brain: any, state: any): void {
  if (!brain?.v30 || !brain?.v31) return;
  const runtime: V31Runtime = brain.v31;

  const laneStates = computeLaneHealth(brain, state);
  runtime.laneStates = laneStates;
  if (!laneStates.length) return;

  const previous = brain.v30.primary;
  const reassigned = reassignPrimary(brain, laneStates);
  if (reassigned && reassigned !== previous) {
    pushEvent(state, { kind: 'LaneSwitch', lane: reassigned });
  }
}

export function onSiegeDamage(brain: any, state: any, id: string, dps: number): boolean {
  if (!brain?.v31) return false;
  const res = damageSegment(brain.v31.siege, id, dps);
  if (res.destroyed) {
    pushEvent(state, { kind: 'Breach', id });
  }
  return res.destroyed;
}

export function onTacticalOutcome(brain: any, outcome: TacticalOutcomeSnapshot): AutoCoeffs | undefined {
  if (!brain?.v31) return undefined;
  brain.v31.coeffs = calibrateCoeffs(brain.v31.coeffs, outcome);
  return brain.v31.coeffs;
}

export function makePathContext(brain: any, neighbors: (hex: any) => any = neighbors6): PathContext | undefined {
  if (!brain?.v31) return undefined;
  return {
    neighbors,
    blockedEdges: brain.v31.siege.blockedEdges,
    blockedCells: brain.v31.siege.blockedCells,
  };
}

export function pathThroughSiege(brain: any, start: any, goal: any): any[] {
  const ctx = makePathContext(brain);
  if (!ctx) return [start];
  return pathfind(ctx, start, goal);
}

function pushEvent(state: any, evt: any): void {
  if (!state) return;
  const events = Array.isArray(state.events) ? state.events : (state.events = []);
  events.push({ t: state.time ?? 0, ...evt });
}
