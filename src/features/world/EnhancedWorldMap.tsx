import React, { useEffect, useState, useCallback } from "react";

interface Settlement {
    type: 'capital' | 'city' | 'town' | 'village' | 'fortress' | 'shrine' | 'outpost' | 'trading_post';
    name: string;
    population: number;
    faction?: string;
    description: string;
    emoji: string;
    level: number; // 1-5 for recruitment/importance
    garrison?: number;
    resources?: string[];
    services?: string[];
    isPlayerControlled?: boolean;
    isUnderSiege?: boolean;
}

interface Encounter {
    type: 'creature' | 'treasure' | 'event' | 'faction' | 'mystery' | 'quest' | 'resource' | 'ruins';
    name: string;
    description: string;
    emoji: string;
    danger: 'safe' | 'low' | 'medium' | 'high' | 'extreme';
    level?: number;
    quest?: any;
    treasure?: any;
    isDiscovered?: boolean;
}

interface TerrainFeature {
    name: string;
    color: string;
    emoji: string;
    movementCost: number; // For future tactical movement
    defenseBonus: number; // For battles
    canBuildOn: boolean;
    resources?: string[];
}

interface EnhancedWorldMapProps {
    seedStr?: string;
    onBack?: () => void;
}

// Enhanced terrain types with strategic properties
const terrainTypes: { [key: string]: TerrainFeature } = {
    ocean: { name: "Ocean", color: "#0369a1", emoji: "🌊", movementCost: 99, defenseBonus: 0, canBuildOn: false },
    coast: { name: "Coast", color: "#0ea5e9", emoji: "🏖️", movementCost: 1, defenseBonus: 0, canBuildOn: true },
    plains: { name: "Plains", color: "#84cc16", emoji: "🌾", movementCost: 1, defenseBonus: 0, canBuildOn: true, resources: ["Food"] },
    forest: { name: "Forest", color: "#16a34a", emoji: "🌲", movementCost: 2, defenseBonus: 1, canBuildOn: true, resources: ["Wood"] },
    mountain: { name: "Mountain", color: "#64748b", emoji: "⛰️", movementCost: 3, defenseBonus: 2, canBuildOn: true, resources: ["Stone", "Metals"] },
    swamp: { name: "Swamp", color: "#10b981", emoji: "🪵", movementCost: 3, defenseBonus: 1, canBuildOn: false, resources: ["Herbs"] },
    desert: { name: "Desert", color: "#eab308", emoji: "🏜️", movementCost: 2, defenseBonus: 0, canBuildOn: true, resources: ["Gems"] },
    tundra: { name: "Tundra", color: "#94a3b8", emoji: "🧊", movementCost: 2, defenseBonus: 0, canBuildOn: true },
    river: { name: "River", color: "#06b6d4", emoji: "💧", movementCost: 1, defenseBonus: 0, canBuildOn: false, resources: ["Water"] }
};

// Strategic factions with territorial goals
const factions = [
    {
        name: "Crystal Empire",
        color: "#8b5cf6",
        emoji: "💎",
        description: "Masters of magical crystals and ancient knowledge",
        territory: ["mountain", "desert"],
        relationship: "neutral"
    },
    {
        name: "Forest Alliance",
        color: "#16a34a",
        emoji: "🌲",
        description: "Guardians of nature and the old ways",
        territory: ["forest", "swamp"],
        relationship: "friendly"
    },
    {
        name: "Iron Legion",
        color: "#374151",
        emoji: "⚔️",
        description: "Military confederation seeking territorial expansion",
        territory: ["plains", "coast"],
        relationship: "hostile"
    },
    {
        name: "Free Cities",
        color: "#f59e0b",
        emoji: "🏛️",
        description: "Independent trading cities and merchant guilds",
        territory: ["coast", "river"],
        relationship: "neutral"
    }
];

