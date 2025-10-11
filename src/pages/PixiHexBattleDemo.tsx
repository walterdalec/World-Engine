/**
 * Pixi Hex Battle Demo
 * Test page for the GPU-accelerated hex battle renderer
 */

import React, { useState, useEffect } from 'react';
import { PixiHexBattle } from '../features/battle';
import { findPath, moveUnit, hexDistance } from '../features/battle/engine';
import type { BattleState, Unit, HexPosition } from '../features/battle/types';

// Action modes for interaction
type ActionMode = 'select' | 'move' | 'attack';

// Create a sample battle state for testing
function createSampleBattle(): BattleState {
    const playerUnits: Unit[] = [
        {
            id: 'player_1',
            name: 'Knight',
            kind: 'Mercenary',
            faction: 'Player',
            race: 'Human',
            archetype: 'Knight',
            level: 5,
            stats: {
                hp: 80,
                maxHp: 100,
                atk: 15,
                def: 12,
                mag: 5,
                res: 8,
                spd: 8,
                rng: 1,
                move: 3,
            },
            statuses: [],
            skills: ['power_strike', 'shield_bash'],
            pos: { q: -2, r: 0 },
            isDead: false,
            facing: 0,
            hasMoved: false,
            hasActed: false,
        },
        {
            id: 'player_2',
            name: 'Archer',
            kind: 'Mercenary',
            faction: 'Player',
            race: 'Sylvanborn',
            archetype: 'Ranger',
            level: 4,
            stats: {
                hp: 50,
                maxHp: 60,
                atk: 12,
                def: 6,
                mag: 4,
                res: 5,
                spd: 12,
                rng: 4,
                move: 4,
            },
            statuses: [],
            skills: ['arrow_shot', 'volley'],
            pos: { q: -1, r: -1 },
            isDead: false,
            facing: 0,
            hasMoved: false,
            hasActed: false,
        },
        {
            id: 'player_3',
            name: 'Mage',
            kind: 'Mercenary',
            faction: 'Player',
            race: 'Nightborn',
            archetype: 'Mystic',
            level: 5,
            stats: {
                hp: 40,
                maxHp: 50,
                atk: 6,
                def: 5,
                mag: 18,
                res: 12,
                spd: 9,
                rng: 3,
                move: 3,
            },
            statuses: [],
            skills: ['fireball', 'ice_shard'],
            pos: { q: -2, r: 1 },
            isDead: false,
            facing: 0,
            hasMoved: false,
            hasActed: false,
        },
    ];

    const enemyUnits: Unit[] = [
        {
            id: 'enemy_1',
            name: 'Orc Warrior',
            kind: 'Monster',
            faction: 'Enemy',
            race: 'Orc',
            archetype: 'Warrior',
            level: 4,
            stats: {
                hp: 90,
                maxHp: 90,
                atk: 14,
                def: 10,
                mag: 2,
                res: 4,
                spd: 6,
                rng: 1,
                move: 3,
            },
            statuses: [],
            skills: ['cleave'],
            pos: { q: 2, r: 0 },
            isDead: false,
            facing: 3,
            hasMoved: false,
            hasActed: false,
        },
        {
            id: 'enemy_2',
            name: 'Goblin Scout',
            kind: 'Monster',
            faction: 'Enemy',
            race: 'Goblin',
            archetype: 'Scout',
            level: 3,
            stats: {
                hp: 30,
                maxHp: 40,
                atk: 8,
                def: 4,
                mag: 1,
                res: 3,
                spd: 14,
                rng: 3,
                move: 5,
            },
            statuses: [],
            skills: ['dagger_throw'],
            pos: { q: 1, r: -1 },
            isDead: false,
            facing: 4,
            hasMoved: false,
            hasActed: false,
        },
        {
            id: 'enemy_3',
            name: 'Dark Shaman',
            kind: 'Monster',
            faction: 'Enemy',
            race: 'Orc',
            archetype: 'Shaman',
            level: 5,
            stats: {
                hp: 45,
                maxHp: 55,
                atk: 5,
                def: 6,
                mag: 16,
                res: 11,
                spd: 7,
                rng: 3,
                move: 3,
            },
            statuses: [],
            skills: ['curse', 'shadow_bolt'],
            pos: { q: 2, r: 1 },
            isDead: false,
            facing: 3,
            hasMoved: false,
            hasActed: false,
        },
    ];

    // Create a simple grid with all passable terrain
    const gridTiles = [];
    for (let q = -5; q <= 5; q++) {
        for (let r = -5; r <= 5; r++) {
            gridTiles.push({
                q,
                r,
                terrain: 'Grass' as const,
                passable: true,
                elevation: 0,
                cover: 0,
            });
        }
    }

    return {
        id: 'demo_battle_001',
        units: [...playerUnits, ...enemyUnits],
        turn: 1,
        phase: 'UnitsTurn',  // Start in UnitsTurn so we can move immediately
        grid: {
            width: 11,
            height: 11,
            tiles: gridTiles,
        },
        context: {
            seed: 'demo_battle_001',
            biome: 'Forest',
            site: 'wilds',
            weather: 'Clear',
        },
        commander: {
            unitId: 'hero_commander',
            aura: {
                name: 'Leadership',
                stats: {},
            },
            abilities: [],
            runtime: {
                cooldowns: {},
                actionPoints: 3,
            },
        },
        initiative: [],
        friendlyDeployment: {
            hexes: [],
            faction: 'Player',
        },
        enemyDeployment: {
            hexes: [],
            faction: 'Enemy',
        },
        log: [],
        selectedUnit: undefined,
        targetHex: undefined,
    };
}

