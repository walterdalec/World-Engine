/**
 * Canvas 13 - Encounter System
 * 
 * Clean handoff: overworld → tactical combat → overworld
 * Deterministic encounters with replay consistency
 */

// Types
export type {
  // Context & Payload
  EncounterContext,
  EncounterPayload,
  BoardKind,
  BoardConfig,
  Objective,
  ObjectiveType,
  Stake,
  StakeType,
  
  // Forces
  Force,
  UnitRef,
  Side,
  
  // Results
  BattleResult,
  Casualty,
  GearWear,
  RegionShift,
  ConvoyOutcome,
  BattleWinner,
  
  // Weather & Time
  Weather,
  TimeOfDay,
  
  // Encounter checking
  EncounterCheck,
  EncounterPreview,
  EncounterAction,
  
  // Detection
  DetectionParams,
  StealthCheck,
  EncounterDensity,
  
  // Events
  EncounterEvent,
  EncounterEventType,
  
  // Triggers
  TriggerSource,
  TriggerConfig,
  
  // Loot
  LootTable,
  LootEntry
} from './types';

// Context building
export {
  createEncounterContext,
  calculateEncounterDensity,
  getFinalEncounterChance,
  getTimeOfDay,
  getWeatherVisibility,
  getTimeVisibility,
  calculateDetectionParams,
  checkDetection,
  calculateStealthBonus,
  rollStealthCheck,
  calculateFleeChance,
  calculateParleyChance,
  calculateBribeCost,
  canBribe
} from './context';

// Payload generation
export {
  createEncounterPayload,
  determineBoardKind,
  createBoardConfig,
  generateObjectives,
  createObjective,
  calculateStakes,
  calculateDifficulty,
  estimateDuration,
  estimateCasualties
} from './payload';

// Result application
export {
  applyBattleResult,
  processBattleCasualties,
  distributeLoot,
  applyGearDurability,
  distributeXP
} from './apply';

export type {
  BattleResultApplication,
  CasualtyReport,
  LootDistribution,
  GearDurabilityReport,
  XPDistribution
} from './apply';

// Seed generation
export {
  generateEncounterSeed,
  seedToNumber,
  generateEncounterId,
  generateTerrainSeed,
  generateLootSeed,
  generateObjectiveSeed,
  EncounterRNG
} from './seed';
