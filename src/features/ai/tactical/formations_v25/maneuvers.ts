
import { createFormation, type Formation } from '../commander_v24/formations';
import type { DangerMap } from '../commander_v24/memory';
import { dangerAt } from '../commander_v24/memory';

export type Maneuver = 'Rotate' | 'RefuseFlank' | 'StagedAdvance' | 'CollapseToAnchor';

export interface ManeuverPlan {
  type: Maneuver;
  formation: Formation;
  reason: string;
}

export function planRotate(current: Formation, steps: 1 | 2 | 3): ManeuverPlan {
  const facing = ((current.facing + steps) % 6) as Formation['facing'];
  return { type: 'Rotate', formation: { ...current, facing }, reason: `rotate_${steps}` };
}

export function planRefuseFlank(current: Formation, danger: DangerMap, left: boolean): ManeuverPlan {
  const delta = left ? { q: -1, r: 0 } : { q: 1, r: 0 };
  const candidate = { q: current.anchor.q + delta.q, r: current.anchor.r + delta.r };
  if (dangerAt(danger, candidate) > dangerAt(danger, current.anchor)) {
    const opposite = { q: current.anchor.q - delta.q, r: current.anchor.r - delta.r };
    return { type: 'RefuseFlank', formation: { ...current, anchor: opposite }, reason: 'refuse_opposite' };
  }
  return { type: 'RefuseFlank', formation: { ...current, anchor: candidate }, reason: 'refuse_flank' };
}

export function planStagedAdvance(current: Formation): ManeuverPlan {
  const forward = stepAlongFacing(current.anchor, current.facing, 1);
  return { type: 'StagedAdvance', formation: { ...current, anchor: forward }, reason: 'advance_stage' };
}

export function planCollapseToAnchor(current: Formation): ManeuverPlan {
  const back = stepAlongFacing(current.anchor, current.facing, -1);
  const trimmedLayout = current.layout.slice(0, Math.max(3, Math.floor(current.layout.length * 0.7)));
  return { type: 'CollapseToAnchor', formation: { ...current, anchor: back, layout: trimmedLayout }, reason: 'collapse' };
}

function stepAlongFacing(hex: { q: number; r: number }, facing: Formation['facing'], direction: 1 | -1) {
  const dirs = [
    { q: 1, r: 0 },
    { q: 1, r: -1 },
    { q: 0, r: -1 },
    { q: -1, r: 0 },
    { q: -1, r: 1 },
    { q: 0, r: 1 },
  ];
  const dir = dirs[facing];
  return { q: hex.q + dir.q * direction, r: hex.r + dir.r * direction };
}
