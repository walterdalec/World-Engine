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
import { connectPOIs, paintRoadsPIXI, paintRoadEndpointsPIXI, type POI, type TerrainData } from '../utils/roads';

// Advanced terrain generation with FBM, domain warp, and biome blending
let terrainSeed = 0;

// Fast hash and noise functions
function hash32(x: number): number {
    x |= 0;
    x = Math.imul(x ^ (x >>> 16), 0x7feb352d);
    x = Math.imul(x ^ (x >>> 15), 0x846ca68b);
    x = (x ^ (x >>> 16)) >>> 0;
    return x;
}

function rand2(ix: number, iy: number, seed: number): number {
    return hash32(seed ^ hash32(ix * 374761393 ^ iy * 668265263)) / 4294967296;
}

function smoothstep(t: number): number {
    return t * t * (3 - 2 * t);
}

function lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
}

function makeNoise2D(seed: number): (_x: number, _y: number) => number {
    return (x: number, y: number) => {
        const ix = Math.floor(x), iy = Math.floor(y);
        const fx = x - ix, fy = y - iy;
        const v00 = rand2(ix, iy, seed), v10 = rand2(ix + 1, iy, seed);
        const v01 = rand2(ix, iy + 1, seed), v11 = rand2(ix + 1, iy + 1, seed);
        const sx = smoothstep(fx), sy = smoothstep(fy);
        const nx0 = lerp(v00, v10, sx);
        const nx1 = lerp(v01, v11, sx);
        return lerp(nx0, nx1, sy) * 2 - 1; // [-1..1]
    };
}

function fbm2(noise: (_x: number, _y: number) => number, x: number, y: number, octaves = 5, lacunarity = 2, gain = 0.5): number {
    let amp = 1, freq = 1, sum = 0, norm = 0;
    for (let i = 0; i < octaves; i++) {
        sum += noise(x * freq, y * freq) * amp;
        norm += amp;
        amp *= gain;
        freq *= lacunarity;
    }
    return sum / norm;
}

// Noise generators (created per seed)
let nElev: ((_x: number, _y: number) => number) | null = null;
let nTemp: ((_x: number, _y: number) => number) | null = null;
let nMoist: ((_x: number, _y: number) => number) | null = null;

function initTerrainGenerator(seed: string) {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
        hash = ((hash << 5) - hash) + seed.charCodeAt(i);
        hash |= 0;
    }
    terrainSeed = Math.abs(hash);

    // Initialize noise generators
    nElev = makeNoise2D(terrainSeed ^ 0x11a2);
    nTemp = makeNoise2D(terrainSeed ^ 0x33b4);
    nMoist = makeNoise2D(terrainSeed ^ 0x55c6);
}

function sampleOverworld(pos: { x: number; y: number }): { height: number; moisture: number; biome: string } {
    if (!nElev || !nTemp || !nMoist) {
        return { height: 0.5, moisture: 0.5, biome: 'Grassland' };
    }

    const freq = 0.004 / 1.25; // World scale
    const warpAmp = 20 * 2.5;

    // Domain warp for organic shapes
    const wx = pos.x * freq, wy = pos.y * freq;
    const dwx = wx + fbm2(nElev, wx * 0.8, wy * 0.8, 4, 2.01, 0.55) * (warpAmp * 0.0025);
    const dwy = wy + fbm2(nMoist, wx * 0.7, wy * 0.7, 4, 2.03, 0.56) * (warpAmp * 0.0025);

    // Generate terrain values with FBM
    let height = fbm2(nElev, dwx, dwy, 6, 2.0, 0.5);
    let temperature = fbm2(nTemp, wx * 0.7, wy * 0.7, 4, 2.0, 0.5);
    let moisture = fbm2(nMoist, wx * 0.75, wy * 0.75, 4, 2.0, 0.5);

    // Normalize to [0,1]
    height = (height + 1) / 2;
    temperature = (temperature + 1) / 2;
    moisture = (moisture + 1) / 2;

    // Determine biome with better logic
    const seaLevel = 0.36; // Lower sea level for more land
    const snowLevel = 0.68;

    let biome = 'Grassland';
    if (height < seaLevel) {
        biome = height < seaLevel - 0.08 ? 'DeepOcean' : 'Ocean';
    } else if (height < seaLevel + 0.03) {
        biome = 'Beach';
    } else if (height > snowLevel) {
        biome = 'Snow';
    } else if (height > 0.65) {
        biome = 'Mountain';
    } else if (moisture > 0.7 && height < 0.55) {
        biome = 'Swamp';
    } else if (moisture > 0.6) {
        biome = temperature > 0.65 ? 'Jungle' : 'Forest';
    } else if (moisture < 0.35) {
        biome = 'Desert';
    } else if (temperature < 0.35) {
        biome = 'Taiga';
    } else {
        biome = height > 0.5 ? 'Hills' : 'Grassland';
    }

    return { height, moisture, biome };
}

