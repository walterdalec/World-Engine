/**
 * Canvas 14 - Battle State & Types
 * 
 * Core data structures for tactical combat
 */

import type { AxialCoord, HexDirection } from './hex';
import type { EncounterPayload, UnitRef } from '../encounters/types';

// ============================================================================
// BATTLE STATE
// ============================================================================

/**
 * Side identifier
 */
export type Side = 'A' | 'B' | 'N'; // Attacker, Defender, Neutral

/**
 * Battle phase
 */
export type BattlePhase = 
  | 'deployment'    // Units being placed
  | 'orders'        // Players issuing orders
  | 'resolution'    // Executing queued orders
  | 'morale'        // Morale/status checks
  | 'victory'       // Battle won
  | 'defeat'        // Battle lost
  | 'retreat';      // Retreating

/**
 * Complete battle state
 */
export interface BattleState {
  id: string;
  payloadId: string;
  phase: BattlePhase;
  round: number;
  
  // Terrain
  board: Board;
  
  // Units
  units: Map<string, BattleUnit>;
  
  // Objectives
  objectives: Objective[];
  
  // Turn order
  initiative: InitiativeEntry[];
  currentInitiative: number;
  
  // History
  log: LogEntry[];
  
  // Victory conditions
  maxRounds: number;
  
  // Metadata
  startedAt: number;
  updatedAt: number;
}

// ============================================================================
// BOARD & TERRAIN
// ============================================================================

/**
 * Hex board
 */
export interface Board {
  width: number;
  height: number;
  tiles: Map<string, Tile>;
  
  // Deployment zones
  deploymentZones: {
    A: AxialCoord[];
    B: AxialCoord[];
    N?: AxialCoord[];
  };
  
  // Special locations
  objectives: Map<string, AxialCoord>;
  exits: AxialCoord[];
}

/**
 * Terrain tile
 */
export interface Tile {
  pos: AxialCoord;
  biome: BiomeType;
  height: number;          // Elevation (0-5)
  cover: CoverType;
  movementCost: number;    // Base movement cost
  losBlock: boolean;       // Blocks line of sight
  hazard?: HazardType;     // Active hazard
}

/**
 * Biome types
 */
export type BiomeType = 
  | 'grass'
  | 'forest'
  | 'water'
  | 'stone'
  | 'sand'
  | 'mud'
  | 'ice'
  | 'lava';

/**
 * Cover types
 */
export type CoverType = 
  | 'none'
  | 'low'      // +10% defense
  | 'high';    // +20% defense

/**
 * Hazard types
 */
export type HazardType = 
  | 'fire'     // DoT damage
  | 'poison'   // DoT damage + status
  | 'ice'      // Reduced movement
  | 'caltrops' // Movement damage
  | 'pit';     // Fall damage on entry

// ============================================================================
// UNITS
// ============================================================================

/**
 * Battle unit (from party member or enemy)
 */
export interface BattleUnit {
  id: string;
  side: Side;
  
  // Position & orientation
  pos: AxialCoord;
  facing: HexDirection;
  
  // Stats (snapshot from character)
  name: string;
  level: number;
  
  // Combat stats
  hp: number;
  maxHp: number;
  ap: number;           // Action points this round
  maxAp: number;        // Max AP per round
  stam: number;         // Stamina for reactions
  maxStam: number;
  
  // Derived stats (for combat formulas)
  atk: number;          // Attack power
  def: number;          // Defense
  acc: number;          // Accuracy
  eva: number;          // Evasion
  crit: number;         // Crit chance
  resist: number;       // Crit resistance
  
  // Initiative
  init: number;
  initRoll: number;     // This round's initiative roll
  
  // Morale
  morale: number;       // 0-100
  
  // Status
  statuses: StatusEffect[];
  
  // Reactions
  reactionSlots: number;
  reactionsUsed: number;
  
  // Flags
  isDowned: boolean;
  isDead: boolean;
  hasRetreated: boolean;
  hasMoved: boolean;
  hasActed: boolean;
  
  // Gear durability tracking
  gearDurability: Map<string, number>;
  
  // Original reference
  originalRef: UnitRef;
}

/**
 * Status effect
 */
export interface StatusEffect {
  id: string;
  name: string;
  type: StatusType;
  duration: number;      // Turns remaining (-1 = permanent)
  strength: number;      // Effect magnitude
  source: string;        // Unit ID that applied it
  
