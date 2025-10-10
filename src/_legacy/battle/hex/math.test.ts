// ──────────────────────────────────────────────────────────────────────────────
// File: src/features/battle/hex/math.test.ts
// Purpose: Comprehensive tests for hex math utilities
// ──────────────────────────────────────────────────────────────────────────────

import { describe, it, expect } from 'vitest';
import {
    axial,
    cube,
} from './coords';
import {
    cubeDistance,
    axialDistance,
    cubeNeighbors,
    axialNeighbors,
    cubeLine,
    axialLine,
    cubeRing,
    axialRing,
    cubeSpiral,
    axialSpiral,
    cubeRange,
    axialRange,
    cubeRotateLeft,
    cubeRotateRight,
    cubeRotate,
    cubeRotateAround,
    cubeMirrorQ,
    cubeMirrorR,
    cubeAdd,
    cubeSub,
    cubeScale,
    axialAdd,
    axialSub,
} from './math';

describe('Hex Math - Vector Operations', () => {
    describe('cubeAdd', () => {
        it('adds cube coordinates correctly', () => {
            const a = cube(1, -1, 0);
            const b = cube(2, 0, -2);
            const result = cubeAdd(a, b);
            expect(result).toEqual({ x: 3, y: -1, z: -2 });
        });

        it('normalizes -0 in result', () => {
            const a = cube(0, 0, 0);
            const b = cube(0, 0, 0);
            const result = cubeAdd(a, b);
            expect(Object.is(result.x, -0)).toBe(false);
            expect(Object.is(result.y, -0)).toBe(false);
            expect(Object.is(result.z, -0)).toBe(false);
        });
    });

    describe('cubeSub', () => {
        it('subtracts cube coordinates correctly', () => {
            const a = cube(3, -1, -2);
            const b = cube(1, -1, 0);
            const result = cubeSub(a, b);
            expect(result).toEqual({ x: 2, y: 0, z: -2 });
        });
    });

    describe('cubeScale', () => {
        it('scales cube coordinates correctly', () => {
            const a = cube(2, -1, -1);
            const result = cubeScale(a, 3);
            expect(result).toEqual({ x: 6, y: -3, z: -3 });
        });
    });

    describe('axialAdd/axialSub', () => {
        it('adds axial coordinates', () => {
            const a = axial(1, 2);
            const b = axial(3, -1);
            const result = axialAdd(a, b);
            expect(result).toEqual({ q: 4, r: 1 });
        });

        it('subtracts axial coordinates', () => {
            const a = axial(4, 1);
            const b = axial(1, 2);
            const result = axialSub(a, b);
            expect(result).toEqual({ q: 3, r: -1 });
        });
    });
});

describe('Hex Math - Distance', () => {
    describe('cubeDistance', () => {
        it('returns 0 for same hex', () => {
            const a = cube(3, -2, -1);
            expect(cubeDistance(a, a)).toBe(0);
        });

        it('returns 1 for adjacent hexes', () => {
            const center = cube(0, 0, 0);
            const neighbors = cubeNeighbors(center);
            neighbors.forEach(neighbor => {
                expect(cubeDistance(center, neighbor)).toBe(1);
            });
        });

        it('calculates distance correctly', () => {
            expect(cubeDistance(cube(0, 0, 0), cube(3, 0, -3))).toBe(3);
            expect(cubeDistance(cube(0, 0, 0), cube(0, 3, -3))).toBe(3);
            expect(cubeDistance(cube(0, 0, 0), cube(3, -2, -1))).toBe(3);
        });

        it('is symmetric', () => {
            const a = cube(2, -1, -1);
            const b = cube(5, -3, -2);
            expect(cubeDistance(a, b)).toBe(cubeDistance(b, a));
        });
    });

    describe('axialDistance', () => {
        it('returns correct distance', () => {
            expect(axialDistance(axial(0, 0), axial(3, 0))).toBe(3);
            expect(axialDistance(axial(0, 0), axial(0, 3))).toBe(3);
            expect(axialDistance(axial(0, 0), axial(2, -1))).toBe(2);
        });

        it('is symmetric', () => {
            const a = axial(2, 3);
            const b = axial(5, -1);
            expect(axialDistance(a, b)).toBe(axialDistance(b, a));
        });
    });
});

