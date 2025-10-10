/**
 * Professional Hex World Renderer
 * Renders overworld map with hex grid using HexStage wrapper
 * Features: biomes, settlements, encounters, player position, fog of war
 */

import React, { useRef, useState, useCallback, useMemo } from 'react';
import { defineHex, Grid, rectangle, Hex, Orientation } from 'honeycomb-grid';
import HexStage from '../../battle/components/HexStage';
import type { EncounterType } from '../encounters/types';

interface WorldTile {
    q: number;
    r: number;
    biome: string;
    settlement?: Settlement | null;
    encounter?: Encounter | null;
    explored: boolean;
}

interface Settlement {
    type: 'city' | 'town' | 'village' | 'hut' | 'shrine' | 'outpost' | 'trading_post';
    name: string;
    emoji: string;
}

interface Encounter {
    type: EncounterType;
    name: string;
    emoji: string;
    danger: 'safe' | 'low' | 'medium' | 'high' | 'extreme';
}

interface PlayerPosition {
    q: number;
    r: number;
}

interface WorldHexRendererProps {
    tiles: WorldTile[];
    playerPos: PlayerPosition;
    width: number;
    height: number;
    onTileClick?: (_q: number, _r: number) => void;
    showGrid?: boolean;
}

// Define world hex tile
const WorldHexTile = defineHex({
    dimensions: 40, // Larger hexes for overworld
    orientation: Orientation.POINTY
});

interface Camera {
    x: number;
    y: number;
    scale: number;
}

