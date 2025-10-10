/**
 * Terrain Generation & Biome Painting
 * Canvas 05 - Beautiful, non-stringy biomes with soft transitions
 */

/**
 * Ridged multifractal noise for elevation
 * Creates mountain ridges and valleys
 */
function ridgedMultifractal(
    seed: number,
    x: number,
    y: number,
    octaves: number,
    frequency: number,
    lacunarity: number,
    gain: number
): number {
    let amplitude = 1.0;
    let freq = frequency;
    let result = 0;
    let weight = 1.0;

    for (let i = 0; i < octaves; i++) {
        // Simple hash-based noise (deterministic)
        const nx = x * freq;
        const ny = y * freq;
        const hash = hashNoise(nx, ny, seed + i * 1000);
        
        // Ridged: abs(noise) inverted
        let signal = Math.abs(hash);
        signal = 1.0 - signal;
        signal = signal * signal; // Square for sharper ridges

        // Weight by previous octave
        signal *= weight;
        weight = signal * gain;
        weight = Math.max(0, Math.min(1, weight));

        result += signal * amplitude;
        amplitude *= gain;
        freq *= lacunarity;
    }

    return result;
}

/**
 * Fractional Brownian Motion (FBM) for moisture/temperature
 * Smoother than ridged multifractal
 */
function fbm(
    seed: number,
    x: number,
    y: number,
    octaves: number,
    frequency: number,
    lacunarity: number,
    gain: number
): number {
    let amplitude = 1.0;
    let freq = frequency;
    let result = 0;
    let maxValue = 0;

    for (let i = 0; i < octaves; i++) {
        const nx = x * freq;
        const ny = y * freq;
        const noise = hashNoise(nx, ny, seed + i * 2000);

        result += noise * amplitude;
        maxValue += amplitude;

        amplitude *= gain;
        freq *= lacunarity;
    }

    return result / maxValue; // Normalize to 0-1
}

/**
 * Domain warping - distort coordinates to break up straight lines
 */
function domainWarp(
    seed: number,
    x: number,
    y: number,
    strength: number
): { x: number; y: number } {
    const offsetX = fbm(seed, x * 0.02, y * 0.02, 3, 0.5, 2.0, 0.5) * strength;
    const offsetY = fbm(seed + 5000, x * 0.02 + 100, y * 0.02 + 100, 3, 0.5, 2.0, 0.5) * strength;

    return {
        x: x + offsetX,
        y: y + offsetY
    };
}

/**
 * Simple hash-based noise function
 * Returns value in range [-1, 1]
 */
function hashNoise(x: number, y: number, seed: number): number {
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    const fx = x - ix;
    const fy = y - iy;

    // Hash function (simple but effective)
    const h = (ix * 374761393 + iy * 668265263 + seed) ^ (seed * 1274126177);
    const n = (h * (h * h * 15731 + 789221) + 1376312589) & 0x7fffffff;

    // Interpolate
    const value = (n / 0x7fffffff) * 2 - 1;

    // Smooth interpolation
    const u = fx * fx * (3.0 - 2.0 * fx);
    const v = fy * fy * (3.0 - 2.0 * fy);

    return value * (1 - u) * (1 - v); // Simple bilinear
}

/**
 * Biome lookup table based on temperature and moisture
 */
export const BIOME_TABLE: Record<string, { temp: [number, number]; moisture: [number, number] }> = {
    // Cold biomes (temp 0-0.25)
    'ice': { temp: [0, 0.15], moisture: [0, 1] },
    'tundra': { temp: [0.15, 0.3], moisture: [0, 0.5] },
    'taiga': { temp: [0.15, 0.3], moisture: [0.5, 1] },

    // Temperate biomes (temp 0.3-0.6)
    'grassland': { temp: [0.3, 0.6], moisture: [0.2, 0.5] },
    'forest': { temp: [0.3, 0.6], moisture: [0.5, 0.8] },
    'swamp': { temp: [0.3, 0.6], moisture: [0.8, 1] },
    'shrubland': { temp: [0.3, 0.6], moisture: [0, 0.2] },

    // Warm biomes (temp 0.6-1.0)
    'desert': { temp: [0.6, 1], moisture: [0, 0.3] },
    'savanna': { temp: [0.6, 1], moisture: [0.3, 0.6] },
    'tropical-forest': { temp: [0.6, 1], moisture: [0.6, 1] },

    // Special (elevation-based)
    'mountain': { temp: [0, 1], moisture: [0, 1] }, // High elevation
    'ocean': { temp: [0, 1], moisture: [0, 1] }      // Low elevation (below sea level)
};

/**
 * Get biome ID based on temperature and moisture
 */
export function getBiome(elevation: number, temperature: number, moisture: number): string {
    // Below sea level = ocean
    if (elevation < 0.35) {
        return 'ocean';
    }

    // High elevation = mountain
    if (elevation > 0.75) {
        return 'mountain';
    }

    // Check biome table
    for (const [biomeId, ranges] of Object.entries(BIOME_TABLE)) {
        if (biomeId === 'ocean' || biomeId === 'mountain') continue;

        const [tempMin, tempMax] = ranges.temp;
        const [moistMin, moistMax] = ranges.moisture;

        if (temperature >= tempMin && temperature < tempMax &&
            moisture >= moistMin && moisture < moistMax) {
            return biomeId;
        }
    }

    // Fallback
    return 'grassland';
}

