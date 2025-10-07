/**
 * Morale & Psychology System
 * TODO #10 — Morale & Psychology — Deep Spec v2
 * 
 * A deterministic, readable morale system that reacts to leadership, losses, 
 * terrain, and numbers while meaningfully altering combat tempo without chaos.
 */

// Core types and models
export type { MoraleState, MoraleBlock, MoraleFactors } from './model';
export {
    Thresholds,
    FactorCaps,
    DefaultMorale,
    serializeMorale,
    deserializeMorale,
    clampFactor
} from './model';

// Factor calculations
export {
    gatherFactors,
    factorLeadership,
    factorTerrain,
    factorCasualties,
    factorOutnumbered,
    factorEffects
} from './factors';

// Core computation and hysteresis
export {
    evaluateMorale,
    stepState,
    isRouting,
    isShaken,
    getMoraleSeverity,
    updateAllMorale,
    applyArmyMoraleShift,
    getArmyMoraleStats,
    type ArmyMoraleStats
} from './compute';

// Combat modifiers
export type { CombatMods } from './apply';
export {
    modsFor,
    applyMoraleToStats,
    applyMoraleToAccuracy,
    applyMoraleToCrit,
    applyMoraleToAP,
    getDefensiveBonus,
    shouldAutoFlee,
    getMoraleDisplay,
    type MoraleDisplay
} from './apply';

// Commander auras
export type { CommanderAura, AuraCoverage } from './auras';
export {
    DefaultAura,
    calculateAuraBonus,
    applyCommanderAuras,
    removeCommanderAuras,
    getAuraCoverage
} from './auras';

// Rally abilities
export type { RallyConfig, BannerConfig, SpeechConfig } from './rally';
export {
    DefaultRally,
    DefaultBanner,
    DefaultSpeech,
    executeRally,
    applyBannerEffect,
    executeInspirationalSpeech,
    tickRallyCooldowns
} from './rally';

// Fear effects
export type { FearConfig, RoarConfig, NecromanticFearConfig } from './fear';
export {
    DefaultFear,
    DefaultRoar,
    DefaultNecromanticFear,
    applyFearAura,
    executeTerrifyingRoar,
    applyDeathFear,
    removeFearSource,
    calculateFearPenalty,
    isFearImmune,
    tryApplyFear
} from './fear';

// Flee mechanics
export type { FleeOutcome } from './flee';
export {
    attemptFlee,
    forceRoutingFlee,
    checkSurrenderConditions
} from './flee';

// Telemetry and debugging
export type { MoraleDescription, MoraleSnapshot, MoraleValidation } from './telemetry';
export {
    describeMorale,
    captureMoraleSnapshot,
    logMoraleBreakdown,
    exportMoraleData,
    validateMoraleSystem,
    MoraleDebug
} from './telemetry';

/**
 * Main morale system integration functions
 */

import type { BattleState } from '../types';
import { updateAllMorale, applyArmyMoraleShift } from './compute';
import { applyCommanderAuras, removeCommanderAuras } from './auras';
import { tickRallyCooldowns } from './rally';
import { forceRoutingFlee, checkSurrenderConditions } from './flee';

/**
 * Initialize morale system for a battle
 */
export function initializeMoraleSystem(battleState: BattleState): void {
    // Apply initial commander auras
    applyCommanderAuras(battleState);

    // Initialize morale for all units
    updateAllMorale(battleState);

    battleState.log.push('Morale system initialized.');
}

/**
 * Process morale at the start of each turn
 */
export function processTurnStartMorale(battleState: BattleState): void {
    // Update morale for all units
    updateAllMorale(battleState);

    // Refresh commander auras (every 2 rounds as per spec)
    if (battleState.turn % 2 === 0) {
        applyCommanderAuras(battleState);
    }

    // Process routing units that must attempt to flee
    const routingUnits = battleState.units.filter(u => {
        if (u.isDead || u.isCommander) return false;
        const morale = (u as any).meta?.morale;
        return morale && morale.state === 'routing';
    });

    for (const unit of routingUnits) {
        forceRoutingFlee(battleState, unit.id);
    }
}

/**
 * Process morale at the end of each turn
 */
export function processTurnEndMorale(battleState: BattleState): void {
    // Tick rally cooldowns
    tickRallyCooldowns(battleState);

    // Check for surrender conditions
    const playerSurrender = checkSurrenderConditions(battleState, 'Player');
    const enemySurrender = checkSurrenderConditions(battleState, 'Enemy');

    if (playerSurrender) {
        battleState.phase = 'Defeat';
        battleState.log.push('Player forces have broken and fled the field!');
    } else if (enemySurrender) {
        battleState.phase = 'Victory';
        battleState.log.push('Enemy forces have broken and fled the field!');
    }
}

/**
 * Handle unit death and its morale consequences
 */
export function processUnitDeath(battleState: BattleState, deadUnitId: string): void {
    const deadUnit = battleState.units.find(u => u.id === deadUnitId);
    if (!deadUnit || !deadUnit.pos) return;

    // Check if this was a commander
    if (deadUnit.isCommander) {
        // Apply army-wide morale penalty
        const faction = deadUnit.faction;
        applyArmyMoraleShift(battleState, -15);

        // Remove commander auras
        removeCommanderAuras(battleState, deadUnit.name);

        battleState.log.push(`Commander ${deadUnit.name} has fallen! Army morale plummets.`);
    }

    // Apply localized death fear if unit died horrifically
    // (This would be triggered by necromantic abilities, brutal kills, etc.)
    // For now, we'll apply minor fear to nearby enemies
    const nearbyEnemies = battleState.units.filter(u => {
        if (!u.pos || u.isDead || u.faction === deadUnit.faction) return false;
        const distance = Math.abs(u.pos.q - deadUnit.pos!.q) + Math.abs(u.pos.r - deadUnit.pos!.r);
        return distance <= 1;
    });

    if (nearbyEnemies.length > 0) {
        // Minor morale penalty for witnessing death
        for (const enemy of nearbyEnemies) {
            const currentMorale = (enemy as any).meta?.morale;
            if (currentMorale) {
                currentMorale.value = Math.max(0, currentMorale.value - 2);
            }
        }
    }

    // Refresh morale calculations
    updateAllMorale(battleState);
}

/**
 * Quick morale status check for UI
 */
export function getMoraleStatus(battleState: BattleState, unitId: string): {
    state: string;
    value: number;
    needsAttention: boolean;
} {
    const unit = battleState.units.find(u => u.id === unitId);
    if (!unit) return { state: 'unknown', value: 0, needsAttention: false };

    const morale = (unit as any).meta?.morale;
    if (!morale) return { state: 'steady', value: 70, needsAttention: false };

    return {
        state: morale.state,
        value: morale.ema,
        needsAttention: morale.state === 'wavering' || morale.state === 'routing'
    };
}