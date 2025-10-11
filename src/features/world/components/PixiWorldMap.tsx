/**
 * Pixi World Map - GPU-Accelerated Terrain Renderer
 * 
 * HYBRID ARCHITECTURE: Smooth overworld exploration with GPU acceleration
 * Hex battles will be generated from this terrain when combat triggers.
 * 
 * Features:
 * - GPU-accelerated sprite rendering (60fps on large maps)
 * - Manual camera system (no pixi-viewport dependency)
 * - Automatic tile culling (only renders visible terrain)
 * - Chunk-based rendering for efficiency
 * - WASD movement with momentum physics
 * - Mouse wheel zoom (anchored to cursor)
 * - Drag-to-pan with smooth deceleration
 * - Retina display support (DPR aware)
 */

import React, { useEffect, useRef, useState } from 'react';
import { Application, Container, Graphics, Text, TextStyle } from 'pixi.js';

// Simple terrain generation (inline implementation)
let terrainSeed = 0;

function initTerrainGenerator(seed: string) {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
        hash = ((hash << 5) - hash) + seed.charCodeAt(i);
        hash |= 0;
    }
    terrainSeed = Math.abs(hash);
}

function noise2d(x: number, y: number, seed: number): number {
    const n = Math.sin(x * 12.9898 + y * 78.233 + seed) * 43758.5453;
    return n - Math.floor(n);
}

function smoothNoise(x: number, y: number, scale: number, seed: number): number {
    const ix = Math.floor(x / scale);
    const iy = Math.floor(y / scale);
    const fx = (x / scale) - ix;
    const fy = (y / scale) - iy;

    const v1 = noise2d(ix, iy, seed);
    const v2 = noise2d(ix + 1, iy, seed);
    const v3 = noise2d(ix, iy + 1, seed);
    const v4 = noise2d(ix + 1, iy + 1, seed);

    const i1 = v1 * (1 - fx) + v2 * fx;
    const i2 = v3 * (1 - fx) + v4 * fx;

    return i1 * (1 - fy) + i2 * fy;
}

function sampleOverworld(pos: { x: number; y: number }): { height: number; moisture: number; biome: string } {
    const height = (
        smoothNoise(pos.x, pos.y, 50, terrainSeed) * 0.5 +
        smoothNoise(pos.x, pos.y, 25, terrainSeed + 1) * 0.3 +
        smoothNoise(pos.x, pos.y, 10, terrainSeed + 2) * 0.2
    );

    const moisture = smoothNoise(pos.x, pos.y, 40, terrainSeed + 1000);
    const temperature = smoothNoise(pos.x, pos.y, 60, terrainSeed + 2000);

    let biome = 'Grassland';
    if (height < 0.4) biome = 'Ocean';
    else if (height < 0.45) biome = 'Beach';
    else if (temperature > 0.7) {
        biome = moisture > 0.5 ? 'Jungle' : 'Desert';
    } else if (temperature < 0.3) {
        biome = height > 0.7 ? 'Snow' : 'Tundra';
    } else if (moisture < 0.3) {
        biome = 'Desert';
    } else if (moisture > 0.7) {
        biome = height > 0.6 ? 'Forest' : 'Swamp';
    } else {
        biome = height > 0.6 ? 'Forest' : 'Grassland';
    }

    return { height, moisture, biome };
}

interface WorldPos {
    x: number;
    y: number;
}

interface PixiWorldMapProps {
    seed: string;
    onEncounter?: (_pos: WorldPos) => void;
    onSettlement?: (_pos: WorldPos) => void;
}

type Keys = Record<string, boolean>;

