/**
 * Flee & Zone of Control Contest
 * TODO #10 — Morale & Psychology — Deep Spec v2
 */

import type { BattleState, Unit, HexPosition } from '../types';
import { hexDistance, findPath, tileAt } from '../engine';

/**
 * Outcome of a flee attempt
 */
export interface FleeOutcome {
    moved: boolean;
    damageTaken: number;
    reason?: string;
    newPosition?: HexPosition;
}

/**
 * Attempt to flee from combat
 */
export function attemptFlee(battleState: BattleState, unitId: string): FleeOutcome {
    const unit = battleState.units.find(u => u.id === unitId);
    if (!unit || unit.isDead || !unit.pos) {
        return { moved: false, damageTaken: 0, reason: 'Unit not found or invalid' };
    }

    // Find adjacent enemies for ZoC contests
    const adjacentEnemies = getAdjacentEnemies(battleState, unit);

    if (adjacentEnemies.length === 0) {
        // No ZoC to contest, can flee freely
        return executeFreeMovement(battleState, unit);
    }

    // Contest ZoC with each adjacent enemy
    let totalDamage = 0;
    let canMove = false;

    for (const enemy of adjacentEnemies) {
        const contestResult = contestZoneOfControl(unit, enemy);

        if (contestResult.success) {
            canMove = true; // At least one contest succeeded
        } else {
            // Failed contest results in opportunity attack
            const damage = calculateOpportunityAttack(enemy, unit);
            totalDamage += damage;
            battleState.log.push(`${enemy.name} strikes ${unit.name} as they attempt to flee! (${damage} damage)`);
        }
    }

    if (canMove) {
        const movement = executeFreeMovement(battleState, unit);
        return {
            moved: movement.moved,
            damageTaken: totalDamage,
            newPosition: movement.newPosition,
            reason: totalDamage > 0 ? 'Fled but took opportunity attacks' : 'Successfully fled'
        };
    } else {
        // All contests failed, cannot move
        applyDamage(unit, totalDamage);
        return {
            moved: false,
            damageTaken: totalDamage,
            reason: 'Failed to break free from enemy zone of control'
        };
    }
}

/**
 * Execute free movement towards safety
 */
function executeFreeMovement(battleState: BattleState, unit: Unit): FleeOutcome {
    if (!unit.pos) return { moved: false, damageTaken: 0, reason: 'No position' };

    // Find safest movement direction
    const safePosition = findSafestPosition(battleState, unit);

    if (!safePosition) {
        return { moved: false, damageTaken: 0, reason: 'No safe position found' };
    }

    // Check if path is valid (respects impassable terrain)
    const path = findPath(battleState.grid, unit.pos, safePosition, 1);

    if (!path || path.length < 2) {
        return { moved: false, damageTaken: 0, reason: 'Path blocked by terrain' };
    }

    // Move to the first step of the path
    const newPos = path[1];
    unit.pos = newPos;

    battleState.log.push(`${unit.name} flees to a safer position.`);

    return {
        moved: true,
        damageTaken: 0,
        newPosition: newPos,
        reason: 'Successfully moved to safety'
    };
}

/**
 * Contest zone of control using DEX vs DEX
 */
function contestZoneOfControl(fleeing: Unit, enemy: Unit): { success: boolean; margin: number } {
    const fleeingDex = fleeing.stats.spd || 10; // Use SPD as DEX proxy
    const enemyDex = enemy.stats.spd || 10;

    // Add some randomness to the contest (seeded random would be ideal)
    const fleeingRoll = fleeingDex + Math.floor(Math.random() * 10);
    const enemyRoll = enemyDex + Math.floor(Math.random() * 10);

    const success = fleeingRoll > enemyRoll;
    const margin = Math.abs(fleeingRoll - enemyRoll);

    return { success, margin };
}

/**
 * Calculate opportunity attack damage
 */
function calculateOpportunityAttack(attacker: Unit, target: Unit): number {
    const baseAttack = attacker.stats.atk || 0;
    const targetDefense = target.stats.def || 0;

    // Simplified damage calculation for opportunity attacks
    const damage = Math.max(1, Math.floor((baseAttack - targetDefense * 0.5) * 0.7));

    return damage;
}

/**
 * Apply damage to a unit
 */
function applyDamage(unit: Unit, damage: number): void {
    unit.stats.hp = Math.max(0, unit.stats.hp - damage);

    if (unit.stats.hp <= 0) {
        unit.isDead = true;
    }
}

/**
 * Find the safest position to move to
 */
