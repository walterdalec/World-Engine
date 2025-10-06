// packages/core/src/terrain/index.ts

// Core types and interfaces
export type {
    TerrainKind,
    HexTerrain,
    TerrainCell
} from './types';

// Terrain registry and defaults
export { DEFAULT_TERRAIN, clampCost } from './registry';

// Terrain map system
export { TerrainMap } from './map';

// Movement and pathfinding functions
export { makeCostFn, makePassableFn } from './costFns';

// Line of sight functions
export { makeLOSFn, losWithElevation } from './los.blockers';

// Tiled map parser
export type { TiledMap, TilesetIndex } from './tiled';
export { tilesetIndex, parseTiledToTerrain } from './tiled';