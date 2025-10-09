import React, { useState, useEffect } from 'react';
import type { BattleState, _Unit, HexPosition } from '../types';
import { sanitizeBattleState } from '../typeGuards';
import { BattleCanvas } from './renderer2d';
import {
    nextPhase,
    executeAbility,
    moveUnit,
    checkVictoryConditions,
    getValidMoves
} from '../engine';
import { ABILITIES } from '../abilities';
import { _calculateAIAction, executeAITurn } from '../ai';
import { _calculateBattleRewards } from '../economy';

interface BattleScreenProps {
    initialState: BattleState;
    onExit: (result: 'Victory' | 'Defeat' | 'Retreat', finalState: BattleState) => void;
}

function cloneState(state: BattleState): BattleState {
    // Deep clone and sanitize to ensure type safety
    const cloned = JSON.parse(JSON.stringify(state));
    return sanitizeBattleState(cloned);
} export function BattleScreen({ initialState, onExit }: BattleScreenProps) {
    const [state, setState] = useState<BattleState>(cloneState(initialState));
    const [selectedUnit, setSelectedUnit] = useState<string | undefined>(undefined);
    const [selectedAbility, setSelectedAbility] = useState<string | null>(null);
    const [targetMode, setTargetMode] = useState<'move' | 'ability' | null>(null);
    const [validMoves, setValidMoves] = useState<HexPosition[]>([]);
    const [showLog, setShowLog] = useState(false);

    // Handle phase transitions and AI turns
    useEffect(() => {
        if (state.phase === 'EnemyTurn') {
            // Execute AI turn after a brief delay
            const timer = setTimeout(() => {
                const newState = cloneState(state);
                executeAITurn(newState);
                checkVictoryConditions(newState);

                if (newState.phase === 'Victory' || newState.phase === 'Defeat') {
                    setState(newState);
                } else {
                    nextPhase(newState);
                    setState(newState);
                }
            }, 1000);

            return () => clearTimeout(timer);
        }
    }, [state.phase]);

    // Check for battle end conditions
    useEffect(() => {
        if (state.phase === 'Victory' || state.phase === 'Defeat') {
            onExit(state.phase, state);
        }
    }, [state.phase, onExit]);

    const playerUnits = state.units.filter(u =>
        u.faction === 'Player' && !u.isDead && !u.isCommander && u.pos
    );

    const selectedUnitData = selectedUnit ?
        state.units.find(u => u.id === selectedUnit) : null;

    const availableAbilities = selectedUnitData?.skills.map(skillId => ABILITIES[skillId]).filter(Boolean) || [];

    function handleUnitSelect(unitId: string) {
        setSelectedUnit(unitId);
        setSelectedAbility(null);
        setTargetMode(null);

        // Update valid moves for selected unit
        const moves = getValidMoves(state, unitId);
        setValidMoves(moves);
    }

    function handleAbilitySelect(abilityId: string) {
        setSelectedAbility(abilityId);
        setTargetMode('ability');
    }

    function handleMoveMode() {
        setTargetMode('move');
        setSelectedAbility(null);
    }

    function handleTileClick(pos: HexPosition) {
        if (!selectedUnit || !selectedUnitData) return;

        if (targetMode === 'move') {
            // Try to move unit
            const newState = cloneState(state);
            const success = moveUnit(newState, selectedUnit, pos);

            if (success) {
                setState(newState);
                setTargetMode(null);
                setValidMoves([]);
            }
        } else if (targetMode === 'ability' && selectedAbility) {
            // Try to use ability
            const newState = cloneState(state);
            const success = executeAbility(newState, selectedUnit, selectedAbility, pos);

            if (success) {
                setState(newState);
                setSelectedAbility(null);
                setTargetMode(null);
                checkVictoryConditions(newState);
            }
        }
    }

    function handleEndPhase() {
        const newState = cloneState(state);
        nextPhase(newState);
        setState(newState);

        // Clear selections
        setSelectedUnit(undefined);
        setSelectedAbility(null);
        setTargetMode(null);
        setValidMoves([]);
    }

    function handleRetreat() {
        onExit('Retreat', state);
    }

    function handleCommanderAbility(abilityId: string) {
        // TODO: Implement commander abilities
        console.log('Commander ability:', abilityId);
    }

    const canEndPhase = state.phase === 'HeroTurn' || state.phase === 'UnitsTurn';
    const isPlayerTurn = state.phase === 'HeroTurn' || state.phase === 'UnitsTurn';

    return (
        <div className="h-screen bg-gray-900 text-white flex overflow-hidden">
            {/* Main battlefield - scrollable container */}
            <div className="flex-1 relative overflow-auto">
                <div className="p-4 min-w-full min-h-full flex items-center justify-center">
                    <BattleCanvas
                        state={state}
                        onTileClick={handleTileClick}
                        selectedUnit={selectedUnit}
                        showGrid={true}
                    />
                </div>
            </div>

            {/* Right sidebar */}
            <div className="w-80 p-4 border-l border-gray-700 space-y-4">
                {/* Battle status */}
                <div className="bg-gray-800 rounded-lg p-4">
                    <h3 className="text-lg font-semibold mb-2">Battle Status</h3>
                    <div className="space-y-1 text-sm">
                        <div>Turn: {state.turn}</div>
                        <div>Phase: <span className="font-medium">{state.phase}</span></div>
                        <div>Biome: {state.context.biome}</div>
                    </div>
                </div>

                {/* Commander panel (Hero Turn) */}
                {state.phase === 'HeroTurn' && (
                    <div className="bg-blue-900 rounded-lg p-4">
                        <h3 className="text-lg font-semibold mb-2">Commander Actions</h3>
                        <div className="space-y-2">
                            {state.commander.abilities.map(ability => (
                                <button
                                    key={ability.id}
                                    onClick={() => handleCommanderAbility(ability.id)}
                                    className="w-full text-left px-3 py-2 bg-blue-800 hover:bg-blue-700 rounded text-sm"
                                    disabled={(state.commander.runtime.cooldowns?.[ability.id] || 0) > 0}
                                >
                                    <div className="font-medium">{ability.name}</div>
                                    <div className="text-xs opacity-75">{ability.description}</div>
                                    {(state.commander.runtime.cooldowns?.[ability.id] || 0) > 0 && (
                                        <div className="text-xs text-red-300">
                                            Cooldown: {state.commander.runtime.cooldowns?.[ability.id] || 0}
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Unit selection */}
                {isPlayerTurn && (
                    <div className="bg-gray-800 rounded-lg p-4">
                        <h3 className="text-lg font-semibold mb-2">Your Units</h3>
                        <div className="space-y-2">
                            {playerUnits.map(unit => (
                                <div
                                    key={unit.id}
                                    onClick={() => handleUnitSelect(unit.id)}
                                    className={`p-3 rounded cursor-pointer transition-colors ${selectedUnit === unit.id
                                        ? 'bg-green-700 border-2 border-green-500'
                                        : 'bg-gray-700 hover:bg-gray-600'
                                        }`}
                                >
                                    <div className="font-medium">{unit.name}</div>
                                    <div className="text-sm opacity-75">
                                        Lv{unit.level} {unit.archetype}
                                    </div>
                                    <div className="text-sm">
                                        HP: {unit.stats.hp}/{unit.stats.maxHp}
                                    </div>
                                    {unit.statuses.length > 0 && (
                                        <div className="text-xs text-yellow-300">
                                            {unit.statuses.map(s => s.name).join(', ')}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Unit actions */}
                {selectedUnitData && isPlayerTurn && (
                    <div className="bg-gray-800 rounded-lg p-4">
                        <h3 className="text-lg font-semibold mb-2">Actions</h3>

                        {/* Movement */}
                        <button
                            onClick={handleMoveMode}
                            className={`w-full mb-2 px-3 py-2 rounded text-sm ${targetMode === 'move'
                                ? 'bg-blue-600'
                                : 'bg-gray-700 hover:bg-gray-600'
                                }`}
                        >
                            Move ({selectedUnitData.stats.move} hexes)
                        </button>

                        {/* Abilities */}
                        <div className="space-y-1">
                            <div className="text-sm font-medium mb-1">Abilities:</div>
                            {availableAbilities.map(ability => (
                                <button
                                    key={ability.id}
                                    onClick={() => handleAbilitySelect(ability.id)}
                                    className={`w-full text-left px-3 py-2 rounded text-sm ${selectedAbility === ability.id
                                        ? 'bg-red-600'
                                        : 'bg-gray-700 hover:bg-gray-600'
                                        }`}
                                >
                                    <div className="font-medium">{ability.name}</div>
                                    <div className="text-xs opacity-75">
                                        Range: {ability.range} | Cooldown: {ability.cooldown}
                                    </div>
                                    {ability.damage && (
                                        <div className="text-xs text-red-300">
                                            Damage: {ability.damage.amount} {ability.damage.type}
                                        </div>
                                    )}
                                    {ability.healing && (
                                        <div className="text-xs text-green-300">
                                            Healing: {ability.healing}
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Phase controls */}
                <div className="bg-gray-800 rounded-lg p-4 space-y-2">
                    {canEndPhase && (
                        <button
                            onClick={handleEndPhase}
                            className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 rounded font-medium"
                        >
                            End {state.phase}
                        </button>
                    )}

                    <button
                        onClick={handleRetreat}
                        className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 rounded font-medium"
                    >
                        Retreat
                    </button>
                </div>

                {/* Battle log */}
                <div className="bg-gray-800 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="text-lg font-semibold">Battle Log</h3>
                        <button
                            onClick={() => setShowLog(!showLog)}
                            className="text-sm px-2 py-1 bg-gray-700 rounded hover:bg-gray-600"
                        >
                            {showLog ? 'Hide' : 'Show'}
                        </button>
                    </div>

                    {showLog && (
                        <div className="max-h-32 overflow-y-auto text-sm space-y-1">
                            {state.log.slice(-10).map((entry, index) => (
                                <div key={index} className="opacity-75">
                                    {entry}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}