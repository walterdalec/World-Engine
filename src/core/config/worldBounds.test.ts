// ──────────────────────────────────────────────────────────────────────────────
// File: src/core/config/worldBounds.test.ts
// Purpose: Tests for world bounds configuration and utilities
// ──────────────────────────────────────────────────────────────────────────────

import { describe, it, expect } from 'vitest';
import {
    DEFAULT_WORLD_BOUNDS,
    TEST_WORLD_BOUNDS,
    isSectorInBounds,
    clampSectorToBounds,
    getTotalSectors,
    getApproximateHexCount,
    createWorldBounds,
    WORLD_SIZE_PRESETS,
    getWorldSizeDescription,
} from './worldBounds';

describe('World Bounds Configuration', () => {
    it('DEFAULT_WORLD_BOUNDS has expected dimensions', () => {
        expect(DEFAULT_WORLD_BOUNDS.sxMin).toBe(-250);
        expect(DEFAULT_WORLD_BOUNDS.sxMax).toBe(250);
        expect(DEFAULT_WORLD_BOUNDS.syMin).toBe(-250);
        expect(DEFAULT_WORLD_BOUNDS.syMax).toBe(250);
    });

    it('DEFAULT_WORLD_BOUNDS is frozen', () => {
        expect(Object.isFrozen(DEFAULT_WORLD_BOUNDS)).toBe(true);
    });

    it('TEST_WORLD_BOUNDS is smaller for CI', () => {
        const testSize = getTotalSectors(TEST_WORLD_BOUNDS);
        const defaultSize = getTotalSectors(DEFAULT_WORLD_BOUNDS);
        expect(testSize).toBeLessThan(defaultSize);
        expect(testSize).toBe(21 * 21); // 441 sectors
    });
});

describe('isSectorInBounds', () => {
    it('returns true for origin', () => {
        expect(isSectorInBounds(0, 0)).toBe(true);
    });

    it('returns true for sectors within bounds', () => {
        expect(isSectorInBounds(100, 100)).toBe(true);
        expect(isSectorInBounds(-100, -100)).toBe(true);
        expect(isSectorInBounds(250, 250)).toBe(true);
        expect(isSectorInBounds(-250, -250)).toBe(true);
    });

    it('returns false for sectors outside bounds', () => {
        expect(isSectorInBounds(251, 0)).toBe(false);
        expect(isSectorInBounds(0, 251)).toBe(false);
        expect(isSectorInBounds(-251, 0)).toBe(false);
        expect(isSectorInBounds(0, -251)).toBe(false);
    });

    it('respects custom bounds', () => {
        const smallBounds = createWorldBounds(10);
        expect(isSectorInBounds(5, 5, smallBounds)).toBe(true);
        expect(isSectorInBounds(15, 0, smallBounds)).toBe(false);
    });
});

describe('clampSectorToBounds', () => {
    it('returns unchanged coordinates when in bounds', () => {
        const result = clampSectorToBounds(100, 100);
        expect(result).toEqual({ sx: 100, sy: 100 });
    });

    it('clamps X coordinate to min bound', () => {
        const result = clampSectorToBounds(-300, 0);
        expect(result).toEqual({ sx: -250, sy: 0 });
    });

    it('clamps X coordinate to max bound', () => {
        const result = clampSectorToBounds(300, 0);
        expect(result).toEqual({ sx: 250, sy: 0 });
    });

    it('clamps Y coordinate to min bound', () => {
        const result = clampSectorToBounds(0, -300);
        expect(result).toEqual({ sx: 0, sy: -250 });
    });

    it('clamps Y coordinate to max bound', () => {
        const result = clampSectorToBounds(0, 300);
        expect(result).toEqual({ sx: 0, sy: 250 });
    });

    it('clamps both coordinates simultaneously', () => {
        const result = clampSectorToBounds(999, -999);
        expect(result).toEqual({ sx: 250, sy: -250 });
    });

    it('respects custom bounds', () => {
        const smallBounds = createWorldBounds(5);
        const result = clampSectorToBounds(10, -10, smallBounds);
        expect(result).toEqual({ sx: 5, sy: -5 });
    });
});

describe('getTotalSectors', () => {
    it('calculates correct sector count for default bounds', () => {
        const count = getTotalSectors();
        expect(count).toBe(501 * 501);
        expect(count).toBe(251001);
    });

    it('calculates correct sector count for test bounds', () => {
        const count = getTotalSectors(TEST_WORLD_BOUNDS);
        expect(count).toBe(21 * 21);
        expect(count).toBe(441);
    });

    it('handles single-sector world', () => {
        const bounds = createWorldBounds(0);
        expect(getTotalSectors(bounds)).toBe(1);
    });
});

