/**
 * Canvas 14 - Tactical Battle Core
 * 
 * Complete hex-based tactical combat system with simultaneous resolution
 */

// ============================================================================
// PUBLIC API
// ============================================================================

export {
  initBattle,
  issueOrder,
  step,
  getBattleState,
  getBattleResult,
  cleanupBattle
} from './api';

export type {
  StepResult,
  BattleEvent,
  BattleResultView
} from './api';

// ============================================================================
// CORE TYPES
// ============================================================================

export type {
  BattleState,
  BattleUnit,
  Board,
  Tile,
  Side,
  BattlePhase,
  StatusEffect,
  StatusType,
  Objective,
  ObjectiveType,
  AttackResult,
  MovementResult,
  LogEntry,
  LogEntryType
} from './state';

export type {
  QueuedOrder,
  ReactionOrder,
  OrderType,
  OrderTiming
} from './orders';

// ============================================================================
// HEX SYSTEM
// ============================================================================

export type {
  AxialCoord,
  CubeCoord,
  HexDirection
} from './hex';

export {
  axialToCube,
  cubeToAxial,
  cubeDistance,
  axialDistance,
  getNeighbors,
  getDirection,
  hasLineOfSight,
  getBlastArea,
  getConeArea,
  getRingArea,
  getLineArea,
  findPath,
  getReachableHexes
} from './hex';

// ============================================================================
// RNG SYSTEM
// ============================================================================

export {
  SeededRNG,
  BattleRNG
} from './rng';

export type {
  RNGStream
} from './rng';

// ============================================================================
// COMBAT SYSTEM
// ============================================================================

export {
  calculateHitChance,
  rollHit,
  calculateCritChance,
  rollCrit,
  calculateDamage,
  executeAttack,
  calculateCombatContext,
  applyStatus,
  tickStatusEffects,
  getStatModifiers
} from './combat';

export type {
  CombatContext
} from './combat';

// ============================================================================
// MOVEMENT SYSTEM
// ============================================================================

export {
  calculateStepCost,
  getMovementOptions,
  checkZOCTrigger,
  executeMovement,
  resolveCollision,
  findDivertPosition
} from './movement';

// ============================================================================
// ORDER SYSTEM
// ============================================================================

export {
  createMoveOrder,
  createAttackOrder,
  createGuardOrder,
  createWaitOrder,
  createAbilityOrder,
  createItemOrder,
  validateOrder,
  queueOrder,
  getOrdersForTurn,
  clearOrder,
  getOrderForUnit
} from './orders';

// ============================================================================
// TERRAIN GENERATION
// ============================================================================

export {
  generateBoard,
  getBoardConfig
} from './gen';

export type {
  BoardConfig
} from './gen';

// ============================================================================
// RESOLUTION ENGINE
// ============================================================================

export {
  resolveRound
} from './resolve';

export type {
  RoundResult
} from './resolve';

// ============================================================================
// MORALE SYSTEM
// ============================================================================

export {
  checkMoraleThreshold,
  applyFearFromCasualties,
  applyFearFromSurrounded,
  applyFearFromCommanderDown,
  calculateRetreatPath
} from './morale';

// ============================================================================
// UTILITIES
// ============================================================================

export {
  getUnitAt,
  getUnitsOnSide,
  getLivingUnitsOnSide,
  isBattleOver,
  getBattleWinner
} from './state';
