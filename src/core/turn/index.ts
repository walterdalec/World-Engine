/**
 * Turn System - Complete Initiative & Timeline Management
 * Exports for TurnManager with Round and CT modes
 */

// Main facade
export { TurnManager } from './TurnManager';

// Types and interfaces
export type {
    UnitId,
    TeamId,
    UnitRef,
    InitiativeMode,
    PlannedAction,
    WorldState,
    ResolutionReport,
    EffectStep,
    TurnEvent,
    TurnHooks
} from './types';

// Schedulers (for advanced usage)
export { RoundScheduler } from './round.scheduler';
export { CTScheduler } from './ct.scheduler';

// Utilities
export { mulberry32 } from './rng';
export { ActionWindow } from './action.window';
export { validateAction } from './validation';
export { applySteps } from './apply';

// Timeline structures
export type { TimelineEntry } from './timeline.common';
export { fromUnit, TIEBREAK } from './timeline.common';