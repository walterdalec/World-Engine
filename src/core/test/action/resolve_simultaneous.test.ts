/**
 * Simultaneous Resolution Tests
 */

import { describe, it, expect } from 'vitest';
import { axial } from '../../action/hex';
import { resolveSimultaneous } from '../../action/resolver';
import type { WorldState, PlannedAction } from '../../action/types';

function mkState() {
    const A = { id: 'A', team: 'T1', pos: axial(0, 0), hp: 10, mp: 10, ap: 10, speed: 10 };
    const B = { id: 'B', team: 'T2', pos: axial(1, 0), hp: 10, mp: 10, ap: 10, speed: 8 };

    return {
        units: new Map([[A.id, A], [B.id, B]]),
        occupied: new Set(['0,0', '1,0']),
        terrainCost: () => 1,
        passable: () => true,
        blocksLos: () => false,
        rng: () => 0.5
    } as WorldState;
}

describe('resolveSimultaneous', () => {
    it('sums damage then applies once', () => {
        const st = mkState();
        const actions: PlannedAction[] = [
            { actor: 'A', kind: 'attack', targets: [st.units.get('B')!.pos], cost: { ap: 3 }, data: { power: 4 } },
            { actor: 'B', kind: 'attack', targets: [st.units.get('A')!.pos], cost: { ap: 3 }, data: { power: 5 } },
        ];

        const r = resolveSimultaneous(st, actions);
        const hpDeltas = r.steps.filter(s => s.type === 'hp').map(s => s.payload);

        expect(hpDeltas).toHaveLength(2);
        expect(hpDeltas.some((d: any) => d.id === 'A')).toBe(true);
        expect(hpDeltas.some((d: any) => d.id === 'B')).toBe(true);
    });

    it('applies AP costs before actions', () => {
        const st = mkState();
        const actions: PlannedAction[] = [
            { actor: 'A', kind: 'defend', targets: [], cost: { ap: 2 } }
        ];

        const r = resolveSimultaneous(st, actions);
        const apStep = r.steps.find(s => s.type === 'ap');
        const statusStep = r.steps.find(s => s.type === 'status-add');

        expect(apStep).toBeTruthy();
        expect(statusStep).toBeTruthy();
        expect((apStep as any).payload.delta).toBe(-2);
        expect((statusStep as any).payload.name).toBe('defending');
    });

    it('handles movement collisions', () => {
        const st = mkState();
        const targetHex = axial(2, 0);

        const actions: PlannedAction[] = [
            { actor: 'A', kind: 'move', targets: [targetHex], cost: { ap: 2 } },
            { actor: 'B', kind: 'move', targets: [targetHex], cost: { ap: 2 } }
        ];

        const r = resolveSimultaneous(st, actions);
        const moveSteps = r.steps.filter(s => s.type === 'pos');

        // Only one unit should successfully move (higher speed wins)
        expect(moveSteps).toHaveLength(1);
        expect((moveSteps[0] as any).payload.id).toBe('A'); // A has higher speed
    });
});