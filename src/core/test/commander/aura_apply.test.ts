// packages/core/src/test/commander/aura_apply.test.ts
import { recomputeAuras } from '../../commander/aura';

function axial(q: number, r: number) {
    return { q, r };
}

function mk() {
    const K: any = {
        id: 'K',
        team: 'P',
        pos: axial(0, 0),
        hp: 30,
        ap: 10,
        speed: 10,
        statuses: [],
        commandRadius: 2,
        meta: { auras: ['aura.valor'] }
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
    const B: any = {
        id: 'B',
        team: 'P',
        pos: axial(3, 0),
        hp: 20,
        ap: 10,
        speed: 8,
        statuses: []
    };

    return {
        units: new Map([[K.id, K], [A.id, A], [B.id, B]]),
        occupied: new Set(),
        terrainCost: () => 1,
        passable: () => true,
        blocksLos: () => false,
        rng: () => 0.0
    } as any;
}

describe('auras apply within radius', () => {
    it('adds valor to A but not B', () => {
        const w = mk();
        recomputeAuras(w);
        expect(w.units.get('A').statuses.some((s: any) => s.name === 'valor')).toBe(true);
        expect(w.units.get('B').statuses.some((s: any) => s.name === 'valor')).toBe(false);
    });
});