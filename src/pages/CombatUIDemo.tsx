/**
 * Combat UI Demo Page - World Engine
 * Demonstrates the complete combat UI system with mock data
 */

import React, { useState, useCallback } from 'react';
import {
    ActionBar,
    UnitCard,
    TurnQueue,
    LogPanel,
    SelectionManager,
    type LogEntry,
    type CombatMode,
    type WorldEngineAbility
} from '../features/combat-ui';
import type { Unit, BattleState } from '../features/battle/types';

// Mock combat data for demonstration
const mockUnits: Unit[] = [
    {
        id: 'player-knight-1',
        name: 'Sir Gareth',
        kind: 'Mercenary',
        faction: 'Player',
        race: 'human',
        archetype: 'knight',
        level: 3,
        stats: {
            hp: 85,
            maxHp: 100,
            atk: 15,
            def: 12,
            mag: 5,
            res: 8,
            spd: 8,
            rng: 1,
            move: 3
        },
        statuses: [
            { id: 'blessed', name: 'Blessed', duration: 3, effects: {} }
        ],
        skills: ['shield-bash', 'rally-cry'],
        isDead: false,
        morale: 85,
        stamina: 45
    },
    {
        id: 'player-mystic-1',
        name: 'Lyanna the Wise',
        kind: 'Mercenary',
        faction: 'Player',
        race: 'sylvanborn',
        archetype: 'mystic',
        level: 4,
        stats: {
            hp: 60,
            maxHp: 75,
            atk: 8,
            def: 6,
            mag: 18,
            res: 15,
            spd: 10,
            rng: 3,
            move: 2
        },
        statuses: [],
        skills: ['arcane-missile', 'heal', 'fireball'],
        isDead: false,
        morale: 70,
        stamina: 80
    },
    {
        id: 'enemy-orc-1',
        name: 'Orc Raider',
        kind: 'Monster',
        faction: 'Enemy',
        race: 'orc',
        archetype: 'warrior',
        level: 2,
        stats: {
            hp: 45,
            maxHp: 80,
            atk: 12,
            def: 8,
            mag: 3,
            res: 5,
            spd: 6,
            rng: 1,
            move: 4
        },
        statuses: [
            { id: 'poisoned', name: 'Poisoned', duration: 2, effects: {} }
        ],
        skills: ['wild-swing'],
        isDead: false,
        morale: 40,
        stamina: 25
    }
];

const mockInitiative = ['player-mystic-1', 'player-knight-1', 'enemy-orc-1'];

const mockLogEntries: LogEntry[] = [
    {
        id: 'log-1',
        timestamp: Date.now() - 30000,
        type: 'system',
        message: 'Battle begins! Deploy your units.',
        details: {}
    },
    {
        id: 'log-2',
        timestamp: Date.now() - 25000,
        type: 'move',
        source: 'Sir Gareth',
        message: 'moves forward',
        details: {}
    },
    {
        id: 'log-3',
        timestamp: Date.now() - 20000,
        type: 'spell',
        source: 'Lyanna the Wise',
        target: 'Orc Raider',
        message: 'casts Arcane Missile',
        details: { ability: 'Arcane Missile', damage: 12 }
    },
    {
        id: 'log-4',
        timestamp: Date.now() - 15000,
        type: 'attack',
        source: 'Orc Raider',
        target: 'Sir Gareth',
        message: 'attacks with Wild Swing',
        details: { ability: 'Wild Swing', damage: 8 }
    },
    {
        id: 'log-5',
        timestamp: Date.now() - 10000,
        type: 'status',
        target: 'Orc Raider',
        message: 'is poisoned by toxic blade',
        details: { statusId: 'poisoned' }
    }
];

