/**
 * Deterministic Random Number Generator for tests and reproducible gameplay
 * Uses Xorshift32 algorithm for fast, deterministic pseudo-random numbers
 */

export interface RNG {
    /** Returns a random float in [0, 1) */
    next(): number;
    /** Returns a random integer in [min, max] inclusive */
    nextInt(_min: number, _max: number): number;
    /** Returns a random element from an array */
    choice<T>(_array: T[]): T;
    /** Shuffles an array in-place using Fisher-Yates */
    shuffle<T>(_array: T[]): T[];
}

/**
 * Xorshift32 - Fast, deterministic PRNG
 * Seeded RNG for reproducible test scenarios and gameplay
 * 
 * @example
 * const rng = new Xor32(12345);
 * const roll = rng.nextInt(1, 20); // Deterministic d20 roll
 */
export class Xor32 implements RNG {
    private s: number;

    constructor(seed: number = 123456789) {
        // Ensure seed is never 0 (degenerates to 0 forever)
        this.s = seed === 0 ? 1 : seed | 0;
    }

    /**
     * Generate next random float in [0, 1)
     * Uses xorshift32 algorithm for speed and determinism
     */
    next(): number {
        let x = this.s | 0;
        x ^= x << 13;
        x ^= x >>> 17;
        x ^= x << 5;
        this.s = x | 0;
        // Convert to [0, 1) by dividing by 2^32 (via modulo for safety)
        return ((x >>> 0) % 1_000_000) / 1_000_000;
    }

    /**
     * Generate random integer in [min, max] inclusive
     */
    nextInt(min: number, max: number): number {
        if (min > max) {
            throw new Error(`Invalid range: min (${min}) > max (${max})`);
        }
        const range = max - min + 1;
        return min + Math.floor(this.next() * range);
    }

    /**
     * Pick a random element from an array
     */
    choice<T>(array: T[]): T {
        if (array.length === 0) {
            throw new Error('Cannot choose from empty array');
        }
        const index = this.nextInt(0, array.length - 1);
        return array[index];
    }

    /**
     * Fisher-Yates shuffle - deterministic array shuffle
     */
    shuffle<T>(array: T[]): T[] {
        const result = [...array];
        for (let i = result.length - 1; i > 0; i--) {
            const j = this.nextInt(0, i);
            [result[i], result[j]] = [result[j], result[i]];
        }
        return result;
    }

    /**
     * Get current seed state (for save/restore)
     */
    getState(): number {
        return this.s;
    }

    /**
     * Restore RNG to a specific state
     */
    setState(state: number): void {
        this.s = state === 0 ? 1 : state | 0;
    }
}

/**
 * Global test RNG instance - can be reseeded for test isolation
 */
let _testRng: Xor32 | null = null;

/**
 * Get or create the global test RNG
 * Useful for test setup/teardown to ensure determinism
 */
export function getTestRNG(seed?: number): Xor32 {
    if (!_testRng || seed !== undefined) {
        _testRng = new Xor32(seed ?? 12345);
    }
    return _testRng;
}

/**
 * Reset test RNG to a known seed
 * Call this in beforeEach/afterEach for test isolation
 */
export function resetTestRNG(seed: number = 12345): void {
    _testRng = new Xor32(seed);
}

/**
 * Freeze time for tests - returns a constant timestamp
 * Useful for deterministic battle replay tests
 */
export function fakeNow(timestamp: number = 1234567890000): () => number {
    return () => timestamp;
}

/**
 * Create a test RNG that always returns the same value
 * Useful for edge case testing
 */
export class ConstantRNG implements RNG {
    constructor(private value: number = 0.5) {
        if (value < 0 || value >= 1) {
            throw new Error('ConstantRNG value must be in [0, 1)');
        }
    }

    next(): number {
        return this.value;
    }

    nextInt(min: number, max: number): number {
        const range = max - min + 1;
        return min + Math.floor(this.value * range);
    }

    choice<T>(array: T[]): T {
        if (array.length === 0) {
            throw new Error('Cannot choose from empty array');
        }
        return array[Math.floor(this.value * array.length)];
    }

    shuffle<T>(array: T[]): T[] {
        return [...array]; // No shuffle for constant RNG
    }
}