// Procedural POI generation
function generatePOIs(seed: number, worldSize = 1000): POI[] {
    const pois: POI[] = [];
    const rng = (x: number) => (Math.sin(x * 12.9898 + seed) * 43758.5453) % 1;
    
    // Generate settlements based on biome suitability
    const candidates = 100; // Sample 100 random positions
    for (let i = 0; i < candidates; i++) {
        const x = (rng(i * 3) * 2 - 1) * worldSize;
        const y = (rng(i * 3 + 1) * 2 - 1) * worldSize;
        
        const sample = sampleOverworld({ x, y });
        
        // Only place settlements on suitable terrain
        if (sample.height < 0.36 || sample.height > 0.7) continue; // No water or high mountains
        if (sample.biome === 'Swamp' || sample.biome === 'Desert') continue; // Avoid harsh biomes
        
        // Determine settlement type based on terrain quality
        const quality = sample.height * sample.moisture;
        let tag: string;
        const roll = rng(i * 3 + 2);
        
        if (quality > 0.35 && roll < 0.05) tag = 'CITY';
        else if (quality > 0.3 && roll < 0.15) tag = 'TOWN';
        else if (quality > 0.25 && roll < 0.35) tag = 'VILLAGE';
        else if (roll < 0.45) tag = 'HAMLET';
        else continue; // Skip this position
        
        pois.push({ id: `settlement-${i}`, pos: { x, y }, tag });
    }
    
    // Add fortresses (strategic positions)
    for (let i = 0; i < 5; i++) {
        const angle = (i / 5) * Math.PI * 2;
        const dist = worldSize * 0.6;
        const x = Math.cos(angle) * dist;
        const y = Math.sin(angle) * dist;
        pois.push({ id: `fortress-${i}`, pos: { x, y }, tag: 'FORTRESS' });
    }
    
    // Add ruins/dungeons (scattered)
    for (let i = 0; i < 15; i++) {
        const x = (rng(i * 7 + 100) * 2 - 1) * worldSize * 0.8;
        const y = (rng(i * 7 + 101) * 2 - 1) * worldSize * 0.8;
        const tag = rng(i * 7 + 102) < 0.5 ? 'RUIN' : 'DUNGEON';
        pois.push({ id: `site-${i}`, pos: { x, y }, tag });
    }
    
    return pois;
}

