/**
 * Canvas 14 - Order System
 * 
 * Order queue, validation, and timing for simultaneous resolution
 */

import type { AxialCoord } from './hex';
import type { BattleUnit, BattleState } from './state';
import { axialDistance } from './hex';
import { getUnitAt } from './state';

// ============================================================================
// ORDER TYPES
// ============================================================================

/**
 * Order timing (for simultaneous resolution)
 */
export type OrderTiming = 'early' | 'standard' | 'late';

/**
 * Order types
 */
export type OrderType = 
  | 'move'
  | 'attack'
  | 'cast'
  | 'guard'
  | 'wait'
  | 'ability'
  | 'item'
  | 'interact';

/**
 * Queued order
 */
export interface QueuedOrder {
  id: string;
  unitId: string;
  type: OrderType;
  timing: OrderTiming;
  
  // Target data (varies by type)
  targetPos?: AxialCoord;
  targetUnitId?: string;
  abilityId?: string;
  itemId?: string;
  path?: AxialCoord[];
  
  // AP cost
  apCost: number;
  
  // Validation
  isValid: boolean;
  validationError?: string;
}

/**
 * Reaction order (triggered by events)
 */
export interface ReactionOrder {
  id: string;
  unitId: string;
  type: 'parry' | 'counter' | 'interrupt';
  triggerEventId: string;
  targetUnitId?: string;
  stamCost: number;
}

// ============================================================================
// ORDER CREATION
// ============================================================================

/**
 * Create move order
 */
export function createMoveOrder(
  unit: BattleUnit,
  path: AxialCoord[],
  apCost: number,
  timing: OrderTiming = 'standard'
): QueuedOrder {
  return {
    id: `order_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    unitId: unit.id,
    type: 'move',
    timing,
    targetPos: path[path.length - 1],
    path,
    apCost,
    isValid: true
  };
}

/**
 * Create attack order
 */
export function createAttackOrder(
  unit: BattleUnit,
  targetId: string,
  timing: OrderTiming = 'standard'
): QueuedOrder {
  return {
    id: `order_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    unitId: unit.id,
    type: 'attack',
    timing,
    targetUnitId: targetId,
    apCost: 1,
    isValid: true
  };
}

/**
 * Create guard order (defensive stance)
 */
export function createGuardOrder(
  unit: BattleUnit,
  timing: OrderTiming = 'early'
): QueuedOrder {
  return {
    id: `order_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    unitId: unit.id,
    type: 'guard',
    timing,
    apCost: 0,
    isValid: true
  };
}

/**
 * Create wait order (do nothing)
 */
export function createWaitOrder(
  unit: BattleUnit,
  timing: OrderTiming = 'late'
): QueuedOrder {
  return {
    id: `order_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    unitId: unit.id,
    type: 'wait',
    timing,
    apCost: 0,
    isValid: true
  };
}

/**
 * Create ability order
 */
export function createAbilityOrder(
  unit: BattleUnit,
  abilityId: string,
  targetPos: AxialCoord,
  apCost: number,
  timing: OrderTiming = 'standard'
): QueuedOrder {
  return {
    id: `order_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    unitId: unit.id,
    type: 'ability',
    timing,
    abilityId,
    targetPos,
    apCost,
    isValid: true
  };
}

/**
 * Create item order
 */
export function createItemOrder(
  unit: BattleUnit,
  itemId: string,
  targetUnitId?: string,
  timing: OrderTiming = 'standard'
): QueuedOrder {
  return {
    id: `order_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    unitId: unit.id,
    type: 'item',
    timing,
    itemId,
    targetUnitId,
    apCost: 1,
    isValid: true
  };
}

// ============================================================================
// ORDER VALIDATION
// ============================================================================

/**
 * Validate order
 */
export function validateOrder(
  order: QueuedOrder,
  state: BattleState
): { valid: boolean; error?: string } {
  const unit = state.units.get(order.unitId);
  
  if (!unit) {
    return { valid: false, error: 'Unit not found' };
  }
  
  // Check if unit can act
  if (unit.isDowned || unit.isDead || unit.hasRetreated) {
    return { valid: false, error: 'Unit cannot act' };
  }
  
  // Check if unit has already acted
  if (unit.hasActed) {
    return { valid: false, error: 'Unit has already acted' };
  }
  
  // Check AP cost
  if (order.apCost > unit.ap) {
    return { valid: false, error: 'Insufficient AP' };
  }
  
  // Type-specific validation
  switch (order.type) {
    case 'move':
      return validateMoveOrder(order, unit, state);
    
    case 'attack':
      return validateAttackOrder(order, unit, state);
    
    case 'ability':
      return validateAbilityOrder(order, unit, state);
    
    case 'item':
      return validateItemOrder(order, unit, state);
    
    case 'guard':
    case 'wait':
      return { valid: true };
    
    default:
      return { valid: false, error: 'Unknown order type' };
  }
}

