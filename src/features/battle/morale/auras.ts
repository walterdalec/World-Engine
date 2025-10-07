/**
 * Commander Auras for Morale
 * TODO #10 — Morale & Psychology — Deep Spec v2
 */

import type { BattleState, Unit, HexPosition } from '../types';
import { hexDistance } from '../engine';

/**
 * Commander aura configuration
 */
export interface CommanderAura {
    baseBonus: number;    // Base morale bonus at center
    range: number;        // Maximum range in hexes
    falloffRate: number;  // Bonus reduction per hex
    charismaScaling: number; // CHA scaling factor
}

export const DefaultAura: CommanderAura = {
    baseBonus: 8,
    range: 3,
    falloffRate: 3,
    charismaScaling: 0.5
};

/**
 * Calculate aura bonus for a unit from a commander
 */
export function calculateAuraBonus(
    commanderPos: HexPosition,
    unitPos: HexPosition,
    commanderCha: number,
    aura: CommanderAura = DefaultAura
): number {
    const distance = hexDistance(commanderPos, unitPos);

    if (distance > aura.range) return 0;

    // Base bonus minus distance falloff
    const distanceBonus = Math.max(0, aura.baseBonus - distance * aura.falloffRate);

    // Add charisma scaling
    const charismaBonus = Math.min(15, commanderCha) * aura.charismaScaling;

    return Math.round(distanceBonus + charismaBonus);
}

/**
 * Apply commander auras to all units in range
 */
export function applyCommanderAuras(battleState: BattleState): void {
    // Apply player commander aura
    if (battleState.commander) {
        const commanderUnit = battleState.units.find(u => u.id === battleState.commander.unitId);
        if (commanderUnit && commanderUnit.pos && !commanderUnit.isDead) {
            applyAuraToFaction(battleState, commanderUnit, 'Player');
        }
    }

    // Apply enemy commander aura
    if (battleState.enemyCommander) {
        const commanderUnit = battleState.units.find(u => u.id === battleState.enemyCommander!.unitId);
        if (commanderUnit && commanderUnit.pos && !commanderUnit.isDead) {
            applyAuraToFaction(battleState, commanderUnit, 'Enemy');
        }
    }
}

/**
 * Apply aura to all units of a specific faction
 */
function applyAuraToFaction(battleState: BattleState, commander: Unit, faction: 'Player' | 'Enemy'): void {
    const commanderCha = commander.stats.mag || 10; // Use MAG as CHA proxy

    for (const unit of battleState.units) {
        if (unit.faction !== faction || unit.isDead || unit.isCommander || !unit.pos) continue;

        const auraBonus = calculateAuraBonus(
            commander.pos!,
            unit.pos,
            commanderCha
        );

        if (auraBonus > 0) {
            // Apply aura as a temporary status effect
            addOrUpdateAuraStatus(unit, auraBonus, commander.name);
        }
    }
}

/**
 * Add or update aura status effect on unit
 */
function addOrUpdateAuraStatus(unit: Unit, bonus: number, commanderName: string): void {
    // Remove existing aura from this commander
    unit.statuses = unit.statuses.filter(s => s.name !== `aura_${commanderName}`);

    // Add new aura status
    unit.statuses.push({
        id: `aura_${commanderName}_${Date.now()}`,
        name: `aura_${commanderName}`,
        duration: 999, // Persistent while commander is alive
        effects: {},
        // Store morale bonus in payload for factors.ts to read
        payload: { moraleBonus: bonus }
    } as any);
}

/**
 * Remove all auras from a unit (when commander dies)
 */
export function removeCommanderAuras(battleState: BattleState, commanderName: string): void {
    for (const unit of battleState.units) {
        unit.statuses = unit.statuses.filter(s => s.name !== `aura_${commanderName}`);
    }

    battleState.log.push(`Commander ${commanderName} has fallen! Army morale suffers.`);
}

/**
 * Get aura coverage map for debugging/UI
 */
export interface AuraCoverage {
    commanderPos: HexPosition;
    affectedUnits: Array<{
        unitId: string;
        position: HexPosition;
        bonus: number;
    }>;
}

export function getAuraCoverage(battleState: BattleState, faction: 'Player' | 'Enemy'): AuraCoverage | null {
    const commander = faction === 'Player' ? battleState.commander : battleState.enemyCommander;
    if (!commander) return null;

    const commanderUnit = battleState.units.find(u => u.id === commander.unitId);
    if (!commanderUnit || !commanderUnit.pos || commanderUnit.isDead) return null;

    const commanderCha = commanderUnit.stats.mag || 10;
    const affectedUnits: AuraCoverage['affectedUnits'] = [];

    for (const unit of battleState.units) {
        if (unit.faction !== faction || unit.isDead || unit.isCommander || !unit.pos) continue;

        const bonus = calculateAuraBonus(commanderUnit.pos, unit.pos, commanderCha);
        if (bonus > 0) {
            affectedUnits.push({
                unitId: unit.id,
                position: unit.pos,
                bonus
            });
        }
    }

    return {
        commanderPos: commanderUnit.pos,
        affectedUnits
    };
}