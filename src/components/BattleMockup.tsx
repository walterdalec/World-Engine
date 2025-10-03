/**
 * BattleMockup.tsx — Hero (commander) + Mercenaries tactical mock
 * Hex grid, Hero off-field, HeroTurn command bar, merc units deploy
 * NOTE: On world map or in settlements: ONLY Hero visible. Mercs remain menu-only.
 */

import React, { useState } from "react";
import { BattleCanvas } from "../battle/components/renderer2d";
import { generateBattlefieldHex } from "../battle/generate_hex";
import { BattleState, Unit, Commander } from "../battle/types";
import { startBattle, nextPhase, executeAbility, checkVictoryConditions } from "../battle/engine";

// --- Dummy Data
const heroCommander: Commander = {
    unitId: "hero-1",
    aura: { name: "Heroic Presence", stats: { atk: 1, def: 1 } },
    abilities: [
        {
            id: "rally",
            name: "Rally",
            type: "command",
            apCost: 0,
            range: 0,
            shape: "ally",
            healing: 3,
            cooldown: 3,
            description: "Heal and inspire nearby allies"
        },
        {
            id: "fireball",
            name: "Fireball",
            type: "spell",
            apCost: 0,
            range: 5,
            shape: "blast1",
            damage: { amount: 6, type: "fire" },
            aoeRadius: 1,
            cooldown: 2,
            description: "Launch explosive fireball"
        },
        {
            id: "lightning",
            name: "Lightning Bolt",
            type: "spell",
            apCost: 0,
            range: 8,
            shape: "line",
            damage: { amount: 4, type: "lightning" },
            cooldown: 1,
            description: "Strike with precise lightning"
        }
    ],
    runtime: {
        cooldowns: {},
        actionPoints: 3
    }
};

// Mercenaries: used in tactical battles only. Never drawn on world/settlement map.
const mercs: Unit[] = [
    {
        id: "m1",
        name: "Sellsword",
        kind: "Mercenary",
        faction: "Player",
        race: "Human",
        archetype: "Warrior",
        level: 1,
        stats: { hp: 12, maxHp: 12, atk: 4, def: 2, mag: 0, res: 1, spd: 4, rng: 1, move: 3 },
        statuses: [],
        skills: [],
        pos: { q: 2, r: 4 },
        isDead: false
    },
    {
        id: "m2",
        name: "Archer",
        kind: "Mercenary",
        faction: "Player",
        race: "Human",
        archetype: "Archer",
        level: 1,
        stats: { hp: 8, maxHp: 8, atk: 3, def: 1, mag: 0, res: 1, spd: 5, rng: 3, move: 3 },
        statuses: [],
        skills: [],
        pos: { q: 2, r: 6 },
        isDead: false
    },
    {
        id: "m3",
        name: "Battle Mage",
        kind: "Mercenary",
        faction: "Player",
        race: "Human",
        archetype: "Mage",
        level: 1,
        stats: { hp: 6, maxHp: 6, atk: 1, def: 0, mag: 4, res: 2, spd: 3, rng: 2, move: 3 },
        statuses: [],
        skills: [],
        pos: { q: 1, r: 5 },
        isDead: false
    }
];

const enemies: Unit[] = [
    {
        id: "e1",
        name: "Goblin Warrior",
        kind: "Monster",
        faction: "Enemy",
        race: "Goblin",
        archetype: "Grunt",
        level: 1,
        stats: { hp: 6, maxHp: 6, atk: 2, def: 0, mag: 0, res: 0, spd: 4, rng: 1, move: 3 },
        statuses: [],
        skills: [],
        pos: { q: 12, r: 5 },
        isDead: false
    },
    {
        id: "e2",
        name: "Goblin Archer",
        kind: "Monster",
        faction: "Enemy",
        race: "Goblin",
        archetype: "Archer",
        level: 1,
        stats: { hp: 5, maxHp: 5, atk: 2, def: 0, mag: 0, res: 0, spd: 5, rng: 3, move: 3 },
        statuses: [],
        skills: [],
        pos: { q: 12, r: 7 },
        isDead: false
    },
    {
        id: "e3",
        name: "Goblin Shaman",
        kind: "Monster",
        faction: "Enemy",
        race: "Goblin",
        archetype: "Shaman",
        level: 2,
        stats: { hp: 8, maxHp: 8, atk: 1, def: 1, mag: 3, res: 2, spd: 3, rng: 2, move: 3 },
        statuses: [],
        skills: [],
        pos: { q: 13, r: 6 },
        isDead: false
    }
];

