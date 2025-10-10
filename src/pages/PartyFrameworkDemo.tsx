/**
 * Canvas 10 - Party Framework Demo
 * 
 * Comprehensive demonstration of hero + hirelings system
 * - Hire/dismiss recruits
 * - Pay wages and manage morale
 * - Process injuries and deaths
 * - Deterministic recruit pools
 */

import React, { useState, useEffect } from 'react';
import {
    type PartyMember,
    type PartyState,
    type RecruitDef,
    initParty,
    getParty,
    hire,
    dismiss,
    payPartyWages,
    adjustMemberMorale,
    processBattleResults,
    revive,
    getRecruitPool,
    getWages,
    onPartyEvent,
    resetParty,
    getAllMembers,
    getLivingMembers,
    getInjuredMembers,
    getLowMoraleMembers,
    calculateDailyUpkeep,
    getMoraleStatus,
    getMoraleEmoji,
    getInjuryStatus
} from '../party';

export default function PartyFrameworkDemo() {
    const [party, setParty] = useState<PartyState | null>(null);
    const [recruitPool, setRecruitPool] = useState<RecruitDef[]>([]);
    const [gold, setGold] = useState(1000);
    const [currentDay, setCurrentDay] = useState(1);
    const [eventLog, setEventLog] = useState<string[]>([]);
    const [selectedRecruit, setSelectedRecruit] = useState<RecruitDef | null>(null);
    const [selectedMember, setSelectedMember] = useState<PartyMember | null>(null);

    // Initialize party with hero
    useEffect(() => {
        resetParty();

        const hero: PartyMember = {
            id: 'hero_001',
            name: 'Commander Valor',
            level: 5,
            hp: 100,
            maxHp: 100,
            scars: [],
            morale: 0,
            loyalty: 100,
            gear: {
                weapon: 'longsword',
                armor: 'plate_mail',
                shield: 'tower_shield'
            },
            build: {
                race: 'human',
                classId: 'knight',
                sex: 'male',
                age: 32,
                baseStats: { STR: 18, DEX: 12, CON: 16, INT: 11, WIS: 13, CHA: 15 },
                skills: ['leadership', 'heavy_armor', 'shield_bash'],
                traits: ['brave', 'disciplined', 'inspiring']
            },
            xp: 2500,
            upkeep: 0, // Hero doesn't have upkeep
            joinedAtDay: 1
        };

        initParty(hero);
        setParty(getParty());

        // Generate initial recruit pool
        const pool = getRecruitPool('region_start', currentDay, 'demo_seed_001', 1);
        setRecruitPool(pool);

        // Setup event logging
        const unsubscribe = onPartyEvent((event) => {
            addLog(`🎭 Event: ${event.type} - ${JSON.stringify(event)}`);
        });

        return () => unsubscribe();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const addLog = (message: string) => {
        setEventLog(prev => [...prev.slice(-19), message]);
    };

    const handleHire = (recruit: RecruitDef) => {
        if (!party) return;

        const success = hire(recruit, gold, currentDay);
        if (success) {
            const totalCost = recruit.hireCost + recruit.upkeep;
            setGold(prev => prev - totalCost);
            setParty(getParty());
            setSelectedRecruit(null);
            addLog(`✅ Hired ${recruit.name} for ${totalCost} gold`);
        } else {
            addLog(`❌ Failed to hire ${recruit.name} (not enough gold or party full)`);
        }
    };

    const handleDismiss = (memberId: string) => {
        if (!party) return;

        const severance = dismiss(memberId, currentDay);
        setGold(prev => prev - severance);
        setParty(getParty());
        setSelectedMember(null);
        addLog(`👋 Dismissed member, paid ${severance} gold severance`);
    };

    const handlePayWages = (days: number) => {
        if (!party) return;

        const result = payPartyWages(days, gold);
        setGold(prev => prev - result.cost);
        setParty(getParty());
        addLog(`💰 Paid ${result.cost} gold for ${days} days (shortfall: ${result.shortfall})`);
    };

    const handleAdjustMorale = (memberId: string, delta: number, reason: string) => {
        adjustMemberMorale(memberId, delta, reason);
        setParty(getParty());
        addLog(`😊 Adjusted morale by ${delta} (${reason})`);
    };

    const handleSimulateBattle = (difficulty: number, victory: boolean) => {
        if (!party) return;

        const seed = `battle_day${currentDay}_${Date.now()}`;
        const events = processBattleResults(seed, difficulty);
        setParty(getParty());
        addLog(`⚔️ Battle ${victory ? 'won' : 'lost'}! ${events.length} casualties/injuries`);
    };

    const handleRevive = (memberId: string) => {
        const member = party?.members.find(m => m.id === memberId);
        if (!member) return;

        const success = revive(memberId, gold);
        if (success) {
            setParty(getParty());
            addLog(`💫 Revived ${member.name}`);
        } else {
            addLog(`❌ Failed to revive (not enough gold or member not dead)`);
        }
    };

    const handleAdvanceDay = () => {
        setCurrentDay(prev => prev + 1);
        // Refresh recruit pool
        const pool = getRecruitPool('region_start', currentDay + 1, 'demo_seed_001', 1);
        setRecruitPool(pool);
        addLog(`📅 Day ${currentDay + 1}`);
    };

    const handleTestDeath = (memberId: string) => {
        if (!party) return;
        const members = getAllMembers(party);
        const member = members.find(m => m.id === memberId);
        if (!member) return;

        // Simulate fatal injury
        import('../party/api').then(({ applyMemberInjury }) => {
            applyMemberInjury(memberId, 'fatal', `death_test_${Date.now()}`);
            setParty(getParty());
            addLog(`☠️ ${member.name} was fatally wounded`);
        });
    };

    if (!party) {
        return <div style={styles.loading}>Initializing party system...</div>;
    }

    const allMembers = getAllMembers(party);
    const livingMembers = getLivingMembers(party);
    const injuredMembers = getInjuredMembers(party);
    const lowMoraleMembers = getLowMoraleMembers(party);
    const dailyUpkeep = calculateDailyUpkeep(party);
    const wageStatus = getWages();

    return (
        <div style={styles.container}>
            <h1 style={styles.title}>Canvas 10 - Party Framework Demo</h1>

            {/* Status Overview */}
            <div style={styles.statusBar}>
                <div style={styles.stat}>
                    <span style={styles.statLabel}>Gold:</span>
                    <span style={styles.statValue}>{gold}g</span>
                </div>
                <div style={styles.stat}>
                    <span style={styles.statLabel}>Day:</span>
                    <span style={styles.statValue}>{currentDay}</span>
                </div>
                <div style={styles.stat}>
                    <span style={styles.statLabel}>Party Size:</span>
                    <span style={styles.statValue}>{livingMembers.length}/{party.maxSize}</span>
                </div>
                <div style={styles.stat}>
                    <span style={styles.statLabel}>Daily Upkeep:</span>
                    <span style={styles.statValue}>{dailyUpkeep}g</span>
                </div>
                <div style={styles.stat}>
                    <span style={styles.statLabel}>Wage Debt:</span>
                    <span style={styles.statValue}>{party.wageDebt}g</span>
                </div>
            </div>

            {/* Warnings */}
            {injuredMembers.length > 0 && (
                <div style={styles.warning}>
                    ⚠️ {injuredMembers.length} member(s) injured - seek healing
                </div>
            )}
            {lowMoraleMembers.length > 0 && (
                <div style={styles.warning}>
                    😠 {lowMoraleMembers.length} member(s) with low morale - risk of desertion
                </div>
            )}
            {wageStatus.daysOverdue > 0 && (
                <div style={styles.danger}>
                    💸 Wages {wageStatus.daysOverdue} days overdue! Pay {wageStatus.totalDebt}g
                </div>
            )}

            <div style={styles.panels}>
                {/* Left Panel - Party Roster */}
                <div style={styles.panel}>
                    <h2 style={styles.panelTitle}>Party Roster</h2>
                    {allMembers.map(member => (
                        <div
                            key={member.id}
                            style={{
                                ...styles.memberCard,
                                backgroundColor: selectedMember?.id === member.id ? '#3a4a5a' : '#2a3a4a'
                            }}
                            onClick={() => setSelectedMember(member)}
                        >
                            <div style={styles.memberHeader}>
                                <span style={styles.memberName}>{member.name}</span>
                                <span style={styles.memberLevel}>Lv{member.level}</span>
                            </div>
                            <div style={styles.memberInfo}>
                                <span>{member.build.race} {member.build.classId}</span>
                                <span>{getMoraleEmoji(member.morale)} {member.morale}</span>
                            </div>
                            <div style={styles.memberStats}>
                                <span>HP: {member.hp}/{member.maxHp}</span>
                                <span>Upkeep: {member.upkeep}g/day</span>
                            </div>
                            <div style={styles.memberStatus}>
                                {member.dead && <span style={styles.statusDead}>☠️ DEAD</span>}
                                {member.injured && <span style={styles.statusInjured}>🤕 INJURED</span>}
                                {member.scars.length > 0 && <span>🩹 {member.scars.length} scars</span>}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Center Panel - Actions */}
                <div style={styles.panel}>
                    <h2 style={styles.panelTitle}>Actions</h2>

                    {/* Day Management */}
                    <div style={styles.actionGroup}>
                        <h3>⏰ Time</h3>
                        <button style={styles.button} onClick={handleAdvanceDay}>
                            Advance Day
                        </button>
                        <button style={styles.button} onClick={() => handlePayWages(1)}>
                            Pay 1 Day Wages ({dailyUpkeep}g)
                        </button>
                        <button style={styles.button} onClick={() => handlePayWages(7)}>
                            Pay 7 Days Wages ({dailyUpkeep * 7}g)
                        </button>
                    </div>

                    {/* Member Actions */}
                    {selectedMember && (
                        <div style={styles.actionGroup}>
                            <h3>👤 {selectedMember.name}</h3>
                            <div style={styles.memberDetails}>
                                <p>Status: {getInjuryStatus(selectedMember)}</p>
                                <p>Morale: {getMoraleStatus(selectedMember.morale)}</p>
                                <p>Loyalty: {selectedMember.loyalty}</p>
                                <p>XP: {selectedMember.xp}</p>
                            </div>
                            <button
                                style={styles.button}
                                onClick={() => handleAdjustMorale(selectedMember.id, 10, 'leadership')}
                            >
                                +10 Morale (Leadership)
                            </button>
                            <button
                                style={styles.button}
                                onClick={() => handleAdjustMorale(selectedMember.id, -20, 'defeat')}
                            >
                                -20 Morale (Defeat)
                            </button>
                            {selectedMember.id !== party.hero.id && (
                                <>
                                    <button
                                        style={styles.buttonDanger}
                                        onClick={() => handleDismiss(selectedMember.id)}
                                    >
                                        Dismiss
                                    </button>
                                    <button
                                        style={styles.buttonDanger}
                                        onClick={() => handleTestDeath(selectedMember.id)}
                                    >
                                        Test Death
                                    </button>
                                </>
                            )}
                            {selectedMember.dead && (
                                <button
                                    style={styles.buttonSuccess}
                                    onClick={() => handleRevive(selectedMember.id)}
                                >
                                    Revive (Costs vary)
                                </button>
                            )}
                        </div>
                    )}

                    {/* Battle Simulation */}
                    <div style={styles.actionGroup}>
                        <h3>⚔️ Combat</h3>
                        <button
                            style={styles.buttonSuccess}
                            onClick={() => handleSimulateBattle(0.5, true)}
                        >
                            Easy Victory
                        </button>
                        <button
                            style={styles.button}
                            onClick={() => handleSimulateBattle(1.0, true)}
                        >
                            Normal Victory
                        </button>
                        <button
                            style={styles.buttonDanger}
                            onClick={() => handleSimulateBattle(1.5, false)}
                        >
                            Hard Defeat
                        </button>
                    </div>
                </div>

                {/* Right Panel - Tavern */}
                <div style={styles.panel}>
                    <h2 style={styles.panelTitle}>🍺 Tavern (Region Tier 1)</h2>
                    <p style={styles.tavernInfo}>
                        Available Recruits: {recruitPool.length}
                    </p>
                    {recruitPool.map(recruit => (
                        <div
                            key={recruit.id}
                            style={{
                                ...styles.recruitCard,
                                backgroundColor: selectedRecruit?.id === recruit.id ? '#3a4a3a' : '#2a3a2a'
                            }}
                            onClick={() => setSelectedRecruit(recruit)}
                        >
                            <div style={styles.recruitHeader}>
                                <span style={styles.recruitName}>{recruit.name}</span>
                                <span style={styles.recruitLevel}>Lv{recruit.level}</span>
                            </div>
                            <div style={styles.recruitInfo}>
                                <span>{recruit.race} {recruit.classId}</span>
                                {recruit.locked && <span style={styles.locked}>🔒 LOCKED</span>}
                            </div>
                            <div style={styles.recruitCost}>
                                <span>Hire: {recruit.hireCost}g</span>
                                <span>Upkeep: {recruit.upkeep}g/day</span>
                            </div>
                            {selectedRecruit?.id === recruit.id && (
                                <div style={styles.recruitDetails}>
                                    <p>STR {recruit.baseStats.STR} | DEX {recruit.baseStats.DEX} | CON {recruit.baseStats.CON}</p>
                                    <p>INT {recruit.baseStats.INT} | WIS {recruit.baseStats.WIS} | CHA {recruit.baseStats.CHA}</p>
                                    <p>Skills: {recruit.skills.join(', ')}</p>
                                    <p>Traits: {recruit.traits.join(', ')}</p>
                                    <button
                                        style={styles.buttonSuccess}
                                        onClick={() => handleHire(recruit)}
                                        disabled={gold < (recruit.hireCost + recruit.upkeep) || livingMembers.length >= party.maxSize}
                                    >
                                        Hire for {recruit.hireCost + recruit.upkeep}g
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Event Log */}
            <div style={styles.eventLog}>
                <h3 style={styles.logTitle}>Event Log</h3>
                {eventLog.map((log, i) => (
                    <div key={i} style={styles.logEntry}>{log}</div>
                ))}
            </div>
        </div>
    );
}

const styles = {
    container: {
        padding: '20px',
        backgroundColor: '#1a1a2a',
        color: '#e0e0e0',
        minHeight: '100vh',
        fontFamily: 'monospace'
    },
    loading: {
        padding: '40px',
        textAlign: 'center' as const,
        fontSize: '18px'
    },
    title: {
        color: '#4a9eff',
        marginBottom: '20px',
        textAlign: 'center' as const
    },
    statusBar: {
        display: 'flex',
        gap: '20px',
        padding: '15px',
        backgroundColor: '#2a2a3a',
        borderRadius: '8px',
        marginBottom: '20px',
        flexWrap: 'wrap' as const
    },
    stat: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '5px'
    },
    statLabel: {
        fontSize: '12px',
        color: '#a0a0a0'
    },
    statValue: {
        fontSize: '18px',
        fontWeight: 'bold' as const,
        color: '#4a9eff'
    },
    warning: {
        padding: '10px',
        backgroundColor: '#4a3a1a',
        border: '1px solid #8a6a2a',
        borderRadius: '4px',
        marginBottom: '10px'
    },
    danger: {
        padding: '10px',
        backgroundColor: '#4a1a1a',
        border: '1px solid #8a2a2a',
        borderRadius: '4px',
        marginBottom: '10px'
    },
    panels: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '20px',
        marginBottom: '20px'
    },
    panel: {
        backgroundColor: '#2a2a3a',
        borderRadius: '8px',
        padding: '15px',
        maxHeight: '600px',
        overflowY: 'auto' as const
    },
    panelTitle: {
        color: '#4a9eff',
        marginBottom: '15px',
        fontSize: '18px',
        borderBottom: '1px solid #3a4a5a',
        paddingBottom: '10px'
    },
    memberCard: {
        padding: '10px',
        marginBottom: '10px',
        borderRadius: '6px',
        cursor: 'pointer',
        transition: 'background-color 0.2s'
    },
    memberHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '5px'
    },
    memberName: {
        fontWeight: 'bold' as const,
        color: '#e0e0e0'
    },
    memberLevel: {
        color: '#ffa500'
    },
    memberInfo: {
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '12px',
        color: '#a0a0a0',
        marginBottom: '5px'
    },
    memberStats: {
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '11px',
        color: '#8a8a9a'
    },
    memberStatus: {
        marginTop: '5px',
        display: 'flex',
        gap: '10px',
        fontSize: '11px'
    },
    statusDead: {
        color: '#ff4444',
        fontWeight: 'bold' as const
    },
    statusInjured: {
        color: '#ffaa44'
    },
    actionGroup: {
        marginBottom: '20px',
        paddingBottom: '15px',
        borderBottom: '1px solid #3a4a5a'
    },
    memberDetails: {
        fontSize: '12px',
        color: '#a0a0a0',
        marginBottom: '10px',
        padding: '10px',
        backgroundColor: '#1a2a3a',
        borderRadius: '4px'
    },
    button: {
        width: '100%',
        padding: '8px',
        marginBottom: '5px',
        backgroundColor: '#3a4a5a',
        color: '#e0e0e0',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '12px'
    },
    buttonSuccess: {
        width: '100%',
        padding: '8px',
        marginBottom: '5px',
        backgroundColor: '#2a5a3a',
        color: '#e0e0e0',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '12px'
    },
    buttonDanger: {
        width: '100%',
        padding: '8px',
        marginBottom: '5px',
        backgroundColor: '#5a2a2a',
        color: '#e0e0e0',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '12px'
    },
    tavernInfo: {
        fontSize: '12px',
        color: '#a0a0a0',
        marginBottom: '15px'
    },
    recruitCard: {
        padding: '10px',
        marginBottom: '10px',
        borderRadius: '6px',
        cursor: 'pointer',
        transition: 'background-color 0.2s'
    },
    recruitHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '5px'
    },
    recruitName: {
        fontWeight: 'bold' as const,
        color: '#90ff90'
    },
    recruitLevel: {
        color: '#ffa500'
    },
    recruitInfo: {
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '12px',
        color: '#a0a0a0',
        marginBottom: '5px'
    },
    locked: {
        color: '#ff8888',
        fontSize: '11px'
    },
    recruitCost: {
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '11px',
        color: '#8a8a9a'
    },
    recruitDetails: {
        marginTop: '10px',
        padding: '10px',
        backgroundColor: '#1a2a1a',
        borderRadius: '4px',
        fontSize: '11px',
        color: '#c0c0c0'
    },
    eventLog: {
        backgroundColor: '#2a2a3a',
        borderRadius: '8px',
        padding: '15px',
        maxHeight: '200px',
        overflowY: 'auto' as const
    },
    logTitle: {
        color: '#4a9eff',
        marginBottom: '10px',
        fontSize: '16px'
    },
    logEntry: {
        fontSize: '11px',
        padding: '3px 0',
        borderBottom: '1px solid #3a3a4a',
        color: '#c0c0c0'
    }
};
