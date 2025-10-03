/**
 * Hex Battle Canvas Renderer
 * Renders hex grid battlefield with units and effects
 */

import React, { useRef, useEffect } from 'react';
import { BattleState, HexPosition, Unit, HexTile } from '../types';

export interface BattleCanvasHexProps {
    state: BattleState;
    onHexClick?: (q: number, r: number) => void;
    width?: number;
    height?: number;
}

// Hex rendering constants
const HEX_SIZE = 25;
const HEX_WIDTH = HEX_SIZE * 2;
const HEX_HEIGHT = Math.sqrt(3) * HEX_SIZE;

/**
 * Convert hex coordinates to pixel coordinates
 */
function hexToPixel(q: number, r: number): { x: number; y: number } {
    const x = HEX_SIZE * (3 / 2 * q);
    const y = HEX_SIZE * (Math.sqrt(3) / 2 * q + Math.sqrt(3) * r);
    return { x, y };
}

/**
 * Convert pixel coordinates to hex coordinates
 */
function pixelToHex(x: number, y: number): HexPosition {
    const q = (2 / 3 * x) / HEX_SIZE;
    const r = (-1 / 3 * x + Math.sqrt(3) / 3 * y) / HEX_SIZE;
    return hexRound(q, r);
}

/**
 * Round fractional hex coordinates to nearest hex
 */
function hexRound(q: number, r: number): HexPosition {
    let rq = Math.round(q);
    let rr = Math.round(r);
    let rs = Math.round(-q - r);

    const qDiff = Math.abs(rq - q);
    const rDiff = Math.abs(rr - r);
    const sDiff = Math.abs(rs - (-q - r));

    if (qDiff > rDiff && qDiff > sDiff) {
        rq = -rr - rs;
    } else if (rDiff > sDiff) {
        rr = -rq - rs;
    }

    return { q: rq, r: rr };
}

/**
 * Get terrain color
 */
function getTerrainColor(terrain: HexTile['terrain']): string {
    switch (terrain) {
        case 'Grass': return '#7cb342';
        case 'Forest': return '#2e7d32';
        case 'Mountain': return '#5d4037';
        case 'Water': return '#1976d2';
        case 'Desert': return '#fbc02d';
        case 'Swamp': return '#388e3c';
        default: return '#9e9e9e';
    }
}

/**
 * Get unit color based on faction
 */
function getUnitColor(unit: Unit): string {
    switch (unit.faction) {
        case 'Player': return '#4caf50';
        case 'Enemy': return '#f44336';
        case 'Neutral': return '#ff9800';
        default: return '#9e9e9e';
    }
}

/**
 * Draw a hexagon at the given center point
 */
function drawHex(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    fillColor: string,
    strokeColor: string = '#333',
    strokeWidth: number = 1
): void {
    ctx.beginPath();

    for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i;
        const hexX = x + size * Math.cos(angle);
        const hexY = y + size * Math.sin(angle);

        if (i === 0) {
            ctx.moveTo(hexX, hexY);
        } else {
            ctx.lineTo(hexX, hexY);
        }
    }

    ctx.closePath();
    ctx.fillStyle = fillColor;
    ctx.fill();
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeWidth;
    ctx.stroke();
}

/**
 * Draw unit on hex
 */
