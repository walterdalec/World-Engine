/**
 * Deterministic Test Utilities - World Engine
 * Provides seedable RNG and frozen time for reproducible tests
 */

/**
 * Xorshift32 PRNG - Fast, deterministic, good quality randomness
 * Based on George Marsaglia's paper
 */
export class Xor32 {
    private s: number;

    constructor(seed: number = 123456789) {
        // Ensure seed is never 0 (would break the algorithm)
        this.s = seed === 0 ? 1 : Math.abs(seed) >>> 0;
    }

    /**
     * Generate next random number [0, 1)
     */
    next(): number {
        let x = this.s | 0;
        x ^= x << 13;
        x ^= x >>> 17;
        x ^= x << 5;
        this.s = x | 0;
        return ((x >>> 0) % 1_000_000) / 1_000_000;
    }

    /**
     * Generate random integer in range [min, max]
     */
    nextInt(min: number, max: number): number {
        return Math.floor(this.next() * (max - min + 1)) + min;
    }

    /**
     * Generate random float in range [min, max)
     */
    nextFloat(min: number, max: number): number {
        return this.next() * (max - min) + min;
    }

    /**
     * Pick random element from array
     */
    choice<T>(array: T[]): T {
        return array[this.nextInt(0, array.length - 1)];
    }

    /**
     * Shuffle array in-place using Fisher-Yates algorithm
     */
    shuffle<T>(array: T[]): T[] {
        for (let i = array.length - 1; i > 0; i--) {
            const j = this.nextInt(0, i);
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    /**
     * Reset to initial seed
     */
    reset(seed?: number): void {
        this.s = seed === 0 ? 1 : Math.abs(seed || 123456789) >>> 0;
    }
}

// Global test RNG instance
let testRNG: Xor32 = new Xor32();
let testTime: number = Date.now();

/**
 * Set the global test RNG seed
 */
export function setTestRNG(seed: number): void {
    testRNG.reset(seed);

    // Override Math.random to use our deterministic RNG
    (global as any).Math.random = () => testRNG.next();
}

/**
 * Get the current test RNG instance
 */
export function getTestRNG(): Xor32 {
    return testRNG;
}

/**
 * Set frozen time for tests
 */
export function setTestTime(timestamp: number): void {
    testTime = timestamp;

    // Override Date.now and new Date() to return frozen time
    (global as any).Date.now = () => testTime;

    // Override performance.now() for consistent timing in tests
    if (typeof global !== 'undefined' && global.performance) {
        (global.performance as any).now = () => testTime;
    } else if (typeof window !== 'undefined' && window.performance) {
        (window.performance as any).now = () => testTime;
    }

    const OriginalDate = Date;
    (global as any).Date = class extends OriginalDate {
        constructor(...args: any[]) {
            if (args.length === 0) {
                super(testTime);
            } else {
                // @ts-ignore - Spread operator limitation workaround
                super(...(args as [any, ...any[]]));
            }
        }

        static now() {
            return testTime;
        }
    };

    // Copy static methods
    Object.setPrototypeOf(global.Date, OriginalDate);
    Object.defineProperty(global.Date, 'name', { value: 'Date' });
}

/**
 * Get the current frozen time
 */
export function getTestTime(): number {
    return testTime;
}

/**
 * Advance frozen time by specified milliseconds
 */
export function advanceTime(ms: number): void {
    testTime += ms;
    setTestTime(testTime);
}

/**
 * Fake current time utility (for use in application code during tests)
 */
export function fakeNow(): number {
    return testTime;
}

/**
 * Create a new RNG instance with a specific seed (useful for isolated tests)
 */
export function createSeededRNG(seed: number): Xor32 {
    return new Xor32(seed);
}

/**
 * Generate deterministic test data
 */
export const TestData = {
    /**
     * Generate a deterministic array of random numbers
     */
    randomNumbers(count: number, seed: number = 42): number[] {
        const rng = new Xor32(seed);
        return Array.from({ length: count }, () => rng.next());
    },

    /**
     * Generate deterministic test coordinates
     */
    hexPositions(count: number, seed: number = 42): Array<{ q: number; r: number }> {
        const rng = new Xor32(seed);
        return Array.from({ length: count }, () => ({
            q: rng.nextInt(-10, 10),
            r: rng.nextInt(-10, 10)
        }));
    },

    /**
     * Generate deterministic unit names
     */
    unitNames(count: number, seed: number = 42): string[] {
        const rng = new Xor32(seed);
        const prefixes = ['Sir', 'Lady', 'Captain', 'Lord', 'Dame'];
        const names = ['Gareth', 'Lyanna', 'Theron', 'Cassandra', 'Marcus'];
        const suffixes = ['the Bold', 'the Wise', 'the Swift', 'the Brave', 'the Just'];

        return Array.from({ length: count }, () => {
            const prefix = rng.choice(prefixes);
            const name = rng.choice(names);
            const suffix = rng.choice(suffixes);
            return `${prefix} ${name} ${suffix}`;
        });
    }
};