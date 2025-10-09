/**
 * Deterministic RNG for World Generation
 * TODO #11 — Overworld Procedural Generation
 * 
 * Implements splitmix32 and mulberry32 for seeded, reproducible generation
 * with jumpable streams for parallel chunk generation.
 */

export interface SeededRng {
    next(): number;           // Returns 0-1 float
    pick<T>(_arr: T[]): T;     // Pick random element
    range(_min: number, _max: number): number;  // Random integer in range
    bool(_chance?: number): boolean;           // Random boolean (default 50%)
    seed: number;             // Current seed state for debugging
}

/**
 * High-quality 32-bit PRNG based on splitmix32
 * Platform-stable, period 2^32, excellent distribution
 */
export function splitmix32(seed: number): SeededRng {
    let state = seed >>> 0; // Ensure 32-bit unsigned

    const next = (): number => {
        state = (state + 0x9e3779b9) >>> 0;
        let z = state;
        z = (z ^ (z >>> 16)) >>> 0;
        z = Math.imul(z, 0x21f0aaad);
        z = (z ^ (z >>> 15)) >>> 0;
        z = Math.imul(z, 0x735a2d97);
        z = (z ^ (z >>> 15)) >>> 0;
        return z / 0x100000000; // Convert to 0-1 float
    };

    const pick = <T>(arr: T[]): T => {
        if (arr.length === 0) throw new Error('Cannot pick from empty array');
        return arr[Math.floor(next() * arr.length)];
    };

    const range = (min: number, max: number): number => {
        return Math.floor(next() * (max - min + 1)) + min;
    };

    const bool = (chance: number = 0.5): boolean => {
        return next() < chance;
    };

    return {
        next,
        pick,
        range,
        bool,
        get seed() { return state; }
    };
}

/**
 * Create a child RNG stream derived from parent
 * Enables parallel chunk generation with deterministic results
 */
export function childRng(parent: SeededRng, salt: string | number): SeededRng {
    // Hash the salt to create deterministic child seed
    const saltNum = typeof salt === 'string' ? hashString(salt) : salt;
    const childSeed = (parent.seed ^ saltNum) >>> 0;
    return splitmix32(childSeed);
}

/**
 * Simple string hash for deterministic salt conversion
 */
function hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    return hash >>> 0; // Ensure unsigned
}

/**
 * Global RNG instance for world generation
 * Can be re-seeded for different worlds
 */
let globalRng: SeededRng | null = null;

export function initGlobalRng(seed: number): void {
    globalRng = splitmix32(seed);
}

export function getGlobalRng(): SeededRng {
    if (!globalRng) {
        throw new Error('Global RNG not initialized. Call initGlobalRng(seed) first.');
    }
    return globalRng;
}

/**
 * Create deterministic RNG for specific chunk coordinates
 */
export function chunkRng(globalSeed: number, chunkX: number, chunkY: number): SeededRng {
    const rng = splitmix32(globalSeed);
    const chunkSalt = `chunk:${chunkX},${chunkY}`;
    return childRng(rng, chunkSalt);
}

/**
 * Weighted random selection from array of items with weights
 */
export function weightedPick<T>(items: T[], weights: number[], rng: SeededRng): T {
    if (items.length !== weights.length) {
        throw new Error('Items and weights arrays must be same length');
    }
    if (items.length === 0) {
        throw new Error('Cannot pick from empty arrays');
    }

    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    if (totalWeight <= 0) {
        throw new Error('Total weight must be positive');
    }

    let random = rng.next() * totalWeight;
    for (let i = 0; i < items.length; i++) {
        random -= weights[i];
        if (random <= 0) {
            return items[i];
        }
    }

    // Fallback to last item (should never happen with proper weights)
    return items[items.length - 1];
}