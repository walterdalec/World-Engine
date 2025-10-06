/**
 * Movement Cost Tests
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

describe('costs: move uses computed.moveCost when present', () => {
    it('deducts computed cost instead of nominal', () => {
        const st = mkState();
        const move: PlannedAction = {
            actor: 'A',
            kind: 'move',
            targets: [{ q: 1, r: 0 }],
            cost: { ap: 2 },
            computed: { moveCost: 4 }
        };

        const r = resolveSimultaneous(st, [move]);
        const ap = r.steps.find(s => s.type === 'ap')!.payload;

        expect(ap.delta).toBe(-4);
    });

    it('uses nominal cost when computed cost not available', () => {
        const st = mkState();
        const move: PlannedAction = {
            actor: 'A',
            kind: 'move',
            targets: [{ q: 1, r: 0 }],
            cost: { ap: 3 }
        };

        const r = resolveSimultaneous(st, [move]);
        const ap = r.steps.find(s => s.type === 'ap')!.payload;

        expect(ap.delta).toBe(-3);
    });
});