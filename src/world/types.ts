/**
 * World Grid Types
 * Canvas 04 - Fixed world grid system
 */

/**
 * A single tile in the world
 */
export interface Tile {
    x: number;
    y: number;
    height: number;        // Elevation (0-1) - alias for 'elevation'
    elevation: number;     // Elevation (0-1)
    moisture: number;      // Moisture level (0-1)
    temperature: number;   // Temperature (0-1)
    biome?: string;        // Biome ID
    biomeId?: string;      // Biome ID (alias for 'biome')
    roughness?: number;    // Terrain roughness for road cost (0-1)
}

/**
 * A chunk of tiles (64x64)
 */
export interface Chunk {
    key: string;           // "x,y" format
    x: number;             // Chunk X coordinate
    y: number;             // Chunk Y coordinate
    tiles: Map<string, Tile>;  // Map of "x,y" -> Tile
}

/**
 * World grid configuration
 */
export interface WorldGridConfig {
    worldWidth: number;    // World width in tiles
    worldHeight: number;   // World height in tiles
    chunkSize: number;     // Tiles per chunk side (default 64)
}

/**
 * World grid data
 */
export interface WorldGrid {
    config: WorldGridConfig;
    seed: number;
    chunks: Map<string, Chunk>;
    generatedAt: number;   // Timestamp
}
