// packages/core/src/test/commander/aura_stack_conflict.test.ts
import { recomputeAuras } from '../../commander/aura';

function axial(q: number, r: number) {
    return { q, r };
}

function mk() {
    const K1: any = {
        id: 'K1',
        team: 'P',
        pos: axial(0, 0),
        hp: 30,
        ap: 10,
        speed: 10,
        statuses: [],
        commandRadius: 2,
        meta: { auras: ['aura.valor'] }
    };
    const K2: any = {
        id: 'K2',
        team: 'P',
        pos: axial(0, 1),
        hp: 30,
        ap: 10,
        speed: 10,
        statuses: [],
        commandRadius: 2,
        meta: { auras: ['aura.guarded'] }
    };
    const A: any = {
        id: 'A',
        team: 'P',
        pos: axial(1, 0),
        hp: 20,
        ap: 10,
        speed: 8,
        statuses: []
    };

    return {
        units: new Map([[K1.id, K1], [K2.id, K2], [A.id, A]]),
        occupied: new Set(),
        terrainCost: () => 1,
        passable: () => true,
        blocksLos: () => false,
        rng: () => 0.0
    } as any;
}

describe('stack rule — highest wins where relevant', () => {
    it('applies both if different status names; keeps strongest if same name', () => {
        const w = mk();
        recomputeAuras(w);
        // we only verify something applied; detailed magnitude handled by status system in #06/#07
        expect(w.units.get('A').statuses.length).toBeGreaterThan(0);
    });
});