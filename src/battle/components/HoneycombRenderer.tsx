/**
 * Improved Hex Battle Renderer using Honeycomb Grid
 * Modern, clean implementation with proper mouse interaction and scaling
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { defineHex, Grid, rectangle, Hex, Orientation } from 'honeycomb-grid';
import type { BattleState, HexPosition, Unit } from '../types';

interface HoneycombBattleCanvasProps {
    state: BattleState;
    onTileClick?: (pos: HexPosition) => void;
    selectedUnit?: string;
    targetHex?: HexPosition;
    showGrid?: boolean;
}

// Define our custom hex tile with battle data
const BattleTile = defineHex({
    dimensions: 30, // Size of hexagons
    orientation: Orientation.POINTY // Classic pointy-top hexagons
});

export function HoneycombBattleCanvas({
    state,
    onTileClick,
    selectedUnit,
    targetHex,
    showGrid = true
}: HoneycombBattleCanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [hoveredHex, setHoveredHex] = useState<HexPosition | null>(null);
    const [scale, setScale] = useState(1);
    const [offset, setOffset] = useState({ x: 0, y: 0 });

    // Create grid using Honeycomb
    const grid = new Grid(BattleTile, rectangle({
        width: state.grid.width,
        height: state.grid.height
    }));

    // Convert our hex position to Honeycomb hex
    const getHoneycombHex = useCallback((pos: HexPosition): Hex => {
        return new BattleTile({ col: pos.q, row: pos.r });
    }, []);

    // Convert Honeycomb hex to our hex position
    const getHexPosition = useCallback((hex: Hex): HexPosition => {
        return { q: hex.col, r: hex.row };
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Responsive canvas sizing
        const container = containerRef.current;
        if (container) {
            const rect = container.getBoundingClientRect();
            canvas.width = rect.width;
            canvas.height = rect.height;
        }

        // Clear and setup transform
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();

        // Center the grid and apply scale/offset
        const centerX = canvas.width / 2 + offset.x;
        const centerY = canvas.height / 2 + offset.y;
        ctx.translate(centerX, centerY);
        ctx.scale(scale, scale);

        // Calculate grid bounds for centering
        const gridWidth = grid.pixelWidth;
        const gridHeight = grid.pixelHeight;
        ctx.translate(-gridWidth / 2, -gridHeight / 2);

        // Draw hex grid
        if (showGrid) {
            ctx.strokeStyle = '#444';
            ctx.lineWidth = 1 / scale; // Adjust line width for scale

            grid.forEach(hex => {
                const { x, y } = hex;
                drawHexagon(ctx, x, y, hex.dimensions.xRadius);
            });
        }

        // Draw terrain tiles
        grid.forEach(hex => {
            const pos = getHexPosition(hex);
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
                const hex = getHoneycombHex(hexPos);
                const { x, y } = hex;
                fillHexagon(ctx, x, y, hex.dimensions.xRadius);
            });

            // Enemy deployment (red)
            ctx.fillStyle = 'rgba(239, 68, 68, 0.3)';
            state.enemyDeployment.hexes.forEach(hexPos => {
                const hex = getHoneycombHex(hexPos);
                const { x, y } = hex;
                fillHexagon(ctx, x, y, hex.dimensions.xRadius);
            });
        }

        // Draw units
        state.units.forEach(unit => {
            if (unit.pos && !unit.isDead) {
                const hex = getHoneycombHex(unit.pos);
                const { x, y } = hex;
                const isSelected = selectedUnit === unit.id;
                drawUnit(ctx, x, y, unit, isSelected);
            }
        });

        // Highlight hovered hex
        if (hoveredHex) {
            const hex = getHoneycombHex(hoveredHex);
            const { x, y } = hex;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
            fillHexagon(ctx, x, y, hex.dimensions.xRadius);
        }

        // Highlight target hex
        if (targetHex) {
            const hex = getHoneycombHex(targetHex);
            const { x, y } = hex;
            ctx.fillStyle = 'rgba(239, 68, 68, 0.5)';
            fillHexagon(ctx, x, y, hex.dimensions.xRadius);
        }

        ctx.restore();
    }, [state, selectedUnit, targetHex, hoveredHex, showGrid, scale, offset, grid, getHoneycombHex, getHexPosition]);

    // Handle mouse events with Honeycomb's built-in pixel-to-hex conversion
    const handleMouseEvent = useCallback((event: React.MouseEvent, eventType: 'click' | 'move') => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left - canvas.width / 2 - offset.x;
        const mouseY = event.clientY - rect.top - canvas.height / 2 - offset.y;

        // Adjust for scale and centering
        const gridWidth = grid.pixelWidth;
        const gridHeight = grid.pixelHeight;
        const adjustedX = (mouseX / scale) + gridWidth / 2;
        const adjustedY = (mouseY / scale) + gridHeight / 2;

        // Use Honeycomb's pointToHex conversion
        const hex = grid.pointToHex({ x: adjustedX, y: adjustedY });

        if (hex) {
            const pos = getHexPosition(hex);

            // Check if within grid bounds
            if (pos.q >= 0 && pos.q < state.grid.width && pos.r >= 0 && pos.r < state.grid.height) {
                if (eventType === 'click' && onTileClick) {
                    onTileClick(pos);
                } else if (eventType === 'move') {
                    setHoveredHex(pos);
                }
            }
        }
    }, [grid, scale, offset, state.grid.width, state.grid.height, onTileClick, getHexPosition]);

    const handleClick = useCallback((event: React.MouseEvent) => {
        handleMouseEvent(event, 'click');
    }, [handleMouseEvent]);

    const handleMouseMove = useCallback((event: React.MouseEvent) => {
        handleMouseEvent(event, 'move');
    }, [handleMouseEvent]);

    const handleMouseLeave = useCallback(() => {
        setHoveredHex(null);
    }, []);

    const handleWheel = useCallback((event: React.WheelEvent) => {
        event.preventDefault();
        const direction = event.deltaY > 0 ? 'out' : 'in';
        setScale(prev => {
            const newScale = direction === 'in' ? prev * 1.1 : prev / 1.1;
            return Math.max(0.3, Math.min(3, newScale));
        });
    }, []);

    const resetView = useCallback(() => {
        setScale(1);
        setOffset({ x: 0, y: 0 });
    }, []);

    return (
        <div ref={containerRef} className="relative w-full h-full bg-gray-900">
            <canvas
                ref={canvasRef}
                onClick={handleClick}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                onWheel={handleWheel}
                className="w-full h-full cursor-pointer"
            />

            {/* Battle info overlay */}
            <div className="absolute top-4 left-4 bg-black bg-opacity-75 text-white p-3 rounded text-sm">
                <div>Turn {state.turn} - {state.phase}</div>
                <div>Biome: {state.context.biome}</div>
                {hoveredHex && (
                    <div>Hex: ({hoveredHex.q}, {hoveredHex.r})</div>
                )}
                <div>Zoom: {Math.round(scale * 100)}%</div>
            </div>

            {/* Controls */}
            <div className="absolute top-4 right-4 flex flex-col space-y-2">
                <button
                    onClick={() => setScale(prev => Math.min(3, prev * 1.1))}
                    className="px-3 py-2 bg-gray-700 text-white text-sm rounded hover:bg-gray-600"
                >
                    🔍+
                </button>
                <button
                    onClick={() => setScale(prev => Math.max(0.3, prev / 1.1))}
                    className="px-3 py-2 bg-gray-700 text-white text-sm rounded hover:bg-gray-600"
                >
                    🔍-
                </button>
                <button
                    onClick={resetView}
                    className="px-3 py-2 bg-gray-700 text-white text-sm rounded hover:bg-gray-600"
                >
                    🎯
                </button>
            </div>

            {/* Instructions */}
            <div className="absolute bottom-4 left-4 bg-black bg-opacity-75 text-white p-2 rounded text-xs">
                <div>• Scroll: Zoom • Click: Select • 🎯: Reset</div>
                <div>• Powered by Honeycomb Grid</div>
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