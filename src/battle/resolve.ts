/**
 * Canvas 14 - Resolution Engine
 * 
 * Simultaneous order resolution with deterministic execution
 */

import type { BattleState, BattleUnit, LogEntry } from './state';
import type { QueuedOrder } from './orders';
import type { BattleRNG } from './rng';
import { executeMovement, resolveCollision, findDivertPosition } from './movement';
import { executeAttack, calculateCombatContext, tickStatusEffects } from './combat';
import { checkMoraleThreshold, calculateRetreatPath } from './morale';

// ============================================================================
// ROUND RESOLUTION
// ============================================================================

/**
 * Resolve one complete round
 */
export function resolveRound(
  state: BattleState,
  orders: QueuedOrder[],
  rng: BattleRNG
): RoundResult {
  const events: LogEntry[] = [];
  
  // Advance RNG to current round
  rng.nextRound();
  
  // Phase 1: Execute moves (by timing, then initiative)
  const moveResults = resolveMoves(state, orders, rng, events);
  
  // Phase 2: Execute attacks/casts/abilities (by initiative)
  resolveActions(state, orders, rng, events);
  
  // Phase 3: Execute reactions (parry/counter/interrupt)
  resolveReactions(state, rng, events);
  
  // Phase 4: Status ticks (DoT/HoT, durations)
  resolveStatusPhase(state, events);
  
  // Phase 5: Morale checks
  resolveMoralePhase(state, rng, events);
  
  // Check victory conditions
  const battleOver = checkVictoryConditions(state, events);
  
  return {
    success: true,
    events,
    moveResults,
    battleOver
  };
}

// ============================================================================
// PHASE 1: MOVES
// ============================================================================

/**
 * Resolve all movement orders
 */
function resolveMoves(
  state: BattleState,
  orders: QueuedOrder[],
  rng: BattleRNG,
  events: LogEntry[]
): Map<string, MoveResult> {
  const results = new Map<string, MoveResult>();
  
  // Filter move orders and sort by timing, then initiative
  const moveOrders = orders
    .filter(o => o.type === 'move')
    .sort((a, b) => {
      // Sort by timing first (early, standard, late)
      const timingOrder = { early: 0, standard: 1, late: 2 };
      const timingDiff = timingOrder[a.timing] - timingOrder[b.timing];
      if (timingDiff !== 0) return timingDiff;
      
      // Then by initiative
      const unitA = state.units.get(a.unitId);
      const unitB = state.units.get(b.unitId);
      if (!unitA || !unitB) return 0;
      
      return unitB.initRoll - unitA.initRoll;
    });
  
  // Track destination claims
  const destinationClaims = new Map<string, string[]>(); // hex key -> unit IDs
  
  // Execute moves in order
  for (const order of moveOrders) {
    const unit = state.units.get(order.unitId);
    if (!unit || !order.path) continue;
    
    const destination = order.path[order.path.length - 1];
    const destKey = `${destination.q},${destination.r}`;
    
    // Check for collision
    const claims = destinationClaims.get(destKey) || [];
    
    if (claims.length > 0) {
      // Collision detected - resolve by initiative
      const claimant = state.units.get(claims[0]);
      if (claimant) {
        const { winner, loser } = resolveCollision(unit, claimant);
        
        if (winner.id === unit.id) {
          // Unit wins, execute move
          const moveResult = executeMovement(unit, order.path, state);
          results.set(unit.id, {
            success: moveResult.success,
            cost: moveResult.apCost,
            diverted: false
          });
          
          // Update unit position
          if (moveResult.success) {
            unit.pos = moveResult.finalPos;
            unit.facing = moveResult.finalFacing;
            unit.ap -= moveResult.apCost;
            unit.hasMoved = true;
            
            events.push({
              round: state.round,
              timestamp: Date.now(),
              type: 'move',
              actorId: unit.id,
              data: { path: order.path, cost: moveResult.apCost },
              message: `${unit.name} moved`
            });
          }
          
          // Loser needs to divert
          const divertPos = findDivertPosition(loser, destination, state);
          if (divertPos) {
            loser.pos = divertPos;
            events.push({
              round: state.round,
              timestamp: Date.now(),
              type: 'move',
              actorId: loser.id,
              data: { diverted: true, pos: divertPos },
              message: `${loser.name} diverted due to collision`
            });
          }
        } else {
          // Unit loses, divert
          const divertPos = findDivertPosition(unit, destination, state);
          if (divertPos) {
            unit.pos = divertPos;
            unit.ap -= 1; // Partial AP cost for failed move
            
            events.push({
              round: state.round,
              timestamp: Date.now(),
              type: 'move',
              actorId: unit.id,
              data: { diverted: true, pos: divertPos },
              message: `${unit.name} diverted due to collision`
            });
          }
        }
      }
    } else {
      // No collision, execute move normally
      const moveResult = executeMovement(unit, order.path, state);
      results.set(unit.id, {
        success: moveResult.success,
        cost: moveResult.apCost,
        diverted: false
      });
      
      if (moveResult.success) {
        unit.pos = moveResult.finalPos;
        unit.facing = moveResult.finalFacing;
        unit.ap -= moveResult.apCost;
        unit.hasMoved = true;
        
        // Claim destination
        destinationClaims.set(destKey, [unit.id]);
        
        events.push({
          round: state.round,
          timestamp: Date.now(),
          type: 'move',
          actorId: unit.id,
          data: { path: order.path, cost: moveResult.apCost },
          message: `${unit.name} moved`
        });
        
        // Check for ZOC trigger
        if (moveResult.zocTriggered) {
          events.push({
            round: state.round,
            timestamp: Date.now(),
            type: 'move',
            actorId: unit.id,
            data: { zocTriggered: true },
            message: `${unit.name} triggered Zone of Control`
          });
        }
      }
    }
  }
  
  return results;
}