describe('Hex Math - Neighbors', () => {
    describe('cubeNeighbors', () => {
        it('returns 6 neighbors', () => {
            const neighbors = cubeNeighbors(cube(0, 0, 0));
            expect(neighbors).toHaveLength(6);
        });

        it('all neighbors are distance 1', () => {
            const center = cube(2, -1, -1);
            const neighbors = cubeNeighbors(center);
            neighbors.forEach(neighbor => {
                expect(cubeDistance(center, neighbor)).toBe(1);
            });
        });

        it('returns unique neighbors', () => {
            const neighbors = cubeNeighbors(cube(5, -2, -3));
            const keys = neighbors.map(n => `${n.x},${n.y},${n.z}`);
            const unique = new Set(keys);
            expect(unique.size).toBe(6);
        });
    });

    describe('axialNeighbors', () => {
        it('returns 6 neighbors', () => {
            const neighbors = axialNeighbors(axial(0, 0));
            expect(neighbors).toHaveLength(6);
        });

        it('all neighbors are distance 1', () => {
            const center = axial(2, -1);
            const neighbors = axialNeighbors(center);
            neighbors.forEach(neighbor => {
                expect(axialDistance(center, neighbor)).toBe(1);
            });
        });
    });
});

describe('Hex Math - Lines', () => {
    describe('cubeLine', () => {
        it('includes start and end', () => {
            const a = cube(0, 0, 0);
            const b = cube(3, -2, -1);
            const line = cubeLine(a, b);
            expect(line[0]).toEqual(a);
            expect(line[line.length - 1]).toEqual(b);
        });

        it('returns single hex for same start/end', () => {
            const a = cube(2, -1, -1);
            const line = cubeLine(a, a);
            expect(line).toHaveLength(1);
            expect(line[0]).toEqual(a);
        });

        it('produces monotonic path', () => {
            const a = cube(0, 0, 0);
            const b = cube(5, -3, -2);
            const line = cubeLine(a, b);
            // Consecutive steps are neighbors or same
            for (let i = 0; i < line.length - 1; i++) {
                const dist = cubeDistance(line[i], line[i + 1]);
                expect(dist).toBeGreaterThanOrEqual(0);
                expect(dist).toBeLessThanOrEqual(1);
            }
        });
    });

    describe('axialLine', () => {
        it('includes start and end', () => {
            const a = axial(0, 0);
            const b = axial(3, -1);
            const line = axialLine(a, b);
            expect(line[0]).toEqual(a);
            expect(line[line.length - 1]).toEqual(b);
        });

        it('produces valid path', () => {
            const a = axial(0, 0);
            const b = axial(4, 2);
            const line = axialLine(a, b);
            for (let i = 0; i < line.length - 1; i++) {
                const dist = axialDistance(line[i], line[i + 1]);
                expect(dist).toBeGreaterThanOrEqual(0);
                expect(dist).toBeLessThanOrEqual(1);
            }
        });
    });
});

describe('Hex Math - Rings & Spirals', () => {
    describe('cubeRing', () => {
        it('returns center for radius 0', () => {
            const center = cube(2, -1, -1);
            const ring = cubeRing(center, 0);
            expect(ring).toHaveLength(1);
            expect(ring[0]).toEqual(center);
        });

        it('returns 6r hexes for radius r > 0', () => {
            const center = cube(0, 0, 0);
            for (let r = 1; r <= 5; r++) {
                const ring = cubeRing(center, r);
                expect(ring.length).toBe(6 * r);
            }
        });

        it('all hexes are at correct distance', () => {
            const center = cube(0, 0, 0);
            const ring = cubeRing(center, 3);
            ring.forEach(hex => {
                expect(cubeDistance(center, hex)).toBe(3);
            });
        });

        it('throws for negative radius', () => {
            expect(() => cubeRing(cube(0, 0, 0), -1)).toThrow('radius must be >= 0');
        });
    });

    describe('axialRing', () => {
        it('returns correct count', () => {
            const center = axial(0, 0);
            for (let r = 0; r <= 5; r++) {
                const ring = axialRing(center, r);
                expect(ring.length).toBe(r === 0 ? 1 : 6 * r);
            }
        });
    });

    describe('cubeSpiral', () => {
        it('includes center and all rings', () => {
            const center = cube(0, 0, 0);
            const R = 4;
            const spiral = cubeSpiral(center, R);
            // Count = 1 + 3R(R+1)
            expect(spiral.length).toBe(1 + 3 * R * (R + 1));
        });

        it('starts with center', () => {
            const center = cube(2, -1, -1);
            const spiral = cubeSpiral(center, 3);
            expect(spiral[0]).toEqual(center);
        });
    });

    describe('axialSpiral', () => {
        it('returns correct count', () => {
            const center = axial(0, 0);
            const R = 3;
            const spiral = axialSpiral(center, R);
            expect(spiral.length).toBe(1 + 3 * R * (R + 1));
        });
    });
});

