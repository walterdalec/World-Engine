/**
 * Canvas 14 - Terrain Generation
 * 
 * Generate battle boards from Canvas 13 encounter payloads
 */

import type { AxialCoord } from './hex';
import type { Board, Tile, BiomeType, HazardType } from './state';
import type { BoardKind } from '../encounters/types';
import { SeededRNG } from './rng';
import { getBlastArea } from './hex';

// ============================================================================
// BOARD CONFIGURATION
// ============================================================================

/**
 * Board generation config
 */
export interface BoardConfig {
  width: number;
  height: number;
  elevationVariance: number;  // 0-1, how much height varies
  coverDensity: number;       // 0-1, how much cover
  hazardChance: number;       // 0-1, chance of hazards
  symmetrical: boolean;       // Mirror layout for fairness
}

/**
 * Get board config for board kind
 */
export function getBoardConfig(kind: BoardKind): BoardConfig {
  switch (kind) {
    case 'field':
      return {
        width: 24,
        height: 16,
        elevationVariance: 0.2,
        coverDensity: 0.1,
        hazardChance: 0.0,
        symmetrical: true
      };
    
    case 'forest':
      return {
        width: 20,
        height: 16,
        elevationVariance: 0.3,
        coverDensity: 0.4,
        hazardChance: 0.05,
        symmetrical: false
      };
    
    case 'bridge':
      return {
        width: 16,
        height: 20,
        elevationVariance: 0.1,
        coverDensity: 0.2,
        hazardChance: 0.0,
        symmetrical: true
      };
    
    case 'pass':
      return {
        width: 18,
        height: 18,
        elevationVariance: 0.8,
        coverDensity: 0.3,
        hazardChance: 0.1,
        symmetrical: true
      };
    
    case 'ruin':
      return {
        width: 20,
        height: 18,
        elevationVariance: 0.4,
        coverDensity: 0.5,
        hazardChance: 0.15,
        symmetrical: false
      };
    
    case 'town':
      return {
        width: 22,
        height: 18,
        elevationVariance: 0.1,
        coverDensity: 0.6,
        hazardChance: 0.05,
        symmetrical: false
      };
    
    case 'swamp':
      return {
        width: 20,
        height: 16,
        elevationVariance: 0.2,
        coverDensity: 0.3,
        hazardChance: 0.3,
        symmetrical: false
      };
    
    case 'desert':
      return {
        width: 24,
        height: 18,
        elevationVariance: 0.5,
        coverDensity: 0.15,
        hazardChance: 0.1,
        symmetrical: false
      };
    
    case 'underground':
      return {
        width: 18,
        height: 16,
        elevationVariance: 0.3,
        coverDensity: 0.4,
        hazardChance: 0.2,
        symmetrical: false
      };
    
    case 'coast':
      return {
        width: 22,
        height: 18,
        elevationVariance: 0.3,
        coverDensity: 0.2,
        hazardChance: 0.1,
        symmetrical: false
      };
    
    default:
      return {
        width: 20,
        height: 16,
        elevationVariance: 0.3,
        coverDensity: 0.2,
        hazardChance: 0.05,
        symmetrical: true
      };
  }
}

// ============================================================================
// TERRAIN GENERATION
// ============================================================================

/**
 * Generate board from terrain seed and board kind
 */
export function generateBoard(
  terrainSeed: string,
  boardKind: BoardKind
): Board {
  const config = getBoardConfig(boardKind);
  const rng = new SeededRNG(hashString(terrainSeed));
  
  const board: Board = {
    width: config.width,
    height: config.height,
    tiles: new Map(),
    deploymentZones: {
      A: [],
      B: []
    },
    objectives: new Map(),
    exits: []
  };
  
  // Generate base terrain
  generateBaseTerrain(board, boardKind, config, rng);
  
  // Add elevation
  generateElevation(board, config, rng);
  
  // Add cover
  generateCover(board, config, rng);
  
  // Add hazards
  generateHazards(board, boardKind, config, rng);
  
  // Define deployment zones
  generateDeploymentZones(board, config);
  
  // Add exits (for retreat)
  generateExits(board);
  
  return board;
}

/**
 * Generate base terrain tiles
 */
