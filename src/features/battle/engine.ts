import type {
    BattleState, Unit, BattleGrid, HexTile, Ability, HexPosition
} from "./types";
import { ABILITIES } from "./abilities";
import {
    cubeDistance,
    neighborsHex as hexNeighbors,
    hexRing
} from "./hexUtils";
// Morale system integration
import {
    initializeMoraleSystem,
    processTurnStartMorale,
    processTurnEndMorale,
    processUnitDeath,
    getMoraleStatus
} from "./morale";

// Grid utilities
export function tileAt(grid: BattleGrid, pos: HexPosition): HexTile | undefined {
    // OPTIMIZED: Use find with early return instead of full iteration
    // For 121 tiles this is still O(n) but reasonably fast
    return grid.tiles.find(t => t.q === pos.q && t.r === pos.r);
}

// Fast tile lookup using a Map (created on demand)
let tileCache: Map<string, HexTile> | null = null;
let cachedGridId: string | null = null;

export function tileAtFast(grid: BattleGrid, pos: HexPosition): HexTile | undefined {
    // Create cache if it doesn't exist or grid changed
    const gridId = JSON.stringify(grid.tiles.length); // Simple grid identity
    if (!tileCache || cachedGridId !== gridId) {
        console.log('    🗺️ Building tile cache for', grid.tiles.length, 'tiles');
        tileCache = new Map();
        grid.tiles.forEach(tile => {
            tileCache!.set(getTileKey(tile), tile);
        });
        cachedGridId = gridId;
    }

    return tileCache.get(getTileKey(pos));
}

export function getTileKey(pos: HexPosition): string {
    return `${pos.q},${pos.r}`;
}

// Distance using hex cube coordinates
export function hexDistance(a: HexPosition, b: HexPosition): number {
    return cubeDistance(a, b);
}// Line of sight using hex ray casting
export function lineOfSight(grid: BattleGrid, start: HexPosition, end: HexPosition): boolean {
    const distance = hexDistance(start, end);
    if (distance === 0) return true;

    for (let i = 1; i < distance; i++) {
        const t = i / distance;
        const q = Math.round(start.q * (1 - t) + end.q * t);
        const r = Math.round(start.r * (1 - t) + end.r * t);

        const tile = tileAt(grid, { q, r });
        if (!tile || !tile.passable || tile.elevation > 2) {
            return false;
        }
    }
    return true;
}

// Initiative and turn order
export function buildInitiative(state: BattleState): string[] {
    const units = state.units.filter(u => !u.isDead && u.pos && !u.isCommander);

    // Apply morale modifiers to initiative (SPD)
    const unitsWithMorale = units.map(u => {
        let adjustedSpd = u.stats.spd;

        // Apply morale initiative penalty
        const moraleStatus = getMoraleStatus(state, u.id);
        if (moraleStatus.needsAttention) {
            // Simple morale penalty to initiative
            if (moraleStatus.state === 'shaken') adjustedSpd -= 2;
            else if (moraleStatus.state === 'wavering') adjustedSpd -= 5;
            else if (moraleStatus.state === 'routing') adjustedSpd -= 8;
        }

        return { unit: u, adjustedSpd: Math.max(1, adjustedSpd) };
    });

    // Higher SPD acts earlier; stable sort by spd desc, then name
    return unitsWithMorale
        .sort((a, b) => (b.adjustedSpd - a.adjustedSpd) || a.unit.name.localeCompare(b.unit.name))
        .map(u => u.unit.id);
}

export function startBattle(state: BattleState) {
    state.turn = 1;
    state.phase = "HeroTurn";
    state.initiative = buildInitiative(state);
    applyCommanderAura(state);

    // Initialize morale system
    initializeMoraleSystem(state);

    state.log.push("Battle has begun!");
}

export function nextPhase(state: BattleState) {
    if (state.phase === "HeroTurn") {
        state.phase = "UnitsTurn";
        state.selectedUnit = undefined;

        // Process morale at start of units turn
        processTurnStartMorale(state);

    } else if (state.phase === "UnitsTurn") {
        state.phase = "EnemyTurn";
        state.selectedUnit = undefined;
    } else if (state.phase === "EnemyTurn") {
        state.turn += 1;
        state.initiative = buildInitiative(state);
        state.phase = "HeroTurn";

        // Process end-of-turn effects
        tickStatusEffects(state);
        decrementCooldowns(state);

        // Process morale at end of turn
        processTurnEndMorale(state);
    }

    checkVictoryConditions(state);
}

