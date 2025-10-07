export { attachV30, v30Tick, pickPrimaryLane, type V30Runtime } from './integrate';
export { createField, addThreat, addSupport, addIntent, addCover, addHazard, scoreHex, decay, type ThreatField, type FieldCell, type Hex } from './field';
export { makeLanes, sampleAlong, type Lane, type LaneId } from './lanes';
export { registerSiege, planBreach, tickTask, type SiegeObj, type Task, type SiegeObjKind, type TaskKind } from './siege';
export { applyRails, DIFF, type Rails, type Difficulty } from './rails';
export { simulate, calibrateFromBattle, type ArmySummary, type AutoConfig, type AutoResult, type UnitSummary } from './autoresolve';
export { snapshotV30 } from './devtools';
