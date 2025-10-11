/**
 * Canvas 14 - Battle API
 * 
 * Public API for battle management (integrates with Canvas 13)
 */

import type { EncounterPayload } from '../encounters/types';
import type { BattleState, BattlePhase } from './state';
import type { QueuedOrder } from './orders';
import { initBattleFromPayload } from './state';
import { generateBoard } from './gen';
import { BattleRNG } from './rng';

// ============================================================================
// BATTLE MANAGER
// ============================================================================

/**
 * Active battles registry
 */
const activeBattles = new Map<string, BattleContext>();

/**
 * Battle context (state + RNG)
 */
interface BattleContext {
  state: BattleState;
  rng: BattleRNG;
  orders: QueuedOrder[];
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Initialize battle from encounter payload
 */
export function initBattle(payload: EncounterPayload): BattleState {
  // Create initial state
  const state = initBattleFromPayload(payload);
  
  // Generate board
  state.board = generateBoard(payload.terrainSeed.toString(), payload.board.kind);
  
  // Initialize RNG
  const rng = new BattleRNG(payload.id);
  
  // Store context
  activeBattles.set(state.id, {
    state,
    rng,
    orders: []
  });
  
  return state;
}

/**
 * Issue order for unit
 */
export function issueOrder(
  battleId: string,
  order: QueuedOrder
): { success: boolean; error?: string } {
  const context = activeBattles.get(battleId);
  
  if (!context) {
    return { success: false, error: 'Battle not found' };
  }
  
  // Validate order
  if (!order.isValid) {
    return { success: false, error: 'Invalid order' };
  }
  
  // Add to order queue
  context.orders.push(order);
  
  return { success: true };
}

/**
 * Step battle forward one phase
 */
export function step(battleId: string): StepResult {
  const context = activeBattles.get(battleId);
  
  if (!context) {
    return {
      success: false,
      error: 'Battle not found',
      state: null as unknown as BattleState,
      events: []
    };
  }
  
  const { state } = context;
  
  // Advance phase based on current phase
  switch (state.phase) {
    case 'deployment':
      // Move to orders phase
      state.phase = 'orders';
      break;
    
    case 'orders':
      // Move to resolution phase
      state.phase = 'resolution';
      break;
    
    case 'resolution':
      // Execute orders (stub for now)
      // TODO: Implement full resolution in resolve.ts
      state.phase = 'morale';
      break;
    
    case 'morale':
      // Check morale and advance round
      state.round += 1;
      state.phase = 'orders';
      
      // Reset unit AP
      const units = Array.from(state.units.values());
      for (const unit of units) {
        unit.ap = unit.maxAp;
        unit.hasMoved = false;
        unit.hasActed = false;
        unit.reactionsUsed = 0;
      }
      break;
    
    default:
      return {
        success: false,
        error: 'Battle is over',
        state,
        events: []
      };
  }
  
  state.updatedAt = Date.now();
  
  return {
    success: true,
    state,
    events: []
  };
}

/**
 * Get current battle state
 */
export function getBattleState(battleId: string): BattleState | null {
  const context = activeBattles.get(battleId);
  return context?.state ?? null;
}

/**
 * Get battle result (when complete)
 */
export function getBattleResult(battleId: string): BattleResultView | null {
  const context = activeBattles.get(battleId);
  
  if (!context) {
    return null;
  }
  
  const { state } = context;
  
  // Check if battle is over
  if (state.phase !== 'victory' && state.phase !== 'defeat' && state.phase !== 'retreat') {
    return null;
  }
  
  // TODO: Generate full BattleResult (Canvas 13 format)
  // This requires casualties, loot, durability tracking
  
  return {
    battleId: state.id,
    payloadId: state.payloadId,
    phase: state.phase,
    rounds: state.round,
    winner: 'A' // Stub
  };
}

/**
 * Clean up battle (free resources)
 */
export function cleanupBattle(battleId: string): void {
  activeBattles.delete(battleId);
}

// ============================================================================
// TYPES
// ============================================================================

/**
 * Step result
 */
export interface StepResult {
  success: boolean;
  error?: string;
  state: BattleState;
  events: BattleEvent[];
}

/**
 * Battle event
 */
export interface BattleEvent {
  type: string;
  data: Record<string, unknown>;
  timestamp: number;
}

/**
 * Battle result view
 */
export interface BattleResultView {
  battleId: string;
  payloadId: string;
  phase: BattlePhase;
  rounds: number;
  winner: 'A' | 'B' | 'draw';
}

// ============================================================================
// EXPORTS
// ============================================================================

export { initBattleFromPayload } from './state';
export { generateBoard } from './gen';
export type { BattleState, BattleUnit, Board, Tile } from './state';
export type { QueuedOrder, OrderType, OrderTiming } from './orders';
export { BattleRNG } from './rng';
