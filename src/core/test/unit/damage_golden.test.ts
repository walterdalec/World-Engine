// packages/core/test/unit/damage_golden.test.ts
import { axial } from '../../action/hex';
import { computeDamage } from '../../unit/damage';

const mk = (over?: Partial<any>) => ({
    id: 'A',
    name: 'A',
    team: 'T',
    level: 1,
    pos: axial(0, 0),
    base: { str: 10, dex: 8, con: 10, int: 6, wis: 5, cha: 5, spd: 6, lck: 5 },
    equips: {},
    resist: {},
    hp: 50,
    mp: 10,
    ap: 10,
    statuses: [],
    ...over
});

describe('damage pipeline', () => {
    it('physical vs armor, no crit', () => {
        const a = mk();
        const d = mk({ id: 'D', name: 'D' });
        const ctx = {
            rng: () => 0.0,
            defenseBonusAt: () => 0,
            damageKind: 'Physical' as const
        };
        const out = computeDamage(a, d, { power: 5, multiplier: 100, canCrit: false }, ctx);
        expect(out.hit).toBe(true);
        expect(out.final).toBeGreaterThan(0);
    });

    it('magical applies resist and terrain', () => {
        const a = mk();
        const d = mk({ id: 'D', resist: { Fire: 25 }, pos: axial(1, 0) });
        const ctx = {
            rng: () => 0.0,
            defenseBonusAt: () => 20,
            damageKind: 'Magical' as const,
            damageSchool: 'Fire' as const
        };
        const out = computeDamage(a, d, { power: 10, multiplier: 120, canCrit: false, resistPen: 10 }, ctx);
        // 25% resist - 10 pen = 15% remaining resist; then 20% terrain reduction
        expect(out.final).toBeLessThan(out.mitigated);
    });

    it('crit multiplies damage deterministically', () => {
        const a = mk({ base: { str: 10, dex: 8, con: 10, int: 6, wis: 5, cha: 5, spd: 6, lck: 100 } });
        const d = mk({ id: 'D' });
        // rng→crit: use tiny roll to guarantee crit
        const ctx = {
            rng: () => 0.0,
            defenseBonusAt: () => 0,
            damageKind: 'Physical' as const
        };
        const out = computeDamage(a, d, { power: 5, multiplier: 100, canCrit: true }, ctx);
        expect(out.crit).toBe(true);
        expect(out.final).toBeGreaterThan(out.mitigated);
    });
});