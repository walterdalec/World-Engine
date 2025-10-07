/**
 * Morale Computation & Hysteresis
 * TODO #10 — Morale & Psychology — Deep Spec v2
 */

import { Thresholds, type MoraleBlock, type MoraleState } from './model';
import { gatherFactors } from './factors';
import type { BattleState } from '../types';

/**
 * Evaluate morale for a unit, applying EMA smoothing and hysteresis
 */
export function evaluateMorale(state: BattleState, unitId: string, prev?: MoraleBlock): MoraleBlock {
    const factors = gatherFactors(state, unitId);
    const base = prev?.ema ?? 70; // Default baseline if unseen

    // Calculate raw morale value
    const raw = base + factors.leadership + factors.terrain + factors.casualties + factors.outnumbered + factors.effects;

    // Clamp to valid range
    const clamped = Math.max(Thresholds.clamp.min, Math.min(Thresholds.clamp.max, raw));

    // Apply exponential moving average for smoothing
    const ema = Math.round(
        (prev?.ema ?? clamped) * (1 - Thresholds.emaAlpha) + clamped * Thresholds.emaAlpha
    );

    // Determine new state with hysteresis
    const state_new = stepState(prev?.state || 'steady', ema);

    // Update history (keep last 3 values for debugging)
    const history = (prev?.history || []).slice(-2);
    history.push(clamped);

    return {
        value: clamped,
        state: state_new,
        ema,
        history,
        lastFactors: factors,
        locked: prev?.locked
    };
}

/**
 * Step morale state with hysteresis to prevent flip-flopping
 */
export function stepState(current: MoraleState, ema: number): MoraleState {
    const E = Thresholds.enter;
    const X = Thresholds.exit;

    switch (current) {
        case 'steady':
            if (ema <= E.shaken) return 'shaken';
            return 'steady';

        case 'shaken':
            if (ema <= E.wavering) return 'wavering';
            if (ema >= X.shaken) return 'steady';
            return 'shaken';

        case 'wavering':
            if (ema <= E.routing) return 'routing';
            if (ema >= X.wavering) return 'shaken';
            return 'wavering';

        case 'routing':
            if (ema >= X.routing) return 'wavering';
            return 'routing';
    }
}

/**
 * Check if morale state represents a broken state requiring flee attempts
 */
export function isRouting(state: MoraleState): boolean {
    return state === 'routing';
}

/**
 * Check if morale state significantly impairs combat effectiveness
 */
export function isShaken(state: MoraleState): boolean {
    return state === 'shaken' || state === 'wavering' || state === 'routing';
}

/**
 * Get the severity level of morale impairment (0=none, 3=routing)
 */
export function getMoraleSeverity(state: MoraleState): number {
    switch (state) {
        case 'steady': return 0;
        case 'shaken': return 1;
        case 'wavering': return 2;
        case 'routing': return 3;
    }
}

/**
 * Batch update morale for all units in battle
 */
export function updateAllMorale(battleState: BattleState): void {
    for (const unit of battleState.units) {
        if (unit.isDead || unit.isCommander) continue;

        // Get previous morale or create default
        const prevMorale = (unit as any).meta?.morale;

        // Evaluate new morale
        const newMorale = evaluateMorale(battleState, unit.id, prevMorale);

        // Store in unit metadata
        if (!(unit as any).meta) {
            (unit as any).meta = {};
        }
        (unit as any).meta.morale = newMorale;

        // Log significant state changes
        if (!prevMorale || prevMorale.state !== newMorale.state) {
            const factors = newMorale.lastFactors;
            const formatValue = (val: number) => val >= 0 ? `+${val}` : `${val}`;
            const factorStr = `{lead:${formatValue(factors.leadership)}, terr:${formatValue(factors.terrain)}, cas:${formatValue(factors.casualties)}, out:${formatValue(factors.outnumbered)}, eff:${formatValue(factors.effects)}}`;
            battleState.log.push(`MORALE u=${unit.name} state=${newMorale.state} ema=${newMorale.ema} f=${factorStr}`);
        }
    }
}

/**
 * Apply army-wide morale effects (for strategic layer integration)
 */
export function applyArmyMoraleShift(battleState: BattleState, shift: number): void {
    const formatShift = shift >= 0 ? `+${shift}` : `${shift}`;
    battleState.log.push(`Army morale shift: ${formatShift}`);

    for (const unit of battleState.units) {
        if (unit.isDead || unit.isCommander) continue;

        const prevMorale = (unit as any).meta?.morale;
        if (prevMorale) {
            // Apply shift to base value and recalculate
            const adjustedValue = Math.max(0, Math.min(100, prevMorale.value + shift));
            const adjustedEma = Math.max(0, Math.min(100, prevMorale.ema + shift));

            const newMorale: MoraleBlock = {
                ...prevMorale,
                value: adjustedValue,
                ema: adjustedEma,
                state: stepState(prevMorale.state, adjustedEma)
            };

            (unit as any).meta.morale = newMorale;
        }
    }
}

/**
 * Get aggregate morale statistics for the army
 */
export interface ArmyMoraleStats {
    averageMorale: number;
    steadyCount: number;
    shakenCount: number;
    waveringCount: number;
    routingCount: number;
    totalUnits: number;
}

export function getArmyMoraleStats(battleState: BattleState, faction: 'Player' | 'Enemy'): ArmyMoraleStats {
    const units = battleState.units.filter(u =>
        u.faction === faction && !u.isDead && !u.isCommander
    );

    let totalMorale = 0;
    let steadyCount = 0;
    let shakenCount = 0;
    let waveringCount = 0;
    let routingCount = 0;

    for (const unit of units) {
        const morale = (unit as any).meta?.morale;
        if (morale) {
            totalMorale += morale.ema;
            switch (morale.state) {
                case 'steady': steadyCount++; break;
                case 'shaken': shakenCount++; break;
                case 'wavering': waveringCount++; break;
                case 'routing': routingCount++; break;
            }
        } else {
            totalMorale += 70; // Default morale
            steadyCount++;
        }
    }

    return {
        averageMorale: units.length > 0 ? totalMorale / units.length : 70,
        steadyCount,
        shakenCount,
        waveringCount,
        routingCount,
        totalUnits: units.length
    };
}