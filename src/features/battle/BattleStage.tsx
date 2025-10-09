/**
 * BattleStage.tsx - Professional hex grid canvas with pointer events
 * Clean wrapper around existing HoneycombRenderer with minimal interface
 */

import React, { useState, useCallback } from 'react';
import { BattleState, HexPosition, Unit } from './types';
import { HoneycombBattleCanvas } from './components/HoneycombRenderer';

interface BattleStageProps {
    state: BattleState;
    selectedUnit?: Unit | null;
    onHexClick: (pos: HexPosition) => void;
    onUnitSelect: (unit: Unit | null) => void;
    showGrid?: boolean;
    className?: string;
    style?: React.CSSProperties;
}export function BattleStage({
    state,
    selectedUnit,
    onHexClick,
    onUnitSelect,
    showGrid = true,
    className,
    style
}: BattleStageProps) {
    const [hoveredHex, setHoveredHex] = useState<HexPosition | null>(null);

    // Handle tile clicks with unit selection logic
    const handleTileClick = useCallback((pos: HexPosition) => {
        // Check if there's a unit at this position
        const _unit = state.units.find(u =>
            u.pos && u.pos.q === pos.q && u.pos.r === pos.r && !u.isDead
        );

        if (unit && unit.faction === "Player" && state.phase === "UnitsTurn") {
            // Select player unit during UnitsTurn
            onUnitSelect(_unit);
        } else if (selectedUnit && selectedUnit.faction === "Player") {
            // Move selected unit or target ability
            onHexClick(_pos);
        } else {
            // General hex targeting (for Hero abilities, etc.)
            onHexClick(_pos);
        }
    }, [state.units, state.phase, selectedUnit, onHexClick, onUnitSelect]);

    // Calculate reachable tiles for movement preview
    const getReachableTiles = useCallback((): HexPosition[] => {
        if (!selectedUnit || !selectedUnit.pos || selectedUnit.hasMoved) {
            return [];
        }

        // Simple implementation - just neighbors for now
        // In a full implementation, this would use pathfinding with movement points
        const neighbors: HexPosition[] = [
            { q: selectedUnit.pos.q + 1, r: selectedUnit.pos.r },
            { q: selectedUnit.pos.q - 1, r: selectedUnit.pos.r },
            { q: selectedUnit.pos.q, r: selectedUnit.pos.r + 1 },
            { q: selectedUnit.pos.q, r: selectedUnit.pos.r - 1 },
            { q: selectedUnit.pos.q + 1, r: selectedUnit.pos.r - 1 },
            { q: selectedUnit.pos.q - 1, r: selectedUnit.pos.r + 1 },
        ];

        return neighbors.filter(pos => {
            const tile = state.grid.tiles.find(t => t.q === pos.q && t.r === pos.r);
            return tile && tile.passable && !tile.occupied;
        });
    }, [selectedUnit, state.grid.tiles]);

    const reachableTiles = getReachableTiles();

    return (
        <div
            className={className}
            style={{
                position: 'relative',
                width: '100%',
                height: '100%',
                border: '1px solid #333',
                borderRadius: '8px',
                overflow: 'hidden',
                backgroundColor: '#0a0a0a',
                ...style
            }}
        >
            {/* Main battle canvas */}
            <HoneycombBattleCanvas
                state={state}
                onTileClick={handleTileClick}
                selectedUnit={selectedUnit?.id}
                showGrid={showGrid}
            />

            {/* Overlay for selection indicators */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                pointerEvents: 'none',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'flex-start',
                padding: '12px'
            }}>
                {/* Phase indicator */}
                <div style={{
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    color: 'white',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    border: '1px solid #444'
                }}>
                    {state.phase === "Victory" && "🎉 Victory!"}
                    {state.phase === "Defeat" && "💀 Defeat"}
                    {state.phase === "HeroTurn" && "🎖️ Hero Turn"}
                    {state.phase === "UnitsTurn" && "⚔️ Units Turn"}
                    {state.phase === "EnemyTurn" && "🔴 Enemy Turn"}
                    {state.phase === "Setup" && "🏗️ Setup"}
                </div>
            </div>

            {/* Selection info overlay */}
            {selectedUnit && (
                <div style={{
                    position: 'absolute',
                    bottom: '12px',
                    left: '12px',
                    backgroundColor: 'rgba(0, 0, 0, 0.9)',
                    color: 'white',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    border: '1px solid #444',
                    pointerEvents: 'none'
                }}>
                    <div style={{ fontWeight: 'bold' }}>{selectedUnit.name}</div>
                    <div>HP: {selectedUnit.stats.hp}/{selectedUnit.stats.maxHp}</div>
                    <div>Move: {selectedUnit.hasMoved ? 0 : selectedUnit.stats.move}</div>
                    {reachableTiles.length > 0 && (
                        <div style={{ color: '#4CAF50', fontSize: '11px' }}>
                            {reachableTiles.length} tiles in range
                        </div>
                    )}
                </div>
            )}

            {/* Turn order indicator */}
            {state.initiative.length > 0 && (
                <div style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    color: 'white',
                    padding: '8px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    border: '1px solid #444',
                    pointerEvents: 'none',
                    maxWidth: '150px'
                }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Initiative Order</div>
                    {state.initiative.slice(0, 5).map((unitId, index) => {
                        const _unit = state.units.find(u => u.id === unitId);
                        if (!unit) return null;

                        return (
                            <div
                                key={unitId}
                                style={{
                                    padding: '2px 4px',
                                    backgroundColor: index === 0 ? 'rgba(76, 175, 80, 0.3)' : 'transparent',
                                    borderRadius: '3px',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}
                            >
                                <span>{unit.name}</span>
                                <span style={{
                                    fontSize: '10px',
                                    color: unit.faction === "Player" ? '#4CAF50' : '#F44336'
                                }}>
                                    {unit.stats.spd}
                                </span>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Grid toggle hint */}
            <div style={{
                position: 'absolute',
                bottom: '12px',
                right: '12px',
                fontSize: '10px',
                color: '#666',
                pointerEvents: 'none'
            }}>
                Grid: {showGrid ? 'On' : 'Off'} | Click hexes to interact
            </div>
        </div>
    );
}