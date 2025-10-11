/**
 * Canvas 13 - Encounter System Types
 * 
 * Deterministic encounter generation, payload creation, and battle resolution
 * Clean handoff: overworld → tactical → overworld with full replay consistency
 */

import type { Stack } from '../econ/types';

// ============================================================================
// ENCOUNTER CONTEXT
// ============================================================================

/**
 * Weather conditions affecting visibility and movement
 */
export type Weather = 
  | 'clear'
  | 'rain'
  | 'snow'
  | 'fog'
  | 'storm'
  | 'heat'
  | 'cold';

/**
 * Time of day affecting visibility and stealth
 */
export type TimeOfDay = 
  | 'dawn'    // 05:00-07:00, limited visibility
  | 'day'     // 07:00-17:00, full visibility
  | 'dusk'    // 17:00-19:00, limited visibility
  | 'night';  // 19:00-05:00, reduced visibility, stealth bonus

/**
 * Terrain board types for tactical combat
 */
export type BoardKind = 
  | 'field'       // Open plains
  | 'forest'      // Dense woods
  | 'bridge'      // Narrow crossing
  | 'pass'        // Mountain pass
  | 'ruin'        // Ancient ruins
  | 'town'        // Settlement streets
  | 'swamp'       // Marshy terrain
  | 'desert'      // Sandy wasteland
  | 'underground' // Cave/dungeon
  | 'coast';      // Beach/shore

/**
 * Board configuration hints
 */
export interface BoardConfig {
  kind: BoardKind;
  elevationHint?: number;   // Relative elevation (0=flat, 1-5=hills/mountains)
  roughness?: number;       // Terrain difficulty (0=smooth, 1=very rough)
  density?: number;         // Feature density (trees, rocks, buildings)
  visibility?: number;      // Base visibility range in hexes
}

/**
 * Encounter objectives
 */
export type ObjectiveType = 
  | 'rout'          // Defeat all enemies
  | 'hold'          // Hold position for N turns
  | 'escort'        // Protect unit to exit
  | 'destroy'       // Destroy target structure/unit
  | 'survive'       // Survive N turns
  | 'capture'       // Capture specific hex
  | 'rescue'        // Extract friendly unit
  | 'assassinate';  // Kill specific target

export interface Objective {
  type: ObjectiveType;
  description: string;
  required: boolean;        // Must complete to win
  target?: string;          // Target unit/hex ID
  turns?: number;           // Turn limit for timed objectives
  bonus?: number;           // Bonus gold/XP for completion
}

/**
 * Encounter stakes - what's at risk
 */
export type StakeType = 
  | 'convoy'        // Cargo in transit
  | 'bridge'        // Strategic crossing control
  | 'shrine'        // Sacred site control
  | 'mine'          // Resource node control
  | 'region'        // Territory claim
  | 'reputation'    // Faction standing
  | 'contract';     // Cargo contract (Canvas 12)

export interface Stake {
  type: StakeType;
  description: string;
  value: number;            // Gold/reputation value
  winnerGains?: unknown;    // What winner receives
  loserLoses?: unknown;     // What loser loses
}

// ============================================================================
// FORCES & UNITS
// ============================================================================

/**
 * Side identifier in battle
 */
export type Side = 'A' | 'B' | 'N'; // Attacker, Defender, Neutral

/**
 * Unit reference for tactical combat
 */
export interface UnitRef {
  id: string;               // Party member or NPC unit ID
  name: string;
  level: number;
  hp: number;               // Current HP
  maxHp: number;
  ap: number;               // Current AP (if applicable)
  maxAp: number;
  status: string[];         // Active status effects
  gear: Record<string, string>; // Equipped items
  position?: { q: number; r: number }; // Initial deployment position
}

/**
 * Force (army/party) in encounter
 */
export interface Force {
  side: Side;
  factionId?: string;       // Faction allegiance (if any)
  regionId: string;         // Home region
  units: UnitRef[];         // Combatants
  morale: number;           // Force-wide morale (0-100)
  supply: number;           // Supply level (0-100)
  commander?: string;       // Commander unit ID (if any)
  convoy?: Stack[];         // Cargo being transported (Canvas 12)
}

