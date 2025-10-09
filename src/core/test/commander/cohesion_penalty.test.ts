// packages/core/src/test/commander/cohesion_penalty.test.ts
import { applyCohesion } from '../../commander/squad';

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
        commandRadius: 2
    };
    const A: any = {
        id: 'A',
        team: 'P',
        pos: axial(4, 0),
        hp: 20,
        ap: 10,
        speed: 8,
        statuses: [],
        leaderId: 'K'
    };

    return {
        units: new Map([[K.id, K], [A.id, A]]),
        occupied: new Set(),
        terrainCost: () => 1,
        passable: () => true,
        blocksLos: () => false,
        rng: () => 0.0
    } as any;
}

describe('cohesion penalty when out of range', () => {
    it('adds cohesion_break when outside command radius', () => {
        const w = mk();
        const changed = applyCohesion(w, 'A');
        expect(changed).toBe(true);
        expect(w.units.get('A').statuses.some((s: any) => s.name === 'cohesion_break')).toBe(true);
    });
});