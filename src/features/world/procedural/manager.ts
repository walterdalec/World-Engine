/**
 * World Manager - Coordinated Procedural Generation
 * TODO #11 — Overworld Procedural Generation
 * 
 * High-level manager for world generation, streaming, and persistence.
 * Coordinates chunks, cache, regional graphs, and encounter systems.
 */

import { generateChunk, type Chunk, type ChunkId, worldToChunk, chunkToWorld } from './chunk';
import { ChunkCache, globalChunkCache } from './cache';
import type { SeededRng } from './rng';
import { splitmix32 } from './rng';

export interface WorldConfig {
    globalSeed: number;
    chunkSize: number;
    streamRadius: number;    // Chunks to keep loaded around player
    preloadRadius: number;   // Chunks to preload ahead of player
    generateAsync: boolean;  // Generate chunks in background
}

export interface PlayerPosition {
    worldX: number;
    worldY: number;
    chunkId: ChunkId;
    localX: number;
    localY: number;
}

export interface WorldBounds {
    minChunkX: number;
    maxChunkX: number;
    minChunkY: number;
    maxChunkY: number;
}

export interface RegionalData {
    politicalControl: Map<string, string>; // chunkKey -> faction
    roads: RoadNetwork;
    tradePosts: TradePost[];
    conflicts: ActiveConflict[];
}

interface RoadNetwork {
    segments: RoadSegment[];
    connections: Map<string, string[]>; // settlement -> connected settlements
}

interface RoadSegment {
    from: { x: number, y: number };
    to: { x: number, y: number };
    quality: number; // 0-1, affects travel speed
    controlled: string; // faction ID
}

interface TradePost {
    id: string;
    worldX: number;
    worldY: number;
    faction: string;
    resources: string[];
    wealth: number;
}

interface ActiveConflict {
    id: string;
    factions: string[];
    centerX: number;
    centerY: number;
    radius: number;
    intensity: number; // 0-1
    type: 'skirmish' | 'siege' | 'patrol' | 'raid';
}

const DEFAULT_CONFIG: WorldConfig = {
    globalSeed: 12345,
    chunkSize: 64,
    streamRadius: 2,
    preloadRadius: 1,
    generateAsync: true
};

/**
 * Main world management system
 */
export class WorldManager {
    private config: WorldConfig;
    private cache: ChunkCache;
    private playerPos: PlayerPosition;
    private loadedChunks = new Set<string>();
    private generationQueue: ChunkId[] = [];
    private isGenerating = false;
    private rng: SeededRng;
    private regionalData: RegionalData = {
        politicalControl: new Map(),
        roads: { segments: [], connections: new Map() },
        tradePosts: [],
        conflicts: []
    };

    constructor(config: Partial<WorldConfig> = {}, cache?: ChunkCache) {
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.cache = cache || globalChunkCache;
        this.rng = splitmix32(this.config.globalSeed);

        // Initialize player at world center
        this.playerPos = this.calculatePlayerPosition(0, 0);

        console.log('🗺️ World Manager initialized:', {
            seed: this.config.globalSeed,
            chunkSize: this.config.chunkSize,
            initialPosition: this.playerPos
        });
    }    /**
     * Update player position and manage chunk streaming
     */
    async updatePlayerPosition(worldX: number, worldY: number): Promise<void> {
        const oldChunkId = this.playerPos.chunkId;
        this.playerPos = this.calculatePlayerPosition(worldX, worldY);

        // Check if player moved to a different chunk
        if (this.playerPos.chunkId.cx !== oldChunkId.cx || this.playerPos.chunkId.cy !== oldChunkId.cy) {
            console.log('🚶 Player moved to new chunk:', this.playerPos.chunkId);
            await this.updateChunkStreaming();
        }
    }

    /**
     * Get chunk at specified coordinates, generating if needed
     */
    async getChunk(chunkId: ChunkId): Promise<Chunk> {
        // Check cache first
        let chunk = this.cache.get(chunkId);

        if (chunk) {
            return chunk;
        }

        // Generate new chunk
        console.log('🏗️ Generating chunk:', chunkId);
        chunk = generateChunk(this.config.globalSeed, chunkId, {
            chunkSize: this.config.chunkSize
        });

        // Store in cache
        this.cache.set(chunk);
        this.loadedChunks.add(this.chunkKey(chunkId));

        return chunk;
    }

