/**
 * Rally Abilities for Morale Recovery
 * TODO #10 — Morale & Psychology — Deep Spec v2
 */

import type { BattleState, Unit, HexPosition } from '../types';
import { hexDistance } from '../engine';

/**
 * Rally configuration
 */
export interface RallyConfig {
    moraleBonus: number;  // Morale boost amount
    duration: number;     // Rounds the effect lasts
    range: number;        // Effect range in hexes
    cooldown: number;     // Ability cooldown
}

export const DefaultRally: RallyConfig = {
    moraleBonus: 15,
    duration: 2,
    range: 2,
    cooldown: 3
};

/**
 * Execute rally command ability
 */
export function executeRally(
    battleState: BattleState,
    commanderId: string,
    targetPos?: HexPosition,
    config: RallyConfig = DefaultRally
): boolean {
    const commander = battleState.units.find(u => u.id === commanderId);
    if (!commander || commander.isDead) return false;

    // Check if commander can use rally (cooldown, AP, etc.)
    const commanderRuntime = getCommanderRuntime(battleState, commanderId);
    if (commanderRuntime && commanderRuntime.cooldowns?.rally && commanderRuntime.cooldowns.rally > 0) {
        battleState.log.push(`Rally is on cooldown for ${commanderRuntime.cooldowns.rally} more rounds.`);
        return false;
    }

    // Determine rally center (commander position or target)
    const rallyCenter = targetPos || commander.pos;
    if (!rallyCenter) return false;

    // Apply rally to units in range
    let unitsAffected = 0;
    const faction = commander.faction;

    for (const unit of battleState.units) {
        if (unit.faction !== faction || unit.isDead || unit.isCommander || !unit.pos) continue;

        const distance = hexDistance(rallyCenter, unit.pos);
        if (distance <= config.range) {
            applyRallyToUnit(unit, config);
            unitsAffected++;
        }
    }

    // Set cooldown
    if (commanderRuntime) {
        if (!commanderRuntime.cooldowns) commanderRuntime.cooldowns = {};
        commanderRuntime.cooldowns.rally = config.cooldown;
    }

    battleState.log.push(`${commander.name} rallies ${unitsAffected} units! Morale +${config.moraleBonus} for ${config.duration} rounds.`);
    return true;
}

/**
 * Apply rally effect to a unit
 */
function applyRallyToUnit(unit: Unit, config: RallyConfig): void {
    // Remove existing rally effects (non-stacking)
    unit.statuses = unit.statuses.filter(s => s.name !== 'morale_up');

    // Add new rally status
    unit.statuses.push({
        id: `rally_${Date.now()}_${unit.id}`,
        name: 'morale_up',
        duration: config.duration,
        effects: {},
        payload: { amount: config.moraleBonus }
    } as any);
}

/**
 * Banner/Standard rally (passive AoE morale boost)
 */
export interface BannerConfig {
    moraleBonus: number;
    range: number;
}

export const DefaultBanner: BannerConfig = {
    moraleBonus: 5,
    range: 1
};

/**
 * Apply banner morale boost to nearby units
 */
export function applyBannerEffect(
    battleState: BattleState,
    bannerCarrierId: string,
    config: BannerConfig = DefaultBanner
): void {
    const bannerCarrier = battleState.units.find(u => u.id === bannerCarrierId);
    if (!bannerCarrier || bannerCarrier.isDead || !bannerCarrier.pos) return;

    const faction = bannerCarrier.faction;

    for (const unit of battleState.units) {
        if (unit.faction !== faction || unit.isDead || unit.id === bannerCarrierId || !unit.pos) continue;

        const distance = hexDistance(bannerCarrier.pos, unit.pos);
        if (distance <= config.range) {
            // Apply banner effect as status
            applyBannerToUnit(unit, config, bannerCarrier.name);
        }
    }
}

/**
 * Apply banner effect to a unit
 */
