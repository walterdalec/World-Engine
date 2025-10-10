/**
 * World Grid Generator
 * Canvas 04 - Fixed-size world generation
 * Canvas 05 - Beautiful terrain with biome painting
 */

import type { WorldGrid, WorldGridConfig, Chunk, Tile } from './types';
import { generateTerrain } from './terrain';

/**
 * Generate a complete fixed-size world grid
 */
export function generateWorld(seed: number, config: WorldGridConfig): WorldGrid {
    const startTime = performance.now();

    console.log(`🌍 Generating ${config.worldWidth}×${config.worldHeight} world (seed: ${seed})`);

    const chunks = new Map<string, Chunk>();
    const chunkSize = config.chunkSize;

    // Calculate chunk dimensions
    const chunksX = Math.ceil(config.worldWidth / chunkSize);
    const chunksY = Math.ceil(config.worldHeight / chunkSize);

    console.log(`📦 Creating ${chunksX}×${chunksY} chunks (${chunksX * chunksY} total)`);

    // Generate all chunks
    for (let cy = 0; cy < chunksY; cy++) {
        for (let cx = 0; cx < chunksX; cx++) {
            const chunk = generateChunk(seed, cx, cy, chunkSize, config);
            chunks.set(chunk.key, chunk);
        }
    }

    const duration = performance.now() - startTime;
    const tileCount = chunks.size * chunkSize * chunkSize;

    console.log(`✅ World generated in ${duration.toFixed(2)}ms (${tileCount.toLocaleString()} tiles)`);

    return {
        config,
        seed,
        chunks,
        generatedAt: Date.now()
    };
}

/**
 * Generate a single chunk
 */
function generateChunk(
    worldSeed: number,
    chunkX: number,
    chunkY: number,
    chunkSize: number,
    config: WorldGridConfig
): Chunk {
    const tiles = new Map<string, Tile>();

    const startX = chunkX * chunkSize;
    const startY = chunkY * chunkSize;

    for (let dy = 0; dy < chunkSize; dy++) {
        for (let dx = 0; dx < chunkSize; dx++) {
            const x = startX + dx;
            const y = startY + dy;

            // Skip tiles outside world bounds
            if (x >= config.worldWidth || y >= config.worldHeight) {
                continue;
            }

            // Generate beautiful terrain with biomes (Canvas 05)
            const terrain = generateTerrain(
                x,
                y,
                config.worldWidth,
                config.worldHeight,
                worldSeed
            );

            const tile: Tile = {
                x,
                y,
                height: terrain.elevation,        // Alias for compatibility
                elevation: terrain.elevation,
                moisture: terrain.moisture,
                temperature: terrain.temperature,
                biome: terrain.biomeId,           // Main field
                biomeId: terrain.biomeId,         // Alias for clarity
                roughness: terrain.roughness
            };

            tiles.set(`${x},${y}`, tile);
        }
    }

    return {
        key: `${chunkX},${chunkY}`,
        x: chunkX,
        y: chunkY,
        tiles
    };
}

/**
 * Get a tile from the world grid
 */
export function getTile(grid: WorldGrid, x: number, y: number): Tile | undefined {
    const chunkX = Math.floor(x / grid.config.chunkSize);
    const chunkY = Math.floor(y / grid.config.chunkSize);
    const chunkKey = `${chunkX},${chunkY}`;

    const chunk = grid.chunks.get(chunkKey);
    if (!chunk) return undefined;

    return chunk.tiles.get(`${x},${y}`);
}

/**
 * Get a chunk from the world grid
 */
export function getChunk(grid: WorldGrid, chunkX: number, chunkY: number): Chunk | undefined {
    return grid.chunks.get(`${chunkX},${chunkY}`);
}

/**
 * Get world generation stats
 */
export function getWorldStats(grid: WorldGrid) {
    let totalTiles = 0;
    grid.chunks.forEach(chunk => {
        totalTiles += chunk.tiles.size;
    });

    return {
        chunks: grid.chunks.size,
        tiles: totalTiles,
        seed: grid.seed,
        worldSize: `${grid.config.worldWidth}×${grid.config.worldHeight}`,
        chunkSize: grid.config.chunkSize,
        generatedAt: new Date(grid.generatedAt).toLocaleString()
    };
}
