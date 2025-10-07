/**
 * Action Validation Tests
 */

import { describe, it, expect } from '@jest/globals';
import { axial } from '../../action/hex';
import { validateAP, validateRange } from '../../action/validators';
import type { WorldState } from '../../action/types';

describe('validators', () => {
    it('ap check', () => {
        const st: WorldState = {
            units: new Map([['a', { id: 'a', team: 'T1', pos: axial(0, 0), hp: 10, mp: 10, ap: 5, speed: 10 }]]),
            occupied: new Set(),
            terrainCost: () => 1,
            passable: () => true,
            blocksLos: () => false,
            rng: () => 0.5
        };

        expect(validateAP(st, { actor: 'a', kind: 'wait', targets: [], cost: { ap: 3 } }).ok).toBe(true);
        expect(validateAP(st, { actor: 'a', kind: 'wait', targets: [], cost: { ap: 8 } }).ok).toBe(false);
    });

    it('range check', () => {
        expect(validateRange(2, axial(0, 0), [axial(2, 0)])).toEqual({ ok: true });
        expect(validateRange(1, axial(0, 0), [axial(2, 0)])).toEqual({ ok: false, reasons: ['out_of_range'] });
    });

    it('validates multiple targets within range', () => {
        const origin = axial(0, 0);
        const targets = [axial(1, 0), axial(0, 1), axial(1, -1)];
        expect(validateRange(1, origin, targets)).toEqual({ ok: true });

        const farTargets = [axial(1, 0), axial(3, 0)];
        expect(validateRange(1, origin, farTargets)).toEqual({ ok: false, reasons: ['out_of_range'] });
    });
});