function applyBannerToUnit(unit: Unit, config: BannerConfig, bannerCarrierName: string): void {
    const statusName = `banner_${bannerCarrierName}`;

    // Remove existing banner effect from this carrier
    unit.statuses = unit.statuses.filter(s => s.name !== statusName);

    // Add new banner status
    unit.statuses.push({
        id: `${statusName}_${Date.now()}`,
        name: statusName,
        duration: 999, // Persistent while banner carrier is alive and nearby
        effects: {},
        payload: { amount: config.moraleBonus }
    } as any);
}

/**
 * Inspirational speech (higher tier rally)
 */
export interface SpeechConfig {
    moraleBonus: number;
    duration: number;
    range: number;
    requiresHighCha: number; // Minimum CHA requirement
}

export const DefaultSpeech: SpeechConfig = {
    moraleBonus: 25,
    duration: 3,
    range: 4,
    requiresHighCha: 12
};

/**
 * Execute inspirational speech
 */
export function executeInspirationalSpeech(
    battleState: BattleState,
    commanderId: string,
    config: SpeechConfig = DefaultSpeech
): boolean {
    const commander = battleState.units.find(u => u.id === commanderId);
    if (!commander || commander.isDead || !commander.pos) return false;

    // Check CHA requirement (use MAG as proxy)
    const charisma = commander.stats.mag || 0;
    if (charisma < config.requiresHighCha) {
        battleState.log.push(`${commander.name} lacks the charisma for an inspirational speech (need ${config.requiresHighCha}, has ${charisma}).`);
        return false;
    }

    // Apply to all faction units in range
    let unitsAffected = 0;
    const faction = commander.faction;

    for (const unit of battleState.units) {
        if (unit.faction !== faction || unit.isDead || !unit.pos) continue;

        const distance = hexDistance(commander.pos, unit.pos);
        if (distance <= config.range) {
            applySpeechToUnit(unit, config);
            unitsAffected++;
        }
    }

    battleState.log.push(`${commander.name} delivers an inspirational speech! ${unitsAffected} units gain +${config.moraleBonus} morale for ${config.duration} rounds.`);
    return true;
}

/**
 * Apply speech effect to a unit
 */
function applySpeechToUnit(unit: Unit, config: SpeechConfig): void {
    // Remove existing speech effects (non-stacking)
    unit.statuses = unit.statuses.filter(s => s.name !== 'inspired');

    // Add new inspiration status
    unit.statuses.push({
        id: `inspired_${Date.now()}_${unit.id}`,
        name: 'inspired',
        duration: config.duration,
        effects: {},
        payload: { amount: config.moraleBonus }
    } as any);
}

/**
 * Get commander runtime data for cooldown tracking
 */
function getCommanderRuntime(battleState: BattleState, commanderId: string): any {
    // Check main commander
    if (battleState.commander && battleState.commander.unitId === commanderId) {
        return battleState.commander.runtime;
    }

    // Check enemy commander
    if (battleState.enemyCommander && battleState.enemyCommander.unitId === commanderId) {
        return battleState.enemyCommander.runtime;
    }

    return null;
}

/**
 * Decrease rally cooldowns at end of turn
 */
export function tickRallyCooldowns(battleState: BattleState): void {
    // Tick player commander cooldowns
    if (battleState.commander && battleState.commander.runtime.cooldowns) {
        const cooldowns = battleState.commander.runtime.cooldowns;
        for (const [ability, remaining] of Object.entries(cooldowns)) {
            if (typeof remaining === 'number' && remaining > 0) {
                cooldowns[ability] = remaining - 1;
            }
        }
    }

    // Tick enemy commander cooldowns
    if (battleState.enemyCommander && battleState.enemyCommander.runtime.cooldowns) {
        const cooldowns = battleState.enemyCommander.runtime.cooldowns;
        for (const [ability, remaining] of Object.entries(cooldowns)) {
            if (typeof remaining === 'number' && remaining > 0) {
                cooldowns[ability] = remaining - 1;
            }
        }
    }
}