/**
 * Chunk Cache Management System
 * TODO #11 — Overworld Procedural Generation
 * 
 * Manages memory-efficient caching of generated chunks with LRU eviction,
 * persistence, and performance tracking.
 */

import type { Chunk, ChunkId } from './chunk';

export interface CacheStats {
    hits: number;
    misses: number;
    generations: number;
    evictions: number;
    totalMemoryBytes: number;
    averageGenerationTime: number;
}

export interface CacheConfig {
    maxChunks: number;        // Maximum chunks in memory
    maxMemoryMB: number;      // Memory limit in megabytes
    persistToDisk: boolean;   // Save chunks to localStorage
    trackStats: boolean;     // Performance tracking
}

const DEFAULT_CONFIG: CacheConfig = {
    maxChunks: 100,
    maxMemoryMB: 50,
    persistToDisk: true,
    trackStats: true
};

/**
 * LRU Cache Node for efficient eviction
 */
class CacheNode {
    constructor(
        public chunkId: ChunkId,
        public chunk: Chunk,
        public prev: CacheNode | null = null,
        public next: CacheNode | null = null
    ) { }
}

/**
 * High-performance chunk cache with LRU eviction
 */
export class ChunkCache {
    private config: CacheConfig;
    private cache = new Map<string, CacheNode>();
    private head: CacheNode | null = null;
    private tail: CacheNode | null = null;
    private stats: CacheStats = {
        hits: 0,
        misses: 0,
        generations: 0,
        evictions: 0,
        totalMemoryBytes: 0,
        averageGenerationTime: 0
    };
    private totalGenerationTime = 0;

    constructor(config: Partial<CacheConfig> = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.loadPersistedChunks();
    }

    /**
     * Get chunk from cache or return null if not found
     */
    get(chunkId: ChunkId): Chunk | null {
        const key = this.chunkKey(chunkId);
        const node = this.cache.get(key);

        if (!node) {
            if (this.config.trackStats) {
                this.stats.misses++;
            }
            return null;
        }

        // Move to front (most recently used)
        this.moveToFront(node);

        if (this.config.trackStats) {
            this.stats.hits++;
        }

        return node.chunk;
    }

    /**
     * Store chunk in cache
     */
    set(chunk: Chunk): void {
        const key = this.chunkKey(chunk.id);
        const existing = this.cache.get(key);

        if (existing) {
            // Update existing chunk
            existing.chunk = chunk;
            this.moveToFront(existing);
        } else {
            // Add new chunk
            const node = new CacheNode(chunk.id, chunk);
            this.cache.set(key, node);
            this.addToFront(node);

            if (this.config.trackStats) {
                this.stats.generations++;
                this.totalGenerationTime += chunk.meta.lastGenTime;
                this.stats.averageGenerationTime = this.totalGenerationTime / this.stats.generations;
            }

            // Check if we need to evict
            this.enforceCapacity();
        }

        this.updateMemoryStats();

        if (this.config.persistToDisk) {
            this.persistChunk(chunk);
        }
    }

    /**
     * Check if chunk exists in cache
     */
    has(chunkId: ChunkId): boolean {
        return this.cache.has(this.chunkKey(chunkId));
    }

    /**
     * Remove chunk from cache
     */
    delete(chunkId: ChunkId): boolean {
        const key = this.chunkKey(chunkId);
        const node = this.cache.get(key);

        if (!node) {
            return false;
        }

        this.removeNode(node);
        this.cache.delete(key);
        this.updateMemoryStats();

        if (this.config.persistToDisk) {
            this.deletePersistedChunk(chunkId);
        }

        return true;
    }

    /**
     * Clear all cached chunks
     */
    clear(): void {
        this.cache.clear();
        this.head = null;
        this.tail = null;
        this.stats.totalMemoryBytes = 0;

        if (this.config.persistToDisk) {
            this.clearPersistedChunks();
        }
    }

    /**
     * Get cache statistics
     */
    getStats(): CacheStats {
        return { ...this.stats };
    }

    /**
     * Get cache hit ratio (0-1)
     */
    getHitRatio(): number {
        const total = this.stats.hits + this.stats.misses;
        return total > 0 ? this.stats.hits / total : 0;
    }

    /**
     * Get all cached chunk IDs
     */
    getCachedChunkIds(): ChunkId[] {
        return Array.from(this.cache.keys()).map(key => this.parseChunkKey(key));
    }

    /**
     * Force eviction of least recently used chunks
     */
    evictLRU(count: number = 1): ChunkId[] {
        const evicted: ChunkId[] = [];

        for (let i = 0; i < count && this.tail; i++) {
            const chunkId = { ...this.tail.chunkId };
            this.delete(chunkId);
            evicted.push(chunkId);

            if (this.config.trackStats) {
                this.stats.evictions++;
            }
        }

        return evicted;
    }