describe('Hex Math - Range (Disk)', () => {
    describe('cubeRange', () => {
        it('returns empty for negative radius', () => {
            expect(cubeRange(cube(0, 0, 0), -1)).toHaveLength(0);
        });

        it('returns center for radius 0', () => {
            const center = cube(2, -1, -1);
            const range = cubeRange(center, 0);
            expect(range).toHaveLength(1);
            expect(range[0]).toEqual(center);
        });

        it('returns correct count for radius R', () => {
            const center = cube(0, 0, 0);
            for (let R = 0; R <= 5; R++) {
                const range = cubeRange(center, R);
                // Count = 1 + 3R(R+1)
                expect(range.length).toBe(1 + 3 * R * (R + 1));
            }
        });

        it('all hexes within radius', () => {
            const center = cube(0, 0, 0);
            const range = cubeRange(center, 3);
            range.forEach(hex => {
                expect(cubeDistance(center, hex)).toBeLessThanOrEqual(3);
            });
        });
    });

    describe('axialRange', () => {
        it('returns correct count', () => {
            const center = axial(0, 0);
            const R = 4;
            const range = axialRange(center, R);
            expect(range.length).toBe(1 + 3 * R * (R + 1));
        });
    });
});

describe('Hex Math - Rotations', () => {
    describe('cubeRotateLeft/Right', () => {
        it('maintains distance to origin', () => {
            const c = cube(2, -1, -1);
            const l = cubeRotateLeft(c);
            const r = cubeRotateRight(c);
            const origin = cube(0, 0, 0);
            expect(cubeDistance(origin, l)).toBe(cubeDistance(origin, c));
            expect(cubeDistance(origin, r)).toBe(cubeDistance(origin, c));
        });

        it('6 left rotations return to original', () => {
            let c = cube(3, -2, -1);
            for (let i = 0; i < 6; i++) {
                c = cubeRotateLeft(c);
            }
            expect(c).toEqual(cube(3, -2, -1));
        });

        it('6 right rotations return to original', () => {
            let c = cube(3, -2, -1);
            for (let i = 0; i < 6; i++) {
                c = cubeRotateRight(c);
            }
            expect(c).toEqual(cube(3, -2, -1));
        });
    });

    describe('cubeRotate', () => {
        it('6 steps returns to original', () => {
            const c = cube(2, -1, -1);
            expect(cubeRotate(c, 6)).toEqual(c);
        });

        it('handles negative steps', () => {
            const c = cube(2, -1, -1);
            const pos3 = cubeRotate(c, 3);
            const neg3 = cubeRotate(c, -3);
            // Rotating -3 should equal rotating +3 steps in opposite direction
            expect(cubeDistance(cube(0, 0, 0), pos3)).toBe(cubeDistance(cube(0, 0, 0), c));
            expect(cubeDistance(cube(0, 0, 0), neg3)).toBe(cubeDistance(cube(0, 0, 0), c));
        });

        it('handles steps > 6', () => {
            const c = cube(2, -1, -1);
            expect(cubeRotate(c, 7)).toEqual(cubeRotate(c, 1));
            expect(cubeRotate(c, 12)).toEqual(c);
        });
    });

    describe('cubeRotateAround', () => {
        it('maintains distance to pivot', () => {
            const pivot = cube(2, -1, -1);
            const c = cube(3, 0, -3);
            const rotated = cubeRotateAround(pivot, c, 3);
            expect(cubeDistance(pivot, rotated)).toBe(cubeDistance(pivot, c));
        });

        it('pivot rotates to itself', () => {
            const pivot = cube(2, -1, -1);
            const rotated = cubeRotateAround(pivot, pivot, 3);
            expect(rotated).toEqual(pivot);
        });
    });

    describe('cubeMirrorQ/R', () => {
        it('maintains distance to origin', () => {
            const c = cube(2, -1, -1);
            const mq = cubeMirrorQ(c);
            const mr = cubeMirrorR(c);
            const origin = cube(0, 0, 0);
            expect(cubeDistance(origin, mq)).toBe(cubeDistance(origin, c));
            expect(cubeDistance(origin, mr)).toBe(cubeDistance(origin, c));
        });

        it('double mirror returns to original', () => {
            const c = cube(3, -2, -1);
            expect(cubeMirrorQ(cubeMirrorQ(c))).toEqual(c);
            expect(cubeMirrorR(cubeMirrorR(c))).toEqual(c);
        });
    });
});