export const CombatUIDemo: React.FC = () => {
    const [selectedUnit, setSelectedUnit] = useState<string>('player-knight-1');
    const [currentTurn, setCurrentTurn] = useState<string>('player-knight-1');
    const [phase] = useState<'Setup' | 'HeroTurn' | 'UnitsTurn' | 'EnemyTurn' | 'Victory' | 'Defeat'>('UnitsTurn');
    const [logEntries] = useState<LogEntry[]>(mockLogEntries);
    const [selectionManager] = useState(() => new SelectionManager());

    // Get selected unit data
    const selectedUnitData = mockUnits.find(unit => unit.id === selectedUnit);
    const selectedArchetype = selectedUnitData?.archetype as 'knight' | 'ranger' | 'chanter' | 'mystic' | 'guardian' | 'corsair';
    const selectedSpecies = selectedUnitData?.race as 'human' | 'sylvanborn' | 'nightborn' | 'stormcaller';

    const handleUnitSelect = useCallback((unitId: string) => {
        setSelectedUnit(unitId);
        console.log('🎮 Unit selected:', unitId);
    }, []);

    const _handleAbilityUse = useCallback((ability: WorldEngineAbility) => {
        console.log('⚔️ Ability used:', ability);

        // Add to log
        const newEntry: LogEntry = {
            id: `log-${Date.now()}`,
            timestamp: Date.now(),
            type: ability.kind === 'spell' ? 'spell' : 'attack',
            source: selectedUnitData?.name,
            message: `uses ${ability.name}`,
            details: { ability: ability.name }
        };

        // In a real implementation, this would update the battle state
        console.log('📝 New log entry:', newEntry);
    }, [selectedUnitData]);

    const _handleModeChange = useCallback((mode: CombatMode) => {
        console.log('🔄 Combat mode changed:', mode);
    }, []);

    return (
        <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 300px 250px',
            gridTemplateRows: 'auto 1fr',
            gap: '16px',
            height: '100vh',
            padding: '16px',
            backgroundColor: '#1a202c',
            color: '#e2e8f0'
        }}>
            {/* Header */}
            <div style={{
                gridColumn: '1 / -1',
                padding: '16px',
                backgroundColor: '#2d3748',
                borderRadius: '8px',
                textAlign: 'center'
            }}>
                <h1 style={{ margin: 0, color: '#e2e8f0' }}>
                    World Engine Combat UI Demo
                </h1>
                <p style={{ margin: '8px 0 0', color: '#a0aec0' }}>
                    Demonstration of tactical combat interface with World Engine archetypes
                </p>
            </div>

            {/* Main Battle Area (placeholder) */}
            <div style={{
                backgroundColor: '#2d3748',
                borderRadius: '8px',
                padding: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                <div style={{ textAlign: 'center', color: '#a0aec0' }}>
                    <div style={{ fontSize: '4rem', marginBottom: '16px' }}>🗺️</div>
                    <h3>Battle Map Area</h3>
                    <p>Hex grid battle map would render here</p>

                    {/* Action Bar Demo */}
                    <div style={{ marginTop: '32px' }}>
                        <ActionBar
                            archetype={selectedArchetype}
                            currentAP={3}
                            currentMana={selectedUnitData?.stamina || 50}
                            disabled={false}
                        />
                    </div>
                </div>
            </div>

            {/* Unit Card */}
            <div style={{
                backgroundColor: '#2d3748',
                borderRadius: '8px',
                padding: '16px'
            }}>
                <h3 style={{ margin: '0 0 16px', color: '#e2e8f0' }}>Unit Details</h3>
                <UnitCard
                    unit={selectedUnitData}
                    archetype={selectedArchetype}
                    species={selectedSpecies}
                />
            </div>

            {/* Turn Queue */}
            <div style={{
                backgroundColor: '#2d3748',
                borderRadius: '8px',
                padding: '16px'
            }}>
                <TurnQueue
                    units={mockUnits}
                    initiative={mockInitiative}
                    currentTurn={currentTurn}
                    phase={phase}
                    onUnitSelect={handleUnitSelect}
                />
            </div>

            {/* Combat Log */}
            <div style={{
                gridColumn: '1 / -1',
                backgroundColor: '#2d3748',
                borderRadius: '8px',
                maxHeight: '300px'
            }}>
                <LogPanel
                    entries={logEntries}
                    autoScroll={true}
                    showFilters={true}
                />
            </div>
        </div>
    );
};