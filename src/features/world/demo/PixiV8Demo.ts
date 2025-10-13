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
    atlasGrid: { cols: 4, rows: 4 }, // 16-tile atlas (4x4 grid)
    canvasWidth: 1280,
    canvasHeight: 720,
    worldSizeTiles: 256,    // 256x256 tile world = 4x4 chunks
};

/**
 * Create a fake atlas for testing (single-color tiles)
 */
function createTestAtlas(tileSize: number): PIXI.Texture {
    const size = tileSize * 4; // 4x4 grid
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    // Define tile colors (matches BIOME_TO_TILE_ID in TerrainAdapter)
    const colors = [
        '#1a4d7a', // 0: ocean
        '#0d2a4d', // 1: deep-ocean
        '#c2b280', // 2: shore
        '#f4e3b5', // 3: beach
        '#7fb069', // 4: plains
        '#5d9c59', // 5: grass
        '#2d5016', // 6: forest
        '#1e3810', // 7: dense-forest
        '#8b7355', // 8: hills
        '#696969', // 9: mountains
        '#e8f4f8', // 10: snow
        '#a9c0c9', // 11: tundra
        '#d4a76a', // 12: desert
        '#4a5d53', // 13: swamp
        '#228b22', // 14: jungle
        '#5c4033', // 15: wasteland
    ];

    for (let i = 0; i < colors.length; i++) {
        const row = Math.floor(i / 4);
        const col = i % 4;
        ctx.fillStyle = colors[i];
        ctx.fillRect(col * tileSize, row * tileSize, tileSize, tileSize);

        // Add subtle border for visibility
        ctx.strokeStyle = 'rgba(0,0,0,0.2)';
        ctx.lineWidth = 0.5;
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

    // Generate test terrain - 4x4 chunks = 512x512 tiles
    const biomeGrid = generateTestBiomeGrid(
        DEMO_CONFIG.worldSizeTiles,
        DEMO_CONFIG.worldSizeTiles
    );

    // Load all 4x4 chunks (16 total)
    const chunksToLoad = [];
    for (let cy = 0; cy < 4; cy++) {
        for (let cx = 0; cx < 4; cx++) {
            chunksToLoad.push({ x: cx, y: cy });
        }
    }

    for (const chunk of chunksToLoad) {
        const chunkData = adapter.convertToChunk(biomeGrid, chunk.x, chunk.y);
        worldLayer.upsertChunk(chunkData);
    }

    // Center camera on world
    const worldPixelSize = DEMO_CONFIG.worldSizeTiles * DEMO_CONFIG.tileSize;
    worldLayer.position.set(
        DEMO_CONFIG.canvasWidth / 2 - worldPixelSize / 2,
        DEMO_CONFIG.canvasHeight / 2 - worldPixelSize / 2
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
        const scaleFactor = Math.exp(-e.deltaY * 0.001);
        worldLayer.scale.x *= scaleFactor;
        worldLayer.scale.y *= scaleFactor;
    }, { passive: false });

    canvas.style.cursor = 'grab';

    console.log('🎮 Pixi v8 Demo initialized');
    console.log('📊 Stats:', {
        tileSize: `${DEMO_CONFIG.tileSize}px`,
        chunkSizeTiles: DEMO_CONFIG.chunkSizeTiles,
        worldSizeTiles: DEMO_CONFIG.worldSizeTiles,
        chunks: 16, // 4x4 chunk grid
        tilesPerChunk: DEMO_CONFIG.chunkSizeTiles * DEMO_CONFIG.chunkSizeTiles, // 16,384
        totalTiles: DEMO_CONFIG.worldSizeTiles * DEMO_CONFIG.worldSizeTiles, // 65,536
        worldPixelSize: `${DEMO_CONFIG.worldSizeTiles * DEMO_CONFIG.tileSize}px`, // 1024px
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
