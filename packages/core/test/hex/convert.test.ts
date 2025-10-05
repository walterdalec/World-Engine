/**
 * Tests for Hex Coordinate Conversions
 */

import { describe, it, expect } from 'vitest';
import { axial, cube, offset } from '../src/hex/types';
import {
    axialToCube,
    cubeToAxial,
    axialToOffset,
    offsetToAxial,
    cubeToOffset,
    offsetToCube
} from '../src/hex/convert';

describe('Hex Coordinate Conversions', () => {
    describe('axial ↔ cube conversions', () => {
        it('converts axial to cube correctly', () => {
            const ax = axial(3, -1);
            const cb = axialToCube(ax);

            expect(cb.x).toBe(3);
            expect(cb.y).toBe(-2); // y = -x - z = -3 - (-1) = -2
            expect(cb.z).toBe(-1);
            expect(cb.x + cb.y + cb.z).toBe(0);
        });

        it('converts cube to axial correctly', () => {
            const cb = cube(2, -3, 1);
            const ax = cubeToAxial(cb);

            expect(ax.q).toBe(2);
            expect(ax.r).toBe(1);
        });

        it('round-trip conversion preserves values', () => {
            const original = axial(5, -2);
            const converted = cubeToAxial(axialToCube(original));

            expect(converted.q).toBe(original.q);
            expect(converted.r).toBe(original.r);
        });

        it('handles origin correctly', () => {
            const origin = axial(0, 0);
            const cubeOrigin = axialToCube(origin);

            expect(cubeOrigin.x).toBe(0);
            expect(cubeOrigin.y).toBe(0);
            expect(cubeOrigin.z).toBe(0);
        });
    });

    describe('axial ↔ offset conversions', () => {
        it('converts axial to offset correctly', () => {
            // Test case: q=3, r=2 (even row)
            const ax1 = axial(3, 2);
            const off1 = axialToOffset(ax1);
            expect(off1.col).toBe(4); // 3 + (2 - 0) / 2 = 4
            expect(off1.row).toBe(2);

            // Test case: q=3, r=3 (odd row)
            const ax2 = axial(3, 3);
            const off2 = axialToOffset(ax2);
            expect(off2.col).toBe(4); // 3 + (3 - 1) / 2 = 4
            expect(off2.row).toBe(3);
        });

        it('converts offset to axial correctly', () => {
            // Test case: col=4, row=2 (even row)
            const off1 = offset(4, 2);
            const ax1 = offsetToAxial(off1);
            expect(ax1.q).toBe(3); // 4 - (2 - 0) / 2 = 3
            expect(ax1.r).toBe(2);

            // Test case: col=4, row=3 (odd row)
            const off2 = offset(4, 3);
            const ax2 = offsetToAxial(off2);
            expect(ax2.q).toBe(3); // 4 - (3 - 1) / 2 = 3
            expect(ax2.r).toBe(3);
        });

        it('round-trip conversion preserves values', () => {
            const original = axial(-2, 5);
            const converted = offsetToAxial(axialToOffset(original));

            expect(converted.q).toBe(original.q);
            expect(converted.r).toBe(original.r);
        });

        it('handles origin correctly', () => {
            const origin = axial(0, 0);
            const offsetOrigin = axialToOffset(origin);

            expect(offsetOrigin.col).toBe(0);
            expect(offsetOrigin.row).toBe(0);
        });
    });

    describe('cube ↔ offset conversions', () => {
        it('converts cube to offset via axial', () => {
            const cb = cube(1, -2, 1);
            const off = cubeToOffset(cb);

            // Should be equivalent to axialToOffset(cubeToAxial(cb))
            const ax = cubeToAxial(cb);
            const expectedOff = axialToOffset(ax);

            expect(off.col).toBe(expectedOff.col);
            expect(off.row).toBe(expectedOff.row);
        });

        it('converts offset to cube via axial', () => {
            const off = offset(3, 4);
            const cb = offsetToCube(off);

            // Should be equivalent to axialToCube(offsetToAxial(off))
            const ax = offsetToAxial(off);
            const expectedCb = axialToCube(ax);

            expect(cb.x).toBe(expectedCb.x);
            expect(cb.y).toBe(expectedCb.y);
            expect(cb.z).toBe(expectedCb.z);
        });

        it('maintains cube constraint through conversion', () => {
            const off = offset(7, -3);
            const cb = offsetToCube(off);

            expect(cb.x + cb.y + cb.z).toBe(0);
        });
    });
});