/**
 * Chunk Manager for Lazy World Generation
 * 
 * Manages world generation in chunks to support:
 * - Memory-efficient streaming
 * - Proximity-based generation
 * - Smooth performance during exploration
 */

import { WorldNoise } from './noise';

export const CHUNK_SIZE = 32;

export interface Tile {
  x: number;
  y: number;
  biome: BiomeType;
  elevation: number;
  temperature: number;
  moisture: number;
  river: boolean;
  road: boolean;
  settlement?: Settlement;
  discovered: boolean;
}

export type BiomeType = 
  | 'Ocean' | 'Coast' | 'Grass' | 'Forest' | 'Jungle' 
  | 'Savanna' | 'Desert' | 'Taiga' | 'Tundra' 
  | 'Swamp' | 'Mountain' | 'Snow';

export interface Settlement {
  name: string;
  size: 'village' | 'town' | 'city';
  faction: string;
  population: number;
}

export interface ChunkCoord {
  chunkX: number;
  chunkY: number;
}

export interface WorldChunk {
  coord: ChunkCoord;
  tiles: Map<string, Tile>; // Key: "x,y"
  generated: boolean;
  lastAccessed: number;
}

export interface WorldGenConfig {
  seaLevel: number;
  continentFreq: number;
  featureFreq: number;
  warpStrength: number;
  mapWidth: number;
  mapHeight: number;
}

export class ChunkManager {
  private chunks: Map<string, WorldChunk> = new Map();
  private noise: WorldNoise;
  private config: WorldGenConfig;
  
  constructor(
    public seed: string,
    config: Partial<WorldGenConfig> = {}
  ) {
    this.noise = new WorldNoise(seed);
    this.config = {
      seaLevel: 0.0, // Almost no ocean, everything should be land
      continentFreq: 1/1024,
      featureFreq: 1/128,
      warpStrength: 700,
      mapWidth: 2048,
      mapHeight: 2048,
      ...config
    };
  }
  
  /**
   * Convert world coordinates to chunk coordinates
   */
  worldToChunk(worldX: number, worldY: number): ChunkCoord {
    return {
      chunkX: Math.floor(worldX / CHUNK_SIZE),
      chunkY: Math.floor(worldY / CHUNK_SIZE)
    };
  }
  
  /**
   * Convert chunk coordinates to key string
   */
  chunkKey(chunkX: number, chunkY: number): string {
    return `${chunkX},${chunkY}`;
  }
  
  /**
   * Convert world coordinates to tile key
   */
  tileKey(x: number, y: number): string {
    return `${x},${y}`;
  }
  
  /**
   * Ensure chunks are loaded within radius of center point
   */
  ensureRadius(centerX: number, centerY: number, radius: number): void {
    const centerChunk = this.worldToChunk(centerX, centerY);
    const chunkRadius = Math.ceil(radius / CHUNK_SIZE) + 1;
    
    for (let dx = -chunkRadius; dx <= chunkRadius; dx++) {
      for (let dy = -chunkRadius; dy <= chunkRadius; dy++) {
        const chunkX = centerChunk.chunkX + dx;
        const chunkY = centerChunk.chunkY + dy;
        
        // Check if this chunk is within the actual radius
        const chunkCenterX = chunkX * CHUNK_SIZE + CHUNK_SIZE / 2;
        const chunkCenterY = chunkY * CHUNK_SIZE + CHUNK_SIZE / 2;
        const distance = Math.sqrt(
          Math.pow(chunkCenterX - centerX, 2) + 
          Math.pow(chunkCenterY - centerY, 2)
        );
        
        if (distance <= radius + CHUNK_SIZE) {
          this.ensureChunk(chunkX, chunkY);
        }
      }
    }
  }
  
  /**
   * Ensure a specific chunk is generated and loaded
   */
  ensureChunk(chunkX: number, chunkY: number): WorldChunk {
    const key = this.chunkKey(chunkX, chunkY);
    let chunk = this.chunks.get(key);
    
    if (!chunk) {
      chunk = this.createChunk(chunkX, chunkY);
      this.chunks.set(key, chunk);
    }
    
    if (!chunk.generated) {
      this.generateChunk(chunk);
    }
    
    chunk.lastAccessed = Date.now();
    return chunk;
  }
  
  /**
   * Create empty chunk structure
   */
  private createChunk(chunkX: number, chunkY: number): WorldChunk {
    return {
      coord: { chunkX, chunkY },
      tiles: new Map(),
      generated: false,
      lastAccessed: Date.now()
    };
  }
  
  /**
   * Generate all tiles in a chunk
   */
  private generateChunk(chunk: WorldChunk): void {
    const startX = chunk.coord.chunkX * CHUNK_SIZE;
    const startY = chunk.coord.chunkY * CHUNK_SIZE;
    
    for (let localX = 0; localX < CHUNK_SIZE; localX++) {
      for (let localY = 0; localY < CHUNK_SIZE; localY++) {
        const worldX = startX + localX;
        const worldY = startY + localY;
        
        const tile = this.generateTile(worldX, worldY);
        chunk.tiles.set(this.tileKey(worldX, worldY), tile);
      }
    }
    
    chunk.generated = true;
  }
  
