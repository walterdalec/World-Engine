/**
 * Fear Effects for Morale Reduction
 * TODO #10 — Morale & Psychology — Deep Spec v2
 */

import type { BattleState, Unit, HexPosition } from '../types';
import { hexDistance } from '../engine';

/**
 * Fear configuration
 */
export interface FearConfig {
    moraleReduction: number; // Morale penalty per round
    maxStacks: number;       // Maximum stacks of fear
    range: number;           // Fear aura range
    duration: number;        // How long fear lasts after source removal
}

export const DefaultFear: FearConfig = {
    moraleReduction: -5,
    maxStacks: 5,
    range: 2,
    duration: 2
};

/**
 * Apply fear aura from a unit (e.g., necromancer, beast)
 */
export function applyFearAura(
    battleState: BattleState,
    sourceId: string,
    config: FearConfig = DefaultFear
): void {
    const source = battleState.units.find(u => u.id === sourceId);
    if (!source || source.isDead || !source.pos) return;

    // Apply fear to enemy units in range
    for (const unit of battleState.units) {
        if (unit.faction === source.faction || unit.isDead || unit.isCommander || !unit.pos) continue;

        const distance = hexDistance(source.pos, unit.pos);
        if (distance <= config.range) {
            applyFearToUnit(unit, source.name, config);
        }
    }
}

/**
 * Apply fear effect to a specific unit
 */
function applyFearToUnit(unit: Unit, sourceName: string, config: FearConfig): void {
    const fearStatusName = `fear_${sourceName}`;

    // Check for existing fear from this source
    const existingFear = unit.statuses.find(s => s.name === fearStatusName) as any;

    if (existingFear) {
        // Stack fear up to maximum
        const currentStacks = existingFear.payload?.stacks || 1;
        if (currentStacks < config.maxStacks) {
            existingFear.payload.stacks = currentStacks + 1;
            existingFear.payload.amount = config.moraleReduction * existingFear.payload.stacks;
            existingFear.duration = Math.max(existingFear.duration, config.duration);
        }
    } else {
        // Add new fear status
        unit.statuses.push({
            id: `fear_${sourceName}_${Date.now()}`,
            name: fearStatusName,
            duration: config.duration,
            effects: {},
            payload: {
                stacks: 1,
                amount: config.moraleReduction,
                maxStacks: config.maxStacks,
                source: sourceName
            }
        } as any);
    }
}

/**
 * Terrifying roar ability (area fear effect)
 */
export interface RoarConfig {
    moraleReduction: number;
    range: number;
    duration: number;
    cooldown: number;
}

export const DefaultRoar: RoarConfig = {
    moraleReduction: -10,
    range: 3,
    duration: 3,
    cooldown: 4
};

/**
 * Execute terrifying roar
 */
export function executeTerrifyingRoar(
    battleState: BattleState,
    sourceId: string,
    config: RoarConfig = DefaultRoar
): boolean {
    const source = battleState.units.find(u => u.id === sourceId);
    if (!source || source.isDead || !source.pos) return false;

    // Check cooldown (simplified - would need proper ability tracking)
    const lastRoar = (source as any)._lastRoar || 0;
    const currentTurn = battleState.turn;
    if (currentTurn - lastRoar < config.cooldown) {
        battleState.log.push(`${source.name}'s roar is on cooldown.`);
        return false;
    }

    // Apply fear to all enemies in range
    let unitsAffected = 0;

    for (const unit of battleState.units) {
        if (unit.faction === source.faction || unit.isDead || !unit.pos) continue;

        const distance = hexDistance(source.pos, unit.pos);
        if (distance <= config.range) {
            applyRoarFearToUnit(unit, source.name, config);
            unitsAffected++;
        }
    }

    // Set cooldown
    (source as any)._lastRoar = currentTurn;

    battleState.log.push(`${source.name} lets out a terrifying roar! ${unitsAffected} enemies are struck with fear.`);
    return true;
}

/**
 * Apply roar fear to a unit
 */
function applyRoarFearToUnit(unit: Unit, sourceName: string, config: RoarConfig): void {
    // Remove existing roar fear from this source
    unit.statuses = unit.statuses.filter(s => s.name !== `roar_fear_${sourceName}`);

    // Add new roar fear status
    unit.statuses.push({
        id: `roar_fear_${sourceName}_${Date.now()}`,
        name: `roar_fear_${sourceName}`,
        duration: config.duration,
        effects: {},
        payload: {
            amount: config.moraleReduction,
            source: sourceName,
            type: 'roar'
        }
    } as any);
}

/**
 * Necromantic fear (spreads on death)
 */
export interface NecromanticFearConfig {
    moraleReduction: number;
    spreadRange: number;
    durationOnDeath: number;
}

export const DefaultNecromanticFear: NecromanticFearConfig = {
    moraleReduction: -8,
    spreadRange: 2,
    durationOnDeath: 4
};

/**
 * Apply necromantic fear when a unit dies horrifically
 */
export function applyDeathFear(
    battleState: BattleState,
    deathPos: HexPosition,
    killerName: string,
    config: NecromanticFearConfig = DefaultNecromanticFear
): void {
    // Apply fear to all units near the death
    for (const unit of battleState.units) {
        if (unit.isDead || !unit.pos) continue;

        const distance = hexDistance(deathPos, unit.pos);
        if (distance <= config.spreadRange) {
            applyDeathFearToUnit(unit, killerName, config);
        }
    }

    battleState.log.push(`The horrific death spreads fear among nearby units!`);
}

/**
 * Apply death fear to a unit
 */
function applyDeathFearToUnit(unit: Unit, killerName: string, config: NecromanticFearConfig): void {
    // Add death fear status
    unit.statuses.push({
        id: `death_fear_${Date.now()}_${unit.id}`,
        name: 'death_fear',
        duration: config.durationOnDeath,
        effects: {},
        payload: {
            amount: config.moraleReduction,
            source: killerName,
            type: 'death'
        }
    } as any);
}

/**
 * Remove fear effects when source dies or moves away
 */
export function removeFearSource(battleState: BattleState, sourceName: string): void {
    for (const unit of battleState.units) {
        // Remove active fear auras from this source
        unit.statuses = unit.statuses.filter(s => {
            const payload = (s as any).payload;
            return !(payload?.source === sourceName && s.name.startsWith('fear_'));
        });
    }

    battleState.log.push(`Fear aura from ${sourceName} dissipates.`);
}

/**
 * Calculate total fear penalty for a unit
 */
export function calculateFearPenalty(unit: Unit): number {
    let totalFear = 0;

    for (const status of unit.statuses) {
        const payload = (status as any).payload;
        if (status.name.includes('fear') && payload?.amount) {
            totalFear += Math.abs(payload.amount); // Fear amounts are negative
        }
    }

    return -Math.min(25, totalFear); // Cap at -25 morale
}

/**
 * Check if unit is immune to fear (e.g., undead, constructs)
 */
export function isFearImmune(unit: Unit): boolean {
    // Check for fear immunity traits
    const immuneTraits = ['undead', 'construct', 'fearless', 'mindless'];
    return unit.traits?.some(trait =>
        immuneTraits.some(immune => trait.toLowerCase().includes(immune))
    ) || false;
}

/**
 * Remove fear immunity before applying fear
 */
export function tryApplyFear(unit: Unit, sourceName: string, config: FearConfig): boolean {
    if (isFearImmune(unit)) {
        return false; // Fear has no effect
    }

    applyFearToUnit(unit, sourceName, config);
    return true;
}