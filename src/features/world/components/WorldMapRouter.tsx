/**
 * World Map Router - Toggle between Canvas and Pixi renderers
 * 
 * Provides hot-swappable map implementations for comparison and fallback.
 * 
 * Press F9 to toggle between renderers at runtime.
 */

import React, { useState, useEffect } from 'react';
import SmoothWorldMap from './SmoothWorldMap';
import PixiWorldMap from './PixiWorldMap';
import { WorldPos } from '../../../core/types';

interface WorldMapRouterProps {
    seed: string;
    onEncounter?: (_pos: WorldPos) => void;
    onSettlement?: (_pos: WorldPos) => void;
    initialRenderer?: 'canvas' | 'pixi';
}

type RendererType = 'canvas' | 'pixi';

export default function WorldMapRouter({
    seed,
    onEncounter,
    onSettlement,
    initialRenderer = 'pixi' // Default to Pixi (GPU-accelerated)
}: WorldMapRouterProps) {
    const [renderer, setRenderer] = useState<RendererType>(initialRenderer);
    const [showToggle, setShowToggle] = useState(true);

    // F9 to toggle renderer
    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            if (e.key === 'F9') {
                e.preventDefault();
                setRenderer(prev => {
                    const next = prev === 'canvas' ? 'pixi' : 'canvas';
                    console.log(`🔄 Switching renderer: ${prev} → ${next}`);
                    return next;
                });
            }
            // F10 to hide toggle button
            if (e.key === 'F10') {
                e.preventDefault();
                setShowToggle(prev => !prev);
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, []);

    return (
        <div style={{ width: '100%', height: '100%', position: 'relative' }}>
            {/* Render active map */}
            {renderer === 'canvas' ? (
                <SmoothWorldMap
                    seed={seed}
                    onEncounter={onEncounter}
                    onSettlement={onSettlement}
                />
            ) : (
                <PixiWorldMap
                    seed={seed}
                    onEncounter={onEncounter}
                    onSettlement={onSettlement}
                />
            )}

            {/* Toggle button overlay */}
            {showToggle && (
                <div
                    style={{
                        position: 'absolute',
                        top: 10,
                        right: 10,
                        display: 'flex',
                        gap: 8,
                        alignItems: 'center',
                        background: 'rgba(0,0,0,0.8)',
                        padding: '8px 12px',
                        borderRadius: 8,
                        fontFamily: 'monospace',
                        fontSize: 12,
                        color: 'white',
                        zIndex: 1000,
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ opacity: 0.7 }}>Renderer:</span>
                        <button
                            onClick={() => setRenderer('canvas')}
                            style={{
                                padding: '4px 12px',
                                background: renderer === 'canvas' ? '#4CAF50' : '#333',
                                color: 'white',
                                border: 'none',
                                borderRadius: 4,
                                cursor: 'pointer',
                                fontFamily: 'monospace',
                                fontSize: 11,
                                transition: 'all 0.2s',
                            }}
                        >
                            Canvas 2D
                        </button>
                        <button
                            onClick={() => setRenderer('pixi')}
                            style={{
                                padding: '4px 12px',
                                background: renderer === 'pixi' ? '#2196F3' : '#333',
                                color: 'white',
                                border: 'none',
                                borderRadius: 4,
                                cursor: 'pointer',
                                fontFamily: 'monospace',
                                fontSize: 11,
                                transition: 'all 0.2s',
                            }}
                        >
                            Pixi.js (GPU)
                        </button>
                    </div>
                    <div
                        style={{
                            fontSize: 10,
                            opacity: 0.5,
                            borderLeft: '1px solid rgba(255,255,255,0.2)',
                            paddingLeft: 8,
                        }}
                    >
                        F9: Toggle | F10: Hide
                    </div>
                </div>
            )}

            {/* Info banner */}
            <div
                style={{
                    position: 'absolute',
                    top: 50,
                    right: 10,
                    background: renderer === 'pixi'
                        ? 'rgba(33, 150, 243, 0.9)'
                        : 'rgba(76, 175, 80, 0.9)',
                    color: 'white',
                    padding: '6px 10px',
                    borderRadius: 4,
                    fontFamily: 'monospace',
                    fontSize: 11,
                    zIndex: 999,
                    pointerEvents: 'none',
                }}
            >
                {renderer === 'pixi' ? (
                    <>
                        🚀 GPU Accelerated | WebGL Rendering | Auto Culling
                    </>
                ) : (
                    <>
                        🎨 Canvas 2D | CPU Rendering | Manual Caching
                    </>
                )}
            </div>
        </div>
    );
}