// ============================================================================
// ENCOUNTER PAYLOAD
// ============================================================================

/**
 * Complete encounter definition for tactical combat
 * Fully deterministic - same inputs always produce same payload
 */
export interface EncounterPayload {
  id: string;                   // Unique encounter ID (hash of context)
  terrainSeed: number;          // Seed for board generation (Canvas 14)
  weather: Weather;
  timeOfDay: TimeOfDay;
  board: BoardConfig;
  attacker: Force;
  defender: Force;
  neutrals?: Force[];           // Neutral parties (rare)
  objectives: Objective[];
  stakes: Stake[];
  encounteredAt: number;        // Game day
  metadata?: Record<string, unknown>; // Extra context
}

// ============================================================================
// ENCOUNTER CONTEXT (Pre-Payload)
// ============================================================================

/**
 * World context for encounter generation
 */
export interface EncounterContext {
  // Location
  regionId: string;
  tilePos: { q: number; r: number };
  biome: string;
  roughness: number;
  
  // Timing
  day: number;
  hour: number;           // 0-23
  weather: Weather;
  
  // Parties involved
  playerParty: Force;
  hostileForces: Force[];
  neutralForces?: Force[];
  
  // Road/structure context
  onRoad?: boolean;
  roadType?: string;      // bridge, ford, tunnel
  structureId?: string;   // If at specific structure
  
  // Strategic context
  rumors?: string[];      // Active rumors affecting encounter
  recentBattles?: number; // Recent battles in region (affects density)
  factionTension?: number; // 0-1, higher = more aggressive encounters
  
  // Seeds
  worldSeed: string;
  
  // Cargo/contracts
  convoy?: Stack[];       // If transporting goods (Canvas 12)
  contractId?: string;    // Active contract (Canvas 12)
}

/**
 * Encounter check result
 */
export interface EncounterCheck {
  triggered: boolean;
  chance: number;         // 0-1 probability
  source: string;         // 'proximity' | 'patrol' | 'ambush' | 'quest'
  preview?: EncounterPreview;
}

/**
 * Encounter preview for player decision
 */
export interface EncounterPreview {
  description: string;
  board: BoardKind;
  weather: Weather;
  timeOfDay: TimeOfDay;
  enemyCount: number;
  estimatedDifficulty: 'trivial' | 'easy' | 'normal' | 'hard' | 'deadly';
  stakes: Stake[];
  canFlee: boolean;
  canParley: boolean;
  fleeChance?: number;    // 0-1 if can flee
  parleyChance?: number;  // 0-1 if can parley
}

/**
 * Player action choices
 */
export type EncounterAction = 
  | 'engage'      // Start combat
  | 'flee'        // Attempt to escape
  | 'parley'      // Attempt negotiation
  | 'bribe'       // Offer gold to avoid
  | 'hide'        // Attempt stealth
  | 'ambush';     // Attack from stealth (if hidden)

// ============================================================================
// BATTLE RESULT
// ============================================================================

/**
 * Battle outcome
 */
export type BattleWinner = 'A' | 'B' | 'draw';

/**
 * Casualty report
 */
export interface Casualty {
  unitId: string;
  hpAfter: number;
  downed?: boolean;       // Downed but alive
  dead?: boolean;         // Permanent death
  injuries?: string[];    // Injury types (Canvas 11)
}

/**
 * Gear wear from combat
 */
export interface GearWear {
  itemId: string;
  ownerId: string;        // Unit that owns the gear
  durabilityDelta: number; // Durability lost
  broken?: boolean;       // Item broke during combat
}

/**
 * Region control shift
 */
export interface RegionShift {
  regionId: string;
  controlDelta: number;   // Change in control percentage
  newController?: string; // New faction controller (if changed)
}

/**
 * Convoy outcome
 */
export type ConvoyOutcome = 
  | 'protected'   // Cargo defended successfully
  | 'plundered'   // Cargo stolen by enemy
  | 'lost'        // Cargo destroyed/scattered
  | 'abandoned';  // Cargo left behind in retreat

