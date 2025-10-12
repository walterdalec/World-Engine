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

import React, { useState, useCallback } from 'react';
import { WorldNoise } from '../../proc/noise';
import { SeededRandom } from '../../seededGenerators';
import { useGameStore } from '../../store/gameStore';
import { CampaignBattleBridge } from './CampaignBattleBridge';
import PixiWorldMap from '../world/components/PixiWorldMap';

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
    const [showCampaignMenu, setShowCampaignMenu] = useState(true); // Show menu first
    const [isInitializing, setIsInitializing] = useState(false); // Don't auto-initialize
    const [currentView, setCurrentView] = useState<'world' | 'party' | 'factions' | 'battle'>('world');
    const [logs, setLogs] = useState<string[]>([]);

    // Battle state
    const [activeBattle, setActiveBattle] = useState<{
        encounterType: string;
        partyLevel: number;
    } | null>(null);

    const { characters, updateCurrentCharacter, saveCharacter } = useGameStore();

    // Load characters directly from Character Library if game store is empty
    const availableCharacters = React.useMemo(() => {
        if (characters.length > 0) {
            return characters;
        }

        // Try to load from Character Library localStorage
        try {
            const libraryCharsJson = localStorage.getItem('world-engine-characters');
            if (!libraryCharsJson) return [];

            const libraryChars = JSON.parse(libraryCharsJson);
            console.log(`📚 Found ${libraryChars.length} characters in Character Library`);

            // Convert to display format (don't save to store yet)
            return libraryChars.map((savedChar: any) => {
                const char = savedChar.data;
                return {
                    name: char.name,
                    species: char.species,
                    archetype: char.archetype,
                    level: char.level || 1,
                    libraryData: savedChar // Keep original for later conversion
                };
            });
        } catch (error) {
            console.error('❌ Error loading Character Library:', error);
            return [];
        }
    }, [characters]);

    const addLog = useCallback((message: string) => {
        setLogs(prev => [...prev.slice(-19), `[Day ${campaignState?.currentDay || 0}] ${message}`]);
    }, [campaignState?.currentDay]);

    // Start a new campaign
    const startNewCampaign = useCallback(() => {
        if (availableCharacters.length === 0) {
            console.log('❌ No characters available to start campaign');
            return;
        }

        console.log('🌍 Starting new campaign...');
        setShowCampaignMenu(false);
        setIsInitializing(true);

        const seed = `campaign-${Date.now()}`;

        // Use ONLY the first character as the main protagonist
        const mainChar: any = availableCharacters[0];

        // If loading from library, convert the data
        let charData = mainChar;
        if (mainChar.libraryData) {
            const libChar = mainChar.libraryData.data;
            charData = {
                id: mainChar.libraryData.id || libChar.name,
                name: libChar.name,
                species: libChar.species,
                archetype: libChar.archetype,
                level: libChar.level || 1,
                stats: libChar.stats || {},
                hp: 50 + ((libChar.level || 1) * 10),
                maxHp: 50 + ((libChar.level || 1) * 10),
                mp: 20 + ((libChar.level || 1) * 5),
                maxMp: 20 + ((libChar.level || 1) * 5),
                experience: 0,
                equipment: { weapon: 'Iron Sword', armor: 'Leather Armor', accessory: 'None' },
                abilities: [],
                spells: libChar.knownSpells || []
            };
        }

        const party: CampaignCharacter[] = [{
            id: charData.id || charData.name,
            name: charData.name,
            species: charData.species,
            archetype: charData.archetype,
            level: charData.level || 1,
            experience: charData.experience || 0,
            hp: charData.hp || 50 + ((charData.level || 1) * 10),
            maxHp: charData.maxHp || 50 + ((charData.level || 1) * 10),
            mp: charData.mp || 20 + ((charData.level || 1) * 5),
            maxMp: charData.maxMp || 20 + ((charData.level || 1) * 5),
            stats: charData.stats || {},
            equipment: charData.equipment || { weapon: 'Iron Sword', armor: 'Leather Armor', accessory: 'None' },
            abilities: Array.isArray(charData.abilities) ? charData.abilities.map((a: any) => a.name || a) : [],
            spells: Array.isArray(charData.spells) ? charData.spells : []
        }];

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

        // Add to logs (need to use setTimeout since state updates are async)
        setTimeout(() => {
            addLog('🌍 Campaign initialized successfully!');
            addLog(`🎮 ${mainChar.name} the ${mainChar.species} ${mainChar.archetype} begins their journey`);
            addLog(`🏰 ${factions.length} factions compete for control`);
            addLog('💡 Recruit companions and mercenaries as you explore');
        }, 100);
    }, [availableCharacters, addLog]);

    // Continue existing campaign (placeholder for now)
    const continueCampaign = useCallback(() => {
        console.log('🔄 Continue campaign - not implemented yet');
        // TODO: Load from localStorage
        addLog('🔄 No saved campaign found');
    }, [addLog]);

    // Quick start with test character
    const createTestCharacter = useCallback(() => {
        console.log('🎮 Creating test character...');
        updateCurrentCharacter({
            name: 'Test Hero',
            species: 'Human',
            archetype: 'Knight',
            world: 'Verdance',
            gender: 'male',
            pronouns: 'he/him',
            level: 1,
            experience: 0,
            hitPoints: 60,
            stats: { might: 15, agility: 12, intellect: 10, awareness: 14 },
            traits: ['Brave', 'Strong'],
            flaws: [],
            background: 'A brave knight ready for adventure',
            equipment: { weapon: 'Iron Sword', armor: 'Leather Armor', items: [] },
            abilities: []
        } as any); // Use 'as any' to bypass type check for now
        saveCharacter();
        addLog('🎮 Test character created!');
    }, [updateCurrentCharacter, saveCharacter, addLog]);

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

    // Trigger random encounter (from world map)
    const triggerEncounter = useCallback(() => {
        if (!campaignState) return;

        const rng = new SeededRandom(campaignState.seed + Date.now());
        const encounterTypes = ['Bandits', 'Monsters', 'Undead', 'Beasts'];
        const encounterType = encounterTypes[Math.floor(rng.next() * encounterTypes.length)];

        setActiveBattle({
            encounterType,
            partyLevel: Math.max(1, campaignState.party[0]?.level || 1)
        });
        setCurrentView('battle');
    }, [campaignState]);

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

    // Campaign Menu - Show before initializing
    if (showCampaignMenu && !campaignState) {
        const hasSavedCampaign = false; // TODO: Check localStorage for saved campaign

        return (
            <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
                <div className="text-center max-w-2xl">
                    <div className="text-6xl mb-4">⚔️</div>
                    <h1 className="text-4xl font-bold mb-2">Integrated Campaign</h1>
                    <p className="text-gray-400 mb-8">
                        Experience the full World Engine with strategic faction warfare,
                        tactical battles, and endless exploration.
                    </p>

                    {availableCharacters.length === 0 ? (
                        // No characters - need to create first
                        <div className="bg-gray-800 rounded-lg p-6 mb-4">
                            <div className="text-4xl mb-4">👥</div>
                            <h2 className="text-2xl font-bold mb-2">No Characters Found</h2>
                            <p className="text-gray-400 mb-6">
                                You need to create at least one character before starting a campaign.
                            </p>
                            <div className="space-y-2">
                                <button
                                    onClick={createTestCharacter}
                                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-3 px-6 rounded-lg"
                                >
                                    ⚡ Quick Start (Test Character)
                                </button>
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
                                    ✨ Create Custom Character
                                </button>
                            </div>
                        </div>
                    ) : (
                        // Has characters - show campaign options
                        <div className="space-y-4">
                            <div className="bg-gray-800 rounded-lg p-6 border-2 border-green-500">
                                <h2 className="text-2xl font-bold mb-2">🆕 New Campaign</h2>
                                <p className="text-gray-400 mb-4">
                                    Start a fresh adventure with <strong>{availableCharacters[0].name}</strong> the {availableCharacters[0].species} {availableCharacters[0].archetype}.
                                    <br />
                                    <span className="text-sm">Recruit companions and mercenaries during your journey.</span>
                                </p>
                                <button
                                    onClick={startNewCampaign}
                                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-3 px-6 rounded-lg"
                                >
                                    🌍 Start New Campaign
                                </button>
                            </div>

                            {hasSavedCampaign && (
                                <div className="bg-gray-800 rounded-lg p-6 border-2 border-blue-500">
                                    <h2 className="text-2xl font-bold mb-2">📖 Continue Campaign</h2>
                                    <p className="text-gray-400 mb-4">
                                        Resume your last adventure.
                                    </p>
                                    <button
                                        onClick={continueCampaign}
                                        className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold py-3 px-6 rounded-lg"
                                    >
                                        🔄 Continue Campaign
                                    </button>
                                </div>
                            )}

                            {availableCharacters.length > 1 && (
                                <div className="bg-gray-800 rounded-lg p-4">
                                    <p className="text-sm text-gray-400 mb-2">
                                        <strong>Other Characters Available:</strong>
                                    </p>
                                    <div className="flex flex-wrap gap-2 justify-center">
                                        {availableCharacters.slice(1, 5).map((char: any, i: number) => (
                                            <div key={i} className="bg-gray-700 px-3 py-1 rounded text-sm">
                                                {char.name} ({char.species} {char.archetype})
                                            </div>
                                        ))}
                                        {availableCharacters.length > 5 && (
                                            <div className="bg-gray-700 px-3 py-1 rounded text-sm text-gray-400">
                                                +{availableCharacters.length - 5} more
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-500 mt-2 text-center">
                                        (Future feature: Choose which character to play as)
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    <button
                        onClick={() => {
                            if (onNavigateToMenu) {
                                onNavigateToMenu();
                            } else {
                                window.location.href = '#/menu';
                            }
                        }}
                        className="mt-6 w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-6 rounded-lg"
                    >
                        ← Back to Main Menu
                    </button>
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
                <div className="lg:col-span-2 bg-gray-800 rounded-lg overflow-hidden">
                    {currentView === 'world' && (
                        <div className="h-full">
                            <div className="bg-gray-700 p-2 border-b border-gray-600">
                                <h2 className="text-lg font-bold">🗺️ World Map</h2>
                                <p className="text-xs text-gray-400">
                                    Use WASD to move • Mouse wheel to zoom • Drag to pan
                                </p>
                            </div>
                            <div className="relative" style={{ height: '600px' }}>
                                <PixiWorldMap
                                    seed={campaignState.seed}
                                    onPositionChange={(pos) => {
                                        setCampaignState(prev => {
                                            if (!prev) return prev;
                                            return {
                                                ...prev,
                                                partyPosition: pos
                                            };
                                        });
                                    }}
                                    onEncounter={(pos) => {
                                        // Update party position and trigger encounter
                                        setCampaignState(prev => {
                                            if (!prev) return prev;
                                            return {
                                                ...prev,
                                                partyPosition: pos
                                            };
                                        });
                                        addLog(`⚔️ Random encounter at (${pos.x}, ${pos.y})!`);
                                        triggerEncounter();
                                    }}
                                    onSettlement={(pos) => {
                                        setCampaignState(prev => {
                                            if (!prev) return prev;
                                            return {
                                                ...prev,
                                                partyPosition: pos
                                            };
                                        });
                                        addLog(`🏘️ Discovered settlement at (${pos.x}, ${pos.y})`);
                                    }}
                                />
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