function findSafestPosition(battleState: BattleState, unit: Unit): HexPosition | null {
    if (!unit.pos) return null;

    const candidates: Array<{ pos: HexPosition; safety: number }> = [];

    // Check all adjacent positions
    const adjacentPositions = getAdjacentPositions(unit.pos);

    for (const pos of adjacentPositions) {
        const tile = tileAt(battleState.grid, pos);

        // Skip impassable or occupied tiles
        if (!tile || !tile.passable || isPositionOccupied(battleState, pos)) {
            continue;
        }

        // Calculate safety score
        const safety = calculatePositionSafety(battleState, pos, unit.faction);
        candidates.push({ pos, safety });
    }

    // Return the safest position
    if (candidates.length === 0) return null;

    candidates.sort((a, b) => b.safety - a.safety);
    return candidates[0].pos;
}

/**
 * Calculate how safe a position is (higher = safer)
 */
function calculatePositionSafety(
    battleState: BattleState,
    pos: HexPosition,
    faction: 'Player' | 'Enemy' | 'Neutral'
): number {
    let safety = 0;

    // Prefer positions farther from enemies
    for (const unit of battleState.units) {
        if (unit.faction === faction || unit.isDead || !unit.pos) continue;

        const distance = hexDistance(pos, unit.pos);

        if (distance <= 1) {
            safety -= 10; // Very bad - adjacent to enemy
        } else if (distance <= 2) {
            safety -= 5;  // Bad - within threat range
        } else {
            safety += 1;  // Good - farther away
        }
    }

    // Prefer positions closer to allies
    for (const unit of battleState.units) {
        if (unit.faction !== faction || unit.isDead || !unit.pos) continue;

        const distance = hexDistance(pos, unit.pos);

        if (distance <= 2) {
            safety += 3; // Good - near allies
        }
    }

    // Prefer edge positions (closer to map edge for eventual escape)
    const edgeDistance = Math.min(
        pos.q,
        pos.r,
        battleState.grid.width - pos.q - 1,
        battleState.grid.height - pos.r - 1
    );

    if (edgeDistance <= 2) {
        safety += 5; // Bonus for being near edge
    }

    return safety;
}

/**
 * Get all adjacent enemy units
 */
function getAdjacentEnemies(battleState: BattleState, unit: Unit): Unit[] {
    if (!unit.pos) return [];

    const adjacentPositions = getAdjacentPositions(unit.pos);
    const enemies: Unit[] = [];

    for (const pos of adjacentPositions) {
        const enemy = battleState.units.find(u =>
            u.pos && u.pos.q === pos.q && u.pos.r === pos.r &&
            u.faction !== unit.faction && !u.isDead
        );

        if (enemy) {
            enemies.push(enemy);
        }
    }

    return enemies;
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

/**
 * Check if a position is occupied by a unit
 */
function isPositionOccupied(battleState: BattleState, pos: HexPosition): boolean {
    return battleState.units.some(u =>
        u.pos && u.pos.q === pos.q && u.pos.r === pos.r && !u.isDead
    );
}

/**
 * Force a routing unit to attempt flee (auto-action)
 */
export function forceRoutingFlee(battleState: BattleState, unitId: string): boolean {
    const unit = battleState.units.find(u => u.id === unitId);
    if (!unit) return false;

    // Check if unit should flee based on morale
    const morale = (unit as any).meta?.morale;
    if (!morale || morale.state !== 'routing') return false;

    battleState.log.push(`${unit.name} is routing and must attempt to flee!`);

    const outcome = attemptFlee(battleState, unitId);

    if (outcome.moved) {
        battleState.log.push(`${unit.name} successfully flees to safety.`);
    } else {
        battleState.log.push(`${unit.name} fails to escape! ${outcome.reason}`);
    }

    return outcome.moved;
}

/**
 * Check for surrender conditions (multiple routing units)
 */
export function checkSurrenderConditions(battleState: BattleState, faction: 'Player' | 'Enemy'): boolean {
    const factionUnits = battleState.units.filter(u =>
        u.faction === faction && !u.isDead && !u.isCommander
    );

    if (factionUnits.length === 0) return true; // No units left

    // Check if majority are routing
    const routingUnits = factionUnits.filter(u => {
        const morale = (u as any).meta?.morale;
        return morale && morale.state === 'routing';
    });

    const routingRatio = routingUnits.length / factionUnits.length;

    if (routingRatio >= 0.75) { // 75% routing
        battleState.log.push(`${faction} army is in full retreat!`);
        return true;
    }

    return false;
}