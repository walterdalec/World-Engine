/**
 * Pixi v8 Renderer Demo & Testing
 * 
 * Demonstrates how to use the new GPU-accelerated renderer system.
 * This file shows integration patterns and can be used for visual testing.
 */

import * as PIXI from 'pixi.js';
import { OverworldLayer } from '../renderers/pixi-v8';
import { TerrainAdapter, BiomeGrid } from '../renderers/TerrainAdapter';

/**
 * Demo configuration
 */
const DEMO_CONFIG = {
    tileSize: 4,            // 4x4 pixel tiles (MUCH smaller for strategic view)
    chunkSizeTiles: 128,    // 128x128 tiles per chunk = 512x512 pixels
    atlasGrid: { cols: 8, rows: 8 }, // 64-tile atlas (8x8 grid) with transitions
    canvasWidth: 720,       // Portrait orientation
    canvasHeight: 1280,
    worldSizeTilesX: 1024,  // 1024 tiles wide = 8 chunks
    worldSizeTilesY: 720,   // 720 tiles tall ≈ 6 chunks
};

/**
 * Create a fake atlas with gradient/transition tiles
 */
function createTestAtlas(tileSize: number): PIXI.Texture {
    // Expanded atlas: 8x8 grid = 64 tiles
    // First 16 are solid biome colors, rest are transitions
    const gridSize = 8;
    const size = tileSize * gridSize;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    // Base biome colors (matches BIOME_TO_TILE_ID in TerrainAdapter)
    const biomeColors: Record<string, string> = {
        'ocean': '#1a4d7a',
        'deep-ocean': '#0d2a4d',
        'shore': '#c2b280',
        'beach': '#f4e3b5',
        'plains': '#7fb069',
        'grass': '#5d9c59',
        'forest': '#2d5016',
        'dense-forest': '#1e3810',
        'hills': '#8b7355',
        'mountains': '#696969',
        'snow': '#e8f4f8',
        'tundra': '#a9c0c9',
        'desert': '#d4a76a',
        'swamp': '#4a5d53',
        'jungle': '#228b22',
        'wasteland': '#5c4033',
    };

    const baseColors = [
        '#1a4d7a', '#0d2a4d', '#c2b280', '#f4e3b5', // Row 0
        '#7fb069', '#5d9c59', '#2d5016', '#1e3810', // Row 1
        '#8b7355', '#696969', '#e8f4f8', '#a9c0c9', // Row 2
        '#d4a76a', '#4a5d53', '#228b22', '#5c4033', // Row 3
    ];

    // Draw base tiles (first 16)
    for (let i = 0; i < 16; i++) {
        const row = Math.floor(i / gridSize);
        const col = i % gridSize;
        ctx.fillStyle = baseColors[i];
        ctx.fillRect(col * tileSize, row * tileSize, tileSize, tileSize);
    }

    // Create gradient transitions for common biome pairs
    const transitions = [
        // Ocean transitions (slots 16-19)
        { from: '#0d2a4d', to: '#1a4d7a', slot: 16 },  // deep-ocean → ocean
        { from: '#1a4d7a', to: '#c2b280', slot: 17 },  // ocean → shore
        { from: '#c2b280', to: '#f4e3b5', slot: 18 },  // shore → beach
        { from: '#f4e3b5', to: '#7fb069', slot: 19 },  // beach → plains

        // Land transitions (slots 20-23)
        { from: '#7fb069', to: '#5d9c59', slot: 20 },  // plains → grass
        { from: '#5d9c59', to: '#2d5016', slot: 21 },  // grass → forest
        { from: '#2d5016', to: '#1e3810', slot: 22 },  // forest → dense-forest
        { from: '#7fb069', to: '#8b7355', slot: 23 },  // plains → hills

        // Mountain transitions (slots 24-27)
        { from: '#8b7355', to: '#696969', slot: 24 },  // hills → mountains
        { from: '#696969', to: '#e8f4f8', slot: 25 },  // mountains → snow
        { from: '#2d5016', to: '#8b7355', slot: 26 },  // forest → hills
        { from: '#5d9c59', to: '#8b7355', slot: 27 },  // grass → hills
    ];

    // Draw gradient transitions
    for (const trans of transitions) {
        const row = Math.floor(trans.slot / gridSize);
        const col = trans.slot % gridSize;
        const x = col * tileSize;
        const y = row * tileSize;

        // Create horizontal gradient
        const gradient = ctx.createLinearGradient(x, y, x + tileSize, y);
        gradient.addColorStop(0, trans.from);
        gradient.addColorStop(1, trans.to);
        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, tileSize, tileSize);
    }

    // Add subtle borders to all tiles for visibility
    ctx.strokeStyle = 'rgba(0,0,0,0.15)';
    ctx.lineWidth = 0.3;
    for (let i = 0; i < gridSize * gridSize; i++) {
        const row = Math.floor(i / gridSize);
        const col = i % gridSize;
        ctx.strokeRect(col * tileSize, row * tileSize, tileSize, tileSize);
    }

    return PIXI.Texture.from(canvas);
}

