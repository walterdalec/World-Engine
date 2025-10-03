/**
 * MinimalBattlePage.tsx - Simple battle using GameEngine with your reviewed types
 */

import React, { useState, useEffect } from 'react';
import { GameEngine } from '../battle/simple-engine';
import { SimpleBattleHUD } from '../battle/SimpleBattleHUD';
import SimpleBattleStage from '../battle/SimpleBattleStage';
import { Unit } from '../battle/simple-types';

// Create sample units for testing
const createSampleUnits = (): Unit[] => [
    { id: "p1", name: "Dale", team: "player", q: 0, r: 0, move: 4, hp: 10, maxHp: 10, atk: 4, def: 1 },
    { id: "p2", name: "Kaelen", team: "player", q: 1, r: 1, move: 3, hp: 10, maxHp: 10, atk: 3, def: 2 },
    { id: "e1", name: "Bandit", team: "enemy", q: 3, r: 0, move: 3, hp: 8, maxHp: 8, atk: 3, def: 1 },
    { id: "e2", name: "Raider", team: "enemy", q: 2, r: -1, move: 3, hp: 8, maxHp: 8, atk: 2, def: 2 },
];

export function MinimalBattlePage() {
    const [engine] = useState(() => new GameEngine(createSampleUnits()));
    const [, forceUpdate] = useState(0);

    // Force re-render when engine state changes
    const triggerUpdate = () => {
        forceUpdate(prev => prev + 1);
    };

    // Auto-handle enemy turns
    useEffect(() => {
        console.log(`🎲 Turn check: ${engine.current.name} (${engine.current.team}), phase: ${engine.state.phase}, isEnemy: ${engine.isCurrentUnitEnemy}`);

        if (engine.isCurrentUnitEnemy && engine.state.phase === "awaitAction") {
            console.log(`🤖 Enemy ${engine.current.name} taking turn...`);

            // Add a small delay to make enemy actions visible
            const timer = setTimeout(() => {
                engine.doEnemyTurn();
                triggerUpdate();
            }, 800); // 800ms delay for enemy thinking time

            return () => clearTimeout(timer);
        }
    }, [engine.current.id, engine.state.phase, engine.state.turnIndex]);

    const onAction = (action: "Move" | "Fight" | "Spells" | "Defend" | "Wait" | "EndTurn") => {
        switch (action) {
            case "Move":
                engine.beginMove();
                break;
            case "Fight": {
                // Find adjacent enemy and attack
                const u = engine.current;
                const enemies = Object.values(engine.state.units)
                    .filter(v => v.alive && v.team !== u.team);

                for (const enemy of enemies) {
                    if (engine.canMelee(enemy.id)) {
                        engine.fight(enemy.id);
                        break;
                    }
                }
                break;
            }
            case "Spells":
                // Placeholder - just end turn for now
                engine.endTurn();
                break;
            case "Defend":
                engine.defend();
                break;
            case "Wait":
                engine.wait();
                break;
            case "EndTurn":
                engine.endTurn();
                break;
        }
        triggerUpdate();
    };

    const handleReset = () => {
        // Reset the engine with fresh units
        engine.state = new GameEngine(createSampleUnits()).state;
        triggerUpdate();
    };

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100vh',
            backgroundColor: '#121212',
            fontFamily: 'system-ui, sans-serif'
        }}>
            {/* Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 16px',
                backgroundColor: '#1a1a1a',
                borderBottom: '1px solid #333',
                color: '#ffffff'
            }}>
                <h1 style={{ margin: 0, fontSize: '24px' }}>
                    Minimal Tactical Battle
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
                        🔄 Reset Battle
                    </button>
                </div>
            </div>

            {/* Battle area */}
            <div style={{ flex: 1, position: 'relative' }}>
                <SimpleBattleStage engine={engine} onMove={triggerUpdate} />
                <SimpleBattleHUD engine={engine} onAction={onAction} />
            </div>

            {/* Debug info */}
            <div style={{
                padding: '8px 16px',
                backgroundColor: '#1a1a1a',
                borderTop: '1px solid #333',
                color: '#ffffff',
                fontSize: '12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <div>
                    Phase: {engine.state.phase} |
                    Current: {engine.current.name} ({engine.current.team}) |
                    Round: {engine.state.round}
                </div>
                <div>
                    HP: {engine.current.hp}/{engine.current.maxHp} |
                    Move: {engine.current.move} |
                    ATK: {engine.current.atk} |
                    DEF: {engine.current.def}
                </div>
            </div>
        </div>
    );
}