/**
 * Complete battle result for overworld application
 */
export interface BattleResult {
  id: string;             // Result ID
  payloadId: string;      // Reference to EncounterPayload
  winner: BattleWinner;
  
  // Casualties
  casualties: Casualty[];
  
  // Loot
  loot: Stack[];          // Items gained
  gold: number;           // Gold gained
  
  // Gear damage
  gearWear: GearWear[];
  
  // Strategic effects
  regionShift?: RegionShift;
  convoyOutcome?: ConvoyOutcome;
  
  // Reputation changes
  reputationDelta: number;    // Faction reputation change
  fearDelta: number;          // Region fear change (Canvas 20)
  notorietyDelta: number;     // Player notoriety change (Canvas 20)
  
  // Objectives
  objectivesCompleted: string[]; // Completed objective IDs
  
  // Consumables used
  consumablesUsed: Stack[];
  
  // XP and rewards
  xpGained: number;
  bonusGold: number;      // From objectives/contracts
  
  // Metadata
  turnCount: number;
  duration: number;       // Real-time seconds
  timestamp: number;      // When battle completed
}

// ============================================================================
// LOOT TABLES
// ============================================================================

/**
 * Loot table entry
 */
export interface LootEntry {
  itemId: string;
  chance: number;         // 0-1 drop chance
  minQty: number;
  maxQty: number;
  weight: number;         // Relative weight for selection
}

/**
 * Loot table definition
 */
export interface LootTable {
  id: string;
  name: string;
  rolls: number;          // Number of items to roll
  entries: LootEntry[];
}

// ============================================================================
// DETECTION & STEALTH
// ============================================================================

/**
 * Detection parameters
 */
export interface DetectionParams {
  baseRange: number;      // Base detection range in hexes
  lightModifier: number;  // Time of day modifier
  weatherModifier: number; // Weather visibility modifier
  terrainModifier: number; // Terrain concealment
}

/**
 * Stealth check result
 */
export interface StealthCheck {
  success: boolean;
  margin: number;         // How close the roll was
  detected: boolean;      // If detected despite success
  penalty?: string;       // Reason for penalty
}

// ============================================================================
// ENCOUNTER DENSITY
// ============================================================================

/**
 * Encounter density factors
 */
export interface EncounterDensity {
  baseChance: number;           // Base encounter chance per hour
  ruinModifier: number;         // Bonus near ruins
  roadModifier: number;         // Modifier on roads
  factionPresence: number;      // Faction activity level
  recentBattles: number;        // Recent battles increase patrols
  rumorsModifier: number;       // Fear/rumors increase encounters
  timeOfDayModifier: number;    // Night has different encounters
}

// ============================================================================
// EVENTS
// ============================================================================

/**
 * Encounter event types
 */
export type EncounterEventType = 
  | 'encounter/check'
  | 'encounter/prepare'
  | 'encounter/start'
  | 'encounter/resolve'
  | 'encounter/apply'
  | 'encounter/flee'
  | 'encounter/parley';

/**
 * Encounter event payload
 */
export interface EncounterEvent {
  type: EncounterEventType;
  timestamp: number;
  data: Record<string, unknown>;
}

// ============================================================================
// TRIGGER SOURCES
// ============================================================================

/**
 * Encounter trigger source
 */
export type TriggerSource = 
  | 'proximity'     // Random roaming encounter
  | 'patrol'        // Faction patrol detection
  | 'ambush'        // Deliberate ambush setup
  | 'quest'         // Scripted quest encounter
  | 'siege'         // Siege battle
  | 'escort'        // Escort mission encounter
  | 'rumor';        // Triggered by rumors/fear

/**
 * Trigger configuration
 */
export interface TriggerConfig {
  source: TriggerSource;
  priority: number;       // Higher priority overrides lower
  guaranteed?: boolean;   // Cannot be avoided
  repeatable?: boolean;   // Can trigger multiple times
  cooldown?: number;      // Days before can trigger again
}