function generateBaseTerrain(
  board: Board,
  boardKind: BoardKind,
  config: BoardConfig,
  rng: SeededRNG
): void {
  const biome = getBiomeForBoardKind(boardKind);
  
  // Generate hex grid (offset coordinates)
  for (let r = 0; r < config.height; r++) {
    for (let q = 0; q < config.width; q++) {
      const pos: AxialCoord = { q, r };
      const key = `${q},${r}`;
      
      const tile: Tile = {
        pos,
        biome: biome,
        height: 0,
        cover: 'none',
        movementCost: 1,
        losBlock: false,
        hazard: undefined
      };
      
      // Biome-specific adjustments
      adjustTileForBiome(tile, boardKind, rng);
      
      board.tiles.set(key, tile);
    }
  }
  
  // Special layouts for certain board kinds
  applyBoardKindLayout(board, boardKind, config, rng);
}

/**
 * Get biome for board kind
 */
function getBiomeForBoardKind(boardKind: BoardKind): BiomeType {
  switch (boardKind) {
    case 'field': return 'grass';
    case 'forest': return 'forest';
    case 'bridge': return 'stone';
    case 'pass': return 'stone';
    case 'ruin': return 'stone';
    case 'town': return 'stone';
    case 'swamp': return 'mud';
    case 'desert': return 'sand';
    case 'underground': return 'stone';
    case 'coast': return 'grass';
    default: return 'grass';
  }
}

/**
 * Adjust tile based on biome
 */
function adjustTileForBiome(tile: Tile, boardKind: BoardKind, rng: SeededRNG): void {
  switch (boardKind) {
    case 'forest':
      // Random tree cover
      if (rng.check(0.3)) {
        tile.cover = rng.check(0.5) ? 'low' : 'high';
        if (tile.cover === 'high') {
          tile.losBlock = true;
        }
      }
      break;
    
    case 'swamp':
      // Higher movement cost
      tile.movementCost = rng.nextInt(1, 3);
      break;
    
    case 'desert':
      // Occasional dunes
      if (rng.check(0.2)) {
        tile.height = rng.nextInt(1, 3);
      }
      break;
    
    case 'underground':
      // Random pillars/stalagmites
      if (rng.check(0.15)) {
        tile.cover = 'high';
        tile.losBlock = true;
      }
      break;
  }
}

/**
 * Apply special layouts for board kinds
 */
function applyBoardKindLayout(
  board: Board,
  boardKind: BoardKind,
  config: BoardConfig,
  rng: SeededRNG
): void {
  switch (boardKind) {
    case 'bridge':
      createBridgeLayout(board, config, rng);
      break;
    
    case 'pass':
      createPassLayout(board, config, rng);
      break;
    
    case 'ruin':
      createRuinLayout(board, config, rng);
      break;
    
    case 'town':
      createTownLayout(board, config, rng);
      break;
  }
}

/**
 * Create bridge layout (narrow passage)
 */
function createBridgeLayout(board: Board, config: BoardConfig, rng: SeededRNG): void {
  const bridgeWidth = Math.floor(config.width * 0.4);
  
  Array.from(board.tiles.values()).forEach(tile => {
    const distFromCenter = Math.abs(tile.pos.q - config.width / 2);
    
    if (distFromCenter > bridgeWidth / 2) {
      // Water on sides
      tile.biome = 'water';
      tile.losBlock = false;
      tile.movementCost = 999; // Impassable
    } else {
      // Bridge proper
      tile.biome = 'stone';
      tile.movementCost = 1;
      
      // Occasional cover
      if (rng.check(0.15)) {
        tile.cover = 'low';
      }
    }
  });
}

/**
 * Create mountain pass layout (elevation corridor)
 */
function createPassLayout(board: Board, config: BoardConfig, rng: SeededRNG): void {
  const centerQ = config.width / 2;
  const centerR = config.height / 2;
  
  Array.from(board.tiles.values()).forEach(tile => {
    const distFromCenter = Math.sqrt(
      Math.pow(tile.pos.q - centerQ, 2) + Math.pow(tile.pos.r - centerR, 2)
    );
    
    // Height increases with distance from center path
    tile.height = Math.floor(distFromCenter / 3);
    
    // Rocks as cover on slopes
    if (tile.height > 2 && rng.check(0.3)) {
      tile.cover = rng.check(0.5) ? 'low' : 'high';
    }
  });
}

/**
 * Create ruined structures
 */
function createRuinLayout(board: Board, config: BoardConfig, rng: SeededRNG): void {
  const numStructures = rng.nextInt(3, 6);
  
  for (let i = 0; i < numStructures; i++) {
    const centerQ = rng.nextInt(2, config.width - 2);
    const centerR = rng.nextInt(2, config.height - 2);
    const center: AxialCoord = { q: centerQ, r: centerR };
    
    // Create structure (2-3 hex radius)
    const radius = rng.nextInt(2, 3);
    const structureTiles = getBlastArea(center, radius);
    
    structureTiles.forEach(pos => {
      const key = `${pos.q},${pos.r}`;
      const tile = board.tiles.get(key);
      if (tile) {
        tile.biome = 'stone';
        tile.height = rng.nextInt(0, 2);
        
        // Walls as high cover
        if (rng.check(0.4)) {
          tile.cover = 'high';
          if (rng.check(0.3)) {
            tile.losBlock = true;
          }
        }
      }
    });
  }
}

