import React, { useRef, useEffect, useState } from 'react';
import type { BattleState, HexPosition, Unit, HexTile } from '../types';
import { hexDistance, tileAt } from '../engine';

interface BattleCanvasProps {
    state: BattleState;
    onTileClick?: (pos: HexPosition) => void;
    selectedUnit?: string;
    targetHex?: HexPosition;
    showGrid?: boolean;
    showCoordinates?: boolean;
}

export function BattleCanvas({
    state,
    onTileClick,
    selectedUnit,
    targetHex,
    showGrid = true,
    showCoordinates = false
}: BattleCanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [hoveredHex, setHoveredHex] = useState<HexPosition | null>(null);

    const hexSize = 30;
    const hexWidth = hexSize * 2;
    const hexHeight = Math.sqrt(3) * hexSize;

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw grid
        if (showGrid) {
            drawHexGrid(ctx, state.grid);
        }

        // Draw tiles
        for (const tile of state.grid.tiles) {
            drawHexTile(ctx, tile, false);
        }

        // Highlight deployment zones during setup
        if (state.phase === "Setup") {
            drawDeploymentZones(ctx, state);
        }

        // Draw units
        for (const unit of state.units) {
            if (unit.pos && !unit.isDead) {
                drawUnit(ctx, unit, unit.id === selectedUnit);
            }
        }

        // Highlight hovered hex
        if (hoveredHex) {
            highlightHex(ctx, hoveredHex, 'rgba(255, 255, 255, 0.3)');
        }

        // Highlight target hex
        if (targetHex) {
            highlightHex(ctx, targetHex, 'rgba(255, 0, 0, 0.5)');
        }

    }, [state, selectedUnit, targetHex, hoveredHex, showGrid, showCoordinates]);

    function drawHexGrid(ctx: CanvasRenderingContext2D, grid: any) {
        ctx.strokeStyle = '#444';
        ctx.lineWidth = 1;

        for (let q = 0; q < grid.width; q++) {
            for (let r = 0; r < grid.height; r++) {
                const { x, y } = hexToPixel({ q, r });
                drawHexOutline(ctx, x, y);

                if (showCoordinates) {
                    ctx.fillStyle = '#666';
                    ctx.font = '10px monospace';
                    ctx.textAlign = 'center';
                    ctx.fillText(`${q},${r}`, x, y);
                }
            }
        }
    }

    function drawHexTile(ctx: CanvasRenderingContext2D, tile: HexTile, highlighted: boolean) {
        const { x, y } = hexToPixel({ q: tile.q, r: tile.r });

        // Fill based on terrain
        const terrainColors: Record<string, string> = {
            'Grass': '#4a7c59',
            'Forest': '#2d5016',
            'Mountain': '#8b7355',
            'Water': '#1e40af',
            'Desert': '#fbbf24',
            'Swamp': '#365314'
        };

        ctx.fillStyle = terrainColors[tile.terrain] || '#4a7c59';

        if (highlighted) {
            ctx.fillStyle = '#fbbf24'; // Highlight color
        }

        if (!tile.passable) {
            ctx.fillStyle = '#991b1b'; // Red for impassable
        }

        drawHexFill(ctx, x, y);

        // Draw cover indicators
        if (tile.cover && tile.cover > 0) {
            ctx.fillStyle = 'rgba(139, 69, 19, 0.6)'; // Brown for cover
            const coverSize = hexSize * tile.cover * 0.3;
            ctx.beginPath();
            ctx.arc(x + hexSize * 0.6, y - hexSize * 0.6, coverSize, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function drawDeploymentZones(ctx: CanvasRenderingContext2D, state: BattleState) {
        // Friendly deployment zone (green)
        ctx.fillStyle = 'rgba(34, 197, 94, 0.3)';
        for (const hex of state.friendlyDeployment.hexes) {
            const { x, y } = hexToPixel(hex);
            drawHexFill(ctx, x, y);
        }

        // Enemy deployment zone (red) 
        ctx.fillStyle = 'rgba(239, 68, 68, 0.3)';
        for (const hex of state.enemyDeployment.hexes) {
            const { x, y } = hexToPixel(hex);
            drawHexFill(ctx, x, y);
        }
    }

    function drawUnit(ctx: CanvasRenderingContext2D, unit: Unit, selected: boolean) {
        if (!unit.pos) return;

        const { x, y } = hexToPixel(unit.pos);

        // Unit background circle
        const factionColors = {
            'Player': '#22c55e',
            'Enemy': '#ef4444',
            'Neutral': '#6b7280'
        };

        ctx.fillStyle = factionColors[unit.faction];
        if (selected) {
            ctx.strokeStyle = '#fbbf24';
            ctx.lineWidth = 3;
        } else {
            ctx.strokeStyle = '#1f2937';
            ctx.lineWidth = 1;
        }

        const radius = hexSize * 0.7;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Unit kind indicator
        if (unit.isCommander) {
            ctx.fillStyle = '#fbbf24';
            ctx.beginPath();
            ctx.arc(x, y - radius * 0.6, 4, 0, Math.PI * 2);
            ctx.fill();
        }

        // Health bar
        drawHealthBar(ctx, unit, x, y + radius + 5);

        // Unit name/level
        ctx.fillStyle = '#ffffff';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${unit.name}`, x, y + radius + 20);
        ctx.fillText(`Lv${unit.level}`, x, y + radius + 32);
    }

    function drawHealthBar(ctx: CanvasRenderingContext2D, unit: Unit, x: number, y: number) {
        const barWidth = hexSize * 1.2;
        const barHeight = 4;
        const hpPercent = unit.stats.hp / unit.stats.maxHp;

        // Background
        ctx.fillStyle = '#1f2937';
        ctx.fillRect(x - barWidth / 2, y, barWidth, barHeight);

        // Health
        ctx.fillStyle = hpPercent > 0.5 ? '#22c55e' : hpPercent > 0.25 ? '#fbbf24' : '#ef4444';
        ctx.fillRect(x - barWidth / 2, y, barWidth * hpPercent, barHeight);

        // Border
        ctx.strokeStyle = '#374151';
        ctx.lineWidth = 1;
        ctx.strokeRect(x - barWidth / 2, y, barWidth, barHeight);
    }

    function highlightHex(ctx: CanvasRenderingContext2D, hex: HexPosition, color: string) {
        const { x, y } = hexToPixel(hex);
        ctx.fillStyle = color;
        drawHexFill(ctx, x, y);
    }

    function drawHexOutline(ctx: CanvasRenderingContext2D, x: number, y: number) {
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i;
            const px = x + hexSize * Math.cos(angle);
            const py = y + hexSize * Math.sin(angle);
            if (i === 0) {
                ctx.moveTo(px, py);
            } else {
                ctx.lineTo(px, py);
            }
        }
        ctx.closePath();
        ctx.stroke();
    }

    function drawHexFill(ctx: CanvasRenderingContext2D, x: number, y: number) {
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i;
            const px = x + hexSize * Math.cos(angle);
            const py = y + hexSize * Math.sin(angle);
            if (i === 0) {
                ctx.moveTo(px, py);
            } else {
                ctx.lineTo(px, py);
            }
        }
        ctx.closePath();
        ctx.fill();
    }

    function hexToPixel(hex: HexPosition): { x: number; y: number } {
        const x = hexSize * (3 / 2 * hex.q) + 50; // Offset from left edge
        const y = hexSize * (Math.sqrt(3) / 2 * hex.q + Math.sqrt(3) * hex.r) + 50; // Offset from top
        return { x, y };
    }

    function pixelToHex(x: number, y: number): HexPosition {
        // Subtract offsets
        x -= 50;
        y -= 50;

        const q = (2 / 3 * x) / hexSize;
        const r = (-1 / 3 * x + Math.sqrt(3) / 3 * y) / hexSize;

        // Round to nearest hex
        return hexRound({ q, r });
    }

    function hexRound(hex: { q: number; r: number }): HexPosition {
        let q = Math.round(hex.q);
        let r = Math.round(hex.r);
        const s = Math.round(-hex.q - hex.r);

        const qDiff = Math.abs(q - hex.q);
        const rDiff = Math.abs(r - hex.r);
        const sDiff = Math.abs(s - (-hex.q - hex.r));

        if (qDiff > rDiff && qDiff > sDiff) {
            q = -r - s;
        } else if (rDiff > sDiff) {
            r = -q - s;
        }

        return { q, r };
    }

    function handleCanvasClick(event: React.MouseEvent<HTMLCanvasElement>) {
        if (!onTileClick) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        const hex = pixelToHex(x, y);

        // Validate hex is within grid bounds
        if (hex.q >= 0 && hex.q < state.grid.width && hex.r >= 0 && hex.r < state.grid.height) {
            onTileClick(hex);
        }
    }

    function handleCanvasMouseMove(event: React.MouseEvent<HTMLCanvasElement>) {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        const hex = pixelToHex(x, y);

        // Only update if hex is within bounds and different from current
        if (hex.q >= 0 && hex.q < state.grid.width &&
            hex.r >= 0 && hex.r < state.grid.height &&
            (hoveredHex?.q !== hex.q || hoveredHex?.r !== hex.r)) {
            setHoveredHex(hex);
        }
    }

    function handleCanvasMouseLeave() {
        setHoveredHex(null);
    }

    // Make canvas size more reasonable
    const canvasWidth = Math.min(1200, Math.max(600, state.grid.width * hexSize * 1.5 + 100));
    const canvasHeight = Math.min(800, Math.max(400, state.grid.height * hexSize * 1.2 + 100));

    return (
        <div className="relative flex justify-center items-center min-h-full overflow-auto">
            <canvas
                ref={canvasRef}
                width={canvasWidth}
                height={canvasHeight}
                onClick={handleCanvasClick}
                onMouseMove={handleCanvasMouseMove}
                onMouseLeave={handleCanvasMouseLeave}
                className="border border-gray-600 bg-gray-800 cursor-pointer max-w-full max-h-full"
            />

            {/* Battle info overlay */}
            <div className="absolute top-2 left-2 bg-black bg-opacity-75 text-white p-2 rounded text-sm">
                <div>Turn {state.turn} - {state.phase}</div>
                <div>Biome: {state.context.biome}</div>
                {hoveredHex && (
                    <div>Hex: ({hoveredHex.q}, {hoveredHex.r})</div>
                )}
            </div>

            {/* Debug toggles */}
            <div className="absolute top-2 right-2 space-x-2">
                <button
                    onClick={() => {/* toggle grid */ }}
                    className="px-2 py-1 bg-gray-700 text-white text-xs rounded hover:bg-gray-600"
                >
                    Grid
                </button>
                <button
                    onClick={() => {/* toggle coordinates */ }}
                    className="px-2 py-1 bg-gray-700 text-white text-xs rounded hover:bg-gray-600"
                >
                    Coords
                </button>
            </div>
        </div>
    );
}