/**
 * Morale Telemetry & Debug Tools
 * TODO #10 — Morale & Psychology — Deep Spec v2
 */

// import type { Unit } from '../types'; // Currently unused
import type { BattleState } from '../types';
import type { MoraleBlock, MoraleFactors } from './model';
import { gatherFactors } from './factors';
import { getMoraleSeverity } from './compute';

/**
 * Describe morale state for UI tooltips
 */
export interface MoraleDescription {
    state: string;
    ema: number;
    value: number;
    factors: MoraleFactors;
    severity: number;
    summary: string;
}

/**
 * Get comprehensive morale description for a unit
 */
export function describeMorale(battleState: BattleState, unitId: string): MoraleDescription | null {
    const unit = battleState.units.find(u => u.id === unitId);
    if (!unit) return null;

    const morale = (unit as any).meta?.morale as MoraleBlock;
    if (!morale) {
        // Return default description
        return {
            state: 'steady',
            ema: 70,
            value: 70,
            factors: gatherFactors(battleState, unitId),
            severity: 0,
            summary: 'Unit has steady morale (default)'
        };
    }

    const severity = getMoraleSeverity(morale.state);

    return {
        state: morale.state,
        ema: morale.ema,
        value: morale.value,
        factors: morale.lastFactors,
        severity,
        summary: generateMoraleSummary(morale, unit.name)
    };
}

/**
 * Generate human-readable morale summary
 */
function generateMoraleSummary(morale: MoraleBlock, unitName: string): string {
    const state = morale.state;
    const factors = morale.lastFactors;

    let summary = `${unitName} is ${state} (${morale.ema}/100). `;

    // Highlight key factors
    const positiveFactors: string[] = [];
    const negativeFactors: string[] = [];

    if (factors.leadership > 0) positiveFactors.push(`leadership +${factors.leadership}`);
    if (factors.terrain > 0) positiveFactors.push(`terrain +${factors.terrain}`);
    if (factors.effects > 0) positiveFactors.push(`effects +${factors.effects}`);

    if (factors.casualties < 0) negativeFactors.push(`casualties ${factors.casualties}`);
    if (factors.outnumbered < 0) negativeFactors.push(`outnumbered ${factors.outnumbered}`);
    if (factors.terrain < 0) negativeFactors.push(`terrain ${factors.terrain}`);
    if (factors.effects < 0) negativeFactors.push(`effects ${factors.effects}`);

    if (positiveFactors.length > 0) {
        summary += `Boosted by: ${positiveFactors.join(', ')}. `;
    }

    if (negativeFactors.length > 0) {
        summary += `Suffering from: ${negativeFactors.join(', ')}. `;
    }

    return summary.trim();
}

/**
 * Debug snapshot of all unit morale states
 */
export interface MoraleSnapshot {
    turn: number;
    phase: string;
    units: Array<{
        id: string;
        name: string;
        faction: string;
        morale: MoraleDescription | null;
    }>;
    armyStats: {
        player: {
            average: number;
            distribution: Record<string, number>;
        };
        enemy: {
            average: number;
            distribution: Record<string, number>;
        };
    };
}

/**
 * Capture morale snapshot for debugging
 */
export function captureMoraleSnapshot(battleState: BattleState): MoraleSnapshot {
    const units = battleState.units
        .filter(u => !u.isDead && !u.isCommander)
        .map(u => ({
            id: u.id,
            name: u.name,
            faction: u.faction,
            morale: describeMorale(battleState, u.id)
        }));

    // Calculate army statistics
    const playerUnits = units.filter(u => u.faction === 'Player');
    const enemyUnits = units.filter(u => u.faction === 'Enemy');

    const playerStats = calculateArmyStats(playerUnits);
    const enemyStats = calculateArmyStats(enemyUnits);

    return {
        turn: battleState.turn,
        phase: battleState.phase,
        units,
        armyStats: {
            player: playerStats,
            enemy: enemyStats
        }
    };
}

/**
 * Calculate army morale statistics
 */
function calculateArmyStats(units: Array<{ morale: MoraleDescription | null }>): {
    average: number;
    distribution: Record<string, number>;
} {
    let totalMorale = 0;
    const distribution: Record<string, number> = {
        steady: 0,
        shaken: 0,
        wavering: 0,
        routing: 0
    };

    for (const unit of units) {
        if (unit.morale) {
            totalMorale += unit.morale.ema;
            distribution[unit.morale.state]++;
        } else {
            totalMorale += 70; // Default morale
            distribution.steady++;
        }
    }

    return {
        average: units.length > 0 ? totalMorale / units.length : 70,
        distribution
    };
}

/**
 * Log detailed morale breakdown for debugging
 */
