/**
 * Apply Morale Modifiers to Combat
 * TODO #10 — Morale & Psychology — Deep Spec v2
 */

import type { MoraleState } from './model';

/**
 * Combat modifiers applied based on morale state
 */
export interface CombatMods {
    accMult: number;      // Accuracy multiplier
    apDelta: number;      // Action points delta
    initDelta: number;    // Initiative delta
    critPermille: number; // Critical hit chance change (per mille)
}

/**
 * Get combat modifiers for a morale state
 */
export function modsFor(state: MoraleState): CombatMods {
    switch (state) {
        case 'steady':
            return {
                accMult: 1.00,
                apDelta: 0,
                initDelta: 0,
                critPermille: 0
            };

        case 'shaken':
            return {
                accMult: 0.90,
                apDelta: -1,
                initDelta: -2,
                critPermille: -50
            };

        case 'wavering':
            return {
                accMult: 0.75,
                apDelta: -2,
                initDelta: -5,
                critPermille: -150
            };

        case 'routing':
            return {
                accMult: 0.50,
                apDelta: -3,
                initDelta: -8,
                critPermille: -300
            };
    }
}

/**
 * Apply morale modifiers to unit stats
 */
export function applyMoraleToStats(baseStats: any, moraleState: MoraleState): any {
    const mods = modsFor(moraleState);

    return {
        ...baseStats,
        spd: Math.max(1, baseStats.spd + mods.initDelta), // Initiative from SPD
        // Store morale mods for combat calculations
        _moraleMods: mods
    };
}

/**
 * Apply morale modifiers to damage calculation
 */
export function applyMoraleToAccuracy(baseAccuracy: number, moraleState: MoraleState): number {
    const mods = modsFor(moraleState);
    return Math.max(0.1, baseAccuracy * mods.accMult); // Minimum 10% accuracy
}

/**
 * Apply morale modifiers to critical hit chance
 */
export function applyMoraleToCrit(baseCritChance: number, moraleState: MoraleState): number {
    const mods = modsFor(moraleState);
    // Convert permille to percentage and apply
    return Math.max(0, baseCritChance + (mods.critPermille / 10));
}

/**
 * Apply morale modifiers to action points
 */
export function applyMoraleToAP(baseAP: number, moraleState: MoraleState): number {
    const mods = modsFor(moraleState);
    return Math.max(1, baseAP + mods.apDelta); // Minimum 1 AP
}

/**
 * Get defensive bonus against routing attackers
 */
export function getDefensiveBonus(attackerMorale: MoraleState): number {
    switch (attackerMorale) {
        case 'routing': return 0.2;   // +20% defense vs routing attackers
        case 'wavering': return 0.1;  // +10% defense vs wavering attackers
        default: return 0;
    }
}

/**
 * Check if unit should auto-flee due to routing
 */
export function shouldAutoFlee(moraleState: MoraleState): boolean {
    return moraleState === 'routing';
}

/**
 * Get morale state display information
 */
export interface MoraleDisplay {
    name: string;
    color: string;
    icon: string;
    description: string;
}

export function getMoraleDisplay(state: MoraleState): MoraleDisplay {
    switch (state) {
        case 'steady':
            return {
                name: 'Steady',
                color: '#22c55e', // green
                icon: '🛡️',
                description: 'Unit is fighting at full effectiveness'
            };

        case 'shaken':
            return {
                name: 'Shaken',
                color: '#eab308', // yellow
                icon: '😰',
                description: 'Slightly reduced accuracy and action points'
            };

        case 'wavering':
            return {
                name: 'Wavering',
                color: '#f97316', // orange
                icon: '😨',
                description: 'Significantly impaired combat effectiveness'
            };

        case 'routing':
            return {
                name: 'Routing',
                color: '#ef4444', // red
                icon: '🏃',
                description: 'Unit will attempt to flee from combat'
            };
    }
}