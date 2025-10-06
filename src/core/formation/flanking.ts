/**
 * Flanking System
 * Detects flanking conditions and calculates combat bonuses
 */

import type { WorldState } from '../action/types';
import { dirBetween, classifyArc, type Arc, type Dir } from './facing';

export interface FlankInfo {
    arc: Arc;
    isFlanked: boolean;
    left: boolean;
    right: boolean;
    rear: boolean;
}

/**
 * Analyze flanking situation for an attack
 */
export function flankInfo(world: WorldState, attackerId: string, defenderId: string): FlankInfo {
    const attacker: any = world.units.get(attackerId);
    const defender: any = world.units.get(defenderId);

    if (!attacker || !defender) {
        return { arc: 'front', isFlanked: false, left: false, right: false, rear: false };
    }

    const facing = (defender.meta?.facing ?? 0) as Dir;
    const dir = dirBetween(defender.pos, attacker.pos);
    const arc = classifyArc(facing, dir, 1);

    // Initialize flags - rear flag is true if the current attack is from rear
    let left = false;
    let right = false;
    let rear = (arc === 'rear');

    // Threat census around defender within range 1 (looking for additional threats)
    for (const u of Array.from(world.units.values())) {
        if (u.team === defender.team) continue;

        // Check if this unit is an ally of attacker and adjacent to defender
        const dist = Math.max(
            Math.abs(u.pos.q - defender.pos.q),
            Math.abs(u.pos.r - defender.pos.r),
            Math.abs((u.pos.q + u.pos.r) - (defender.pos.q + defender.pos.r))
        );

        if (dist !== 1) continue;

        const ddir = dirBetween(defender.pos, u.pos);
        const threatArc = classifyArc(facing, ddir, 1);

        if (threatArc === 'rear') {
            rear = true;  // Additional rear threat
        } else {
            // Check for left/right positioning regardless of arc classification
            const leftDir = ((facing + 1) % 6) as Dir;
            const rightDir = ((facing + 5) % 6) as Dir;

            if (ddir === leftDir) {
                left = true;
            } else if (ddir === rightDir) {
                right = true;
            }
        }
        // Front threats don't contribute to flanking
    }

    const isFlanked = rear || (left && right);

    return { arc, isFlanked, left, right, rear };
} export interface FlankMods {
    multBonus: number;         // Damage multiplier bonus (percentage)
    critPermilleBonus: number; // Critical hit chance bonus (per mille, 0-1000)
    armorPenBonus: number;     // Armor penetration bonus (flat)
}

/**
 * Calculate combat modifiers based on flanking situation
 */
export function flankModifiers(info: FlankInfo): FlankMods {
    if (info.rear) {
        // Rear attack - devastating
        return {
            multBonus: 25,
            critPermilleBonus: 200,
            armorPenBonus: 1
        };
    }

    if (info.isFlanked) {
        // Surrounded (left + right threats) - significant bonus
        return {
            multBonus: 15,
            critPermilleBonus: 100,
            armorPenBonus: 0
        };
    }

    if (info.arc === 'side') {
        // Simple side attack - minor bonus
        return {
            multBonus: 10,
            critPermilleBonus: 50,
            armorPenBonus: 0
        };
    }

    // Front attack - no bonus
    return {
        multBonus: 0,
        critPermilleBonus: 0,
        armorPenBonus: 0
    };
}

/**
 * Check if a unit is threatened from a specific direction
 */
export function isThreatenedFrom(world: WorldState, unitId: string, direction: Dir): boolean {
    const unit = world.units.get(unitId);
    if (!unit) return false;

    const dirVector = [
        { q: 1, r: 0 },    // 0: East
        { q: 1, r: -1 },   // 1: Northeast  
        { q: 0, r: -1 },   // 2: Northwest
        { q: -1, r: 0 },   // 3: West
        { q: -1, r: 1 },   // 4: Southwest
        { q: 0, r: 1 }     // 5: Southeast
    ][direction];

    const targetPos = {
        q: unit.pos.q + dirVector.q,
        r: unit.pos.r + dirVector.r
    };

    for (const other of Array.from(world.units.values())) {
        if (other.team === unit.team) continue;
        if (other.pos.q === targetPos.q && other.pos.r === targetPos.r) {
            return true;
        }
    }

    return false;
}

/**
 * Get all adjacent enemies of a unit
 */
export function getAdjacentEnemies(world: WorldState, unitId: string): string[] {
    const unit = world.units.get(unitId);
    if (!unit) return [];

    const enemies: string[] = [];

    for (const other of Array.from(world.units.values())) {
        if (other.team === unit.team) continue;

        const dist = Math.max(
            Math.abs(other.pos.q - unit.pos.q),
            Math.abs(other.pos.r - unit.pos.r),
            Math.abs((other.pos.q + other.pos.r) - (unit.pos.q + unit.pos.r))
        );

        if (dist === 1) {
            enemies.push(other.id);
        }
    }

    return enemies;
}