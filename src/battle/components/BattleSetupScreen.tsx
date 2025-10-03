import React, { useState } from 'react';
import type { BattleState, Unit, HexPosition } from '../types';
import { sanitizeBattleState } from '../typeGuards';
import { BattleCanvas } from './renderer2d';
import { startBattle } from '../engine';

interface BattleSetupScreenProps {
    initialState: BattleState;
    onReady: (finalState: BattleState) => void;
}

function cloneState(state: BattleState): BattleState {
    // Deep clone and sanitize to ensure type safety
    const cloned = JSON.parse(JSON.stringify(state));
    return sanitizeBattleState(cloned);
} export function BattleSetupScreen({ initialState, onReady }: BattleSetupScreenProps) {
    const [state, setState] = useState<BattleState>(cloneState(initialState));
    const [selectedUnit, setSelectedUnit] = useState<string | undefined>(undefined);
    const [draggedUnit, setDraggedUnit] = useState<string | null>(null);

    const playerUnits = state.units.filter(u =>
        u.faction === 'Player' && !u.isDead && !u.isCommander
    );

    const deploymentHexes = new Set(
        state.friendlyDeployment.hexes.map(h => `${h.q},${h.r}`)
    );

    function isValidDeploymentHex(pos: HexPosition): boolean {
        return deploymentHexes.has(`${pos.q},${pos.r}`);
    }

    function isHexOccupied(pos: HexPosition): boolean {
        return state.units.some(u =>
            u.pos && u.pos.q === pos.q && u.pos.r === pos.r
        );
    }

    function handleUnitSelect(unitId: string) {
        setSelectedUnit(unitId);
    }

    function handleTileClick(pos: HexPosition) {
        if (!selectedUnit) return;

        // Check if it's a valid deployment position
        if (!isValidDeploymentHex(pos)) {
            console.log('Invalid deployment position');
            return;
        }

        // Check if hex is already occupied
        if (isHexOccupied(pos)) {
            console.log('Position already occupied');
            return;
        }

        // Place the unit
        const newState = cloneState(state);
        const unit = newState.units.find(u => u.id === selectedUnit);
        if (unit) {
            // Clear previous position if any
            if (unit.pos) {
                const tile = newState.grid.tiles.find(t =>
                    t.q === unit.pos!.q && t.r === unit.pos!.r
                );
                if (tile) {
                    tile.occupied = undefined;
                }
            }

            // Set new position
            unit.pos = pos;
            const newTile = newState.grid.tiles.find(t =>
                t.q === pos.q && t.r === pos.r
            );
            if (newTile) {
                newTile.occupied = unit.id;
            }

            setState(newState);
            setSelectedUnit(undefined);
        }
    }

    function handleAutoDeployment() {
        const newState = cloneState(state);
        const availableHexes = [...state.friendlyDeployment.hexes];

        playerUnits.forEach((unit, index) => {
            if (index < availableHexes.length) {
                const pos = availableHexes[index];

                // Clear previous position
                if (unit.pos) {
                    const oldTile = newState.grid.tiles.find(t =>
                        t.q === unit.pos!.q && t.r === unit.pos!.r
                    );
                    if (oldTile) {
                        oldTile.occupied = undefined;
                    }
                }

                // Set new position
                const unitRef = newState.units.find(u => u.id === unit.id);
                if (unitRef) {
                    unitRef.pos = pos;
                    const newTile = newState.grid.tiles.find(t =>
                        t.q === pos.q && t.r === pos.r
                    );
                    if (newTile) {
                        newTile.occupied = unit.id;
                    }
                }
            }
        });

        setState(newState);
    }

    function handleClearDeployment() {
        const newState = cloneState(state);

        // Clear all unit positions
        newState.units.forEach(unit => {
            if (unit.faction === 'Player' && !unit.isCommander) {
                if (unit.pos) {
                    const tile = newState.grid.tiles.find(t =>
                        t.q === unit.pos!.q && t.r === unit.pos!.r
                    );
                    if (tile) {
                        tile.occupied = undefined;
                    }
                }
                unit.pos = undefined;
            }
        });

        setState(newState);
    }

    function handleStartBattle() {
        // Validate all units are deployed
        const undeployedUnits = playerUnits.filter(u => !u.pos);
        if (undeployedUnits.length > 0) {
            alert(`Please deploy all units before starting battle. Missing: ${undeployedUnits.map(u => u.name).join(', ')}`);
            return;
        }

        const finalState = cloneState(state);
        startBattle(finalState);
        onReady(finalState);
    }

    const allUnitsDeployed = playerUnits.every(u => u.pos);
    const deployedCount = playerUnits.filter(u => u.pos).length;

    return (
        <div className="h-screen bg-gray-900 text-white flex">
            {/* Main battlefield */}
            <div className="flex-1 p-4">
                <div className="mb-4">
                    <h2 className="text-2xl font-bold mb-2">Deploy Your Forces</h2>
                    <p className="text-gray-300">
                        Click on a unit, then click on a green deployment hex to place them.
                    </p>
                </div>

                <BattleCanvas
                    state={state}
                    onTileClick={handleTileClick}
                    selectedUnit={selectedUnit || undefined}
                    showGrid={true}
                />
            </div>

            {/* Right sidebar */}
            <div className="w-80 p-4 border-l border-gray-700 space-y-4">
                {/* Deployment status */}
                <div className="bg-gray-800 rounded-lg p-4">
                    <h3 className="text-lg font-semibold mb-2">Deployment Status</h3>
                    <div className="space-y-2">
                        <div className="text-sm">
                            Units Deployed: {deployedCount}/{playerUnits.length}
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                            <div
                                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${(deployedCount / playerUnits.length) * 100}%` }}
                            />
                        </div>
                        <div className="text-xs text-gray-400">
                            Biome: {state.context.biome} | Weather: {state.context.weather || 'Clear'}
                        </div>
                    </div>
                </div>

                {/* Unit list */}
                <div className="bg-gray-800 rounded-lg p-4">
                    <h3 className="text-lg font-semibold mb-2">Your Units</h3>
                    <div className="space-y-2">
                        {playerUnits.map(unit => (
                            <div
                                key={unit.id}
                                onClick={() => handleUnitSelect(unit.id)}
                                className={`p-3 rounded cursor-pointer transition-colors border-2 ${selectedUnit === unit.id
                                    ? 'bg-green-700 border-green-500'
                                    : unit.pos
                                        ? 'bg-gray-700 border-green-600 hover:bg-gray-600'
                                        : 'bg-gray-700 border-red-600 hover:bg-gray-600'
                                    }`}
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="font-medium">{unit.name}</div>
                                        <div className="text-sm opacity-75">
                                            Lv{unit.level} {unit.archetype}
                                        </div>
                                        <div className="text-sm">
                                            HP: {unit.stats.hp}/{unit.stats.maxHp} | SPD: {unit.stats.spd}
                                        </div>
                                    </div>
                                    <div className="text-xs">
                                        {unit.pos ? (
                                            <span className="text-green-400">✓ Deployed</span>
                                        ) : (
                                            <span className="text-red-400">○ Waiting</span>
                                        )}
                                    </div>
                                </div>

                                {/* Unit abilities preview */}
                                <div className="mt-2 text-xs">
                                    <div className="opacity-75">Skills: {unit.skills.join(', ')}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Deployment controls */}
                <div className="bg-gray-800 rounded-lg p-4 space-y-2">
                    <h3 className="text-lg font-semibold mb-2">Quick Actions</h3>

                    <button
                        onClick={handleAutoDeployment}
                        className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded font-medium"
                    >
                        Auto Deploy
                    </button>

                    <button
                        onClick={handleClearDeployment}
                        className="w-full px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded font-medium"
                    >
                        Clear All
                    </button>

                    <button
                        onClick={handleStartBattle}
                        disabled={!allUnitsDeployed}
                        className={`w-full px-4 py-2 rounded font-medium transition-colors ${allUnitsDeployed
                            ? 'bg-green-600 hover:bg-green-700'
                            : 'bg-gray-600 cursor-not-allowed'
                            }`}
                    >
                        {allUnitsDeployed ? 'Begin Battle!' : `Deploy ${playerUnits.length - deployedCount} More Units`}
                    </button>
                </div>

                {/* Battle preview */}
                <div className="bg-gray-800 rounded-lg p-4">
                    <h3 className="text-lg font-semibold mb-2">Battle Info</h3>
                    <div className="text-sm space-y-1">
                        <div>Seed: <span className="font-mono text-xs">{state.context.seed}</span></div>
                        <div>Grid: {state.grid.width}×{state.grid.height} hexes</div>
                        <div>Enemies: {state.units.filter(u => u.faction === 'Enemy').length} units</div>
                        <div>Site: {state.context.site || 'Unknown'}</div>
                    </div>
                </div>

                {/* Tips */}
                <div className="bg-blue-900 rounded-lg p-4">
                    <h3 className="text-sm font-semibold mb-2">💡 Deployment Tips</h3>
                    <ul className="text-xs space-y-1 opacity-75">
                        <li>• Place ranged units in the back</li>
                        <li>• Put tanks in front to protect others</li>
                        <li>• Keep healers centrally positioned</li>
                        <li>• Consider terrain for cover bonuses</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}