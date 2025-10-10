// Re-export types from engine for compatibility
export type { Engine } from '../../engine.d';

// ============================================================================
// HYBRID ARCHITECTURE: Smooth Overworld + Hex Battles
// ============================================================================

/**
 * World position in smooth continuous coordinates (meters or world units)
 */
export type WorldPos = { x: number; y: number };

/**
 * Biome types for terrain classification
 */
export type Biome = 
  | "plains" 
  | "forest" 
  | "hills" 
  | "mountains" 
  | "swamp" 
  | "desert" 
  | "shore"
  | "water"
  | "snow"
  | "volcanic";

/**
 * Sample of overworld terrain at a specific position
 */
export interface OverworldSample {
  pos: WorldPos;
  height: number;      // -1..+1 normalized elevation
  moisture: number;    // 0..1 moisture/rainfall
  biome: Biome;
  blocked?: boolean;   // impassable terrain (cliffs, deep water, etc)
}

/**
 * Context for transitioning from smooth overworld to hex battle
 */
export interface EngagementContext {
  seed: string;
  center: WorldPos;
  approachVec: { x: number; y: number };  // Direction of encounter approach
  weather: "clear" | "rain" | "snow" | "fog";
  tod: "dawn" | "day" | "dusk" | "night";  // Time of day
  attackerIds: string[];   // Attacking party unit IDs
  defenderIds: string[];   // Defending party unit IDs
}