// ──────────────────────────────────────────────────────────────────────────────
// File: src/features/world/encounters/EncountersTestPage.tsx
// Purpose: Quick test page for encounters system
// ──────────────────────────────────────────────────────────────────────────────

import React, { useState, useMemo } from 'react';
import { generateEncounter, mapBiomeToEncounterBiome, getEncounterDensity } from './';
import type { EncounterBiome, Encounter, RegionOwner } from './types';

const TEST_BIOMES: EncounterBiome[] = [
    'Grass', 'Forest', 'Desert', 'Swamp',
    'Taiga', 'Snow', 'Settlement', 'Mountain', 'Ocean'
];

const EncountersTestPage: React.FC = () => {
    const [seed, setSeed] = useState<number>(12345);
    const [biome, setBiome] = useState<EncounterBiome>('Grass');
    const [partyLevel, setPartyLevel] = useState<number>(1);
    const [regionTier, setRegionTier] = useState<number>(1);
    const [regionControl, setRegionControl] = useState<number>(50);
    const [conflictLevel, setConflictLevel] = useState<number>(30);
    const [sectorX, setSectorX] = useState<number>(0);
    const [sectorY, setSectorY] = useState<number>(0);

    // Generate test encounter
    const testEncounter = useMemo(() => {
        const regionOwner: RegionOwner = {
            id: 'test-region',
            factionName: 'Iron Legion',
            tier: regionTier,
            control: regionControl / 100,
            conflictLevel: conflictLevel / 100,
        };

        return generateEncounter(
            seed,
            biome,
            regionOwner,
            partyLevel,
            { q: 5, r: 5, sectorX, sectorY }
        );
    }, [seed, biome, partyLevel, regionTier, regionControl, conflictLevel, sectorX, sectorY]);

    // Generate multiple encounters for comparison
    const [generatedEncounters, setGeneratedEncounters] = useState<Encounter[]>([]);

    const generateMultiple = () => {
        const regionOwner: RegionOwner = {
            id: 'test-region',
            factionName: 'Iron Legion',
            tier: regionTier,
            control: regionControl / 100,
            conflictLevel: conflictLevel / 100,
        };

        const encounters: Encounter[] = [];
        for (let i = 0; i < 10; i++) {
            const enc = generateEncounter(
                seed,
                biome,
                regionOwner,
                partyLevel,
                { q: i, r: i, sectorX, sectorY }
            );
            encounters.push(enc);
        }
        setGeneratedEncounters(encounters);
    };

    const density = getEncounterDensity(conflictLevel / 100);

    return (
        <div style={{
            padding: '20px',
            maxWidth: '1200px',
            margin: '0 auto',
            backgroundColor: '#1a1a1a',
            color: '#e0e0e0',
            minHeight: '100vh'
        }}>
            <h1 style={{ color: '#4a9eff', marginBottom: '10px' }}>🗡️ Encounters System Test</h1>
            <p style={{ color: '#888', marginBottom: '30px' }}>
                Test the encounters generation system with different parameters
            </p>

            {/* Controls */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '20px',
                marginBottom: '30px',
                backgroundColor: '#2a2a2a',
                padding: '20px',
                borderRadius: '8px',
            }}>
                <div>
                    <label style={{ display: 'block', marginBottom: '5px', color: '#aaa' }}>
                        Seed
                    </label>
                    <input
                        type="number"
                        value={seed}
                        onChange={(e) => setSeed(Number(e.target.value))}
                        style={{
                            width: '100%',
                            padding: '8px',
                            backgroundColor: '#333',
                            border: '1px solid #555',
                            borderRadius: '4px',
                            color: '#fff',
                        }}
                    />
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '5px', color: '#aaa' }}>
                        Biome
                    </label>
                    <select
                        value={biome}
                        onChange={(e) => setBiome(e.target.value as EncounterBiome)}
                        style={{
                            width: '100%',
                            padding: '8px',
                            backgroundColor: '#333',
                            border: '1px solid #555',
                            borderRadius: '4px',
                            color: '#fff',
                        }}
                    >
                        {TEST_BIOMES.map(b => (
                            <option key={b} value={b}>{b}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '5px', color: '#aaa' }}>
                        Party Level: {partyLevel}
                    </label>
                    <input
                        type="range"
                        min="1"
                        max="20"
                        value={partyLevel}
                        onChange={(e) => setPartyLevel(Number(e.target.value))}
                        style={{ width: '100%' }}
                    />
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '5px', color: '#aaa' }}>
                        Region Tier: {regionTier}
                    </label>
                    <input
                        type="range"
                        min="1"
                        max="5"
                        value={regionTier}
                        onChange={(e) => setRegionTier(Number(e.target.value))}
                        style={{ width: '100%' }}
                    />
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '5px', color: '#aaa' }}>
                        Region Control: {regionControl}%
                    </label>
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={regionControl}
                        onChange={(e) => setRegionControl(Number(e.target.value))}
                        style={{ width: '100%' }}
                    />
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '5px', color: '#aaa' }}>
                        Conflict Level: {conflictLevel}% ({density})
                    </label>
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={conflictLevel}
                        onChange={(e) => setConflictLevel(Number(e.target.value))}
                        style={{ width: '100%' }}
                    />
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '5px', color: '#aaa' }}>
                        Sector X
                    </label>
                    <input
                        type="number"
                        value={sectorX}
                        onChange={(e) => setSectorX(Number(e.target.value))}
                        style={{
                            width: '100%',
                            padding: '8px',
                            backgroundColor: '#333',
                            border: '1px solid #555',
                            borderRadius: '4px',
                            color: '#fff',
                        }}
                    />
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '5px', color: '#aaa' }}>
                        Sector Y
                    </label>
                    <input
                        type="number"
                        value={sectorY}
                        onChange={(e) => setSectorY(Number(e.target.value))}
                        style={{
                            width: '100%',
                            padding: '8px',
                            backgroundColor: '#333',
                            border: '1px solid #555',
                            borderRadius: '4px',
                            color: '#fff',
                        }}
                    />
                </div>
            </div>

            {/* Current Encounter Display */}
            <div style={{
                backgroundColor: '#2a2a2a',
                padding: '20px',
                borderRadius: '8px',
                marginBottom: '20px',
                border: '2px solid #4a9eff',
            }}>
                <h2 style={{ color: '#4a9eff', marginTop: 0 }}>📍 Test Encounter</h2>
                <EncounterCard encounter={testEncounter} />
            </div>

            {/* Generate Multiple Button */}
            <button
                onClick={generateMultiple}
                style={{
                    padding: '12px 24px',
                    backgroundColor: '#4a9eff',
                    border: 'none',
                    borderRadius: '4px',
                    color: '#fff',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    marginBottom: '20px',
                    fontSize: '16px',
                }}
            >
                🎲 Generate 10 Random Encounters
            </button>

            {/* Multiple Encounters Display */}
            {generatedEncounters.length > 0 && (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                    gap: '15px',
                }}>
                    {generatedEncounters.map((enc, idx) => (
                        <div
                            key={enc.id}
                            style={{
                                backgroundColor: '#2a2a2a',
                                padding: '15px',
                                borderRadius: '8px',
                                border: '1px solid #444',
                            }}
                        >
                            <h3 style={{
                                color: '#4a9eff',
                                marginTop: 0,
                                fontSize: '14px',
                            }}>
                                Encounter #{idx + 1}
                            </h3>
                            <EncounterCard encounter={enc} compact />
                        </div>
                    ))}
                </div>
            )}

            {/* Info Section */}
            <div style={{
                marginTop: '30px',
                backgroundColor: '#2a2a2a',
                padding: '20px',
                borderRadius: '8px',
            }}>
                <h2 style={{ color: '#4a9eff' }}>ℹ️ System Info</h2>
                <ul style={{ color: '#aaa', lineHeight: '1.8' }}>
                    <li><strong>Spawn Chance ({density}):</strong> {
                        conflictLevel > 70 ? '25%'
                            : conflictLevel > 30 ? '10%'
                                : '3%'
                    }</li>
                    <li><strong>Difficulty Formula:</strong> baseDiff + (tier-1) + (partyLevel-1) × 0.25</li>
                    <li><strong>XP Formula:</strong> baseXP × (1 + (tier-1) × 0.2) × (1 + control × 0.1)</li>
                    <li><strong>Deterministic:</strong> Same seed + position = same encounter</li>
                </ul>
            </div>
        </div>
    );
};

