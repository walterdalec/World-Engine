/**
 * World Size Configuration System
 * TODO #11 Extension - Performance-Based World Limits
 * 
 * Provides configurable world size limits for different performance tiers,
 * with automatic cache management and fog of war integration.
 */

export interface WorldSizeConfig {
    id: string;
    name: string;
    displayName: string;
    description: string;

    // Core limits
    maxChunks: number;           // Total chunks that can exist
    maxCachedChunks: number;     // Chunks kept in memory
    maxMemoryMB: number;         // Memory limit

    // Generation constraints  
    worldBounds?: {              // Hard world boundaries (all worlds are bounded)
        minChunkX: number;
        maxChunkX: number;
        minChunkY: number;
        maxChunkY: number;
    };

    // Performance settings
    chunkSize: number;           // Tiles per chunk edge
    streamRadius: number;        // Chunks to keep loaded around player
    preloadRadius: number;       // Chunks to preload ahead
    generateAsync: boolean;      // Background generation

    // Fog of war settings
    fogEnabled: boolean;         // Enable fog of war
    fogDecayRate: number;        // How fast unexplored areas fade (0-1)
    revealRadius: number;        // Tiles revealed around player

    // Cleanup behavior
    aggressiveCleanup: boolean;  // More frequent distant chunk cleanup
    cleanupInterval: number;     // Seconds between cleanup passes
}

export const WORLD_SIZE_CONFIGS: Record<string, WorldSizeConfig> = {
    small: {
        id: 'small',
        name: 'small',
        displayName: '🏠 Small World',
        description: 'Perfect for laptops and older PCs. Limited exploration area with aggressive memory management.',

        maxChunks: 25,              // 5×5 chunk grid
        maxCachedChunks: 16,        // Keep 4×4 in memory
        maxMemoryMB: 15,            // Very conservative

        worldBounds: {
            minChunkX: -2, maxChunkX: 2,
            minChunkY: -2, maxChunkY: 2
        },

        chunkSize: 32,              // Smaller chunks for performance
        streamRadius: 1,            // Minimal streaming
        preloadRadius: 0,           // No preloading
        generateAsync: false,       // Synchronous for reliability

        fogEnabled: true,
        fogDecayRate: 0.1,          // Slow decay
        revealRadius: 8,            // Small reveal area

        aggressiveCleanup: true,
        cleanupInterval: 30         // Clean every 30 seconds
    },

    medium: {
        id: 'medium',
        name: 'medium',
        displayName: '🏰 Medium World',
        description: 'Good balance for most gaming PCs. Substantial exploration with smart memory limits.',

        maxChunks: 100,             // 10×10 chunk grid
        maxCachedChunks: 49,        // Keep 7×7 in memory
        maxMemoryMB: 30,

        worldBounds: {
            minChunkX: -5, maxChunkX: 4,
            minChunkY: -5, maxChunkY: 4
        },

        chunkSize: 48,              // Medium chunks
        streamRadius: 2,
        preloadRadius: 1,
        generateAsync: true,

        fogEnabled: true,
        fogDecayRate: 0.05,
        revealRadius: 12,

        aggressiveCleanup: false,
        cleanupInterval: 60
    },

    large: {
        id: 'large',
        name: 'large',
        displayName: '🌍 Large World',
        description: 'Extensive exploration for powerful PCs. Large memory usage but rich content.',

        maxChunks: 400,             // 20×20 chunk grid
        maxCachedChunks: 100,       // Keep 10×10 in memory
        maxMemoryMB: 50,

        worldBounds: {
            minChunkX: -10, maxChunkX: 9,
            minChunkY: -10, maxChunkY: 9
        },

        chunkSize: 64,              // Full-size chunks
        streamRadius: 3,
        preloadRadius: 2,
        generateAsync: true,

        fogEnabled: true,
        fogDecayRate: 0.02,
        revealRadius: 16,

        aggressiveCleanup: false,
        cleanupInterval: 120
    },

    extraLarge: {
        id: 'extraLarge',
        name: 'extraLarge',
        displayName: '🗺️ Extra Large World',
        description: 'Massive exploration for high-end gaming rigs. Requires 8GB+ RAM and dedicated GPU.',

        maxChunks: 1600,            // 40×40 chunk grid  
        maxCachedChunks: 225,       // Keep 15×15 in memory
        maxMemoryMB: 100,

        worldBounds: {
            minChunkX: -20, maxChunkX: 19,
            minChunkY: -20, maxChunkY: 19
        },

        chunkSize: 64,
        streamRadius: 4,
        preloadRadius: 3,
        generateAsync: true,

        fogEnabled: true,
        fogDecayRate: 0.01,
        revealRadius: 20,

        aggressiveCleanup: false,
        cleanupInterval: 300        // 5 minutes
    },

    extremelyLarge: {
        id: 'extremelyLarge',
        name: 'extremelyLarge',
        displayName: '🌌 Extremely Large World',
        description: 'For enthusiasts with workstation-class hardware. 16GB+ RAM recommended.',

        maxChunks: 6400,            // 80×80 chunk grid
        maxCachedChunks: 400,       // Keep 20×20 in memory  
        maxMemoryMB: 200,

        worldBounds: {
            minChunkX: -40, maxChunkX: 39,
            minChunkY: -40, maxChunkY: 39
        },

        chunkSize: 64,
        streamRadius: 5,
        preloadRadius: 4,
        generateAsync: true,

        fogEnabled: false,          // Fog optional for extreme explorers
        fogDecayRate: 0.005,
        revealRadius: 24,

        aggressiveCleanup: false,
        cleanupInterval: 600        // 10 minutes
    },

    colossal: {
        id: 'colossal',
        name: 'colossal',
        displayName: '🌍 Colossal World',
        description: 'Practically unlimited exploration (501×501 sectors, ~771M hexes). Exploration beyond reason!',

        maxChunks: 251001,          // 501×501 sectors (matches DEFAULT_WORLD_BOUNDS)
        maxCachedChunks: 500,       // Still need memory limits
        maxMemoryMB: 300,           // Conservative cache limit

        worldBounds: {              // Bounded but vast
            minChunkX: -250, maxChunkX: 250,
            minChunkY: -250, maxChunkY: 250
        },

        chunkSize: 64,              // Standard sector size
        streamRadius: 3,            // Conservative streaming
        preloadRadius: 1,           // Minimal preload
        generateAsync: true,

        fogEnabled: false,          // Player choice
        fogDecayRate: 0.001,        // Very slow decay
        revealRadius: 16,

        aggressiveCleanup: true,    // Essential for large worlds
        cleanupInterval: 60
    }
};