describe('getApproximateHexCount', () => {
    it('calculates hex count with default sector size', () => {
        const hexes = getApproximateHexCount(DEFAULT_WORLD_BOUNDS);
        const expected = 251001 * 64 * 48; // sectors * width * height
        expect(hexes).toBe(expected);
        expect(hexes).toBe(771075072); // Actual calculation: ~771 million
    });

    it('calculates hex count with custom sector size', () => {
        const hexes = getApproximateHexCount(TEST_WORLD_BOUNDS, 32, 24);
        const expected = 441 * 32 * 24;
        expect(hexes).toBe(expected);
    });

    it('handles tiny worlds correctly', () => {
        const bounds = createWorldBounds(1); // 3×3 sectors
        const hexes = getApproximateHexCount(bounds, 10, 10);
        expect(hexes).toBe(9 * 100);
        expect(hexes).toBe(900);
    });
});

describe('createWorldBounds', () => {
    it('creates symmetric bounds from radius', () => {
        const bounds = createWorldBounds(50);
        expect(bounds.sxMin).toBe(-50);
        expect(bounds.sxMax).toBe(50);
        expect(bounds.syMin).toBe(-50);
        expect(bounds.syMax).toBe(50);
    });

    it('handles radius 0', () => {
        const bounds = createWorldBounds(0);
        expect(bounds.sxMin).toBe(0);
        expect(bounds.sxMax).toBe(0);
        expect(bounds.syMin).toBe(0);
        expect(bounds.syMax).toBe(0);
    });

    it('creates bounds matching default when radius is 250', () => {
        const bounds = createWorldBounds(250);
        expect(bounds).toEqual(DEFAULT_WORLD_BOUNDS);
    });
});

describe('WORLD_SIZE_PRESETS', () => {
    it('has all expected presets', () => {
        expect(WORLD_SIZE_PRESETS.tiny).toBeDefined();
        expect(WORLD_SIZE_PRESETS.small).toBeDefined();
        expect(WORLD_SIZE_PRESETS.medium).toBeDefined();
        expect(WORLD_SIZE_PRESETS.large).toBeDefined();
        expect(WORLD_SIZE_PRESETS.colossal).toBeDefined();
    });

    it('presets are ordered by size', () => {
        const tiny = getTotalSectors(WORLD_SIZE_PRESETS.tiny);
        const small = getTotalSectors(WORLD_SIZE_PRESETS.small);
        const medium = getTotalSectors(WORLD_SIZE_PRESETS.medium);
        const large = getTotalSectors(WORLD_SIZE_PRESETS.large);
        const colossal = getTotalSectors(WORLD_SIZE_PRESETS.colossal);

        expect(tiny).toBeLessThan(small);
        expect(small).toBeLessThan(medium);
        expect(medium).toBeLessThan(large);
        expect(large).toBeLessThan(colossal);
    });

    it('tiny preset is reasonable for testing', () => {
        const sectors = getTotalSectors(WORLD_SIZE_PRESETS.tiny);
        expect(sectors).toBe(11 * 11);
        expect(sectors).toBe(121);
    });

    it('colossal preset matches default bounds', () => {
        expect(WORLD_SIZE_PRESETS.colossal).toEqual(DEFAULT_WORLD_BOUNDS);
    });
});

describe('getWorldSizeDescription', () => {
    it('describes tiny worlds', () => {
        const desc = getWorldSizeDescription(WORLD_SIZE_PRESETS.tiny);
        expect(desc).toContain('Tiny');
        expect(desc).toContain('testing');
    });

    it('describes small worlds', () => {
        const desc = getWorldSizeDescription(WORLD_SIZE_PRESETS.small);
        expect(desc).toContain('Small');
        expect(desc).toContain('focused');
    });

    it('describes medium worlds', () => {
        const desc = getWorldSizeDescription(WORLD_SIZE_PRESETS.medium);
        expect(desc).toContain('Medium');
        expect(desc).toContain('standard');
    });

    it('describes large worlds', () => {
        const desc = getWorldSizeDescription(WORLD_SIZE_PRESETS.large);
        expect(desc).toContain('Large');
        expect(desc).toContain('epic');
    });

    it('describes colossal worlds', () => {
        const desc = getWorldSizeDescription(WORLD_SIZE_PRESETS.colossal);
        expect(desc).toContain('Colossal');
        expect(desc).toContain('beyond reason');
    });

    it('includes hex count in description', () => {
        const desc = getWorldSizeDescription(DEFAULT_WORLD_BOUNDS);
        expect(desc).toMatch(/\d{1,3}(,\d{3})*/); // Formatted number
        expect(desc).toContain('hexes');
    });
});

describe('Edge Cases', () => {
    it('handles negative radius gracefully', () => {
        const bounds = createWorldBounds(-10);
        expect(bounds.sxMin).toBe(10); // Swapped min/max
        expect(bounds.sxMax).toBe(-10);
    });

    it('isSectorInBounds handles boundary exactly', () => {
        expect(isSectorInBounds(250, 250)).toBe(true);
        expect(isSectorInBounds(250, 251)).toBe(false);
        expect(isSectorInBounds(251, 250)).toBe(false);
    });

    it('clampSectorToBounds handles extreme values', () => {
        const result = clampSectorToBounds(Number.MAX_SAFE_INTEGER, Number.MIN_SAFE_INTEGER);
        expect(result).toEqual({ sx: 250, sy: -250 });
    });
});
