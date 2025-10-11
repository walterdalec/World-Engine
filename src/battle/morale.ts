/**
 * Canvas 14 - Morale System
 * 
 * Fear, rout, and retreat mechanics
 */

import type { AxialCoord } from './hex';
import type { BattleUnit, BattleState } from './state';
import { axialDistance, getNeighbors } from './hex';

// ============================================================================
// MORALE CONSTANTS
// ============================================================================

const MORALE_ROUT_THRESHOLD = 30;
const MORALE_FEAR_PER_CASUALTY = 5;
const MORALE_FEAR_SURROUNDED = 10;
const MORALE_FEAR_COMMANDER_DOWN = 20;

// ============================================================================
// MORALE CHECKS
// ============================================================================

/**
 * Check if force should rout
 */
export function checkMoraleThreshold(units: BattleUnit[]): {
  shouldRout: boolean;
  averageMorale: number;
} {
  if (units.length === 0) {
    return { shouldRout: false, averageMorale: 0 };
  }
  
  // Calculate average morale
  const totalMorale = units.reduce((sum, u) => sum + u.morale, 0);
  const averageMorale = totalMorale / units.length;
  
  // Check threshold
  const shouldRout = averageMorale < MORALE_ROUT_THRESHOLD;
  
  return { shouldRout, averageMorale };
}

/**
 * Apply fear from casualties
 */
export function applyFearFromCasualties(
  units: BattleUnit[],
  casualties: number
): void {
  const fearAmount = casualties * MORALE_FEAR_PER_CASUALTY;
  
  for (const unit of units) {
    unit.morale = Math.max(0, unit.morale - fearAmount);
  }
}

/**
 * Apply fear from being surrounded
 */
export function applyFearFromSurrounded(
  unit: BattleUnit,
  state: BattleState
): void {
  const neighbors = getNeighbors(unit.pos);
  let enemyCount = 0;
  
  for (const neighbor of neighbors) {
    const occupant = getUnitAtPos(state, neighbor);
    if (occupant && occupant.side !== unit.side && !occupant.isDead && !occupant.isDowned) {
      enemyCount++;
    }
  }
  
  // Surrounded if 4+ adjacent enemies
  if (enemyCount >= 4) {
    unit.morale = Math.max(0, unit.morale - MORALE_FEAR_SURROUNDED);
  }
}

/**
 * Apply fear from commander death
 */
export function applyFearFromCommanderDown(units: BattleUnit[]): void {
  for (const unit of units) {
    unit.morale = Math.max(0, unit.morale - MORALE_FEAR_COMMANDER_DOWN);
  }
}

// ============================================================================
// RETREAT
// ============================================================================

/**
 * Calculate retreat path for unit
 */
export function calculateRetreatPath(
  unit: BattleUnit,
  enemies: BattleUnit[],
  state: BattleState
): AxialCoord[] {
  // Find nearest exit
  const nearestExit = findNearestExit(unit.pos, state);
  
  if (!nearestExit) {
    return []; // No exit available
  }
  
  // Calculate path away from enemies towards exit
  const path: AxialCoord[] = [unit.pos];
  let current = unit.pos;
  const maxSteps = 5;
  
  for (let i = 0; i < maxSteps; i++) {
    const next = findSafestNeighbor(current, nearestExit, enemies, state);
    
    if (!next) break;
    
    path.push(next);
    current = next;
    
    // Stop if reached exit
    if (current.q === nearestExit.q && current.r === nearestExit.r) {
      break;
    }
  }
  
  return path;
}

/**
 * Find nearest exit hex
 */
function findNearestExit(
  pos: AxialCoord,
  state: BattleState
): AxialCoord | null {
  if (state.board.exits.length === 0) {
    return null;
  }
  
  let nearest = state.board.exits[0];
  let minDist = axialDistance(pos, nearest);
  
  for (const exit of state.board.exits) {
    const dist = axialDistance(pos, exit);
    if (dist < minDist) {
      minDist = dist;
      nearest = exit;
    }
  }
  
  return nearest;
}

/**
 * Find safest neighbor towards exit
 */
function findSafestNeighbor(
  pos: AxialCoord,
  exit: AxialCoord,
  enemies: BattleUnit[],
  state: BattleState
): AxialCoord | null {
  const neighbors = getNeighbors(pos);
  
  let bestHex: AxialCoord | null = null;
  let bestScore = -Infinity;
  
  for (const neighbor of neighbors) {
    // Check if passable
    const tile = state.board.tiles.get(`${neighbor.q},${neighbor.r}`);
    if (!tile || tile.movementCost >= 999) continue;
    
    // Check if occupied
    const occupant = getUnitAtPos(state, neighbor);
    if (occupant) continue;
    
    // Score: closer to exit is better, farther from enemies is better
    const distToExit = axialDistance(neighbor, exit);
    const minDistToEnemy = Math.min(
      ...enemies.map(e => axialDistance(neighbor, e.pos))
    );
    
    const score = -distToExit + minDistToEnemy * 2;
    
    if (score > bestScore) {
      bestScore = score;
      bestHex = neighbor;
    }
  }
  
  return bestHex;
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Get unit at position (helper)
 */
function getUnitAtPos(state: BattleState, pos: AxialCoord): BattleUnit | null {
  const units = Array.from(state.units.values());
  for (const unit of units) {
    if (unit.pos.q === pos.q && unit.pos.r === pos.r) {
      return unit;
    }
  }
  return null;
}
