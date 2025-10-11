/**
 * Hex-Based World Map
 * Professional overworld map with hex grid, encounters, and settlements
 * Replaces square grid with proper hex coordinates
 */

import React, { useState, useEffect, useCallback } from 'react';
import { WorldHexRenderer } from './components/WorldHexRenderer';
import { SettlementInterior } from './components/SettlementInterior';
import { storage } from '../../core/services/storage';
import { generateEncounter, mapBiomeToEncounterBiome } from './encounters/generator';
import type { EncounterType } from './encounters/types';

interface HexWorldMapProps {
    seedStr?: string;
    onBack?: () => void;
}

interface WorldTile {
    q: number;
    r: number;
    biome: string;
    settlement?: Settlement | null;
    encounter?: MapEncounter | null;
    explored: boolean;
}

interface Settlement {
    type: 'city' | 'town' | 'village' | 'hut' | 'shrine' | 'outpost' | 'trading_post';
    name: string;
    population: number;
    faction?: string;
    description: string;
    emoji: string;
    services?: string[];
}

// Simplified encounter for map display
interface MapEncounter {
    type: EncounterType;
    name: string;
    description: string;
    emoji: string;
    danger: 'safe' | 'low' | 'medium' | 'high' | 'extreme';
    biome: string;
    difficulty: number;
    xp: number;
}

interface PlayerPosition {
    q: number;
    r: number;
}

