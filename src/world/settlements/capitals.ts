/**
 * Capital City Placement
 * Canvas 07 - Blue-noise (Poisson-disk) sampling for major cities
 */

import type { Vec2, TileData } from '../roads/types';
import type { Settlement, PlacementKnobs } from './types';
import { calculateSuitability, createSettlementMask } from './suitability';

interface CapitalCandidate {
    pos: Vec2;
    score: number;
    harbor: boolean;
}

/**
 * Generate capital cities using Poisson-disk sampling and suitability ranking.
 * 
 * @param worldWidth World width in tiles
 * @param worldHeight World height in tiles
 * @param getTile Tile data accessor
 * @param knobs Placement parameters
 * @param rng Random number generator
 * @returns Array of capital settlements
 */
export function generateCapitals(
    worldWidth: number,
    worldHeight: number,
    getTile: (_x: number, _y: number) => TileData | undefined,
    knobs: PlacementKnobs,
    rng: { nextFloat: () => number; nextInt: (_min: number, _max: number) => number }
): Settlement[] {
    console.log('🏛️ Generating capitals...');

    // Create settlement mask
    const mask = createSettlementMask(
        worldWidth,
        worldHeight,
        getTile,
        knobs.elevMaxForCity,
        knobs.floodRiskMin
    );

    // Poisson-disk sample candidates
    const candidates = poissonDiskSample(
        worldWidth,
        worldHeight,
        mask,
        knobs.capitalRadius,
        rng,
        knobs.targetCapitals * 3 // Sample 3x candidates for ranking
    );

    console.log(`  Generated ${candidates.length} candidate positions`);

    // Score each candidate
    const scoredCandidates: CapitalCandidate[] = [];

    for (const pos of candidates) {
        const score = calculateSuitability(pos.x, pos.y, getTile);

        if (score > 0) {
            const harbor = checkHarborPotential(pos.x, pos.y, getTile);

            scoredCandidates.push({
                pos,
                score,
                harbor
            });
        }
    }

    // Sort by score descending
    scoredCandidates.sort((a, b) => b.score - a.score);

    // Pick top N with minimum separation
    const capitals: Settlement[] = [];
    const minSeparation = knobs.capitalRadius * 1.25;

    for (const candidate of scoredCandidates) {
        if (capitals.length >= knobs.targetCapitals) break;

        // Check distance to existing capitals
        const tooClose = capitals.some(cap => {
            const dx = cap.pos.x - candidate.pos.x;
            const dy = cap.pos.y - candidate.pos.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            return dist < minSeparation;
        });

        if (!tooClose) {
            const tile = getTile(candidate.pos.x, candidate.pos.y);

            capitals.push({
                id: `capital_${capitals.length}`,
                kind: 'capital',
                pos: candidate.pos,
                name: generateCityName(tile?.biomeId || 'grassland', rng),
                harbor: candidate.harbor,
                population: Math.floor(5000 + rng.nextInt(0, 10000))
            });
        }
    }

    console.log(`✅ Placed ${capitals.length} capitals`);

    return capitals;
}

/**
 * Poisson-disk sampling for evenly distributed points.
 * Uses Bridson's algorithm with grid acceleration.
 */
