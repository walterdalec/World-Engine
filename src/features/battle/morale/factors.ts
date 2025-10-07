/**
 * Morale Factor Calculations
 * TODO #10 — Morale & Psychology — Deep Spec v2
 */

import type { BattleState, Unit, HexPosition } from '../types';
import type { MoraleFactors } from './model';
import { clampFactor } from './model';
import { hexDistance } from '../engine';

/**
 * Calculate leadership bonus from nearby commanders
 */
export function factorLeadership(state: BattleState, unitId: string): number {
    const unit = state.units.find(u => u.id === unitId);
    if (!unit || !unit.pos) return 0;

    // Find nearest friendly commander within range
    const nearestAura = nearestCommanderAura(state, unit);
    if (!nearestAura) return 0;

    const { dist, cha, power } = nearestAura;
    const falloff = Math.max(0, (power || 10) - dist * 3);
    const chaBonus = Math.min(15, cha || 0);
    const leadership = Math.max(0, falloff + Math.floor(chaBonus * 0.5));

    return clampFactor('leadership', leadership);
}

/**
 * Calculate terrain morale modifier
 */
export function factorTerrain(state: BattleState, unitId: string): number {
    const unit = state.units.find(u => u.id === unitId);
    if (!unit || !unit.pos) return 0;

    let terrainBonus = 0;

    // Get terrain bonus from tile
    const tileBonus = getTileMoraleBonus(state, unit.pos);
    terrainBonus += tileBonus;

    // Penalty for being flanked in open ground
    const isFlanked = isUnitFlanked(state, unitId);
    if (isFlanked && tileBonus <= 0) {
        terrainBonus -= 5; // Open ground flanking penalty
    }

    return clampFactor('terrain', terrainBonus);
}

/**
 * Calculate casualties penalty from recent damage and nearby deaths
 */
export function factorCasualties(state: BattleState, unitId: string): number {
    const unit = state.units.find(u => u.id === unitId);
    if (!unit) return 0;

    let penalty = 0;

    // Recent HP loss (stored in unit metadata if available)
    const recentDamage = getRecentDamage(state, unitId);
    penalty += Math.round(recentDamage * 20); // 0..1 fraction → 0..20 penalty

    // Nearby ally deaths this turn
    const allyDeaths = getRecentAllyDeathsNear(state, unitId, 2);
    penalty += Math.min(10, allyDeaths * 5);

    return clampFactor('casualties', -penalty);
}

/**
 * Calculate outnumbered penalty from local enemy/ally ratio
 */
export function factorOutnumbered(state: BattleState, unitId: string): number {
    const counts = getLocalCounts(state, unitId, 2);
    const ratio = counts.enemies / Math.max(1, counts.allies);

    if (ratio <= 1) return 0; // Not outnumbered

    // Base penalty for being outnumbered
    let penalty = Math.min(20, Math.round((ratio - 1) * 10));

    // Bonus for adjacent allies (formation benefit)
    const adjacentAllies = getAdjacentAllies(state, unitId);
    const formationBonus = Math.min(9, adjacentAllies * 3); // +3 per adjacent ally, max +9

    return clampFactor('outnumbered', -penalty + formationBonus);
}

/**
 * Calculate effects bonus/penalty from status effects
 */
export function factorEffects(state: BattleState, unitId: string): number {
    const unit = state.units.find(u => u.id === unitId);
    if (!unit) return 0;

    let effectsSum = 0;

    // Sum morale effects from status effects
    for (const status of unit.statuses) {
        if (status.name === 'morale_up') {
            effectsSum += (status as any).payload?.amount || 15;
        } else if (status.name === 'morale_down' || status.name === 'fear_aura') {
            effectsSum += (status as any).payload?.amount || -5;
        }
    }

    return clampFactor('effects', effectsSum);
}

/**
 * Gather all morale factors for a unit
 */
export function gatherFactors(state: BattleState, unitId: string): MoraleFactors {
    return {
        leadership: factorLeadership(state, unitId),
        terrain: factorTerrain(state, unitId),
        casualties: factorCasualties(state, unitId),
        outnumbered: factorOutnumbered(state, unitId),
        effects: factorEffects(state, unitId)
    };
}

// === Helper Functions ===

/**
 * Find nearest commander aura affecting this unit
 */
function nearestCommanderAura(state: BattleState, unit: Unit): { dist: number; cha: number; power: number } | null {
    if (!unit.pos) return null;

    // Check main commander
    if (state.commander && unit.faction === 'Player') {
        const commanderUnit = state.units.find(u => u.id === state.commander.unitId);
        if (commanderUnit && commanderUnit.pos && !commanderUnit.isDead) {
            const dist = hexDistance(unit.pos, commanderUnit.pos);
            const commandRadius = state.commander.aura.range || 3;
            if (dist <= commandRadius) {
                const cha = commanderUnit.stats.mag || 10; // Use MAG as CHA proxy
                return { dist, cha, power: 10 };
            }
        }
    }

    // Check enemy commander
    if (state.enemyCommander && unit.faction === 'Enemy') {
        const commanderUnit = state.units.find(u => u.id === state.enemyCommander!.unitId);
        if (commanderUnit && commanderUnit.pos && !commanderUnit.isDead) {
            const dist = hexDistance(unit.pos, commanderUnit.pos);
            const commandRadius = state.enemyCommander.aura.range || 3;
            if (dist <= commandRadius) {
                const cha = commanderUnit.stats.mag || 10;
                return { dist, cha, power: 10 };
            }
        }
    }

    return null;
}

