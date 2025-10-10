/**
 * XORShift128+ RNG
 * Canvas 04 - Deterministic random number generation
 * Fast, deterministic PRNG for world generation
 */

export class XORShift128 {
    private s0: number;
    private s1: number;

    constructor(seed: number) {
        // Initialize state from seed
        this.s0 = seed >>> 0;
        this.s1 = (seed * 1103515245 + 12345) >>> 0;

        // Warm up the generator
        for (let i = 0; i < 10; i++) {
            this.next();
        }
    }

    /**
     * Generate next random uint32
     */
    next(): number {
        let s1 = this.s0;
        const s0 = this.s1;
        this.s0 = s0;
        s1 ^= s1 << 23;
        s1 ^= s1 >>> 17;
        s1 ^= s0;
        s1 ^= s0 >>> 26;
        this.s1 = s1;
        return (this.s0 + this.s1) >>> 0;
    }

    /**
     * Generate random float [0, 1)
     */
    float(): number {
        return this.next() / 0x100000000;
    }

    /**
     * Generate random integer [min, max)
     */
    int(min: number, max: number): number {
        return Math.floor(this.float() * (max - min)) + min;
    }

    /**
     * Generate random float [min, max)
     */
    range(min: number, max: number): number {
        return this.float() * (max - min) + min;
    }
}

/**
 * Hash a chunk key to a seed
 */
export function hashChunkKey(chunkX: number, chunkY: number): number {
    // Simple hash combining x and y
    let h = 0x9e3779b9;
    h ^= chunkX * 0x85ebca6b;
    h ^= chunkY * 0xc2b2ae35;
    h = (h ^ (h >>> 16)) >>> 0;
    return h;
}

/**
 * Create seeded RNG for a chunk
 */
export function createChunkRNG(worldSeed: number, chunkX: number, chunkY: number): XORShift128 {
    const chunkHash = hashChunkKey(chunkX, chunkY);
    const seed = (worldSeed ^ chunkHash) >>> 0;
    return new XORShift128(seed);
}
