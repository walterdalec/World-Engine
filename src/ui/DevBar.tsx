/**
 * DevBar - Development Tools Bar
 * Canvas 02 - Quick access to save/load with keyboard shortcuts
 * Canvas 03 - Added pack loading controls
 * Canvas 04 - Added world generation controls
 */

import React, { useEffect, useState, useCallback } from 'react';
import { EventBus } from '../engine/types';

interface DevBarProps {
    events: EventBus;
}

export function DevBar({ events }: DevBarProps) {
    const [visible, setVisible] = useState(false);
    const [day, setDay] = useState(0);
    const [lastSave, setLastSave] = useState<string>('');
    const [packStats, setPackStats] = useState({ total: 0, biomes: 0, units: 0, items: 0, spells: 0, factions: 0 });
    const [worldStats, setWorldStats] = useState<{ chunks: number; tiles: number } | null>(null);

    // Refresh pack stats
    const refreshPackStats = useCallback(async () => {
        try {
            const stats = await events.request<void, typeof packStats>('packs/stats');
            setPackStats(stats);
        } catch {
            // PacksModule not loaded yet
        }
    }, [events]);

    // Load a sample pack (for testing)
    const loadSamplePack = useCallback(async () => {
        try {
            // Sample unit pack for testing
            const samplePack = {
                manifest: {
                    id: 'sample-pack',
                    name: 'Sample Content Pack',
                    version: '1.0.0',
                    author: 'World Engine',
                    description: 'Test content pack',
                    dependencies: []
                },
                units: [
                    {
                        id: 'knight',
                        name: 'Knight',
                        role: 'melee',
                        stats: { hp: 100, atk: 15, def: 10, mag: 0, res: 5, spd: 5, move: 4, range: 1 },
                        abilities: ['slash', 'shield-bash'],
                        traits: ['armored'],
                        cost: { gold: 100, recruits: 1 }
                    },
                    {
                        id: 'archer',
                        name: 'Archer',
                        role: 'ranged',
                        stats: { hp: 60, atk: 12, def: 3, mag: 0, res: 3, spd: 7, move: 5, range: 3 },
                        abilities: ['shoot', 'volley'],
                        traits: ['ranged'],
                        cost: { gold: 80, recruits: 1 }
                    }
                ]
            };
            
            const result = await events.request<{ json: string }, { success: boolean; errors: any[] }>(
                'packs/load',
                { json: JSON.stringify(samplePack) }
            );
            
            if (result.success) {
                console.log('✅ Sample pack loaded successfully');
                await refreshPackStats();
            } else {
                console.error('❌ Pack loading failed:', result.errors);
            }
        } catch (error) {
            console.error('❌ Pack loading error:', error);
        }
    }, [events, refreshPackStats]);

    // Refresh world stats
    const refreshWorldStats = useCallback(async () => {
        try {
            const stats = await events.request<void, any>('world/stats');
            setWorldStats(stats);
        } catch {
            // WorldModule not loaded yet
        }
    }, [events]);

    // Generate world
    const generateWorld = useCallback(async () => {
        try {
            const seed = Math.floor(Math.random() * 0xFFFFFFFF);
            await events.request('world/generate', {
                seed,
                config: { worldWidth: 100, worldHeight: 100, chunkSize: 64 }
            });
            await refreshWorldStats();
            console.log('✅ World generated successfully');
        } catch (error) {
            console.error('❌ World generation failed:', error);
        }
    }, [events, refreshWorldStats]);

    useEffect(() => {
        // Initial pack stats load
        refreshPackStats();
        refreshWorldStats();

        // Listen for day changes
        const offDay = events.on<{ day: number }>('game/day-advanced', ({ day }) => {
            setDay(day);
        });

        // Listen for debug ticks to update day
        const offTick = events.on<{ day: number }>('debug/tick', ({ day }) => {
            if (day !== undefined) setDay(day);
        });

        // Keyboard shortcuts
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ctrl+S or Cmd+S - Save
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                events.emit('save/download');
                events.emit('save/autosave');
                setLastSave(new Date().toLocaleTimeString());
            }

            // Ctrl+L or Cmd+L - Load
            if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
                e.preventDefault();
                events.emit('load/file');
            }

            // Ctrl+` - Toggle DevBar
            if (e.ctrlKey && e.key === '`') {
                e.preventDefault();
                setVisible(v => !v);
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            offDay();
            offTick();
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [events, refreshPackStats, refreshWorldStats]);

    if (!visible) {
        return (
            <button
                onClick={() => setVisible(true)}
                className="fixed bottom-2 left-2 bg-gray-800/80 text-white text-xs px-2 py-1 rounded hover:bg-gray-700 z-50"
                title="Show DevBar (Ctrl+`)"
            >
                DevTools
            </button>
        );
    }

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-gray-900 to-gray-800 text-white border-t border-gray-700 p-2 z-50">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                        <span className="text-gray-400">Day:</span>
                        <span className="font-mono font-bold">{day}</span>
                    </div>

                    {lastSave && (
                        <div className="flex items-center gap-2">
                            <span className="text-gray-400">Last Save:</span>
                            <span className="font-mono text-green-400">{lastSave}</span>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => {
                            events.emit('save/download');
                            events.emit('save/autosave');
                            setLastSave(new Date().toLocaleTimeString());
                        }}
                        className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm font-medium transition-colors"
                        title="Save (Ctrl+S)"
                    >
                        💾 Save
                    </button>

                    <button
                        onClick={() => events.emit('load/file')}
                        className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm font-medium transition-colors"
                        title="Load (Ctrl+L)"
                    >
                        📂 Load
                    </button>

                    <button
                        onClick={() => {
                            events.emit('save/autosave');
                            setLastSave(new Date().toLocaleTimeString());
                        }}
                        className="bg-yellow-600 hover:bg-yellow-700 px-3 py-1 rounded text-sm font-medium transition-colors"
                        title="Save to localStorage (auto-save)"
                    >
                        ⚡ Autosave
                    </button>

                    <button
                        onClick={() => {
                            loadSamplePack();
                        }}
                        className="bg-purple-600 hover:bg-purple-700 px-3 py-1 rounded text-sm font-medium transition-colors"
                        title="Load sample pack (Knight + Archer units)"
                    >
                        📦 Packs ({packStats.total})
                    </button>

                    <button
                        onClick={() => generateWorld()}
                        className="bg-teal-600 hover:bg-teal-700 px-3 py-1 rounded text-sm font-medium transition-colors"
                        title="Generate new world (100×100)"
                    >
                        🌍 World {worldStats ? `(${worldStats.tiles.toLocaleString()})` : ''}
                    </button>

                    <div className="w-px h-6 bg-gray-700 mx-2" />

                    <button
                        onClick={() => setVisible(false)}
                        className="text-gray-400 hover:text-white px-2 py-1 text-sm"
                        title="Hide (Ctrl+`)"
                    >
                        ✕
                    </button>
                </div>
            </div>

            <div className="max-w-7xl mx-auto mt-2 text-xs text-gray-500 flex gap-4">
                <span>💡 Ctrl+S: Save</span>
                <span>📂 Ctrl+L: Load</span>
                <span>⚙️ Ctrl+`: Toggle DevBar</span>
            </div>
        </div>
    );
}