// ============================================================================
// PHASE 2: ACTIONS
// ============================================================================

/**
 * Resolve all action orders (attacks, casts, abilities)
 */
function resolveActions(
  state: BattleState,
  orders: QueuedOrder[],
  rng: BattleRNG,
  events: LogEntry[]
): void {
  // Filter action orders and sort by initiative
  const actionOrders = orders
    .filter(o => ['attack', 'cast', 'ability', 'item'].includes(o.type))
    .sort((a, b) => {
      const unitA = state.units.get(a.unitId);
      const unitB = state.units.get(b.unitId);
      if (!unitA || !unitB) return 0;
      return unitB.initRoll - unitA.initRoll;
    });
  
  for (const order of actionOrders) {
    const unit = state.units.get(order.unitId);
    if (!unit) continue;
    
    switch (order.type) {
      case 'attack':
        resolveAttackOrder(order, unit, state, rng, events);
        break;
      
      case 'cast':
      case 'ability':
        // TODO: Canvas 15 ability system
        events.push({
          round: state.round,
          timestamp: Date.now(),
          type: 'attack',
          actorId: unit.id,
          data: { ability: order.abilityId },
          message: `${unit.name} used ability (stub)`
        });
        break;
      
      case 'item':
        // TODO: Canvas 12 item system integration
        events.push({
          round: state.round,
          timestamp: Date.now(),
          type: 'attack',
          actorId: unit.id,
          data: { item: order.itemId },
          message: `${unit.name} used item (stub)`
        });
        break;
    }
    
    // Mark unit as acted
    unit.hasActed = true;
    unit.ap -= order.apCost;
  }
}

/**
 * Resolve single attack order
 */
