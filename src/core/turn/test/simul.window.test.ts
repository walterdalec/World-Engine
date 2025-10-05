/**
 * Action Window Equivalence Tests
 * Verify simultaneous action resolution is deterministic
 */

import { describe, it, expect } from 'vitest';
import { TurnManager } from '../TurnManager';
import type { UnitRef, PlannedAction } from '../types';

function createTestUnit(id: string, speed: number): UnitRef {
    return {
        id,
        team: 'A',
        speed,
        apMax: 10,
        ap: 10
    };
}

function createAction(actor: string, kind: string): PlannedAction {
    return {
        actor,
        kind,
        targets: [],
        cost: { ap: 1 }
    };
}

describe('Simultaneous Action Resolution', () => {
    it('sorts actions deterministically by speed and actor ID', () => {
        const tm = new TurnManager('round');

        tm.addUnit(createTestUnit('C', 8));
        tm.addUnit(createTestUnit('A', 10));
        tm.addUnit(createTestUnit('B', 10));

        // Declare actions in random order
        tm.declareAction(createAction('C', 'attack'));
        tm.declareAction(createAction('A', 'move'));
        tm.declareAction(createAction('B', 'cast'));

        const report = tm.resolve();

        // Should be sorted by speed desc (A,B then C), then by kind
        expect(report.log).toEqual(['A:move', 'B:cast', 'C:attack']);
    });

    it('maintains deterministic ordering across multiple runs', () => {
        const results: string[][] = [];

        for (let run = 0; run < 5; run++) {
            const tm = new TurnManager('round', 12345); // Same seed

            tm.addUnit(createTestUnit('Alpha', 15));
            tm.addUnit(createTestUnit('Beta', 12));
            tm.addUnit(createTestUnit('Gamma', 15));

            tm.declareAction(createAction('Beta', 'defend'));
            tm.declareAction(createAction('Gamma', 'attack'));
            tm.declareAction(createAction('Alpha', 'move'));

            const report = tm.resolve();
            results.push(report.log);
        }

        // All runs should produce identical ordering
        for (let i = 1; i < results.length; i++) {
            expect(results[i]).toEqual(results[0]);
        }
    });

    it('respects action kind priority ordering', () => {
        const tm = new TurnManager('round');

        tm.addUnit(createTestUnit('A', 10));

        // Same unit, multiple actions with different kinds
        tm.declareAction(createAction('A', 'attack'));
        tm.declareAction(createAction('A', 'defend'));
        tm.declareAction(createAction('A', 'move'));
        tm.declareAction(createAction('A', 'wait'));

        const report = tm.resolve();

        // Should follow kind priority: defend < wait < move < attack
        expect(report.log).toEqual(['A:defend', 'A:wait', 'A:move', 'A:attack']);
    });
});