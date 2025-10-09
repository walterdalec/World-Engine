/**
 * Round Order Tests
 * Verify deterministic initiative ordering in round mode
 */

import { TurnManager } from '../TurnManager';
import type { UnitRef } from '../types';

function createTestUnit(id: string, speed: number, team = 'A'): UnitRef {
    return {
        id,
        team,
        speed,
        apMax: 10,
        ap: 10,
        meta: { name: `Unit${id}` }
    };
}

describe('Round Scheduler', () => {
    it('orders units by speed descending, then by ID ascending', () => {
        const tm = new TurnManager('round');

        // Add units in random order
        tm.addUnit(createTestUnit('C', 8));
        tm.addUnit(createTestUnit('A', 10));
        tm.addUnit(createTestUnit('B', 10));
        tm.addUnit(createTestUnit('D', 6));

        // First round should be: A(10), B(10), C(8), D(6)
        expect(tm.next().unit).toBe('A');
        expect(tm.next().unit).toBe('B');
        expect(tm.next().unit).toBe('C');
        expect(tm.next().unit).toBe('D');

        // Second round starts
        expect(tm.next().unit).toBe('A');
        expect(tm.next().round).toBe(2);
    });

    it('skips stunned units', () => {
        const tm = new TurnManager('round');

        const stunnedUnit: UnitRef = {
            id: 'S',
            team: 'A',
            speed: 15,
            apMax: 10,
            ap: 10,
            flags: { stunned: true }
        };

        tm.addUnit(createTestUnit('A', 10));
        tm.addUnit(stunnedUnit);
        tm.addUnit(createTestUnit('B', 8));

        // Should skip stunned unit S and go A -> B -> A
        expect(tm.next().unit).toBe('A');
        expect(tm.next().unit).toBe('B');
        expect(tm.next().unit).toBe('A');
    });

    it('handles skipNext flag correctly', () => {
        const tm = new TurnManager('round');

        const skipUnit: UnitRef = {
            id: 'Skip',
            team: 'A',
            speed: 15,
            apMax: 10,
            ap: 10,
            flags: { skipNext: true }
        };

        tm.addUnit(createTestUnit('A', 10));
        tm.addUnit(skipUnit);

        // First call should skip "Skip" unit and return "A" instead
        expect(tm.next().unit).toBe('A');
        // Second call should return "Skip" (skipNext flag is now cleared)
        expect(tm.next().unit).toBe('Skip');
    });
});