    /**
     * Preload chunks around a center point
     */
    preloadAround(centerChunk: ChunkId, radius: number): Promise<void> {
        const promises: Promise<void>[] = [];

        for (let dx = -radius; dx <= radius; dx++) {
            for (let dy = -radius; dy <= radius; dy++) {
                const chunkId: ChunkId = {
                    cx: centerChunk.cx + dx,
                    cy: centerChunk.cy + dy
                };

                if (!this.has(chunkId)) {
                    // This would trigger generation in the world manager
                    // For now, just mark as a potential preload
                    promises.push(Promise.resolve());
                }
            }
        }

        return Promise.all(promises).then(() => { });
    }

    // Private methods

    private chunkKey(chunkId: ChunkId): string {
        return `${chunkId.cx},${chunkId.cy}`;
    }

    private parseChunkKey(key: string): ChunkId {
        const [cx, cy] = key.split(',').map(Number);
        return { cx, cy };
    }

    private moveToFront(node: CacheNode): void {
        if (node === this.head) {
            return;
        }

        this.removeNode(node);
        this.addToFront(node);
    }

    private addToFront(node: CacheNode): void {
        node.next = this.head;
        node.prev = null;

        if (this.head) {
            this.head.prev = node;
        }

        this.head = node;

        if (!this.tail) {
            this.tail = node;
        }
    }

    private removeNode(node: CacheNode): void {
        if (node.prev) {
            node.prev.next = node.next;
        } else {
            this.head = node.next;
        }

        if (node.next) {
            node.next.prev = node.prev;
        } else {
            this.tail = node.prev;
        }
    }

    private enforceCapacity(): void {
        // Check chunk count limit
        while (this.cache.size > this.config.maxChunks) {
            this.evictLRU(1);
        }

        // Check memory limit
        const maxBytes = this.config.maxMemoryMB * 1024 * 1024;
        while (this.stats.totalMemoryBytes > maxBytes && this.tail) {
            this.evictLRU(1);
        }
    }

    private updateMemoryStats(): void {
        if (!this.config.trackStats) {
            return;
        }

        let totalBytes = 0;

        this.cache.forEach((node) => {
            const chunk = node.chunk;
            // Estimate memory usage
            totalBytes += chunk.tiles.byteLength;
            totalBytes += chunk.biomes.byteLength;
            totalBytes += JSON.stringify(chunk.meta).length * 2; // UTF-16
            totalBytes += 200; // Overhead estimate
        });

        this.stats.totalMemoryBytes = totalBytes;
    }

    private persistChunk(chunk: Chunk): void {
        try {
            const key = `world_chunk_${this.chunkKey(chunk.id)}`;
            const data = {
                id: chunk.id,
                tiles: Array.from(chunk.tiles),
                biomes: Array.from(chunk.biomes),
                width: chunk.width,
                height: chunk.height,
                meta: chunk.meta,
                hash: chunk.hash,
                version: 1
            };

            localStorage.setItem(key, JSON.stringify(data));
        } catch (error) {
            console.warn('🗂️ Failed to persist chunk:', error);
        }
    }

    private loadPersistedChunks(): void {
        if (!this.config.persistToDisk) {
            return;
        }

        try {
            const keys = Object.keys(localStorage).filter(key => key.startsWith('world_chunk_'));

            for (const key of keys) {
                try {
                    const data = JSON.parse(localStorage.getItem(key) || '{}');

                    if (data.version === 1) {
                        const chunk: Chunk = {
                            id: data.id,
                            tiles: new Uint8Array(data.tiles),
                            biomes: new Uint8Array(data.biomes),
                            width: data.width,
                            height: data.height,
                            meta: data.meta,
                            generated: true,
                            hash: data.hash
                        };

                        // Add to cache without triggering persistence
                        const node = new CacheNode(chunk.id, chunk);
                        this.cache.set(this.chunkKey(chunk.id), node);
                        this.addToFront(node);
                    }
                } catch (error) {
                    console.warn('🗂️ Failed to load persisted chunk:', key, error);
                    localStorage.removeItem(key);
                }
            }

            console.log(`🗂️ Loaded ${this.cache.size} persisted chunks`);
        } catch (error) {
            console.warn('🗂️ Failed to load persisted chunks:', error);
        }
    }

    private deletePersistedChunk(chunkId: ChunkId): void {
        const key = `world_chunk_${this.chunkKey(chunkId)}`;
        localStorage.removeItem(key);
    }

    private clearPersistedChunks(): void {
        const keys = Object.keys(localStorage).filter(key => key.startsWith('world_chunk_'));
        keys.forEach(key => localStorage.removeItem(key));
    }
}

/**
 * Global chunk cache instance
 */
export const globalChunkCache = new ChunkCache();