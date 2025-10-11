/**
 * Phase Battle Demo - Using new Brigandine-style phase engine
 * Clean demonstration of event-driven phase-based combat
 */

import React, { useState, useEffect, useRef } from 'react';
import { PixiHexBattle } from '../features/battle';
import { PhaseEngine, type BattleEvent } from '../features/battle';
import type { BattleState, Unit, HexPosition } from '../features/battle/types';

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
            stats: { hp: 80, maxHp: 100, atk: 15, def: 12, mag: 5, res: 8, spd: 8, rng: 1, move: 3 },
            statuses: [],
            skills: [],
            pos: { q: -2, r: 0 },
            isDead: false,
        },
        {
            id: 'player_2',
            name: 'Archer',
            kind: 'Mercenary',
            faction: 'Player',
            race: 'Sylvanborn',
            archetype: 'Ranger',
            level: 4,
            stats: { hp: 50, maxHp: 60, atk: 12, def: 6, mag: 4, res: 5, spd: 12, rng: 4, move: 4 },
            statuses: [],
            skills: [],
            pos: { q: -1, r: -1 },
            isDead: false,
        },
    ];

    const enemyUnits: Unit[] = [
        {
            id: 'enemy_1',
            name: 'Goblin Warrior',
            kind: 'Monster',
            faction: 'Enemy',
            race: 'Goblin',
            archetype: 'Warrior',
            level: 3,
            stats: { hp: 40, maxHp: 50, atk: 10, def: 6, mag: 2, res: 4, spd: 10, rng: 1, move: 3 },
            statuses: [],
            skills: [],
            pos: { q: 2, r: -1 },
            isDead: false,
        },
        {
            id: 'enemy_2',
            name: 'Goblin Archer',
            kind: 'Monster',
            faction: 'Enemy',
            race: 'Goblin',
            archetype: 'Archer',
            level: 3,
            stats: { hp: 30, maxHp: 35, atk: 8, def: 4, mag: 2, res: 3, spd: 11, rng: 3, move: 3 },
            statuses: [],
            skills: [],
            pos: { q: 3, r: 0 },
            isDead: false,
        },
    ];

    // Simple 11x11 hex grid
    const tiles: any[] = [];
    const width = 11, height = 11;
    for (let q = 0; q < width; q++) {
        for (let r = 0; r < height; r++) {
            tiles.push({
                q: q - Math.floor(width / 2),
                r: r - Math.floor(height / 2),
                terrain: 'Grass' as const,
                elevation: 0,
                passable: true,
                occupied: undefined,
            });
        }
    }

    return {
        id: 'demo_battle',
        turn: 1,
        phase: 'HeroTurn',
        grid: { width, height, tiles },
        context: { seed: 'demo', biome: 'Forest' },
        commander: {
            unitId: 'commander_1',
            aura: { name: 'Leadership', stats: { atk: 2, def: 2 } },
            abilities: [],
            runtime: {},
        },
        units: [...playerUnits, ...enemyUnits],
        initiative: [],
        friendlyDeployment: { hexes: [], faction: 'Player' },
        enemyDeployment: { hexes: [], faction: 'Enemy' },
        log: [],
    };
}

