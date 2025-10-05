/**
 * CT Fairness Tests
 * Verify CT initiative system maintains fairness over time
 */

import { describe, it, expect } from 'vitest';
import { TurnManager } from '../TurnManager';
import type { UnitRef } from '../types';

function createTestUnit(id: string, speed: number): UnitRef {
    return {
        id,
        team: 'A',
        speed,
        apMax: 10,
        ap: 10
    };
}

describe('CT Scheduler', () => {
    it('gives faster units more turns over time', () => {
        const tm = new TurnManager('ct');

        tm.addUnit(createTestUnit('Fast', 20));
        tm.addUnit(createTestUnit('Slow', 10));

        const turnCounts = new Map<string, number>();
        turnCounts.set('Fast', 0);
        turnCounts.set('Slow', 0);

        // Run 100 turns and count
        for (let i = 0; i < 100; i++) {
            const event = tm.next();
            const count = turnCounts.get(event.unit!) || 0;
            turnCounts.set(event.unit!, count + 1);
        }

        // Fast unit should get roughly 2x as many turns
        const fastTurns = turnCounts.get('Fast')!;
        const slowTurns = turnCounts.get('Slow')!;

        expect(fastTurns).toBeGreaterThan(slowTurns);
        expect(fastTurns / slowTurns).toBeCloseTo(2, 0.5);
    });

    it('advances time correctly', () => {
        const tm = new TurnManager('ct');

        tm.addUnit(createTestUnit('A', 10));

        const initialState = tm.getState();
        expect(initialState.currentTime).toBe(0);

        // Get a few turns
        tm.next();
        tm.next();

        const laterState = tm.getState();
        expect(laterState.currentTime).toBeGreaterThan(0);
    });

    it('handles time consumption correctly', () => {
        const tm = new TurnManager('ct');

        tm.addUnit(createTestUnit('A', 50));
        tm.addUnit(createTestUnit('B', 50));

        tm.next(); // A's turn

        // A performs action with time cost
        tm.consume('A', 5, 20); // 5 AP, 20 time

        const state = tm.getState();
        expect(state.currentTime).toBeGreaterThan(0);
    });
});