/**
 * Generate fake biome data for testing
 */
function generateTestBiomeGrid(width: number, height: number): BiomeGrid {
    const N = width * height;
    const biomes: string[] = new Array(N);
    const elevation: number[] = new Array(N);

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const i = y * width + x;

            // Simple noise-like pattern
            const noise = Math.sin(x * 0.1) * Math.cos(y * 0.1);
            const elev = (noise + 1) / 2; // 0..1

            elevation[i] = elev;

            // Pick biome based on elevation
            if (elev < 0.3) biomes[i] = 'ocean';
            else if (elev < 0.35) biomes[i] = 'shore';
            else if (elev < 0.5) biomes[i] = 'plains';
            else if (elev < 0.7) biomes[i] = 'forest';
            else if (elev < 0.85) biomes[i] = 'hills';
            else biomes[i] = 'mountains';
        }
    }

    return { width, height, biomes, elevation };
}

/**
 * Initialize demo renderer
 */
export async function initPixiV8Demo(container: HTMLElement): Promise<() => void> {
    // Create Pixi application
    const app = new PIXI.Application();
    await app.init({
        width: DEMO_CONFIG.canvasWidth,
        height: DEMO_CONFIG.canvasHeight,
        backgroundColor: 0x0b0f14,
        antialias: true,
    });

    container.appendChild(app.canvas as HTMLCanvasElement);

    // Create test atlas
    const atlas = createTestAtlas(DEMO_CONFIG.tileSize);

    // Create overworld layer
    const worldLayer = new OverworldLayer({
        tileSize: DEMO_CONFIG.tileSize,
        chunkSizeTiles: DEMO_CONFIG.chunkSizeTiles,
        atlas,
        atlasGrid: DEMO_CONFIG.atlasGrid,
        ditherStrength: 0.15,
    });

    app.stage.addChild(worldLayer);

    // Create terrain adapter
    const adapter = new TerrainAdapter({
        tileSize: DEMO_CONFIG.tileSize,
        chunkSizeTiles: DEMO_CONFIG.chunkSizeTiles,
    });

    // Generate test terrain (1024x720 tiles = 8x6 chunks at 128 tiles/chunk)
    const biomeGrid = generateTestBiomeGrid(
        DEMO_CONFIG.worldSizeTilesX,
        DEMO_CONFIG.worldSizeTilesY
    );

    console.log('🗺️ Generated biome grid:', {
        width: biomeGrid.width,
        height: biomeGrid.height,
        tiles: biomeGrid.biomes.length,
        chunkSizeTiles: DEMO_CONFIG.chunkSizeTiles,
        expectedChunks: Math.ceil(biomeGrid.width / DEMO_CONFIG.chunkSizeTiles),
    });

    // Calculate how many chunks we actually need
    const chunksX = Math.ceil(biomeGrid.width / DEMO_CONFIG.chunkSizeTiles);
    const chunksY = Math.ceil(biomeGrid.height / DEMO_CONFIG.chunkSizeTiles);

    // Only load chunks visible on screen + 1 buffer
    // Canvas is 720x1280, tiles are 4px, so visible area is ~180x320 tiles
    // At 128 tiles/chunk, that's ~2x3 chunks visible
    // Load 3x4 = 12 chunks instead of all 48
    const maxVisibleChunksX = Math.min(3, chunksX);
    const maxVisibleChunksY = Math.min(4, chunksY);

    const chunksToLoad = [];
    for (let cy = 0; cy < maxVisibleChunksY; cy++) {
        for (let cx = 0; cx < maxVisibleChunksX; cx++) {
            chunksToLoad.push({ x: cx, y: cy });
        }
    }

    console.log(`📦 Loading ${chunksToLoad.length} chunks (of ${chunksX * chunksY} total)`);

    for (const chunk of chunksToLoad) {
        console.log(`📦 Loading chunk (${chunk.x}, ${chunk.y})...`);
        const chunkData = adapter.convertToChunk(biomeGrid, chunk.x, chunk.y);
        worldLayer.upsertChunk(chunkData);
    }    // Center camera on world
    const worldPixelWidth = DEMO_CONFIG.worldSizeTilesX * DEMO_CONFIG.tileSize;
    const worldPixelHeight = DEMO_CONFIG.worldSizeTilesY * DEMO_CONFIG.tileSize;
    worldLayer.position.set(
        DEMO_CONFIG.canvasWidth / 2 - worldPixelWidth / 2,
        DEMO_CONFIG.canvasHeight / 2 - worldPixelHeight / 2
    );

    // Add pan/zoom controls
    let dragging = false;
    let lastX = 0, lastY = 0;

    const canvas = app.canvas as HTMLCanvasElement;

    canvas.addEventListener('pointerdown', (e) => {
        dragging = true;
        lastX = e.clientX;
        lastY = e.clientY;
        canvas.style.cursor = 'grabbing';
    });

    canvas.addEventListener('pointermove', (e) => {
        if (!dragging) return;
        const dx = e.clientX - lastX;
        const dy = e.clientY - lastY;
        worldLayer.position.x += dx;
        worldLayer.position.y += dy;
        lastX = e.clientX;
        lastY = e.clientY;
    });

    canvas.addEventListener('pointerup', () => {
        dragging = false;
        canvas.style.cursor = 'grab';
    });

    canvas.addEventListener('wheel', (e) => {
        e.preventDefault();

        // Clamp zoom to prevent performance issues
        const MIN_SCALE = 0.1;  // Max zoom out (10% - see more tiles)
        const MAX_SCALE = 4.0;  // Max zoom in (400% - bigger tiles)

        const scaleFactor = Math.exp(-e.deltaY * 0.001);
        const newScaleX = worldLayer.scale.x * scaleFactor;
        const newScaleY = worldLayer.scale.y * scaleFactor;

        // Only apply zoom if within limits
        if (newScaleX >= MIN_SCALE && newScaleX <= MAX_SCALE) {
            worldLayer.scale.x = newScaleX;
            worldLayer.scale.y = newScaleY;
        }
    }, { passive: false });

    canvas.style.cursor = 'grab';

    console.log('🎮 Pixi v8 Demo initialized');
    console.log('📊 Stats:', {
        tileSize: `${DEMO_CONFIG.tileSize}px`,
        chunkSizeTiles: DEMO_CONFIG.chunkSizeTiles,
        worldSizeTiles: `${DEMO_CONFIG.worldSizeTilesX}x${DEMO_CONFIG.worldSizeTilesY}`,
        chunks: chunksToLoad.length,
        tilesPerChunk: DEMO_CONFIG.chunkSizeTiles * DEMO_CONFIG.chunkSizeTiles, // 16,384
        totalTiles: DEMO_CONFIG.worldSizeTilesX * DEMO_CONFIG.worldSizeTilesY, // 737,280
        worldPixelSize: `${DEMO_CONFIG.worldSizeTilesX * DEMO_CONFIG.tileSize}x${DEMO_CONFIG.worldSizeTilesY * DEMO_CONFIG.tileSize}px`,
        atlasSize: `${atlas.width}x${atlas.height}`,
    });

    // Cleanup function
    return () => {
        app.destroy(true, { children: true, texture: true });
    };
}

/**
 * Example usage in a React component:
 * 
 * ```tsx
 * import { useEffect, useRef } from 'react';
 * import { initPixiV8Demo } from '../features/world/demo/PixiV8Demo';
 * 
 * function PixiV8TestPage() {
 *   const containerRef = useRef<HTMLDivElement>(null);
 * 
 *   useEffect(() => {
 *     if (!containerRef.current) return;
 *     const cleanup = await initPixiV8Demo(containerRef.current);
 *     return cleanup;
 *   }, []);
 * 
 *   return (
 *     <div>
 *       <h1>Pixi v8 Renderer Test</h1>
 *       <div ref={containerRef} />
 *     </div>
 *   );
 * }
 * ```
 */
