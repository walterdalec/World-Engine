import { flankInfo, flankModifiers } from '../flanking';
import type { WorldState } from '../../action/types';

function createMockWorld(): WorldState {
    const target: any = {
        id: 'T',
        team: 'B',
        pos: { q: 0, r: 0 },
        meta: { facing: 0 } // Facing East
    };
    const leftFlanker: any = {
        id: 'L',
        team: 'A',
        pos: { q: 1, r: -1 } // Northeast of target (left side relative to East facing)
    };
    const rightFlanker: any = {
        id: 'R',
        team: 'A',
        pos: { q: 0, r: 1 } // Southeast of target (right side relative to East facing)
    };

    return {
        units: new Map([
            [target.id, target],
            [leftFlanker.id, leftFlanker],
            [rightFlanker.id, rightFlanker]
        ]),
        occupied: new Set(),
        terrainCost: () => 1,
        passable: () => true,
        blocksLos: () => false,
        rng: () => 0.0
    } as any;
}

function createRearAttackWorld(): WorldState {
    const target: any = {
        id: 'T',
        team: 'B',
        pos: { q: 0, r: 0 },
        meta: { facing: 0 } // Facing East
    };
    const rearAttacker: any = {
        id: 'R',
        team: 'A',
        pos: { q: -1, r: 0 } // West of target (rear)
    };

    return {
        units: new Map([
            [target.id, target],
            [rearAttacker.id, rearAttacker]
        ]),
        occupied: new Set(),
        terrainCost: () => 1,
        passable: () => true,
        blocksLos: () => false,
        rng: () => 0.0
    } as any;
}

describe('Flanking Detection', () => {
    it('detects left+right adjacent → flanked', () => {
        const world = createMockWorld();
        const info = flankInfo(world, 'L', 'T');

        expect(info.isFlanked).toBe(true);
        expect(info.left).toBe(true);
        expect(info.right).toBe(true);
        expect(info.rear).toBe(false);
    });

    it('detects rear attacks', () => {
        const world = createRearAttackWorld();
        const info = flankInfo(world, 'R', 'T');

        expect(info.arc).toBe('rear');
        expect(info.rear).toBe(true);
        expect(info.isFlanked).toBe(true);
    });

    it('provides correct modifiers for flanked targets', () => {
        const world = createMockWorld();
        const info = flankInfo(world, 'L', 'T');
        const mods = flankModifiers(info);

        expect(mods.multBonus).toBe(15); // Flanked bonus
        expect(mods.critPermilleBonus).toBe(100);
        expect(mods.armorPenBonus).toBe(0);
    });

    it('provides correct modifiers for rear attacks', () => {
        const world = createRearAttackWorld();
        const info = flankInfo(world, 'R', 'T');
        const mods = flankModifiers(info);

        expect(mods.multBonus).toBe(25); // Rear attack bonus
        expect(mods.critPermilleBonus).toBe(200);
        expect(mods.armorPenBonus).toBe(1);
    });

    it('provides no bonus for front attacks', () => {
        const target: any = {
            id: 'T',
            team: 'B',
            pos: { q: 0, r: 0 },
            meta: { facing: 0 } // Facing East
        };
        const frontAttacker: any = {
            id: 'F',
            team: 'A',
            pos: { q: 1, r: 0 } // East of target (front)
        };

        const world = {
            units: new Map([
                [target.id, target],
                [frontAttacker.id, frontAttacker]
            ]),
            occupied: new Set(),
            terrainCost: () => 1,
            passable: () => true,
            blocksLos: () => false,
            rng: () => 0.0
        } as any;

        const info = flankInfo(world, 'F', 'T');
        const mods = flankModifiers(info);

        expect(info.arc).toBe('front');
        expect(info.isFlanked).toBe(false);
        expect(mods.multBonus).toBe(0);
        expect(mods.critPermilleBonus).toBe(0);
        expect(mods.armorPenBonus).toBe(0);
    });

    it('handles missing units gracefully', () => {
        const world = createMockWorld();
        const info = flankInfo(world, 'NONEXISTENT', 'T');

        expect(info.arc).toBe('front');
        expect(info.isFlanked).toBe(false);
    });
});