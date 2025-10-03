/**
 * Hex Battle Engine
 * Core battle logic for tactical combat
 */

import { BattleState, Unit, Ability, HexPosition, BattlePhase } from './types';
import { hexDistance, isValidPosition } from './generate_hex';

/**
 * Initialize battle state
 */
export function startBattle(state: BattleState): void {
    state.phase = "Setup";
    state.turn = 1;

    // Calculate initiative order based on speed
    const allUnits = state.units.filter(u => u.faction === "Player" || u.faction === "Enemy");
    state.initiative = allUnits
        .sort((a, b) => b.stats.spd - a.stats.spd)
        .map(u => u.id);

    state.log.push("Battle begins! Deploy your forces.");
}

/**
 * Advance to next battle phase
 * Phase flow: Setup → HeroTurn → UnitsTurn → EnemyTurn → (repeat)
 */
export function nextPhase(state: BattleState): void {
    switch (state.phase) {
        case "Setup":
            state.phase = "HeroTurn";
            state.log.push("Deployment complete. Hero turn begins.");
            break;

        case "HeroTurn":
            state.phase = "UnitsTurn";
            state.log.push("Hero turn complete. Units turn begins.");
            break;

        case "UnitsTurn":
            state.phase = "EnemyTurn";
            state.log.push("Units turn complete. Enemy turn begins.");
            break;

        case "EnemyTurn":
            state.turn += 1;
            state.phase = "HeroTurn";
            state.log.push(`Turn ${state.turn} begins. Hero turn.`);
            // Reset cooldowns and AP
            resetTurnResources(state);
            break;

        default:
            break;
    }
}

/**
 * Reset cooldowns and action points for new turn
 */
function resetTurnResources(state: BattleState): void {
    // Reduce commander ability cooldowns
    if (state.commander.runtime.cooldowns) {
        for (const abilityId in state.commander.runtime.cooldowns) {
            state.commander.runtime.cooldowns[abilityId] = Math.max(0,
                state.commander.runtime.cooldowns[abilityId] - 1);
        }
    }

    // Reset action points (if implemented)
    state.commander.runtime.actionPoints = 3; // Example: 3 AP per turn
}

/**
 * Execute a hero commander ability
 */
export function execAbility(
    state: BattleState,
    caster: Unit,
    abilityId: string,
    target: HexPosition
): boolean {
    const ability = state.commander.abilities.find(a => a.id === abilityId);
    if (!ability) {
        state.log.push(`Unknown ability: ${abilityId}`);
        return false;
    }

    // Check cooldown
    const cooldowns = state.commander.runtime.cooldowns || {};
    if (cooldowns[abilityId] > 0) {
        state.log.push(`${ability.name} is on cooldown (${cooldowns[abilityId]} turns)`);
        return false;
    }

    // Check range (simplified - assume caster is off-field with unlimited range for demo)
    const inRange = true; // Hero abilities have special range rules

    if (!inRange) {
        state.log.push(`Target out of range for ${ability.name}`);
        return false;
    }

    // Execute ability effect
    executeAbilityEffect(state, ability, target);

    // Set cooldown
    if (!state.commander.runtime.cooldowns) {
        state.commander.runtime.cooldowns = {};
    }
    state.commander.runtime.cooldowns[abilityId] = ability.cooldown;

    state.log.push(`${caster.name} casts ${ability.name}!`);
    return true;
}

/**
 * Apply ability effects to the battlefield
 */
function executeAbilityEffect(state: BattleState, ability: Ability, target: HexPosition): void {
    const affectedHexes = getAbilityAffectedHexes(ability, target);

    for (const hex of affectedHexes) {
        const unit = state.units.find(u => u.pos && u.pos.q === hex.q && u.pos.r === hex.r);

        if (unit) {
            if (ability.damage) {
                // Deal damage
                const damage = calculateDamage(ability.damage.amount, unit);
                unit.stats.hp = Math.max(0, unit.stats.hp - damage);
                state.log.push(`${unit.name} takes ${damage} ${ability.damage.type} damage!`);

                if (unit.stats.hp === 0) {
                    state.log.push(`${unit.name} is defeated!`);
                    // Remove from battlefield
                    unit.pos = undefined;
                }
            }

            if (ability.healing) {
                // Heal unit
                const healed = Math.min(ability.healing, unit.stats.maxHp - unit.stats.hp);
                unit.stats.hp += healed;
                state.log.push(`${unit.name} is healed for ${healed} HP!`);
            }
        }
    }
}

/**
 * Get hexes affected by an ability
 */
function getAbilityAffectedHexes(ability: Ability, target: HexPosition): HexPosition[] {
    const hexes: HexPosition[] = [target];

    if (ability.aoeRadius && ability.aoeRadius > 0) {
        // Add adjacent hexes for blast effects
        const directions = [
            { q: 1, r: 0 }, { q: 1, r: -1 }, { q: 0, r: -1 },
            { q: -1, r: 0 }, { q: -1, r: 1 }, { q: 0, r: 1 }
        ];

        for (const dir of directions) {
            hexes.push({
                q: target.q + dir.q,
                r: target.r + dir.r
            });
        }
    }

    return hexes;
}

/**
 * Calculate damage with defense
 */
function calculateDamage(baseDamage: number, target: Unit): number {
    const defense = target.stats.def;
    const damage = Math.max(1, baseDamage - defense);
    return damage;
}

/**
 * Move unit to new position
 */
export function moveUnit(state: BattleState, unitId: string, target: HexPosition): boolean {
    const unit = state.units.find(u => u.id === unitId);
    if (!unit || !unit.pos) return false;

    // Check if target is valid and in movement range
    if (!isValidPosition(target, state.grid)) {
        state.log.push("Invalid move target");
        return false;
    }

    const distance = hexDistance(unit.pos, target);
    if (distance > unit.stats.move) {
        state.log.push("Target too far to move");
        return false;
    }

    // Check if hex is occupied
    const occupied = state.units.find(u => u.pos && u.pos.q === target.q && u.pos.r === target.r);
    if (occupied) {
        state.log.push("Hex is occupied");
        return false;
    }

    // Move unit
    unit.pos = target;
    state.log.push(`${unit.name} moves to (${target.q}, ${target.r})`);
    return true;
}

/**
 * Check victory conditions
 */
export function checkVictory(state: BattleState): BattlePhase | null {
    const playerUnits = state.units.filter(u => u.faction === "Player" && u.stats.hp > 0);
    const enemyUnits = state.units.filter(u => u.faction === "Enemy" && u.stats.hp > 0);

    if (enemyUnits.length === 0) {
        return "Victory";
    }

    if (playerUnits.length === 0) {
        return "Defeat";
    }

    return null;
}

/**
 * Apply commander aura effects to friendly units
 */
export function applyCommanderAura(state: BattleState): void {
    const aura = state.commander.aura;
    const friendlyUnits = state.units.filter(u => u.faction === "Player");

    // Simple aura: affects all friendly units
    for (const unit of friendlyUnits) {
        // Apply aura bonuses (this would need more sophisticated stat modification system)
        if (aura.stats.atk) {
            // Temporary bonus tracking would go here
        }
    }
}