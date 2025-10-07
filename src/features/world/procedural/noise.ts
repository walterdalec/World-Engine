/**
 * Noise Generation for Procedural Worlds
 * TODO #11 — Overworld Procedural Generation
 * 
 * Implements seeded noise functions for height, moisture, and temperature
 * using a simple but effective noise algorithm until FastNoiseLite is integrated.
 */

import type { SeededRng } from './rng';
import { splitmix32 } from './rng';

export interface NoiseConfig {
    seed: number;
    frequency: number;
    amplitude: number;
    octaves: number;
    lacunarity: number;  // Frequency multiplier per octave
    persistence: number; // Amplitude multiplier per octave
}

const DEFAULT_CONFIG: NoiseConfig = {
    seed: 0,
    frequency: 0.01,
    amplitude: 1.0,
    octaves: 4,
    lacunarity: 2.0,
    persistence: 0.5
};

/**
 * Simple 2D noise function using interpolated random values
 * This is a placeholder until FastNoiseLite integration
 */
export function noise2D(x: number, y: number, config: Partial<NoiseConfig> = {}): number {
    const cfg = { ...DEFAULT_CONFIG, ...config };

    let total = 0;
    let maxValue = 0;
    let amplitude = cfg.amplitude;
    let frequency = cfg.frequency;

    for (let i = 0; i < cfg.octaves; i++) {
        total += interpolatedNoise(x * frequency, y * frequency, cfg.seed + i) * amplitude;
        maxValue += amplitude;
        amplitude *= cfg.persistence;
        frequency *= cfg.lacunarity;
    }

    return total / maxValue; // Normalize to [-1, 1]
}

/**
 * Specialized noise functions for different world aspects
 */
export function heightNoise(x: number, y: number, seed: number = 0): number {
    return noise2D(x, y, {
        seed,
        frequency: 0.005,
        octaves: 6,
        lacunarity: 2.0,
        persistence: 0.6
    });
}

export function moistureNoise(x: number, y: number, seed: number = 0): number {
    return noise2D(x, y, {
        seed: seed + 1000,
        frequency: 0.008,
        octaves: 4,
        lacunarity: 2.1,
        persistence: 0.5
    });
}

export function temperatureNoise(x: number, y: number, seed: number = 0): number {
    return noise2D(x, y, {
        seed: seed + 2000,
        frequency: 0.003,
        octaves: 3,
        lacunarity: 2.2,
        persistence: 0.4
    });
}

/**
 * Warp domain for more interesting terrain features
 */
export function domainWarp(x: number, y: number, strength: number, seed: number = 0): { x: number, y: number } {
    const warpX = noise2D(x, y, { seed: seed + 100, frequency: 0.01 }) * strength;
    const warpY = noise2D(x, y, { seed: seed + 200, frequency: 0.01 }) * strength;

    return {
        x: x + warpX,
        y: y + warpY
    };
}

/**
 * Internal noise implementation - bilinear interpolation of random values
 */
function interpolatedNoise(x: number, y: number, seed: number): number {
    const intX = Math.floor(x);
    const intY = Math.floor(y);
    const fracX = x - intX;
    const fracY = y - intY;

    const a = randomNoise(intX, intY, seed);
    const b = randomNoise(intX + 1, intY, seed);
    const c = randomNoise(intX, intY + 1, seed);
    const d = randomNoise(intX + 1, intY + 1, seed);

    const i1 = interpolate(a, b, fracX);
    const i2 = interpolate(c, d, fracX);

    return interpolate(i1, i2, fracY);
}

/**
 * Pseudo-random noise at integer coordinates
 */
function randomNoise(x: number, y: number, seed: number): number {
    // Combine coordinates and seed into a deterministic hash
    let n = Math.imul(x + y * 57, seed + 1);
    n = (n << 13) ^ n;
    n = Math.imul(n, (n * n * 15731 + 789221) + 1376312589);
    return (1.0 - ((n & 0x7fffffff) / 1073741824.0)) * 0.5;
}

/**
 * Smooth interpolation using smoothstep
 */
function interpolate(a: number, b: number, t: number): number {
    // Smoothstep interpolation for better visual results
    const smooth = t * t * (3 - 2 * t);
    return a * (1 - smooth) + b * smooth;
}

/**
 * Ridged noise for mountain ranges and dramatic features
 */
export function ridgedNoise(x: number, y: number, config: Partial<NoiseConfig> = {}): number {
    const raw = noise2D(x, y, config);
    return 1.0 - Math.abs(raw);
}

/**
 * Turbulence for cloud-like patterns
 */
export function turbulence(x: number, y: number, config: Partial<NoiseConfig> = {}): number {
    return Math.abs(noise2D(x, y, config));
}

/**
 * Voronoi-like cellular pattern for special features
 */
export function cellularNoise(x: number, y: number, cellSize: number = 32, seed: number = 0): number {
    const cellX = Math.floor(x / cellSize);
    const cellY = Math.floor(y / cellSize);

    let minDist = Infinity;

    // Check 3x3 neighborhood of cells
    for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
            const checkX = cellX + dx;
            const checkY = cellY + dy;

            // Get random point within this cell
            const rng = splitmix32(seed + checkX * 73856093 + checkY * 19349663);
            const pointX = (checkX + rng.next()) * cellSize;
            const pointY = (checkY + rng.next()) * cellSize;

            const dist = Math.sqrt((x - pointX) ** 2 + (y - pointY) ** 2);
            minDist = Math.min(minDist, dist);
        }
    }

    return Math.min(minDist / cellSize, 1.0);
}

/**
 * Combine multiple noise layers with different characteristics
 */
export interface NoiseLayer {
    weight: number;
    config: Partial<NoiseConfig>;
    type?: 'normal' | 'ridged' | 'turbulence' | 'cellular';
}

export function layeredNoise(x: number, y: number, layers: NoiseLayer[]): number {
    let total = 0;
    let totalWeight = 0;

    for (const layer of layers) {
        let value: number;

        switch (layer.type || 'normal') {
            case 'ridged':
                value = ridgedNoise(x, y, layer.config);
                break;
            case 'turbulence':
                value = turbulence(x, y, layer.config);
                break;
            case 'cellular':
                value = cellularNoise(x, y, 32, layer.config.seed || 0);
                break;
            default:
                value = noise2D(x, y, layer.config);
        }

        total += value * layer.weight;
        totalWeight += layer.weight;
    }

    return totalWeight > 0 ? total / totalWeight : 0;
}