/**
 * Generate terrain data for a tile
 */
export function generateTerrain(
    x: number,
    y: number,
    worldWidth: number,
    worldHeight: number,
    seed: number
): {
    elevation: number;
    moisture: number;
    temperature: number;
    biomeId: string;
    roughness: number;
} {
    // Domain warping to break up straight lines
    const warped = domainWarp(seed, x, y, 50);

    // Elevation via ridged multifractal (creates continents and mountains)
    const baseElevation = ridgedMultifractal(
        seed,
        warped.x * 0.003, // Low frequency for large features
        warped.y * 0.003,
        6, // octaves
        1.0, // frequency
        2.2, // lacunarity (how much frequency increases)
        0.5  // gain (how much amplitude decreases)
    );

    // Add some fbm for variety
    const detailNoise = fbm(seed + 10000, x * 0.01, y * 0.01, 4, 1.0, 2.0, 0.5);
    const elevation = baseElevation * 0.7 + detailNoise * 0.3;

    // Moisture influenced by elevation (lower areas = more moisture)
    const baseMoisture = fbm(
        seed + 20000,
        warped.x * 0.005,
        warped.y * 0.005,
        5,
        1.0,
        2.0,
        0.5
    );
    const elevationInfluence = Math.max(0, 1 - elevation * 0.5);
    const moisture = baseMoisture * 0.6 + elevationInfluence * 0.4;

    // Temperature based on latitude (distance from equator) + elevation
    const latitude = Math.abs(y - worldHeight / 2) / (worldHeight / 2); // 0 at equator, 1 at poles
    const latitudeTemp = 1 - latitude * 0.7; // Warmer at equator

    // Elevation lapse rate (higher = colder)
    const elevationTemp = Math.max(0, 1 - elevation * 0.6);

    // Add some noise for variation
    const tempNoise = fbm(seed + 30000, x * 0.008, y * 0.008, 3, 1.0, 2.0, 0.5);
    const temperature = latitudeTemp * 0.5 + elevationTemp * 0.3 + tempNoise * 0.2;

    // Roughness for road cost calculations
    const roughness = ridgedMultifractal(seed + 40000, x * 0.05, y * 0.05, 3, 1.0, 2.0, 0.5);

    // Get biome
    const biomeId = getBiome(elevation, temperature, moisture);

    return {
        elevation: Math.max(0, Math.min(1, elevation)),
        moisture: Math.max(0, Math.min(1, moisture)),
        temperature: Math.max(0, Math.min(1, temperature)),
        biomeId,
        roughness: Math.max(0, Math.min(1, roughness))
    };
}

/**
 * Biome color mapping for visualization
 */
export const BIOME_COLORS: Record<string, string> = {
    'ocean': '#2563eb',           // Blue
    'ice': '#e0f2fe',             // Light blue
    'tundra': '#94a3b8',          // Gray
    'taiga': '#1e3a2e',           // Dark green
    'grassland': '#84cc16',       // Lime green
    'forest': '#15803d',          // Green
    'swamp': '#404a3a',           // Dark olive
    'shrubland': '#a3a86a',       // Olive
    'desert': '#fbbf24',          // Yellow
    'savanna': '#d4a574',         // Tan
    'tropical-forest': '#166534', // Dark green
    'mountain': '#78716c'         // Gray-brown
};

/**
 * Get color for heatmap visualization
 */
export function getHeatmapColor(value: number, layer: 'elevation' | 'moisture' | 'temperature'): string {
    value = Math.max(0, Math.min(1, value));

    switch (layer) {
        case 'elevation': {
            // Blue (low) -> Green -> Brown -> White (high)
            if (value < 0.35) {
                const t = value / 0.35;
                return interpolateColor('#1e40af', '#3b82f6', t);
            } else if (value < 0.6) {
                const t = (value - 0.35) / 0.25;
                return interpolateColor('#3b82f6', '#22c55e', t);
            } else if (value < 0.8) {
                const t = (value - 0.6) / 0.2;
                return interpolateColor('#22c55e', '#78716c', t);
            } else {
                const t = (value - 0.8) / 0.2;
                return interpolateColor('#78716c', '#f5f5f5', t);
            }
        }
        case 'moisture': {
            // Brown (dry) -> Green (wet)
            return interpolateColor('#d97706', '#10b981', value);
        }
        case 'temperature': {
            // Blue (cold) -> Red (hot)
            if (value < 0.5) {
                return interpolateColor('#1e40af', '#fbbf24', value * 2);
            } else {
                return interpolateColor('#fbbf24', '#dc2626', (value - 0.5) * 2);
            }
        }
    }
}

/**
 * Simple color interpolation
 */
function interpolateColor(color1: string, color2: string, t: number): string {
    const r1 = parseInt(color1.slice(1, 3), 16);
    const g1 = parseInt(color1.slice(3, 5), 16);
    const b1 = parseInt(color1.slice(5, 7), 16);

    const r2 = parseInt(color2.slice(1, 3), 16);
    const g2 = parseInt(color2.slice(3, 5), 16);
    const b2 = parseInt(color2.slice(5, 7), 16);

    const r = Math.round(r1 + (r2 - r1) * t);
    const g = Math.round(g1 + (g2 - g1) * t);
    const b = Math.round(b1 + (b2 - b1) * t);

    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}