export default function HexWorldMap({ seedStr = "hex-world-001", onBack }: HexWorldMapProps) {
    const [playerPos, setPlayerPos] = useState<PlayerPosition>({ q: 10, r: 10 });
    const [worldTiles, setWorldTiles] = useState<WorldTile[]>([]);

    // Initialize with starting area explored (player position + neighbors)
    const [exploredTiles, setExploredTiles] = useState<Set<string>>(() => {
        const initial = new Set<string>();
        const startQ = 10;
        const startR = 10;

        // Mark starting position
        initial.add(`${startQ},${startR}`);

        // Mark 6 neighbors (hex directions)
        initial.add(`${startQ},${startR - 1}`); // North
        initial.add(`${startQ},${startR + 1}`); // South
        initial.add(`${startQ - 1},${startR}`); // Northwest
        initial.add(`${startQ + 1},${startR}`); // Northeast
        initial.add(`${startQ - 1},${startR + 1}`); // Southwest
        initial.add(`${startQ + 1},${startR - 1}`); // Southeast

        return initial;
    });

    const [activeSettlement, setActiveSettlement] = useState<Settlement | null>(null);
    const [activeEncounter, setActiveEncounter] = useState<MapEncounter | null>(null);
    const [playerCharacters, setPlayerCharacters] = useState<any[]>([]);
    const [viewingSettlementInterior, setViewingSettlementInterior] = useState(false);

    const mapWidth = 21;
    const mapHeight = 21;    // Load player characters from localStorage
    useEffect(() => {
        try {
            const saved = JSON.parse(storage.local.getItem('world-engine-saved-characters') || '[]');
            setPlayerCharacters(saved.slice(0, 4));
        } catch (error) {
            console.error('Error loading saved characters:', error);
            setPlayerCharacters([{
                name: "Adventurer",
                species: "human",
                archetype: "knight",
                level: 1,
                hp: 20,
                maxHp: 20
            }]);
        }
    }, []);

    // Seeded random number generator
    const seededRandom = useCallback((q: number, r: number, seed: string) => {
        const str = `${seed}-${q}-${r}`;
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash) / 2147483647;
    }, []);

    // Get biome for hex coordinates
    const getBiome = useCallback((q: number, r: number): string => {
        // Use hex coordinates for noise generation
        const noise1 = seededRandom(q, r, seedStr + "n1") * 2 - 1;
        const noise2 = seededRandom(Math.floor(q * 0.5), Math.floor(r * 0.5), seedStr + "n2") * 2 - 1;
        const combinedNoise = (noise1 + noise2 * 0.5) * 1.5;

        // Distance from center (origin at 10,10)
        const centerQ = 10;
        const centerR = 10;
        const distFromCenter = Math.sqrt((q - centerQ) ** 2 + (r - centerR) ** 2) + combinedNoise;

        // Use r coordinate as latitude analog
        const latitude = r + combinedNoise * 2;

        // Ocean/coast based on distance
        if (distFromCenter > 15) return 'Ocean';
        if (distFromCenter > 13) return 'Coast';

        // Latitude-based biomes
        if (latitude > 15) return 'Snow';
        if (latitude < 5) return 'Tundra';
        if (latitude > 12 && noise1 > 0) return 'Desert';
        if (latitude > 10) return 'Savanna';

        // Noise-based variety
        if (noise1 > 0.6) return 'Mountain';
        if (noise1 > 0.3) return 'Forest';
        if (noise1 > 0) return 'Grass';
        if (noise1 > -0.3) return 'Swamp';
        if (noise1 > -0.6) return 'Jungle';
        return 'Taiga';
    }, [seededRandom, seedStr]);

    // Hex distance calculation for settlement spacing
    const hexDistance = useCallback((q1: number, r1: number, q2: number, r2: number): number => {
        // Convert axial to cube coordinates
        const x1 = q1, z1 = r1, y1 = -x1 - z1;
        const x2 = q2, z2 = r2, y2 = -x2 - z2;
        return Math.max(Math.abs(x1 - x2), Math.abs(y1 - y2), Math.abs(z1 - z2));
    }, []);

    // Biome weights for settlement placement (prefer habitable terrain)
    const getSettlementWeight = useCallback((biome: string): number => {
        const weights: Record<string, number> = {
            'Grass': 1.0,      // Best for settlements
            'Forest': 0.75,    // Good
            'Savanna': 0.8,    // Good
            'Coast': 0.6,      // Coastal towns
            'Taiga': 0.5,      // Frontier settlements
            'Jungle': 0.4,     // Difficult
            'Swamp': 0.25,     // Poor
            'Desert': 0.2,     // Oasis only
            'Tundra': 0.15,    // Harsh
            'Mountain': 0.1,   // Mining outposts only
            'Snow': 0.05,      // Rarely inhabited
            'Ocean': 0.0       // No settlements
        };
        return weights[biome] || 0;
    }, []);

    // Generate settlements with proper spacing and biome awareness
    const generateSettlements = useCallback((): Map<string, Settlement> => {
        const settlements = new Map<string, Settlement>();
        const candidates: Array<{ q: number; r: number; score: number }> = [];

        // Generate candidate positions
        for (let q = 0; q < mapWidth; q++) {
            for (let r = 0; r < mapHeight; r++) {
                const biome = getBiome(q, r);
                const weight = getSettlementWeight(biome);

                if (weight > 0) {
                    const randomFactor = seededRandom(q, r, seedStr + "settle-score");
                    candidates.push({ q, r, score: weight + randomFactor * 0.2 });
                }
            }
        }

        // Sort by score (best locations first)
        candidates.sort((a, b) => b.score - a.score);

        // Place settlements with spacing constraints
        const minSpacing = 4; // Minimum 4 hexes apart
        const maxSettlements = Math.floor(mapWidth * mapHeight / 30); // ~1 per 30 tiles

        for (const candidate of candidates) {
            if (settlements.size >= maxSettlements) break;

            // Check spacing from existing settlements
            let tooClose = false;
            settlements.forEach((_settlement, key) => {
                if (tooClose) return;
                const [eq, er] = key.split(',').map(Number);
                if (hexDistance(candidate.q, candidate.r, eq, er) < minSpacing) {
                    tooClose = true;
                }
            });

            if (!tooClose) {
                const biome = getBiome(candidate.q, candidate.r);
                const settlementType = determineSettlementType(candidate.q, candidate.r, biome);
                settlements.set(`${candidate.q},${candidate.r}`, settlementType);
            }
        }

        console.log(`🏘️ Generated ${settlements.size} settlements with proper spacing`);
        return settlements;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mapWidth, mapHeight, getBiome, getSettlementWeight, hexDistance, seededRandom, seedStr]);

    // Determine settlement type based on location and biome
    const determineSettlementType = useCallback((q: number, r: number, biome: string): Settlement => {
        const roll = seededRandom(q, r, seedStr + "type");

        // Biome-specific settlement types
        let type: Settlement['type'];
        let emoji: string;
        let services: string[];

        if (biome === 'Mountain') {
            type = roll > 0.7 ? 'outpost' : 'hut';
            emoji = roll > 0.7 ? '🗼' : '🛖';
            services = ['rest'];
        } else if (biome === 'Forest' || biome === 'Jungle') {
            type = roll > 0.8 ? 'village' : roll > 0.5 ? 'hut' : 'shrine';
            emoji = roll > 0.8 ? '🏡' : roll > 0.5 ? '🛖' : '⛩️';
            services = roll > 0.8 ? ['rest', 'trade'] : ['rest'];
        } else if (biome === 'Coast') {
            type = roll > 0.7 ? 'trading_post' : 'village';
            emoji = roll > 0.7 ? '🏪' : '🏡';
            services = roll > 0.7 ? ['rest', 'trade', 'recruit'] : ['rest', 'trade'];
        } else if (biome === 'Grass' || biome === 'Savanna') {
            // Best land - can have larger settlements
            if (roll > 0.95) {
                type = 'city';
                emoji = '🏰';
                services = ['rest', 'trade', 'recruit', 'bank', 'guild'];
            } else if (roll > 0.8) {
                type = 'town';
                emoji = '🏘️';
                services = ['rest', 'trade', 'recruit'];
            } else if (roll > 0.5) {
                type = 'village';
                emoji = '🏡';
                services = ['rest', 'trade'];
            } else {
                type = 'hut';
                emoji = '🛖';
                services = ['rest'];
            }
        } else {
            // Default for other biomes
            type = roll > 0.6 ? 'village' : 'hut';
            emoji = roll > 0.6 ? '🏡' : '�';
            services = roll > 0.6 ? ['rest', 'trade'] : ['rest'];
        }

        const population = type === 'city' ? 5000 + Math.floor(seededRandom(q, r, seedStr + "pop") * 10000) :
            type === 'town' ? 1000 + Math.floor(seededRandom(q, r, seedStr + "pop") * 4000) :
                type === 'village' ? 100 + Math.floor(seededRandom(q, r, seedStr + "pop") * 900) :
                    10 + Math.floor(seededRandom(q, r, seedStr + "pop") * 90);

        const names = ['Riverside', 'Oakwood', 'Stonehaven', 'Maplegrove', 'Thornhill', 'Silverpeak', 'Goldmeadow', 'Ironforge', 'Misthaven', 'Sunvale'];
        const nameIndex = Math.floor(seededRandom(q, r, seedStr + "name") * names.length);

        return {
            type,
            name: `${names[nameIndex]} (${q},${r})`,
            population,
            description: `A ${type} in the ${biome}`,
            emoji,
            services
        };
    }, [seededRandom, seedStr]);

    // Settlements map (generated once)
    const settlementsMap = React.useMemo(() => generateSettlements(), [generateSettlements]);

    // Get settlement for hex (lookup from generated map)
    const getSettlement = useCallback((q: number, r: number): Settlement | null => {
        return settlementsMap.get(`${q},${r}`) || null;
    }, [settlementsMap]);

    // Get encounter for hex using proper encounter system
    const getEncounter = useCallback((q: number, r: number): MapEncounter | null => {
        const settlement = getSettlement(q, r);
        if (settlement) return null; // No encounters at settlements

        const encounterChance = seededRandom(q, r, seedStr + "encounter");

        if (encounterChance > 0.80) { // 20% chance per tile
            const biome = getBiome(q, r);
            const encounterBiome = mapBiomeToEncounterBiome(biome.toLowerCase());

            // Generate proper encounter using the system
            const systemEncounter = generateEncounter(
                Math.floor(seededRandom(q, r, seedStr) * 1000000),
                encounterBiome,
                { id: 'region-1', factionName: 'Neutral', tier: 1, control: 0.5, conflictLevel: 0 },
                playerCharacters[0]?.level || 1,
                { q, r, sectorX: 0, sectorY: 0 }
            );

            // Convert to map encounter with visual data
            const encounterEmojis: Record<EncounterType, string> = {
                'RAID_PARTY': '⚔️',
                'SCOUT_PATROL': '�️',
                'WANDERER': '�',
                'MONSTER': '🐉',
                'BANDIT': '🗡️',
                'MERCHANT': '�',
                'QUEST_GIVER': '📜',
                'TREASURE': '💎',
                'AMBUSH': '🎭'
            };

            const getDangerLevel = (difficulty: number): MapEncounter['danger'] => {
                if (difficulty <= 2) return 'safe';
                if (difficulty <= 4) return 'low';
                if (difficulty <= 6) return 'medium';
                if (difficulty <= 8) return 'high';
                return 'extreme';
            };

            return {
                type: systemEncounter.type,
                name: `${systemEncounter.type.replace('_', ' ')} encounter`,
                description: `A ${getDangerLevel(systemEncounter.difficulty)} ${systemEncounter.type.toLowerCase().replace('_', ' ')} in the ${biome}`,
                emoji: encounterEmojis[systemEncounter.type],
                danger: getDangerLevel(systemEncounter.difficulty),
                biome,
                difficulty: systemEncounter.difficulty,
                xp: systemEncounter.xp
            };
        }
        return null;
    }, [seededRandom, seedStr, getSettlement, getBiome, playerCharacters]);

    // Generate initial world tiles
    useEffect(() => {
        console.log('🗺️ Generating world tiles...');
        const tiles: WorldTile[] = [];
        for (let q = 0; q < mapWidth; q++) {
            for (let r = 0; r < mapHeight; r++) {
                tiles.push({
                    q,
                    r,
                    biome: getBiome(q, r),
                    settlement: getSettlement(q, r),
                    encounter: getEncounter(q, r),
                    explored: exploredTiles.has(`${q},${r}`)
                });
            }
        }
        console.log(`🗺️ Generated ${tiles.length} tiles, ${tiles.filter(t => t.explored).length} explored`);
        console.log('🗺️ Sample explored tiles:', tiles.filter(t => t.explored).map(t => `(${t.q},${t.r}) ${t.biome}`));
        setWorldTiles(tiles);
    }, [getBiome, getSettlement, getEncounter, exploredTiles, mapWidth, mapHeight]);

    // Keyboard controls for hex movement (6 directions)
    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            const key = e.key.toLowerCase();
            let newQ = playerPos.q;
            let newR = playerPos.r;

            // Hex directions (pointy-top):
            // Q: up-right, W: up, E: down-left
            // A: up-left, S: down, D: down-right
            switch (key) {
                case 'w': // North
                    newR -= 1;
                    break;
                case 's': // South
                    newR += 1;
                    break;
                case 'q': // Northwest
                    newQ -= 1;
                    break;
                case 'e': // Northeast
                    newQ += 1;
                    break;
                case 'a': // Southwest
                    newQ -= 1;
                    newR += 1;
                    break;
                case 'd': // Southeast
                    newQ += 1;
                    newR -= 1;
                    break;
                default:
                    return;
            }

            // Bounds checking
            if (newQ < 0 || newQ >= mapWidth || newR < 0 || newR >= mapHeight) {
                return;
            }

            e.preventDefault();
            setPlayerPos({ q: newQ, r: newR });

            // Mark as explored
            setExploredTiles(prev => {
                const newSet = new Set(prev);
                newSet.add(`${newQ},${newR}`);
                // Also explore adjacent hexes
                const neighbors = [
                    [newQ, newR - 1], [newQ, newR + 1],
                    [newQ - 1, newR], [newQ + 1, newR],
                    [newQ - 1, newR + 1], [newQ + 1, newR - 1]
                ];
                neighbors.forEach(([q, r]) => {
                    if (q >= 0 && q < mapWidth && r >= 0 && r < mapHeight) {
                        newSet.add(`${q},${r}`);
                    }
                });
                return newSet;
            });

            // Check for settlement or encounter
            const tile = worldTiles.find(t => t.q === newQ && t.r === newR);
            if (tile?.settlement) {
                setActiveSettlement(tile.settlement);
            } else if (tile?.encounter) {
                const encounterTrigger = Math.random();
                if (encounterTrigger > 0.5) { // 50% chance to trigger
                    setActiveEncounter(tile.encounter);
                }
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [playerPos, worldTiles, mapWidth, mapHeight]);

    // Handle tile click
    const handleTileClick = useCallback((_q: number, _r: number) => {
        // TODO: Implement pathfinding and automatic movement
        console.log(`🗺️ Clicked hex (${_q}, ${_r})`);
    }, []);

    // Close settlement dialog
    const handleCloseSettlement = useCallback(() => {
        setActiveSettlement(null);
    }, []);

    // Enter settlement interior
    const handleEnterSettlement = useCallback(() => {
        setViewingSettlementInterior(true);
    }, []);

    // Exit settlement interior
    const handleExitSettlement = useCallback(() => {
        setViewingSettlementInterior(false);
        setActiveSettlement(null);
    }, []);

    // Handle encounter
    const handleEncounter = useCallback(() => {
        // TODO: Connect to BrigandineHexBattle
        console.log('⚔️ Starting battle...', activeEncounter);
        setActiveEncounter(null);
    }, [activeEncounter]);

    return (
        <>
            {/* Settlement Interior View */}
            {viewingSettlementInterior && activeSettlement && (
                <SettlementInterior
                    settlementType={activeSettlement.type}
                    settlementName={activeSettlement.name}
                    seed={playerPos.q * 1000 + playerPos.r} // Deterministic seed
                    onExit={handleExitSettlement}
                />
            )}

            {/* World Map View */}
            {!viewingSettlementInterior && (
                <div className="relative w-screen h-screen bg-gray-900 text-white overflow-hidden">
                    {/* Header */}
                    <div className="absolute top-0 left-0 right-0 z-10 bg-gray-800 bg-opacity-90 p-4">
                        <div className="flex justify-between items-center">
                            <h1 className="text-2xl font-bold">Hex World Map</h1>
                            <div className="flex gap-4">
                                <div className="text-sm">
                                    <div>Position: ({playerPos.q}, {playerPos.r})</div>
                                    <div>Party Size: {playerCharacters.length}</div>
                                </div>
                                {onBack && (
                                    <button
                                        onClick={onBack}
                                        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded"
                                    >
                                        ← Back
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* World Renderer */}
                    <div className="absolute inset-0 pt-20">
                        <WorldHexRenderer
                            tiles={worldTiles}
                            playerPos={playerPos}
                            width={mapWidth}
                            height={mapHeight}
                            onTileClick={handleTileClick}
                            showGrid={true}
                        />
                    </div>

                    {/* Controls overlay - top left for visibility */}
                    <div className="absolute top-24 left-4 bg-black bg-opacity-75 p-4 rounded text-sm z-10">
                        <div className="font-bold mb-2">Hex Controls (6 directions):</div>
                        <div className="grid grid-cols-3 gap-1 text-center mb-1">
                            <div className="bg-gray-700 px-2 py-1 rounded">Q</div>
                            <div className="bg-gray-700 px-2 py-1 rounded">W</div>
                            <div className="bg-gray-700 px-2 py-1 rounded">E</div>
                        </div>
                        <div className="grid grid-cols-3 gap-1 text-center text-xs mb-2">
                            <div>↖</div>
                            <div>↑</div>
                            <div>↗</div>
                        </div>
                        <div className="grid grid-cols-3 gap-1 text-center mb-1">
                            <div className="bg-gray-700 px-2 py-1 rounded">A</div>
                            <div className="bg-gray-700 px-2 py-1 rounded">S</div>
                            <div className="bg-gray-700 px-2 py-1 rounded">D</div>
                        </div>
                        <div className="grid grid-cols-3 gap-1 text-center text-xs mb-2">
                            <div>↙</div>
                            <div>↓</div>
                            <div>↘</div>
                        </div>
                        <div className="mt-2 text-xs text-gray-400 border-t border-gray-600 pt-2">
                            🖱️ Drag to pan<br />
                            🔍 Scroll to zoom
                        </div>
                    </div>

                    {/* Settlement dialog */}
                    {activeSettlement && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-20">
                            <div className="bg-gray-800 p-6 rounded-lg max-w-md">
                                <h2 className="text-2xl font-bold mb-4">
                                    {activeSettlement.emoji} {activeSettlement.name}
                                </h2>
                                <p className="mb-2">Type: {activeSettlement.type}</p>
                                <p className="mb-2">Population: {activeSettlement.population}</p>
                                <p className="mb-4">{activeSettlement.description}</p>
                                <div className="mb-4">
                                    <strong>Services:</strong> {activeSettlement.services?.join(', ')}
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleEnterSettlement}
                                        className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded"
                                    >
                                        🏘️ Enter Settlement
                                    </button>
                                    <button
                                        onClick={handleCloseSettlement}
                                        className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded"
                                    >
                                        Leave
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Encounter dialog */}
                    {activeEncounter && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-20">
                            <div className="bg-gray-800 p-6 rounded-lg max-w-md">
                                <h2 className="text-2xl font-bold mb-4">
                                    {activeEncounter.emoji} Encounter!
                                </h2>
                                <p className="mb-2">Type: {activeEncounter.type}</p>
                                <p className="mb-2">Danger: <span className={
                                    activeEncounter.danger === 'extreme' ? 'text-red-500' :
                                        activeEncounter.danger === 'high' ? 'text-orange-500' :
                                            activeEncounter.danger === 'medium' ? 'text-yellow-500' :
                                                'text-green-500'
                                }>{activeEncounter.danger}</span></p>
                                <p className="mb-4">{activeEncounter.description}</p>
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleEncounter}
                                        className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 rounded"
                                    >
                                        ⚔️ Fight
                                    </button>
                                    <button
                                        onClick={() => setActiveEncounter(null)}
                                        className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded"
                                    >
                                        🏃 Flee
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </>
    );
}
