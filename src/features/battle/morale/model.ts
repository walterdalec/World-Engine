/**
 * Morale System Model - Types, Thresholds, States
 * TODO #10 — Morale & Psychology — Deep Spec v2
 */

export type MoraleState = 'steady' | 'shaken' | 'wavering' | 'routing';

export interface MoraleBlock {
    value: number;        // 0..100 (can overshoot pre-clamp)
    state: MoraleState;
    ema: number;          // exponential moving average (0..100)
    history: number[];    // recent raw values for debugging
    lastFactors: MoraleFactors; // telemetry of components
    locked?: boolean;     // for cutscenes/scripted moments (unused now)
}

export interface MoraleFactors {
    leadership: number;   // +
    terrain: number;      // +/−
    casualties: number;   // − recent damage/deaths near unit
    outnumbered: number;  // − local ratio penalty
    effects: number;      // + rally / − fear etc.
}

export const Thresholds = {
    enter: { shaken: 65, wavering: 45, routing: 25 },  // go down when <= value
    exit: { shaken: 72, wavering: 52, routing: 32 },  // recover when >= value
    clamp: { min: 0, max: 100 },
    emaAlpha: 0.5
} as const;

export const FactorCaps = {
    leadership: { min: 0, max: 15 },
    terrain: { min: -10, max: 10 },
    casualties: { min: -25, max: 0 },
    outnumbered: { min: -20, max: 0 },
    effects: { min: -25, max: 25 }
} as const;

export const DefaultMorale: MoraleBlock = {
    value: 70,
    state: 'steady',
    ema: 70,
    history: [],
    lastFactors: {
        leadership: 0,
        terrain: 0,
        casualties: 0,
        outnumbered: 0,
        effects: 0
    }
};

/**
 * Serialize morale block for save games
 */
export function serializeMorale(morale: MoraleBlock): string {
    return JSON.stringify({
        value: morale.value,
        state: morale.state,
        ema: morale.ema,
        history: morale.history.slice(-3), // Keep last 3 for debugging
        lastFactors: morale.lastFactors,
        locked: morale.locked
    });
}

/**
 * Deserialize morale block from save games
 */
export function deserializeMorale(data: string): MoraleBlock {
    try {
        const parsed = JSON.parse(data);
        return {
            value: parsed.value || 70,
            state: parsed.state || 'steady',
            ema: parsed.ema || 70,
            history: parsed.history || [],
            lastFactors: parsed.lastFactors || DefaultMorale.lastFactors,
            locked: parsed.locked
        };
    } catch {
        return { ...DefaultMorale };
    }
}

/**
 * Clamp a factor value to its defined bounds
 */
export function clampFactor(factorType: keyof MoraleFactors, value: number): number {
    const caps = FactorCaps[factorType];
    return Math.max(caps.min, Math.min(caps.max, value));
}