export function WorldHexRenderer({
    tiles,
    playerPos,
    width,
    height,
    onTileClick,
    showGrid = true
}: WorldHexRendererProps) {
    const cameraRef = useRef<Camera>({ x: 0, y: 0, scale: 1 });
    const [hoveredHex, setHoveredHex] = useState<{ q: number; r: number } | null>(null);
    const [, forceRender] = useState(0);

    // Create grid using Honeycomb
    const grid = useMemo(() => {
        return new Grid(WorldHexTile, rectangle({ width, height }));
    }, [width, height]);

    // Get hex position from Honeycomb hex
    const getHexPosition = useCallback((hex: Hex) => {
        return { q: hex.col, r: hex.row };
    }, []);

    // Convert screen coordinates to world coordinates
    const screenToWorld = useCallback((canvasX: number, canvasY: number, canvas: HTMLCanvasElement) => {
        const camera = cameraRef.current;
        const centerX = canvas.width / (2 * window.devicePixelRatio);
        const centerY = canvas.height / (2 * window.devicePixelRatio);

        const worldX = (canvasX - centerX - camera.x) / camera.scale;
        const worldY = (canvasY - centerY - camera.y) / camera.scale;

        const gridWidth = grid.pixelWidth;
        const gridHeight = grid.pixelHeight;
        const adjustedX = worldX + gridWidth / 2;
        const adjustedY = worldY + gridHeight / 2;

        return { x: adjustedX, y: adjustedY };
    }, [grid]);

    // Get hex from screen coordinates
    const getHexFromScreen = useCallback((canvasX: number, canvasY: number, canvas: HTMLCanvasElement) => {
        try {
            const worldPos = screenToWorld(canvasX, canvasY, canvas);
            const hex = grid.pointToHex({ x: worldPos.x, y: worldPos.y });

            if (hex) {
                const pos = getHexPosition(hex);
                if (pos.q >= 0 && pos.q < width && pos.r >= 0 && pos.r < height) {
                    return pos;
                }
            }
        } catch (_error) {
            // Silently handle coordinate conversion errors
        }
        return null;
    }, [screenToWorld, grid, getHexPosition, width, height]);

    // Canvas initialization
    const handleInit = useCallback((_ctx: CanvasRenderingContext2D, _canvas: HTMLCanvasElement) => {
        const camera = cameraRef.current;
        if (camera.x === 0 && camera.y === 0 && camera.scale === 1) {
            camera.x = 0;
            camera.y = 0;
            camera.scale = 1;
        }
    }, []);

    // Get biome color
    const getBiomeColor = useCallback((biome: string): string => {
        const biomeColors: Record<string, string> = {
            'Ocean': '#0ea5e9',
            'Coast': '#38bdf8',
            'Desert': '#eab308',
            'Grass': '#84cc16',
            'Forest': '#16a34a',
            'Mountain': '#64748b',
            'Swamp': '#10b981',
            'Jungle': '#065f46',
            'Taiga': '#0e7490',
            'Tundra': '#94a3b8',
            'Savanna': '#f59e0b',
            'Snow': '#e2e8f0'
        };
        return biomeColors[biome] || '#4a7c59';
    }, []);

    // Main render function
    const handleRender = useCallback((ctx: CanvasRenderingContext2D, _t: number) => {
        const canvas = ctx.canvas;
        const camera = cameraRef.current;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();

        // Apply camera transform
        const centerX = canvas.width / (2 * window.devicePixelRatio);
        const centerY = canvas.height / (2 * window.devicePixelRatio);
        ctx.translate(centerX + camera.x, centerY + camera.y);
        ctx.scale(camera.scale, camera.scale);

        // Center the grid
        const gridWidth = grid.pixelWidth;
        const gridHeight = grid.pixelHeight;
        ctx.translate(-gridWidth / 2, -gridHeight / 2);

        // Draw hex grid
        if (showGrid) {
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 1 / camera.scale;

            grid.forEach(hex => {
                const { x, y } = hex;
                drawHexagon(ctx, x, y, hex.dimensions.xRadius);
            });
        }

        // Draw terrain tiles
        grid.forEach(hex => {
            const pos = { q: hex.col, r: hex.row };
            const tile = tiles.find(t => t.q === pos.q && t.r === pos.r);

            if (tile) {
                const { x, y } = hex;

                if (!tile.explored) {
                    // Fog of war
                    ctx.fillStyle = '#1a1a1a';
                    fillHexagon(ctx, x, y, hex.dimensions.xRadius);
                } else {
                    // Biome color
                    ctx.fillStyle = getBiomeColor(tile.biome);
                    fillHexagon(ctx, x, y, hex.dimensions.xRadius);

                    // Settlement marker
                    if (tile.settlement) {
                        ctx.fillStyle = '#fbbf24';
                        ctx.beginPath();
                        ctx.arc(x, y, hex.dimensions.xRadius * 0.4, 0, Math.PI * 2);
                        ctx.fill();

                        // Settlement emoji
                        ctx.fillStyle = '#fff';
                        ctx.font = `${hex.dimensions.xRadius * 0.8}px Arial`;
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillText(tile.settlement.emoji, x, y);
                    }

                    // Encounter marker
                    if (tile.encounter && !tile.settlement) {
                        const dangerColors: Record<string, string> = {
                            'safe': '#10b981',
                            'low': '#f59e0b',
                            'medium': '#f97316',
                            'high': '#ef4444',
                            'extreme': '#991b1b'
                        };
                        ctx.fillStyle = dangerColors[tile.encounter.danger] || '#6b7280';
                        ctx.beginPath();
                        ctx.arc(x, y, hex.dimensions.xRadius * 0.3, 0, Math.PI * 2);
                        ctx.fill();

                        // Encounter emoji
                        ctx.fillStyle = '#fff';
                        ctx.font = `${hex.dimensions.xRadius * 0.6}px Arial`;
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillText(tile.encounter.emoji, x, y);
                    }
                }
            }
        });

        // Draw player position
        const playerHex = grid.getHex({ col: playerPos.q, row: playerPos.r });
        if (playerHex) {
            const { x, y } = playerHex;

            // Player glow
            ctx.fillStyle = 'rgba(59, 130, 246, 0.3)';
            ctx.beginPath();
            ctx.arc(x, y, playerHex.dimensions.xRadius * 1.2, 0, Math.PI * 2);
            ctx.fill();

            // Player marker
            ctx.fillStyle = '#3b82f6';
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2 / camera.scale;
            ctx.beginPath();
            ctx.arc(x, y, playerHex.dimensions.xRadius * 0.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Player symbol
            ctx.fillStyle = '#fff';
            ctx.font = `bold ${playerHex.dimensions.xRadius * 0.8}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('⚔️', x, y);
        }

        // Highlight hovered hex
        if (hoveredHex) {
            const hex = grid.getHex({ col: hoveredHex.q, row: hoveredHex.r });
            if (hex) {
                const { x, y } = hex;
                ctx.strokeStyle = '#fbbf24';
                ctx.lineWidth = 3 / camera.scale;
                drawHexagon(ctx, x, y, hex.dimensions.xRadius);
            }
        }

        ctx.restore();
    }, [grid, tiles, playerPos, showGrid, hoveredHex, getBiomeColor]);

    // Pan handler
    const handlePan = useCallback((dx: number, dy: number) => {
        cameraRef.current.x += dx;
        cameraRef.current.y += dy;
    }, []);

    // Zoom handler
    const handleZoom = useCallback((delta: number, _cx: number, _cy: number) => {
        const camera = cameraRef.current;
        const zoomFactor = 1 - delta * 0.001;
        camera.scale = Math.max(0.5, Math.min(3, camera.scale * zoomFactor));
    }, []);

    // Click handler
    const handleClick = useCallback((canvasX: number, canvasY: number, canvas: HTMLCanvasElement) => {
        const hexPos = getHexFromScreen(canvasX, canvasY, canvas);
        if (hexPos && onTileClick) {
            onTileClick(hexPos.q, hexPos.r);
        }
    }, [getHexFromScreen, onTileClick]);

    // Hover handler
    const handleHover = useCallback((canvasX: number, canvasY: number, canvas: HTMLCanvasElement) => {
        const hexPos = getHexFromScreen(canvasX, canvasY, canvas);
        if (!hoveredHex || !hexPos || hoveredHex.q !== hexPos.q || hoveredHex.r !== hexPos.r) {
            setHoveredHex(hexPos);
        }
    }, [getHexFromScreen, hoveredHex]);

    // Hover end handler
    const handleHoverEnd = useCallback(() => {
        setHoveredHex(null);
    }, []);

    // Reset view function
    const resetView = useCallback(() => {
        cameraRef.current.x = 0;
        cameraRef.current.y = 0;
        cameraRef.current.scale = 1;
        forceRender(prev => prev + 1);
    }, []);

    return (
        <div className="relative w-full h-full bg-gray-900">
            <HexStage
                init={handleInit}
                onRender={handleRender}
                pan={handlePan}
                zoom={handleZoom}
                onClick={handleClick}
                onHover={handleHover}
                onHoverEnd={handleHoverEnd}
            />

            {/* Reset view button */}
            <button
                onClick={resetView}
                className="absolute top-4 right-4 px-3 py-2 bg-gray-800 text-white rounded hover:bg-gray-700"
                title="Reset camera view"
            >
                🔄 Reset View
            </button>

            {/* Hovered hex info */}
            {hoveredHex && (
                <div className="absolute bottom-4 left-4 bg-black bg-opacity-75 text-white p-2 rounded text-sm">
                    <div>Hex: ({hoveredHex.q}, {hoveredHex.r})</div>
                    {tiles.find(t => t.q === hoveredHex.q && t.r === hoveredHex.r)?.biome && (
                        <div>Biome: {tiles.find(t => t.q === hoveredHex.q && t.r === hoveredHex.r)!.biome}</div>
                    )}
                </div>
            )}
        </div>
    );
}

// Helper functions
function drawHexagon(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i;
        const px = x + size * Math.cos(angle);
        const py = y + size * Math.sin(angle);
        if (i === 0) {
            ctx.moveTo(px, py);
        } else {
            ctx.lineTo(px, py);
        }
    }
    ctx.closePath();
    ctx.stroke();
}

function fillHexagon(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i;
        const px = x + size * Math.cos(angle);
        const py = y + size * Math.sin(angle);
        if (i === 0) {
            ctx.moveTo(px, py);
        } else {
            ctx.lineTo(px, py);
        }
    }
    ctx.closePath();
    ctx.fill();
}
