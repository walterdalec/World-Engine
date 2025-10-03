/**
 * Type Guards for Battle System
 * Ensures runtime type safety for Unit objects and other battle types
 */

import type { Unit, UnitStats, HexPosition, BattleState } from './types';

/**
 * Type guard to ensure a Unit object has all required properties
 */
export function isValidUnit(obj: any): obj is Unit {
    return (
        obj &&
        typeof obj.id === 'string' &&
        typeof obj.name === 'string' &&
        typeof obj.kind === 'string' &&
        typeof obj.faction === 'string' &&
        typeof obj.race === 'string' &&
        typeof obj.archetype === 'string' &&
        typeof obj.level === 'number' &&
        isValidUnitStats(obj.stats) &&
        Array.isArray(obj.statuses) &&
        Array.isArray(obj.skills) &&
        typeof obj.isDead === 'boolean' // Explicitly check for isDead
    );
}

/**
 * Type guard for UnitStats
 */
export function isValidUnitStats(obj: any): obj is UnitStats {
    return (
        obj &&
        typeof obj.hp === 'number' &&
        typeof obj.maxHp === 'number' &&
        typeof obj.atk === 'number' &&
        typeof obj.def === 'number' &&
        typeof obj.mag === 'number' &&
        typeof obj.res === 'number' &&
        typeof obj.spd === 'number' &&
        typeof obj.rng === 'number' &&
        typeof obj.move === 'number'
    );
}

/**
 * Type guard for HexPosition
 */
export function isValidHexPosition(obj: any): obj is HexPosition {
    return (
        obj &&
        typeof obj.q === 'number' &&
        typeof obj.r === 'number'
    );
}

/**
 * Ensures a Unit object has all required properties, with fallbacks
 */
export function sanitizeUnit(unit: any): Unit {
    if (isValidUnit(unit)) {
        return unit;
    }

    // Create a sanitized unit with fallbacks
    return {
        id: unit.id || `unit_${Date.now()}`,
        name: unit.name || 'Unknown Unit',
        kind: unit.kind || 'Mercenary',
        faction: unit.faction || 'Player',
        race: unit.race || 'Human',
        archetype: unit.archetype || 'Warrior',
        level: unit.level || 1,
        stats: sanitizeUnitStats(unit.stats),
        statuses: Array.isArray(unit.statuses) ? unit.statuses : [],
        skills: Array.isArray(unit.skills) ? unit.skills : [],
        pos: isValidHexPosition(unit.pos) ? unit.pos : undefined,
        isCommander: Boolean(unit.isCommander),
        isDead: Boolean(unit.isDead), // Ensure isDead is always a boolean
        gear: unit.gear || undefined,
        facing: typeof unit.facing === 'number' ? unit.facing : undefined
    };
}

/**
 * Ensures UnitStats has all required properties with fallbacks
 */
export function sanitizeUnitStats(stats: any): UnitStats {
    if (isValidUnitStats(stats)) {
        return stats;
    }

    return {
        hp: stats?.hp || 100,
        maxHp: stats?.maxHp || 100,
        atk: stats?.atk || 10,
        def: stats?.def || 10,
        mag: stats?.mag || 5,
        res: stats?.res || 5,
        spd: stats?.spd || 10,
        rng: stats?.rng || 1,
        move: stats?.move || 3
    };
}

/**
 * Sanitizes an entire BattleState, ensuring all Units are valid
 */
export function sanitizeBattleState(state: any): BattleState {
    if (!state || !Array.isArray(state.units)) {
        throw new Error('Invalid BattleState: missing units array');
    }

    return {
        ...state,
        units: state.units.map(sanitizeUnit)
    };
}

/**
 * Debug function to log unit validation issues
 */
export function debugUnit(unit: any, context: string = 'Unknown'): void {
    console.group(`🐛 Unit Debug [${context}]`);
    console.log('Unit object:', unit);
    console.log('Has isDead property:', 'isDead' in unit);
    console.log('isDead value:', unit.isDead);
    console.log('isDead type:', typeof unit.isDead);
    console.log('Is valid unit:', isValidUnit(unit));
    console.groupEnd();
}