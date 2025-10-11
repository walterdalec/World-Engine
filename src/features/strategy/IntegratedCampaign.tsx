/**
 * INTEGRATED CAMPAIGN MODE
 * 
 * This ties together all game systems:
 * - World generation and exploration
 * - Character creation and party management
 * - Faction AI and strategic layer
 * - Weather and seasonal progression
 * - Random encounters and tactical battles
 * - Resource management and progression
 * 
 * This is the "real game" experience.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { WorldNoise } from '../../proc/noise';
import { SeededRandom } from '../../seededGenerators';
import { useGameStore } from '../../store/gameStore';
import { CampaignBattleBridge } from './CampaignBattleBridge';

// Types for integrated campaign
interface IntegratedCampaignProps {
    onNavigateToCharacterCreate?: () => void;
    onNavigateToMenu?: () => void;
}

interface CampaignState {
    seed: string;
    currentDay: number;
    currentSeason: 'Spring' | 'Summer' | 'Autumn' | 'Winter';
    weather: 'Clear' | 'Rain' | 'Storm' | 'Snow' | 'Fog';

    // Party state
    party: CampaignCharacter[];
    partyGold: number;
    partyPosition: { x: number; y: number };

    // World state
    worldNoise: WorldNoise;
    exploredTiles: Set<string>;

    // Faction state
    factions: Faction[];

    // Encounter state
    encounterChance: number;
    lastEncounterDay: number;
}

interface CampaignCharacter {
    id: string;
    name: string;
    species: string;
    archetype: string;
    level: number;
    experience: number;
    hp: number;
    maxHp: number;
    mp: number;
    maxMp: number;
    stats: Record<string, number>;
    equipment: Record<string, string>;
    abilities: string[];
    spells: string[];
}

interface Faction {
    id: string;
    name: string;
    color: string;
    territories: number;
    resources: {
        gold: number;
        recruits: number;
        magic: number;
    };
    relations: Record<string, number>;
    aggression: number;
    economy: number;
}

// Reserved for future use
interface _WorldTile {
    x: number;
    y: number;
    biome: string;
    elevation: number;
    temperature: number;
    moisture: number;
    discovered: boolean;
}

export const IntegratedCampaign: React.FC<IntegratedCampaignProps> = ({
    onNavigateToCharacterCreate,
    onNavigateToMenu
}) => {
    const [campaignState, setCampaignState] = useState<CampaignState | null>(null);
    const [isInitializing, setIsInitializing] = useState(true);
    const [currentView, setCurrentView] = useState<'world' | 'party' | 'factions' | 'battle'>('world');
    const [logs, setLogs] = useState<string[]>([]);

    // Battle state
    const [activeBattle, setActiveBattle] = useState<{
        encounterType: string;
        partyLevel: number;
    } | null>(null);

    const { characters } = useGameStore();

    // Initialize campaign
    useEffect(() => {
        console.log('🌍 Campaign effect triggered. isInitializing:', isInitializing, 'characters.length:', characters.length);

        if (isInitializing) {
            if (characters.length > 0) {
                console.log('🌍 Initializing Integrated Campaign...');

                const seed = `campaign-${Date.now()}`;

                // Convert characters to campaign format (with safe type casting)
                const party: CampaignCharacter[] = characters.slice(0, 4).map((char: any) => ({
                    id: char.id || char.name,
                    name: char.name,
                    species: char.species,
                    archetype: char.archetype,
                    level: char.level || 1,
                    experience: char.experience || 0,
                    hp: char.hp || 50 + ((char.level || 1) * 10),
                    maxHp: char.maxHp || 50 + ((char.level || 1) * 10),
                    mp: char.mp || 20 + ((char.level || 1) * 5),
                    maxMp: char.maxMp || 20 + ((char.level || 1) * 5),
                    stats: char.stats || {},
                    equipment: char.equipment || { weapon: 'Iron Sword', armor: 'Leather Armor', accessory: 'None' },
                    abilities: Array.isArray(char.abilities) ? char.abilities.map((a: any) => a.name || a) : [],
                    spells: Array.isArray(char.spells) ? char.spells : []
                }));

                // Initialize factions
                const factions: Faction[] = [
                    {
                        id: 'crimson-empire',
                        name: 'Crimson Empire',
                        color: '#dc2626',
                        territories: 8,
                        resources: { gold: 1000, recruits: 50, magic: 30 },
                        relations: { 'azure-kingdom': -50, 'emerald-alliance': 20 },
                        aggression: 0.7,
                        economy: 0.6
                    },
                    {
                        id: 'azure-kingdom',
                        name: 'Azure Kingdom',
                        color: '#2563eb',
                        territories: 10,
                        resources: { gold: 1200, recruits: 45, magic: 40 },
                        relations: { 'crimson-empire': -50, 'emerald-alliance': 10 },
                        aggression: 0.5,
                        economy: 0.8
                    },
                    {
                        id: 'emerald-alliance',
                        name: 'Emerald Alliance',
                        color: '#16a34a',
                        territories: 6,
                        resources: { gold: 800, recruits: 60, magic: 25 },
                        relations: { 'crimson-empire': 20, 'azure-kingdom': 10 },
                        aggression: 0.4,
                        economy: 0.7
                    }
                ];

                const newCampaign: CampaignState = {
                    seed,
                    currentDay: 1,
                    currentSeason: 'Spring',
                    weather: 'Clear',
                    party,
                    partyGold: 500,
                    partyPosition: { x: 0, y: 0 },
                    worldNoise: new WorldNoise(seed),
                    exploredTiles: new Set(['0,0']),
                    factions,
                    encounterChance: 0.3,
                    lastEncounterDay: 0
                };

                console.log('🌍 Campaign state created:', newCampaign);
                setCampaignState(newCampaign);
                setIsInitializing(false);
                addLog('🌍 Campaign initialized successfully!');
                addLog(`🎮 Party of ${party.length} ready for adventure`);
                addLog(`🏰 ${factions.length} factions compete for control`);
            } else {
                // No characters found, stop initializing
                console.log('🌍 No characters found, stopping initialization');
                setIsInitializing(false);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isInitializing, characters]);

    const addLog = useCallback((message: string) => {
        setLogs(prev => [...prev.slice(-19), `[Day ${campaignState?.currentDay || 0}] ${message}`]);
    }, [campaignState?.currentDay]);

    // Advance day (main game loop)
    const advanceDay = useCallback(() => {
        if (!campaignState) return;

        const rng = new SeededRandom(campaignState.seed + campaignState.currentDay);

        setCampaignState(prev => {
            if (!prev) return prev;

            const newDay = prev.currentDay + 1;

            // Update season every 30 days
            let newSeason = prev.currentSeason;
            if (newDay % 30 === 0) {
                const seasons: ('Spring' | 'Summer' | 'Autumn' | 'Winter')[] = ['Spring', 'Summer', 'Autumn', 'Winter'];
                const seasonIndex = Math.floor(newDay / 30) % 4;
                newSeason = seasons[seasonIndex];
                addLog(`🌸 Season changed to ${newSeason}`);
            }

            // Update weather
            const weatherTypes: ('Clear' | 'Rain' | 'Storm' | 'Snow' | 'Fog')[] = ['Clear', 'Rain', 'Storm', 'Snow', 'Fog'];
            const newWeather = weatherTypes[Math.floor(rng.next() * weatherTypes.length)];
            if (newWeather !== prev.weather) {
                addLog(`🌦️ Weather changed to ${newWeather}`);
            }

            // Weather effects on party
            const updatedParty = [...prev.party];
            if (newWeather === 'Storm') {
                updatedParty.forEach(char => {
                    char.hp = Math.max(1, char.hp - 2);
                });
                addLog('⚡ Storm damages party (-2 HP each)');
            }

            // Faction AI turn
            const updatedFactions = [...prev.factions];
            updatedFactions.forEach(faction => {
                const goldGain = Math.floor(faction.territories * 50 * faction.economy);
                faction.resources.gold += goldGain;

                // Check for aggressive actions
                if (faction.aggression > 0.6 && faction.resources.gold > 500 && rng.next() > 0.5) {
                    const target = updatedFactions.find(f => f.id !== faction.id && faction.relations[f.id] < 0);
                    if (target) {
                        faction.resources.gold -= 300;
                        faction.territories++;
                        target.territories = Math.max(1, target.territories - 1);
                        addLog(`⚔️ ${faction.name} captures territory from ${target.name}!`);
                    }
                }
            });

            // Check for encounter
            const daysSinceEncounter = newDay - prev.lastEncounterDay;
            const encounterRoll = rng.next();
            const encounterThreshold = Math.min(0.7, prev.encounterChance + (daysSinceEncounter * 0.05));

            if (encounterRoll < encounterThreshold) {
                const encounterTypes = ['Bandits', 'Monsters', 'Undead', 'Beasts'];
                const encounterType = encounterTypes[Math.floor(rng.next() * encounterTypes.length)];
                addLog(`🎲 Encounter: ${encounterType}!`);

                // Trigger battle!
                setActiveBattle({
                    encounterType,
                    partyLevel: Math.max(1, Math.floor(prev.party.reduce((sum, p) => sum + p.level, 0) / prev.party.length))
                });
                setCurrentView('battle');

                return {
                    ...prev,
                    currentDay: newDay,
                    currentSeason: newSeason,
                    weather: newWeather,
                    party: updatedParty,
                    factions: updatedFactions,
                    lastEncounterDay: newDay
                };
            }

            // Rest and recovery if no encounter
            updatedParty.forEach(char => {
                char.hp = Math.min(char.maxHp, char.hp + 5);
                char.mp = Math.min(char.maxMp, char.mp + 3);
            });
            addLog('🌿 Peaceful travel, party rests');

            return {
                ...prev,
                currentDay: newDay,
                currentSeason: newSeason,
                weather: newWeather,
                party: updatedParty,
                factions: updatedFactions
            };
        });
    }, [campaignState, addLog]);

    // Explore tile
    const exploreTile = useCallback((dx: number, dy: number) => {
        if (!campaignState) return;

        setCampaignState(prev => {
            if (!prev) return prev;

            const newX = prev.partyPosition.x + dx;
            const newY = prev.partyPosition.y + dy;
            const tileKey = `${newX},${newY}`;

            const newExplored = new Set(prev.exploredTiles);
            newExplored.add(tileKey);

            const elevation = prev.worldNoise.getElevation(newX * 10, newY * 10);
            const temperature = prev.worldNoise.getTemperature(newX * 10, newY * 10, elevation, 100);
            const moisture = prev.worldNoise.getMoisture(newX * 10, newY * 10, elevation);

            let biome = 'Grass';
            if (elevation < 0.3) biome = 'Ocean';
            else if (elevation > 0.8) biome = 'Mountain';
            else if (temperature < 0.3) biome = 'Tundra';
            else if (moisture < 0.3) biome = 'Desert';
            else if (moisture > 0.7) biome = 'Forest';

            addLog(`🗺️ Discovered ${biome} at (${newX}, ${newY})`);

            return {
                ...prev,
                partyPosition: { x: newX, y: newY },
                exploredTiles: newExplored
            };
        });
    }, [campaignState, addLog]);

    // Battle result handlers
    const handleBattleComplete = useCallback((won: boolean, xp: number, gold: number) => {
        if (!campaignState) return;

        addLog(won ? `⚔️ Victory! Gained ${xp} XP and ${gold} gold` : '💀 Defeated in battle...');

        // Update campaign state with battle results
        setCampaignState(prev => {
            if (!prev) return prev;

            const updatedParty = prev.party.map(char => ({
                ...char,
                experience: char.experience + (won ? Math.floor(xp / prev.party.length) : 0),
                hp: won ? char.hp : Math.max(1, Math.floor(char.hp * 0.5)) // Half HP if defeated
            }));

            return {
                ...prev,
                party: updatedParty,
                partyGold: prev.partyGold + (won ? gold : -Math.floor(gold * 0.2)) // Lose some gold on defeat
            };
        });

        // Clear battle and return to world view
        setActiveBattle(null);
        setCurrentView('world');
    }, [campaignState, addLog]);

    const handleBattleCancel = useCallback(() => {
        addLog('🏃 Fled from battle!');
        setActiveBattle(null);
        setCurrentView('world');
    }, [addLog]);

    // Guard: No characters created yet
    if (characters.length === 0) {
        return (
            <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
                <div className="text-center max-w-md">
                    <div className="text-6xl mb-4">👥</div>
                    <h1 className="text-3xl font-bold mb-2">No Characters Found</h1>
                    <p className="text-gray-400 mb-6">
                        You need to create at least one character before starting an integrated campaign.
                    </p>
                    <div className="space-y-2">
                        <button
                            onClick={() => {
                                if (onNavigateToCharacterCreate) {
                                    onNavigateToCharacterCreate();
                                } else {
                                    window.location.href = '#/create';
                                }
                            }}
                            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-3 px-6 rounded-lg"
                        >
                            ✨ Create Character
                        </button>
                        <button
                            onClick={() => {
                                if (onNavigateToMenu) {
                                    onNavigateToMenu();
                                } else {
                                    window.location.href = '#/menu';
                                }
                            }}
                            className="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-6 rounded-lg"
                        >
                            ← Back to Menu
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (isInitializing) {
        return (
            <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
                <div className="text-center">
                    <div className="text-6xl mb-4">🌍</div>
                    <h1 className="text-3xl font-bold mb-2">Initializing Campaign...</h1>
                    <p className="text-gray-400">Generating world and loading your party...</p>
                </div>
            </div>
        );
    }

    if (!campaignState) {
        return (
            <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
                <div className="text-center">
                    <div className="text-6xl mb-4">❌</div>
                    <h1 className="text-3xl font-bold mb-2">Campaign Failed to Initialize</h1>
                    <p className="text-gray-400">Please check console for errors</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 text-white">
            {/* Header */}
            <div className="bg-gray-800 border-b border-gray-700 p-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">🌍 Integrated Campaign</h1>
                        <p className="text-sm text-gray-400">
                            Day {campaignState.currentDay} • {campaignState.currentSeason} • {campaignState.weather}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setCurrentView('world')}
                            className={`px-4 py-2 rounded ${currentView === 'world' ? 'bg-blue-600' : 'bg-gray-700'}`}
                        >
                            🗺️ World
                        </button>
                        <button
                            onClick={() => setCurrentView('party')}
                            className={`px-4 py-2 rounded ${currentView === 'party' ? 'bg-blue-600' : 'bg-gray-700'}`}
                        >
                            ⚔️ Party
                        </button>
                        <button
                            onClick={() => setCurrentView('factions')}
                            className={`px-4 py-2 rounded ${currentView === 'factions' ? 'bg-blue-600' : 'bg-gray-700'}`}
                        >
                            🏰 Factions
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Panel - Main View */}
                <div className="lg:col-span-2 bg-gray-800 rounded-lg p-6">
                    {currentView === 'world' && (
                        <div>
                            <h2 className="text-xl font-bold mb-4">🗺️ World Map</h2>
                            <div className="bg-gray-700 rounded p-4 mb-4">
                                <p className="text-center text-gray-400 mb-4">
                                    Position: ({campaignState.partyPosition.x}, {campaignState.partyPosition.y})
                                </p>
                                <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto">
                                    <button onClick={() => exploreTile(-1, -1)} className="bg-gray-600 hover:bg-gray-500 p-4 rounded">↖️</button>
                                    <button onClick={() => exploreTile(0, -1)} className="bg-gray-600 hover:bg-gray-500 p-4 rounded">⬆️</button>
                                    <button onClick={() => exploreTile(1, -1)} className="bg-gray-600 hover:bg-gray-500 p-4 rounded">↗️</button>
                                    <button onClick={() => exploreTile(-1, 0)} className="bg-gray-600 hover:bg-gray-500 p-4 rounded">⬅️</button>
                                    <div className="bg-blue-600 p-4 rounded text-center">📍</div>
                                    <button onClick={() => exploreTile(1, 0)} className="bg-gray-600 hover:bg-gray-500 p-4 rounded">➡️</button>
                                    <button onClick={() => exploreTile(-1, 1)} className="bg-gray-600 hover:bg-gray-500 p-4 rounded">↙️</button>
                                    <button onClick={() => exploreTile(0, 1)} className="bg-gray-600 hover:bg-gray-500 p-4 rounded">⬇️</button>
                                    <button onClick={() => exploreTile(1, 1)} className="bg-gray-600 hover:bg-gray-500 p-4 rounded">↘️</button>
                                </div>
                                <p className="text-center text-sm text-gray-400 mt-4">
                                    Explored: {campaignState.exploredTiles.size} tiles
                                </p>
                            </div>
                        </div>
                    )}

                    {currentView === 'battle' && activeBattle && (
                        <CampaignBattleBridge
                            partyPosition={campaignState.partyPosition}
                            partyLevel={activeBattle.partyLevel}
                            encounterType={activeBattle.encounterType}
                            campaignSeed={campaignState.seed}
                            onBattleComplete={handleBattleComplete}
                            onBattleCancel={handleBattleCancel}
                        />
                    )}

                    {currentView === 'party' && (
                        <div>
                            <h2 className="text-xl font-bold mb-4">⚔️ Party Status</h2>
                            <p className="text-yellow-400 mb-4">💰 Gold: {campaignState.partyGold}</p>
                            <div className="space-y-4">
                                {campaignState.party.map(char => (
                                    <div key={char.id} className="bg-gray-700 rounded p-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <h3 className="font-bold">{char.name}</h3>
                                            <span className="text-sm text-gray-400">Lvl {char.level} {char.archetype}</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                            <div>
                                                <div className="flex items-center justify-between">
                                                    <span>HP:</span>
                                                    <span className="text-red-400">{char.hp}/{char.maxHp}</span>
                                                </div>
                                                <div className="w-full bg-gray-600 rounded-full h-2">
                                                    <div
                                                        className="bg-red-500 h-2 rounded-full"
                                                        style={{ width: `${(char.hp / char.maxHp) * 100}%` }}
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <div className="flex items-center justify-between">
                                                    <span>MP:</span>
                                                    <span className="text-blue-400">{char.mp}/{char.maxMp}</span>
                                                </div>
                                                <div className="w-full bg-gray-600 rounded-full h-2">
                                                    <div
                                                        className="bg-blue-500 h-2 rounded-full"
                                                        style={{ width: `${(char.mp / char.maxMp) * 100}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {currentView === 'factions' && (
                        <div>
                            <h2 className="text-xl font-bold mb-4">🏰 Faction Status</h2>
                            <div className="space-y-4">
                                {campaignState.factions.map(faction => (
                                    <div key={faction.id} className="bg-gray-700 rounded p-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <h3 className="font-bold" style={{ color: faction.color }}>{faction.name}</h3>
                                            <span className="text-sm">🏛️ {faction.territories} territories</span>
                                        </div>
                                        <div className="grid grid-cols-3 gap-2 text-sm text-gray-400">
                                            <div>💰 {faction.resources.gold} gold</div>
                                            <div>⚔️ {faction.resources.recruits} recruits</div>
                                            <div>✨ {faction.resources.magic} magic</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Panel - Activity Log & Controls */}
                <div className="bg-gray-800 rounded-lg p-6">
                    <h2 className="text-xl font-bold mb-4">📜 Activity Log</h2>
                    <div className="bg-gray-700 rounded p-3 mb-4 h-96 overflow-y-auto text-sm font-mono">
                        {logs.map((log, idx) => (
                            <div key={idx} className="text-gray-300 mb-1">{log}</div>
                        ))}
                    </div>

                    <div className="space-y-2">
                        <button
                            onClick={advanceDay}
                            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded"
                        >
                            ⏰ Advance Day
                        </button>
                        <button
                            onClick={() => {
                                if (onNavigateToMenu) {
                                    onNavigateToMenu();
                                } else {
                                    window.location.href = '#/menu';
                                }
                            }}
                            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                        >
                            🚪 Exit Campaign
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default IntegratedCampaign;
