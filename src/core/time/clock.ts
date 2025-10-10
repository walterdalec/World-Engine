/**
 * Canvas 08 - Simulation Clock Implementation
 * 
 * Deterministic fixed-timestep clock with pause/resume and speed control.
 * Uses accumulator pattern for stable physics-style integration.
 */

import type {
    SimClockState,
    SimSpeed,
    TickContext,
    SystemSpec,
    RegisteredSystem,
    SystemOrder,
    TimeEvent,
    TimeEventListener,
    CatchupConfig
} from './types';

/**
 * Fixed logic timestep (1/30s = 33.333ms)
 * All gameplay logic advances in whole fixed steps
 */
export const DT_FIXED = 1 / 30;

/**
 * Default catchup configuration
 */
const DEFAULT_CATCHUP_CONFIG: CatchupConfig = {
    maxCatchupSim: 1.0,        // 1 second of sim per real second
    maxSliceSec: 5 * DT_FIXED, // 5 fixed steps max per batch
    warningThreshold: 5.0       // Warn if backlog exceeds 5 seconds
};

/**
 * SimClock - Deterministic simulation clock with pause and speed control
 */
export class SimClock {
    private state: SimClockState;
    private systems: Map<string, RegisteredSystem>;
    private systemsByOrder: Map<SystemOrder, RegisteredSystem[]>;
    private listeners: Set<TimeEventListener>;
    private catchupConfig: CatchupConfig;
    private backlogWarningCount: Map<string, number>;

    constructor(initialDay: number = 1, initialTimeSec: number = 0) {
        this.state = {
            speed: 1,
            paused: false,
            timeSec: initialTimeSec,
            day: initialDay,
            stepIndex: 0,
            dtFixed: DT_FIXED,
            accumulator: 0,
            lastTimestamp: performance.now()
        };

        this.systems = new Map();
        this.systemsByOrder = new Map([
            ['early', []],
            ['main', []],
            ['late', []]
        ]);
        this.listeners = new Set();
        this.catchupConfig = { ...DEFAULT_CATCHUP_CONFIG };
        this.backlogWarningCount = new Map();
    }

    // ===== PUBLIC API =====

    /**
     * Register a system to run during fixed ticks
     */
    registerSystem(spec: SystemSpec, callback: (_ctx: TickContext) => void): () => void {
        if (this.systems.has(spec.id)) {
            console.warn(`[SimClock] System "${spec.id}" already registered, replacing`);
        }

        const system: RegisteredSystem = {
            ...spec,
            callback,
            enabled: true,
            catchupBacklog: spec.idlePolicy === 'catchup' ? 0 : undefined
        };

        this.systems.set(spec.id, system);

        // Add to order bucket
        const bucket = this.systemsByOrder.get(spec.order);
        if (bucket) {
            bucket.push(system);
        }

        // Return unregister function
        return () => this.unregisterSystem(spec.id);
    }

    /**
     * Unregister a system
     */
    unregisterSystem(id: string): boolean {
        const system = this.systems.get(id);
        if (!system) return false;

        this.systems.delete(id);

        // Remove from order bucket
        const bucket = this.systemsByOrder.get(system.order);
        if (bucket) {
            const index = bucket.indexOf(system);
            if (index >= 0) bucket.splice(index, 1);
        }

        return true;
    }

    /**
     * Enable or disable a system without unregistering
     */
    setSystemEnabled(id: string, enabled: boolean): boolean {
        const system = this.systems.get(id);
        if (!system) return false;

        system.enabled = enabled;
        return true;
    }

    /**
     * Set simulation speed (0 = paused, 1 = normal, 2 = 2x, 4 = 4x)
     */
    setSimSpeed(speed: SimSpeed): void {
        if (this.state.speed === speed) return;

        const wasPaused = this.state.paused;
        this.state.speed = speed;
        this.state.paused = speed === 0;

        this.emitEvent({
            type: 'time/speedChanged',
            speed,
            timestamp: performance.now()
        });

        // Handle pause/resume transitions
        if (wasPaused && !this.state.paused) {
            this.emitEvent({
                type: 'time/resumed',
                timestamp: performance.now()
            });
        } else if (!wasPaused && this.state.paused) {
            this.emitEvent({
                type: 'time/paused',
                timestamp: performance.now()
            });
        }
    }

    /**
     * Toggle pause state
     */
    togglePause(): void {
        this.setSimSpeed(this.state.paused ? 1 : 0);
    }

    /**
     * Add event listener
     */
    addEventListener(listener: TimeEventListener): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    /**
     * Get current clock state (read-only)
     */
    getState(): Readonly<SimClockState> {
        return { ...this.state };
    }

    /**
     * Get interpolation alpha for smooth rendering
     * Returns value between 0-1 representing position between fixed steps
     */
    getAlpha(): number {
        return this.state.accumulator / this.state.dtFixed;
    }

    /**
     * Main update loop - call once per render frame
     * Uses accumulator pattern for fixed timestep integration
     */
    update(currentTimestamp: number = performance.now()): void {
        // Calculate frame delta
        const frameDt = (currentTimestamp - this.state.lastTimestamp) / 1000;
        this.state.lastTimestamp = currentTimestamp;

        // Cap frame delta to prevent spiral of death
        const cappedDt = Math.min(frameDt, 0.25); // Max 250ms per frame

        // Accumulate time scaled by sim speed
        this.state.accumulator += cappedDt * this.state.speed;

        // Process fixed steps
        let stepsProcessed = 0;
        const maxStepsPerFrame = 10; // Safety limit

        while (this.state.accumulator >= this.state.dtFixed && stepsProcessed < maxStepsPerFrame) {
            this.fixedUpdate();
            this.state.accumulator -= this.state.dtFixed;
            stepsProcessed++;
        }

        // If we hit max steps, drain accumulator to prevent buildup
        if (stepsProcessed >= maxStepsPerFrame) {
            this.state.accumulator = 0;
            console.warn('[SimClock] Hit max steps per frame, draining accumulator');
        }
    }