// Encounter Card Component
interface EncounterCardProps {
    encounter: Encounter;
    compact?: boolean;
}

const EncounterCard: React.FC<EncounterCardProps> = ({ encounter, compact }) => {
    const getTypeEmoji = (type: string) => {
        const emojis: Record<string, string> = {
            RAID_PARTY: '⚔️',
            SCOUT_PATROL: '🔍',
            WANDERER: '🚶',
            MONSTER: '👹',
            BANDIT: '🏴‍☠️',
            MERCHANT: '💰',
            QUEST_GIVER: '📜',
            TREASURE: '💎',
            AMBUSH: '🗡️',
        };
        return emojis[type] || '❓';
    };

    const getDifficultyColor = (diff: number) => {
        if (diff <= 3) return '#4ade80'; // Green
        if (diff <= 5) return '#fbbf24'; // Yellow
        if (diff <= 7) return '#fb923c'; // Orange
        return '#ef4444'; // Red
    };

    return (
        <div style={{ fontSize: compact ? '13px' : '16px' }}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                marginBottom: compact ? '8px' : '12px',
            }}>
                <span style={{ fontSize: compact ? '24px' : '32px' }}>
                    {getTypeEmoji(encounter.type)}
                </span>
                <div>
                    <div style={{ fontWeight: 'bold', color: '#fff' }}>
                        {encounter.type.replace('_', ' ')}
                    </div>
                    <div style={{ fontSize: compact ? '11px' : '13px', color: '#888' }}>
                        {encounter.biome} · {encounter.faction}
                    </div>
                </div>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '10px',
                color: '#ccc',
            }}>
                <div>
                    <span style={{ color: '#888' }}>Difficulty:</span>{' '}
                    <span style={{
                        color: getDifficultyColor(encounter.difficulty),
                        fontWeight: 'bold',
                    }}>
                        {encounter.difficulty}
                    </span>
                </div>
                <div>
                    <span style={{ color: '#888' }}>XP:</span>{' '}
                    <span style={{ color: '#4ade80', fontWeight: 'bold' }}>
                        {encounter.xp}
                    </span>
                </div>
                {!compact && (
                    <>
                        <div style={{ gridColumn: '1 / -1', fontSize: '12px', color: '#888' }}>
                            Position: ({encounter.position.q}, {encounter.position.r}) in sector ({encounter.position.sectorX}, {encounter.position.sectorY})
                        </div>
                        <div style={{ gridColumn: '1 / -1', fontSize: '11px', color: '#666' }}>
                            ID: {encounter.id}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default EncountersTestPage;