function poissonDiskSample(
    width: number,
    height: number,
    mask: boolean[][],
    radius: number,
    rng: { nextFloat: () => number; nextInt: (_min: number, _max: number) => number },
    maxSamples: number
): Vec2[] {
    const cellSize = radius / Math.sqrt(2);
    const gridWidth = Math.ceil(width / cellSize);
    const gridHeight = Math.ceil(height / cellSize);
    const grid: Array<Vec2 | null> = new Array(gridWidth * gridHeight).fill(null);

    const samples: Vec2[] = [];
    const active: Vec2[] = [];

    // Helper to get grid index
    const gridIndex = (x: number, y: number): number => {
        const gx = Math.floor(x / cellSize);
        const gy = Math.floor(y / cellSize);
        return gy * gridWidth + gx;
    };

    // Start with random valid point
    let startPoint: Vec2 | null = null;
    for (let attempts = 0; attempts < 100; attempts++) {
        const x = rng.nextInt(0, width - 1);
        const y = rng.nextInt(0, height - 1);

        if (mask[y] && mask[y][x]) {
            startPoint = { x, y };
            break;
        }
    }

    if (!startPoint) {
        console.warn('Could not find valid start point for Poisson sampling');
        return [];
    }

    samples.push(startPoint);
    active.push(startPoint);
    grid[gridIndex(startPoint.x, startPoint.y)] = startPoint;

    const k = 30; // Attempts per active point

    while (active.length > 0 && samples.length < maxSamples) {
        const idx = rng.nextInt(0, active.length - 1);
        const point = active[idx];
        let found = false;

        for (let attempt = 0; attempt < k; attempt++) {
            // Generate random point in annulus
            const angle = rng.nextFloat() * Math.PI * 2;
            const r = radius + rng.nextFloat() * radius;
            const newX = Math.round(point.x + r * Math.cos(angle));
            const newY = Math.round(point.y + r * Math.sin(angle));

            // Check bounds and mask
            if (newX < 0 || newX >= width || newY < 0 || newY >= height) continue;
            if (!mask[newY] || !mask[newY][newX]) continue;

            // Check distance to existing samples (grid-accelerated)
            const gx = Math.floor(newX / cellSize);
            const gy = Math.floor(newY / cellSize);
            let valid = true;

            for (let dy = -2; dy <= 2; dy++) {
                for (let dx = -2; dx <= 2; dx++) {
                    const checkX = gx + dx;
                    const checkY = gy + dy;

                    if (checkX < 0 || checkX >= gridWidth || checkY < 0 || checkY >= gridHeight) continue;

                    const existing = grid[checkY * gridWidth + checkX];
                    if (existing) {
                        const dist = Math.sqrt(
                            (existing.x - newX) ** 2 +
                            (existing.y - newY) ** 2
                        );

                        if (dist < radius) {
                            valid = false;
                            break;
                        }
                    }
                }
                if (!valid) break;
            }

            if (valid) {
                const newPoint = { x: newX, y: newY };
                samples.push(newPoint);
                active.push(newPoint);
                grid[gridIndex(newX, newY)] = newPoint;
                found = true;
                break;
            }
        }

        if (!found) {
            // Remove from active list
            active.splice(idx, 1);
        }
    }

    return samples;
}

/**
 * Check if location has harbor potential (coastal or river).
 */
function checkHarborPotential(
    x: number,
    y: number,
    getTile: (_x: number, _y: number) => TileData | undefined
): boolean {
    const tile = getTile(x, y);
    if (!tile) return false;

    // River access
    if (tile.river) return true;

    // Coastal access (adjacent to ocean)
    for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;

            const neighbor = getTile(x + dx, y + dy);
            if (neighbor && neighbor.biomeId === 'ocean') {
                return true;
            }
        }
    }

    return false;
}

/**
 * Generate a city name based on biome.
 */
function generateCityName(
    biome: string,
    rng: { nextInt: (_min: number, _max: number) => number }
): string {
    const prefixes: Record<string, string[]> = {
        'grassland': ['Green', 'Golden', 'Fair', 'Bright', 'Sun', 'Star'],
        'forest': ['Deep', 'Green', 'Oak', 'Elder', 'Wild', 'Moss'],
        'mountain': ['High', 'Stone', 'Peak', 'Iron', 'Silver', 'Crag'],
        'desert': ['Sand', 'Dune', 'Sun', 'Gold', 'Amber', 'Mirage'],
        'swamp': ['Mire', 'Marsh', 'Fen', 'Bog', 'Murk', 'Shadow'],
        'taiga': ['Frost', 'Pine', 'Winter', 'Snow', 'Ice', 'Cold'],
        'savanna': ['Lion', 'Zebra', 'Acacia', 'Dust', 'Sun', 'Plain'],
        'tropical-forest': ['Jade', 'Emerald', 'Vine', 'Orchid', 'Monsoon', 'Rain']
    };

    const suffixes = ['haven', 'hold', 'burg', 'port', 'ford', 'gate', 'fall', 'ridge', 'vale', 'watch', 'crest', 'meer', 'shire', 'dale'];

    const biomePrefixes = prefixes[biome] || prefixes['grassland'];
    const prefix = biomePrefixes[rng.nextInt(0, biomePrefixes.length - 1)];
    const suffix = suffixes[rng.nextInt(0, suffixes.length - 1)];

    return `${prefix}${suffix}`;
}
