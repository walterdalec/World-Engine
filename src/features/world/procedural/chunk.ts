/**
 * Chunk-based World Generation System
 * TODO #11 — Overworld Procedural Generation
 * 
 * Manages procedural generation of world chunks with caching,
 * deterministic generation, and performance optimization.
 */

import type { SeededRng } from './rng';
import { chunkRng } from './rng';
import { heightNoise, moistureNoise, temperatureNoise, domainWarp } from './noise';
import { chooseTile, type Tile, type BiomeRule, type EnvironmentalEffects, getEnvironmentalEffects } from './biome';

export interface ChunkId {
    cx: number;  // Chunk X coordinate
    cy: number;  // Chunk Y coordinate
}

export interface ChunkMeta {
    averageHeight: number;
    averageTemperature: number;
    averageMoisture: number;
    dominantBiome: string;
    rivers: RiverSegment[];
    pois: POI[];
    discovered: boolean;
    lastGenTime: number; // Performance tracking
}

export interface RiverSegment {
    x: number;
    y: number;
    width: number;
    flow: number;
}

export interface POI {
    id: string;
    kind: 'town' | 'ruin' | 'mine' | 'crystal' | 'shrine' | 'tower';
    x: number;
    y: number;
    seed: number;
    discovered: boolean;
    name?: string;
}

export interface Chunk {
    id: ChunkId;
    tiles: Uint8Array;      // Packed tile data
    biomes: Uint8Array;     // Biome ID per tile
    width: number;
    height: number;
    meta: ChunkMeta;
    generated: boolean;
    hash: string;           // For determinism verification
}

export interface GenerationSettings {
    chunkSize: number;      // Tiles per chunk edge (32, 64, etc)
    seaLevel: number;       // Height threshold for water
    warpStrength: number;   // Domain warping intensity
    temperatureBase: number; // Base temperature offset
    moistureBase: number;   // Base moisture offset
    poiDensity: number;     // POIs per chunk (average)
    riverDensity: number;   // River spawn probability
}

const DEFAULT_SETTINGS: GenerationSettings = {
    chunkSize: 64,
    seaLevel: 0.0,
    warpStrength: 20.0,
    temperatureBase: 0.0,
    moistureBase: 0.0,
    poiDensity: 0.5,
    riverDensity: 0.1
};

/**
 * Tile type encoding for compact storage
 */
const TILE_ENCODING: Record<Tile, number> = {
    water: 0, shallows: 1, sand: 2, grass: 3, forest: 4, rock: 5,
    snow: 6, swamp: 7, desert: 8, tundra: 9, road: 10, town: 11,
    ruin: 12, shrine: 13, mine: 14, crystal: 15
};

const TILE_DECODING: Tile[] = Object.keys(TILE_ENCODING) as Tile[];

/**
 * Biome encoding (limited to 255 biomes)
 */
const BIOME_IDS = [
    'deep_ocean', 'shallow_ocean', 'beach', 'plains', 'steppe',
    'temperate_forest', 'boreal_forest', 'swamp', 'hot_desert',
    'cold_desert', 'foothills', 'mountains', 'peaks', 'tundra'
];

function encodeTile(tile: Tile): number {
    return TILE_ENCODING[tile] || 0;
}

function decodeTile(encoded: number): Tile {
    return TILE_DECODING[encoded] || 'water';
}

function encodeBiome(biomeId: string): number {
    const index = BIOME_IDS.indexOf(biomeId);
    return index >= 0 ? index : 0;
}

function decodeBiome(encoded: number): string {
    return BIOME_IDS[encoded] || 'deep_ocean';
}

/**
 * Generate a single chunk with deterministic results
 */
export function generateChunk(
    globalSeed: number,
    chunkId: ChunkId,
    settings: Partial<GenerationSettings> = {}
): Chunk {
    const startTime = performance.now();
    const cfg = { ...DEFAULT_SETTINGS, ...settings };
    const rng = chunkRng(globalSeed, chunkId.cx, chunkId.cy);

    const { cx, cy } = chunkId;
    const size = cfg.chunkSize;
    const tiles = new Uint8Array(size * size);
    const biomes = new Uint8Array(size * size);

    // Track statistics for meta
    let totalHeight = 0;
    let totalTemp = 0;
    let totalMoisture = 0;
    const biomeCount = new Map<string, number>();

    // Generate base terrain
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const worldX = cx * size + x;
            const worldY = cy * size + y;

            // Apply domain warping for more interesting terrain
            const warped = domainWarp(worldX, worldY, cfg.warpStrength, globalSeed);

            // Sample environmental values
            const height = heightNoise(warped.x, warped.y, globalSeed);
            const temperature = temperatureNoise(warped.x, warped.y, globalSeed) + cfg.temperatureBase;
            const moisture = moistureNoise(warped.x, warped.y, globalSeed) + cfg.moistureBase;

            // Choose tile and biome
            const result = chooseTile(height, temperature, moisture, rng);

            // Store in arrays
            const index = y * size + x;
            tiles[index] = encodeTile(result.tile);
            biomes[index] = encodeBiome(result.biome.id);

            // Update statistics
            totalHeight += height;
            totalTemp += temperature;
            totalMoisture += moisture;
            biomeCount.set(result.biome.id, (biomeCount.get(result.biome.id) || 0) + 1);
        }
    }

    // Calculate averages
    const tileCount = size * size;
    const averageHeight = totalHeight / tileCount;
    const averageTemperature = totalTemp / tileCount;
    const averageMoisture = totalMoisture / tileCount;

    // Find dominant biome
    let dominantBiome = 'plains';
    let maxCount = 0;
    biomeCount.forEach((count, biomeId) => {
        if (count > maxCount) {
            maxCount = count;
            dominantBiome = biomeId;
        }
    });

    // Generate rivers (placeholder)
    const rivers: RiverSegment[] = [];
    if (rng.next() < cfg.riverDensity) {
        rivers.push({
            x: rng.range(0, size - 1),
            y: rng.range(0, size - 1),
            width: rng.range(1, 3),
            flow: rng.next()
        });
    }

    // Generate POIs
    const pois: POI[] = [];
    const poiCount = Math.floor(cfg.poiDensity + rng.next());
    for (let i = 0; i < poiCount; i++) {
        const poiTypes: POI['kind'][] = ['town', 'ruin', 'mine', 'crystal', 'shrine', 'tower'];
        pois.push({
            id: `poi_${cx}_${cy}_${i}`,
            kind: rng.pick(poiTypes),
            x: rng.range(0, size - 1),
            y: rng.range(0, size - 1),
            seed: rng.range(0, 1000000),
            discovered: false
        });
    }

    const genTime = performance.now() - startTime;

    // Create chunk hash for determinism verification
    const hash = createChunkHash(tiles, biomes);

    const meta: ChunkMeta = {
        averageHeight,
        averageTemperature,
        averageMoisture,
        dominantBiome,
        rivers,
        pois,
        discovered: false,
        lastGenTime: genTime
    };

    return {
        id: chunkId,
        tiles,
        biomes,
        width: size,
        height: size,
        meta,
        generated: true,
        hash
    };
}

