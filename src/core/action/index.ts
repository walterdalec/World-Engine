/**
 * Action System - Main Export
 * Pure TypeScript, engine‑agnostic action system with deterministic validation and resolution
 */

// Core types
export type {
    Axial,
    ActionKind,
    TargetPattern,
    PlannedAction,
    ValidationResult,
    WorldUnit,
    WorldState,
    EffectStep,
    ResolutionReport
} from './types';

// Delta system
export type { Delta, DeltaBatch } from './deltas';
export { applyDelta } from './deltas';

// Hex utilities
export {
    axial,
    axialDistance,
    hexLine,
    hexRingAt,
    hexBlastAt,
    neighbors,
    los
} from './hex';

// Targeting selectors
export {
    selectSingle,
    selectLine,
    selectBlast,
    selectCone,
    selectRing,
    selectSelf,
    selectMulti
} from './selectors';

// Validators
export {
    validateAP,
    validateLOS,
    validateRange,
    validateStatus,
    validateMoveCollision,
    validatePassable,
    validateMana,
    validateAlive
} from './validators';

// Effects
export {
    effectMove,
    effectAttack,
    effectDefend,
    effectCast,
    effectCommand,
    effectRally,
    effectFlee,
    effectWait,
    effectUse,
    effectOpportunityAttack
} from './effects';

// Adjacency helpers
export {
    adjacentEnemiesOf,
    adjacentAlliesOf,
    adjacentUnitsOf
} from './adjacency';

// Resolution system
export {
    resolveSimultaneous,
    applyResolution
} from './resolver';

// Logging
export { CombatLog, logEvt } from './log';