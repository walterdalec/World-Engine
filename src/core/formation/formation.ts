/**
 * Formation System
 * Handles front/back row positioning and associated tactical bonuses
 */

export type Row = 'front' | 'back';

export interface FormationTag {
    row: Row;
    slot: number;
}

/**
 * Get the formation tag from a unit's metadata
 */
export function getFormation(u: any): FormationTag | undefined {
    return u.meta?.formation;
}

/**
 * Set the formation for a unit
 */
export function setFormation(u: any, row: Row, slot: number): void {
    u.meta = u.meta || {};
    u.meta.formation = { row, slot };
}

/**
 * Check if a unit is in the back row
 */
export function isBackRow(u: any): boolean {
    return getFormation(u)?.row === 'back';
}

/**
 * Check if a unit is in the front row
 */
export function isFrontRow(u: any): boolean {
    return getFormation(u)?.row === 'front';
}

/**
 * Backline tactical modifiers - tunable values for ranged combat
 */
export const Backline = {
    rangedAccuracyBonus: 10,   // +10 accuracy if attacker is back row and using ranged attack
    rangedCoverBonus: 10,      // +10% effective resist vs ranged attacks when target is back row
    rangedDamageBonus: 5,      // +5% damage for back row ranged attacks
    movementPenalty: 1         // +1 AP cost for back row movement (represents careful positioning)
} as const;

/**
 * Calculate formation bonuses for an attacker
 */
export function getAttackerFormationBonus(attacker: any, isRangedAttack: boolean = false): {
    accuracyBonus: number;
    damageBonus: number;
} {
    if (!isBackRow(attacker) || !isRangedAttack) {
        return { accuracyBonus: 0, damageBonus: 0 };
    }

    return {
        accuracyBonus: Backline.rangedAccuracyBonus,
        damageBonus: Backline.rangedDamageBonus
    };
}

/**
 * Calculate formation defensive bonuses for a defender
 */
export function getDefenderFormationBonus(defender: any, isRangedAttack: boolean = false): {
    coverBonus: number;
    resistBonus: number;
} {
    if (!isBackRow(defender) || !isRangedAttack) {
        return { coverBonus: 0, resistBonus: 0 };
    }

    return {
        coverBonus: Backline.rangedCoverBonus,
        resistBonus: Backline.rangedCoverBonus
    };
}

/**
 * Calculate movement cost modifier based on formation
 */
export function getMovementCostModifier(unit: any): number {
    return isBackRow(unit) ? Backline.movementPenalty : 0;
}

/**
 * Auto-assign formation based on unit archetype/role
 */
export function autoAssignFormation(unit: any): FormationTag {
    // Simple heuristic based on unit properties
    const isRanged = unit.equipment?.weapon?.range > 1 ||
        unit.archetype?.toLowerCase().includes('archer') ||
        unit.archetype?.toLowerCase().includes('mage') ||
        unit.archetype?.toLowerCase().includes('mystic');

    const isTank = unit.archetype?.toLowerCase().includes('guardian') ||
        unit.archetype?.toLowerCase().includes('knight') ||
        unit.archetype?.toLowerCase().includes('defender');

    if (isTank) {
        return { row: 'front', slot: 0 };
    } else if (isRanged) {
        return { row: 'back', slot: 0 };
    } else {
        return { row: 'front', slot: 1 };
    }
}