function drawUnit(
    ctx: CanvasRenderingContext2D,
    unit: Unit,
    x: number,
    y: number
): void {
    const color = getUnitColor(unit);

    // Draw unit circle
    ctx.beginPath();
    ctx.arc(x, y, HEX_SIZE * 0.6, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw unit label
    ctx.fillStyle = '#fff';
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const label = unit.kind === 'HeroCommander' ? 'H' :
        unit.kind === 'Mercenary' ? 'M' :
            unit.archetype.charAt(0);
    ctx.fillText(label, x, y);

    // Draw HP bar
    const barWidth = HEX_SIZE;
    const barHeight = 4;
    const hpRatio = unit.stats.hp / unit.stats.maxHp;

    ctx.fillStyle = '#333';
    ctx.fillRect(x - barWidth / 2, y + HEX_SIZE + 2, barWidth, barHeight);

    ctx.fillStyle = hpRatio > 0.6 ? '#4caf50' : hpRatio > 0.3 ? '#ff9800' : '#f44336';
    ctx.fillRect(x - barWidth / 2, y + HEX_SIZE + 2, barWidth * hpRatio, barHeight);
}

export function BattleCanvasHex({
    state,
    onHexClick,
    width = 800,
    height = 600
}: BattleCanvasHexProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        // Calculate offset to center the battlefield
        const offsetX = width / 2 - (state.grid.width * HEX_SIZE * 1.5) / 2;
        const offsetY = height / 2 - (state.grid.height * HEX_HEIGHT) / 2;

        // Draw hex tiles
        for (const tile of state.grid.tiles) {
            const { x, y } = hexToPixel(tile.q, tile.r);
            const screenX = x + offsetX;
            const screenY = y + offsetY;

            const terrainColor = getTerrainColor(tile.terrain);
            const strokeColor = tile.passable ? '#333' : '#666';
            const strokeWidth = tile.passable ? 1 : 3;

            drawHex(ctx, screenX, screenY, HEX_SIZE, terrainColor, strokeColor, strokeWidth);

            // Draw coordinates for debugging
            ctx.fillStyle = '#000';
            ctx.font = '8px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`${tile.q},${tile.r}`, screenX, screenY - 8);
        }

        // Draw deployment zones
        if (state.phase === 'Deployment') {
            // Friendly deployment zone
            for (const hex of state.friendlyDeployment.hexes) {
                const { x, y } = hexToPixel(hex.q, hex.r);
                const screenX = x + offsetX;
                const screenY = y + offsetY;

                ctx.beginPath();
                ctx.arc(screenX, screenY, HEX_SIZE * 0.8, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(76, 175, 80, 0.3)';
                ctx.fill();
                ctx.strokeStyle = '#4caf50';
                ctx.lineWidth = 2;
                ctx.stroke();
            }

            // Enemy deployment zone
            for (const hex of state.enemyDeployment.hexes) {
                const { x, y } = hexToPixel(hex.q, hex.r);
                const screenX = x + offsetX;
                const screenY = y + offsetY;

                ctx.beginPath();
                ctx.arc(screenX, screenY, HEX_SIZE * 0.8, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(244, 67, 54, 0.3)';
                ctx.fill();
                ctx.strokeStyle = '#f44336';
                ctx.lineWidth = 2;
                ctx.stroke();
            }
        }

        // Draw units
        for (const unit of state.units) {
            if (!unit.pos) continue;

            const { x, y } = hexToPixel(unit.pos.q, unit.pos.r);
            const screenX = x + offsetX;
            const screenY = y + offsetY;

            drawUnit(ctx, unit, screenX, screenY);
        }

        // Draw selected hex highlight
        if (state.selectedUnit) {
            const unit = state.units.find(u => u.id === state.selectedUnit);
            if (unit && unit.pos) {
                const { x, y } = hexToPixel(unit.pos.q, unit.pos.r);
                const screenX = x + offsetX;
                const screenY = y + offsetY;

                ctx.beginPath();
                ctx.arc(screenX, screenY, HEX_SIZE + 5, 0, Math.PI * 2);
                ctx.strokeStyle = '#ffeb3b';
                ctx.lineWidth = 3;
                ctx.stroke();
            }
        }

    }, [state, width, height]);

    const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
        if (!onHexClick) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        // Calculate offset (same as in render)
        const offsetX = width / 2 - (state.grid.width * HEX_SIZE * 1.5) / 2;
        const offsetY = height / 2 - (state.grid.height * HEX_HEIGHT) / 2;

        const hex = pixelToHex(x - offsetX, y - offsetY);
        onHexClick(hex.q, hex.r);
    };

    return (
        <div style={{ border: '2px solid #333', borderRadius: '8px', overflow: 'hidden' }}>
            <canvas
                ref={canvasRef}
                width={width}
                height={height}
                onClick={handleCanvasClick}
                style={{ display: 'block', cursor: 'pointer' }}
            />
            <div style={{
                padding: '8px',
                backgroundColor: '#f5f5f5',
                borderTop: '1px solid #ddd',
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '12px'
            }}>
                <span>Turn: {state.turn} | Phase: {state.phase}</span>
                <span>Units: {state.units.filter(u => u.faction === 'Player' && u.stats.hp > 0).length} Player | {state.units.filter(u => u.faction === 'Enemy' && u.stats.hp > 0).length} Enemy</span>
            </div>
        </div>
    );
}