/**
 * Create a deterministic hash of chunk contents
 */
function createChunkHash(tiles: Uint8Array, biomes: Uint8Array): string {
    let hash = 0;
    for (let i = 0; i < tiles.length; i++) {
        hash = ((hash << 5) - hash + tiles[i]) & 0xffffffff;
        hash = ((hash << 5) - hash + biomes[i]) & 0xffffffff;
    }
    return hash.toString(16);
}

/**
 * Get tile at specific coordinates within a chunk
 */
export function getChunkTile(chunk: Chunk, x: number, y: number): Tile | null {
    if (x < 0 || x >= chunk.width || y < 0 || y >= chunk.height) {
        return null;
    }

    const index = y * chunk.width + x;
    return decodeTile(chunk.tiles[index]);
}

/**
 * Get biome at specific coordinates within a chunk
 */
export function getChunkBiome(chunk: Chunk, x: number, y: number): string | null {
    if (x < 0 || x >= chunk.width || y < 0 || y >= chunk.height) {
        return null;
    }

    const index = y * chunk.width + x;
    return decodeBiome(chunk.biomes[index]);
}

/**
 * Sample a rectangular area from a chunk for battle transitions
 */
export function sampleChunkArea(
    chunk: Chunk,
    startX: number,
    startY: number,
    width: number,
    height: number
): { tiles: Tile[][], biomes: string[][] } {
    const tiles: Tile[][] = [];
    const biomes: string[][] = [];

    for (let y = 0; y < height; y++) {
        const tileRow: Tile[] = [];
        const biomeRow: string[] = [];

        for (let x = 0; x < width; x++) {
            const sampleX = startX + x;
            const sampleY = startY + y;

            tileRow.push(getChunkTile(chunk, sampleX, sampleY) || 'water');
            biomeRow.push(getChunkBiome(chunk, sampleX, sampleY) || 'deep_ocean');
        }

        tiles.push(tileRow);
        biomes.push(biomeRow);
    }

    return { tiles, biomes };
}

/**
 * Convert chunk coordinates to world coordinates
 */
export function chunkToWorld(chunkId: ChunkId, localX: number, localY: number, chunkSize: number = 64): { x: number, y: number } {
    return {
        x: chunkId.cx * chunkSize + localX,
        y: chunkId.cy * chunkSize + localY
    };
}

/**
 * Convert world coordinates to chunk coordinates
 */
export function worldToChunk(worldX: number, worldY: number, chunkSize: number = 64): { chunkId: ChunkId, localX: number, localY: number } {
    const cx = Math.floor(worldX / chunkSize);
    const cy = Math.floor(worldY / chunkSize);

    return {
        chunkId: { cx, cy },
        localX: worldX - cx * chunkSize,
        localY: worldY - cy * chunkSize
    };
}

/**
 * Validate chunk determinism by regenerating and comparing
 */
export function validateChunkDeterminism(
    globalSeed: number,
    chunkId: ChunkId,
    settings?: Partial<GenerationSettings>
): boolean {
    const chunk1 = generateChunk(globalSeed, chunkId, settings);
    const chunk2 = generateChunk(globalSeed, chunkId, settings);

    return chunk1.hash === chunk2.hash;
}

/**
 * Performance benchmark for chunk generation
 */
export function benchmarkGeneration(
    globalSeed: number,
    chunkCount: number = 10,
    settings?: Partial<GenerationSettings>
): { averageTime: number, minTime: number, maxTime: number, totalTime: number } {
    const times: number[] = [];

    for (let i = 0; i < chunkCount; i++) {
        const chunkId: ChunkId = { cx: i % 10, cy: Math.floor(i / 10) };
        const chunk = generateChunk(globalSeed, chunkId, settings);
        times.push(chunk.meta.lastGenTime);
    }

    const totalTime = times.reduce((sum, time) => sum + time, 0);
    const averageTime = totalTime / times.length;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);

    return { averageTime, minTime, maxTime, totalTime };
}