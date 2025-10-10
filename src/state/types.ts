/**
 * Game State Types
 * Canvas 02 - Single source of truth for all game data
 */

export interface GameState {
  meta: {
    seed: number;
    version: string;
    day: number;
    savedAt?: string;
  };
  world: {
    mapSize: 'S' | 'M' | 'L' | 'XL' | 'XXL' | 'INF';
    chunkSize: number;
  };
  regions: Record<string, RegionState>;
  factions: Record<string, FactionState>;
  party: PartyState;
  economy: EconomyState;
  codex: CodexState;
}

export interface RegionState {
  id: string;
  owner: string | null;
  tier: number;
}

export interface FactionState {
  id: string;
  name: string;
  resources: {
    gold: number;
    recruits: number;
    magic: number;
  };
}

export interface PartyState {
  gold: number;
  characters: string[]; // Character IDs
  position: { x: number; y: number };
}

export interface EconomyState {
  marketPrices: Record<string, number>;
  tradeRoutes: string[];
}

export interface CodexState {
  entries: Record<string, CodexEntry>;
  rumors: string[];
}

export interface CodexEntry {
  id: string;
  title: string;
  content: string;
  discovered: boolean;
}

/**
 * Create initial empty game state
 */
export function createInitialState(seed?: number): GameState {
  return {
    meta: {
      seed: seed ?? Math.floor(Math.random() * 1000000),
      version: '0.1.0-canvas02',
      day: 0
    },
    world: {
      mapSize: 'M',
      chunkSize: 32
    },
    regions: {},
    factions: {},
    party: {
      gold: 100,
      characters: [],
      position: { x: 0, y: 0 }
    },
    economy: {
      marketPrices: {},
      tradeRoutes: []
    },
    codex: {
      entries: {},
      rumors: []
    }
  };
}

/**
 * Validate state structure (basic)
 */
export function isValidState(obj: any): obj is GameState {
  return (
    obj &&
    typeof obj === 'object' &&
    obj.meta &&
    typeof obj.meta.seed === 'number' &&
    typeof obj.meta.version === 'string' &&
    obj.world &&
    obj.regions &&
    obj.factions &&
    obj.party &&
    obj.economy &&
    obj.codex
  );
}
