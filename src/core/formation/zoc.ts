/**
 * Zone of Control (ZoC) System
 * Handles movement restrictions due to adjacent enemies
 */

import type { WorldState } from '../action/types';
import { axialDistance } from '../action/hex';

/**
 * Get all enemies adjacent to a unit
 */
export function enemiesAdjacentTo(world: WorldState, unitId: string): string[] {
    const unit = world.units.get(unitId);
    if (!unit) return [];

    const adjacent: string[] = [];

    for (const other of Array.from(world.units.values())) {
        if (other.team === unit.team) continue;

        const distance = axialDistance(unit.pos, other.pos);
        if (distance === 1) {
            adjacent.push(other.id);
        }
    }

    return adjacent;
}

/**
 * Check if a movement path violates zone of control rules
 * Returns true if the movement should be blocked without a disengage action
 */
export function violatesZoC(world: WorldState, unitId: string, path: { q: number; r: number }[]): boolean {
    if (!path || path.length < 2) return false;

    const unit = world.units.get(unitId);
    if (!unit) return false;

    // Get enemies that are currently adjacent
    const enemiesBefore = enemiesAdjacentTo(world, unitId);
    if (enemiesBefore.length === 0) return false; // No adjacent enemies, no ZoC violation

    // Check the final destination
    const destination = path[path.length - 1]!;

    // Check if any previously-adjacent enemy becomes >1 away at destination
    for (const enemyId of enemiesBefore) {
        const enemy = world.units.get(enemyId);
        if (!enemy) continue;

        const distanceAtDestination = axialDistance(destination, enemy.pos);
        if (distanceAtDestination > 1) {
            return true; // Leaving adjacency to this enemy - ZoC violation
        }
    }

    return false;
}

/**
 * Check if a unit can move to a specific hex without violating ZoC
 */
export function canMoveWithoutDisengage(world: WorldState, unitId: string, destination: { q: number; r: number }): boolean {
    const unit = world.units.get(unitId);
    if (!unit) return false;

    // Simple path: just the destination (single hex move)
    const path = [unit.pos, destination];

    return !violatesZoC(world, unitId, path);
}

/**
 * Get all hexes a unit can move to without triggering ZoC
 */
export function getZoCFreeMoves(world: WorldState, unitId: string, range: number = 1): { q: number; r: number }[] {
    const unit = world.units.get(unitId);
    if (!unit) return [];

    const validMoves: { q: number; r: number }[] = [];

    // Check all hexes within range
    for (let q = unit.pos.q - range; q <= unit.pos.q + range; q++) {
        for (let r = unit.pos.r - range; r <= unit.pos.r + range; r++) {
            const hex = { q, r };

            // Skip current position
            if (q === unit.pos.q && r === unit.pos.r) continue;

            // Check if hex is within actual range
            if (axialDistance(unit.pos, hex) > range) continue;

            // Check if move would violate ZoC
            if (canMoveWithoutDisengage(world, unitId, hex)) {
                validMoves.push(hex);
            }
        }
    }

    return validMoves;
}

/**
 * Check if a unit is currently engaged in melee (has adjacent enemies)
 */
export function isEngaged(world: WorldState, unitId: string): boolean {
    return enemiesAdjacentTo(world, unitId).length > 0;
}

/**
 * Calculate the number of enemies threatening a position
 */
export function getThreatCount(world: WorldState, position: { q: number; r: number }, team: string): number {
    let threats = 0;

    for (const unit of Array.from(world.units.values())) {
        if (unit.team === team) continue; // Allies don't threaten

        const distance = axialDistance(position, unit.pos);
        if (distance === 1) {
            threats++;
        }
    }

    return threats;
}

/**
 * Get all hexes that are threatened by enemies (adjacent to at least one enemy)
 */
export function getThreatenedHexes(world: WorldState, team: string): Set<string> {
    const threatened = new Set<string>();

    for (const unit of Array.from(world.units.values())) {
        if (unit.team === team) continue; // Only consider enemy units

        // Add all hexes adjacent to this enemy
        const directions = [
            { q: 1, r: 0 },    // East
            { q: 1, r: -1 },   // Northeast  
            { q: 0, r: -1 },   // Northwest
            { q: -1, r: 0 },   // West
            { q: -1, r: 1 },   // Southwest
            { q: 0, r: 1 }     // Southeast
        ];

        for (const dir of directions) {
            const threatenedHex = {
                q: unit.pos.q + dir.q,
                r: unit.pos.r + dir.r
            };
            threatened.add(`${threatenedHex.q},${threatenedHex.r}`);
        }
    }

    return threatened;
}

/**
 * Check if moving into a hex would provoke opportunity attacks
 */
export function wouldProvokeOpportunityAttacks(world: WorldState, unitId: string, destination: { q: number; r: number }): string[] {
    const unit = world.units.get(unitId);
    if (!unit) return [];

    const attackers: string[] = [];

    // Check all enemy units
    for (const enemy of Array.from(world.units.values())) {
        if (enemy.team === unit.team) continue;

        // Check if this enemy is adjacent to the destination
        const distanceToDestination = axialDistance(destination, enemy.pos);
        if (distanceToDestination === 1) {
            // Check if this enemy wasn't adjacent to the starting position
            const distanceFromStart = axialDistance(unit.pos, enemy.pos);
            if (distanceFromStart > 1) {
                attackers.push(enemy.id);
            }
        }
    }

    return attackers;
}