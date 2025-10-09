import type { BattleState, Unit, HexPosition, Ability } from "./types";
import { hexDistance, findPath, canUseAbility } from "./engine";
import { ABILITIES } from "./abilities";
import { seedRng } from '../strategy/ai/rng';
import { CommanderBrain } from '../ai/tactical/commander';
import type { CommanderIntent } from '../ai/tactical/commander';
import { attachV24, commanderTickV24, onOutcomeDelta } from '../ai/tactical/commander_v24';
import * as UnitAI from '../ai/tactical/unit';
import { Learning, counterplayAdjust, specialistIntent, adaptToEnvironment } from '../ai/tactical/adaptation';
import type { Archetype } from '../ai/tactical/adaptation';
import { commanderManeuverTick } from '../ai/tactical/formations_v25';
import { attachV26, v26Tick } from '../ai/tactical/v26';
import { attachV27, v27Tick } from '../ai/tactical/v27';
import { attachV28, v28Tick } from '../ai/tactical/v28';
import { attachV29, v29Tick } from '../ai/tactical/v29';

const TICK_INTERVAL_MS = 500;

interface TacticalRuntime {
  commander: CommanderBrain;
  learn: ReturnType<typeof Learning.createLearnState>;
  unitBoards: Map<string, UnitAI.UnitBlackboard>;
}

const tacticalRuntimes = new Map<string, TacticalRuntime>();

// AI system for battle unit behavior
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

    // Find weakest target (calculated but not used in current impl)
    const _weakestTarget = targets.reduce((weakest, current) =>
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

// Execute a full AI turn for all enemy units using tactical commanders and unit AI
export function executeAITurn(state: BattleState): void {
  const runtime = ensureRuntime(state);
  ensureEventArray(state);
  commanderTickV24(runtime.commander, state as any);
  v26Tick(runtime.commander, state as any);
  v27Tick(runtime.commander, state as any);
  v28Tick(runtime.commander, state as any);
  v29Tick(runtime.commander, state as any);

  const nowMs = (state.turn ?? 0) * TICK_INTERVAL_MS;
  const signals = runtime.commander.tick(state, nowMs);
  const orders = signals.map((signal) => signal.order);

  const enemyUnits = state.units.filter((unit) => unit.faction === 'Enemy' && !unit.isDead);
  const maneuverUnits = enemyUnits.map((unit) => ({ id: unit.id, role: deriveArchetype(unit) }));
  commanderManeuverTick(runtime.commander, state as any, maneuverUnits);
  const boards: UnitAI.UnitBlackboard[] = [] as UnitAI.UnitBlackboard[];

  const activeIds = new Set<string>();
  for (const unit of enemyUnits) {
    activeIds.add(unit.id);
    let bb = runtime.unitBoards.get(unit.id);
    if (!bb) {
      bb = UnitAI.buildUnitBB(state, unit.id) ?? undefined;
      if (!bb) continue;
      runtime.unitBoards.set(unit.id, bb);
    }
    UnitAI.refreshUnitBB(bb, state);
    tickOrder(bb);
    boards.push(bb);
  }

  for (const key of Array.from(runtime.unitBoards.keys())) {
    if (!activeIds.has(key)) runtime.unitBoards.delete(key);
  }

  UnitAI.assignOrdersToUnits(orders, boards);

  for (const bb of boards) {
    UnitAI.refreshUnitBB(bb, state);
    let intent = UnitAI.decideIntent(state, bb);
    intent = Learning.applyLearnedBias(runtime.learn, bb.myId, intent);
    intent = counterplayAdjust(state, bb, intent);
    const unit = findUnit(state, bb.myId);
    const archetype = deriveArchetype(unit);
    intent = specialistIntent(archetype, state, bb, intent);
    intent = adaptToEnvironment(state, bb, intent);
    UnitAI.executeIntent(state, bb, intent);
  }

  onOutcomeDelta(runtime.commander, { dmgFor: 0, dmgAgainst: 0, objProgress: 0 });
}

function ensureRuntime(state: BattleState): TacticalRuntime {
  let runtime = tacticalRuntimes.get(state.id);
  if (!runtime) {
    ensureUnitStats(state);
    const intent = deriveCommanderIntent(state);
    const commander = new CommanderBrain(intent, { tickMs: TICK_INTERVAL_MS, maxSignalsPerTick: 2 });
    const anchor = { q: Math.floor(state.grid.width / 2), r: Math.floor(state.grid.height / 2) };
    attachV24(commander, anchor, 0);
    attachV26(commander, state, {
      regionTags: state.region?.tags ?? [],
      isAmbush: Boolean(state.flags?.ambush),
      anchor,
      facing: 0,
    });
    attachV27(commander, state);
    attachV28(commander, state, {
      cultureId: state.context?.cultureId,
      rng: seedRng(Number(state.context?.seed ?? Date.now())),
    });
    attachV29(commander, undefined, state, {
      enemyFactionId: state.context?.enemyFactionId,
      enemyPlaybookId: state.context?.enemyPlaybookId,
    });
    runtime = { commander, learn: Learning.createLearnState(), unitBoards: new Map() };
    tacticalRuntimes.set(state.id, runtime);
  }
  return runtime;
}

function ensureUnitStats(state: BattleState) {
  if (state.unitStatsById) return;
  const map: Record<string, { atk: number; def: number; spd: number; rng: number; hp: number; traits?: string[] }> = {};
  for (const unit of state.units ?? []) {
    const stats = unit.stats ?? {};
    map[unit.id] = {
      atk: stats.atk ?? 6,
      def: stats.def ?? 4,
      spd: stats.spd ?? stats.move ?? 4,
      rng: stats.rng ?? unit.range ?? 1,
      hp: stats.hp ?? stats.maxHp ?? 10,
      traits: unit.traits ?? [],
    };
  }
  state.unitStatsById = map;
}

function deriveCommanderIntent(state: BattleState): CommanderIntent {
  const intent = state.context.commanderIntent;
  if (intent) {
    return {
      stance: intent.stance ?? 'Aggressive',
      objective: intent.objective ?? 'Seize',
      riskTolerance: intent.riskTolerance ?? 50,
      focusRegionId: intent.focusRegionId,
    };
  }
  return { stance: 'Aggressive', objective: 'Seize', riskTolerance: 50 };
}

function ensureEventArray(state: BattleState) {
  const asAny = state as any;
  if (!Array.isArray(asAny.events)) asAny.events = [];
}

function tickOrder(bb: UnitAI.UnitBlackboard) {
  if (!bb.currentOrder) return;
  bb.currentOrder.ttl -= 1;
  if (bb.currentOrder.ttl <= 0) bb.currentOrder = undefined;
}

function findUnit(state: BattleState, unitId: string): Unit | undefined {
  return state.units.find((unit) => unit.id === unitId);
}

function deriveArchetype(unit: Unit | undefined): Archetype {
  if (!unit) return 'Infantry';
  const arche = (unit.archetype ?? '').toLowerCase();
  if (arche.includes('shield') || arche.includes('guard') || arche.includes('paladin')) return 'Shield';
  if (arche.includes('archer') || arche.includes('ranger') || arche.includes('bow')) return 'Archer';
  if (arche.includes('skirm') || arche.includes('rogue') || arche.includes('assassin') || arche.includes('scout')) return 'Skirmisher';
  if (arche.includes('cavalry') || arche.includes('rider') || arche.includes('knight')) return 'Cavalry';
  if (arche.includes('mage') || arche.includes('wizard') || arche.includes('sorcer')) return 'Mage';
  if (arche.includes('siege') || arche.includes('artillery')) return 'Siege';
  return 'Infantry';
}
