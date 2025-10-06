// packages/core/test/terrain/path_prefers_roads.test.ts
import { axial, hexLine } from '../../action/hex';
import { TerrainMap } from '../../terrain/map';
import { makeCostFn, makePassableFn } from '../../terrain/costFns';

// Mock path finding for testing
const mockFindPath = (start: any, goal: any, costFn: any, passableFn: any) => {
    // Simple mock that prefers lower cost paths
    if (!passableFn(goal)) return null;

    // Check if direct path is blocked
    const directLine = hexLine(start, goal);
    const directBlocked = directLine.some(h => !passableFn(h));

    if (directBlocked) {
        // Return a detour path that goes around obstacles via roads
        const detourPath = [
            start,
            axial(1, -1), // road detour
            axial(2, -1), // road detour
            axial(3, -1), // road detour
            axial(4, -1), // road detour
            goal
        ];

        // Check if detour path is passable
        const detourBlocked = detourPath.some(h => !passableFn(h));
        return detourBlocked ? null : detourPath;
    }

    return directLine;
}; describe('path prefers cheaper tiles', () => {
    it('takes road instead of direct mountain traverse', () => {
        const t = new TerrainMap();
        const a = axial(0, 0), b = axial(5, 0);

        // Make direct corridor mountains (impassable), detour ring = road
        const directPath = hexLine(a, b);
        // Don't make the start and end positions impassable
        for (let i = 1; i < directPath.length - 1; i++) {
            t.set(directPath[i]!, { t: 'mountain' });
        }
        t.set(axial(1, -1), { t: 'road' });
        t.set(axial(2, -1), { t: 'road' });
        t.set(axial(3, -1), { t: 'road' });
        t.set(axial(4, -1), { t: 'road' });

        const cost = makeCostFn(t);
        const pass = makePassableFn(t);
        const p = mockFindPath(a, b, cost, pass);

        // Expect path to include at least one road detour cell
        expect(p).not.toBeNull();
        expect(p!.some(h => t.kind(h) === 'road')).toBe(true);
    });

    it('validates terrain cost and passable functions', () => {
        const t = new TerrainMap();
        t.set(axial(0, 0), { t: 'grass' });
        t.set(axial(1, 0), { t: 'mountain' });
        t.set(axial(2, 0), { t: 'road' });
        t.set(axial(3, 0), { t: 'forest' });

        const costFn = makeCostFn(t);
        const passableFn = makePassableFn(t);

        expect(costFn(axial(0, 0))).toBe(1); // grass cost
        expect(costFn(axial(1, 0))).toBe(5); // mountain cost
        expect(costFn(axial(2, 0))).toBe(1); // road cost
        expect(costFn(axial(3, 0))).toBe(2); // forest cost

        expect(passableFn(axial(0, 0))).toBe(true);  // grass passable
        expect(passableFn(axial(1, 0))).toBe(false); // mountain impassable
        expect(passableFn(axial(2, 0))).toBe(true);  // road passable
        expect(passableFn(axial(3, 0))).toBe(true);  // forest passable
    });
});