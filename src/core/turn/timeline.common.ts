/**
 * Common Timeline Structures
 * Shared data structures for Round and CT schedulers
 */

import type { UnitId, UnitRef } from './types';

export interface TimelineEntry {
    id: UnitId;
    speed: number;
    apMax: number;
    ap: number;
    meter: number;      // CT: initiative meter; Round: unused
    nextTick: number;   // CT: next eligible time
    stunned: boolean;
    skipNext: boolean;
    team: string;
}

export function fromUnit(u: UnitRef): TimelineEntry {
    return {
        id: u.id,
        team: u.team,
        speed: u.speed,
        apMax: u.apMax,
        ap: u.ap,
        meter: 0,
        nextTick: 0,
        stunned: !!u.flags?.stunned,
        skipNext: !!u.flags?.skipNext,
    };
}

// Deterministic tiebreaker: higher speed first, then lexicographic ID
export const TIEBREAK = (a: TimelineEntry, b: TimelineEntry) =>
    (b.speed - a.speed) || (a.id < b.id ? -1 : 1);