  /**
   * Generate a single tile's properties
   */
  private generateTile(x: number, y: number): Tile {
    // Generate base terrain properties
    const elevation = this.noise.getElevation(
      x, y, 
      this.config.continentFreq, 
      this.config.warpStrength
    );
    
    const temperature = this.noise.getTemperature(
      x, y, 
      elevation, 
      this.config.mapHeight
    );
    
    const moisture = this.noise.getMoisture(x, y, elevation);
    
    // Determine biome based on elevation, temperature, and moisture
    const biome = this.determineBiome(elevation, temperature, moisture);
    
    return {
      x,
      y,
      biome,
      elevation,
      temperature,
      moisture,
      river: false, // Rivers will be generated in a separate pass
      road: false,  // Roads will be generated with settlements
      discovered: false
    };
  }
  
  /**
   * Determine biome based on terrain properties
   */
  private determineBiome(elevation: number, temperature: number, moisture: number): BiomeType {
    const { seaLevel } = this.config;
    
    // Water bodies
    if (elevation < seaLevel - 0.02) return 'Ocean';
    if (elevation < seaLevel + 0.02) return 'Coast';
    
    // High elevation biomes
    if (elevation > 0.7) {
      if (temperature < 0.2) return 'Snow';
      if (temperature < 0.5) return 'Mountain';
      return 'Mountain';
    }
    
    // Temperature-based biomes
    if (temperature < 0.15) {
      return moisture > 0.3 ? 'Tundra' : 'Snow';
    }
    
    if (temperature < 0.35) {
      if (moisture > 0.6) return 'Taiga';
      if (moisture > 0.3) return 'Tundra';
      return 'Tundra';
    }
    
    if (temperature < 0.65) {
      if (moisture > 0.7) return 'Forest';
      if (moisture > 0.4) return 'Grass';
      if (moisture > 0.2) return 'Savanna';
      return 'Desert';
    }
    
    // Hot biomes
    if (moisture > 0.8) return 'Jungle';
    if (moisture > 0.6) return 'Forest';
    if (moisture > 0.4) return 'Savanna';
    if (moisture > 0.2) return 'Grass';
    
    // Very dry areas become swamp if low elevation, desert otherwise
    if (elevation < 0.5 && moisture > 0.6) return 'Swamp';
    return 'Desert';
  }
  
  /**
   * Get a tile at world coordinates (generates chunk if needed)
   */
  getTile(x: number, y: number): Tile | undefined {
    const chunk = this.worldToChunk(x, y);
    const chunkObj = this.ensureChunk(chunk.chunkX, chunk.chunkY);
    return chunkObj.tiles.get(this.tileKey(x, y));
  }
  
  /**
   * Check if a tile exists without generating it
   */
  hasTile(x: number, y: number): boolean {
    const chunk = this.worldToChunk(x, y);
    const key = this.chunkKey(chunk.chunkX, chunk.chunkY);
    const chunkObj = this.chunks.get(key);
    
    return chunkObj?.generated && chunkObj.tiles.has(this.tileKey(x, y)) || false;
  }
  
  /**
   * Unload chunks beyond a certain distance from center
   */
  unloadBeyond(centerX: number, centerY: number, keepRadius: number): number {
    let unloaded = 0;
    const centerChunk = this.worldToChunk(centerX, centerY);
    const keepChunkRadius = Math.ceil(keepRadius / CHUNK_SIZE) + 2;
    const chunksToDelete: string[] = [];
    
    this.chunks.forEach((chunk, key) => {
      const dx = chunk.coord.chunkX - centerChunk.chunkX;
      const dy = chunk.coord.chunkY - centerChunk.chunkY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance > keepChunkRadius) {
        chunksToDelete.push(key);
      }
    });
    
    chunksToDelete.forEach(key => {
      this.chunks.delete(key);
      unloaded++;
    });
    
    return unloaded;
  }
  
  /**
   * Get memory statistics
   */
  getStats(): {
    totalChunks: number;
    generatedChunks: number;
    totalTiles: number;
    memoryEstimateMB: number;
  } {
    let generatedChunks = 0;
    let totalTiles = 0;
    
    this.chunks.forEach(chunk => {
      if (chunk.generated) {
        generatedChunks++;
        totalTiles += chunk.tiles.size;
      }
    });
    
    // Rough memory estimate (each tile ~200 bytes)
    const memoryEstimateMB = (totalTiles * 200) / (1024 * 1024);
    
    return {
      totalChunks: this.chunks.size,
      generatedChunks,
      totalTiles,
      memoryEstimateMB
    };
  }
  
  /**
   * Update world generation config
   */
  updateConfig(newConfig: Partial<WorldGenConfig>): void {
    this.config = { ...this.config, ...newConfig };
    // Note: Existing chunks will need to be regenerated to use new config
    // This could be done by marking them as generated: false
  }
  
  /**
   * Mark chunks as needing regeneration (for config changes)
   */
  invalidateAll(): void {
    this.chunks.forEach(chunk => {
      chunk.generated = false;
      chunk.tiles.clear();
    });
  }
}