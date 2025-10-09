/**
 * Flee and Opportunity Attack Tests
 */

import { axial } from '../../action/hex';
import { resolveSimultaneous } from '../../action/resolver';
import type { WorldState, PlannedAction } from '../../action/types';

function mk() {
    const M = { id: 'M', team: 'P', pos: axial(0, 0), hp: 10, mp: 0, ap: 3, speed: 10 };
    const E = { id: 'E', team: 'E', pos: axial(1, 0), hp: 10, mp: 0, ap: 3, speed: 9 };

    return {
        units: new Map([[M.id, M], [E.id, E]]),
        occupied: new Set(['0,0', '1,0']),
        terrainCost: () => 1,
        passable: () => true,
        blocksLos: () => false,
        rng: () => 0.5
    } as WorldState;
}

describe('flee triggers OA before movement, death cancels move', () => {
    it('applies OA hp delta and skips move if dead', () => {
        const st = mk();
        st.units.get('M')!.hp = 2; // Low HP to potentially die from OA

        const acts: PlannedAction[] = [
            {
                actor: 'M',
                kind: 'flee',
                targets: [{ q: -1, r: 0 }],
                cost: { ap: 1 },
                computed: { moveCost: 1 },
                data: { disengage: true }
            }
        ];

        const r = resolveSimultaneous(st, acts);
        const oaDamage = r.steps.filter(s => s.type === 'hp').find((s: any) => s.payload.id === 'M');
        const pos = r.steps.find(s => s.type === 'pos' && (s as any).payload.id === 'M');

        expect(oaDamage).toBeTruthy();
        expect(oaDamage?.payload.delta).toBeLessThan(0);

        // If the unit dies from OA, movement should be cancelled
        if (st.units.get('M')!.hp + oaDamage!.payload.delta <= 0) {
            expect(pos).toBeUndefined();
        }
    });

    it('flee without disengage does not trigger OA', () => {
        const st = mk();

        const acts: PlannedAction[] = [
            {
                actor: 'M',
                kind: 'flee',
                targets: [{ q: -1, r: 0 }],
                cost: { ap: 1 }
                // No disengage flag
            }
        ];

        const r = resolveSimultaneous(st, acts);
        const oaDamage = r.steps.filter(s => s.type === 'hp').find((s: any) => s.payload.id === 'M');
        const pos = r.steps.find(s => s.type === 'pos' && (s as any).payload.id === 'M');

        expect(oaDamage).toBeUndefined(); // No OA without disengage
        expect(pos).toBeTruthy(); // Movement should succeed
    });

    it('disengage move triggers OA', () => {
        const st = mk();

        const acts: PlannedAction[] = [
            {
                actor: 'M',
                kind: 'move',
                targets: [{ q: -1, r: 0 }],
                cost: { ap: 2 },
                data: { disengage: true }
            }
        ];

        const r = resolveSimultaneous(st, acts);
        const oaDamage = r.steps.filter(s => s.type === 'hp').find((s: any) => s.payload.id === 'M');

        expect(oaDamage).toBeTruthy();
        expect(oaDamage?.payload.delta).toBeLessThan(0);
    });

    it('no OA when no adjacent enemies', () => {
        const st = mk();
        // Move enemy away
        st.units.get('E')!.pos = axial(3, 0);
        st.occupied.delete('1,0');
        st.occupied.add('3,0');

        const acts: PlannedAction[] = [
            {
                actor: 'M',
                kind: 'flee',
                targets: [{ q: -1, r: 0 }],
                cost: { ap: 1 },
                data: { disengage: true }
            }
        ];

        const r = resolveSimultaneous(st, acts);
        const oaDamage = r.steps.filter(s => s.type === 'hp').find((s: any) => s.payload.id === 'M');
        const pos = r.steps.find(s => s.type === 'pos' && (s as any).payload.id === 'M');

        expect(oaDamage).toBeUndefined(); // No adjacent enemies, no OA
        expect(pos).toBeTruthy(); // Movement should succeed
    });
});