/**
 * Canvas 08 - Time System Types
 * 
 * Deterministic simulation clock with pause, speed control, and idle policies.
 */

/**
 * Simulation speed multiplier
 * 0 = paused, 1 = normal, 2 = 2x speed, 4 = 4x speed
 */
export type SimSpeed = 0 | 1 | 2 | 4;

/**
 * System idle policy determines behavior during pause
 */
export type IdlePolicy = 
  | 'pause'    // Do not tick while simSpeed=0 (most game systems)
  | 'tick'     // Continue ticking (visual-only, no state changes)
  | 'catchup'; // Skip during pause, process backlog on resume

/**
 * System execution order within a fixed step
 */
export type SystemOrder = 'early' | 'main' | 'late';

/**
 * Core simulation clock state
 */
export interface SimClockState {
  /** Current sim speed multiplier (0 = paused) */
  speed: SimSpeed;
  
  /** Convenience flag (speed === 0) */
  paused: boolean;
  
  /** Total simulated time in seconds */
  timeSec: number;
  
  /** Current simulation day (1-based) */
  day: number;
  
  /** Current step index (monotonic counter) */
  stepIndex: number;
  
  /** Fixed time step for logic (1/30s = 33.333ms) */
  dtFixed: number;
  
  /** Accumulator for fixed timestep integration */
  accumulator: number;
  
  /** Last wall-clock timestamp (for delta calculation) */
  lastTimestamp: number;
}

/**
 * Context passed to each system during tick
 */
export interface TickContext {
  /** Fixed time step in seconds (always 1/30) */
  dt: number;
  
  /** Current step index */
  stepIndex: number;
  
  /** Total simulated time in seconds */
  timeSec: number;
  
  /** Current simulation day */
  day: number;
  
  /** Current sim speed */
  speed: SimSpeed;
  
  /** Whether currently paused */
  paused: boolean;
  
  /** Interpolation alpha for rendering (0-1) */
  alpha: number;
}

/**
 * System specification for registration
 */
export interface SystemSpec {
  /** Unique system identifier */
  id: string;
  
  /** Idle behavior during pause */
  idlePolicy: IdlePolicy;
  
  /** Execution order within fixed step */
  order: SystemOrder;
  
  /** Optional description */
  description?: string;
}

/**
 * Registered system with callback
 */
export interface RegisteredSystem extends SystemSpec {
  /** System callback invoked each tick */
  callback: (_ctx: TickContext) => void;
  
  /** Whether system is currently enabled */
  enabled: boolean;
  
  /** Catchup budget remaining (seconds, for catchup policy) */
  catchupBacklog?: number;
}

/**
 * Time-related events
 */
export type TimeEvent = 
  | { type: 'time/paused'; timestamp: number }
  | { type: 'time/resumed'; timestamp: number }
  | { type: 'time/speedChanged'; speed: SimSpeed; timestamp: number }
  | { type: 'idle/backlog'; systemId: string; backlogSec: number; timestamp: number }
  | { type: 'time/tick'; stepIndex: number; timeSec: number };

/**
 * Event listener callback
 */
export type TimeEventListener = (_event: TimeEvent) => void;

/**
 * Catchup configuration for systems
 */
export interface CatchupConfig {
  /** Maximum simulated time to process per real second (default: 1.0s) */
  maxCatchupSim: number;
  
  /** Maximum slice size per catchup batch (default: 5 * dtFixed) */
  maxSliceSec: number;
  
  /** Backlog threshold before warning (default: 5 seconds of backlog) */
  warningThreshold: number;
}
