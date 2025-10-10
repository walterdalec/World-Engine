/**
 * Canvas 09 - Faction AI Demo
 * 
 * Interactive demonstration of autonomous faction AI
 * Shows goal generation, planning, and deterministic execution
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
    aiInit,
    aiRegisterFaction,
    aiRegisterArmy,
    aiGetState,
    aiReset,
    aiGetEvents,
    createFaction,
    createArmy,
    type Faction,
    type Army,
    type ExecutionEvent
} from '../factions';
import { TimeControls, getSimClock } from '../core/time';

export function FactionAIDemo() {
    const [factions, setFactions] = useState<Faction[]>([]);
    const [armies, setArmies] = useState<Army[]>([]);
    const [events, setEvents] = useState<ExecutionEvent[]>([]);
    const [selectedFaction, setSelectedFaction] = useState<string | null>(null);
    const [isInitialized, setIsInitialized] = useState(false);

    // Initialize AI system
    const initializeAI = useCallback(() => {
        aiReset();
        aiInit({
            planningWindowHours: 2,
            searchMsPerFrame: 3,
            maxSearchDepth: 3
        });

        // Create test factions
        const dominion = createFaction('dominion', 'Dominion Empire', 'dominion');
        const marches = createFaction('marches', 'Border Marches', 'marches');
        const obsidian = createFaction('obsidian', 'Obsidian League', 'obsidian');

        aiRegisterFaction(dominion);
        aiRegisterFaction(marches);
        aiRegisterFaction(obsidian);

        // Create armies for each faction
        const army1 = createArmy('army_dom_1', 'First Legion', 'dominion', { x: 1000, y: 1000 });
        const army2 = createArmy('army_dom_2', 'Second Legion', 'dominion', { x: 1100, y: 1000 });
        const army3 = createArmy('army_mar_1', 'Watchers', 'marches', { x: 1200, y: 1200 });
        const army4 = createArmy('army_obs_1', 'Trading Company', 'obsidian', { x: 900, y: 900 });

        aiRegisterArmy(army1);
        aiRegisterArmy(army2);
        aiRegisterArmy(army3);
        aiRegisterArmy(army4);

        setFactions([dominion, marches, obsidian]);
        setArmies([army1, army2, army3, army4]);
        setSelectedFaction('dominion');
        setIsInitialized(true);

        console.log('🏛️ Faction AI Demo initialized with 3 factions and 4 armies');
    }, []);

    // Update state from AI system
    useEffect(() => {
        if (!isInitialized) return;

        const interval = setInterval(() => {
            const aiState = aiGetState();
            setFactions(Object.values(aiState.factions));
            setArmies(Object.values(aiState.armies));

            if (selectedFaction) {
                const factionEvents = aiGetEvents(selectedFaction, 20);
                setEvents(factionEvents);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [isInitialized, selectedFaction]);

    // Drive the simulation clock with requestAnimationFrame
    useEffect(() => {
        if (!isInitialized) return;

        const clock = getSimClock();
        let animationFrameId: number;

        const tick = (timestamp: number) => {
            clock.update(timestamp);
            animationFrameId = requestAnimationFrame(tick);
        };

        animationFrameId = requestAnimationFrame(tick);

        return () => {
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }
        };
    }, [isInitialized]);

    if (!isInitialized) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-4xl font-bold text-white mb-4">
                        🏛️ Faction AI System (Canvas 09)
                    </h1>
                    <p className="text-slate-300 mb-8">
                        Autonomous factions with utility-based goal generation, GOAP-lite planning,
                        and deterministic execution integrated with Canvas 08 time system.
                    </p>

                    <button
                        onClick={initializeAI}
                        className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg
                     hover:from-purple-700 hover:to-indigo-700 transition-all duration-200
                     shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                        Initialize AI System
                    </button>

                    <div className="mt-8 bg-slate-800 rounded-lg p-6 border border-slate-700">
                        <h3 className="text-xl font-bold text-white mb-4">Features</h3>
                        <ul className="space-y-2 text-slate-300">
                            <li>✅ <strong>7 Goal Types:</strong> Secure, Expand, Exploit, Punish, Escort, Stabilize, Diplomacy</li>
                            <li>✅ <strong>Utility-Based Planning:</strong> Goals scored by value, pressure, ethos, economy, risk, cost</li>
                            <li>✅ <strong>GOAP-lite Planner:</strong> Action simulation with value-per-day optimization</li>
                            <li>✅ <strong>9 Order Types:</strong> Move, Patrol, Siege, Raid, Garrison, Escort, BuildFort, Trade, Negotiate</li>
                            <li>✅ <strong>Deterministic Execution:</strong> Planning seeds ensure replay parity</li>
                            <li>✅ <strong>Canvas 08 Integration:</strong> Pause policy ('pause') stops AI during pause</li>
                            <li>✅ <strong>Planning Windows:</strong> AI replans every 2 in-game hours</li>
                        </ul>
                    </div>
                </div>
            </div>
        );
    }

    const selectedFactionData = factions.find(f => f.id === selectedFaction);
    const factionArmies = armies.filter(a => a.factionId === selectedFaction);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-4xl font-bold text-white">
                        🏛️ Faction AI System (Canvas 09)
                    </h1>
                    <TimeControls
                        position="top-right"
                        showSpeedControls
                        showPauseButton
                    />
                </div>

                {/* Faction Selection */}
                <div className="grid grid-cols-3 gap-4 mb-8">
                    {factions.map(faction => (
                        <button
                            key={faction.id}
                            onClick={() => setSelectedFaction(faction.id)}
                            className={`p-6 rounded-lg border-2 transition-all duration-200 ${selectedFaction === faction.id
                                ? 'bg-gradient-to-br from-purple-900 to-indigo-900 border-purple-500'
                                : 'bg-slate-800 border-slate-700 hover:border-slate-600'
                                }`}
                        >
                            <h3 className="text-xl font-bold text-white mb-2">{faction.name}</h3>
                            <p className="text-sm text-slate-400 capitalize mb-4">Ethos: {faction.ethos}</p>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="text-slate-300">
                                    💰 Treasury: <span className="text-yellow-400">{faction.treasury}</span>
                                </div>
                                <div className="text-slate-300">
                                    👥 Manpower: <span className="text-blue-400">{faction.manpower}</span>
                                </div>
                                <div className="text-slate-300">
                                    🏛️ Regions: <span className="text-green-400">{faction.regionIds.length}/{faction.caps.regions}</span>
                                </div>
                                <div className="text-slate-300">
                                    ⚔️ Armies: <span className="text-red-400">{faction.armyIds.length}/{faction.caps.armies}</span>
                                </div>
                            </div>
                            <div className="mt-3 text-xs text-slate-400 capitalize">
                                Stance: <span className={
                                    faction.stance === 'war' ? 'text-red-400' :
                                        faction.stance === 'tense' ? 'text-yellow-400' :
                                            'text-green-400'
                                }>{faction.stance}</span>
                            </div>
                        </button>
                    ))}
                </div>

                {/* Faction Details */}
                {selectedFactionData && (
                    <div className="grid grid-cols-2 gap-8">
                        {/* Armies */}
                        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
                            <h3 className="text-2xl font-bold text-white mb-4">⚔️ Armies</h3>
                            <div className="space-y-4">
                                {factionArmies.map(army => (
                                    <div key={army.id} className="bg-slate-900 rounded-lg p-4 border border-slate-700">
                                        <div className="flex items-center justify-between mb-2">
                                            <h4 className="text-lg font-bold text-white">{army.name}</h4>
                                            <span className={`px-2 py-1 rounded text-xs ${army.orders ? 'bg-yellow-900 text-yellow-300' : 'bg-green-900 text-green-300'
                                                }`}>
                                                {army.orders ? `Executing: ${army.orders.kind}` : 'Idle'}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2 text-sm text-slate-300 mb-2">
                                            <div>AP: {Math.round(army.ap)}/{army.maxAp}</div>
                                            <div>Supply: {Math.round(army.supply)}/100</div>
                                            <div>Morale: {Math.round(army.morale)}/100</div>
                                            <div>Pos: ({Math.round(army.pos.x)}, {Math.round(army.pos.y)})</div>
                                        </div>

                                        <div className="text-xs text-slate-400">
                                            {army.composition.map(unit => (
                                                <span key={unit.type} className="mr-3">
                                                    {unit.count}× {unit.type}
                                                </span>
                                            ))}
                                        </div>

                                        {army.executionState && (
                                            <div className="mt-2 text-xs text-purple-400">
                                                Waypoint: {army.executionState.currentWaypoint} |
                                                Days left: {Math.round(army.executionState.daysRemaining * 10) / 10}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Event Log */}
                        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
                            <h3 className="text-2xl font-bold text-white mb-4">📜 Event Log</h3>
                            <div className="space-y-2 max-h-[600px] overflow-y-auto">
                                {events.length === 0 ? (
                                    <p className="text-slate-400 text-sm">No events yet. AI will plan at next planning window (every 2 hours).</p>
                                ) : (
                                    events.slice().reverse().map((event, idx) => (
                                        <div key={idx} className="bg-slate-900 rounded p-3 border border-slate-700">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className={`px-2 py-1 rounded text-xs font-bold ${event.eventType === 'goal_generated' ? 'bg-blue-900 text-blue-300' :
                                                    event.eventType === 'plan_created' ? 'bg-purple-900 text-purple-300' :
                                                        event.eventType === 'order_issued' ? 'bg-yellow-900 text-yellow-300' :
                                                            event.eventType === 'order_completed' ? 'bg-green-900 text-green-300' :
                                                                'bg-slate-700 text-slate-300'
                                                    }`}>
                                                    {event.eventType.replace('_', ' ')}
                                                </span>
                                                <span className="text-xs text-slate-500">
                                                    {new Date(event.timestamp * 1000).toLocaleTimeString()}
                                                </span>
                                            </div>

                                            {event.armyId && (
                                                <div className="text-xs text-slate-400 mb-1">
                                                    Army: {event.armyId}
                                                </div>
                                            )}

                                            <div className="text-sm text-slate-300">
                                                {JSON.stringify(event.payload, null, 2)}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Doctrines */}
                {selectedFactionData && (
                    <div className="mt-8 bg-slate-800 rounded-lg p-6 border border-slate-700">
                        <h3 className="text-2xl font-bold text-white mb-4">📋 Doctrines & AI Behavior</h3>
                        <div className="grid grid-cols-4 gap-4">
                            {Object.entries(selectedFactionData.doctrines).map(([key, value]) => (
                                <div
                                    key={key}
                                    className={`p-3 rounded-lg border ${value
                                        ? 'bg-green-900 border-green-700 text-green-300'
                                        : 'bg-slate-900 border-slate-700 text-slate-500'
                                        }`}
                                >
                                    <div className="text-xs font-bold">
                                        {key.replace(/([A-Z])/g, ' $1').trim()}
                                    </div>
                                    <div className="text-lg">{value ? '✓' : '✗'}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Instructions */}
                <div className="mt-8 bg-slate-800 rounded-lg p-6 border border-slate-700">
                    <h3 className="text-xl font-bold text-white mb-4">🎮 Controls</h3>
                    <div className="grid grid-cols-2 gap-6 text-slate-300">
                        <div>
                            <h4 className="font-bold text-white mb-2">Time Controls:</h4>
                            <ul className="space-y-1 text-sm">
                                <li><kbd className="px-2 py-1 bg-slate-700 rounded">Space</kbd> - Pause/Resume</li>
                                <li><kbd className="px-2 py-1 bg-slate-700 rounded">0-4</kbd> - Set sim speed</li>
                                <li><kbd className="px-2 py-1 bg-slate-700 rounded">Esc</kbd> - Auto-pause</li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-bold text-white mb-2">AI Behavior:</h4>
                            <ul className="space-y-1 text-sm">
                                <li>🏛️ AI plans every 2 in-game hours</li>
                                <li>⏸️ AI stops during pause (idlePolicy: 'pause')</li>
                                <li>🎲 Deterministic planning seeds ensure reproducibility</li>
                                <li>⚔️ Orders execute in real-time with Canvas 08 fixed timestep</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
