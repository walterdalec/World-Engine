// ──────────────────────────────────────────────────────────────────────────────
// File: src/core/config/worldBounds.ts
// Purpose: World boundary configuration for the "Colossal Finite Realm" pattern.
//          Prevents infinite exploration while maintaining a practically unlimited
//          play space. All spatial systems (pathfinding, world generation, sector
//          streaming) respect these bounds.
// ──────────────────────────────────────────────────────────────────────────────

/**
 * World boundary configuration.
 * 
 * The world is divided into sectors for efficient streaming.
 * Each sector contains a grid of hexes (typically 64×48 = 3,072 hexes).
 * 
 * Default bounds: 501×501 sectors = ~771 million total hexes
 * This is far beyond what any player can explore, but remains finite
 * for deterministic behavior and CI safety.
 */
export interface WorldBounds {
    /** Minimum sector X coordinate (inclusive) */
    sxMin: number;
    /** Maximum sector X coordinate (inclusive) */
    sxMax: number;
    /** Minimum sector Y coordinate (inclusive) */
    syMin: number;
    /** Maximum sector Y coordinate (inclusive) */
    syMax: number;
}

/**
 * Default world bounds: Colossal realm
 * 
 * Size: 501×501 sectors
 * Hex count: ~771 million hexes (assuming 64×48 per sector)
 * Exploration time: Thousands of hours at typical travel speeds
 */
export const DEFAULT_WORLD_BOUNDS: Readonly<WorldBounds> = Object.freeze({
    sxMin: -250,
    sxMax: 250,
    syMin: -250,
    syMax: 250,
});

/**
 * Smaller bounds for testing and development.
 * 
 * Size: 21×21 sectors
 * Hex count: ~1.3 million hexes
 * Useful for faster CI tests and development iteration.
 */
export const TEST_WORLD_BOUNDS: Readonly<WorldBounds> = Object.freeze({
    sxMin: -10,
    sxMax: 10,
    syMin: -10,
    syMax: 10,
});

/**
 * Check if a sector coordinate is within world bounds.
 * 
 * @param sx - Sector X coordinate
 * @param sy - Sector Y coordinate
 * @param bounds - World bounds (defaults to DEFAULT_WORLD_BOUNDS)
 * @returns true if the sector is within bounds
 */
export function isSectorInBounds(
    sx: number,
    sy: number,
    bounds: WorldBounds = DEFAULT_WORLD_BOUNDS,
): boolean {
    return sx >= bounds.sxMin && sx <= bounds.sxMax && sy >= bounds.syMin && sy <= bounds.syMax;
}

/**
 * Clamp a sector coordinate to world bounds.
 * 
 * @param sx - Sector X coordinate
 * @param sy - Sector Y coordinate
 * @param bounds - World bounds (defaults to DEFAULT_WORLD_BOUNDS)
 * @returns Clamped sector coordinates
 */
export function clampSectorToBounds(
    sx: number,
    sy: number,
    bounds: WorldBounds = DEFAULT_WORLD_BOUNDS,
): { sx: number; sy: number } {
    return {
        sx: Math.max(bounds.sxMin, Math.min(bounds.sxMax, sx)),
        sy: Math.max(bounds.syMin, Math.min(bounds.syMax, sy)),
    };
}

/**
 * Get the total number of sectors within bounds.
 * 
 * @param bounds - World bounds (defaults to DEFAULT_WORLD_BOUNDS)
 * @returns Total sector count
 */
export function getTotalSectors(bounds: WorldBounds = DEFAULT_WORLD_BOUNDS): number {
    const width = bounds.sxMax - bounds.sxMin + 1;
    const height = bounds.syMax - bounds.syMin + 1;
    return width * height;
}

/**
 * Calculate approximate hex count for the bounded world.
 * 
 * @param bounds - World bounds
 * @param sectorWidth - Hexes per sector width (default 64)
 * @param sectorHeight - Hexes per sector height (default 48)
 * @returns Approximate total hex count
 */
export function getApproximateHexCount(
    bounds: WorldBounds = DEFAULT_WORLD_BOUNDS,
    sectorWidth: number = 64,
    sectorHeight: number = 48,
): number {
    return getTotalSectors(bounds) * sectorWidth * sectorHeight;
}

/**
 * Create a custom world bounds configuration.
 * 
 * @param radius - Radius in sectors (creates a square centered at origin)
 * @returns WorldBounds configuration
 */
export function createWorldBounds(radius: number): WorldBounds {
    return {
        sxMin: radius === 0 ? 0 : -radius,
        sxMax: radius,
        syMin: radius === 0 ? 0 : -radius,
        syMax: radius,
    };
}

/**
 * World size presets for different gameplay experiences.
 */
export const WORLD_SIZE_PRESETS = {
    /** Tiny world for quick testing (11×11 sectors, ~370K hexes) */
    tiny: createWorldBounds(5),

    /** Small world for focused campaigns (41×41 sectors, ~6M hexes) */
    small: createWorldBounds(20),

    /** Medium world for standard campaigns (101×101 sectors, ~39M hexes) */
    medium: createWorldBounds(50),

    /** Large world for extended exploration (201×201 sectors, ~155M hexes) */
    large: createWorldBounds(100),

    /** Colossal world - practically infinite (501×501 sectors, ~1.5B hexes) */
    colossal: DEFAULT_WORLD_BOUNDS,
} as const;

/**
 * Get a human-readable description of world size.
 * 
 * @param bounds - World bounds
 * @returns Description string
 */
export function getWorldSizeDescription(bounds: WorldBounds): string {
    const sectors = getTotalSectors(bounds);
    const hexes = getApproximateHexCount(bounds);
    const hexesFormatted = hexes.toLocaleString();

    if (sectors <= 121) return `Tiny (${hexesFormatted} hexes - testing/tutorial)`;
    if (sectors <= 1681) return `Small (${hexesFormatted} hexes - focused campaign)`;
    if (sectors <= 10201) return `Medium (${hexesFormatted} hexes - standard campaign)`;
    if (sectors <= 40401) return `Large (${hexesFormatted} hexes - epic exploration)`;
    return `Colossal (${hexesFormatted} hexes - exploration beyond reason)`;
}
