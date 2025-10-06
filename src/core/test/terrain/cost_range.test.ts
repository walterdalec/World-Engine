// packages/core/test/terrain/cost_range.test.ts
import { axial } from '../../action/hex';
import { TerrainMap } from '../../terrain/map';
import { makeCostFn, makePassableFn } from '../../terrain/costFns';

// Mock the hex utilities for testing
const mockMoveRange = (start: any, budget: number, costFn: any, passableFn: any) => {
    // Simple mock that returns a Set based on budget and terrain costs
    const result = new Set<string>();
    result.add(`${start.q},${start.r}`); // Start position

    // Add some nearby positions based on budget
    if (budget >= 1) {
        result.add(`${start.q + 1},${start.r}`);
        result.add(`${start.q - 1},${start.r}`);
        result.add(`${start.q},${start.r + 1}`);
        result.add(`${start.q},${start.r - 1}`);
    }

    if (budget >= 2) {
        result.add(`${start.q + 2},${start.r}`);
        result.add(`${start.q - 2},${start.r}`);
    }

    return result;
};

describe('moveRange with terrain cost', () => {
    it('creates cost and passable functions from terrain map', () => {
        const t = new TerrainMap();
        const s = axial(0, 0);

        // Set up some terrain
        t.set(axial(1, 0), { t: 'mountain' });
        t.set(axial(2, 0), { t: 'road' });

        const costFn = makeCostFn(t);
        const passableFn = makePassableFn(t);

        // Test cost function
        expect(costFn(axial(0, 0))).toBe(1); // grass
        expect(costFn(axial(1, 0))).toBe(5); // mountain
        expect(costFn(axial(2, 0))).toBe(1); // road

        // Test passable function
        expect(passableFn(axial(0, 0))).toBe(true);  // grass is passable
        expect(passableFn(axial(1, 0))).toBe(false); // mountain is impassable
        expect(passableFn(axial(2, 0))).toBe(true);  // road is passable
    });

    it('handles encumbrance in cost calculation', () => {
        const t = new TerrainMap();
        t.set(axial(0, 0), { t: 'grass' });

        const normalCost = makeCostFn(t, 0);
        const encumberedCost = makeCostFn(t, 2);

        expect(normalCost(axial(0, 0))).toBe(1);
        expect(encumberedCost(axial(0, 0))).toBe(3);
    });
});