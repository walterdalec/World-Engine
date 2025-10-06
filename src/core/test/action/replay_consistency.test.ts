/**
 * Replay Consistency Tests
 */

import { describe, it, expect } from 'vitest';
import { axial } from '../../action/hex';
import { resolveSimultaneous } from '../../action/resolver';
import type { WorldState, PlannedAction } from '../../action/types';

describe('replay', () => {
    it('same actions -> same steps', () => {
        const A = { id: 'A', team: 'T1', pos: axial(0, 0), hp: 10, mp: 0, ap: 10, speed: 9 };
        const B = { id: 'B', team: 'T2', pos: axial(1, 0), hp: 10, mp: 0, ap: 10, speed: 9 };

        const mk = () => ({
            units: new Map([[A.id, { ...A }], [B.id, { ...B }]]),
            occupied: new Set(['0,0', '1,0']),
            terrainCost: () => 1,
            passable: () => true,
            blocksLos: () => false,
            rng: () => 0.5
        } as WorldState);

        const acts: PlannedAction[] = [
            { actor: 'A', kind: 'defend', targets: [], cost: { ap: 2 } },
            { actor: 'B', kind: 'move', targets: [axial(2, 0)], cost: { ap: 2 }, computed: { moveCost: 2 } }
        ];

        const r1 = resolveSimultaneous(mk(), acts);
        const r2 = resolveSimultaneous(mk(), acts);

        expect(JSON.stringify(r1.steps)).toBe(JSON.stringify(r2.steps));
    });

    it('deterministic action ordering', () => {
        const A = { id: 'A', team: 'T1', pos: axial(0, 0), hp: 10, mp: 0, ap: 10, speed: 8 };
        const B = { id: 'B', team: 'T2', pos: axial(1, 0), hp: 10, mp: 0, ap: 10, speed: 10 };

        const mk = () => ({
            units: new Map([[A.id, { ...A }], [B.id, { ...B }]]),
            occupied: new Set(['0,0', '1,0']),
            terrainCost: () => 1,
            passable: () => true,
            blocksLos: () => false,
            rng: () => 0.5
        } as WorldState);

        // Same action kind, different actors with different speeds
        const acts: PlannedAction[] = [
            { actor: 'A', kind: 'attack', targets: [axial(1, 0)], cost: { ap: 3 }, data: { power: 3 } },
            { actor: 'B', kind: 'attack', targets: [axial(0, 0)], cost: { ap: 3 }, data: { power: 3 } }
        ];

        const r1 = resolveSimultaneous(mk(), acts);
        const r2 = resolveSimultaneous(mk(), [...acts].reverse()); // Reverse input order

        // Results should be identical regardless of input order
        expect(JSON.stringify(r1.steps)).toBe(JSON.stringify(r2.steps));
    });
});