/**
 * Create town layout (buildings and streets)
 */
function createTownLayout(board: Board, config: BoardConfig, rng: SeededRNG): void {
  const numBuildings = rng.nextInt(4, 8);
  
  for (let i = 0; i < numBuildings; i++) {
    const centerQ = rng.nextInt(2, config.width - 2);
    const centerR = rng.nextInt(2, config.height - 2);
    const center: AxialCoord = { q: centerQ, r: centerR };
    
    // Create building (1-2 hex radius)
    const radius = rng.nextInt(1, 2);
    const buildingTiles = getBlastArea(center, radius);
    
    buildingTiles.forEach(pos => {
      const key = `${pos.q},${pos.r}`;
      const tile = board.tiles.get(key);
      if (tile) {
        tile.biome = 'stone';
        tile.cover = 'high';
        tile.losBlock = rng.check(0.5);
      }
    });
  }
}

/**
 * Generate elevation across board
 */
function generateElevation(board: Board, config: BoardConfig, rng: SeededRNG): void {
  if (config.elevationVariance < 0.1) return;
  
  Array.from(board.tiles.values()).forEach(tile => {
    if (tile.height === 0 && rng.check(config.elevationVariance)) {
      tile.height = rng.nextInt(1, 3);
    }
  });
}

/**
 * Generate cover
 */
function generateCover(board: Board, config: BoardConfig, rng: SeededRNG): void {
  Array.from(board.tiles.values()).forEach(tile => {
    if (tile.cover === 'none' && rng.check(config.coverDensity)) {
      tile.cover = rng.check(0.7) ? 'low' : 'high';
      
      // High cover may block LOS
      if (tile.cover === 'high' && rng.check(0.4)) {
        tile.losBlock = true;
      }
    }
  });
}

/**
 * Generate hazards
 */
function generateHazards(
  board: Board,
  boardKind: BoardKind,
  config: BoardConfig,
  rng: SeededRNG
): void {
  if (config.hazardChance < 0.01) return;
  
  const hazardType = getHazardForBoardKind(boardKind);
  
  Array.from(board.tiles.values()).forEach(tile => {
    if (tile.hazard === undefined && rng.check(config.hazardChance)) {
      tile.hazard = hazardType;
    }
  });
}

/**
 * Get hazard type for board kind
 */
function getHazardForBoardKind(boardKind: BoardKind): HazardType {
  switch (boardKind) {
    case 'swamp': return 'poison';
    case 'desert': return 'fire';
    case 'underground': return 'pit';
    case 'ruin': return 'caltrops';
    default: return 'fire';
  }
}

/**
 * Generate deployment zones
 */
function generateDeploymentZones(board: Board, config: BoardConfig): void {
  const zoneDepth = 3;
  
  // Side A: Left edge
  for (let r = 0; r < config.height; r++) {
    for (let q = 0; q < zoneDepth; q++) {
      const pos: AxialCoord = { q, r };
      const key = `${q},${r}`;
      const tile = board.tiles.get(key);
      if (tile && tile.movementCost < 999) {
        board.deploymentZones.A.push(pos);
      }
    }
  }
  
  // Side B: Right edge
  for (let r = 0; r < config.height; r++) {
    for (let q = config.width - zoneDepth; q < config.width; q++) {
      const pos: AxialCoord = { q, r };
      const key = `${q},${r}`;
      const tile = board.tiles.get(key);
      if (tile && tile.movementCost < 999) {
        board.deploymentZones.B.push(pos);
      }
    }
  }
}

/**
 * Generate exit hexes (for retreat)
 */
function generateExits(board: Board): void {
  // Exits are at board edges
  const leftEdge: AxialCoord[] = [];
  const rightEdge: AxialCoord[] = [];
  
  Array.from(board.tiles.values()).forEach(tile => {
    if (tile.pos.q === 0) {
      leftEdge.push(tile.pos);
    }
    if (tile.pos.q === board.width - 1) {
      rightEdge.push(tile.pos);
    }
  });
  
  board.exits = [...leftEdge, ...rightEdge];
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Hash string to number for RNG seed
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}
