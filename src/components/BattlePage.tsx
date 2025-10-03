/**
 * BattlePage.tsx - Minimal, production-ready battle interface
 * Clean route accessible at /battle for testing and standalone battles
 */

import React, { useState, useCallback } from 'react';
import { BattleState, Unit, HexPosition } from '../battle/types';
import { BattleHUD } from '../battle/BattleHUD';
import { BattleStage } from '../battle/BattleStage';
import { generateBattlefieldHex } from '../battle/generate_hex';
import {
    startBattle,
    nextPhase,
    executeAbility,
    checkVictoryConditions,
    findPath,
    hexDistance
} from '../battle/engine';

// Quick battle setup
function createQuickBattle(): BattleState {
    const { grid, friendly, enemy } = generateBattlefieldHex({
        seed: `quick-${Date.now()}`,
        biome: "Grass"
    });

    // Hero commander setup
    const heroCommander = {
        unitId: "hero-1",
        aura: { name: "Heroic Presence", stats: { atk: 2, def: 1, spd: 1 } },
        abilities: [
            {
                id: "rally",
                name: "Rally",
                type: "command" as const,
                apCost: 0,
                range: 6,
                shape: "ally" as const,
                healing: 5,
                cooldown: 3,
                description: "Heal and inspire nearby allies"
            },
            {
                id: "fireball",
                name: "Fireball",
                type: "spell" as const,
                apCost: 0,
                range: 8,
                shape: "blast1" as const,
                damage: { amount: 8, type: "fire" },
                aoeRadius: 1,
                cooldown: 2,
                description: "Explosive blast in target area"
            },
            {
                id: "lightning",
                name: "Lightning Strike",
                type: "spell" as const,
                apCost: 0,
                range: 10,
                shape: "single" as const,
                damage: { amount: 6, type: "lightning" },
                cooldown: 1,
                description: "Precise electrical attack"
            }
        ],
        runtime: {
            cooldowns: {},
            actionPoints: 3
        }
    };

    // Player mercenaries
    const playerUnits: Unit[] = [
        {
            id: "p1",
            name: "Knight",
            kind: "Mercenary",
            faction: "Player",
            race: "Human",
            archetype: "Warrior",
            level: 2,
            stats: { hp: 18, maxHp: 18, atk: 6, def: 4, mag: 0, res: 2, spd: 3, rng: 1, move: 3 },
            statuses: [],
            skills: [],
            pos: { q: 2, r: 4 },
            isDead: false,
            hasMoved: false,
            hasActed: false
        },
        {
            id: "p2",
            name: "Ranger",
            kind: "Mercenary",
            faction: "Player",
            race: "Human",
            archetype: "Archer",
            level: 2,
            stats: { hp: 12, maxHp: 12, atk: 5, def: 2, mag: 0, res: 1, spd: 5, rng: 4, move: 4 },
            statuses: [],
            skills: [],
            pos: { q: 1, r: 5 },
            isDead: false,
            hasMoved: false,
            hasActed: false
        },
        {
            id: "p3",
            name: "Battle Mage",
            kind: "Mercenary",
            faction: "Player",
            race: "Human",
            archetype: "Mage",
            level: 2,
            stats: { hp: 10, maxHp: 10, atk: 2, def: 1, mag: 6, res: 3, spd: 4, rng: 3, move: 3 },
            statuses: [],
            skills: [],
            pos: { q: 3, r: 6 },
            isDead: false,
            hasMoved: false,
            hasActed: false
        }
    ];

    // Enemy units
    const enemyUnits: Unit[] = [
        {
            id: "e1",
            name: "Orc Warrior",
            kind: "Monster",
            faction: "Enemy",
            race: "Orc",
            archetype: "Brute",
            level: 2,
            stats: { hp: 16, maxHp: 16, atk: 5, def: 2, mag: 0, res: 1, spd: 3, rng: 1, move: 3 },
            statuses: [],
            skills: [],
            pos: { q: 12, r: 5 },
            isDead: false,
            hasMoved: false,
            hasActed: false
        },
        {
            id: "e2",
            name: "Orc Archer",
            kind: "Monster",
            faction: "Enemy",
            race: "Orc",
            archetype: "Archer",
            level: 2,
            stats: { hp: 10, maxHp: 10, atk: 4, def: 1, mag: 0, res: 0, spd: 4, rng: 3, move: 3 },
            statuses: [],
            skills: [],
            pos: { q: 13, r: 7 },
            isDead: false,
            hasMoved: false,
            hasActed: false
        },
        {
            id: "e3",
            name: "Orc Shaman",
            kind: "Monster",
            faction: "Enemy",
            race: "Orc",
            archetype: "Shaman",
            level: 3,
            stats: { hp: 12, maxHp: 12, atk: 2, def: 2, mag: 5, res: 3, spd: 3, rng: 2, move: 3 },
            statuses: [],
            skills: [],
            pos: { q: 14, r: 6 },
            isDead: false,
            hasMoved: false,
            hasActed: false
        }
    ];

    const state: BattleState = {
        id: `battle-${Date.now()}`,
        turn: 0,
        phase: "Setup",
        grid,
        context: { seed: `quick-${Date.now()}`, biome: "Grass" },
        commander: heroCommander,
        units: [...playerUnits, ...enemyUnits],
        initiative: [],
        friendlyDeployment: friendly,
        enemyDeployment: enemy,
        log: []
    };

    startBattle(state);
    return state;
}