export default function EnhancedWorldMap({ seedStr = "enhanced-world-001", onBack }: EnhancedWorldMapProps) {
    const [playerPos, setPlayerPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
    const [selectedTile, setSelectedTile] = useState<{ x: number; y: number } | null>(null);
    const [viewportOffset, setViewportOffset] = useState<{ x: number; y: number }>({ x: -9, y: -9 });
    const [activeSettlement, setActiveSettlement] = useState<Settlement | null>(null);
    const [activeEncounter, setActiveEncounter] = useState<Encounter | null>(null);
    const [exploredTiles, setExploredTiles] = useState<Set<string>>(new Set(["0,0"])); // Track exploration
    const [gameTime, _setGameTime] = useState({ season: 'Spring', week: 1, year: 1 });
    const [resources, _setResources] = useState({ gold: 1000, mana: 50, influence: 10 });

    const viewportSize = 19; // Larger viewport for better strategic view

    const seededRandom = useCallback((x: number, y: number, seed: string) => {
        const str = `${seed}-${x}-${y}`;
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash) / 2147483647;
    }, []);

    const generateSettlementName = useCallback((x: number, y: number, faction: string) => {
        const prefixes = {
            'Crystal Empire': ['Crystal', 'Arcane', 'Mystic', 'Star'],
            'Forest Alliance': ['Green', 'Wild', 'Elder', 'Grove'],
            'Iron Legion': ['Iron', 'Steel', 'War', 'Battle'],
            'Free Cities': ['Port', 'Trade', 'Golden', 'Free'],
            'Village': ['Little', 'Old', 'New', 'Fair']
        };

        const suffixes = ['hold', 'haven', 'ford', 'burg', 'ton', 'vale', 'ridge', 'gate'];

        const factionPrefixes = prefixes[faction as keyof typeof prefixes] || prefixes['Village'];
        const prefix = factionPrefixes[Math.floor(seededRandom(x, y, seedStr + "name1") * factionPrefixes.length)];
        const suffix = suffixes[Math.floor(seededRandom(x, y, seedStr + "name2") * suffixes.length)];

        return `${prefix}${suffix}`;
    }, [seededRandom, seedStr]);

    // Enhanced terrain generation with continental features
    const getTerrain = useCallback((x: number, y: number) => {
        const distance = Math.sqrt(x * x + y * y);
        const noise1 = seededRandom(x, y, seedStr + "n1") * 2 - 1;
        const noise2 = seededRandom(Math.floor(x * 0.3), Math.floor(y * 0.3), seedStr + "n2") * 2 - 1;
        const continentNoise = (noise1 + noise2 * 0.6) * 2;

        // Create continental land mass
        const landThreshold = distance + continentNoise;
        if (landThreshold > 25) return terrainTypes.ocean;
        if (landThreshold > 22) return terrainTypes.coast;

        // Climate zones based on latitude
        const latitude = Math.abs(y + continentNoise);
        if (latitude > 18) return terrainTypes.tundra;
        if (latitude > 15) return terrainTypes.mountain;

        // Mountain ranges
        const mountainNoise = seededRandom(Math.floor(x * 0.4), Math.floor(y * 0.4), seedStr + "mountain");
        if (mountainNoise > 0.75) return terrainTypes.mountain;

        // River system (simplified - creates connected water features)
        const riverNoise = seededRandom(Math.floor(x * 0.7), Math.floor(y * 0.7), seedStr + "river");
        if (riverNoise > 0.85 && landThreshold < 15) return terrainTypes.river;

        // Biome distribution
        const biomeNoise = seededRandom(x, y, seedStr + "biome");
        const tempNoise = seededRandom(Math.floor(x * 0.2), Math.floor(y * 0.2), seedStr + "temp");

        if (tempNoise > 0.7) return terrainTypes.desert;
        if (biomeNoise > 0.6) return terrainTypes.forest;
        if (biomeNoise > 0.3 && latitude < 10) return terrainTypes.swamp;

        return terrainTypes.plains;
    }, [seedStr, seededRandom]);

    // Strategic settlement generation
    const getSettlement = useCallback((x: number, y: number): Settlement | null => {
        const terrain = getTerrain(x, y);
        if (!terrain.canBuildOn) return null;

        const distance = Math.sqrt(x * x + y * y);
        const settlementRoll = seededRandom(x, y, seedStr + "settlement");

        // Capital at origin
        if (x === 0 && y === 0) {
            return {
                type: 'capital',
                name: 'Arcanum Throne',
                population: 50000,
                faction: 'Crystal Empire',
                description: 'The great crystal spire where magic and politics intertwine.',
                emoji: '👑',
                level: 5,
                garrison: 1000,
                resources: ['Gold', 'Mana', 'Crystals'],
                services: ['Palace', 'Grand Market', 'Academy', 'Temple', 'Guild Halls'],
                isPlayerControlled: true
            };
        }

        // Major cities on strategic positions
        if (distance > 8 && distance < 20) {
            if (settlementRoll > 0.95) {
                const faction = factions[Math.floor(seededRandom(x, y, seedStr + "fac") * factions.length)];
                return {
                    type: 'city',
                    name: generateSettlementName(x, y, faction.name),
                    population: Math.floor(8000 + seededRandom(x, y, seedStr + "pop") * 12000),
                    faction: faction.name,
                    description: `A major ${faction.description.toLowerCase()} stronghold.`,
                    emoji: faction.emoji,
                    level: 4,
                    garrison: Math.floor(200 + seededRandom(x, y, seedStr + "gar") * 300),
                    resources: terrain.resources || [],
                    services: ['Market', 'Barracks', 'Temple', 'Inn']
                };
            }
            if (settlementRoll > 0.88) {
                const faction = factions[Math.floor(seededRandom(x, y, seedStr + "fac2") * factions.length)];
                return {
                    type: 'town',
                    name: generateSettlementName(x, y, faction.name),
                    population: Math.floor(2000 + seededRandom(x, y, seedStr + "pop2") * 4000),
                    faction: faction.name,
                    description: `A ${faction.description.toLowerCase()} settlement.`,
                    emoji: '🏘️',
                    level: 3,
                    garrison: Math.floor(50 + seededRandom(x, y, seedStr + "gar2") * 100),
                    resources: terrain.resources || [],
                    services: ['Market', 'Inn', 'Temple']
                };
            }
        }

        // Villages and outposts
        if (settlementRoll > 0.97) {
            return {
                type: 'village',
                name: generateSettlementName(x, y, 'Village'),
                population: Math.floor(100 + seededRandom(x, y, seedStr + "vpop") * 500),
                faction: 'Independent',
                description: 'A small independent settlement.',
                emoji: '🏡',
                level: 1,
                garrison: Math.floor(10 + seededRandom(x, y, seedStr + "vgar") * 20),
                services: ['Inn']
            };
        }

        return null;
    }, [getTerrain, seedStr, seededRandom, generateSettlementName]);

    // Enhanced encounter system
    const getEncounter = useCallback((x: number, y: number): Encounter | null => {
        const settlement = getSettlement(x, y);
        if (settlement) return null;

        const terrain = getTerrain(x, y);
        const distance = Math.sqrt(x * x + y * y);
        const encounterRoll = seededRandom(x, y, seedStr + "encounter");

        // No encounters in ocean
        if (terrain.name === "Ocean") return null;

        // Rare powerful encounters far from civilization
        if (distance > 15 && encounterRoll > 0.98) {
            return {
                type: 'creature',
                name: 'Ancient Dragon',
                description: 'A legendary wyrm guarding ancient treasures.',
                emoji: '🐉',
                danger: 'extreme',
                level: 10,
                isDiscovered: false
            };
        }

        // Resource nodes
        if (terrain.resources && encounterRoll > 0.92) {
            const resource = terrain.resources[0];
            return {
                type: 'resource',
                name: `${resource} Deposit`,
                description: `Rich deposits of ${resource.toLowerCase()} ready for extraction.`,
                emoji: getResourceEmoji(resource),
                danger: 'low',
                level: Math.floor(1 + distance / 5),
                isDiscovered: false
            };
        }

        // Ruins and mysteries
        if (encounterRoll > 0.94) {
            return {
                type: 'ruins',
                name: 'Ancient Ruins',
                description: 'Crumbling stones hide secrets of a forgotten age.',
                emoji: '🏛️',
                danger: 'medium',
                level: Math.floor(1 + distance / 3),
                isDiscovered: false
            };
        }

        // Regular encounters based on terrain
        if (encounterRoll > 0.85) {
            return generateTerrainEncounter(terrain, distance);
        }

        return null;
    }, [getSettlement, getTerrain, seedStr, seededRandom]);

    const getResourceEmoji = (resource: string) => {
        const emojis: { [key: string]: string } = {
            'Food': '🌾', 'Wood': '🪵', 'Stone': '🪨', 'Metals': '⚒️',
            'Herbs': '🌿', 'Gems': '💎', 'Water': '💧', 'Gold': '🟡',
            'Mana': '🔮', 'Crystals': '💎'
        };
        return emojis[resource] || '📦';
    };

    const generateTerrainEncounter = (terrain: TerrainFeature, distance: number): Encounter => {
        const level = Math.max(1, Math.floor(distance / 4));

        switch (terrain.name) {
            case 'Forest':
                return {
                    type: 'creature', name: 'Forest Guardians', emoji: '🧚‍♀️',
                    description: 'Mystical protectors of the ancient woods.',
                    danger: 'medium', level, isDiscovered: false
                };
            case 'Mountain':
                return {
                    type: 'creature', name: 'Mountain Bandits', emoji: '🏹',
                    description: 'Outlaws hiding in the rocky peaks.',
                    danger: 'high', level, isDiscovered: false
                };
            case 'Desert':
                return {
                    type: 'mystery', name: 'Mirage Oasis', emoji: '🏖️',
                    description: 'A shimmering vision that may hide treasure or danger.',
                    danger: 'medium', level, isDiscovered: false
                };
            default:
                return {
                    type: 'creature', name: 'Wild Beasts', emoji: '🐺',
                    description: 'Dangerous creatures roam these lands.',
                    danger: 'low', level, isDiscovered: false
                };
        }
    };

    // Keyboard movement with exploration
    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            let newX = playerPos.x;
            let newY = playerPos.y;

            switch (e.key.toLowerCase()) {
                case 'w': case 'arrowup': newY += 1; break;
                case 's': case 'arrowdown': newY -= 1; break;
                case 'a': case 'arrowleft': newX -= 1; break;
                case 'd': case 'arrowright': newX += 1; break;
                default: return;
            }

            e.preventDefault();

            // Check terrain movement cost (for future implementation)
            const terrain = getTerrain(newX, newY);
            if (terrain.movementCost >= 99) return; // Can't enter ocean

            setPlayerPos({ x: newX, y: newY });

            // Mark as explored
            setExploredTiles(prev => {
                const newSet = new Set(prev);
                newSet.add(`${newX},${newY}`);
                return newSet;
            });            // Center viewport
            const viewRadius = Math.floor(viewportSize / 2);
            setViewportOffset({
                x: newX - viewRadius,
                y: newY - viewRadius
            });
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [playerPos, getTerrain, viewportSize]);

    // Generate visible grid
    const generateGrid = () => {
        const grid = [];
        for (let y = 0; y < viewportSize; y++) {
            const row = [];
            for (let x = 0; x < viewportSize; x++) {
                const worldX = viewportOffset.x + x;
                const worldY = viewportOffset.y + y;
                const isPlayer = worldX === playerPos.x && worldY === playerPos.y;
                const isExplored = exploredTiles.has(`${worldX},${worldY}`);
                const terrain = getTerrain(worldX, worldY);
                const settlement = getSettlement(worldX, worldY);
                const encounter = settlement ? null : getEncounter(worldX, worldY);

                row.push({
                    x: worldX,
                    y: worldY,
                    terrain,
                    settlement,
                    encounter,
                    isPlayer,
                    isExplored
                });
            }
            grid.push(row);
        }
        return grid;
    };

    const grid = generateGrid();

    const handleTileClick = (x: number, y: number) => {
        const isExplored = exploredTiles.has(`${x},${y}`);
        if (!isExplored) return; // Can't interact with unexplored tiles

        setSelectedTile({ x, y });
        const settlement = getSettlement(x, y);
        const encounter = getEncounter(x, y);

        if (settlement) {
            setActiveSettlement(settlement);
            setActiveEncounter(null);
        } else if (encounter) {
            setActiveEncounter(encounter);
            setActiveSettlement(null);
        } else {
            setActiveSettlement(null);
            setActiveEncounter(null);
        }
    };

    const getDangerColor = (danger: string) => {
        switch (danger) {
            case 'safe': return '#10b981';
            case 'low': return '#f59e0b';
            case 'medium': return '#f97316';
            case 'high': return '#ef4444';
            case 'extreme': return '#991b1b';
            default: return '#6b7280';
        }
    };

    return (
        <div style={{ minHeight: "100vh", background: "#0f172a", color: "#f1f5f9", padding: "20px" }}>
            {/* Header with enhanced info */}
            <div style={{ textAlign: "center", marginBottom: "20px" }}>
                <h1 style={{ margin: "0 0 10px 0", color: "#8b5cf6" }}>⚔️ Strategic World Map ⚔️</h1>
                <div style={{ display: "flex", justifyContent: "center", gap: "20px", marginBottom: "10px" }}>
                    <div>📍 Position: ({playerPos.x}, {playerPos.y})</div>
                    <div>🌍 Terrain: {getTerrain(playerPos.x, playerPos.y).name}</div>
                    <div>📅 {gameTime.season} Week {gameTime.week}, Year {gameTime.year}</div>
                </div>
                <div style={{ display: "flex", justifyContent: "center", gap: "20px", fontSize: "14px", color: "#94a3b8" }}>
                    <div>💰 Gold: {resources.gold}</div>
                    <div>🔮 Mana: {resources.mana}</div>
                    <div>👑 Influence: {resources.influence}</div>
                    <div>🗺️ Explored: {exploredTiles.size} tiles</div>
                </div>
                <p style={{ fontSize: "14px", color: "#94a3b8", margin: "10px 0" }}>
                    WASD/Arrows: Move • Click: Interact • Only explored tiles are visible
                </p>

                <div style={{ display: "flex", justifyContent: "center", gap: "10px", marginTop: "10px" }}>
                    <button
                        onClick={() => {
                            setPlayerPos({ x: 0, y: 0 });
                            setViewportOffset({ x: -9, y: -9 });
                        }}
                        style={{
                            padding: "6px 12px", background: "#1e40af", color: "#f9fafb",
                            border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "12px"
                        }}
                    >
                        📍 Return to Capital
                    </button>
                    {onBack && (
                        <button
                            onClick={onBack}
                            style={{
                                padding: "8px 16px", background: "#059669", color: "#f9fafb",
                                border: "none", borderRadius: "6px", cursor: "pointer"
                            }}
                        >
                            ← Back to Menu
                        </button>
                    )}
                </div>
            </div>

            {/* Enhanced map grid */}
            <div style={{
                display: "grid",
                gridTemplateColumns: `repeat(${viewportSize}, 28px)`,
                gap: "1px",
                padding: "20px",
                background: "#1e293b",
                borderRadius: "16px",
                margin: "0 auto",
                width: "fit-content",
                boxShadow: "0 4px 20px rgba(0,0,0,0.3)"
            }}>
                {grid.flat().map(({ x, y, terrain, settlement, encounter, isPlayer, isExplored }) => {
                    const isSelected = selectedTile?.x === x && selectedTile?.y === y;

                    return (
                        <div
                            key={`${x},${y}`}
                            onClick={() => handleTileClick(x, y)}
                            title={isExplored ?
                                `${terrain.name} (${x}, ${y})${isPlayer ? ' - You are here!' : ''}${settlement ? ` - ${settlement.name}` : ''}${encounter ? ` - ${encounter.name}` : ''}` :
                                `Unexplored (${x}, ${y})`
                            }
                            style={{
                                width: "28px",
                                height: "28px",
                                background: isExplored ? terrain.color : "#374151",
                                border: isSelected ? "3px solid #fff" :
                                    isPlayer ? "3px solid #ffd93d" :
                                        settlement?.isPlayerControlled ? "2px solid #10b981" :
                                            settlement ? "2px solid #8b5cf6" :
                                                encounter ? `2px solid ${getDangerColor(encounter.danger)}` :
                                                    "1px solid rgba(0,0,0,0.2)",
                                cursor: isExplored ? "pointer" : "default",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "12px",
                                borderRadius: "3px",
                                position: "relative",
                                opacity: isExplored ? 1 : 0.3,
                                boxShadow: isPlayer ? 'inset 0 0 15px rgba(255, 215, 0, 0.6)' :
                                    settlement?.isPlayerControlled ? 'inset 0 0 10px rgba(16, 185, 129, 0.4)' :
                                        settlement ? 'inset 0 0 10px rgba(139, 92, 246, 0.3)' :
                                            encounter ? `inset 0 0 10px ${getDangerColor(encounter.danger)}40` :
                                                'none'
                            }}
                        >
                            {!isExplored ? '❓' :
                                isPlayer ? '👤' :
                                    settlement ? settlement.emoji :
                                        encounter ? encounter.emoji :
                                            terrain.emoji}
                        </div>
                    );
                })}
            </div>

            {/* Enhanced settlement details */}
            {activeSettlement && (
                <div style={{
                    textAlign: "center", marginTop: "20px", padding: "20px",
                    background: "#1e293b", borderRadius: "16px", maxWidth: "600px",
                    margin: "20px auto", border: "2px solid #8b5cf6"
                }}>
                    <h3 style={{ margin: "0 0 15px 0", color: "#8b5cf6", fontSize: "24px" }}>
                        {activeSettlement.emoji} {activeSettlement.name}
                    </h3>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", textAlign: "left" }}>
                        <div>
                            <p><strong>Type:</strong> {activeSettlement.type.charAt(0).toUpperCase() + activeSettlement.type.slice(1)}</p>
                            <p><strong>Population:</strong> {activeSettlement.population.toLocaleString()}</p>
                            <p><strong>Faction:</strong> {activeSettlement.faction}</p>
                            <p><strong>Level:</strong> {activeSettlement.level}/5</p>
                            {activeSettlement.garrison && <p><strong>Garrison:</strong> {activeSettlement.garrison}</p>}
                        </div>
                        <div>
                            {activeSettlement.resources && activeSettlement.resources.length > 0 && (
                                <div>
                                    <p><strong>Resources:</strong></p>
                                    <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
                                        {activeSettlement.resources.map(resource => (
                                            <span key={resource} style={{
                                                background: "#374151", padding: "2px 6px", borderRadius: "4px", fontSize: "12px"
                                            }}>
                                                {getResourceEmoji(resource)} {resource}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    <p style={{ margin: "15px 0", color: "#d1d5db", fontStyle: "italic" }}>
                        {activeSettlement.description}
                    </p>
                    {activeSettlement.services && activeSettlement.services.length > 0 && (
                        <div style={{ marginTop: "15px" }}>
                            <p><strong>Available Services:</strong></p>
                            <div style={{ display: "flex", justifyContent: "center", gap: "8px", flexWrap: "wrap" }}>
                                {activeSettlement.services.map(service => (
                                    <span key={service} style={{
                                        background: "#059669", color: "white", padding: "4px 8px",
                                        borderRadius: "6px", fontSize: "12px", fontWeight: "bold"
                                    }}>
                                        {service}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                    <div style={{ marginTop: "20px", display: "flex", gap: "10px", justifyContent: "center" }}>
                        <button style={{
                            padding: "10px 20px", background: "#8b5cf6", color: "#f9fafb",
                            border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold"
                        }}>
                            Enter Settlement
                        </button>
                        <button style={{
                            padding: "10px 20px", background: "#374151", color: "#f9fafb",
                            border: "none", borderRadius: "8px", cursor: "pointer"
                        }}>
                            Trade
                        </button>
                    </div>
                </div>
            )}

            {/* Enhanced encounter details */}
            {activeEncounter && (
                <div style={{
                    textAlign: "center", marginTop: "20px", padding: "20px",
                    background: "#1e293b", borderRadius: "16px", maxWidth: "600px",
                    margin: "20px auto", border: `2px solid ${getDangerColor(activeEncounter.danger)}`
                }}>
                    <h3 style={{ margin: "0 0 15px 0", color: getDangerColor(activeEncounter.danger), fontSize: "20px" }}>
                        {activeEncounter.emoji} {activeEncounter.name}
                    </h3>
                    <div style={{ display: "flex", justifyContent: "center", gap: "20px", marginBottom: "15px" }}>
                        <div><strong>Type:</strong> {activeEncounter.type}</div>
                        <div><strong>Danger:</strong> <span style={{ color: getDangerColor(activeEncounter.danger) }}>
                            {activeEncounter.danger.toUpperCase()}
                        </span></div>
                        {activeEncounter.level && <div><strong>Level:</strong> {activeEncounter.level}</div>}
                    </div>
                    <p style={{ margin: "15px 0", color: "#d1d5db", fontStyle: "italic" }}>
                        {activeEncounter.description}
                    </p>
                    <div style={{ marginTop: "20px", display: "flex", gap: "10px", justifyContent: "center" }}>
                        <button style={{
                            padding: "10px 20px", background: getDangerColor(activeEncounter.danger),
                            color: "#f9fafb", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold"
                        }}>
                            Investigate
                        </button>
                        <button style={{
                            padding: "10px 20px", background: "#374151", color: "#f9fafb",
                            border: "none", borderRadius: "8px", cursor: "pointer"
                        }}>
                            Avoid
                        </button>
                    </div>
                </div>
            )}

            {/* Faction legend */}
            <div style={{
                marginTop: "20px", padding: "15px", background: "#1e293b",
                borderRadius: "12px", maxWidth: "800px", margin: "20px auto"
            }}>
                <h4 style={{ margin: "0 0 10px 0", textAlign: "center", color: "#8b5cf6" }}>Major Factions</h4>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "10px" }}>
                    {factions.map(faction => (
                        <div key={faction.name} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <span style={{ fontSize: "18px" }}>{faction.emoji}</span>
                            <div>
                                <div style={{ fontWeight: "bold", color: faction.color }}>{faction.name}</div>
                                <div style={{ fontSize: "12px", color: "#94a3b8" }}>
                                    {faction.relationship} • {faction.territory.join(", ")}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
