/**
 * Procedural Generation Feature Exports
 * TODO #11 — Overworld Procedural Generation
 * 
 * Clean public API for the procedural world generation system.
 */

// Core generation functions
export { generateChunk, getChunkTile, getChunkBiome, sampleChunkArea } from './chunk';
export type { Chunk, ChunkId, ChunkMeta, POI, RiverSegment, GenerationSettings } from './chunk';

// RNG system
export { splitmix32, chunkRng, childRng, weightedPick, initGlobalRng, getGlobalRng } from './rng';
export type { SeededRng } from './rng';

// Noise generation
export {
    heightNoise,
    moistureNoise,
    temperatureNoise,
    domainWarp,
    layeredNoise,
    ridgedNoise
} from './noise';

// Biome classification
export { chooseTile, getEnvironmentalEffects, BIOME_RULES } from './biome';
export type { Tile, BiomeRule, EnvironmentalEffects } from './biome';

// Caching system
export { ChunkCache, globalChunkCache } from './cache';
export type { CacheStats, CacheConfig } from './cache';

// World management
export {
    WorldManager,
    initializeWorld,
    getWorldManager,
    globalWorldManager
} from './manager';
export type {
    WorldConfig,
    PlayerPosition,
    WorldBounds,
    RegionalData
} from './manager';

// Utilities
export {
    chunkToWorld,
    worldToChunk,
    validateChunkDeterminism,
    benchmarkGeneration
} from './chunk';

// Dev tools
export { default as ProceduralDevTools } from './ProceduralDevTools';