import type { BattleState, Unit, HexPosition, Ability } from "./types";
import { hexDistance, findPath, getTargetsInShape, canUseAbility } from "./engine";
import { ABILITIES } from "./abilities";

export interface AIAction {
    type: "move" | "ability" | "wait";
    unitId: string;
    targetPos?: HexPosition;
    abilityId?: string;
}

// Simple AI that tries to engage the nearest player unit
export function calculateAIAction(state: BattleState, unitId: string): AIAction | null {
    const unit = state.units.find(u => u.id === unitId);
    if (!unit || !unit.pos || unit.isDead) {
        return null;
    }

    const playerUnits = state.units.filter(u =>
        u.faction === "Player" && !u.isDead && u.pos && !u.isCommander
    );

    if (playerUnits.length === 0) {
        return { type: "wait", unitId };
    }

    // Find nearest player unit
    const nearestTarget = findNearestTarget(unit, playerUnits);
    if (!nearestTarget || !nearestTarget.pos) {
        return { type: "wait", unitId };
    }

    const distance = hexDistance(unit.pos, nearestTarget.pos);

    // Check if we can use any abilities
    const usableAbilities = unit.skills
        .map(skillId => ABILITIES[skillId])
        .filter(ability => ability && canUseAbility(state, unit, ability, nearestTarget.pos!));

    // If we can attack, do it
    if (usableAbilities.length > 0) {
        const bestAbility = chooseBestAbility(usableAbilities, distance);
        if (bestAbility) {
            return {
                type: "ability",
                unitId,
                abilityId: bestAbility.id,
                targetPos: nearestTarget.pos
            };
        }
    }

    // Otherwise, try to move closer
    const optimalPosition = findOptimalPosition(state, unit, nearestTarget);
    if (optimalPosition && (optimalPosition.q !== unit.pos.q || optimalPosition.r !== unit.pos.r)) {
        return {
            type: "move",
            unitId,
            targetPos: optimalPosition
        };
    }

    // Can't do anything useful
    return { type: "wait", unitId };
}

function findNearestTarget(unit: Unit, targets: Unit[]): Unit | null {
    if (!unit.pos) return null;

    let nearest: Unit | null = null;
    let nearestDistance = Infinity;

    for (const target of targets) {
        if (!target.pos) continue;

        const distance = hexDistance(unit.pos, target.pos);
        if (distance < nearestDistance) {
            nearestDistance = distance;
            nearest = target;
        }
    }

    return nearest;
}

function chooseBestAbility(abilities: Ability[], distanceToTarget: number): Ability | null {
    // Prefer abilities that can hit the target
    const validAbilities = abilities.filter(a => a.range >= distanceToTarget);

    if (validAbilities.length === 0) {
        return null;
    }

    // Prioritize by damage potential
    return validAbilities.reduce((best, current) => {
        const currentDamage = current.damage?.amount || 0;
        const bestDamage = best.damage?.amount || 0;

        // Factor in AoE potential
        const currentScore = currentDamage + (current.aoeRadius ? current.aoeRadius * 2 : 0);
        const bestScore = bestDamage + (best.aoeRadius ? best.aoeRadius * 2 : 0);

        return currentScore > bestScore ? current : best;
    });
}

function findOptimalPosition(
    state: BattleState,
    unit: Unit,
    target: Unit
): HexPosition | null {
    if (!unit.pos || !target.pos) return null;

    // Try to get within attack range of the target
    const attackRange = getMaxAttackRange(unit);
    const currentDistance = hexDistance(unit.pos, target.pos);

    // If already in optimal range, don't move
    if (currentDistance <= attackRange && currentDistance > 1) {
        return unit.pos;
    }

    // Find positions within movement range that get us closer
    const moveRange = unit.stats.move;
    const candidates: Array<{ pos: HexPosition; score: number }> = [];

    // Check positions in a spiral around current location
    for (let range = 1; range <= moveRange; range++) {
        const hexRing = getHexRing(unit.pos, range);

        for (const pos of hexRing) {
            if (!isValidMovePosition(state, pos)) continue;

            const path = findPath(state.grid, unit.pos, pos, moveRange);
            if (!path || path.length > moveRange + 1) continue;

            const score = calculatePositionScore(pos, target.pos, attackRange);
            candidates.push({ pos, score });
        }
    }

    if (candidates.length === 0) {
        return null;
    }

    // Return position with best score
    candidates.sort((a, b) => b.score - a.score);
    return candidates[0].pos;
}

