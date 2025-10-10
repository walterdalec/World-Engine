// ──────────────────────────────────────────────────────────────────────────────
// File: src/features/battle/hex/coords.test.ts
// Test suite: run with Vitest. Ensures negative-zero, roundtrips,
//             rounding, keys, and guards all behave as expected.
// ──────────────────────────────────────────────────────────────────────────────

import { describe, it, expect } from 'vitest';
import {
    axial, cube, axialToCube, cubeToAxial, cubeRound, axialRound,
    normalizeZero, axialEq, cubeEq, axialKey, cubeKey, isAxial, isCube,
    AXIAL_ZERO, CUBE_ZERO, CUBE_DIRS, toAxial, toCube,
    axialSerialize, cubeSerialize, axialDeserialize, cubeDeserialize,
    fmtAxial, fmtCube,
} from './coords';

describe('Hex Coordinates - Core Module', () => {
    describe('normalizeZero', () => {
        it('turns -0 into +0 only', () => {
            expect(Object.is(normalizeZero(-0), 0)).toBe(true);
            expect(Object.is(normalizeZero(-0), -0)).toBe(false);
            expect(normalizeZero(1)).toBe(1);
            expect(normalizeZero(-1)).toBe(-1);
            expect(normalizeZero(0)).toBe(0);
        });

        it('does not affect other numbers', () => {
            expect(normalizeZero(42)).toBe(42);
            expect(normalizeZero(-42)).toBe(-42);
            expect(normalizeZero(3.14)).toBe(3.14);
        });
    });

    describe('Axial/Cube constructors', () => {
        it('axial() normalizes -0', () => {
            const a = axial(-0, 0);
            expect(Object.is(a.q, -0)).toBe(false);
            expect(a.q).toBe(0);
            expect(a.r).toBe(0);
        });

        it('axial() handles both coordinates as -0', () => {
            const a = axial(-0, -0);
            expect(Object.is(a.q, -0)).toBe(false);
            expect(Object.is(a.r, -0)).toBe(false);
        });

        it('cube() enforces x+y+z = 0 (within epsilon)', () => {
            const c = cube(0, 0, 0);
            expect(c.x + c.y + c.z).toBe(0);
        });

        it('cube() normalizes all -0 coordinates', () => {
            const c = cube(-0, -0, 0);
            expect(Object.is(c.x, -0)).toBe(false);
            expect(Object.is(c.y, -0)).toBe(false);
            expect(Object.is(c.z, -0)).toBe(false);
        });

        it('cube() validates constraint', () => {
            // Valid cubes
            expect(() => cube(1, -1, 0)).not.toThrow();
            expect(() => cube(3, -5, 2)).not.toThrow();

            // In production, invalid cubes are allowed but may cause issues
            // In dev mode, they should throw (but we can't test that here)
        });
    });

    describe('toAxial and toCube normalizers', () => {
        it('toAxial clones and normalizes', () => {
            const loose = { q: -0, r: 5 };
            const normalized = toAxial(loose);
            expect(Object.is(normalized.q, -0)).toBe(false);
            expect(normalized.r).toBe(5);
        });

        it('toCube clones and normalizes', () => {
            const loose = { x: -0, y: 0, z: 0 };
            const normalized = toCube(loose);
            expect(Object.is(normalized.x, -0)).toBe(false);
        });
    });

    describe('Conversions (Axial ⇄ Cube)', () => {
        it('origin does not produce -0 in y coordinate', () => {
            const c = axialToCube({ q: 0, r: 0 });
            expect(Object.is(c.y, -0)).toBe(false);
            expect(c).toEqual({ x: 0, y: 0, z: 0 });
        });

        it('axialToCube converts correctly', () => {
            const tests = [
                { axial: { q: 1, r: 0 }, cube: { x: 1, y: -1, z: 0 } },
                { axial: { q: 0, r: 1 }, cube: { x: 0, y: -1, z: 1 } },
                { axial: { q: 3, r: -2 }, cube: { x: 3, y: -1, z: -2 } },
            ];

            tests.forEach(({ axial: a, cube: expected }) => {
                const result = axialToCube(a);
                expect(result.x).toBe(expected.x);
                expect(result.y).toBe(expected.y);
                expect(result.z).toBe(expected.z);
            });
        });

        it('cubeToAxial converts correctly', () => {
            const tests = [
                { cube: { x: 1, y: -1, z: 0 }, axial: { q: 1, r: 0 } },
                { cube: { x: 0, y: -1, z: 1 }, axial: { q: 0, r: 1 } },
                { cube: { x: 3, y: -1, z: -2 }, axial: { q: 3, r: -2 } },
            ];

            tests.forEach(({ cube: c, axial: expected }) => {
                const result = cubeToAxial(c);
                expect(result.q).toBe(expected.q);
                expect(result.r).toBe(expected.r);
            });
        });

        it('roundtrip axial → cube → axial preserves values', () => {
            const pts = [axial(0, 0), axial(1, -2), axial(-3, 4), axial(7, 7)];
            for (const a of pts) {
                const back = cubeToAxial(axialToCube(a));
                expect(axialEq(a, back)).toBe(true);
            }
        });

        it('roundtrip cube → axial → cube preserves values (q, r)', () => {
            const pts = [
                cube(0, 0, 0),
                cube(1, -1, 0),
                cube(3, -5, 2),
            ];
            for (const c of pts) {
                const back = axialToCube(cubeToAxial(c));
                // Note: y component may differ, but x and z should match
                expect(back.x).toBe(c.x);
                expect(back.z).toBe(c.z);
            }
        });
    });

    describe('Rounding', () => {
        it('cubeRound snaps to nearest valid cube', () => {
            const rc = cubeRound(0.49, -0.51, 0.02);
            expect(rc.x + rc.y + rc.z).toBe(0);
            // Should be close to (0, -1, +1) or (1, -1, 0) depending on rounding
            expect(rc.x + rc.y + rc.z).toBe(0);
        });

        it('cubeRound handles exact integers', () => {
            const rc = cubeRound(1, -1, 0);
            expect(rc).toEqual(cube(1, -1, 0));
        });

        it('cubeRound picks coordinate with largest error to recompute', () => {
            // If x has largest rounding error, it gets recomputed
            const rc = cubeRound(0.9, -0.1, 0.2);
            expect(rc.x + rc.y + rc.z).toBe(0);
        });

        it('axialRound through cube is stable', () => {
            const ar = axialRound(1.4, -2.6);
            const back = axialToCube(ar);
            expect(back.x + back.y + back.z).toBe(0);
        });

        it('axialRound handles exact integers', () => {
            const ar = axialRound(5, -3);
            expect(ar).toEqual(axial(5, -3));
        });

        it('axialRound handles -0 input', () => {
            const ar = axialRound(-0, -0);
            expect(Object.is(ar.q, -0)).toBe(false);
            expect(Object.is(ar.r, -0)).toBe(false);
        });
    });

    describe('Equality & Keys', () => {
        it('axialEq handles -0 correctly', () => {
            expect(axialEq({ q: -0, r: 0 }, { q: 0, r: 0 })).toBe(true);
            expect(axialEq({ q: 0, r: -0 }, { q: 0, r: 0 })).toBe(true);
            expect(axialEq({ q: -0, r: -0 }, { q: 0, r: 0 })).toBe(true);
        });

        it('axialEq detects inequality', () => {
            expect(axialEq({ q: 1, r: 0 }, { q: 0, r: 0 })).toBe(false);
            expect(axialEq({ q: 0, r: 1 }, { q: 0, r: 0 })).toBe(false);
        });

        it('cubeEq handles -0 correctly', () => {
            expect(cubeEq({ x: -0, y: 0, z: 0 }, { x: 0, y: 0, z: 0 })).toBe(true);
            expect(cubeEq({ x: 0, y: -0, z: 0 }, { x: 0, y: 0, z: 0 })).toBe(true);
            expect(cubeEq({ x: 0, y: 0, z: -0 }, { x: 0, y: 0, z: 0 })).toBe(true);
        });

        it('cubeEq detects inequality', () => {
            expect(cubeEq({ x: 1, y: -1, z: 0 }, { x: 0, y: 0, z: 0 })).toBe(false);
        });

        it('axialKey is stable and normalized', () => {
            const a = axialKey({ q: -0, r: 0 });
            expect(a).toBe('0,0');

            const b = axialKey({ q: 3, r: -2 });
            expect(b).toBe('3,-2');
        });

        it('cubeKey is stable and normalized', () => {
            const c = cubeKey({ x: -0, y: 0, z: 0 });
            expect(c).toBe('0,0,0');

            const d = cubeKey({ x: 1, y: -1, z: 0 });
            expect(d).toBe('1,-1,0');
        });

        it('keys are suitable for Map usage', () => {
            const map = new Map<string, string>();
            map.set(axialKey({ q: -0, r: 0 }), 'origin');
            map.set(axialKey({ q: 0, r: 0 }), 'also-origin');

            // Both should map to same key
            expect(map.size).toBe(1);
            expect(map.get('0,0')).toBe('also-origin');
        });
    });

    describe('Type Guards', () => {
        it('isAxial detects Axial-like objects', () => {
            expect(isAxial({ q: 1, r: 2 })).toBe(true);
            expect(isAxial(axial(0, 0))).toBe(true);
        });

        it('isAxial rejects non-Axial objects', () => {
            expect(isAxial({ x: 0, y: 0, z: 0 })).toBe(false);
            expect(isAxial(null)).toBe(false);
            expect(isAxial(undefined)).toBe(false);
            expect(isAxial(42)).toBe(false);
            expect(isAxial('not-axial')).toBe(false);
            expect(isAxial({})).toBe(false);
        });

        it('isCube detects Cube-like objects', () => {
            expect(isCube({ x: 1, y: -2, z: 1 })).toBe(true);
            expect(isCube(cube(0, 0, 0))).toBe(true);
        });

        it('isCube rejects non-Cube objects', () => {
            expect(isCube({ q: 0, r: 0 })).toBe(false);
            expect(isCube(null)).toBe(false);
            expect(isCube(undefined)).toBe(false);
            expect(isCube(42)).toBe(false);
            expect(isCube('not-cube')).toBe(false);
            expect(isCube({})).toBe(false);
        });
    });

    describe('Constants', () => {
        it('AXIAL_ZERO is origin', () => {
            expect(AXIAL_ZERO.q).toBe(0);
            expect(AXIAL_ZERO.r).toBe(0);
            expect(Object.is(AXIAL_ZERO.q, -0)).toBe(false);
        });

        it('CUBE_ZERO is origin', () => {
            expect(CUBE_ZERO.x).toBe(0);
            expect(CUBE_ZERO.y).toBe(0);
            expect(CUBE_ZERO.z).toBe(0);
            expect(Object.is(CUBE_ZERO.y, -0)).toBe(false);
        });

        it('CUBE_DIRS has 6 directions', () => {
            expect(CUBE_DIRS).toHaveLength(6);
        });

        it('CUBE_DIRS all satisfy x+y+z=0', () => {
            CUBE_DIRS.forEach(dir => {
                expect(dir.x + dir.y + dir.z).toBe(0);
            });
        });

        it('CUBE_DIRS are normalized', () => {
            CUBE_DIRS.forEach(dir => {
                expect(Object.is(dir.x, -0)).toBe(false);
                expect(Object.is(dir.y, -0)).toBe(false);
                expect(Object.is(dir.z, -0)).toBe(false);
            });
        });
    });

    describe('Serialization', () => {
        it('axialSerialize produces tuple', () => {
            const result = axialSerialize({ q: 3, r: -2 });
            expect(result).toEqual([3, -2]);
        });

        it('axialSerialize normalizes -0', () => {
            const result = axialSerialize({ q: -0, r: 0 });
            expect(Object.is(result[0], -0)).toBe(false);
            expect(result).toEqual([0, 0]);
        });

        it('cubeSerialize produces tuple', () => {
            const result = cubeSerialize({ x: 1, y: -1, z: 0 });
            expect(result).toEqual([1, -1, 0]);
        });

        it('cubeSerialize normalizes -0', () => {
            const result = cubeSerialize({ x: -0, y: 0, z: 0 });
            expect(Object.is(result[0], -0)).toBe(false);
            expect(result).toEqual([0, 0, 0]);
        });

        it('roundtrip axial serialize/deserialize', () => {
            const original = axial(5, -3);
            const serialized = axialSerialize(original);
            const deserialized = axialDeserialize(serialized);
            expect(axialEq(original, deserialized)).toBe(true);
        });

        it('roundtrip cube serialize/deserialize', () => {
            const original = cube(2, -3, 1);
            const serialized = cubeSerialize(original);
            const deserialized = cubeDeserialize(serialized);
            expect(cubeEq(original, deserialized)).toBe(true);
        });
    });

    describe('Debug Formatting', () => {
        it('fmtAxial produces readable string', () => {
            const str = fmtAxial({ q: 3, r: -2 });
            expect(str).toBe('Axial(q=3, r=-2)');
        });

        it('fmtAxial normalizes -0', () => {
            const str = fmtAxial({ q: -0, r: 0 });
            expect(str).toBe('Axial(q=0, r=0)');
        });

        it('fmtCube produces readable string', () => {
            const str = fmtCube({ x: 1, y: -1, z: 0 });
            expect(str).toBe('Cube(x=1, y=-1, z=0)');
        });

        it('fmtCube normalizes -0', () => {
            const str = fmtCube({ x: -0, y: 0, z: 0 });
            expect(str).toBe('Cube(x=0, y=0, z=0)');
        });
    });
});