// Pathfinding for hex grid
export function findPath(
    grid: BattleGrid,
    start: HexPosition,
    goal: HexPosition,
    maxCost: number = 20
): HexPosition[] | null {
    const open = new Map<string, number>(); // key -> f score
    const gScore = new Map<string, number>(); // key -> g score
    const came = new Map<string, string>(); // child -> parent

    const startKey = getTileKey(start);
    const goalKey = getTileKey(goal);

    gScore.set(startKey, 0);
    open.set(startKey, hexDistance(start, goal));

    // Safety: limit iterations to prevent infinite loops
    const MAX_ITERATIONS = 500; // Increased for larger searches
    let iterations = 0;

    while (open.size > 0) {
        iterations++;

        // Safety check: prevent infinite loops
        if (iterations > MAX_ITERATIONS) {
            console.warn('    ⚠️ Pathfinding exceeded max iterations:', MAX_ITERATIONS, 'for', start, '→', goal);
            return null;
        }

        // Get node with lowest f score
        let current = "";
        let lowestF = Infinity;

        open.forEach((f, key) => {
            if (f < lowestF) {
                lowestF = f;
                current = key;
            }
        });

        if (current === goalKey) {
            // Reconstruct path
            const path: HexPosition[] = [];
            let key = current;
            while (key) {
                const [q, r] = key.split(',').map(Number);
                path.unshift({ q, r });
                key = came.get(key) || "";
            }
            return path;
        }

        open.delete(current);
        const [cq, cr] = current.split(',').map(Number);
        const currentPos = { q: cq, r: cr };

        for (const neighbor of hexNeighbors(currentPos)) {
            const neighborKey = getTileKey(neighbor);
            const tile = tileAtFast(grid, neighbor); // Use fast cached lookup

            if (!tile || !tile.passable) continue;
            if (tile.occupied) continue; // Skip occupied tiles

            const tentativeG = (gScore.get(current) || 0) + (tile.terrain === "Mountain" ? 2 : 1);

            if (tentativeG > maxCost) continue; // Too expensive

            if (!gScore.has(neighborKey) || tentativeG < (gScore.get(neighborKey) || Infinity)) {
                came.set(neighborKey, current);
                gScore.set(neighborKey, tentativeG);
                const f = tentativeG + hexDistance(neighbor, goal);
                open.set(neighborKey, f);
            }
        }
    }

    // Path not found (silent - this is common for blocked/expensive paths)
    return null;
}

// Ability targeting and validation
export function canUseAbility(
    state: BattleState,
    user: Unit,
    ability: Ability,
    targetPos: HexPosition
): boolean {
    if (!user.pos) return false;

    // Check range
    const distance = hexDistance(user.pos, targetPos);
    if (distance > ability.range) return false;

    // Check line of sight if required
    if (ability.type === "spell" && !lineOfSight(state.grid, user.pos, targetPos)) {
        return false;
    }

    // Check cooldown
    const cooldown = state.commander.runtime.cooldowns?.[ability.id] || 0;
    if (cooldown > 0) return false;

    return true;
}

// Gather targets based on ability shape
export function getTargetsInShape(
    state: BattleState,
    ability: Ability,
    targetPos: HexPosition,
    casterFaction: string
): Unit[] {
    const targets: Unit[] = [];

    let affectedHexes: HexPosition[] = [];

    switch (ability.shape) {
        case "single":
            affectedHexes = [targetPos];
            break;

        case "self":
            affectedHexes = [targetPos]; // Should be caster's position
            break;

        case "blast1":
            affectedHexes = [targetPos, ...hexNeighbors(targetPos)];
            break;

        case "blast2":
            affectedHexes = [targetPos, ...hexRing(targetPos, 1), ...hexRing(targetPos, 2)];
            break;

        case "line":
            // Simple line implementation - could be enhanced
            affectedHexes = [targetPos];
            break;

        case "ally":
            // All allied units
            return state.units.filter(u =>
                u.faction === casterFaction && !u.isDead && u.pos
            );

        default:
            affectedHexes = [targetPos];
    }

    // Find units at affected positions
    for (const hex of affectedHexes) {
        const unit = state.units.find(u =>
            u.pos && u.pos.q === hex.q && u.pos.r === hex.r && !u.isDead
        );
        if (unit) {
            targets.push(unit);
        }
    }

    return targets;
}

// Execute an ability
export function executeAbility(
    state: BattleState,
    userId: string,
    abilityId: string,
    targetPos: HexPosition
): boolean {
    const user = state.units.find(u => u.id === userId);
    const ability = ABILITIES[abilityId];

    if (!user || !ability) return false;
    if (!canUseAbility(state, user, ability, targetPos)) return false;

    const targets = getTargetsInShape(state, ability, targetPos, user.faction);

    // Apply damage
    if (ability.damage) {
        for (const target of targets) {
            if (target.faction !== user.faction || ability.shape === "ally") {
                const damage = calculateDamage(user, target, ability);
                applyDamage(target, damage);

                if (target.stats.hp <= 0) {
                    target.isDead = true;
                    state.log.push(`${target.name} has fallen!`);

                    // Process morale consequences of death
                    processUnitDeath(state, target.id);
                }
            }
        }
    }

    // Apply healing
    if (ability.healing) {
        for (const target of targets) {
            if (target.faction === user.faction) {
                applyHealing(target, ability.healing);
            }
        }
    }

    // Set cooldown
    if (!state.commander.runtime.cooldowns) {
        state.commander.runtime.cooldowns = {};
    }
    state.commander.runtime.cooldowns[abilityId] = ability.cooldown;

    state.log.push(`${user.name} used ${ability.name}!`);
    return true;
}

