/**
 * Canvas 08 - Time System Exports
 * 
 * Deterministic simulation clock with pause, speed control, and idle policies.
 */

// Core clock
export { SimClock, getSimClock, resetSimClock, DT_FIXED } from './clock';

// Convenience functions
export {
    registerSystem,
    setSimSpeed,
    togglePause,
    onTimeEvent,
    onTick
} from './clock';

// Types
export type {
    SimSpeed,
    IdlePolicy,
    SystemOrder,
    SimClockState,
    TickContext,
    SystemSpec,
    RegisteredSystem,
    TimeEvent,
    TimeEventListener,
    CatchupConfig
} from './types';

// UI Components
export { TimeControls, useTimeControlsKeyboard, useSimClockState } from './TimeControls';
export type { TimeControlsProps } from './TimeControls';
