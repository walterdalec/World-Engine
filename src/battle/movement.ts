/**
 * Canvas 14 - Movement System
 * 
 * Movement, pathing, ZOC (Zone of Control), elevation costs
 */

import type { AxialCoord, HexDirection } from './hex';
import type { BattleUnit, BattleState, Tile, MovementResult } from './state';
import { axialDistance, getNeighbors, findPath } from './hex';
import { getUnitAt } from './state';

// ============================================================================
// MOVEMENT CONSTANTS
// ============================================================================

const ELEVATION_STEP_COST = 0.5; // +1 cost per 2 elevation
const FACING_CHANGE_COST = 0.25; // +1 cost per 4 facing changes

// ============================================================================
// MOVEMENT CALCULATION
// ============================================================================

/**
 * Calculate movement cost for single step
 */
export function calculateStepCost(
  from: Tile,
  to: Tile,
  fromFacing: HexDirection,
  toFacing: HexDirection
): number {
  let cost = to.movementCost;
  
  // Elevation cost (upslope only)
  const heightDiff = to.height - from.height;
  if (heightDiff > 0) {
    cost += heightDiff * ELEVATION_STEP_COST;
  }
  
  // Facing change cost
  const facingDiff = Math.abs(toFacing - fromFacing);
  if (facingDiff > 0) {
    cost += facingDiff * FACING_CHANGE_COST;
  }
  
  return cost;
}

/**
 * Get movement options for unit
 */
export function getMovementOptions(
  unit: BattleUnit,
  state: BattleState
): Map<string, { hex: AxialCoord; cost: number; path: AxialCoord[] }> {
  const options = new Map<string, { hex: AxialCoord; cost: number; path: AxialCoord[] }>();
  
  // Use pathfinding to find all reachable hexes
  const maxAP = unit.ap;
  
  // Get all tiles within reasonable range
  const searchRadius = Math.ceil(maxAP * 3); // Conservative estimate
  const candidates: AxialCoord[] = [];
  
  for (let q = unit.pos.q - searchRadius; q <= unit.pos.q + searchRadius; q++) {
    for (let r = unit.pos.r - searchRadius; r <= unit.pos.r + searchRadius; r++) {
      if (axialDistance(unit.pos, { q, r }) <= searchRadius) {
        candidates.push({ q, r });
      }
    }
  }
  
  // Find paths to each candidate
  for (const target of candidates) {
    const path = findPath(unit.pos, target, (hex) => {
      return getMovementCostForHex(hex, unit, state);
    });
    
    if (path && path.length > 1) {
      // Calculate total cost
      let totalCost = 0;
      let currentFacing = unit.facing;
      
      for (let i = 1; i < path.length; i++) {
        const fromHex = path[i - 1];
        const toHex = path[i];
        
        const fromTile = state.board.tiles.get(`${fromHex.q},${fromHex.r}`);
        const toTile = state.board.tiles.get(`${toHex.q},${toHex.r}`);
        
        if (!fromTile || !toTile) continue;
        
        // Calculate facing change
        const newFacing = getFacingTowards(fromHex, toHex);
        totalCost += calculateStepCost(fromTile, toTile, currentFacing, newFacing);
        currentFacing = newFacing;
      }
      
      // Check if affordable
      if (totalCost <= maxAP) {
        const key = `${target.q},${target.r}`;
        options.set(key, {
          hex: target,
          cost: totalCost,
          path
        });
      }
    }
  }
  
  return options;
}

/**
 * Get movement cost for hex (for pathfinding)
 */
function getMovementCostForHex(
  hex: AxialCoord,
  unit: BattleUnit,
  state: BattleState
): number | null {
  const key = `${hex.q},${hex.r}`;
  const tile = state.board.tiles.get(key);
  
  if (!tile) return null;
  
  // Check if tile is passable
  if (tile.movementCost >= 999) return null;
  
  // Check if tile is occupied
  const occupant = getUnitAt(state, hex);
  if (occupant && occupant.id !== unit.id && occupant.side !== unit.side) {
    return null; // Enemy blocks movement
  }
  
  return tile.movementCost;
}

/**
 * Calculate facing towards target
 */
function getFacingTowards(from: AxialCoord, to: AxialCoord): HexDirection {
  const dq = to.q - from.q;
  const dr = to.r - from.r;
  
  // Determine direction (0-5)
  // 0 = East, 1 = Northeast, 2 = Northwest, 3 = West, 4 = Southwest, 5 = Southeast
  
  if (dq > 0 && dr === 0) return 0; // East
  if (dq === 0 && dr < 0) return 1; // Northeast
  if (dq < 0 && dr < 0) return 2; // Northwest
  if (dq < 0 && dr === 0) return 3; // West
  if (dq === 0 && dr > 0) return 4; // Southwest
  if (dq > 0 && dr > 0) return 5; // Southeast
  
  // Diagonal (approximate)
  const angle = Math.atan2(dr, dq);
  return Math.floor(((angle + Math.PI) / (Math.PI / 3)) % 6) as HexDirection;
}

// ============================================================================
// ZONE OF CONTROL (ZOC)
// ============================================================================

/**
 * Check if movement triggers ZOC
 */
