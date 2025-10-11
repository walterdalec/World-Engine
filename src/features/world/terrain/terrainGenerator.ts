/**
 * Terrain Sampling for Smooth Overworld
 * 
 * Samples terrain properties (height, moisture, biome) at any world position
 * using noise functions for deterministic procedural generation.
 */

import { WorldPos, OverworldSample, Biome } from '../../../core/types';
import { ValueNoise2D } from '../../../proc/noise';

/**
 * Terrain generator with cached noise instances
 */
export class TerrainGenerator {
    private heightNoise: ValueNoise2D;
    private moistureNoise: ValueNoise2D;
    private detailNoise: ValueNoise2D;

    constructor(seed: string) {
        console.log('🌍 Initializing terrain generator with seed:', seed);
        this.heightNoise = new ValueNoise2D(seed + '-height');
        this.moistureNoise = new ValueNoise2D(seed + '-moisture');
        this.detailNoise = new ValueNoise2D(seed + '-detail');
    }

    /**
     * Sample terrain at a world position
     * 
     * @param pos - World position to sample
     * @returns Terrain data including height, moisture, and biome
     */
    sample(pos: WorldPos): OverworldSample {
        // Scale factor for noise (lower = larger features)
        const heightScale = 0.01;
        const moistureScale = 0.015;
        const detailScale = 0.05;

        // Sample multiple octaves of noise for terrain height
        const elevation = this.fbm(
            pos.x * heightScale,
            pos.y * heightScale,
            this.heightNoise,
            4, // octaves
            2.0, // lacunarity
            0.5  // persistence
        );

        // Sample moisture with different frequency
        const moisture = this.fbm(
            pos.x * moistureScale,
            pos.y * moistureScale,
            this.moistureNoise,
            3,
            2.0,
            0.5
        );

        // Add detail noise for local variation
        const detail = this.detailNoise.noise(pos.x * detailScale, pos.y * detailScale);

        // Normalize height to -1..1 range
        const height = Math.max(-1, Math.min(1, elevation + detail * 0.1));

        // Normalize moisture to 0..1 range
        const moistureNorm = (moisture + 1) * 0.5;

        // Determine biome from height and moisture
        const biome = this.determineBiome(height, moistureNorm);

        // Determine if blocked (deep water or steep mountains)
        const blocked = this.isBlocked(height, biome);

        return {
            pos,
            height,
            moisture: moistureNorm,
            biome,
            blocked
        };
    }

    /**
     * Fractal Brownian Motion - layered noise for natural terrain
     */
    private fbm(
        x: number,
        y: number,
        noise: ValueNoise2D,
        octaves: number,
        lacunarity: number,
        persistence: number
    ): number {
        let total = 0;
        let amplitude = 1;
        let frequency = 1;
        let maxValue = 0;

        for (let i = 0; i < octaves; i++) {
            total += noise.noise(x * frequency, y * frequency) * amplitude;
            maxValue += amplitude;
            amplitude *= persistence;
            frequency *= lacunarity;
        }

        return total / maxValue;
    }

    /**
     * Determine biome based on elevation and moisture
     * 
     * Elevation ranges:
     * - < -0.4: Deep water
     * - -0.4 to -0.1: Shore
     * - -0.1 to 0.3: Plains/Forest/Swamp (by moisture)
     * - 0.3 to 0.6: Hills
     * - 0.6 to 0.8: Mountains
     * - > 0.8: Snow peaks
     */
    private determineBiome(height: number, moisture: number): Biome {
        // Deep water
        if (height < -0.4) {
            return 'water';
        }

        // Shallow water / shore
        if (height < -0.1) {
            return 'shore';
        }

        // Snow peaks
        if (height > 0.8) {
            return 'snow';
        }

        // Mountains
        if (height > 0.6) {
            return 'mountains';
        }

        // Hills
        if (height > 0.3) {
            return 'hills';
        }

        // Low elevation - determine by moisture
        if (moisture < 0.2) {
            return 'desert';
        }

        if (moisture < 0.4) {
            return 'plains';
        }

        if (moisture < 0.7) {
            return 'forest';
        }

        return 'swamp';
    }

    /**
     * Check if terrain is impassable
     */
    private isBlocked(height: number, biome: Biome): boolean {
        // Deep water is blocked
        if (biome === 'water') {
            return true;
        }

        // Very high mountains are blocked
        if (height > 0.85) {
            return true;
        }

        return false;
    }
}

/**
 * Global terrain generator instance
 * Should be initialized with campaign seed
 */
let globalTerrainGenerator: TerrainGenerator | null = null;

/**
 * Initialize terrain generator with a seed
 */
export function initTerrainGenerator(seed: string): void {
    globalTerrainGenerator = new TerrainGenerator(seed);
}

/**
 * Sample overworld terrain at a position
 * Must call initTerrainGenerator() first
 */
export function sampleOverworld(pos: WorldPos): OverworldSample {
    if (!globalTerrainGenerator) {
        console.warn('⚠️ Terrain generator not initialized, using default seed');
        globalTerrainGenerator = new TerrainGenerator('default-world');
    }

    return globalTerrainGenerator.sample(pos);
}

/**
 * Get the current terrain generator instance
 */
export function getTerrainGenerator(): TerrainGenerator | null {
    return globalTerrainGenerator;
}