/**
 * Auto-detect recommended world size based on system capabilities
 */
export function detectRecommendedWorldSize(): string {
    // Basic system detection (browser-based estimates)
    const memory = (navigator as any).deviceMemory || 4; // GB estimate
    const cores = navigator.hardwareConcurrency || 4;

    // Conservative estimates based on available data
    if (memory <= 4 && cores <= 2) {
        return 'small';
    } else if (memory <= 8 && cores <= 4) {
        return 'medium';
    } else if (memory <= 16 && cores <= 8) {
        return 'large';
    } else if (memory <= 32) {
        return 'extraLarge';
    } else {
        return 'extremelyLarge';
    }
}

/**
 * Get world size config by ID with fallback
 */
export function getWorldSizeConfig(sizeId: string): WorldSizeConfig {
    return WORLD_SIZE_CONFIGS[sizeId] || WORLD_SIZE_CONFIGS.medium;
}

/**
 * Get all available world size options for UI
 */
export function getWorldSizeOptions(): WorldSizeConfig[] {
    return Object.values(WORLD_SIZE_CONFIGS);
}

/**
 * Validate if a world size is appropriate for current system
 */
export function validateWorldSizeForSystem(sizeId: string): {
    supported: boolean;
    warnings: string[];
    recommendations: string[];
} {
    const config = getWorldSizeConfig(sizeId);
    const warnings: string[] = [];
    const recommendations: string[] = [];

    const memory = (navigator as any).deviceMemory || 4;
    const cores = navigator.hardwareConcurrency || 4;

    // Memory warnings
    if (config.maxMemoryMB > memory * 200) { // 200MB per GB conservative
        warnings.push(`This world size may use up to ${config.maxMemoryMB}MB of memory.`);
        recommendations.push(`Consider a smaller world size or close other applications.`);
    }

    // Performance warnings  
    if (config.chunkSize >= 64 && cores <= 2) {
        warnings.push(`Large chunks may cause stuttering on systems with few CPU cores.`);
        recommendations.push(`Try enabling async generation or reducing chunk size.`);
    }

    // Colossal world warnings
    if (sizeId === 'colossal') {
        warnings.push(`Colossal worlds are extremely large (~771M hexes) and may consume significant memory over time.`);
        recommendations.push(`Monitor memory usage and save frequently. Consider using a smaller world size if performance degrades.`);
    }

    return {
        supported: warnings.length === 0,
        warnings,
        recommendations
    };
}

/**
 * Calculate estimated world coverage in square kilometers
 */
export function calculateWorldCoverage(config: WorldSizeConfig): {
    totalTiles: number;
    estimatedKmSquared: number;
    explorationTimeEstimate: string;
} {
    const bounds = config.worldBounds;

    // All worlds now have bounds - no infinite worlds
    if (!bounds) {
        throw new Error('World configuration missing bounds. All worlds must be bounded.');
    }

    const totalTiles = (bounds.maxChunkX - bounds.minChunkX + 1) *
        (bounds.maxChunkY - bounds.minChunkY + 1) *
        config.chunkSize * config.chunkSize;

    // Rough estimates: 1 tile ≈ 10m, player moves ~50 tiles/minute exploring
    const estimatedKmSquared = (totalTiles * 100) / 1000000; // 100m² per tile → km²
    const explorationMinutes = totalTiles / 50;

    const explorationTimeEstimate = explorationMinutes < 60
        ? `${Math.round(explorationMinutes)} minutes`
        : explorationMinutes < 1440
            ? `${Math.round(explorationMinutes / 60)} hours`
            : `${Math.round(explorationMinutes / 1440)} days`;

    return {
        totalTiles,
        estimatedKmSquared,
        explorationTimeEstimate
    };
}