function resolveAttackOrder(
  order: QueuedOrder,
  attacker: BattleUnit,
  state: BattleState,
  rng: BattleRNG,
  events: LogEntry[]
): void {
  if (!order.targetUnitId) return;
  
  const defender = state.units.get(order.targetUnitId);
  if (!defender) return;
  
  // Get tiles for context
  const attackerTile = state.board.tiles.get(`${attacker.pos.q},${attacker.pos.r}`);
  const defenderTile = state.board.tiles.get(`${defender.pos.q},${defender.pos.r}`);
  
  if (!attackerTile || !defenderTile) return;
  
  // Calculate context
  const context = calculateCombatContext(attacker, defender, attackerTile, defenderTile);
  
  // Execute attack
  const unitRng = rng.getStream('hit');
  const result = executeAttack(attacker, defender, context, unitRng);
  
  if (result.hit) {
    // Apply damage
    defender.hp -= result.damage;
    
    // Log hit
    events.push({
      round: state.round,
      timestamp: Date.now(),
      type: result.crit ? 'crit' : 'damage',
      actorId: attacker.id,
      targetId: defender.id,
      data: { damage: result.damage, crit: result.crit },
      message: `${attacker.name} ${result.crit ? 'critically ' : ''}hit ${defender.name} for ${result.damage} damage`
    });
    
    // Check for death
    if (defender.hp <= 0) {
      defender.isDowned = true;
      events.push({
        round: state.round,
        timestamp: Date.now(),
        type: 'death',
        targetId: defender.id,
        data: {},
        message: `${defender.name} was downed`
      });
    }
    
    // Apply status if present
    if (result.statusApplied) {
      defender.statuses.push(result.statusApplied);
      events.push({
        round: state.round,
        timestamp: Date.now(),
        type: 'status_apply',
        actorId: attacker.id,
        targetId: defender.id,
        data: { status: result.statusApplied.name },
        message: `${defender.name} is ${result.statusApplied.name}`
      });
    }
  } else {
    // Log miss
    events.push({
      round: state.round,
      timestamp: Date.now(),
      type: 'miss',
      actorId: attacker.id,
      targetId: defender.id,
      data: { hitChance: result.hitChance },
      message: `${attacker.name} missed ${defender.name}`
    });
  }
}

// ============================================================================
// PHASE 3: REACTIONS
// ============================================================================

/**
 * Resolve reaction orders (parry/counter/interrupt)
 */
function resolveReactions(
  _state: BattleState,
  _rng: BattleRNG,
  _events: LogEntry[]
): void {
  // TODO: Canvas 15 reaction system
  // Reactions trigger based on action events and timing windows
}

// ============================================================================
// PHASE 4: STATUS EFFECTS
// ============================================================================

/**
 * Resolve status phase (DoT/HoT, duration ticks)
 */
function resolveStatusPhase(
  state: BattleState,
  events: LogEntry[]
): void {
  const units = Array.from(state.units.values());
  
  for (const unit of units) {
    if (unit.isDead || unit.hasRetreated) continue;
    
    // Tick status effects
    const result = tickStatusEffects(unit);
    
    // Apply DoT damage
    if (result.damage > 0) {
      unit.hp -= result.damage;
      
      events.push({
        round: state.round,
        timestamp: Date.now(),
        type: 'damage',
        targetId: unit.id,
        data: { damage: result.damage, source: 'status' },
        message: `${unit.name} took ${result.damage} damage from status effects`
      });
      
      // Check for death
      if (unit.hp <= 0) {
        unit.isDowned = true;
        events.push({
          round: state.round,
          timestamp: Date.now(),
          type: 'death',
          targetId: unit.id,
          data: {},
          message: `${unit.name} was downed by status effects`
        });
      }
    }
    
    // Apply HoT healing
    if (result.healing > 0) {
      unit.hp = Math.min(unit.hp + result.healing, unit.maxHp);
      
      events.push({
        round: state.round,
        timestamp: Date.now(),
        type: 'heal',
        targetId: unit.id,
        data: { healing: result.healing },
        message: `${unit.name} healed ${result.healing} HP from status effects`
      });
    }
    
    // Log expired statuses
    for (const statusId of result.expired) {
      const status = unit.statuses.find(s => s.id === statusId);
      if (status) {
        events.push({
          round: state.round,
          timestamp: Date.now(),
          type: 'status_expire',
          targetId: unit.id,
          data: { status: status.name },
          message: `${status.name} expired on ${unit.name}`
        });
      }
    }
    
    // Apply terrain hazard damage
    const tile = state.board.tiles.get(`${unit.pos.q},${unit.pos.r}`);
    if (tile?.hazard) {
      const hazardDamage = calculateHazardDamage(tile.hazard);
      if (hazardDamage > 0) {
        unit.hp -= hazardDamage;
        
        events.push({
          round: state.round,
          timestamp: Date.now(),
          type: 'damage',
          targetId: unit.id,
          data: { damage: hazardDamage, source: tile.hazard },
          message: `${unit.name} took ${hazardDamage} damage from ${tile.hazard}`
        });
      }
    }
  }
}