/**
 * Get terrain morale bonus for a position
 */
function getTileMoraleBonus(state: BattleState, pos: HexPosition): number {
    const tile = state.grid.tiles.find(t => t.q === pos.q && t.r === pos.r);
    if (!tile) return 0;

    switch (tile.terrain) {
        case 'Forest': return 5;   // Defensive cover
        case 'Mountain': return 10; // Strong defensive position
        case 'Water': return -5;    // Disadvantageous
        case 'Swamp': return -3;    // Unpleasant terrain
        default: return 0;          // Grass, Desert are neutral
    }
}

/**
 * Check if unit is flanked (surrounded by enemies)
 */
function isUnitFlanked(state: BattleState, unitId: string): boolean {
    const unit = state.units.find(u => u.id === unitId);
    if (!unit || !unit.pos) return false;

    // Simple flanking check: more than 2 adjacent enemy tiles occupied
    const adjacentPositions = getAdjacentPositions(unit.pos);
    let enemyCount = 0;

    for (const pos of adjacentPositions) {
        const occupant = state.units.find(u =>
            u.pos && u.pos.q === pos.q && u.pos.r === pos.r &&
            u.faction !== unit.faction && !u.isDead
        );
        if (occupant) enemyCount++;
    }

    return enemyCount >= 3; // Flanked if 3+ adjacent enemies
}

/**
 * Get recent damage for a unit (placeholder - would need battle tracking)
 */
function getRecentDamage(state: BattleState, unitId: string): number {
    // Placeholder: would track damage taken this turn/last turn
    // For now, estimate from current HP vs max HP if recently damaged
    const unit = state.units.find(u => u.id === unitId);
    if (!unit) return 0;

    const hpRatio = unit.stats.hp / unit.stats.maxHp;
    if (hpRatio < 0.5) return 0.3; // Heavily wounded
    if (hpRatio < 0.8) return 0.1; // Lightly wounded
    return 0;
}

/**
 * Count recent ally deaths near a unit
 */
function getRecentAllyDeathsNear(state: BattleState, unitId: string, radius: number): number {
    // Placeholder: would track deaths this turn within radius
    // For now, count dead allies within radius as proxy
    const unit = state.units.find(u => u.id === unitId);
    if (!unit || !unit.pos) return 0;

    let deaths = 0;
    for (const other of state.units) {
        if (other.faction === unit.faction && other.isDead && other.pos) {
            const dist = hexDistance(unit.pos, other.pos);
            if (dist <= radius) deaths++;
        }
    }

    return Math.min(3, deaths); // Cap at 3 for balance
}

/**
 * Get local ally/enemy counts within radius
 */
function getLocalCounts(state: BattleState, unitId: string, radius: number): { allies: number; enemies: number } {
    const unit = state.units.find(u => u.id === unitId);
    if (!unit || !unit.pos) return { allies: 1, enemies: 1 };

    let allies = 1; // Include self
    let enemies = 0;

    for (const other of state.units) {
        if (other.id === unitId || other.isDead || !other.pos) continue;

        const dist = hexDistance(unit.pos, other.pos);
        if (dist <= radius) {
            if (other.faction === unit.faction) {
                allies++;
            } else {
                enemies++;
            }
        }
    }

    return { allies, enemies };
}

/**
 * Count adjacent allies for formation bonuses
 */
function getAdjacentAllies(state: BattleState, unitId: string): number {
    const unit = state.units.find(u => u.id === unitId);
    if (!unit || !unit.pos) return 0;

    const adjacentPositions = getAdjacentPositions(unit.pos);
    let allyCount = 0;

    for (const pos of adjacentPositions) {
        const occupant = state.units.find(u =>
            u.pos && u.pos.q === pos.q && u.pos.r === pos.r &&
            u.faction === unit.faction && !u.isDead
        );
        if (occupant) allyCount++;
    }

    return allyCount;
}

/**
 * Get the 6 adjacent hex positions
 */
function getAdjacentPositions(pos: HexPosition): HexPosition[] {
    return [
        { q: pos.q + 1, r: pos.r },
        { q: pos.q + 1, r: pos.r - 1 },
        { q: pos.q, r: pos.r - 1 },
        { q: pos.q - 1, r: pos.r },
        { q: pos.q - 1, r: pos.r + 1 },
        { q: pos.q, r: pos.r + 1 }
    ];
}