/**
 * Pixi World Map - CPU generated terrain + Pixi viewport
 *
 * This component renders the overworld terrain produced by the procedural
 * canvas pipeline (`pixiTerrainRenderer`) and wires it into a Pixi viewport
 * for smooth pan / zoom and WASD movement.
 */

import React, { useEffect, useRef, useState } from 'react';
import { Application, Container, Graphics, Text, TextStyle } from 'pixi.js';
import { Viewport } from 'pixi-viewport';
import { WorldPos } from '../../../core/types';
import {
    generateTerrain,
    pickPixelScale,
    setSeedAndRegenerate,
    TerrainOptionsOverrides
} from '../terrain/pixiTerrainRenderer';

interface PixiWorldMapProps {
    seed: string;
    onEncounter?: (_pos: WorldPos) => void;
    onSettlement?: (_pos: WorldPos) => void;
}

type Keys = Record<string, boolean>;

type TerrainApp = Application & {
    terrainLayer?: Container;
    overlayLayer?: Container;
};

const PLAYER_RADIUS = 10;
const ACCELERATION = 520;
const DRAG = 0.86;

const computeMapDimensions = (screenWidth: number, screenHeight: number) => {
    const minWidth = 1600;
    const minHeight = 900;
    const width = Math.max(minWidth, Math.ceil(screenWidth * 1.6));
    const height = Math.max(minHeight, Math.ceil(screenHeight * 1.6));
    return { width, height };
};

const attachTerrainLayers = (app: TerrainApp, viewport: Viewport) => {
    if (app.terrainLayer && app.terrainLayer.parent !== viewport) {
        app.terrainLayer.parent?.removeChild(app.terrainLayer);
        viewport.addChildAt(app.terrainLayer, 0);
    }
    if (app.overlayLayer && app.overlayLayer.parent !== viewport) {
        app.overlayLayer.parent?.removeChild(app.overlayLayer);
        viewport.addChild(app.overlayLayer);
    }
};

