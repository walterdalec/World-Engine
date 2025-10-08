export {
  planSiegeTasks,
  assignTasks,
  moraleShockOnBreach,
  type UnitLite,
  type TaskPlan,
  type SiegeRole,
} from './tasks.siege';
export { computeSplitPlan, type SplitPlan } from './lanes.split';
export { pairKey, initBucket, updateBucket, type Bucket, type Coeffs } from './fit.autoresolve';
export { AutoResolveTuningPanel, type Coeffs as TuningCoeffs } from './panel.tuning';
export {
  attachV32,
  v32Tick,
  onBattleEnd_AutoFit,
  type V32Runtime,
} from './integrate';
export { snapshotV32 } from './devtools';
