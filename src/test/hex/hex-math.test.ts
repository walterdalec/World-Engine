/**
 * Hex coordinate math tests
 * Tests axial coordinate system, distance calculations, and neighbor finding
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Xor32 } from '../../core/utils/rng';

// Basic hex coordinate type
type HexCoord = { q: number; r: number };

// Helper functions to test (these would normally be imported from your hex math module)
function axialToCube(hex: HexCoord): { x: number; y: number; z: number } {
    const x = hex.q;
    const z = hex.r;
    const y = -x - z;
    return { x, y, z };
}

function cubeDistance(a: HexCoord, b: HexCoord): number {
    const ac = axialToCube(a);
    const bc = axialToCube(b);
    return Math.max(
        Math.abs(ac.x - bc.x),
        Math.abs(ac.y - bc.y),
        Math.abs(ac.z - bc.z)
    );
}

function hexNeighbors(hex: HexCoord): HexCoord[] {
    const directions = [
        { q: 1, r: 0 }, { q: 1, r: -1 }, { q: 0, r: -1 },
        { q: -1, r: 0 }, { q: -1, r: 1 }, { q: 0, r: 1 }
    ];
    return directions.map(d => ({ q: hex.q + d.q, r: hex.r + d.r }));
}

describe('Hex Coordinate Math', () => {
    describe('axialToCube', () => {
        it('converts origin correctly', () => {
            const cube = axialToCube({ q: 0, r: 0 });
            expect(cube).toEqual({ x: 0, y: 0, z: 0 });
        });

        it('maintains cube constraint (x + y + z = 0)', () => {
            const testCases: HexCoord[] = [
                { q: 1, r: 0 },
                { q: 0, r: 1 },
                { q: -1, r: 0 },
                { q: 3, r: -2 },
                { q: -5, r: 8 }
            ];

            testCases.forEach(hex => {
                const cube = axialToCube(hex);
                expect(cube.x + cube.y + cube.z).toBe(0);
            });
        });
    });

    describe('cubeDistance', () => {
        it('returns 0 for same hex', () => {
            const hex = { q: 3, r: 4 };
            expect(cubeDistance(hex, hex)).toBe(0);
        });

        it('returns 1 for adjacent hexes', () => {
            const center = { q: 0, r: 0 };
            const neighbors = hexNeighbors(center);

            neighbors.forEach(neighbor => {
                expect(cubeDistance(center, neighbor)).toBe(1);
            });
        });

        it('calculates distance correctly', () => {
            expect(cubeDistance({ q: 0, r: 0 }, { q: 3, r: 0 })).toBe(3);
            expect(cubeDistance({ q: 0, r: 0 }, { q: 0, r: 3 })).toBe(3);
            expect(cubeDistance({ q: 0, r: 0 }, { q: 3, r: -2 })).toBe(3);
        });

        it('is symmetric', () => {
            const a = { q: 2, r: 3 };
            const b = { q: 5, r: -1 };
            expect(cubeDistance(a, b)).toBe(cubeDistance(b, a));
        });
    });

    describe('hexNeighbors', () => {
        it('returns 6 neighbors', () => {
            const neighbors = hexNeighbors({ q: 0, r: 0 });
            expect(neighbors).toHaveLength(6);
        });

        it('returns unique neighbors', () => {
            const neighbors = hexNeighbors({ q: 5, r: 3 });
            const unique = new Set(neighbors.map(h => `${h.q},${h.r}`));
            expect(unique.size).toBe(6);
        });

        it('all neighbors are distance 1', () => {
            const center = { q: 2, r: -1 };
            const neighbors = hexNeighbors(center);

            neighbors.forEach(neighbor => {
                expect(cubeDistance(center, neighbor)).toBe(1);
            });
        });
    });
});

describe('Deterministic RNG', () => {
    let rng: Xor32;

    beforeEach(() => {
        // Reset RNG to known seed before each test
        rng = new Xor32(12345);
    });

    it('produces consistent sequence with same seed', () => {
        const rng1 = new Xor32(12345);
        const rng2 = new Xor32(12345);

        const sequence1 = Array.from({ length: 10 }, () => rng1.next());
        const sequence2 = Array.from({ length: 10 }, () => rng2.next());

        expect(sequence1).toEqual(sequence2);
    });

    it('produces different sequence with different seed', () => {
        const rng1 = new Xor32(12345);
        const rng2 = new Xor32(54321);

        const sequence1 = Array.from({ length: 10 }, () => rng1.next());
        const sequence2 = Array.from({ length: 10 }, () => rng2.next());

        expect(sequence1).not.toEqual(sequence2);
    });

    it('nextInt returns values in range', () => {
        const results = Array.from({ length: 100 }, () => rng.nextInt(1, 6));

        results.forEach(result => {
            expect(result).toBeGreaterThanOrEqual(1);
            expect(result).toBeLessThanOrEqual(6);
        });
    });

    it('choice picks from array deterministically', () => {
        const options = ['a', 'b', 'c', 'd', 'e'];
        const rng1 = new Xor32(99999);
        const rng2 = new Xor32(99999);

        expect(rng1.choice(options)).toBe(rng2.choice(options));
    });

    it('shuffle is deterministic', () => {
        const array = [1, 2, 3, 4, 5];
        const rng1 = new Xor32(77777);
        const rng2 = new Xor32(77777);

        expect(rng1.shuffle(array)).toEqual(rng2.shuffle(array));
    });

    it('can save and restore state', () => {
        rng.next();
        rng.next();
        const state = rng.getState();
        const value1 = rng.next();

        rng.setState(state);
        const value2 = rng.next();

        expect(value1).toBe(value2);
    });
});
