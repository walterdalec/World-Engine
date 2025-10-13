/**
 * Terrain Adapter - Converts existing terrain generator to Pixi v8 ChunkData
 * 
 * Bridges the gap between:
 * - Old system: CPU-generated pixel buffer terrain
 * - New system: GPU-accelerated chunk-based tile rendering
 */

import { ChunkData, Polyline } from './pixi-v8';

export interface BiomeGrid {
  width: number;
  height: number;
  biomes: string[];  // width * height array - biome names
  elevation: number[];  // width * height array
}

export interface TerrainAdapterConfig {
  tileSize: number;
  chunkSizeTiles: number;
}

/**
 * Biome to tile ID mapping.
 * These IDs correspond to your atlas grid positions.
 */
const BIOME_TO_TILE_ID: Record<string, number> = {
  'ocean': 0,
  'deep-ocean': 1,
  'shore': 2,
  'beach': 3,
  'plains': 4,
  'grass': 5,
  'forest': 6,
  'dense-forest': 7,
  'hills': 8,
  'mountains': 9,
  'snow': 10,
  'tundra': 11,
  'desert': 12,
  'swamp': 13,
  'jungle': 14,
  'wasteland': 15,
};

/**
 * Water biomes for coast detection
 */
const WATER_BIOMES = new Set<string>(['ocean', 'deep-ocean']);

/**
 * Converts biome grid data to chunk format for Pixi v8 renderer
 */
export class TerrainAdapter {
  private cfg: TerrainAdapterConfig;

  constructor(cfg: TerrainAdapterConfig) {
    this.cfg = cfg;
  }

  /**
   * Convert a region of the biome grid to ChunkData
   */
  convertToChunk(
    biomeGrid: BiomeGrid,
    chunkX: number,
    chunkY: number,
    rivers?: Polyline[],
    roads?: Polyline[]
  ): ChunkData {
    const { chunkSizeTiles } = this.cfg;
    const startX = chunkX * chunkSizeTiles;
    const startY = chunkY * chunkSizeTiles;

    // Extract chunk region from biome grid
    const w = Math.min(chunkSizeTiles, biomeGrid.width - startX);
    const h = Math.min(chunkSizeTiles, biomeGrid.height - startY);
    const N = w * h;

    const tileIndex = new Uint16Array(N);
    const coastMask = new Uint8Array(N);

    let i = 0;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++, i++) {
        const worldX = startX + x;
        const worldY = startY + y;
        const biomeIndex = worldY * biomeGrid.width + worldX;
        
        if (biomeIndex >= biomeGrid.biomes.length) {
          // Out of bounds - use default
          tileIndex[i] = BIOME_TO_TILE_ID['plains'];
          coastMask[i] = 0;
          continue;
        }

        const biome = biomeGrid.biomes[biomeIndex];
        tileIndex[i] = BIOME_TO_TILE_ID[biome] ?? BIOME_TO_TILE_ID['plains'];
        coastMask[i] = WATER_BIOMES.has(biome) ? 1 : 0;
      }
    }

    return {
      x: chunkX,
      y: chunkY,
      w,
      h,
      tileIndex,
      uvs: new Float32Array(0),  // Let TileMesh use atlasGrid
      coastMask,
      rivers,
      roads,
    };
  }

  /**
   * Generate chunks visible in viewport
   */
  getVisibleChunks(
    viewportX: number,
    viewportY: number,
    viewportWidth: number,
    viewportHeight: number
  ): Array<{ x: number; y: number }> {
    const { chunkSizeTiles, tileSize } = this.cfg;
    const chunkPixelSize = chunkSizeTiles * tileSize;

    const startChunkX = Math.floor(viewportX / chunkPixelSize);
    const startChunkY = Math.floor(viewportY / chunkPixelSize);
    const endChunkX = Math.ceil((viewportX + viewportWidth) / chunkPixelSize);
    const endChunkY = Math.ceil((viewportY + viewportHeight) / chunkPixelSize);

    const chunks: Array<{ x: number; y: number }> = [];
    for (let cy = startChunkY; cy <= endChunkY; cy++) {
      for (let cx = startChunkX; cx <= endChunkX; cx++) {
        chunks.push({ x: cx, y: cy });
      }
    }

    return chunks;
  }

  /**
   * Convert world position to chunk coordinates
   */
  worldToChunk(worldX: number, worldY: number): { chunkX: number; chunkY: number } {
    const { chunkSizeTiles, tileSize } = this.cfg;
    const chunkPixelSize = chunkSizeTiles * tileSize;
    return {
      chunkX: Math.floor(worldX / chunkPixelSize),
      chunkY: Math.floor(worldY / chunkPixelSize),
    };
  }
}
