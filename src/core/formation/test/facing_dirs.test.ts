import { describe, it, expect } from '@jest/globals';
import { dirBetween, classifyArc, dirDiff, getFrontArc, getRearArc } from '../facing';

describe('Facing & Arcs', () => {
    it('classifies rear vs side vs front', () => {
        const facing = 0; // East
        expect(classifyArc(facing, 0)).toBe('front'); // Same direction
        expect(classifyArc(facing, 3)).toBe('rear');  // Opposite (West)
        expect(classifyArc(facing, 2)).toBe('side');  // Northwest
        expect(classifyArc(facing, 4)).toBe('side');  // Southwest
    });

    it('calculates direction between hexes correctly', () => {
        const center = { q: 0, r: 0 };

        // Test basic directions
        expect(dirBetween(center, { q: 1, r: 0 })).toBe(0);   // East
        expect(dirBetween(center, { q: 1, r: -1 })).toBe(1);  // Northeast
        expect(dirBetween(center, { q: 0, r: -1 })).toBe(2);  // Northwest
        expect(dirBetween(center, { q: -1, r: 0 })).toBe(3);  // West
        expect(dirBetween(center, { q: -1, r: 1 })).toBe(4);  // Southwest
        expect(dirBetween(center, { q: 0, r: 1 })).toBe(5);   // Southeast
    });

    it('calculates directional differences correctly', () => {
        expect(dirDiff(0, 0)).toBe(0); // Same direction
        expect(dirDiff(0, 1)).toBe(1); // Adjacent
        expect(dirDiff(0, 2)).toBe(2); // Side
        expect(dirDiff(0, 3)).toBe(3); // Opposite
        expect(dirDiff(0, 4)).toBe(2); // Side (wrapping)
        expect(dirDiff(0, 5)).toBe(1); // Adjacent (wrapping)
    });

    it('handles tolerance in arc classification', () => {
        const facing = 0; // East

        // With tolerance 1 (default)
        expect(classifyArc(facing, 1, 1)).toBe('front'); // Northeast counts as front
        expect(classifyArc(facing, 5, 1)).toBe('front'); // Southeast counts as front

        // With tolerance 0 (strict)
        expect(classifyArc(facing, 1, 0)).toBe('side');  // Northeast is side
        expect(classifyArc(facing, 5, 0)).toBe('side');  // Southeast is side
    });

    it('generates front arc directions correctly', () => {
        const facing = 0; // East

        const frontArcStrict = getFrontArc(facing, 0);
        expect(frontArcStrict).toEqual([0]);

        const frontArcTolerant = getFrontArc(facing, 1);
        expect(frontArcTolerant).toContain(0); // East
        expect(frontArcTolerant).toContain(1); // Northeast
        expect(frontArcTolerant).toContain(5); // Southeast
        expect(frontArcTolerant.length).toBe(3);
    });

    it('generates rear arc directions correctly', () => {
        const facing = 0; // East

        const rearArcStrict = getRearArc(facing, 0);
        expect(rearArcStrict).toEqual([3]); // West only

        const rearArcTolerant = getRearArc(facing, 1);
        expect(rearArcTolerant).toContain(3); // West
        expect(rearArcTolerant).toContain(2); // Northwest
        expect(rearArcTolerant).toContain(4); // Southwest
        expect(rearArcTolerant.length).toBe(3);
    });
});