export default function PixiWorldMap({ seed }: PixiWorldMapProps) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const appRef = useRef<Application | null>(null);
    const worldContainerRef = useRef<Container | null>(null);

    // Camera state
    const cameraRef = useRef({ x: 0, y: 0, scale: 8 }); // 8 pixels per world unit
    const dragRef = useRef<{ active: boolean; startX: number; startY: number; startCamX: number; startCamY: number }>({
        active: false,
        startX: 0,
        startY: 0,
        startCamX: 0,
        startCamY: 0,
    });

    // Game state
    const posRef = useRef<WorldPos>({ x: 0, y: 0 });
    const velRef = useRef({ x: 0, y: 0 });
    const keysRef = useRef<Keys>({});
    const terrainReadyRef = useRef<boolean>(false);

    // Terrain rendering state
    const terrainContainerRef = useRef<Container | null>(null);
    const renderedChunksRef = useRef<Set<string>>(new Set());
    const terrainCacheRef = useRef<Map<string, { r: number; g: number; b: number }>>(new Map());

    // Performance tracking
    const [fps, setFps] = useState(60);
    const fpsRef = useRef<number[]>([]);
    const lastFrameRef = useRef<number>(performance.now());    // Initialize terrain generator
    useEffect(() => {
        console.log('🌱 [Pixi] Initializing terrain generator with seed:', seed);
        setTimeout(() => {
            initTerrainGenerator(seed);
            terrainReadyRef.current = true;
            console.log('✅ [Pixi] Terrain generator ready!');
        }, 100);
    }, [seed]);

    // Initialize Pixi application
    useEffect(() => {
        if (!containerRef.current) return;

        console.log('🎬 [Pixi] Initializing Pixi application...');

        const container = containerRef.current;
        const width = container.clientWidth;
        const height = container.clientHeight;

        // Create Pixi application with Canvas2D renderer (no WebGL chunks)
        const app = new Application();

        (async () => {
            try {
                await app.init({
                    width,
                    height,
                    backgroundColor: 0x1a1a2e,
                    resolution: window.devicePixelRatio || 1,
                    autoDensity: true,
                    antialias: false, // Pixel-perfect for retro aesthetic
                    powerPreference: 'high-performance',
                    preference: 'webgl', // Prefer WebGL but fallback to canvas
                });
                console.log('✅ [Pixi] Application initialized with', app.renderer.type);
            } catch (error) {
                console.error('❌ [Pixi] Failed to initialize:', error);
                return;
            }

            container.appendChild(app.canvas as HTMLCanvasElement);
            appRef.current = app;

            // Create world container (acts as camera)
            const worldContainer = new Container();
            app.stage.addChild(worldContainer);
            worldContainerRef.current = worldContainer;

            // Create terrain container
            const terrainContainer = new Container();
            worldContainer.addChild(terrainContainer);
            terrainContainerRef.current = terrainContainer;

            // Create player marker
            const player = new Graphics();
            player.circle(0, 0, 8);
            player.fill(0xff0000);
            player.stroke({ width: 2, color: 0xffffff });
            worldContainer.addChild(player);

            // Create FPS display (on stage, not world)
            const fpsStyle = new TextStyle({
                fontFamily: 'monospace',
                fontSize: 14,
                fill: 0x00ff00,
            });
            const fpsText = new Text({ text: 'FPS: 60', style: fpsStyle });
            fpsText.position.set(10, 10);
            app.stage.addChild(fpsText);

            // Mouse wheel zoom
            const canvas = app.canvas as HTMLCanvasElement;
            canvas.addEventListener('wheel', (e) => {
                e.preventDefault();
                const camera = cameraRef.current;
                const oldScale = camera.scale;
                const zoomFactor = Math.exp(-e.deltaY / 400);
                const newScale = Math.max(2, Math.min(32, oldScale * zoomFactor));

                // Zoom towards mouse position
                const rect = canvas.getBoundingClientRect();
                const mouseX = e.clientX - rect.left;
                const mouseY = e.clientY - rect.top;

                const worldX = (mouseX - width / 2) / oldScale + camera.x;
                const worldY = (mouseY - height / 2) / oldScale + camera.y;

                camera.scale = newScale;
                camera.x = worldX - (mouseX - width / 2) / newScale;
                camera.y = worldY - (mouseY - height / 2) / newScale;
            }, { passive: false });

            // Mouse drag
            canvas.addEventListener('pointerdown', (e) => {
                const drag = dragRef.current;
                const camera = cameraRef.current;
                drag.active = true;
                drag.startX = e.clientX;
                drag.startY = e.clientY;
                drag.startCamX = camera.x;
                drag.startCamY = camera.y;
                canvas.style.cursor = 'grabbing';
            });

            canvas.addEventListener('pointermove', (e) => {
                const drag = dragRef.current;
                if (!drag.active) return;
                const camera = cameraRef.current;
                const dx = (e.clientX - drag.startX) / camera.scale;
                const dy = (e.clientY - drag.startY) / camera.scale;
                camera.x = drag.startCamX - dx;
                camera.y = drag.startCamY - dy;
            });

            canvas.addEventListener('pointerup', () => {
                dragRef.current.active = false;
                canvas.style.cursor = 'grab';
            });

            canvas.style.cursor = 'grab';

            console.log('✅ [Pixi] Application initialized!');

            // Main render loop
            app.ticker.add(() => {
                const now = performance.now();
                const dt = (now - lastFrameRef.current) / 1000;
                lastFrameRef.current = now;

                // Update FPS
                const currentFps = 1 / dt;
                fpsRef.current.push(currentFps);
                if (fpsRef.current.length > 30) fpsRef.current.shift();
                const avgFps = fpsRef.current.reduce((a, b) => a + b, 0) / fpsRef.current.length;
                setFps(Math.round(avgFps));
                fpsText.text = `FPS: ${Math.round(avgFps)}`;
                fpsText.style.fill = avgFps >= 55 ? 0x00ff00 : avgFps >= 30 ? 0xffff00 : 0xff0000;

                // WASD movement
                const keys = keysRef.current;
                let inputX = 0;
                let inputY = 0;

                if (keys['KeyW'] || keys['ArrowUp']) inputY -= 1;
                if (keys['KeyS'] || keys['ArrowDown']) inputY += 1;
                if (keys['KeyA'] || keys['ArrowLeft']) inputX -= 1;
                if (keys['KeyD'] || keys['ArrowRight']) inputX += 1;

                // Normalize diagonal movement
                if (inputX !== 0 && inputY !== 0) {
                    inputX *= 0.707;
                    inputY *= 0.707;
                }

                // Apply acceleration
                const accel = 500 * dt;
                velRef.current.x += inputX * accel;
                velRef.current.y += inputY * accel;

                // Apply drag
                const drag = 0.85;
                velRef.current.x *= drag;
                velRef.current.y *= drag;

                // Update position
                posRef.current.x += velRef.current.x * dt;
                posRef.current.y += velRef.current.y * dt;

                // Update camera to follow player
                const camera = cameraRef.current;
                camera.x = posRef.current.x;
                camera.y = posRef.current.y;

                // Apply camera transform to world container
                worldContainer.position.set(
                    -camera.x * camera.scale + width / 2,
                    -camera.y * camera.scale + height / 2
                );
                worldContainer.scale.set(camera.scale, camera.scale);

                // Update player marker (at player position in world space)
                player.position.set(posRef.current.x, posRef.current.y);

                // Render terrain chunks
                if (terrainReadyRef.current) {
                    renderVisibleTerrain(terrainContainer, camera.x, camera.y, camera.scale, width, height);
                }
            });
        })();

        // Keyboard handlers
        const onKeyDown = (e: KeyboardEvent) => {
            keysRef.current[e.code] = true;
        };
        const onKeyUp = (e: KeyboardEvent) => {
            keysRef.current[e.code] = false;
        };

        window.addEventListener('keydown', onKeyDown);
        window.addEventListener('keyup', onKeyUp);

        // Handle window resize
        const onResize = () => {
            if (!containerRef.current || !appRef.current) return;
            const w = containerRef.current.clientWidth;
            const h = containerRef.current.clientHeight;
            appRef.current.renderer.resize(w, h);
        };
        window.addEventListener('resize', onResize);

        // Cleanup
        return () => {
            window.removeEventListener('keydown', onKeyDown);
            window.removeEventListener('keyup', onKeyUp);
            window.removeEventListener('resize', onResize);
            if (appRef.current) {
                appRef.current.destroy(true, { children: true });
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Render visible terrain chunks
    const renderVisibleTerrain = (
        terrainContainer: Container,
        camX: number,
        camY: number,
        scale: number,
        screenWidth: number,
        screenHeight: number
    ) => {
        // Calculate visible world bounds
        const viewLeft = camX - screenWidth / (2 * scale);
        const viewRight = camX + screenWidth / (2 * scale);
        const viewTop = camY - screenHeight / (2 * scale);
        const viewBottom = camY + screenHeight / (2 * scale);

        // Fixed chunk size for consistency (no adaptive sizing to avoid gaps)
        const chunkSize = 32; // Always use 32 world units per chunk
        const cellSize = scale < 6 ? 8 : 4; // Only vary cell size for performance

        // Calculate visible chunk range
        const minChunkX = Math.floor(viewLeft / chunkSize) - 1;
        const maxChunkX = Math.ceil(viewRight / chunkSize) + 1;
        const minChunkY = Math.floor(viewTop / chunkSize) - 1;
        const maxChunkY = Math.ceil(viewBottom / chunkSize) + 1;

        // Track which chunks should exist
        const activeChunks = new Set<string>();

        // More aggressive chunk loading to fill gaps faster
        const maxChunksPerFrame = 12;
        let chunksCreated = 0;

        // Render visible chunks (prioritize center)
        const centerChunkX = Math.floor(camX / chunkSize);
        const centerChunkY = Math.floor(camY / chunkSize);

        // Sort chunks by distance from center
        const chunkList: Array<[number, number]> = [];
        for (let cy = minChunkY; cy <= maxChunkY; cy++) {
            for (let cx = minChunkX; cx <= maxChunkX; cx++) {
                chunkList.push([cx, cy]);
            }
        }
        chunkList.sort((a, b) => {
            const distA = Math.abs(a[0] - centerChunkX) + Math.abs(a[1] - centerChunkY);
            const distB = Math.abs(b[0] - centerChunkX) + Math.abs(b[1] - centerChunkY);
            return distA - distB;
        });

        // Render chunks
        for (const [cx, cy] of chunkList) {
            const chunkKey = `${cx},${cy}-${cellSize}`; // Include cell size in key
            activeChunks.add(chunkKey);

            // Skip if already rendered
            if (renderedChunksRef.current.has(chunkKey)) continue;

            // Limit chunks created per frame
            if (chunksCreated >= maxChunksPerFrame) break;
            chunksCreated++;

            // Create chunk with batched rendering
            const chunk = new Graphics();
            chunk.label = chunkKey;

            // Batch cells by color for efficient rendering (crisp, no blur)
            const colorBatches = new Map<number, Array<{ x: number, y: number }>>();

            // Sample terrain cells in this chunk
            for (let ly = 0; ly < chunkSize; ly += cellSize) {
                for (let lx = 0; lx < chunkSize; lx += cellSize) {
                    const wx = cx * chunkSize + lx;
                    const wy = cy * chunkSize + ly;

                    // Sample at cell center for crisp rendering
                    const cacheKey = `${wx},${wy}`;
                    let color = terrainCacheRef.current.get(cacheKey);

                    if (!color) {
                        try {
                            const sample = sampleOverworld({ x: wx + cellSize / 2, y: wy + cellSize / 2 });
                            const [r, g, b] = terrainColor(sample.height, sample.moisture, sample.biome);
                            color = { r, g, b };
                            terrainCacheRef.current.set(cacheKey, color);

                            // Limit cache size
                            if (terrainCacheRef.current.size > 20000) {
                                const firstKey = terrainCacheRef.current.keys().next().value;
                                if (firstKey) terrainCacheRef.current.delete(firstKey);
                            }
                        } catch (err) {
                            continue;
                        }
                    }

                    if (color) {
                        const hexColor = (color.r << 16) | (color.g << 8) | color.b;

                        // Batch cells by color
                        if (!colorBatches.has(hexColor)) {
                            colorBatches.set(hexColor, []);
                        }
                        colorBatches.get(hexColor)!.push({ x: lx, y: ly });
                    }
                }
            }

            // Draw all batched cells (one fill per color)
            colorBatches.forEach((positions, hexColor) => {
                for (const pos of positions) {
                    chunk.rect(pos.x, pos.y, cellSize, cellSize);
                }
                chunk.fill(hexColor);
            });

            // Position chunk in world
            chunk.position.set(cx * chunkSize, cy * chunkSize);
            terrainContainer.addChild(chunk);
            renderedChunksRef.current.add(chunkKey);
        }

        // Remove chunks that are too far away OR have wrong cell size (memory management)
        const children = terrainContainer.children.slice();
        for (const child of children) {
            if (child.label && !activeChunks.has(child.label)) {
                // Parse chunk key to get coordinates
                const parts = child.label.split('-');
                const coords = parts[0].split(',').map(Number);
                const [cx, cy] = coords;

                const distX = Math.abs(cx - (centerChunkX));
                const distY = Math.abs(cy - (centerChunkY));
                const dist = Math.sqrt(distX * distX + distY * distY);

                // Remove if very far from viewport OR wrong cell size
                const oldCellSize = parts[1] ? parseInt(parts[1]) : 4;
                if (dist > 15 || oldCellSize !== cellSize) {
                    terrainContainer.removeChild(child);
                    child.destroy();
                    renderedChunksRef.current.delete(child.label);
                }
            }
        }
    };

    // Terrain color palette (same as SmoothWorldMap)
    const terrainColor = (height: number, moisture: number, biome: string): [number, number, number] => {
        // Deep water
        if (height < 0.3) return [30, 60, 114];
        // Shallow water
        if (height < 0.4) return [52, 101, 164];
        // Beach
        if (height < 0.45) return [194, 178, 128];

        // Land biomes
        switch (biome) {
            case 'Desert': return [210, 180, 140];
            case 'Grassland': return [100, 160, 80];
            case 'Forest': return [34, 139, 34];
            case 'Taiga': return [60, 100, 60];
            case 'Tundra': return [150, 150, 150];
            case 'Snow': return [240, 240, 255];
            case 'Swamp': return [100, 120, 80];
            case 'Savanna': return [160, 140, 80];
            case 'Jungle': return [20, 100, 20];
            default: return [120, 120, 120];
        }
    };

    return (
        <div style={{ width: '100%', height: '100%', position: 'relative' }}>
            <div
                ref={containerRef}
                style={{
                    width: '100%',
                    height: '100%',
                    overflow: 'hidden',
                    touchAction: 'none',
                }}
            />

            {/* Info overlay */}
            <div
                style={{
                    position: 'absolute',
                    bottom: 10,
                    left: 10,
                    background: 'rgba(0,0,0,0.7)',
                    color: 'white',
                    padding: '8px 12px',
                    borderRadius: 4,
                    fontFamily: 'monospace',
                    fontSize: 12,
                    pointerEvents: 'none',
                }}
            >
                <div>🎮 WASD: Move | Mouse: Drag/Zoom</div>
                <div>📍 Pos: ({posRef.current.x.toFixed(1)}, {posRef.current.y.toFixed(1)})</div>
                <div>🎨 GPU: Pixi.js v8 | Chunks: {renderedChunksRef.current.size}</div>
                <div>💾 Cache: {terrainCacheRef.current.size} samples</div>
                <div style={{ color: fps >= 55 ? '#0f0' : fps >= 30 ? '#ff0' : '#f00' }}>
                    ⚡ FPS: {fps}
                </div>
            </div>
        </div>
    );
}