export function BattlePage() {
    const [state, setState] = useState<BattleState>(createQuickBattle());
    const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
    const [targetingMode, setTargetingMode] = useState<string | null>(null);

    // Handle hex clicks for movement and targeting
    const handleHexClick = useCallback((pos: HexPosition) => {
        if (targetingMode && state.phase === "HeroTurn") {
            // Execute hero ability
            const success = executeAbility(state, "hero-1", targetingMode, pos);
            if (success) {
                setTargetingMode(null);
                checkVictoryConditions(state);
                setState({ ...state });
            }
            return;
        }

        if (selectedUnit && selectedUnit.faction === "Player" && state.phase === "UnitsTurn") {
            // Move selected unit
            if (!selectedUnit.hasMoved && selectedUnit.pos) {
                const distance = hexDistance(selectedUnit.pos, pos);
                if (distance <= selectedUnit.stats.move) {
                    const path = findPath(state.grid, selectedUnit.pos, pos, selectedUnit.stats.move);
                    if (path && path.length > 1) {
                        // Clear old position
                        const oldTile = state.grid.tiles.find(t =>
                            t.q === selectedUnit.pos!.q && t.r === selectedUnit.pos!.r
                        );
                        if (oldTile) oldTile.occupied = undefined;

                        // Update unit position
                        selectedUnit.pos = pos;
                        selectedUnit.hasMoved = true;

                        // Mark new tile as occupied
                        const newTile = state.grid.tiles.find(t => t.q === pos.q && t.r === pos.r);
                        if (newTile) newTile.occupied = selectedUnit.id;

                        state.log.push(`${selectedUnit.name} moves to (${pos.q}, ${pos.r})`);
                        setState({ ...state });
                    }
                }
            }

            // Attack if in range
            const targetUnit = state.units.find(u =>
                u.pos && u.pos.q === pos.q && u.pos.r === pos.r &&
                u.faction !== selectedUnit.faction && !u.isDead
            );

            if (targetUnit && !selectedUnit.hasActed && selectedUnit.pos) {
                const distance = hexDistance(selectedUnit.pos, targetUnit.pos!);
                if (distance <= selectedUnit.stats.rng) {
                    const damage = Math.max(1, selectedUnit.stats.atk - targetUnit.stats.def);
                    targetUnit.stats.hp = Math.max(0, targetUnit.stats.hp - damage);

                    if (targetUnit.stats.hp === 0) {
                        targetUnit.isDead = true;
                        const tile = state.grid.tiles.find(t =>
                            t.q === targetUnit.pos!.q && t.r === targetUnit.pos!.r
                        );
                        if (tile) tile.occupied = undefined;
                    }

                    selectedUnit.hasActed = true;
                    state.log.push(`${selectedUnit.name} attacks ${targetUnit.name} for ${damage} damage!`);
                    checkVictoryConditions(state);
                    setState({ ...state });
                }
            }
        }
    }, [state, selectedUnit, targetingMode]);

    // Handle unit selection
    const handleUnitSelect = useCallback((unit: Unit | null) => {
        setSelectedUnit(unit);
        setTargetingMode(null);
    }, []);

    // Handle ability usage
    const handleAbilityUse = useCallback((abilityId: string, unitId: string) => {
        if (unitId === "hero-1") {
            // Hero ability - enter targeting mode
            setTargetingMode(abilityId);
            state.log.push(`Select target for ${abilityId}`);
            setState({ ...state });
        }
    }, [state]);

    // Handle phase transitions
    const handleEndTurn = useCallback(() => {
        // Reset unit states for new phase
        if (state.phase === "UnitsTurn") {
            state.units.forEach(unit => {
                if (unit.faction === "Player") {
                    unit.hasMoved = false;
                    unit.hasActed = false;
                }
            });
        }

        nextPhase(state);
        setSelectedUnit(null);
        setTargetingMode(null);
        setState({ ...state });
    }, [state]);

    // Handle defend action
    const handleDefend = useCallback((unitId: string) => {
        const unit = state.units.find(u => u.id === unitId);
        if (unit && !unit.hasActed) {
            unit.hasActed = true;
            // Add temporary defense boost (would need status system for full implementation)
            state.log.push(`${unit.name} takes a defensive stance (+2 DEF until next turn)`);
            setState({ ...state });
        }
    }, [state]);

    // Handle wait action
    const handleWait = useCallback((unitId: string) => {
        const unit = state.units.find(u => u.id === unitId);
        if (unit && !unit.hasActed) {
            unit.hasActed = true;
            unit.hasMoved = true;
            state.log.push(`${unit.name} waits...`);
            setState({ ...state });
        }
    }, [state]);

    // Reset battle
    const handleReset = useCallback(() => {
        setState(createQuickBattle());
        setSelectedUnit(null);
        setTargetingMode(null);
    }, []);

    return (
        <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 320px',
            gap: '16px',
            padding: '16px',
            height: '100vh',
            maxHeight: '100vh',
            overflow: 'hidden',
            backgroundColor: '#121212',
            fontFamily: 'system-ui, sans-serif'
        }}>
            {/* Main battle area */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', minHeight: 0 }}>
                {/* Title and controls */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 16px',
                    backgroundColor: '#1a1a1a',
                    borderRadius: '8px',
                    border: '1px solid #333'
                }}>
                    <h1 style={{ margin: 0, color: '#ffffff', fontSize: '24px' }}>
                        Tactical Battle System
                    </h1>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                            onClick={handleReset}
                            style={{
                                padding: '8px 16px',
                                backgroundColor: '#2196F3',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '14px'
                            }}
                        >
                            🔄 New Battle
                        </button>
                    </div>
                </div>

                {/* Battle stage */}
                <div style={{ flex: 1, minHeight: 0 }}>
                    <BattleStage
                        state={state}
                        selectedUnit={selectedUnit}
                        onHexClick={handleHexClick}
                        onUnitSelect={handleUnitSelect}
                        showGrid={true}
                        style={{ height: '100%' }}
                    />
                </div>

                {/* Targeting hint */}
                {targetingMode && (
                    <div style={{
                        padding: '12px',
                        backgroundColor: '#1a1a1a',
                        borderRadius: '8px',
                        border: '1px solid #FFC107',
                        color: '#ffffff',
                        textAlign: 'center'
                    }}>
                        🎯 <strong>Targeting Mode:</strong> Click a hex to use <em>{targetingMode}</em>
                    </div>
                )}
            </div>

            {/* HUD sidebar */}
            <div style={{ minHeight: 0, overflowY: 'auto' }}>
                <BattleHUD
                    state={state}
                    selectedUnit={selectedUnit}
                    onAbilityUse={handleAbilityUse}
                    onEndTurn={handleEndTurn}
                    onDefend={handleDefend}
                    onWait={handleWait}
                />
            </div>
        </div>
    );
}