function getMaxAttackRange(unit: Unit): number {
    let maxRange = 1; // Melee range default

    for (const skillId of unit.skills) {
        const ability = ABILITIES[skillId];
        if (ability && ability.range > maxRange) {
            maxRange = ability.range;
        }
    }

    return maxRange;
}

function calculatePositionScore(
    pos: HexPosition,
    targetPos: HexPosition,
    attackRange: number
): number {
    const distance = hexDistance(pos, targetPos);

    // Prefer positions within attack range but not too close
    if (distance <= attackRange && distance > 1) {
        return 100 - distance; // Higher score for closer positions within range
    } else if (distance > attackRange) {
        return 50 - distance; // Lower score for positions too far away
    } else {
        return 25; // Lowest score for being too close (distance <= 1)
    }
}

function isValidMovePosition(state: BattleState, pos: HexPosition): boolean {
    // Check if position is within grid bounds
    if (pos.q < 0 || pos.q >= state.grid.width || pos.r < 0 || pos.r >= state.grid.height) {
        return false;
    }

    // Find the tile at this position
    const tile = state.grid.tiles.find(t => t.q === pos.q && t.r === pos.r);
    if (!tile || !tile.passable || tile.occupied) {
        return false;
    }

    return true;
}

// Simple hex ring generation (could import from hex utilities)
function getHexRing(center: HexPosition, radius: number): HexPosition[] {
    if (radius === 0) return [center];

    const results: HexPosition[] = [];
    const directions = [
        { q: 1, r: 0 }, { q: 1, r: -1 }, { q: 0, r: -1 },
        { q: -1, r: 0 }, { q: -1, r: 1 }, { q: 0, r: 1 }
    ];

    let hex = { q: center.q + directions[4].q * radius, r: center.r + directions[4].r * radius };

    for (let i = 0; i < 6; i++) {
        for (let j = 0; j < radius; j++) {
            results.push({ ...hex });
            hex.q += directions[i].q;
            hex.r += directions[i].r;
        }
    }

    return results;
}

// Advanced AI behaviors for different unit types
export function calculateAdvancedAIAction(
    state: BattleState,
    unitId: string,
    personality: "aggressive" | "defensive" | "tactical" = "tactical"
): AIAction | null {
    const unit = state.units.find(u => u.id === unitId);
    if (!unit || !unit.pos || unit.isDead) {
        return null;
    }

    switch (personality) {
        case "aggressive":
            return calculateAggressiveAction(state, unit);
        case "defensive":
            return calculateDefensiveAction(state, unit);
        case "tactical":
        default:
            return calculateTacticalAction(state, unit);
    }
}

function calculateAggressiveAction(state: BattleState, unit: Unit): AIAction | null {
    // Always try to attack the weakest nearby enemy
    const targets = state.units.filter(u =>
        u.faction === "Player" && !u.isDead && u.pos && !u.isCommander
    );

    if (targets.length === 0) {
        return { type: "wait", unitId: unit.id };
    }

    // Find weakest target
    const weakestTarget = targets.reduce((weakest, current) =>
        current.stats.hp < weakest.stats.hp ? current : weakest
    );

    return calculateAIAction(state, unit.id);
}

function calculateDefensiveAction(state: BattleState, unit: Unit): AIAction | null {
    // Stay back and only attack if threatened
    if (!unit.pos) return { type: "wait", unitId: unit.id };

    const threats = state.units.filter(u =>
        u.faction === "Player" && !u.isDead && u.pos && !u.isCommander &&
        hexDistance(unit.pos!, u.pos) <= 3
    );

    if (threats.length === 0) {
        // No immediate threats, stay put
        return { type: "wait", unitId: unit.id };
    }

    // If threatened, try to attack the nearest threat
    return calculateAIAction(state, unit.id);
}

function calculateTacticalAction(state: BattleState, unit: Unit): AIAction | null {
    // Balanced approach - consider positioning, target priority, and abilities
    return calculateAIAction(state, unit.id);
}

// Execute a full AI turn for all enemy units
export function executeAITurn(state: BattleState): void {
    const enemyUnits = state.units.filter(u =>
        u.faction === "Enemy" && !u.isDead && u.pos
    );

    for (const unit of enemyUnits) {
        const action = calculateAIAction(state, unit.id);
        if (action) {
            executeAIAction(state, action);
        }
    }
}

function executeAIAction(state: BattleState, action: AIAction): void {
    // This would integrate with the main battle engine
    // For now, just log the intended action
    state.log.push(`AI ${action.type} for unit ${action.unitId}`);

    // TODO: Actually execute the action using battle engine functions
}