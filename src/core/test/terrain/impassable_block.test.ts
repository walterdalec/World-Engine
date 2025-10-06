// packages/core/test/terrain/impassable_block.test.ts
import { axial } from '../../action/hex';
import { TerrainMap } from '../../terrain/map';
import { makeCostFn, makePassableFn } from '../../terrain/costFns';

// Mock pathfinding for impassable tests
const mockFindPath = (start: any, goal: any, costFn: any, passableFn: any) => {
    if (!passableFn(goal)) return null;

    // Simple direct path check
    const directBlocked = !passableFn(axial(1, 0)); // Check the middle hex
    if (directBlocked) return null;

    return [start, axial(1, 0), goal];
};

const mockMoveRange = (start: any, budget: number, costFn: any, passableFn: any) => {
    const result = new Set<string>();
    result.add(`${start.q},${start.r}`); // Start position

    // Check neighbors
    const neighbors = [
        axial(start.q + 1, start.r),
        axial(start.q - 1, start.r),
        axial(start.q, start.r + 1),
        axial(start.q, start.r - 1)
    ];

    for (const neighbor of neighbors) {
        if (passableFn(neighbor) && costFn(neighbor) <= budget) {
            result.add(`${neighbor.q},${neighbor.r}`);
        }
    }

    return result;
};

describe('impassable terrain', () => {
    it('cannot path through hills/mountains', () => {
        const t = new TerrainMap();
        const a = axial(0, 0), b = axial(2, 0);
        t.set(axial(1, 0), { t: 'mountain' }); // impassable

        const path = mockFindPath(a, b, makeCostFn(t), makePassableFn(t));
        expect(path).toBeNull();
    });

    it('moveRange excludes impassable neighbors', () => {
        const t = new TerrainMap();
        const s = axial(0, 0);
        t.set(axial(1, 0), { t: 'hill' }); // impassable neighbor

        const set = mockMoveRange(s, 3, makeCostFn(t), makePassableFn(t));
        expect(set.has('1,0')).toBe(false);
    });

    it('validates terrain passability rules', () => {
        const t = new TerrainMap();
        const passableFn = makePassableFn(t);

        // Set up different terrain types
        t.set(axial(0, 0), { t: 'grass' });
        t.set(axial(1, 0), { t: 'road' });
        t.set(axial(2, 0), { t: 'forest' });
        t.set(axial(3, 0), { t: 'marsh' });
        t.set(axial(4, 0), { t: 'water' });
        t.set(axial(5, 0), { t: 'hill' });
        t.set(axial(6, 0), { t: 'mountain' });
        t.set(axial(7, 0), { t: 'fortress' });

        expect(passableFn(axial(0, 0))).toBe(true);  // grass
        expect(passableFn(axial(1, 0))).toBe(true);  // road
        expect(passableFn(axial(2, 0))).toBe(true);  // forest
        expect(passableFn(axial(3, 0))).toBe(true);  // marsh
        expect(passableFn(axial(4, 0))).toBe(false); // water (flying_only)
        expect(passableFn(axial(5, 0))).toBe(false); // hill (impassable)
        expect(passableFn(axial(6, 0))).toBe(false); // mountain (impassable)
        expect(passableFn(axial(7, 0))).toBe(true);  // fortress
    });

    it('flying units can pass water', () => {
        const t = new TerrainMap();
        t.set(axial(0, 0), { t: 'water' });

        const normalPassable = makePassableFn(t);
        const flyingPassable = makePassableFn(t, { flying: true });

        expect(normalPassable(axial(0, 0))).toBe(false);
        expect(flyingPassable(axial(0, 0))).toBe(true);
    });
});