// Create terrain data for road pathfinding
function createTerrainDataForRoads(worldSize = 1000, resolution = 4): TerrainData {
    const width = Math.floor(worldSize / resolution);
    const height = Math.floor(worldSize / resolution);
    const tileCost = new Float32Array(width * height);
    
    // Sample terrain and create cost field
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const wx = (x - width / 2) * resolution;
            const wy = (y - height / 2) * resolution;
            const sample = sampleOverworld({ x: wx, y: wy });
            
            let cost = 1.0;
            
            // Water is impassable (will be set to INF by buildCostField)
            if (sample.height < 0.36) cost = 1e9;
            // Mountains are difficult
            else if (sample.height > 0.7) cost = 1e9;
            // Hills are slower
            else if (sample.height > 0.55) cost = 2.5;
            // Forests are slower
            else if (sample.biome === 'Forest' || sample.biome === 'Jungle') cost = 1.8;
            // Swamps are very slow
            else if (sample.biome === 'Swamp') cost = 3.0;
            // Grassland is fast
            else if (sample.biome === 'Grassland') cost = 0.8;
            
            tileCost[y * width + x] = cost;
        }
    }
    
    return { width, height, tileCost, seaLevel: 0.36 };
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
    const lastFrameRef = useRef<number>(performance.now());

    // UI state (for debug overlay reactivity)
    const [debugInfo, setDebugInfo] = useState({ x: 0, y: 0, chunks: 0, cache: 0 });
    
    // Roads state
    const roadsGeneratedRef = useRef(false);
    const roadsContainerRef = useRef<Container | null>(null);

    // Initialize terrain generator
    useEffect(() => {
        console.log('🌱 [Pixi] Initializing terrain generator with seed:', seed);
        setTimeout(() => {
            initTerrainGenerator(seed);
            terrainReadyRef.current = true;
            console.log('✅ [Pixi] Terrain generator ready!');
        }, 100);
    }, [seed]);
    
    // Generate roads when terrain is ready
    useEffect(() => {
        if (!terrainReadyRef.current || roadsGeneratedRef.current || !roadsContainerRef.current) return;
        
        console.log('🛣️ [Pixi] Generating roads...');
        const seedNum = parseInt(seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0).toString());
        
        const pois = generatePOIs(seedNum, 500); // 500 unit world size
        console.log(`📍 [Pixi] Generated ${pois.length} POIs`);
        
        const terrainData = createTerrainDataForRoads(1000, 4); // 1000 units, 4 pixels per sample
        const { roads, nodes } = connectPOIs(pois, terrainData, {
            kHub: 3,
            maxSpur: 420,
            maxTrail: 300,
        });
        
        console.log(`🛣️ [Pixi] Generated ${roads.length} roads connecting ${nodes.length} nodes`);
        
        // Render roads
        paintRoadsPIXI(roadsContainerRef.current, roads, { zIndex: 10 });
        paintRoadEndpointsPIXI(roadsContainerRef.current, nodes, { zIndex: 11 });
        
        roadsGeneratedRef.current = true;
        console.log('✅ [Pixi] Roads rendered!');
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

            // Create roads container (above terrain, below player)
            const roadsContainer = new Container();
            worldContainer.addChild(roadsContainer);
            roadsContainerRef.current = roadsContainer;

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

                // Update debug info periodically (every 10 frames for React overlay)
                if (Math.floor(now / 100) % 10 === 0) {
                    setDebugInfo({
                        x: posRef.current.x,
                        y: posRef.current.y,
                        chunks: renderedChunksRef.current.size,
                        cache: terrainCacheRef.current.size
                    });
                }

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
    const terrainColor = (_height: number, _moisture: number, biome: string): [number, number, number] => {
        // Water biomes with depth-based colors
        if (biome === 'DeepOcean') return [15, 45, 95];
        if (biome === 'Ocean') return [30, 90, 160];
        if (biome === 'Beach') return [238, 214, 175];

        // Land biomes with more varied colors
        switch (biome) {
            case 'Grassland': return [120, 180, 80];
            case 'Hills': return [140, 160, 90];
            case 'Forest': return [34, 139, 34];
            case 'Desert': return [238, 205, 144];
            case 'Swamp': return [100, 130, 100];
            case 'Taiga': return [70, 120, 80];
            case 'Tundra': return [180, 200, 195];
            case 'Snow': return [250, 250, 255];
            case 'Jungle': return [34, 180, 34];
            case 'Mountain': return [160, 140, 120];
            default: return [120, 180, 80]; // Default to grassland
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
                <div>📍 Pos: ({debugInfo.x.toFixed(1)}, {debugInfo.y.toFixed(1)})</div>
                <div>📏 Distance: {Math.sqrt(debugInfo.x * debugInfo.x + debugInfo.y * debugInfo.y).toFixed(1)} units from spawn</div>
                <div>🗺️ Chunk: ({Math.floor(debugInfo.x / 32)}, {Math.floor(debugInfo.y / 32)}) | Size: 32 units</div>
                <div>🎨 GPU: Pixi.js v8 | Loaded: {debugInfo.chunks} chunks</div>
                <div>💾 Cache: {debugInfo.cache} terrain samples</div>
                <div style={{ color: fps >= 55 ? '#0f0' : fps >= 30 ? '#ff0' : '#f00' }}>
                    ⚡ FPS: {fps}
                </div>
            </div>
        </div>
    );
}