function calculateDamage(attacker: Unit, defender: Unit, ability: Ability): number {
    if (!ability.damage) return 0;

    const baseDamage = ability.damage.amount;
    const attackStat = ability.type === "spell" ? attacker.stats.mag : attacker.stats.atk;
    const defenseStat = ability.type === "spell" ? defender.stats.res : defender.stats.def;

    const finalDamage = Math.max(1, baseDamage + Math.floor(attackStat * 0.25) - Math.floor(defenseStat * 0.2));
    return finalDamage;
}

function applyDamage(unit: Unit, amount: number) {
    unit.stats.hp = Math.max(0, unit.stats.hp - amount);
}

function applyHealing(unit: Unit, amount: number) {
    unit.stats.hp = Math.min(unit.stats.maxHp, unit.stats.hp + amount);
}

// Commander aura effects
export function applyCommanderAura(state: BattleState) {
    const commander = state.units.find(u => u.isCommander);
    if (!commander || !state.commander.aura) return;

    for (const unit of state.units) {
        if (unit.faction === "Player" && !unit.isDead && !unit.isCommander) {
            // Apply aura bonuses (simplified - should track original stats)
            for (const [stat, bonus] of Object.entries(state.commander.aura.stats)) {
                if (typeof bonus === 'number') {
                    (unit.stats as any)[stat] += bonus;
                }
            }
        }
    }
}

// Status effect processing
function tickStatusEffects(state: BattleState) {
    for (const unit of state.units) {
        if (unit.isDead) continue;

        unit.statuses = unit.statuses.filter(status => {
            status.duration--;

            // Apply effects each turn (like damage over time)
            if (status.effects.hp && status.effects.hp < 0) {
                applyDamage(unit, -status.effects.hp);
                state.log.push(`${unit.name} takes ${-status.effects.hp} damage from ${status.name}`);
            }

            return status.duration > 0;
        });
    }
}

function decrementCooldowns(state: BattleState) {
    if (state.commander.runtime.cooldowns) {
        for (const [abilityId, cooldown] of Object.entries(state.commander.runtime.cooldowns)) {
            if (cooldown > 0) {
                state.commander.runtime.cooldowns[abilityId] = cooldown - 1;
            }
        }
    }
}

// Victory condition checking
export function checkVictoryConditions(state: BattleState) {
    const playerUnits = state.units.filter(u =>
        u.faction === "Player" && !u.isDead && !u.isCommander
    );
    const enemyUnits = state.units.filter(u =>
        u.faction === "Enemy" && !u.isDead
    );

    if (playerUnits.length === 0) {
        state.phase = "Defeat";
        state.log.push("Defeat! All allies have fallen.");
    } else if (enemyUnits.length === 0) {
        state.phase = "Victory";
        state.log.push("Victory! All enemies have been defeated.");
    }
}

// Unit movement
export function moveUnit(state: BattleState, unitId: string, targetPos: HexPosition): boolean {
    const unit = state.units.find(u => u.id === unitId);
    if (!unit || !unit.pos) return false;

    const path = findPath(state.grid, unit.pos, targetPos, unit.stats.move);
    if (!path || path.length === 0) return false;

    // Update grid occupancy
    const oldTile = tileAt(state.grid, unit.pos);
    if (oldTile) {
        oldTile.occupied = undefined;
    }

    // Move to new position
    unit.pos = targetPos;
    const newTile = tileAt(state.grid, targetPos);
    if (newTile) {
        newTile.occupied = unitId;
    }

    state.log.push(`${unit.name} moved`);
    return true;
}

// Get valid movement positions for a unit
export function getValidMoves(state: BattleState, unitId: string): HexPosition[] {
    console.log('  🔍 getValidMoves called for unit:', unitId);
    const unit = state.units.find(u => u.id === unitId);
    if (!unit || !unit.pos) {
        console.log('  ❌ No unit or no position');
        return [];
    }

    const validMoves: HexPosition[] = [];
    const maxRange = unit.stats.move;
    console.log('  📏 Max range:', maxRange, 'from pos:', unit.pos);

    // Simple hex-based movement: check all hexes within N rings
    // No distance check needed - hexRing already gives us correct hexes at each range
    for (let range = 1; range <= maxRange; range++) {
        console.log('  🔄 Checking ring', range);
        const ring = hexRing(unit.pos, range);
        console.log('  📍 Ring has', ring.length, 'hexes');

        for (const hex of ring) {
            const tile = tileAtFast(state.grid, hex);
            // If tile exists, is passable, and not occupied - it's valid!
            if (tile && tile.passable && !tile.occupied) {
                validMoves.push(hex);
            }
        }
        console.log('  ✅ Ring', range, 'complete, found', validMoves.length, 'moves so far');
    }

    console.log('  🎯 Total valid moves:', validMoves.length);
    return validMoves;
}