export default function PixiHexBattleDemo() {
    const [battleState, setBattleState] = useState<BattleState>(createSampleBattle());
    const [selectedHex, setSelectedHex] = useState<HexPosition | null>(null);
    const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
    const [actionMode, setActionMode] = useState<ActionMode>('select');
    const [validMoves, setValidMoves] = useState<HexPosition[]>([]);
    const [validTargets, setValidTargets] = useState<HexPosition[]>([]);

    // Debug: Track state changes
    useEffect(() => {
        console.log('🔄 STATE CHANGE - actionMode:', actionMode, 'selectedUnit:', selectedUnit?.name, 'validMoves:', validMoves.length);
    }, [actionMode, selectedUnit, validMoves]);

    // Sync selectedUnit with battleState - keep reference fresh
    useEffect(() => {
        if (selectedUnit) {
            const currentUnit = battleState.units.find(u => u.id === selectedUnit.id);
            if (currentUnit && currentUnit !== selectedUnit) {
                console.log('🔄 Syncing selectedUnit with battleState');
                setSelectedUnit(currentUnit);
            }
        }
    }, [battleState, selectedUnit]);

    // Calculate valid moves for selected unit
    const calculateValidMoves = (unit: Unit): HexPosition[] => {
        console.log('📍 calculateValidMoves for:', unit.name, 'pos:', unit.pos, 'move:', unit.stats.move);
        if (!unit.pos || unit.hasMoved || unit.isDead) {
            console.log('❌ Cannot calculate moves - no pos, already moved, or dead');
            return [];
        }

        const moves: HexPosition[] = [];
        const maxMove = unit.stats.move;
        console.log('🎯 Checking hexes within range:', maxMove);

        // Only check hexes within the movement range (much smaller search space)
        // Use cube distance for more accurate range checking
        for (let q = unit.pos.q - maxMove; q <= unit.pos.q + maxMove; q++) {
            for (let r = unit.pos.r - maxMove; r <= unit.pos.r + maxMove; r++) {
                const targetPos = { q, r };
                
                // Skip if same as current position
                if (q === unit.pos.q && r === unit.pos.r) continue;
                
                // Quick distance check before expensive pathfinding
                const distance = hexDistance(unit.pos, targetPos);
                if (distance > maxMove) continue;

                // Check if occupied by another unit
                const occupied = battleState.units.some(u =>
                    u.pos && u.pos.q === q && u.pos.r === r && !u.isDead
                );
                if (occupied) continue;

                // Only do pathfinding for unoccupied, in-range hexes
                const path = findPath(battleState.grid, unit.pos, targetPos, maxMove);
                if (path && path.length > 0) {
                    moves.push(targetPos);
                }
            }
        }

        console.log('✅ Found', moves.length, 'valid moves');
        return moves;
    };

    // Calculate valid attack targets for selected unit
    const calculateValidTargets = (unit: Unit): HexPosition[] => {
        if (!unit.pos || unit.hasActed || unit.isDead) return [];

        const targets: HexPosition[] = [];
        const range = unit.stats.rng;

        // Find enemy units within range
        for (const enemy of battleState.units) {
            if (enemy.pos && enemy.faction !== unit.faction && !enemy.isDead) {
                const distance = hexDistance(unit.pos, enemy.pos);
                if (distance <= range) {
                    targets.push(enemy.pos);
                }
            }
        }

        return targets;
    };

    const handleHexClick = (hex: HexPosition) => {
        console.log('🎯 Hex clicked:', hex, 'Mode:', actionMode, 'Selected unit:', selectedUnit?.name);
        console.log('📊 State check - validMoves:', validMoves.length, 'validTargets:', validTargets.length);

        // Check if there's a unit at this hex
        const unit = battleState.units.find(u =>
            u.pos && u.pos.q === hex.q && u.pos.r === hex.r && !u.isDead
        );
        console.log('🔍 Unit at hex:', unit?.name || 'none');

        // Priority 1: Handle active action modes (move/attack) before select mode
        if (actionMode === 'move' && selectedUnit) {
            console.log('🚶 Checking move mode...');
            // Move mode - check if hex is valid move target
            const isValidMove = validMoves.some(m => m.q === hex.q && m.r === hex.r);
            console.log('✓ Is valid move?', isValidMove);
            if (isValidMove) {
                console.log('🚶 Moving unit to:', hex);
                setBattleState(prev => {
                    const success = moveUnit(prev, selectedUnit.id, hex);
                    if (success) {
                        // Mark unit as moved
                        const newUnits = prev.units.map(u => {
                            if (u.id === selectedUnit.id) {
                                return { ...u, hasMoved: true };
                            }
                            return u;
                        });
                        
                        // Update selectedUnit reference to the new unit object
                        const updatedUnit = newUnits.find(u => u.id === selectedUnit.id);
                        if (updatedUnit) {
                            setSelectedUnit(updatedUnit);
                        }
                        
                        return { ...prev, units: newUnits };
                    }
                    return prev;
                });
                setActionMode('select');
                setValidMoves([]);
            }
            // If not a valid move, do nothing (stay in move mode)
            return;
        } else if (actionMode === 'attack' && selectedUnit) {
            console.log('⚔️ Checking attack mode...');
            // Attack mode - check if unit is valid target
            const isValidTarget = validTargets.some(t => t.q === hex.q && t.r === hex.r);
            console.log('✓ Is valid target?', isValidTarget, 'Unit faction:', unit?.faction);
            if (isValidTarget && unit && unit.faction !== selectedUnit.faction) {
                console.log('⚔️ Attacking:', unit.name);
                // Simple attack: deal damage based on attacker's ATK vs defender's DEF
                const damage = Math.max(1, selectedUnit.stats.atk - Math.floor(unit.stats.def * 0.5));

                setBattleState(prev => {
                    const newUnits = prev.units.map(u => {
                        if (u.id === unit.id) {
                            const newHp = Math.max(0, u.stats.hp - damage);
                            return {
                                ...u,
                                stats: { ...u.stats, hp: newHp },
                                isDead: newHp <= 0,
                            };
                        }
                        if (u.id === selectedUnit.id) {
                            return { ...u, hasActed: true };
                        }
                        return u;
                    });

                    const newLog = [...prev.log, `${selectedUnit.name} attacks ${unit.name} for ${damage} damage!`];
                    if (unit.stats.hp - damage <= 0) {
                        newLog.push(`${unit.name} has fallen!`);
                    }
                    
                    // Update selectedUnit reference after attack
                    const updatedUnit = newUnits.find(u => u.id === selectedUnit.id);
                    if (updatedUnit) {
                        setSelectedUnit(updatedUnit);
                    }

                    return { ...prev, units: newUnits, log: newLog };
                });
                setActionMode('select');
                setValidTargets([]);
            }
            // If not a valid target, do nothing (stay in attack mode)
            return;
        }

        // Priority 2: Default select mode behavior
        console.log('👆 Default select mode...');
        if (actionMode === 'select' || !selectedUnit) {
            // Select mode or no unit selected - select unit
            if (unit && unit.faction === 'Player') {
                console.log('👤 Unit selected:', unit.name);
                setSelectedUnit(unit);
                setSelectedHex(null);
                setValidMoves([]);
                setValidTargets([]);
            } else {
                setSelectedHex(hex);
                setSelectedUnit(null);
                setValidMoves([]);
                setValidTargets([]);
            }
        }
    };

    const handleDamageUnit = () => {
        if (!selectedUnit) return;

        setBattleState(prev => {
            const newUnits = prev.units.map(u => {
                if (u.id === selectedUnit.id) {
                    const newHp = Math.max(0, u.stats.hp - 20);
                    const updatedUnit = {
                        ...u,
                        stats: { ...u.stats, hp: newHp },
                        isDead: newHp <= 0,
                    };
                    // Update selected unit ref
                    setSelectedUnit(updatedUnit);
                    return updatedUnit;
                }
                return u;
            });

            return {
                ...prev,
                units: newUnits,
            };
        });
    };

    const handleHealUnit = () => {
        if (!selectedUnit) return;

        setBattleState(prev => {
            const newUnits = prev.units.map(u => {
                if (u.id === selectedUnit.id) {
                    const updatedUnit = {
                        ...u,
                        stats: { ...u.stats, hp: Math.min(u.stats.maxHp, u.stats.hp + 25) },
                        isDead: false,
                    };
                    // Update selected unit ref
                    setSelectedUnit(updatedUnit);
                    return updatedUnit;
                }
                return u;
            });

            return {
                ...prev,
                units: newUnits,
            };
        });
    };

    const handleNextPhase = () => {
        setBattleState(prev => {
            const phaseOrder: BattleState['phase'][] = ['HeroTurn', 'UnitsTurn', 'EnemyTurn'];
            const currentIndex = phaseOrder.indexOf(prev.phase);
            const nextIndex = (currentIndex + 1) % phaseOrder.length;
            const nextPhase = phaseOrder[nextIndex];

            // Reset unit actions on new turn
            const resetUnits = prev.units.map(u => ({
                ...u,
                hasMoved: false,
                hasActed: false,
            }));

            return {
                ...prev,
                units: resetUnits,
                phase: nextPhase,
                turn: nextPhase === 'HeroTurn' ? prev.turn + 1 : prev.turn,
            };
        });
        setActionMode('select');
        setValidMoves([]);
        setValidTargets([]);
    };

    const handleReset = () => {
        setBattleState(createSampleBattle());
        setSelectedHex(null);
        setSelectedUnit(null);
        setActionMode('select');
        setValidMoves([]);
        setValidTargets([]);
    };

    const handleMoveMode = () => {
        console.log('🔵 Move button clicked! Unit:', selectedUnit?.name, 'hasMoved:', selectedUnit?.hasMoved);
        if (!selectedUnit || selectedUnit.hasMoved || selectedUnit.faction !== 'Player') {
            console.log('❌ Cannot enter move mode - unit invalid or already moved');
            return;
        }
        console.log('✅ Entering move mode...');
        setActionMode('move');
        const moves = calculateValidMoves(selectedUnit);
        setValidMoves(moves);
        console.log('🚶 Move mode - valid hexes:', moves.length, moves);
    };

    const handleAttackMode = () => {
        console.log('🔴 Attack button clicked! Unit:', selectedUnit?.name, 'hasActed:', selectedUnit?.hasActed);
        if (!selectedUnit || selectedUnit.hasActed || selectedUnit.faction !== 'Player') {
            console.log('❌ Cannot enter attack mode - unit invalid or already acted');
            return;
        }
        console.log('✅ Entering attack mode...');
        setActionMode('attack');
        const targets = calculateValidTargets(selectedUnit);
        setValidTargets(targets);
        console.log('⚔️ Attack mode - valid targets:', targets.length, targets);
    };

    const handleCancelAction = () => {
        setActionMode('select');
        setValidMoves([]);
        setValidTargets([]);
    };

    const handleEndTurn = () => {
        if (!selectedUnit || selectedUnit.faction !== 'Player') return;

        setBattleState(prev => {
            const newUnits = prev.units.map(u => {
                if (u.id === selectedUnit.id) {
                    return { ...u, hasMoved: true, hasActed: true };
                }
                return u;
            });
            return { ...prev, units: newUnits };
        });

        setSelectedUnit(null);
        setActionMode('select');
        setValidMoves([]);
        setValidTargets([]);
    };

    return (
        <div style={{
            width: '100vw',
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            background: '#1a1a2e',
        }}>
            {/* Header */}
            <div style={{
                height: '60px',
                background: '#0f0f1e',
                borderBottom: '2px solid #2a2a3e',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 20px',
                color: 'white',
            }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold' }}>
                        ⚔️ Pixi Hex Battle Demo
                    </h1>
                    <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#888' }}>
                        GPU-accelerated tactical combat renderer
                    </p>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                        onClick={handleNextPhase}
                        style={{
                            padding: '8px 16px',
                            background: '#4444ff',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                        }}
                    >
                        Next Phase
                    </button>

                    <button
                        onClick={handleReset}
                        style={{
                            padding: '8px 16px',
                            background: '#ff4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                        }}
                    >
                        Reset Battle
                    </button>
                </div>
            </div>

            {/* Main content */}
            <div style={{
                flex: 1,
                display: 'flex',
                overflow: 'hidden',
            }}>
                {/* Battle map */}
                <div style={{
                    flex: 1,
                    position: 'relative',
                }}>
                    <PixiHexBattle
                        battleState={battleState}
                        onHexClick={handleHexClick}
                        selectedHex={selectedHex}
                        selectedUnit={selectedUnit}
                        validMoves={validMoves}
                        validTargets={validTargets}
                    />
                </div>

                {/* Side panel */}
                <div style={{
                    width: '300px',
                    background: '#0f0f1e',
                    borderLeft: '2px solid #2a2a3e',
                    padding: '20px',
                    overflowY: 'auto',
                    color: 'white',
                }}>
                    <h2 style={{ margin: '0 0 16px 0', fontSize: '16px' }}>Battle Info</h2>

                    <div style={{ marginBottom: '20px' }}>
                        <p style={{ margin: '4px 0', fontSize: '14px' }}>
                            <strong>Turn:</strong> {battleState.turn}
                        </p>
                        <p style={{ margin: '4px 0', fontSize: '14px' }}>
                            <strong>Phase:</strong> {battleState.phase}
                        </p>
                        <p style={{ margin: '4px 0', fontSize: '14px' }}>
                            <strong>Biome:</strong> {battleState.context.biome}
                        </p>
                    </div>

                    {selectedUnit && (
                        <div style={{
                            background: '#2a2a3e',
                            padding: '12px',
                            borderRadius: '4px',
                            marginBottom: '20px',
                        }}>
                            <h3 style={{
                                margin: '0 0 8px 0',
                                fontSize: '14px',
                                color: selectedUnit.faction === 'Player' ? '#4444ff' : '#ff4444',
                            }}>
                                {selectedUnit.name}
                            </h3>
                            <p style={{ margin: '4px 0', fontSize: '12px' }}>
                                {selectedUnit.archetype} • Level {selectedUnit.level}
                            </p>
                            <p style={{ margin: '4px 0', fontSize: '12px' }}>
                                HP: {selectedUnit.stats.hp}/{selectedUnit.stats.maxHp}
                            </p>
                            <p style={{ margin: '4px 0', fontSize: '12px' }}>
                                Position: ({selectedUnit.pos?.q}, {selectedUnit.pos?.r})
                            </p>
                            <p style={{ margin: '4px 0', fontSize: '12px' }}>
                                Move: {selectedUnit.stats.move} • Range: {selectedUnit.stats.rng}
                            </p>
                            <p style={{ margin: '4px 0', fontSize: '12px', color: selectedUnit.hasMoved ? '#ff4444' : '#44ff44' }}>
                                {selectedUnit.hasMoved ? '✓ Moved' : '○ Can Move'} • {selectedUnit.hasActed ? '✓ Acted' : '○ Can Act'}
                            </p>

                            {/* Tactical Actions */}
                            {selectedUnit.faction === 'Player' && battleState.phase === 'UnitsTurn' && (
                                <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <button
                                        onClick={handleMoveMode}
                                        disabled={selectedUnit.hasMoved || actionMode === 'move'}
                                        style={{
                                            padding: '8px',
                                            background: actionMode === 'move' ? '#44ff88' : '#4488ff',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '4px',
                                            cursor: selectedUnit.hasMoved ? 'not-allowed' : 'pointer',
                                            fontSize: '12px',
                                            fontWeight: 'bold',
                                            opacity: selectedUnit.hasMoved ? 0.5 : 1,
                                        }}
                                    >
                                        🚶 {actionMode === 'move' ? 'Click destination...' : 'Move'}
                                    </button>
                                    <button
                                        onClick={handleAttackMode}
                                        disabled={selectedUnit.hasActed || actionMode === 'attack'}
                                        style={{
                                            padding: '8px',
                                            background: actionMode === 'attack' ? '#ff8844' : '#ff4444',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '4px',
                                            cursor: selectedUnit.hasActed ? 'not-allowed' : 'pointer',
                                            fontSize: '12px',
                                            fontWeight: 'bold',
                                            opacity: selectedUnit.hasActed ? 0.5 : 1,
                                        }}
                                    >
                                        ⚔️ {actionMode === 'attack' ? 'Select target...' : 'Attack'}
                                    </button>
                                    {(actionMode === 'move' || actionMode === 'attack') && (
                                        <button
                                            onClick={handleCancelAction}
                                            style={{
                                                padding: '8px',
                                                background: '#666',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                                fontSize: '12px',
                                            }}
                                        >
                                            ✕ Cancel
                                        </button>
                                    )}
                                    <button
                                        onClick={handleEndTurn}
                                        style={{
                                            padding: '8px',
                                            background: '#888',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                            fontSize: '12px',
                                        }}
                                    >
                                        ⏭️ End Unit Turn
                                    </button>
                                </div>
                            )}

                            {/* Debug Controls */}
                            <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                                <button
                                    onClick={handleDamageUnit}
                                    style={{
                                        flex: 1,
                                        padding: '6px',
                                        background: '#ff4444',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontSize: '11px',
                                    }}
                                >
                                    -20 HP
                                </button>
                                <button
                                    onClick={handleHealUnit}
                                    style={{
                                        flex: 1,
                                        padding: '6px',
                                        background: '#44ff44',
                                        color: 'black',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontSize: '11px',
                                    }}
                                >
                                    +25 HP
                                </button>
                            </div>
                        </div>
                    )}

                    {selectedHex && (
                        <div style={{
                            background: '#2a2a3e',
                            padding: '12px',
                            borderRadius: '4px',
                            marginBottom: '20px',
                        }}>
                            <h3 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>
                                Selected Hex
                            </h3>
                            <p style={{ margin: '4px 0', fontSize: '12px' }}>
                                Q: {selectedHex.q}, R: {selectedHex.r}
                            </p>
                        </div>
                    )}

                    <div>
                        <h3 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>Units</h3>

                        <h4 style={{
                            margin: '12px 0 6px 0',
                            fontSize: '12px',
                            color: '#4444ff'
                        }}>
                            Player ({battleState.units.filter(u => u.faction === 'Player' && !u.isDead).length})
                        </h4>
                        {battleState.units
                            .filter(u => u.faction === 'Player')
                            .map(unit => (
                                <div
                                    key={unit.id}
                                    style={{
                                        padding: '6px',
                                        marginBottom: '4px',
                                        background: unit.isDead ? '#1a1a2e' : '#2a2a3e',
                                        borderRadius: '2px',
                                        fontSize: '11px',
                                        opacity: unit.isDead ? 0.5 : 1,
                                        textDecoration: unit.isDead ? 'line-through' : 'none',
                                    }}
                                >
                                    {unit.name} - HP: {unit.stats.hp}/{unit.stats.maxHp}
                                </div>
                            ))}

                        <h4 style={{
                            margin: '12px 0 6px 0',
                            fontSize: '12px',
                            color: '#ff4444'
                        }}>
                            Enemy ({battleState.units.filter(u => u.faction === 'Enemy' && !u.isDead).length})
                        </h4>
                        {battleState.units
                            .filter(u => u.faction === 'Enemy')
                            .map(unit => (
                                <div
                                    key={unit.id}
                                    style={{
                                        padding: '6px',
                                        marginBottom: '4px',
                                        background: unit.isDead ? '#1a1a2e' : '#2a2a3e',
                                        borderRadius: '2px',
                                        fontSize: '11px',
                                        opacity: unit.isDead ? 0.5 : 1,
                                        textDecoration: unit.isDead ? 'line-through' : 'none',
                                    }}
                                >
                                    {unit.name} - HP: {unit.stats.hp}/{unit.stats.maxHp}
                                </div>
                            ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
