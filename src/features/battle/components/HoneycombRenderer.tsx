/**
 * Professional Hex Battle Renderer using HexStage wrapper
 * Implements drag-to-pan, wheel zoom, no-scroll hover
 */

import React, { useRef, useState, useCallback, useMemo } from 'react';
import { defineHex, Grid, rectangle, Hex, Orientation } from 'honeycomb-grid';
import type { BattleState, HexPosition, Unit } from '../types';
import HexStage from './HexStage';

interface HoneycombBattleCanvasProps {
    state: BattleState;
    onTileClick?: (_pos: HexPosition) => void;
    selectedUnit?: string;
    targetHex?: HexPosition;
    showGrid?: boolean;
}

// Define our custom hex tile with battle data
const BattleTile = defineHex({
    dimensions: 30, // Size of hexagons
    orientation: Orientation.POINTY // Classic pointy-top hexagons
});

// Camera state for pan/zoom
interface Camera {
    x: number;
    y: number;
    scale: number;
}

export function HoneycombBattleCanvas({
    state,
    onTileClick,
    selectedUnit,
    targetHex,
    showGrid = true
}: HoneycombBattleCanvasProps) {
    const cameraRef = useRef<Camera>({ x: 0, y: 0, scale: 1 });
    const [hoveredHex, setHoveredHex] = useState<HexPosition | null>(null);
    const [, forceRender] = useState(0);

    // Create grid using Honeycomb (memoized to prevent recreation)
    const grid = useMemo(() => {
        return new Grid(BattleTile, rectangle({
            width: state.grid.width,
            height: state.grid.height
        }));
    }, [state.grid.width, state.grid.height]);

    // Convert our hex position to Honeycomb hex
    const _getHoneycombHex = useCallback((pos: HexPosition): Hex => {
        return new BattleTile({ col: pos.q, row: pos.r });
    }, []);

    // Convert Honeycomb hex to our hex position
    const getHexPosition = useCallback((hex: Hex): HexPosition => {
        return { q: hex.col, r: hex.row };
    }, []);

    // Convert screen coordinates to world coordinates
    const screenToWorld = useCallback((canvasX: number, canvasY: number, canvas: HTMLCanvasElement) => {
        const camera = cameraRef.current;
        const centerX = canvas.width / (2 * window.devicePixelRatio);
        const centerY = canvas.height / (2 * window.devicePixelRatio);

        // Convert to world coordinates by reversing the camera transform
        const worldX = (canvasX - centerX - camera.x) / camera.scale;
        const worldY = (canvasY - centerY - camera.y) / camera.scale;

        // Adjust for grid centering
        const gridWidth = grid.pixelWidth;
        const gridHeight = grid.pixelHeight;
        const adjustedX = worldX + gridWidth / 2;
        const adjustedY = worldY + gridHeight / 2;

        return { x: adjustedX, y: adjustedY };
    }, [grid]);

    // Get hex position from screen coordinates
    const getHexFromScreen = useCallback((canvasX: number, canvasY: number, canvas: HTMLCanvasElement): HexPosition | null => {
        try {
            const worldPos = screenToWorld(canvasX, canvasY, canvas);
            const hex = grid.pointToHex({ x: worldPos.x, y: worldPos.y });

            if (hex) {
                const pos = getHexPosition(hex);
                // Check if within grid bounds
                if (pos.q >= 0 && pos.q < state.grid.width && pos.r >= 0 && pos.r < state.grid.height) {
                    return pos;
                }
            }
        } catch (error) {
            // Silently handle coordinate conversion errors
        }
        return null;
    }, [screenToWorld, grid, getHexPosition, state.grid.width, state.grid.height]);

    // Canvas initialization (only run once)
    const handleInit = useCallback((_ctx: CanvasRenderingContext2D, _canvas: HTMLCanvasElement) => {
        // Don't reset camera if it already has values (prevents reset on re-render)
        const camera = cameraRef.current;
        if (camera.x === 0 && camera.y === 0 && camera.scale === 1) {
            // Only set initial values if camera is at defaults
            camera.x = 0;
            camera.y = 0;
            camera.scale = 1;
        }
    }, []);

    // Main render function (stabilized to prevent resets)
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
            ctx.strokeStyle = '#444';
            ctx.lineWidth = 1 / camera.scale;

            grid.forEach(hex => {
                const { x, y } = hex;
                drawHexagon(ctx, x, y, hex.dimensions.xRadius);
            });
        }

        // Draw terrain tiles
        grid.forEach(hex => {
            const pos = { q: hex.col, r: hex.row }; // Direct conversion instead of function call
            const tile = state.grid.tiles.find(t => t.q === pos.q && t.r === pos.r);

            if (tile) {
                ctx.fillStyle = getTerrainColor(tile.terrain);
                const { x, y } = hex;
                fillHexagon(ctx, x, y, hex.dimensions.xRadius);
            }
        });

        // Draw deployment zones during setup
        if (state.phase === "Setup") {
            // Friendly deployment (green)
            ctx.fillStyle = 'rgba(34, 197, 94, 0.3)';
            state.friendlyDeployment.hexes.forEach(hexPos => {
                const hex = new BattleTile({ col: hexPos.q, row: hexPos.r }); // Direct creation instead of function call
                const { x, y } = hex;
                fillHexagon(ctx, x, y, hex.dimensions.xRadius);
            });

            // Enemy deployment (red)
            ctx.fillStyle = 'rgba(239, 68, 68, 0.3)';
            state.enemyDeployment.hexes.forEach(hexPos => {
                const hex = new BattleTile({ col: hexPos.q, row: hexPos.r }); // Direct creation instead of function call
                const { x, y } = hex;
                fillHexagon(ctx, x, y, hex.dimensions.xRadius);
            });
        }

        // Draw units
        state.units.forEach(unit => {
            if (unit.pos && !unit.isDead) {
                const hex = new BattleTile({ col: unit.pos.q, row: unit.pos.r }); // Direct creation instead of function call
                const { x, y } = hex;
                const isSelected = selectedUnit === unit.id;
                drawUnit(ctx, x, y, unit, isSelected);
            }
        });

        // Highlight hovered hex
        if (hoveredHex) {
            const hex = new BattleTile({ col: hoveredHex.q, row: hoveredHex.r }); // Direct creation instead of function call
            const { x, y } = hex;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
            fillHexagon(ctx, x, y, hex.dimensions.xRadius);
        }

        // Highlight target hex
        if (targetHex) {
            const hex = new BattleTile({ col: targetHex.q, row: targetHex.r }); // Direct creation instead of function call
            const { x, y } = hex;
            ctx.fillStyle = 'rgba(239, 68, 68, 0.5)';
            fillHexagon(ctx, x, y, hex.dimensions.xRadius);
        }

        ctx.restore();
    }, [grid, state, selectedUnit, targetHex, hoveredHex, showGrid]);

    // Pan handler
    const handlePan = useCallback((dx: number, dy: number) => {
        cameraRef.current.x += dx;
        cameraRef.current.y += dy;
    }, []);

    // Zoom handler with cursor-centered zooming
    const handleZoom = useCallback((delta: number, cx: number, cy: number) => {
        const camera = cameraRef.current;
        const factor = Math.exp(delta * -0.001);
        const newScale = Math.max(0.3, Math.min(3, camera.scale * factor));

        if (newScale !== camera.scale) {
            // Zoom towards cursor position
            const canvas = document.querySelector('.map-canvas') as HTMLCanvasElement;
            if (canvas) {
                const centerX = canvas.width / (2 * window.devicePixelRatio);
                const centerY = canvas.height / (2 * window.devicePixelRatio);

                const inv = 1 / camera.scale;
                const wx = (cx - centerX - camera.x) * inv;
                const wy = (cy - centerY - camera.y) * inv;

                camera.scale = newScale;
                camera.x = cx - centerX - wx * camera.scale;
                camera.y = cy - centerY - wy * camera.scale;
            }
        }
    }, []);

    // Click handler
    const handleClick = useCallback((x: number, y: number) => {
        const canvas = document.querySelector('.map-canvas') as HTMLCanvasElement;
        if (canvas && onTileClick) {
            const hexPos = getHexFromScreen(x, y, canvas);
            if (hexPos) {
                onTileClick(hexPos);
            }
        }
    }, [getHexFromScreen, onTileClick]);

    // Hover handler
    const handleHover = useCallback((x: number, y: number) => {
        const canvas = document.querySelector('.map-canvas') as HTMLCanvasElement;
        if (canvas) {
            const hexPos = getHexFromScreen(x, y, canvas);
            if (!hoveredHex || !hexPos || hoveredHex.q !== hexPos.q || hoveredHex.r !== hexPos.r) {
                setHoveredHex(hexPos);
            }
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

            {/* Battle info overlay */}
            <div className="absolute top-4 left-4 bg-black bg-opacity-75 text-white p-3 rounded text-sm pointer-events-none">
                <div>Turn {state.turn} - {state.phase}</div>
                <div>Biome: {state.context.biome}</div>
                {hoveredHex && (
                    <div>Hex: ({hoveredHex.q}, {hoveredHex.r})</div>
                )}
                <div>Zoom: {Math.round(cameraRef.current.scale * 100)}%</div>
            </div>

            {/* Controls */}
            <div className="absolute top-4 right-4 flex flex-col space-y-2">
                <button
                    onClick={() => {
                        cameraRef.current.scale = Math.min(3, cameraRef.current.scale * 1.1);
                        forceRender(prev => prev + 1);
                    }}
                    className="px-3 py-2 bg-gray-700 text-white text-sm rounded hover:bg-gray-600 pointer-events-auto"
                >
                    🔍+
                </button>
                <button
                    onClick={() => {
                        cameraRef.current.scale = Math.max(0.3, cameraRef.current.scale / 1.1);
                        forceRender(prev => prev + 1);
                    }}
                    className="px-3 py-2 bg-gray-700 text-white text-sm rounded hover:bg-gray-600 pointer-events-auto"
                >
                    🔍-
                </button>
                <button
                    onClick={resetView}
                    className="px-3 py-2 bg-gray-700 text-white text-sm rounded hover:bg-gray-600 pointer-events-auto"
                >
                    🎯
                </button>
            </div>

            {/* Instructions */}
            <div className="absolute bottom-4 left-4 bg-black bg-opacity-75 text-white p-2 rounded text-xs pointer-events-none">
                <div>• Drag: Pan • Scroll: Zoom • Click: Select • 🎯: Reset</div>
                <div>• Professional Canvas Wrapper</div>
            </div>
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

function getTerrainColor(terrain: string): string {
    const colors: Record<string, string> = {
        Grass: '#4ade80',
        Forest: '#22c55e',
        Mountain: '#6b7280',
        Water: '#3b82f6',
        Desert: '#fbbf24',
        Swamp: '#84cc16'
    };
    return colors[terrain] || '#6b7280';
}

function drawUnit(ctx: CanvasRenderingContext2D, x: number, y: number, unit: Unit, isSelected: boolean) {
    // Unit circle
    ctx.beginPath();
    ctx.arc(x, y, 20, 0, 2 * Math.PI);

    // Color by faction
    ctx.fillStyle = unit.faction === 'Player' ? '#3b82f6' : '#ef4444';
    ctx.fill();

    // Selection highlight
    if (isSelected) {
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 3;
        ctx.stroke();
    } else {
        ctx.strokeStyle = '#1f2937';
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    // Unit name
    ctx.fillStyle = 'white';
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(unit.name.substring(0, 3), x, y + 3);

    // HP bar
    const hpPercent = unit.stats.hp / unit.stats.maxHp;
    const barWidth = 24;
    const barHeight = 4;

    ctx.fillStyle = '#1f2937';
    ctx.fillRect(x - barWidth / 2, y - 30, barWidth, barHeight);

    ctx.fillStyle = hpPercent > 0.5 ? '#22c55e' : hpPercent > 0.25 ? '#fbbf24' : '#ef4444';
    ctx.fillRect(x - barWidth / 2, y - 30, barWidth * hpPercent, barHeight);
}