export function logMoraleBreakdown(battleState: BattleState, unitId: string): void {
    const description = describeMorale(battleState, unitId);
    if (!description) {
        console.log(`🎭 No morale data for unit ${unitId}`);
        return;
    }

    console.log(`🎭 Morale Breakdown for ${unitId}:`);
    console.log(`  State: ${description.state} (severity: ${description.severity})`);
    console.log(`  EMA: ${description.ema}/100, Raw: ${description.value}/100`);
    console.log(`  Factors:`);
    console.log(`    Leadership: ${description.factors.leadership >= 0 ? '+' : ''}${description.factors.leadership}`);
    console.log(`    Terrain: ${description.factors.terrain >= 0 ? '+' : ''}${description.factors.terrain}`);
    console.log(`    Casualties: ${description.factors.casualties >= 0 ? '+' : ''}${description.factors.casualties}`);
    console.log(`    Outnumbered: ${description.factors.outnumbered >= 0 ? '+' : ''}${description.factors.outnumbered}`);
    console.log(`    Effects: ${description.factors.effects >= 0 ? '+' : ''}${description.factors.effects}`);
    console.log(`  Summary: ${description.summary}`);
}

/**
 * Export morale data for external analysis
 */
export function exportMoraleData(battleState: BattleState): string {
    const snapshot = captureMoraleSnapshot(battleState);
    return JSON.stringify(snapshot, null, 2);
}

/**
 * Validate morale system integrity
 */
export interface MoraleValidation {
    valid: boolean;
    errors: string[];
    warnings: string[];
}

export function validateMoraleSystem(battleState: BattleState): MoraleValidation {
    const errors: string[] = [];
    const warnings: string[] = [];

    for (const unit of battleState.units) {
        if (unit.isDead || unit.isCommander) continue;

        const morale = (unit as any).meta?.morale as MoraleBlock;
        if (!morale) {
            warnings.push(`Unit ${unit.name} has no morale data`);
            continue;
        }

        // Validate morale bounds
        if (morale.value < 0 || morale.value > 100) {
            errors.push(`Unit ${unit.name} has invalid morale value: ${morale.value}`);
        }

        if (morale.ema < 0 || morale.ema > 100) {
            errors.push(`Unit ${unit.name} has invalid EMA: ${morale.ema}`);
        }

        // Validate factors are within expected ranges
        const factors = morale.lastFactors;
        if (factors.leadership < 0 || factors.leadership > 20) {
            warnings.push(`Unit ${unit.name} has unusual leadership factor: ${factors.leadership}`);
        }

        if (factors.casualties > 5) {
            warnings.push(`Unit ${unit.name} has positive casualties factor: ${factors.casualties}`);
        }

        // Check for state consistency
        const description = describeMorale(battleState, unit.id);
        if (description && description.state !== morale.state) {
            errors.push(`Unit ${unit.name} has mismatched morale states`);
        }
    }

    return {
        valid: errors.length === 0,
        errors,
        warnings
    };
}

/**
 * Morale debug hooks for development
 */
export const MoraleDebug = {
    /**
     * Force set morale state for testing
     */
    setMorale(battleState: BattleState, unitId: string, value: number): void {
        const unit = battleState.units.find(u => u.id === unitId);
        if (!unit) return;

        if (!(unit as any).meta) (unit as any).meta = {};

        const morale = (unit as any).meta.morale as MoraleBlock;
        if (morale) {
            morale.value = value;
            morale.ema = value;
        }

        console.log(`🎭 DEBUG: Set ${unit.name} morale to ${value}`);
    },

    /**
     * Trigger army-wide morale crisis
     */
    triggerCrisis(battleState: BattleState, faction: 'Player' | 'Enemy'): void {
        for (const unit of battleState.units) {
            if (unit.faction === faction && !unit.isDead && !unit.isCommander) {
                this.setMorale(battleState, unit.id, 20); // Force routing
            }
        }

        console.log(`🎭 DEBUG: Triggered morale crisis for ${faction}`);
    },

    /**
     * Boost army morale
     */
    boostArmy(battleState: BattleState, faction: 'Player' | 'Enemy'): void {
        for (const unit of battleState.units) {
            if (unit.faction === faction && !unit.isDead && !unit.isCommander) {
                this.setMorale(battleState, unit.id, 90); // High morale
            }
        }

        console.log(`🎭 DEBUG: Boosted ${faction} army morale`);
    },

    /**
     * Log complete morale state
     */
    logAll(battleState: BattleState): void {
        console.log('🎭 === MORALE DEBUG REPORT ===');
        const snapshot = captureMoraleSnapshot(battleState);
        console.log('Turn:', snapshot.turn, 'Phase:', snapshot.phase);
        console.log('Player Army:', snapshot.armyStats.player);
        console.log('Enemy Army:', snapshot.armyStats.enemy);

        for (const unit of snapshot.units) {
            if (unit.morale) {
                console.log(`${unit.name}: ${unit.morale.state} (${unit.morale.ema})`);
            }
        }
    }
};