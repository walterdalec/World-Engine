import { _validateAction } from '../../turn/validation';
import { enemiesAdjacentTo, violatesZoC, canMoveWithoutDisengage, isEngaged } from '../zoc';
import type { WorldState } from '../../action/types';

function createMockWorldWithAdjacency(): WorldState {
    const enemy: any = {
        id: 'E',
        team: 'B',
        pos: { q: 1, r: 0 } // Adjacent to unit
    };
    const unit: any = {
        id: 'U',
        team: 'A',
        pos: { q: 0, r: 0 },
        ap: 5
    };

    return {
        units: new Map([
            [enemy.id, enemy],
            [unit.id, unit]
        ]),
        occupied: new Set(),
        terrainCost: () => 1,
        passable: () => true,
        blocksLos: () => false,
        rng: () => 0.0
    } as any;
}

function createMockWorldNoAdjacency(): WorldState {
    const enemy: any = {
        id: 'E',
        team: 'B',
        pos: { q: 3, r: 0 } // Far from unit
    };
    const unit: any = {
        id: 'U',
        team: 'A',
        pos: { q: 0, r: 0 },
        ap: 5
    };

    return {
        units: new Map([
            [enemy.id, enemy],
            [unit.id, unit]
        ]),
        occupied: new Set(),
        terrainCost: () => 1,
        passable: () => true,
        blocksLos: () => false,
        rng: () => 0.0
    } as any;
}

describe('Zone of Control', () => {
    it('detects adjacent enemies correctly', () => {
        const world = createMockWorldWithAdjacency();
        const adjacent = enemiesAdjacentTo(world, 'U');

        expect(adjacent).toContain('E');
        expect(adjacent.length).toBe(1);
    });

    it('returns empty array when no adjacent enemies', () => {
        const world = createMockWorldNoAdjacency();
        const adjacent = enemiesAdjacentTo(world, 'U');

        expect(adjacent).toEqual([]);
    });

    it('detects ZoC violations when leaving adjacency', () => {
        const world = createMockWorldWithAdjacency();
        const path = [
            { q: 0, r: 0 }, // Start position
            { q: 3, r: 0 }  // End position (far enough to break adjacency)
        ];

        const violates = violatesZoC(world, 'U', path);
        expect(violates).toBe(true);
    }); it('allows movement that maintains adjacency', () => {
        const world = createMockWorldWithAdjacency();
        const path = [
            { q: 0, r: 0 }, // Start position
            { q: 0, r: 1 }  // End position (still adjacent to enemy)
        ];

        const violates = violatesZoC(world, 'U', path);
        expect(violates).toBe(false);
    });

    it('allows movement when no enemies are adjacent', () => {
        const world = createMockWorldNoAdjacency();
        const path = [
            { q: 0, r: 0 }, // Start position
            { q: 2, r: 0 }  // End position
        ];

        const violates = violatesZoC(world, 'U', path);
        expect(violates).toBe(false);
    });

    it('correctly identifies engaged units', () => {
        const worldWithAdjacency = createMockWorldWithAdjacency();
        expect(isEngaged(worldWithAdjacency, 'U')).toBe(true);

        const worldNoAdjacency = createMockWorldNoAdjacency();
        expect(isEngaged(worldNoAdjacency, 'U')).toBe(false);
    });

    it('canMoveWithoutDisengage works correctly', () => {
        const world = createMockWorldWithAdjacency();

        // Moving to maintain adjacency should be allowed
        expect(canMoveWithoutDisengage(world, 'U', { q: 0, r: 1 })).toBe(true);

        // Moving to break adjacency should be blocked
        expect(canMoveWithoutDisengage(world, 'U', { q: 3, r: 0 })).toBe(false);
    });

    it('handles invalid unit IDs gracefully', () => {
        const world = createMockWorldWithAdjacency();

        expect(enemiesAdjacentTo(world, 'NONEXISTENT')).toEqual([]);
        expect(violatesZoC(world, 'NONEXISTENT', [])).toBe(false);
        expect(isEngaged(world, 'NONEXISTENT')).toBe(false);
    });

    it('handles empty paths correctly', () => {
        const world = createMockWorldWithAdjacency();

        expect(violatesZoC(world, 'U', [])).toBe(false);
        expect(violatesZoC(world, 'U', [{ q: 0, r: 0 }])).toBe(false); // Single point "path"
    });
});