    /**
     * Get chunks in a rectangular region
     */
    async getChunksInRegion(
        minChunkX: number,
        minChunkY: number,
        maxChunkX: number,
        maxChunkY: number
    ): Promise<Chunk[]> {
        const chunks: Chunk[] = [];

        for (let cx = minChunkX; cx <= maxChunkX; cx++) {
            for (let cy = minChunkY; cy <= maxChunkY; cy++) {
                const chunk = await this.getChunk({ cx, cy });
                chunks.push(chunk);
            }
        }

        return chunks;
    }

    /**
     * Sample terrain for battle generation
     */
    async sampleForBattle(worldX: number, worldY: number, battleWidth: number, battleHeight: number) {
        const { chunkId, localX, localY } = worldToChunk(worldX, worldY, this.config.chunkSize);
        const chunk = await this.getChunk(chunkId);

        // Handle sampling that spans multiple chunks
        if (localX + battleWidth > this.config.chunkSize || localY + battleHeight > this.config.chunkSize) {
            return this.sampleMultiChunk(worldX, worldY, battleWidth, battleHeight);
        }

        // Simple single-chunk sampling
        const { sampleChunkArea } = await import('./chunk');
        return sampleChunkArea(chunk, localX, localY, battleWidth, battleHeight);
    }

    /**
     * Get current player position
     */
    getPlayerPosition(): PlayerPosition {
        return { ...this.playerPos };
    }

    /**
     * Get world configuration
     */
    getConfig(): WorldConfig {
        return { ...this.config };
    }

    /**
     * Get cache statistics
     */
    getCacheStats() {
        return this.cache.getStats();
    }

    /**
     * Get loaded chunk count
     */
    getLoadedChunkCount(): number {
        return this.loadedChunks.size;
    }

    /**
     * Force cleanup of distant chunks
     */
    cleanupDistantChunks(): number {
        const maxDistance = this.config.streamRadius + 1;
        const toRemove: string[] = [];

        this.loadedChunks.forEach(chunkKey => {
            const chunkId = this.parseChunkKey(chunkKey);
            const distance = Math.max(
                Math.abs(chunkId.cx - this.playerPos.chunkId.cx),
                Math.abs(chunkId.cy - this.playerPos.chunkId.cy)
            );

            if (distance > maxDistance) {
                toRemove.push(chunkKey);
            }
        });

        toRemove.forEach(chunkKey => {
            const chunkId = this.parseChunkKey(chunkKey);
            this.cache.delete(chunkId);
            this.loadedChunks.delete(chunkKey);
        });

        if (toRemove.length > 0) {
            console.log(`🧹 Cleaned up ${toRemove.length} distant chunks`);
        }

        return toRemove.length;
    }

    /**
     * Get regional political and economic data
     */
    getRegionalData(): RegionalData {
        return this.regionalData;
    }

    /**
     * Update regional control for a chunk
     */
    setChunkControl(chunkId: ChunkId, faction: string): void {
        this.regionalData.politicalControl.set(this.chunkKey(chunkId), faction);
    }

    /**
     * Find nearest settlement or point of interest
     */
    async findNearestPOI(worldX: number, worldY: number, maxRadius: number = 3): Promise<any | null> {
        const centerChunk = worldToChunk(worldX, worldY, this.config.chunkSize);

        for (let radius = 0; radius <= maxRadius; radius++) {
            for (let dx = -radius; dx <= radius; dx++) {
                for (let dy = -radius; dy <= radius; dy++) {
                    if (Math.abs(dx) !== radius && Math.abs(dy) !== radius) continue;

                    const chunkId: ChunkId = {
                        cx: centerChunk.chunkId.cx + dx,
                        cy: centerChunk.chunkId.cy + dy
                    };

                    const chunk = await this.getChunk(chunkId);

                    if (chunk.meta.pois.length > 0) {
                        const closestPOI = chunk.meta.pois.reduce((closest, poi) => {
                            const poiWorld = chunkToWorld(chunkId, poi.x, poi.y, this.config.chunkSize);
                            const distance = Math.sqrt(
                                Math.pow(poiWorld.x - worldX, 2) + Math.pow(poiWorld.y - worldY, 2)
                            );

                            return !closest || distance < closest.distance
                                ? { poi, distance, chunkId }
                                : closest;
                        }, null as any);

                        if (closestPOI) {
                            return closestPOI;
                        }
                    }
                }
            }
        }

        return null;
    }

