/**
 * Campaign → Battle Bridge
 * 
 * Connects IntegratedCampaign encounters to Canvas 14 tactical battles
 * Handles the flow: Campaign → Encounter → Battle → Results → Campaign
 */

import React, { useState } from 'react';

interface CampaignBattleBridgeProps {
    // Campaign state
    partyPosition: { x: number; y: number };
    partyLevel: number;
    encounterType: 'Bandits' | 'Monsters' | 'Undead' | 'Beasts' | string;
    campaignSeed: string;

    // Callbacks
    onBattleComplete: (_won: boolean, _xp: number, _gold: number) => void;
    onBattleCancel: () => void;
}

export function CampaignBattleBridge({
    partyPosition,
    partyLevel,
    encounterType,
    onBattleComplete,
    onBattleCancel
}: CampaignBattleBridgeProps) {
    const [battleTurn, setBattleTurn] = useState(1);
    const [playerHP, setPlayerHP] = useState(100);
    const [enemyHP, setEnemyHP] = useState(100);

    // Simulate combat turn
    const handleCombatTurn = () => {
        // Simple combat simulation
        const playerDamage = Math.floor(Math.random() * 20) + 10;
        const enemyDamage = Math.floor(Math.random() * 15) + 5;
        
        setEnemyHP(prev => Math.max(0, prev - playerDamage));
        setPlayerHP(prev => Math.max(0, prev - enemyDamage));
        setBattleTurn(t => t + 1);
        
        console.log(`⚔️ Turn ${battleTurn}: Player dealt ${playerDamage}, Enemy dealt ${enemyDamage}`);
    };

    // Auto-resolve if HP reaches 0
    React.useEffect(() => {
        if (enemyHP <= 0 && playerHP > 0) {
            setTimeout(handleVictory, 1000);
        } else if (playerHP <= 0) {
            setTimeout(handleDefeat, 1000);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [playerHP, enemyHP]);

    // Handle battle victory
    const handleVictory = () => {
        const xp = 100 * partyLevel;
        const gold = 50 * partyLevel;
        console.log('🎊 Victory! XP:', xp, 'Gold:', gold);
        onBattleComplete(true, xp, gold);
    };

    // Handle battle defeat
    const handleDefeat = () => {
        console.log('💀 Defeat!');
        onBattleComplete(false, 0, 0);
    };

    // TODO: Replace with actual battle UI component from Canvas 14
    return (
        <div style={{
            padding: '20px',
            background: '#1a1a2e',
            color: '#fff',
            minHeight: '600px'
        }}>
            <div style={{
                background: '#16213e',
                padding: '20px',
                borderRadius: '8px',
                marginBottom: '20px'
            }}>
                <h2>⚔️ Tactical Battle: {encounterType}</h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px', fontSize: '14px' }}>
                    <div>Position: ({partyPosition.x}, {partyPosition.y})</div>
                    <div>Turn: {battleTurn}</div>
                    <div>Party Level: {partyLevel}</div>
                    <div>Terrain: {determineBiomeFromType(encounterType)}</div>
                </div>
            </div>

            <div style={{
                background: '#0f3460',
                padding: '40px',
                borderRadius: '8px',
                textAlign: 'center',
                marginBottom: '20px'
            }}>
                {/* Combat Simulation */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 1fr', gap: '20px', alignItems: 'center', marginBottom: '30px' }}>
                    {/* Player Side */}
                    <div>
                        <div style={{ fontSize: '48px', marginBottom: '10px' }}>🛡️</div>
                        <h3 style={{ marginBottom: '10px' }}>Your Party</h3>
                        <div style={{ background: '#16213e', padding: '10px', borderRadius: '4px' }}>
                            <div style={{ marginBottom: '5px', fontSize: '14px' }}>HP: {playerHP}/100</div>
                            <div style={{ width: '100%', background: '#1a1a2e', borderRadius: '4px', height: '20px', overflow: 'hidden' }}>
                                <div style={{
                                    width: `${playerHP}%`,
                                    height: '100%',
                                    background: playerHP > 50 ? '#2ecc71' : playerHP > 25 ? '#f39c12' : '#e74c3c',
                                    transition: 'width 0.3s'
                                }} />
                            </div>
                        </div>
                    </div>

                    {/* VS */}
                    <div style={{ fontSize: '32px', fontWeight: 'bold' }}>⚔️</div>

                    {/* Enemy Side */}
                    <div>
                        <div style={{ fontSize: '48px', marginBottom: '10px' }}>{getEnemyIcon(encounterType)}</div>
                        <h3 style={{ marginBottom: '10px' }}>{encounterType}</h3>
                        <div style={{ background: '#16213e', padding: '10px', borderRadius: '4px' }}>
                            <div style={{ marginBottom: '5px', fontSize: '14px' }}>HP: {enemyHP}/100</div>
                            <div style={{ width: '100%', background: '#1a1a2e', borderRadius: '4px', height: '20px', overflow: 'hidden' }}>
                                <div style={{
                                    width: `${enemyHP}%`,
                                    height: '100%',
                                    background: enemyHP > 50 ? '#e74c3c' : enemyHP > 25 ? '#c0392b' : '#7f1d1d',
                                    transition: 'width 0.3s'
                                }} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Combat Action Button */}
                <button
                    onClick={handleCombatTurn}
                    disabled={playerHP <= 0 || enemyHP <= 0}
                    style={{
                        padding: '12px 32px',
                        background: (playerHP <= 0 || enemyHP <= 0) ? '#666' : '#3498db',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: (playerHP <= 0 || enemyHP <= 0) ? 'not-allowed' : 'pointer',
                        fontSize: '16px',
                        fontWeight: 'bold'
                    }}
                >
                    {playerHP <= 0 || enemyHP <= 0 ? '⏱️ Battle Ending...' : '⚔️ Attack!'}
                </button>
            </div>

            {/* Temporary controls for testing the flow */}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                <button
                    onClick={handleVictory}
                    style={{
                        padding: '12px 24px',
                        background: '#2ecc71',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '16px',
                        fontWeight: 'bold'
                    }}
                >
                    🎊 Win Battle (Test)
                </button>
                <button
                    onClick={handleDefeat}
                    style={{
                        padding: '12px 24px',
                        background: '#e74c3c',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '16px',
                        fontWeight: 'bold'
                    }}
                >
                    💀 Lose Battle (Test)
                </button>
                <button
                    onClick={onBattleCancel}
                    style={{
                        padding: '12px 24px',
                        background: '#95a5a6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '16px'
                    }}
                >
                    ↩️ Flee
                </button>
            </div>
        </div>
    );
}

// Helper functions
function determineBiomeFromType(encounterType: string): string {
    const biomeMap: Record<string, string> = {
        'Bandits': 'forest',
        'Monsters': 'swamp',
        'Undead': 'graveyard',
        'Beasts': 'grassland'
    };
    return biomeMap[encounterType] || 'grassland';
}

function getEnemyIcon(encounterType: string): string {
    const iconMap: Record<string, string> = {
        'Bandits': '🗡️',
        'Monsters': '👹',
        'Undead': '💀',
        'Beasts': '🐺'
    };
    return iconMap[encounterType] || '⚔️';
}
