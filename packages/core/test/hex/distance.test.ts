/**
 * Tests for Hex Distance and Neighbor Operations
 */

import { describe, it, expect } from 'vitest';
import { axial, cube } from '../src/hex/types';
import {
    cubeDistance,
    axialDistance,
    axialAdd,
    axialSubtract,
    axialScale,
    neighbors,
    neighbor,
    axialEquals,
    axialManhattan
} from '../src/hex/distance';
import { AXIAL_DIRS } from '../src/hex/directions';

describe('Hex Distance and Neighbors', () => {
    describe('distance calculations', () => {
        it('calculates cube distance correctly', () => {
            const a = cube(0, 0, 0);
            const b = cube(2, -1, -1);

            expect(cubeDistance(a, b)).toBe(2);
        });

        it('calculates axial distance correctly', () => {
            const a = axial(0, 0);
            const b = axial(3, -1);

            expect(axialDistance(a, b)).toBe(3);
        });

        it('handles same-hex distance', () => {
            const hex = axial(5, -2);
            expect(axialDistance(hex, hex)).toBe(0);
        });

        it('calculates Manhattan distance', () => {
            const a = axial(0, 0);
            const b = axial(3, -1);

            expect(axialManhattan(a, b)).toBe(4); // |3| + |-1| = 4
        });
    });

    describe('coordinate arithmetic', () => {
        it('adds coordinates correctly', () => {
            const a = axial(2, -1);
            const b = axial(1, 3);
            const sum = axialAdd(a, b);

            expect(sum.q).toBe(3);
            expect(sum.r).toBe(2);
        });

        it('subtracts coordinates correctly', () => {
            const a = axial(5, 2);
            const b = axial(2, -1);
            const diff = axialSubtract(a, b);

            expect(diff.q).toBe(3);
            expect(diff.r).toBe(3);
        });

        it('scales coordinates correctly', () => {
            const hex = axial(2, -3);
            const scaled = axialScale(hex, 2);

            expect(scaled.q).toBe(4);
            expect(scaled.r).toBe(-6);
        });

        it('handles zero scaling', () => {
            const hex = axial(5, -2);
            const scaled = axialScale(hex, 0);

            expect(scaled.q).toBe(0);
            expect(scaled.r).toBe(0);
        });
    });

    describe('neighbor operations', () => {
        it('returns 6 neighbors in correct order', () => {
            const hex = axial(0, 0);
            const neighs = neighbors(hex);

            expect(neighs).toHaveLength(6);

            // Check against expected directions
            for (let i = 0; i < 6; i++) {
                const expected = axialAdd(hex, AXIAL_DIRS[i]);
                expect(neighs[i].q).toBe(expected.q);
                expect(neighs[i].r).toBe(expected.r);
            }
        });

        it('gets single neighbor by direction', () => {
            const hex = axial(2, -1);

            // Direction 0 should be East (q+1, r+0)
            const east = neighbor(hex, 0);
            expect(east.q).toBe(3);
            expect(east.r).toBe(-1);

            // Direction 3 should be West (q-1, r+0)
            const west = neighbor(hex, 3);
            expect(west.q).toBe(1);
            expect(west.r).toBe(-1);
        });

        it('throws error for invalid direction', () => {
            const hex = axial(0, 0);

            expect(() => neighbor(hex, -1)).toThrow('Direction must be 0-5');
            expect(() => neighbor(hex, 6)).toThrow('Direction must be 0-5');
        });

        it('neighbors are at distance 1', () => {
            const hex = axial(3, -2);
            const neighs = neighbors(hex);

            neighs.forEach(n => {
                expect(axialDistance(hex, n)).toBe(1);
            });
        });
    });

    describe('equality comparison', () => {
        it('detects equal coordinates', () => {
            const a = axial(3, -1);
            const b = axial(3, -1);

            expect(axialEquals(a, b)).toBe(true);
        });

        it('detects unequal coordinates', () => {
            const a = axial(3, -1);
            const b = axial(3, 0);
            const c = axial(2, -1);

            expect(axialEquals(a, b)).toBe(false);
            expect(axialEquals(a, c)).toBe(false);
        });

        it('handles origin comparison', () => {
            const origin1 = axial(0, 0);
            const origin2 = axial(0, 0);

            expect(axialEquals(origin1, origin2)).toBe(true);
        });
    });
});