  // Effect modifiers
  statMods?: Partial<Record<StatType, number>>;
  dotDamage?: number;    // Damage per turn
  hotHealing?: number;   // Healing per turn
  
  // Special flags
  isPermanent?: boolean;
  isAura?: boolean;      // From commander/terrain
  preventsMovement?: boolean;
  preventsActions?: boolean;
}

/**
 * Status types
 */
export type StatusType = 
  | 'buff'
  | 'debuff'
  | 'dot'        // Damage over time
  | 'hot'        // Heal over time
  | 'stun'
  | 'root'
  | 'slow'
  | 'blind'
  | 'fear'
  | 'taunt';

/**
 * Stat types
 */
export type StatType = 
  | 'atk'
  | 'def'
  | 'acc'
  | 'eva'
  | 'crit'
  | 'resist'
  | 'init'
  | 'movementCost';

// ============================================================================
// INITIATIVE
// ============================================================================

/**
 * Initiative tracker entry
 */
export interface InitiativeEntry {
  unitId: string;
  init: number;
  tieBreaker: number;    // Random tie-breaker
  hasActed: boolean;
}

// ============================================================================
// OBJECTIVES
// ============================================================================

/**
 * Battle objective
 */
export interface Objective {
  id: string;
  type: ObjectiveType;
  description: string;
  required: boolean;
  side: Side;            // Which side needs to complete it
  
  // Progress tracking
  progress: number;
  target: number;
  
  // Completion
  completed: boolean;
  failed: boolean;
  
  // Reward
  bonus: number;         // Gold/XP bonus
}

/**
 * Objective types
 */
export type ObjectiveType = 
  | 'annihilate'    // Kill all enemies
  | 'rout'          // Force morale break
  | 'hold'          // Hold position for N turns
  | 'control'       // Control specific hexes
  | 'escort'        // Escort unit to exit
  | 'destroy'       // Destroy target
  | 'survive'       // Survive N turns
  | 'capture';      // Capture specific unit

// ============================================================================
// COMBAT LOG
// ============================================================================

/**
 * Combat log entry
 */
export interface LogEntry {
  round: number;
  timestamp: number;
  type: LogEntryType;
  actorId?: string;
  targetId?: string;
  data: Record<string, unknown>;
  message: string;
}

/**
 * Log entry types
 */
export type LogEntryType = 
  | 'round_start'
  | 'round_end'
  | 'move'
  | 'attack'
  | 'damage'
  | 'heal'
  | 'miss'
  | 'crit'
  | 'status_apply'
  | 'status_expire'
  | 'death'
  | 'retreat'
  | 'rout'
  | 'objective_progress'
  | 'objective_complete'
  | 'victory'
  | 'defeat';

// ============================================================================
// COMBAT RESULTS
// ============================================================================

/**
 * Attack result
 */
export interface AttackResult {
  hit: boolean;
  crit: boolean;
  damage: number;
  statusApplied?: StatusEffect;
  gearDamage?: number;
  
  // Roll breakdown
  hitRoll: number;
  hitChance: number;
  critRoll?: number;
  critChance?: number;
  damageRoll: number;
}

/**
 * Movement result
 */
export interface MovementResult {
  success: boolean;
  path: AxialCoord[];
  apCost: number;
  zocTriggered: boolean;
  intercepted: boolean;
  finalPos: AxialCoord;
  finalFacing: HexDirection;
}

// ============================================================================
// BATTLE INITIALIZATION
// ============================================================================

/**
 * Initialize battle state from encounter payload
 */