    /**
     * Force advance simulation by a number of fixed steps (for testing)
     */
    advanceSteps(count: number): void {
        for (let i = 0; i < count; i++) {
            this.fixedUpdate();
        }
    }

    /**
     * Update catchup configuration
     */
    setCatchupConfig(config: Partial<CatchupConfig>): void {
        this.catchupConfig = { ...this.catchupConfig, ...config };
    }

    // ===== INTERNAL METHODS =====

    /**
     * Single fixed timestep update
     * Runs all registered systems in order
     */
    private fixedUpdate(): void {
        this.state.stepIndex++;
        this.state.timeSec += this.state.dtFixed;

        // Update day counter (86400 seconds per day)
        const newDay = Math.floor(this.state.timeSec / 86400) + 1;
        if (newDay !== this.state.day) {
            this.state.day = newDay;
        }

        // Build tick context
        const ctx: TickContext = {
            dt: this.state.dtFixed,
            stepIndex: this.state.stepIndex,
            timeSec: this.state.timeSec,
            day: this.state.day,
            speed: this.state.speed,
            paused: this.state.paused,
            alpha: this.getAlpha()
        };

        // Execute systems in order: early → main → late
        for (const order of ['early', 'main', 'late'] as SystemOrder[]) {
            const systems = this.systemsByOrder.get(order);
            if (!systems) continue;

            for (const system of systems) {
                if (!system.enabled) continue;

                // Check idle policy
                if (this.state.paused && system.idlePolicy === 'pause') {
                    continue; // Skip paused systems
                }

                // Handle catchup systems
                if (system.idlePolicy === 'catchup') {
                    this.processCatchupSystem(system, ctx);
                } else {
                    // Normal execution
                    try {
                        system.callback(ctx);
                    } catch (error) {
                        console.error(`[SimClock] Error in system "${system.id}":`, error);
                    }
                }
            }
        }

        // Emit tick event
        this.emitEvent({
            type: 'time/tick',
            stepIndex: this.state.stepIndex,
            timeSec: this.state.timeSec
        });
    }

    /**
     * Process catchup system with budget management
     */
    private processCatchupSystem(system: RegisteredSystem, _ctx: TickContext): void {
        if (system.catchupBacklog === undefined) {
            system.catchupBacklog = 0;
        }

        // If paused, accumulate backlog
        if (this.state.paused) {
            system.catchupBacklog += this.state.dtFixed;
            return;
        }

        // On resume, process backlog within budget
        if (system.catchupBacklog > 0) {
            const budget = this.catchupConfig.maxCatchupSim * this.state.dtFixed;
            const slice = Math.min(
                system.catchupBacklog,
                budget,
                this.catchupConfig.maxSliceSec
            );

            // Process slice
            try {
                // Create modified context with catchup flag
                const catchupCtx: TickContext = {
                    ..._ctx,
                    dt: slice
                };
                system.callback(catchupCtx);
                system.catchupBacklog -= slice;
            } catch (error) {
                console.error(`[SimClock] Error in catchup system "${system.id}":`, error);
                system.catchupBacklog = 0; // Reset on error
            }

            // Check for persistent backlog (warning condition)
            if (system.catchupBacklog > this.catchupConfig.warningThreshold) {
                const count = this.backlogWarningCount.get(system.id) || 0;
                this.backlogWarningCount.set(system.id, count + 1);

                if (count >= 5) {
                    this.emitEvent({
                        type: 'idle/backlog',
                        systemId: system.id,
                        backlogSec: system.catchupBacklog,
                        timestamp: performance.now()
                    });
                    this.backlogWarningCount.set(system.id, 0); // Reset counter
                }
            } else {
                this.backlogWarningCount.set(system.id, 0);
            }
        }
    }

    /**
     * Emit event to all listeners
     */
    private emitEvent(event: TimeEvent): void {
        const listenersArray = Array.from(this.listeners);
        for (const listener of listenersArray) {
            try {
                listener(event);
            } catch (error) {
                console.error('[SimClock] Error in event listener:', error);
            }
        }
    }
}

// ===== SINGLETON INSTANCE =====

let globalClock: SimClock | null = null;

/**
 * Get or create the global simulation clock
 */
export function getSimClock(): SimClock {
    if (!globalClock) {
        globalClock = new SimClock();
    }
    return globalClock;
}

/**
 * Reset the global simulation clock (for testing)
 */
export function resetSimClock(): void {
    globalClock = null;
}

// ===== CONVENIENCE FUNCTIONS =====

/**
 * Register a system on the global clock
 */
export function registerSystem(spec: SystemSpec, callback: (_ctx: TickContext) => void): () => void {
    return getSimClock().registerSystem(spec, callback);
}

/**
 * Set simulation speed on the global clock
 */
export function setSimSpeed(speed: SimSpeed): void {
    getSimClock().setSimSpeed(speed);
}

/**
 * Toggle pause on the global clock
 */
export function togglePause(): void {
    getSimClock().togglePause();
}

/**
 * Add event listener to the global clock
 */
export function onTimeEvent(listener: TimeEventListener): () => void {
    return getSimClock().addEventListener(listener);
}

/**
 * Subscribe to tick events on the global clock
 */
export function onTick(callback: (_dtFixed: number, _stepIndex: number) => void): () => void {
    return getSimClock().addEventListener((event) => {
        if (event.type === 'time/tick') {
            callback(DT_FIXED, event.stepIndex);
        }
    });
}