/**
 * Calculate hazard damage
 */
function calculateHazardDamage(hazard: string): number {
  switch (hazard) {
    case 'fire': return 3;
    case 'poison': return 2;
    case 'caltrops': return 1;
    default: return 0;
  }
}

// ============================================================================
// PHASE 5: MORALE
// ============================================================================

/**
 * Resolve morale phase (rout checks)
 */
function resolveMoralePhase(
  state: BattleState,
  rng: BattleRNG,
  events: LogEntry[]
): void {
  // Check each side for morale threshold
  const sides = ['A', 'B', 'N'] as const;
  
  for (const side of sides) {
    const units = Array.from(state.units.values()).filter(u => u.side === side);
    if (units.length === 0) continue;
    
    const routCheck = checkMoraleThreshold(units);
    
    if (routCheck.shouldRout) {
      // Trigger mass retreat
      events.push({
        round: state.round,
        timestamp: Date.now(),
        type: 'rout',
        data: { side, morale: routCheck.averageMorale },
        message: `Side ${side} is routing!`
      });
      
      // Calculate retreat paths for each unit
      for (const unit of units) {
        if (unit.isDead || unit.isDowned || unit.hasRetreated) continue;
        
        const enemies = Array.from(state.units.values()).filter(u => 
          u.side !== side && !u.isDead && !u.isDowned
        );
        
        const retreatPath = calculateRetreatPath(unit, enemies, state);
        
        if (retreatPath.length > 0) {
          // Execute retreat move
          const exitPos = retreatPath[retreatPath.length - 1];
          unit.pos = exitPos;
          unit.hasRetreated = true;
          
          events.push({
            round: state.round,
            timestamp: Date.now(),
            type: 'retreat',
            actorId: unit.id,
            data: { path: retreatPath },
            message: `${unit.name} retreated`
          });
        }
      }
    }
  }
}

// ============================================================================
// VICTORY CONDITIONS
// ============================================================================

/**
 * Check victory conditions
 */
function checkVictoryConditions(
  state: BattleState,
  events: LogEntry[]
): boolean {
  // Check annihilation
  const sideAAlive = Array.from(state.units.values()).filter(
    u => u.side === 'A' && !u.isDead && !u.isDowned && !u.hasRetreated
  );
  const sideBAlive = Array.from(state.units.values()).filter(
    u => u.side === 'B' && !u.isDead && !u.isDowned && !u.hasRetreated
  );
  
  if (sideAAlive.length === 0) {
    state.phase = 'defeat';
    events.push({
      round: state.round,
      timestamp: Date.now(),
      type: 'defeat',
      data: { reason: 'annihilation' },
      message: 'Defeat: All units eliminated'
    });
    return true;
  }
  
  if (sideBAlive.length === 0) {
    state.phase = 'victory';
    events.push({
      round: state.round,
      timestamp: Date.now(),
      type: 'victory',
      data: { reason: 'annihilation' },
      message: 'Victory: All enemies eliminated'
    });
    return true;
  }
  
  // Check objectives
  const completedObjectives = state.objectives.filter(o => o.completed);
  const requiredObjectives = state.objectives.filter(o => o.required);
  
  if (requiredObjectives.length > 0 && 
      completedObjectives.length === requiredObjectives.length) {
    state.phase = 'victory';
    events.push({
      round: state.round,
      timestamp: Date.now(),
      type: 'victory',
      data: { reason: 'objectives' },
      message: 'Victory: All objectives completed'
    });
    return true;
  }
  
  // Check max rounds
  if (state.round >= state.maxRounds) {
    state.phase = 'defeat';
    events.push({
      round: state.round,
      timestamp: Date.now(),
      type: 'defeat',
      data: { reason: 'timeout' },
      message: 'Defeat: Time limit exceeded'
    });
    return true;
  }
  
  return false;
}

// ============================================================================
// TYPES
// ============================================================================

/**
 * Round result
 */
export interface RoundResult {
  success: boolean;
  events: LogEntry[];
  moveResults: Map<string, MoveResult>;
  battleOver: boolean;
}

/**
 * Move result
 */
interface MoveResult {
  success: boolean;
  cost: number;
  diverted: boolean;
}