/**
 * Validate move order
 */
function validateMoveOrder(
  order: QueuedOrder,
  unit: BattleUnit,
  state: BattleState
): { valid: boolean; error?: string } {
  if (!order.path || order.path.length < 2) {
    return { valid: false, error: 'Invalid path' };
  }
  
  // Check if path starts at unit position
  const start = order.path[0];
  if (start.q !== unit.pos.q || start.r !== unit.pos.r) {
    return { valid: false, error: 'Path must start at unit position' };
  }
  
  // Check if destination is valid
  const dest = order.path[order.path.length - 1];
  const destTile = state.board.tiles.get(`${dest.q},${dest.r}`);
  
  if (!destTile) {
    return { valid: false, error: 'Invalid destination' };
  }
  
  if (destTile.movementCost >= 999) {
    return { valid: false, error: 'Destination is impassable' };
  }
  
  // Check if destination is occupied
  const occupant = getUnitAt(state, dest);
  if (occupant && occupant.id !== unit.id) {
    return { valid: false, error: 'Destination is occupied' };
  }
  
  return { valid: true };
}

/**
 * Validate attack order
 */
function validateAttackOrder(
  order: QueuedOrder,
  unit: BattleUnit,
  state: BattleState
): { valid: boolean; error?: string } {
  if (!order.targetUnitId) {
    return { valid: false, error: 'No target specified' };
  }
  
  const target = state.units.get(order.targetUnitId);
  
  if (!target) {
    return { valid: false, error: 'Target not found' };
  }
  
  // Check if target is enemy
  if (target.side === unit.side) {
    return { valid: false, error: 'Cannot attack ally' };
  }
  
  // Check if target is alive
  if (target.isDowned || target.isDead || target.hasRetreated) {
    return { valid: false, error: 'Target is not alive' };
  }
  
  // Check range (weapon range would come from gear)
  const range = 1; // Melee range for now
  const distance = axialDistance(unit.pos, target.pos);
  
  if (distance > range) {
    return { valid: false, error: 'Target out of range' };
  }
  
  return { valid: true };
}

/**
 * Validate ability order
 */
function validateAbilityOrder(
  order: QueuedOrder,
  _unit: BattleUnit,
  _state: BattleState
): { valid: boolean; error?: string } {
  if (!order.abilityId) {
    return { valid: false, error: 'No ability specified' };
  }
  
  if (!order.targetPos) {
    return { valid: false, error: 'No target position specified' };
  }
  
  // TODO: Check ability cooldown, charges, range, LOS
  // This requires Canvas 15 ability system
  
  return { valid: true };
}

/**
 * Validate item order
 */
function validateItemOrder(
  order: QueuedOrder,
  _unit: BattleUnit,
  state: BattleState
): { valid: boolean; error?: string } {
  if (!order.itemId) {
    return { valid: false, error: 'No item specified' };
  }
  
  // Check if target is specified for targeted items
  if (order.targetUnitId) {
    const target = state.units.get(order.targetUnitId);
    if (!target) {
      return { valid: false, error: 'Target not found' };
    }
  }
  
  // TODO: Check if unit has item in inventory
  // This requires Canvas 12 inventory integration
  
  return { valid: true };
}

// ============================================================================
// ORDER QUEUE MANAGEMENT
// ============================================================================

/**
 * Add order to queue
 */
export function queueOrder(
  order: QueuedOrder,
  state: BattleState
): { success: boolean; error?: string } {
  // Validate order
  const validation = validateOrder(order, state);
  
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }
  
  // Mark order as validated
  order.isValid = true;
  
  // In actual implementation, would store in state.orderQueue
  // For now, just return success
  
  return { success: true };
}

/**
 * Get orders for current turn
 */
export function getOrdersForTurn(
  _state: BattleState,
  _timing: OrderTiming
): QueuedOrder[] {
  // In actual implementation, would filter state.orderQueue by timing
  // and sort by initiative
  
  // Stub for now
  return [];
}

/**
 * Clear order for unit
 */
export function clearOrder(unitId: string, _state: BattleState): void {
  // In actual implementation, would remove order from state.orderQueue
  console.log(`Clearing order for unit ${unitId}`);
}

/**
 * Get order for unit
 */
export function getOrderForUnit(unitId: string, _state: BattleState): QueuedOrder | null {
  // In actual implementation, would find order in state.orderQueue
  console.log(`Getting order for unit ${unitId}`);
  return null;
}
