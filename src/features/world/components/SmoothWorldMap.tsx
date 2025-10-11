/**
 * Smooth World Map - Organic Continuous Terrain (OPTIMIZED)
 * 
 * HYBRID ARCHITECTURE: Smooth overworld exploration (like M&M)
 * Hex battles will be generated from this terrain when combat triggers.
 * 
 * Features:
 * - 360° WASD movement with momentum
 * - Drag-to-pan with pointer capture
 * - Ctrl+wheel zoom (anchored to cursor position)
 * - Normal wheel for panning
 * - Ref-based state for 60fps performance
 * - DPR-aware rendering for Retina displays
 * - Noise-based procedural terrain
 * - Biome-based coloring
 */

import React, { useEffect, useRef } from 'react';
import { WorldPos } from '../../../core/types';
import { sampleOverworld, initTerrainGenerator } from '../terrain/terrainGenerator';

interface SmoothWorldMapProps {
    seed: string;
    onEncounter?: (_pos: WorldPos) => void;
    onSettlement?: (_pos: WorldPos) => void;
}

type Keys = Record<string, boolean>;

export default function SmoothWorldMap({ seed }: SmoothWorldMapProps) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    // Mutable sim state (no React setState during loop for better performance)
    const posRef = useRef<WorldPos>({ x: 0, y: 0 });
    const velRef = useRef({ x: 0, y: 0 });
    const scaleRef = useRef<number>(8); // px per world unit (zoom) - matches old scale
    const keysRef = useRef<Keys>({});
    const draggingRef = useRef(false);
    const dragLastRef = useRef<{ x: number; y: number } | null>(null);

    const rafRef = useRef<number>(0);
    const timeRef = useRef<number>(performance.now());
    const dprRef = useRef<number>(Math.max(1, window.devicePixelRatio || 1));

    // Terrain cache to avoid resampling
    const terrainCacheRef = useRef<Map<string, { r: number; g: number; b: number }>>(new Map());
    const terrainReadyRef = useRef<boolean>(false);

    // Initialize terrain generator with seed
    useEffect(() => {
        console.log('🌱 About to init terrain generator...');
        // Delay initialization to avoid freezing
        setTimeout(() => {
            try {
                initTerrainGenerator(seed);
                terrainReadyRef.current = true;
                console.log('✅ Terrain generator initialized');
            } catch (err) {
                console.error('❌ Terrain generator failed:', err);
            }
        }, 100); // Small delay to let UI render first
    }, [seed]);

    // ResizeObserver to avoid resetting canvas every frame
    useEffect(() => {
        const cvs = canvasRef.current;
        if (!cvs) {
            console.error('❌ Canvas ref not available');
            return;
        }

        const parent = cvs.parentElement;
        if (!parent) {
            console.error('❌ Canvas parent not available');
            return;
        }

        console.log('✅ Setting up ResizeObserver for parent container');
        const ro = new ResizeObserver(() => {
            console.log('📐 Parent container resized');
            resizeCanvas(cvs);
        });
        ro.observe(parent); // Watch parent, not canvas!
        resizeCanvas(cvs);
        return () => ro.disconnect();
    }, []);

    // Keyboard
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            const k = e.key.toLowerCase();
            if (e.type === 'keydown') keysRef.current[k] = true;
            else keysRef.current[k] = false;

            // Prevent arrow key scrolling
            if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) {
                e.preventDefault();
            }
        };
        window.addEventListener('keydown', onKey);
        window.addEventListener('keyup', onKey);
        return () => {
            window.removeEventListener('keydown', onKey);
            window.removeEventListener('keyup', onKey);
        };
    }, []);

    // Wheel: zoom by default; Shift+wheel to pan
    useEffect(() => {
        const cvs = canvasRef.current!;
        const onWheel = (e: WheelEvent) => {
            e.preventDefault(); // Always prevent page scroll

            // Shift+wheel for panning (uncommon, so requires modifier)
            if (e.shiftKey) {
                const panSpeed = 1 / scaleRef.current;
                posRef.current.x += e.deltaX * panSpeed;
                posRef.current.y += e.deltaY * panSpeed;
                return;
            }

            // Default: zoom in/out
            const oldScale = scaleRef.current;
            const zoomFactor = Math.exp(-e.deltaY / 400); // gentle zoom
            const newScale = clamp(oldScale * zoomFactor, 2, 32);

            // Zoom around mouse position (world-space anchored zoom)
            const rect = cvs.getBoundingClientRect();
            const mx = e.clientX - rect.left;
            const my = e.clientY - rect.top;
            const dpr = dprRef.current;

            const worldBefore = screenToWorld(mx * dpr, my * dpr, cvs, posRef.current, oldScale);
            scaleRef.current = newScale;
            const worldAfter = screenToWorld(mx * dpr, my * dpr, cvs, posRef.current, newScale);

            // Adjust camera so the point under cursor stays fixed
            posRef.current.x += worldBefore.x - worldAfter.x;
            posRef.current.y += worldBefore.y - worldAfter.y;
        };

        cvs.addEventListener('wheel', onWheel, { passive: false });
        return () => cvs.removeEventListener('wheel', onWheel as any);
    }, []);

    // Pointer drag to pan
    useEffect(() => {
        const cvs = canvasRef.current!;
        const onDown = (e: PointerEvent) => {
            draggingRef.current = true;
            cvs.setPointerCapture(e.pointerId);
            dragLastRef.current = { x: e.clientX, y: e.clientY };
        };
        const onMove = (e: PointerEvent) => {
            if (!draggingRef.current || !dragLastRef.current) return;
            const dx = e.clientX - dragLastRef.current.x;
            const dy = e.clientY - dragLastRef.current.y;
            dragLastRef.current = { x: e.clientX, y: e.clientY };
            const s = scaleRef.current;
            posRef.current.x -= dx / s;
            posRef.current.y -= dy / s;
        };
        const onUp = (e: PointerEvent) => {
            draggingRef.current = false;
            dragLastRef.current = null;
            cvs.releasePointerCapture(e.pointerId);
        };
        cvs.addEventListener('pointerdown', onDown);
        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp);
        return () => {
            cvs.removeEventListener('pointerdown', onDown);
            window.removeEventListener('pointermove', onMove);
            window.removeEventListener('pointerup', onUp);
        };
    }, []);

    // Main loop — no React state in here for maximum performance
    useEffect(() => {
        let frameCount = 0;
        let lastFpsTime = performance.now();
        let fps = 60;
        let firstFrame = true;

        const tick = () => {
            const now = performance.now();
            const dt = Math.min(0.05, (now - timeRef.current) / 1000); // clamp dt
            timeRef.current = now;

            // FPS calculation
            frameCount++;
            if (now - lastFpsTime >= 1000) {
                fps = frameCount;
                frameCount = 0;
                lastFpsTime = now;
            }

            // Debug first frame
            if (firstFrame) {
                const cvs = canvasRef.current;
                console.log('🎬 First frame render:', {
                    canvasSize: cvs ? `${cvs.width}x${cvs.height}` : 'no canvas',
                    position: posRef.current,
                    scale: scaleRef.current,
                    dpr: dprRef.current
                });
                firstFrame = false;
            }

            step(dt);
            render(fps);

            rafRef.current = requestAnimationFrame(tick);
        };

        console.log('🚀 Starting animation loop');
        rafRef.current = requestAnimationFrame(tick);
        return () => {
            console.log('🛑 Stopping animation loop');
            cancelAnimationFrame(rafRef.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="w-full h-full bg-black relative">
            <canvas
                ref={canvasRef}
                className="block touch-none"
                style={{
                    cursor: 'grab',
                    width: '100%',
                    height: '100%',
                    display: 'block'
                }}
            />

            {/* Controls overlay */}
            <div className="absolute top-4 left-4 text-white text-sm font-mono bg-black bg-opacity-70 px-3 py-2 rounded pointer-events-none">
                <div>Position: ({posRef.current.x.toFixed(1)}, {posRef.current.y.toFixed(1)})</div>
                <div>Zoom: {(scaleRef.current / 8).toFixed(2)}x (Ctrl+Wheel)</div>
                <div className="text-xs text-gray-400 mt-2">
                    WASD/Arrows: Move • Drag: Pan • Ctrl+Wheel: Zoom
                </div>
            </div>
        </div>
    );

    // ---- Helper Functions ----

    function step(dt: number) {
        // Keyboard movement (WASD/Arrows)
        const k = keysRef.current;
        const aim = { x: 0, y: 0 };
        if (k['w'] || k['arrowup']) aim.y -= 1;
        if (k['s'] || k['arrowdown']) aim.y += 1;
        if (k['a'] || k['arrowleft']) aim.x -= 1;
        if (k['d'] || k['arrowright']) aim.x += 1;

        // Diagonal movement normalization
        const len = Math.hypot(aim.x, aim.y) || 1;
        const ax = (aim.x / len) * 20; // accel units/sec^2
        const ay = (aim.y / len) * 20;

        // Critically damped-ish motion with momentum
        velRef.current.x = (velRef.current.x + ax * dt) * 0.90;
        velRef.current.y = (velRef.current.y + ay * dt) * 0.90;

        // Update position
        posRef.current.x += velRef.current.x * dt;
        posRef.current.y += velRef.current.y * dt;

        // Validate position to prevent NaN
        if (!isFinite(posRef.current.x) || !isFinite(posRef.current.y)) {
            console.error('Invalid position detected, resetting to origin');
            posRef.current = { x: 0, y: 0 };
            velRef.current = { x: 0, y: 0 };
        }
    }

    function render(fps: number) {
        const cvs = canvasRef.current;
        if (!cvs) {
            console.warn('⚠️ Render called but no canvas ref');
            return;
        }

        const ctx = cvs.getContext('2d');
        if (!ctx) {
            console.warn('⚠️ Could not get 2d context');
            return;
        }

        const dpr = dprRef.current;

        try {
            // Clear with a visible color to debug
            ctx.fillStyle = '#1a1a2e'; // Dark blue-ish background
            ctx.fillRect(0, 0, cvs.width, cvs.height);

            // Enable image smoothing for better rendering
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';

            // Viewport info
            const scale = scaleRef.current;
            const halfW = cvs.width / 2;
            const halfH = cvs.height / 2;
            const center = posRef.current;

            // Validate scale
            if (!isFinite(scale) || scale <= 0) {
                console.error('Invalid scale:', scale);
                return;
            }

            // Terrain — smaller cells for smoother look
            // Use logical pixels (not device pixels) for loop to reduce iterations
            const logicalW = cvs.width / dpr;
            const logicalH = cvs.height / dpr;
            const cellSize = 8; // Reduced from 16 for smoother rendering

            // Only render terrain if generator is ready
            if (!terrainReadyRef.current) {
                // Draw loading pattern
                ctx.fillStyle = '#2a2a4e';
                ctx.font = `${24 * dpr}px monospace`;
                ctx.fillText('Initializing terrain...', halfW - 100 * dpr, halfH);
            } else {
                // Compute world extents per cell
                for (let ly = 0; ly < logicalH; ly += cellSize) {
                    for (let lx = 0; lx < logicalW; lx += cellSize) {
                        // Convert logical screen position to world position
                        const wx = center.x + (lx * dpr - halfW) / scale;
                        const wy = center.y + (ly * dpr - halfH) / scale;

                        // Validate world coordinates
                        if (!isFinite(wx) || !isFinite(wy)) continue;

                        // Create cache key (round to 0.25 world units for better granularity)
                        const cacheKey = `${Math.round(wx * 4) / 4},${Math.round(wy * 4) / 4}`;

                        let color = terrainCacheRef.current.get(cacheKey);
                        if (!color) {
                            try {
                                const s = sampleOverworld({ x: wx, y: wy });
                                const [r, g, b] = terrainColor(s.height, s.moisture, s.biome);
                                color = { r, g, b };
                                terrainCacheRef.current.set(cacheKey, color);

                                // Limit cache size
                                if (terrainCacheRef.current.size > 10000) {
                                    const firstKey = terrainCacheRef.current.keys().next().value;
                                    if (firstKey) terrainCacheRef.current.delete(firstKey);
                                }
                            } catch (err) {
                                // Skip failed samples silently
                                continue;
                            }
                        }

                        if (color) {
                            ctx.fillStyle = `rgb(${color.r},${color.g},${color.b})`;
                            ctx.fillRect(lx * dpr, ly * dpr, cellSize * dpr + 1, cellSize * dpr + 1); // +1 to prevent gaps
                        }
                    }
                }
            }

            // Player marker at center with direction indicator
            const playerSize = 6 * dpr;

            // Outer glow
            ctx.shadowColor = '#00ffff';
            ctx.shadowBlur = 8 * dpr;
            ctx.beginPath();
            ctx.arc(halfW, halfH, playerSize, 0, Math.PI * 2);
            ctx.fillStyle = '#00ffff';
            ctx.fill();
            ctx.shadowBlur = 0;

            // Inner dot
            ctx.beginPath();
            ctx.arc(halfW, halfH, playerSize * 0.4, 0, Math.PI * 2);
            ctx.fillStyle = '#0088ff';
            ctx.fill();

            // Direction indicator if moving
            const speed = Math.hypot(velRef.current.x, velRef.current.y);
            if (speed > 0.1) {
                const angle = Math.atan2(velRef.current.y, velRef.current.x);
                const arrowLen = playerSize + 8 * dpr;
                const endX = halfW + Math.cos(angle) * arrowLen;
                const endY = halfH + Math.sin(angle) * arrowLen;

                ctx.strokeStyle = '#ffff00';
                ctx.lineWidth = 3 * dpr;
                ctx.beginPath();
                ctx.moveTo(halfW, halfH);
                ctx.lineTo(endX, endY);
                ctx.stroke();

                // Arrow tip
                ctx.fillStyle = '#ffff00';
                ctx.beginPath();
                ctx.arc(endX, endY, 3 * dpr, 0, Math.PI * 2);
                ctx.fill();
            }

            // Performance stats overlay (on canvas)
            ctx.fillStyle = fps < 30 ? '#ff4444' : fps < 50 ? '#ffaa44' : '#44ff44';
            ctx.font = `${12 * dpr}px monospace`;
            ctx.fillText(`${fps} FPS`, 10 * dpr, 20 * dpr);

            ctx.fillStyle = '#ffffff';
            ctx.fillText(`Cache: ${terrainCacheRef.current.size}`, 10 * dpr, 35 * dpr);
            ctx.fillText(`DPR: ${dpr.toFixed(1)}x`, 10 * dpr, 50 * dpr);
        } catch (err) {
            console.error('Render error:', err);
        }
    }

    function resizeCanvas(cvs: HTMLCanvasElement) {
        const dpr = Math.max(1, window.devicePixelRatio || 1);
        dprRef.current = dpr;

        // CRITICAL FIX: Use clientWidth/Height instead of getBoundingClientRect
        // getBoundingClientRect was returning the canvas buffer size, causing infinite growth!
        const W = Math.floor(cvs.clientWidth * dpr);
        const H = Math.floor(cvs.clientHeight * dpr);

        console.log('📏 Resize canvas:', {
            logical: `${cvs.clientWidth}x${cvs.clientHeight}`,
            device: `${W}x${H}`,
            dpr
        });

        if (cvs.width !== W || cvs.height !== H) {
            cvs.width = W;
            cvs.height = H;
        }
    }

    function screenToWorld(
        sx: number,
        sy: number,
        cvs: HTMLCanvasElement,
        center: WorldPos,
        scale: number
    ): WorldPos {
        // sx/sy are device pixels (after * dpr)
        const halfW = cvs.width / 2;
        const halfH = cvs.height / 2;
        return {
            x: center.x + (sx - halfW) / scale,
            y: center.y + (sy - halfH) / scale,
        };
    }

    function clamp(v: number, lo: number, hi: number) {
        return Math.max(lo, Math.min(hi, v));
    }

    function terrainColor(h: number, m: number, biome: string): [number, number, number] {
        // Biome-based palette matching the original system
        if (biome === 'water') return [26, 58, 90];
        if (biome === 'shore') return [60, 80, 90];
        if (biome === 'forest') return [22, 77, 36];
        if (biome === 'swamp') return [42, 61, 42];
        if (biome === 'desert') return [107, 94, 46];
        if (biome === 'hills') return [90, 81, 49];
        if (biome === 'mountains') return [120, 110, 100];
        if (biome === 'snow') return [220, 230, 240];
        if (biome === 'volcanic') return [80, 40, 30];

        // Default plains with height/moisture variation
        const g = 80 + Math.floor((h + 1) * 40);
        const moistureAdjust = Math.floor(m * 20);
        return [40 + moistureAdjust, clamp(Math.floor(g), 60, 160), 70 + moistureAdjust];
    }
}