export default function PixiWorldMap({ seed }: PixiWorldMapProps) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const appRef = useRef<TerrainApp | null>(null);
    const viewportRef = useRef<Viewport | null>(null);

    const posRef = useRef<WorldPos>({ x: 0, y: 0 });
    const velRef = useRef({ x: 0, y: 0 });
    const keysRef = useRef<Keys>({});
    const terrainReadyRef = useRef(false);

    const mapSizeRef = useRef<{ width: number; height: number }>({ width: 0, height: 0 });
    const pixelScaleRef = useRef(1);

    const [fps, setFps] = useState(60);
    const fpsSamplesRef = useRef<number[]>([]);
    const lastFrameRef = useRef<number>(performance.now());

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const screenWidth = container.clientWidth || 1280;
        const screenHeight = container.clientHeight || 720;
        const mapSize = computeMapDimensions(screenWidth, screenHeight);
        mapSizeRef.current = mapSize;
        pixelScaleRef.current = pickPixelScale(mapSize.width, mapSize.height);

        const app = new Application() as TerrainApp;

        (async () => {
            await app.init({
                width: screenWidth,
                height: screenHeight,
                backgroundColor: 0x1a1a2e,
                resolution: window.devicePixelRatio || 1,
                autoDensity: true,
                antialias: false,
                powerPreference: 'high-performance'
            });

            container.appendChild(app.canvas as HTMLCanvasElement);
            appRef.current = app;

            const viewport = new Viewport({
                screenWidth,
                screenHeight,
                worldWidth: mapSize.width,
                worldHeight: mapSize.height,
                events: app.renderer.events
            });

            app.stage.addChild(viewport as any);
            viewportRef.current = viewport;

            viewport
                .drag({ mouseButtons: 'left' })
                .pinch()
                .wheel({ smooth: 3, percent: 0.1 })
                .decelerate({ friction: 0.9 })
                .clamp({
                    left: 0,
                    right: mapSize.width,
                    top: 0,
                    bottom: mapSize.height
                })
                .clampZoom({
                    minScale: 0.5,
                    maxScale: 8
                });

            viewport.setZoom(1, true);

            const initialOverrides: TerrainOptionsOverrides = {
                seed,
                width: mapSize.width,
                height: mapSize.height
            };
            generateTerrain(app, initialOverrides);
            attachTerrainLayers(app, viewport);
            terrainReadyRef.current = true;

            const player = new Graphics();
            player.circle(0, 0, PLAYER_RADIUS);
            player.fill(0xff2244);
            player.stroke({ width: 2, color: 0xffffff });
            viewport.addChild(player);

            const spawnX = mapSize.width / 2;
            const spawnY = mapSize.height / 2;
            posRef.current = { x: spawnX, y: spawnY };
            player.position.set(spawnX, spawnY);
            viewport.moveCenter(spawnX, spawnY);

            const fpsStyle = new TextStyle({
                fontFamily: 'monospace',
                fontSize: 14,
                fill: 0x00ff00
            });
            const fpsText = new Text({ text: 'FPS: 60', style: fpsStyle });
            fpsText.position.set(10, 10);
            app.stage.addChild(fpsText);

            app.ticker.add(() => {
                const now = performance.now();
                const dt = (now - lastFrameRef.current) / 1000;
                lastFrameRef.current = now;

                const currentFps = dt > 0 ? 1 / dt : 60;
                const samples = fpsSamplesRef.current;
                samples.push(currentFps);
                if (samples.length > 30) samples.shift();
                const avgFps = samples.reduce((a, b) => a + b, 0) / samples.length;
                const roundedFps = Math.round(avgFps);
                setFps(roundedFps);
                fpsText.text = `FPS: ${roundedFps}`;
                fpsText.style.fill = roundedFps >= 55 ? 0x00ff00 : roundedFps >= 30 ? 0xffff00 : 0xff0000;

                const keys = keysRef.current;
                let inputX = 0;
                let inputY = 0;

                if (keys['KeyW'] || keys['ArrowUp']) inputY -= 1;
                if (keys['KeyS'] || keys['ArrowDown']) inputY += 1;
                if (keys['KeyA'] || keys['ArrowLeft']) inputX -= 1;
                if (keys['KeyD'] || keys['ArrowRight']) inputX += 1;

                if (inputX !== 0 && inputY !== 0) {
                    inputX *= 0.707;
                    inputY *= 0.707;
                }

                velRef.current.x += inputX * ACCELERATION * dt;
                velRef.current.y += inputY * ACCELERATION * dt;

                velRef.current.x *= DRAG;
                velRef.current.y *= DRAG;

                posRef.current.x += velRef.current.x * dt;
                posRef.current.y += velRef.current.y * dt;

                const maxX = mapSizeRef.current.width;
                const maxY = mapSizeRef.current.height;
                posRef.current.x = Math.max(0, Math.min(maxX, posRef.current.x));
                posRef.current.y = Math.max(0, Math.min(maxY, posRef.current.y));

                player.position.set(posRef.current.x, posRef.current.y);
                viewport.moveCenter(posRef.current.x, posRef.current.y);
            });
        })();

        const onKeyDown = (event: KeyboardEvent) => {
            keysRef.current[event.code] = true;
        };
        const onKeyUp = (event: KeyboardEvent) => {
            keysRef.current[event.code] = false;
        };

        window.addEventListener('keydown', onKeyDown);
        window.addEventListener('keyup', onKeyUp);

        const onResize = () => {
            if (!containerRef.current || !appRef.current || !viewportRef.current) return;
            const w = containerRef.current.clientWidth || 1280;
            const h = containerRef.current.clientHeight || 720;
            appRef.current.renderer.resize(w, h);
            viewportRef.current.resize(w, h, mapSizeRef.current.width, mapSizeRef.current.height);
        };
        window.addEventListener('resize', onResize);

        return () => {
            window.removeEventListener('keydown', onKeyDown);
            window.removeEventListener('keyup', onKeyUp);
            window.removeEventListener('resize', onResize);
            if (appRef.current) {
                appRef.current.destroy(true, { children: true });
            }
            appRef.current = null;
            viewportRef.current = null;
            terrainReadyRef.current = false;
            fpsSamplesRef.current = [];
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (!appRef.current || !viewportRef.current || !terrainReadyRef.current) return;

        const overrides: TerrainOptionsOverrides = {
            width: mapSizeRef.current.width,
            height: mapSizeRef.current.height,
            forceRegenerate: true
        };

        setSeedAndRegenerate(appRef.current, seed, overrides);
        attachTerrainLayers(appRef.current, viewportRef.current);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [seed]);

    return (
        <div style={{ width: '100%', height: '100%', position: 'relative' }}>
            <div
                ref={containerRef}
                style={{
                    width: '100%',
                    height: '100%',
                    overflow: 'hidden',
                    touchAction: 'none'
                }}
            />

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
                    pointerEvents: 'none'
                }}
            >
                <div>WASD: Move | Mouse: Drag/Zoom</div>
                <div>
                    Pos: ({posRef.current.x.toFixed(0)}, {posRef.current.y.toFixed(0)})
                </div>
                <div>
                    Terrain: {mapSizeRef.current.width}×{mapSizeRef.current.height} px | pixelScale≈
                    {pixelScaleRef.current}
                </div>
                <div>Seed: {seed}</div>
                <div style={{ color: fps >= 55 ? '#0f0' : fps >= 30 ? '#ff0' : '#f00' }}>
                    FPS: {fps}
                </div>
            </div>
        </div>
    );
}
