/**
 * Rally Resolution Tests
 */

import { describe, it, expect } from 'vitest';
import { axial } from '../../action/hex';
import { resolveSimultaneous } from '../../action/resolver';
import type { WorldState, PlannedAction } from '../../action/types';

function mk() {
    const C = { id: 'C', team: 'P', pos: axial(0, 0), hp: 20, mp: 0, ap: 3, speed: 10 };
    const A = { id: 'A', team: 'P', pos: axial(1, 0), hp: 10, mp: 0, ap: 3, speed: 8 };

    return {
        units: new Map([[C.id, C], [A.id, A]]),
        occupied: new Set(['0,0', '1,0']),
        terrainCost: () => 1,
        passable: () => true,
        blocksLos: () => false,
        rng: () => 0.5
    } as WorldState;
}

describe('rally resolution adds morale_up status', () => {
    it('adds status-add to ally', () => {
        const st = mk();
        const acts: PlannedAction[] = [
            { actor: 'C', kind: 'rally', targets: [{ q: 1, r: 0 }], cost: { ap: 1 }, data: { range: 3, cooldown: 3 } }
        ];

        const r = resolveSimultaneous(st, acts);
        const status = r.steps.find(s => s.type === 'status-add');

        expect(status).toBeTruthy();
        expect((status as any).payload.id).toBe('A');
        expect((status as any).payload.name).toBe('morale_up');
        expect((status as any).payload.turns).toBe(2);
    });

    it('rallies multiple targets', () => {
        const st = mk();
        // Add another ally
        const B = { id: 'B', team: 'P', pos: axial(0, 1), hp: 8, mp: 0, ap: 3, speed: 7 };
        st.units.set('B', B);
        st.occupied.add('0,1');

        const acts: PlannedAction[] = [
            {
                actor: 'C',
                kind: 'rally',
                targets: [{ q: 1, r: 0 }, { q: 0, r: 1 }],
                cost: { ap: 2 }
            }
        ];

        const r = resolveSimultaneous(st, acts);
        const statusSteps = r.steps.filter(s => s.type === 'status-add');

        expect(statusSteps).toHaveLength(2);
        expect(statusSteps.every((s: any) => s.payload.name === 'morale_up')).toBe(true);
    });

    it('ignores empty hexes in rally targets', () => {
        const st = mk();
        const acts: PlannedAction[] = [
            {
                actor: 'C',
                kind: 'rally',
                targets: [{ q: 1, r: 0 }, { q: 3, r: 3 }], // Second hex is empty
                cost: { ap: 1 }
            }
        ];

        const r = resolveSimultaneous(st, acts);
        const statusSteps = r.steps.filter(s => s.type === 'status-add');

        expect(statusSteps).toHaveLength(1);
        expect((statusSteps[0] as any).payload.id).toBe('A');
    });
});