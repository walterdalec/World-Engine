/**
 * Battle Renderer Comparison Test
 * Side-by-side comparison of old vs new hex renderers
 */

import React, { useState } from 'react';
import type { BattleState } from '../types';
import { BattleCanvas } from './renderer2d';
import { HoneycombBattleCanvas } from './HoneycombRenderer';

interface RendererComparisonProps {
    state: BattleState;
    onTileClick?: (pos: { q: number; r: number }) => void;
    selectedUnit?: string;
}

export function RendererComparison({ state, onTileClick, selectedUnit }: RendererComparisonProps) {
    const [activeRenderer, setActiveRenderer] = useState<'original' | 'honeycomb'>('honeycomb');

    return (
        <div className="h-screen bg-gray-900 text-white flex flex-col">
            {/* Renderer Selector */}
            <div className="p-4 bg-gray-800 border-b border-gray-700">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold">Battle Renderer Test</h2>
                    <div className="flex space-x-2">
                        <button
                            onClick={() => setActiveRenderer('original')}
                            className={`px-4 py-2 rounded text-sm transition-colors ${activeRenderer === 'original'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                }`}
                        >
                            Original Canvas
                        </button>
                        <button
                            onClick={() => setActiveRenderer('honeycomb')}
                            className={`px-4 py-2 rounded text-sm transition-colors ${activeRenderer === 'honeycomb'
                                    ? 'bg-green-600 text-white'
                                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                }`}
                        >
                            🍯 Honeycomb Grid
                        </button>
                    </div>
                </div>

                <div className="mt-2 text-sm text-gray-400">
                    Current: <span className="font-medium">
                        {activeRenderer === 'original' ? 'Original Custom Canvas' : 'Honeycomb Grid Library'}
                    </span>
                </div>
            </div>

            {/* Renderer Container */}
            <div className="flex-1 relative overflow-hidden">
                {activeRenderer === 'original' ? (
                    <div className="w-full h-full overflow-auto flex items-center justify-center">
                        <BattleCanvas
                            state={state}
                            onTileClick={onTileClick}
                            selectedUnit={selectedUnit}
                            showGrid={true}
                        />
                    </div>
                ) : (
                    <HoneycombBattleCanvas
                        state={state}
                        onTileClick={onTileClick}
                        selectedUnit={selectedUnit}
                        showGrid={true}
                    />
                )}
            </div>

            {/* Comparison Info */}
            <div className="p-4 bg-gray-800 border-t border-gray-700">
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <h3 className="font-semibold text-blue-400 mb-2">Original Canvas</h3>
                        <ul className="space-y-1 text-gray-300">
                            <li>• Custom hex math implementation</li>
                            <li>• Manual coordinate conversion</li>
                            <li>• Basic centering and scrolling</li>
                            <li>• Fixed zoom implementation</li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="font-semibold text-green-400 mb-2">🍯 Honeycomb Grid</h3>
                        <ul className="space-y-1 text-gray-300">
                            <li>• Professional hex grid library</li>
                            <li>• Built-in coordinate utilities</li>
                            <li>• Optimized rendering & interaction</li>
                            <li>• TypeScript native, battle-tested</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}