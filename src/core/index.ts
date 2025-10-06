// Core types and configurations
export * from './types';
export * from './config';
export * from './utils';

// Export engine with explicit exports to avoid conflicts
export { WorldEngine } from './engine';
export type {
    Character,
    Party,
    GameTime,
    Weather,
    EncounterClock,
    Encounter,
    EngineConfig,
    GameState
} from './engine';

// Turn system (TODO #03)
export * from './turn';

// Action system (TODO #04) - explicit exports to avoid conflicts
export {
    // Core types (prefixed to avoid conflicts with turn system)
    type Axial,
    type ActionKind,
    type TargetPattern,
    type ValidationResult,
    type WorldUnit,

    // Delta system
    type Delta,
    type DeltaBatch,
    applyDelta,

    // Hex utilities
    axial,
    axialDistance,
    hexLine,
    hexRingAt,
    hexBlastAt,
    neighbors,
    los,

    // Targeting selectors
    selectSingle,
    selectLine,
    selectBlast,
    selectCone,
    selectRing,
    selectSelf,
    selectMulti,

    // Validators
    validateAP,
    validateLOS,
    validateRange,
    validateStatus,
    validateMoveCollision,
    validatePassable,
    validateMana,
    validateAlive,

    // Effects
    effectMove,
    effectAttack,
    effectDefend,
    effectCast,
    effectCommand,
    effectRally,
    effectFlee,
    effectWait,
    effectUse,
    effectOpportunityAttack,

    // Adjacency helpers
    adjacentEnemiesOf,
    adjacentAlliesOf,
    adjacentUnitsOf,

    // Resolution system
    resolveSimultaneous,
    applyResolution,

    // Logging
    CombatLog,
    logEvt
} from './action';

// Unit Model, Stats & Damage (TODO #06)
export * from './unit';

// Terrain System (TODO #05)
export * from './terrain';