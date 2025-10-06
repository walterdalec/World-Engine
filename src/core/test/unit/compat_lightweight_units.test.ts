// packages/core/test/unit/compat_lightweight_units.test.ts
import { computeDamage } from '../../unit/damage';

// Intentionally pass minimal objects (like early #04/#07A world units)
const A: any = { id: 'A', team: 'T', hp: 10, mp: 0, ap: 0, speed: 0 };
const D: any = { id: 'D', team: 'T', hp: 10, mp: 0, ap: 0, speed: 0 };

const ctx: any = {
    rng: () => 0.0,
    defenseBonusAt: () => 0,
    damageKind: 'Physical'
};

describe('computeDamage tolerates lightweight units', () => {
    it('does not throw and returns integer result', () => {
        const out = computeDamage(A, D, { power: 5, multiplier: 100, canCrit: false }, ctx);
        expect(typeof out.final).toBe('number');
        expect(out.final).toBeGreaterThanOrEqual(0);
    });
});