// --- Mock Battle Factory
function createMockBattle(): BattleState {
    const { grid, friendly, enemy } = generateBattlefieldHex({ seed: "demo", biome: "Grass" });
    const state: BattleState = {
        id: "b1",
        turn: 0,
        phase: "Setup",
        grid,
        context: { seed: "demo", biome: "Grass" },
        commander: heroCommander,
        units: [...mercs, ...enemies],
        initiative: [],
        friendlyDeployment: friendly,
        enemyDeployment: enemy,
        log: []
    };
    startBattle(state);
    return state;
}

// --- UI Mock
export function BattleMockup() {
    const [state, setState] = useState<BattleState>(createMockBattle());
    const [selectedTarget, setSelectedTarget] = useState<{ q: number; r: number } | null>(null);

    function handleHeroAbility(abilityId: string) {
        const heroUnit: Unit = {
            id: "hero-1",
            name: "Hero Commander",
            kind: "HeroCommander",
            faction: "Player",
            race: "Human",
            archetype: "Battle Mage",
            level: 5,
            stats: { hp: 99, maxHp: 99, atk: 0, def: 0, mag: 5, res: 3, spd: 99, rng: 0, move: 0 },
            statuses: [],
            skills: [],
            isCommander: true
        };

        // Use selected target or default to center of enemy forces
        const target = selectedTarget || { q: 12, r: 6 };

        const success = executeAbility(state, "hero-1", abilityId, target);
        if (success) {
            setSelectedTarget(null); // Clear target after use
        }

        // Check for victory/defeat
        checkVictoryConditions(state);

        setState({ ...state });
    }

    function handleHexClick(pos: { q: number; r: number }) {
        console.log("Hex clicked:", pos.q, pos.r);
        setSelectedTarget({ q: pos.q, r: pos.r });

        // Also allow unit selection
        const unit = state.units.find(u => u.pos && u.pos.q === pos.q && u.pos.r === pos.r);
        if (unit && unit.faction === "Player") {
            setState({ ...state, selectedUnit: unit.id });
        } else {
            setState({ ...state, selectedUnit: undefined });
        }
    }

    function resetBattle() {
        setState(createMockBattle());
        setSelectedTarget(null);
    }

    const isAbilityOnCooldown = (abilityId: string): boolean => {
        const cooldowns = state.commander.runtime.cooldowns || {};
        return (cooldowns[abilityId] || 0) > 0;
    };

    const getCooldownText = (abilityId: string): string => {
        const cooldowns = state.commander.runtime.cooldowns || {};
        const cd = cooldowns[abilityId] || 0;
        return cd > 0 ? ` (${cd})` : '';
    };

    return (
        <div style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr",
            gap: 16,
            padding: 16,
            maxWidth: "1200px",
            margin: "0 auto"
        }}>
            <div>
                <div style={{ marginBottom: 12 }}>
                    <h2 style={{ margin: 0, color: '#333' }}>
                        Tactical Battle System
                        {state.phase === "Victory" && " - 🎉 VICTORY!"}
                        {state.phase === "Defeat" && " - 💀 DEFEAT"}
                    </h2>
                    <p style={{ margin: "4px 0", color: '#666', fontSize: '14px' }}>
                        Click hexes to target abilities. Hero commands from off-field.
                    </p>
                </div>

                <BattleCanvas
                    state={state}
                    onTileClick={handleHexClick}
                />

                <div style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
                    <button
                        onClick={() => { nextPhase(state); setState({ ...state }); }}
                        disabled={state.phase === "Victory" || state.phase === "Defeat"}
                        style={{
                            padding: '8px 16px',
                            backgroundColor: state.phase === "Victory" || state.phase === "Defeat" ? '#ccc' : '#4caf50',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: state.phase === "Victory" || state.phase === "Defeat" ? 'default' : 'pointer'
                        }}
                    >
                        Next Phase ({state.phase})
                    </button>

                    <button
                        onClick={resetBattle}
                        style={{
                            padding: '8px 16px',
                            backgroundColor: '#2196f3',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        Reset Battle
                    </button>

                    {selectedTarget && (
                        <span style={{
                            padding: '4px 8px',
                            backgroundColor: '#fff3cd',
                            border: '1px solid #ffeaa7',
                            borderRadius: '4px',
                            fontSize: '12px'
                        }}>
                            Target: ({selectedTarget.q}, {selectedTarget.r})
                        </span>
                    )}
                </div>
            </div>

            <div style={{ backgroundColor: '#f8f9fa', padding: 16, borderRadius: 8 }}>
                <h3 style={{ marginTop: 0, color: '#333' }}>Hero Commands</h3>
                <div style={{ marginBottom: 16 }}>
                    {state.commander.abilities.map(ability => (
                        <button
                            key={ability.id}
                            onClick={() => handleHeroAbility(ability.id)}
                            disabled={isAbilityOnCooldown(ability.id) || state.phase === "Victory" || state.phase === "Defeat"}
                            style={{
                                display: "block",
                                width: "100%",
                                marginBottom: 8,
                                padding: "8px 12px",
                                backgroundColor: isAbilityOnCooldown(ability.id) ? '#e0e0e0' : '#1976d2',
                                color: isAbilityOnCooldown(ability.id) ? '#666' : 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: isAbilityOnCooldown(ability.id) ? 'default' : 'pointer',
                                textAlign: 'left'
                            }}
                            title={ability.description}
                        >
                            <div style={{ fontWeight: 'bold' }}>
                                {ability.name}{getCooldownText(ability.id)}
                            </div>
                            <div style={{ fontSize: '11px', opacity: 0.8 }}>
                                {ability.description}
                            </div>
                        </button>
                    ))}
                </div>

                <h3 style={{ color: '#333' }}>Commander Aura</h3>
                <div style={{
                    padding: 8,
                    backgroundColor: '#e8f5e8',
                    borderRadius: 4,
                    marginBottom: 16,
                    fontSize: '12px'
                }}>
                    <strong>{state.commander.aura.name}</strong><br />
                    ATK +{state.commander.aura.stats.atk}, DEF +{state.commander.aura.stats.def}
                </div>

                <h3 style={{ color: '#333' }}>Battle Log</h3>
                <div style={{
                    maxHeight: 200,
                    overflowY: 'auto',
                    backgroundColor: '#fff',
                    border: '1px solid #ddd',
                    borderRadius: 4,
                    padding: 8
                }}>
                    {state.log.length === 0 ? (
                        <em style={{ color: '#666' }}>No events yet...</em>
                    ) : (
                        <ul style={{ margin: 0, paddingLeft: 20, fontSize: '12px' }}>
                            {state.log.slice(-10).map((entry, i) => (
                                <li key={i} style={{ marginBottom: 4 }}>{entry}</li>
                            ))}
                        </ul>
                    )}
                </div>

                <div style={{ marginTop: 16, fontSize: '11px', color: '#666' }}>
                    <strong>Battle Rules:</strong><br />
                    • Hero fights from off-field with special abilities<br />
                    • Mercenaries deploy on battlefield tactically<br />
                    • On world map: only Hero token visible<br />
                    • Mercenaries stay in party menu outside battle
                </div>
            </div>
        </div>
    );
}

// WORLD/SETTLEMENT MAP RULE:
// Only render the Hero token. Mercenaries should always remain in the party menu UI and never follow beside Hero on the map.