export default function PhaseBattleDemo() {
    const [battleState, setBattleState] = useState<BattleState>(createSampleBattle());
    const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
    const [validMoves, setValidMoves] = useState<HexPosition[]>([]);
    const [validTargets, setValidTargets] = useState<Unit[]>([]);
    const [eventLog, setEventLog] = useState<BattleEvent[]>([]);
    const engineRef = useRef<PhaseEngine | null>(null);

    // Derive selectedUnit from ID
    const selectedUnit = selectedUnitId 
        ? battleState.units.find(u => u.id === selectedUnitId) || null
        : null;

    // Initialize engine
    useEffect(() => {
        const engine = new PhaseEngine(battleState);
        engine.startBattle();
        engineRef.current = engine;
        setEventLog([...engine.events]);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Only run once on mount

    // Update event log when battle state changes
    useEffect(() => {
        if (engineRef.current) {
            setEventLog([...engineRef.current.events]);
        }
    }, [battleState]);

    const handleHexClick = (hex: HexPosition) => {
        const engine = engineRef.current;
        if (!engine) return;

        // Check if there's a unit at this hex
        const unitAtHex = battleState.units.find(u =>
            u.pos && u.pos.q === hex.q && u.pos.r === hex.r && !u.isDead
        );

        if (unitAtHex && unitAtHex.faction === 'Player') {
            // Select player unit
            setSelectedUnitId(unitAtHex.id);
            const moves = engine.getValidMoves(unitAtHex.id);
            const targets = engine.getValidTargets(unitAtHex.id);
            setValidMoves(moves);
            setValidTargets(targets);
        } else if (selectedUnit && validMoves.some(m => m.q === hex.q && m.r === hex.r)) {
            // Move to valid hex
            const success = engine.move(selectedUnit.id, hex);
            if (success) {
                setBattleState({ ...battleState });
                // Update valid moves and targets after moving
                const newTargets = engine.getValidTargets(selectedUnit.id);
                setValidTargets(newTargets);
                setValidMoves([]);
            }
        } else {
            // Clear selection
            setSelectedUnitId(null);
            setValidMoves([]);
            setValidTargets([]);
        }
    };

    const handleAttack = (targetId: string) => {
        const engine = engineRef.current;
        if (!engine || !selectedUnit) return;

        const success = engine.attack(selectedUnit.id, targetId);
        if (success) {
            setBattleState({ ...battleState });
            setValidTargets([]);
        }
    };

    const handleEndPlayerPhase = () => {
        const engine = engineRef.current;
        if (!engine) return;

        engine.endPhase('Player');
        setBattleState({ ...battleState });
        setSelectedUnitId(null);
        setValidMoves([]);
        setValidTargets([]);
    };

    const handleRunEnemyPhase = () => {
        const engine = engineRef.current;
        if (!engine) return;

        engine.runPhaseAuto('Enemy');
        setBattleState({ ...battleState });
    };

    const isPlayerPhase = battleState.phase === 'HeroTurn' || battleState.phase === 'UnitsTurn';
    const isBattleOver = battleState.phase === 'Victory' || battleState.phase === 'Defeat';

    return (
        <div style={{
            width: '100vw',
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            background: '#1a1a2e',
            color: '#e0e0e0',
        }}>
            {/* Header */}
            <div style={{
                padding: '12px 20px',
                background: '#16213e',
                borderBottom: '2px solid #0f3460',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
            }}>
                <h1 style={{ margin: 0, fontSize: '20px', color: '#4ecca3' }}>
                    ⚔️ Phase Battle Demo
                </h1>
                <div style={{ fontSize: '14px' }}>
                    <span style={{ marginRight: '20px' }}>
                        <strong>Round:</strong> {battleState.turn}
                    </span>
                    <span style={{ 
                        padding: '4px 12px',
                        background: isPlayerPhase ? '#2a4' : '#a24',
                        borderRadius: '4px',
                        fontWeight: 'bold',
                    }}>
                        {isPlayerPhase ? '🔵 Player Phase' : '🔴 Enemy Phase'}
                    </span>
                </div>
            </div>

            {/* Main content */}
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                {/* Battle map */}
                <div style={{ flex: 1, position: 'relative', background: '#0f3460' }}>
                    <PixiHexBattle
                        battleState={battleState}
                        onHexClick={handleHexClick}
                        selectedHex={selectedUnit?.pos}
                        selectedUnit={selectedUnit}
                        validMoves={validMoves}
                        validTargets={validTargets.map(t => t.pos).filter((pos): pos is HexPosition => pos !== undefined)}
                    />
                </div>

                {/* Right sidebar */}
                <div style={{
                    width: '320px',
                    background: '#16213e',
                    borderLeft: '2px solid #0f3460',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                }}>
                    {/* Controls */}
                    <div style={{ padding: '16px', borderBottom: '1px solid #0f3460' }}>
                        {!isBattleOver && (
                            <>
                                <button
                                    onClick={handleEndPlayerPhase}
                                    disabled={!isPlayerPhase}
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        marginBottom: '8px',
                                        background: isPlayerPhase ? '#2a4' : '#555',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: isPlayerPhase ? 'pointer' : 'not-allowed',
                                        fontSize: '14px',
                                        fontWeight: 'bold',
                                    }}
                                >
                                    End Player Phase
                                </button>
                                <button
                                    onClick={handleRunEnemyPhase}
                                    disabled={isPlayerPhase}
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        background: !isPlayerPhase ? '#a24' : '#555',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: !isPlayerPhase ? 'pointer' : 'not-allowed',
                                        fontSize: '14px',
                                        fontWeight: 'bold',
                                    }}
                                >
                                    Run Enemy Phase (Auto)
                                </button>
                            </>
                        )}
                        {isBattleOver && (
                            <div style={{
                                padding: '20px',
                                background: battleState.phase === 'Victory' ? '#2a4' : '#a24',
                                borderRadius: '4px',
                                textAlign: 'center',
                                fontSize: '18px',
                                fontWeight: 'bold',
                            }}>
                                {battleState.phase === 'Victory' ? '🎉 Victory!' : '💀 Defeat'}
                            </div>
                        )}
                    </div>

                    {/* Selected unit */}
                    {selectedUnit && (
                        <div style={{ padding: '16px', borderBottom: '1px solid #0f3460' }}>
                            <h3 style={{ margin: '0 0 8px 0', color: '#4ecca3' }}>
                                {selectedUnit.name}
                            </h3>
                            <div style={{ fontSize: '12px', opacity: 0.8 }}>
                                {selectedUnit.archetype} • Level {selectedUnit.level}
                            </div>
                            <div style={{ marginTop: '8px', fontSize: '13px' }}>
                                <div>HP: {selectedUnit.stats.hp}/{selectedUnit.stats.maxHp}</div>
                                <div>ATK: {selectedUnit.stats.atk} | DEF: {selectedUnit.stats.def}</div>
                                <div>Move: {selectedUnit.stats.move} | Range: {selectedUnit.stats.rng}</div>
                            </div>

                            {/* Attack targets */}
                            {validTargets.length > 0 && (
                                <div style={{ marginTop: '12px' }}>
                                    <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Targets:</div>
                                    {validTargets.map(target => (
                                        <button
                                            key={target.id}
                                            onClick={() => handleAttack(target.id)}
                                            style={{
                                                width: '100%',
                                                padding: '6px',
                                                marginBottom: '4px',
                                                background: '#a24',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                                fontSize: '12px',
                                                textAlign: 'left',
                                            }}
                                        >
                                            ⚔️ {target.name} ({target.stats.hp} HP)
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Event log */}
                    <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
                        <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#4ecca3' }}>
                            Battle Log
                        </h3>
                        <div style={{ fontSize: '11px', fontFamily: 'monospace' }}>
                            {eventLog.slice(-20).reverse().map((event, idx) => (
                                <div key={idx} style={{ marginBottom: '4px', opacity: idx > 10 ? 0.5 : 1 }}>
                                    {formatEvent(event, battleState)}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function formatEvent(event: BattleEvent, state: BattleState): string {
    const getUnit = (id: string) => state.units.find(u => u.id === id)?.name ?? id;

    switch (event.type) {
        case 'BattleStart':
            return `⚔️ Battle begins (Round ${event.round})`;
        case 'PhaseStart':
            return `[${event.phase} Phase Start] Round ${event.round}`;
        case 'PhaseEnd':
            return `[${event.phase} Phase End]`;
        case 'Move':
            return `🚶 ${getUnit(event.unitId)} moves (${event.cost} hexes)`;
        case 'Attack':
            return `⚔️ ${getUnit(event.attackerId)} attacks ${getUnit(event.defenderId)}`;
        case 'Damage':
            return `  💥 ${event.amount} damage (${event.remaining} HP left)`;
        case 'Death':
            return `💀 ${getUnit(event.unitId)} defeated`;
        case 'BattleEnd':
            return `🏁 Battle Over - ${event.winner} wins! (Round ${event.round})`;
        default:
            return JSON.stringify(event);
    }
}
