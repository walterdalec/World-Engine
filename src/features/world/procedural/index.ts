/**
 * Procedural Generation Feature Exports
 * TODO #11 — Overworld Procedural Generation (API Export v2.1 - Oct 8, 2025)
 * 
 * Clean public API for the procedural world generation system.
 * 
 * Production Ready: ✅ Full 64×64 chunk system with deterministic generation
 * Performance: ✅ 6-tier world size system with automatic hardware detection
 * Quality: ✅ 150 passing tests covering all generation patterns
 * Integration: ✅ Compatible with v32 tactical AI and battle systems
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

// World size configuration system
export {
    WORLD_SIZE_CONFIGS,
    type WorldSizeConfig,
    detectRecommendedWorldSize,
    getWorldSizeConfig,
    getWorldSizeOptions,
    validateWorldSizeForSystem,
    calculateWorldCoverage
} from './worldSizes'; export { WorldSizeSelection } from './WorldSizeSelection';

// Demo component for testing world size system
export { WorldSizeDemo } from './WorldSizeDemo';

// Utilities
export {
    chunkToWorld,
    worldToChunk,
    validateChunkDeterminism,
    benchmarkGeneration
} from './chunk';

// Dev tools
export { default as ProceduralDevTools } from './ProceduralDevTools';