export function initBattleFromPayload(payload: EncounterPayload): BattleState {
  const id = `battle_${Date.now()}`;
  
  // Create empty board (will be populated by gen.ts)
  const board: Board = {
    width: 20,
    height: 16,
    tiles: new Map(),
    deploymentZones: {
      A: [],
      B: []
    },
    objectives: new Map(),
    exits: []
  };
  
  // Convert forces to battle units
  const units = new Map<string, BattleUnit>();
  
  // Add attacker units
  for (const unitRef of payload.attacker.units) {
    const unit = createBattleUnit(unitRef, 'A');
    units.set(unit.id, unit);
  }
  
  // Add defender units
  for (const unitRef of payload.defender.units) {
    const unit = createBattleUnit(unitRef, 'B');
    units.set(unit.id, unit);
  }
  
  // Add neutral units if any
  if (payload.neutrals) {
    for (const force of payload.neutrals) {
      for (const unitRef of force.units) {
        const unit = createBattleUnit(unitRef, 'N');
        units.set(unit.id, unit);
      }
    }
  }
  
  // Convert objectives
  const objectives: Objective[] = payload.objectives.map(obj => ({
    id: `obj_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    type: obj.type as ObjectiveType,
    description: obj.description,
    required: obj.required,
    side: 'B', // Defender objectives by default
    progress: 0,
    target: obj.turns ?? 10,
    completed: false,
    failed: false,
    bonus: obj.bonus ?? 0
  }));
  
  return {
    id,
    payloadId: payload.id,
    phase: 'deployment',
    round: 0,
    board,
    units,
    objectives,
    initiative: [],
    currentInitiative: 0,
    log: [],
    maxRounds: 30,
    startedAt: Date.now(),
    updatedAt: Date.now()
  };
}

/**
 * Create battle unit from unit reference
 */
function createBattleUnit(unitRef: UnitRef, side: Side): BattleUnit {
  return {
    id: unitRef.id,
    side,
    pos: unitRef.position ?? { q: 0, r: 0 },
    facing: 0,
    name: unitRef.name,
    level: unitRef.level,
    hp: unitRef.hp,
    maxHp: unitRef.maxHp,
    ap: 0,
    maxAp: unitRef.maxAp ?? 2,
    stam: 3,
    maxStam: 3,
    
    // Derived stats (would be calculated from gear/stats)
    atk: 10 + unitRef.level * 2,
    def: 10 + unitRef.level,
    acc: 75 + unitRef.level * 2,
    eva: 10 + unitRef.level,
    crit: 5 + Math.floor(unitRef.level / 2),
    resist: 5 + Math.floor(unitRef.level / 2),
    
    init: 10 + unitRef.level,
    initRoll: 0,
    morale: 50,
    statuses: [],
    reactionSlots: 1,
    reactionsUsed: 0,
    isDowned: false,
    isDead: false,
    hasRetreated: false,
    hasMoved: false,
    hasActed: false,
    gearDurability: new Map(),
    originalRef: unitRef
  };
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Get unit at position
 */
export function getUnitAt(state: BattleState, pos: AxialCoord): BattleUnit | null {
  const units = Array.from(state.units.values());
  for (const unit of units) {
    if (unit.pos.q === pos.q && unit.pos.r === pos.r) {
      return unit;
    }
  }
  return null;
}

/**
 * Get all units on side
 */
export function getUnitsOnSide(state: BattleState, side: Side): BattleUnit[] {
  return Array.from(state.units.values()).filter(u => u.side === side);
}

/**
 * Get living units on side
 */
export function getLivingUnitsOnSide(state: BattleState, side: Side): BattleUnit[] {
  return getUnitsOnSide(state, side).filter(u => !u.isDead && !u.isDowned && !u.hasRetreated);
}

/**
 * Check if battle is over
 */
export function isBattleOver(state: BattleState): boolean {
  if (state.phase === 'victory' || state.phase === 'defeat' || state.phase === 'retreat') {
    return true;
  }
  
  // Check annihilation
  const sideAAlive = getLivingUnitsOnSide(state, 'A').length > 0;
  const sideBAlive = getLivingUnitsOnSide(state, 'B').length > 0;
  
  if (!sideAAlive || !sideBAlive) {
    return true;
  }
  
  // Check objectives
  const requiredObjectives = state.objectives.filter(o => o.required);
  const completedRequired = requiredObjectives.filter(o => o.completed);
  
  if (requiredObjectives.length > 0 && completedRequired.length === requiredObjectives.length) {
    return true;
  }
  
  // Check max rounds
  if (state.round >= state.maxRounds) {
    return true;
  }
  
  return false;
}

/**
 * Get battle winner
 */
export function getBattleWinner(state: BattleState): Side | 'draw' {
  const sideAAlive = getLivingUnitsOnSide(state, 'A').length;
  const sideBAlive = getLivingUnitsOnSide(state, 'B').length;
  
  if (sideAAlive > 0 && sideBAlive === 0) return 'A';
  if (sideBAlive > 0 && sideAAlive === 0) return 'B';
  
  // Check objectives
  const sideAObjectives = state.objectives.filter(o => o.side === 'A' && o.completed).length;
  const sideBObjectives = state.objectives.filter(o => o.side === 'B' && o.completed).length;
  
  if (sideAObjectives > sideBObjectives) return 'A';
  if (sideBObjectives > sideAObjectives) return 'B';
  
  return 'draw';
}
