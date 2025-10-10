/**
 * Canvas 11 - Progression System Exports
 * 
 * Public API for progression system with XP, levels, scars, death, and revival
 */

// Re-export all types
export type {
    ProgressionState,
    ProgressionEvent,
    XPSource,
    XPFormula,
    LevelUpChoice,
    Wound,
    DamageTag,
    Mod,
    Scar,
    Curse,
    DeathRecord,
    RevivalAttempt,
    RevivalPath
} from './types';

// Re-export constants
export {
    DEFAULT_XP_FORMULA,
    SCAR_LIMITS,
    BURNOUT_THRESHOLDS
} from './types';

// Re-export API systems
export {
    // Event bus
    subscribeToProgressionEvents,
    emitProgressionEvent,
    
    // System interfaces
    XPSystem,
    LevelingSystem,
    BurnoutSystem,
    InjurySystem,
    DeathSystem,
    ScarSystem,
    RevivalSystem,
    CurseSystem,
    
    // High-level workflows
    grantPartyXP,
    processPartyInjuries,
    performRevival,
    processExpiredCurses,
    processDailyBurnoutRecovery
} from './api';
