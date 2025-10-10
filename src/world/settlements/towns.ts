/**
 * Town Placement
 * Canvas 07 - Towns along roads and near resources
 */

import type { TileData } from '../roads/types';
import type { Settlement, PlacementKnobs } from './types';
import { calculateSuitability } from './suitability';

/**
 * Generate towns near capitals and along major routes.
 * Simplified implementation - full road-based spacing to be added with Canvas 06 integration.
 */
export function generateTowns(
    worldWidth: number,
    worldHeight: number,
    getTile: (_x: number, _y: number) => TileData | undefined,
    capitals: Settlement[],
    knobs: PlacementKnobs,
    rng: { nextFloat: () => number; nextInt: (_min: number, _max: number) => number }
): Settlement[] {
    console.log('🏘️ Generating towns...');

    const towns: Settlement[] = [];
    const allSettlements = [...capitals];

    // Generate towns in rings around capitals
    for (const capital of capitals) {
        const townsPerCapital = Math.floor(knobs.targetTowns / capitals.length);

        for (let i = 0; i < townsPerCapital && towns.length < knobs.targetTowns; i++) {
            const town = placeTownNearCapital(
                capital,
                allSettlements,
                worldWidth,
                worldHeight,
                getTile,
                knobs,
                rng
            );

            if (town) {
                towns.push(town);
                allSettlements.push(town);
            }
        }
    }

    console.log(`✅ Placed ${towns.length} towns`);

    return towns;
}

/**
 * Place a town near a capital with proper spacing.
 */
function placeTownNearCapital(
    capital: Settlement,
    existingSettlements: Settlement[],
    worldWidth: number,
    worldHeight: number,
    getTile: (_x: number, _y: number) => TileData | undefined,
    knobs: PlacementKnobs,
    rng: { nextFloat: () => number; nextInt: (_min: number, _max: number) => number }
): Settlement | null {
    const maxAttempts = 50;
    const minDist = knobs.minSettlementSpacing;
    const maxDist = knobs.townSpacing * 2;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        // Random angle and distance from capital
        const angle = rng.nextFloat() * Math.PI * 2;
        const distance = minDist + rng.nextFloat() * (maxDist - minDist);

        const x = Math.round(capital.pos.x + distance * Math.cos(angle));
        const y = Math.round(capital.pos.y + distance * Math.sin(angle));

        // Check bounds
        if (x < 0 || x >= worldWidth || y < 0 || y >= worldHeight) continue;

        // Check suitability
        const suitability = calculateSuitability(x, y, getTile);
        if (suitability < 0.3) continue;

        // Check distance to existing settlements
        const tooClose = existingSettlements.some(settlement => {
            const dx = settlement.pos.x - x;
            const dy = settlement.pos.y - y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            return dist < minDist;
        });

        if (tooClose) continue;

        // Valid location found
        const tile = getTile(x, y);
        const harbor = checkRiverOrCoast(x, y, getTile);
        const marketTier = determineMarketTier(suitability, harbor);

        return {
            id: `town_${x}_${y}`,
            kind: 'town',
            pos: { x, y },
            name: generateTownName(tile?.biomeId || 'grassland', rng),
            harbor,
            marketTier,
            population: Math.floor(500 + rng.nextInt(0, 2000))
        };
    }

    return null;
}

/**
 * Check if location has river or coastal access.
 */
function checkRiverOrCoast(
    x: number,
    y: number,
    getTile: (_x: number, _y: number) => TileData | undefined
): boolean {
    const tile = getTile(x, y);
    if (!tile) return false;

    if (tile.river) return true;

    // Check nearby for coast
    for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
            const neighbor = getTile(x + dx, y + dy);
            if (neighbor && neighbor.biomeId === 'ocean') {
                return true;
            }
        }
    }

    return false;
}

/**
 * Determine market tier based on location quality.
 */
function determineMarketTier(suitability: number, harbor: boolean): 1 | 2 | 3 {
    let score = suitability;
    if (harbor) score += 0.2;

    if (score >= 0.7) return 3;
    if (score >= 0.5) return 2;
    return 1;
}

/**
 * Generate town name.
 */
function generateTownName(
    biome: string,
    rng: { nextInt: (_min: number, _max: number) => number }
): string {
    const prefixes: Record<string, string[]> = {
        'grassland': ['Meadow', 'Green', 'Vale', 'Hill', 'Brook'],
        'forest': ['Oak', 'Pine', 'Cedar', 'Ash', 'Elm'],
        'mountain': ['Stone', 'Peak', 'Ridge', 'Crag', 'Summit'],
        'desert': ['Sand', 'Dune', 'Oasis', 'Sun', 'Dry'],
        'swamp': ['Mire', 'Bog', 'Fen', 'Marsh', 'Murk'],
        'taiga': ['Frost', 'Snow', 'Ice', 'Pine', 'Cold']
    };

    const suffixes = ['ton', 'ville', 'ham', 'bury', 'field', 'wood', 'mill', 'bridge', 'ford'];

    const biomePrefixes = prefixes[biome] || prefixes['grassland'];
    const prefix = biomePrefixes[rng.nextInt(0, biomePrefixes.length - 1)];
    const suffix = suffixes[rng.nextInt(0, suffixes.length - 1)];

    return `${prefix}${suffix}`;
}