export function checkZOCTrigger(
  unit: BattleUnit,
  path: AxialCoord[],
  state: BattleState
): { triggered: boolean; interceptor?: BattleUnit } {
  // ZOC triggers when leaving enemy front arc
  
  for (let i = 1; i < path.length; i++) {
    const fromHex = path[i - 1];
    const toHex = path[i];
    
    // Check for adjacent enemies
    const neighbors = getNeighbors(fromHex);
    
    for (const neighbor of neighbors) {
      const enemy = getUnitAt(state, neighbor);
      
      if (!enemy || enemy.side === unit.side || enemy.isDowned || enemy.isDead) {
        continue;
      }
      
      // Check if we're leaving enemy's front arc
      const isInFrontArc = isInFacing(fromHex, enemy.pos, enemy.facing);
      const willBeInFrontArc = isInFacing(toHex, enemy.pos, enemy.facing);
      
      if (isInFrontArc && !willBeInFrontArc) {
        // Check if enemy has reactions available
        if (enemy.reactionsUsed < enemy.reactionSlots && enemy.stam > 0) {
          return {
            triggered: true,
            interceptor: enemy
          };
        }
      }
    }
  }
  
  return { triggered: false };
}

/**
 * Check if target is in facing arc
 */
function isInFacing(target: AxialCoord, source: AxialCoord, facing: HexDirection): boolean {
  const direction = getFacingTowards(source, target);
  
  // Front arc is facing ±1 direction
  const diff = Math.abs(direction - facing);
  return diff <= 1 || diff >= 5; // Handle wrap-around
}

/**
 * Execute movement with collision handling
 */
export function executeMovement(
  unit: BattleUnit,
  path: AxialCoord[],
  state: BattleState
): MovementResult {
  if (path.length < 2) {
    return {
      success: false,
      path: [],
      apCost: 0,
      zocTriggered: false,
      intercepted: false,
      finalPos: unit.pos,
      finalFacing: unit.facing
    };
  }
  
  // Check ZOC
  const zocCheck = checkZOCTrigger(unit, path, state);
  
  if (zocCheck.triggered && zocCheck.interceptor) {
    // ZOC intercept - movement interrupted
    return {
      success: false,
      path: path.slice(0, 1),
      apCost: 0,
      zocTriggered: true,
      intercepted: true,
      finalPos: unit.pos,
      finalFacing: unit.facing
    };
  }
  
  // Calculate cost
  let totalCost = 0;
  let currentFacing = unit.facing;
  
  for (let i = 1; i < path.length; i++) {
    const fromHex = path[i - 1];
    const toHex = path[i];
    
    const fromTile = state.board.tiles.get(`${fromHex.q},${fromHex.r}`);
    const toTile = state.board.tiles.get(`${toHex.q},${toHex.r}`);
    
    if (!fromTile || !toTile) {
      // Invalid path
      return {
        success: false,
        path: path.slice(0, i),
        apCost: totalCost,
        zocTriggered: false,
        intercepted: false,
        finalPos: path[i - 1],
        finalFacing: currentFacing
      };
    }
    
    const newFacing = getFacingTowards(fromHex, toHex);
    const stepCost = calculateStepCost(fromTile, toTile, currentFacing, newFacing);
    
    totalCost += stepCost;
    currentFacing = newFacing;
    
    // Check if out of AP
    if (totalCost > unit.ap) {
      return {
        success: false,
        path: path.slice(0, i),
        apCost: unit.ap,
        zocTriggered: false,
        intercepted: false,
        finalPos: path[i - 1],
        finalFacing: currentFacing
      };
    }
  }
  
  // Success
  const finalPos = path[path.length - 1];
  
  return {
    success: true,
    path,
    apCost: totalCost,
    zocTriggered: zocCheck.triggered,
    intercepted: false,
    finalPos,
    finalFacing: currentFacing
  };
}

// ============================================================================
// COLLISION HANDLING
// ============================================================================

/**
 * Resolve movement collision (simultaneous move to same hex)
 */
export function resolveCollision(
  unit1: BattleUnit,
  unit2: BattleUnit
): { winner: BattleUnit; loser: BattleUnit } {
  // Higher initiative wins
  if (unit1.initRoll > unit2.initRoll) {
    return { winner: unit1, loser: unit2 };
  } else if (unit2.initRoll > unit1.initRoll) {
    return { winner: unit2, loser: unit1 };
  }
  
  // Tie - higher level wins
  if (unit1.level > unit2.level) {
    return { winner: unit1, loser: unit2 };
  } else if (unit2.level > unit1.level) {
    return { winner: unit2, loser: unit1 };
  }
  
  // Final tie - unit1 wins (deterministic)
  return { winner: unit1, loser: unit2 };
}

/**
 * Find divert position for unit that lost collision
 */
export function findDivertPosition(
  unit: BattleUnit,
  blockedHex: AxialCoord,
  state: BattleState
): AxialCoord | null {
  // Try neighbors of blocked hex
  const neighbors = getNeighbors(blockedHex);
  
  for (const neighbor of neighbors) {
    const occupant = getUnitAt(state, neighbor);
    const tile = state.board.tiles.get(`${neighbor.q},${neighbor.r}`);
    
    if (!occupant && tile && tile.movementCost < 999) {
      return neighbor;
    }
  }
  
  // No divert available - stay in place
  return null;
}
