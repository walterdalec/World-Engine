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
    private ridgeNoise: ValueNoise2D;  // For mountain ranges
    private lakeNoise: ValueNoise2D;   // For lake placement
    private riverNoise: ValueNoise2D;  // For river paths

    constructor(seed: string) {
        console.log('🌍 Initializing terrain generator with seed:', seed);
        this.heightNoise = new ValueNoise2D(seed + '-height');
        this.moistureNoise = new ValueNoise2D(seed + '-moisture');
        this.detailNoise = new ValueNoise2D(seed + '-detail');
        this.ridgeNoise = new ValueNoise2D(seed + '-ridges');
        this.lakeNoise = new ValueNoise2D(seed + '-lakes');
        this.riverNoise = new ValueNoise2D(seed + '-rivers');
    }

    /**
     * Sample terrain at a world position
     * 
     * @param pos - World position to sample
     * @returns Terrain data including height, moisture, and biome
     */
    sample(pos: WorldPos): OverworldSample {
        // Scale factors for different features
        const heightScale = 0.01;      // Base terrain (continents)
        const moistureScale = 0.015;   // Moisture zones
        const detailScale = 0.05;      // Local variation
        const ridgeScale = 0.008;      // Mountain ranges (large features)
        const lakeScale = 0.03;        // Lake placement
        const riverScale = 0.02;       // River paths

        // Base terrain elevation (smooth continents)
        const elevation = this.fbm(
            pos.x * heightScale,
            pos.y * heightScale,
            this.heightNoise,
            4, // octaves
            2.0, // lacunarity
            0.5  // persistence
        );

        // Mountain ridges (inverted absolute value for sharp peaks)
        const ridgeRaw = this.ridgeNoise.noise(pos.x * ridgeScale, pos.y * ridgeScale);
        const ridgeValue = 1.0 - Math.abs(ridgeRaw * 2.0 - 1.0); // Sharp ridges
        const ridgeContribution = Math.pow(ridgeValue, 2) * 0.6; // Only add where ridge is strong

        // Lake detection (negative depressions in land)
        const lakeValue = this.lakeNoise.noise(pos.x * lakeScale, pos.y * lakeScale);
        const isLakePotential = lakeValue < -0.6 && elevation > 0; // Only on land

        // River detection (narrow meandering paths)
        const riverValue = this.riverNoise.noise(pos.x * riverScale, pos.y * riverScale);
        const riverStrength = Math.abs(riverValue);
        const isRiverPotential = riverStrength < 0.15 && elevation > 0.1; // Thin rivers from high to low

        // Combine terrain features
        let finalHeight = elevation;

        // Add mountain ridges where base elevation is already high
        if (elevation > 0.2) {
            finalHeight += ridgeContribution * (elevation - 0.2); // Stronger ridges at higher base
        }

        // Carve out lakes (lower terrain in lake zones)
        if (isLakePotential) {
            finalHeight = Math.min(finalHeight, -0.3); // Lake surface level
        }

        // Carve rivers (slight depression)
        if (isRiverPotential && !isLakePotential) {
            finalHeight -= 0.15; // River valley
        }

        // Add detail noise for texture
        const detail = this.detailNoise.noise(pos.x * detailScale, pos.y * detailScale);
        finalHeight += detail * 0.08;

        // Normalize height to -1..1 range
        const height = Math.max(-1, Math.min(1, finalHeight));

        // Sample moisture with different frequency
        const moisture = this.fbm(
            pos.x * moistureScale,
            pos.y * moistureScale,
            this.moistureNoise,
            3,
            2.0,
            0.5
        );

        // Normalize moisture to 0..1 range, increase near rivers
        let moistureNorm = (moisture + 1) * 0.5;
        if (isRiverPotential) {
            moistureNorm = Math.min(1.0, moistureNorm + 0.3); // Rivers increase moisture
        }

        // Determine biome from height and moisture
        const biome = this.determineBiome(height, moistureNorm, isLakePotential);

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
     * Elevation ranges (adjusted for better land distribution):
     * - < -0.6: Deep water (ocean)
     * - -0.6 to -0.2: Shore
     * - -0.2 to 0.3: Plains/Forest/Swamp (by moisture)
     * - 0.3 to 0.6: Hills
     * - 0.6 to 0.8: Mountains
     * - > 0.8: Snow peaks
     * 
     * Special cases:
     * - Lakes: Inland water bodies
     */
    private determineBiome(height: number, moisture: number, isLake: boolean = false): Biome {
        // Lakes (inland water)
        if (isLake) {
            return 'water';
        }

        // Deep ocean water
        if (height < -0.6) {
            return 'water';
        }

        // Shallow water / shore
        if (height < -0.2) {
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
