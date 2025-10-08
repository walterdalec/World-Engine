export {
  createSiegeGrid,
  registerSegment,
  damageSegment,
  edgeKey,
  cellKey,
  type SiegeGrid,
  type Segment,
  type SegmentKind,
  type Hex,
  type Edge,
} from './destructibles';
export { hasLOS, type LOSContext } from './los';
export { neighbors6, pathfind, passable } from './breach.path';
export { attachV31, v31Tick, onSiegeDamage, onTacticalOutcome, makePathContext, pathThroughSiege, type V31Runtime } from './integrate';
export { computeLaneHealth, reassignPrimary, type LaneState, type LaneHealth } from './lanes.dynamic';
export { calibrateCoeffs, ema, type AutoCoeffs, type TacticalOutcomeSnapshot, type EMA } from './calibrator';
export { snapshotV31 } from './devtools';