    // Private methods

    private calculatePlayerPosition(worldX: number, worldY: number): PlayerPosition {
        const { chunkId, localX, localY } = worldToChunk(worldX, worldY, this.config.chunkSize);

        return {
            worldX,
            worldY,
            chunkId,
            localX,
            localY
        };
    }

    private async updateChunkStreaming(): Promise<void> {
        // Load chunks in streaming radius
        const promises: Promise<void>[] = [];

        for (let dx = -this.config.streamRadius; dx <= this.config.streamRadius; dx++) {
            for (let dy = -this.config.streamRadius; dy <= this.config.streamRadius; dy++) {
                const chunkId: ChunkId = {
                    cx: this.playerPos.chunkId.cx + dx,
                    cy: this.playerPos.chunkId.cy + dy
                };

                if (!this.cache.has(chunkId)) {
                    if (this.config.generateAsync) {
                        this.generationQueue.push(chunkId);
                    } else {
                        promises.push(this.getChunk(chunkId).then(() => { }));
                    }
                }
            }
        }

        // Wait for synchronous generations
        if (promises.length > 0) {
            await Promise.all(promises);
        }

        // Start async generation if enabled
        if (this.config.generateAsync && !this.isGenerating) {
            this.processGenerationQueue();
        }

        // Cleanup distant chunks
        this.cleanupDistantChunks();
    }

    private async processGenerationQueue(): Promise<void> {
        if (this.generationQueue.length === 0) {
            return;
        }

        this.isGenerating = true;

        try {
            while (this.generationQueue.length > 0) {
                const chunkId = this.generationQueue.shift()!;

                // Check if still needed (player might have moved)
                const distance = Math.max(
                    Math.abs(chunkId.cx - this.playerPos.chunkId.cx),
                    Math.abs(chunkId.cy - this.playerPos.chunkId.cy)
                );

                if (distance <= this.config.streamRadius) {
                    await this.getChunk(chunkId);
                }

                // Yield control occasionally
                if (this.generationQueue.length % 5 === 0) {
                    await new Promise(resolve => setTimeout(resolve, 0));
                }
            }
        } finally {
            this.isGenerating = false;
        }
    }

    private async sampleMultiChunk(worldX: number, worldY: number, width: number, height: number) {
        // Handle sampling across chunk boundaries
        const tiles: any[][] = [];
        const biomes: string[][] = [];

        for (let y = 0; y < height; y++) {
            const tileRow: any[] = [];
            const biomeRow: string[] = [];

            for (let x = 0; x < width; x++) {
                const sampleWorldX = worldX + x;
                const sampleWorldY = worldY + y;
                const { chunkId, localX, localY } = worldToChunk(sampleWorldX, sampleWorldY, this.config.chunkSize);

                const chunk = await this.getChunk(chunkId);
                const { getChunkTile, getChunkBiome } = await import('./chunk');

                tileRow.push(getChunkTile(chunk, localX, localY) || 'water');
                biomeRow.push(getChunkBiome(chunk, localX, localY) || 'deep_ocean');
            }

            tiles.push(tileRow);
            biomes.push(biomeRow);
        }

        return { tiles, biomes };
    }

    private chunkKey(chunkId: ChunkId): string {
        return `${chunkId.cx},${chunkId.cy}`;
    }

    private parseChunkKey(key: string): ChunkId {
        const [cx, cy] = key.split(',').map(Number);
        return { cx, cy };
    }
}

/**
 * Global world manager instance
 */
export let globalWorldManager: WorldManager;

/**
 * Initialize global world manager
 */
export function initializeWorld(config?: Partial<WorldConfig>): WorldManager {
    globalWorldManager = new WorldManager(config);
    return globalWorldManager;
}

/**
 * Get the global world manager (must be initialized first)
 */
export function getWorldManager(): WorldManager {
    if (!globalWorldManager) {
        throw new Error('World manager not initialized. Call initializeWorld() first.');
    }
    return globalWorldManager;
}