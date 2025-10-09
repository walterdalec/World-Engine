/**
 * Procedural Generation Dev Tools
 * TODO #11 — Overworld Procedural Generation
 * 
 * React component for testing and debugging the procedural world generation system.
 */

import React, { useState, useRef, useEffect } from 'react';
import {
    WorldManager,
    initializeWorld,
    validateChunkDeterminism,
    benchmarkGeneration,
    type ChunkId,
    type Chunk,
    type POI,
    type RiverSegment,
    getChunkTile
} from './index';

interface ProceduralDevToolsProps {
    className?: string;
}

const TILE_COLORS: Record<string, string> = {
    water: '#1e40af',
    shallows: '#3b82f6',
    sand: '#fbbf24',
    grass: '#10b981',
    forest: '#065f46',
    rock: '#6b7280',
    snow: '#f3f4f6',
    swamp: '#059669',
    desert: '#f59e0b',
    tundra: '#e5e7eb',
    road: '#8b5cf6',
    town: '#dc2626',
    ruin: '#7c2d12',
    shrine: '#fbbf24',
    mine: '#374151',
    crystal: '#c084fc'
};

export function ProceduralDevTools({ className = '' }: ProceduralDevToolsProps) {
    const [globalSeed, setGlobalSeed] = useState(12345);
    const [chunkX, setChunkX] = useState(0);
    const [chunkY, setChunkY] = useState(0);
    const [chunk, setChunk] = useState<Chunk | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [benchmarkResults, setBenchmarkResults] = useState<any>(null);
    const [worldManager, setWorldManager] = useState<WorldManager | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Initialize world manager
    useEffect(() => {
        const manager = initializeWorld({ globalSeed, chunkSize: 32 }); // Smaller for dev
        setWorldManager(manager);
    }, [globalSeed]);

    // Generate chunk when coordinates change
    useEffect(() => {
        if (!worldManager) return;

        let cancelled = false;

        const generateChunk = async () => {
            setIsGenerating(true);
            try {
                const chunkId: ChunkId = { cx: chunkX, cy: chunkY };
                const newChunk = await worldManager.getChunk(chunkId);
                if (!cancelled) {
                    setChunk(newChunk);
                }
            } catch (error) {
                if (!cancelled) {
                    console.error('🗺️ Failed to generate chunk:', error);
                }
            } finally {
                if (!cancelled) {
                    setIsGenerating(false);
                }
            }
        };

        generateChunk();

        return () => {
            cancelled = true;
        };
    }, [worldManager, chunkX, chunkY]);

    // Render chunk to canvas
    useEffect(() => {
        if (!chunk || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const size = chunk.width;
        const tileSize = Math.floor(256 / size);

        canvas.width = size * tileSize;
        canvas.height = size * tileSize;

        // Clear canvas
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Render tiles
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const tile = getChunkTile(chunk, x, y);
                const color = TILE_COLORS[tile || 'water'] || '#000000';

                ctx.fillStyle = color;
                ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
            }
        }

        // Render POIs
        ctx.fillStyle = '#ff0000';
        chunk.meta.pois.forEach((poi: POI) => {
            const x = poi.x * tileSize + tileSize / 2;
            const y = poi.y * tileSize + tileSize / 2;
            ctx.beginPath();
            ctx.arc(x, y, 3, 0, Math.PI * 2);
            ctx.fill();
        });

        // Render rivers
        ctx.strokeStyle = '#0066cc';
        ctx.lineWidth = 2;
        chunk.meta.rivers.forEach((river: RiverSegment) => {
            const x = river.x * tileSize + tileSize / 2;
            const y = river.y * tileSize + tileSize / 2;
            ctx.beginPath();
            ctx.arc(x, y, river.width * 2, 0, Math.PI * 2);
            ctx.stroke();
        });
    }, [chunk]);

    const handleRandomSeed = () => {
        setGlobalSeed(Math.floor(Math.random() * 1000000));
    };

    const handleTestDeterminism = () => {
        const chunkId: ChunkId = { cx: chunkX, cy: chunkY };
        const isDeterministic = validateChunkDeterminism(globalSeed, chunkId);
        alert(`Determinism test: ${isDeterministic ? 'PASSED' : 'FAILED'}`);
    };

    const handleBenchmark = () => {
        setBenchmarkResults(null);
        const results = benchmarkGeneration(globalSeed, 10);
        setBenchmarkResults(results);
    };

    const handleNavigate = (dx: number, dy: number) => {
        setChunkX(x => x + dx);
        setChunkY(y => y + dy);
    };

    return (
        <div className={`procedural-dev-tools ${className}`}>
            <div style={{ display: 'flex', gap: '20px', padding: '20px' }}>

                {/* Controls Panel */}
                <div style={{ flex: '0 0 300px' }}>
                    <h3>🗺️ Procedural Generation DevTools</h3>

                    <div style={{ marginBottom: '20px' }}>
                        <h4>World Settings</h4>
                        <div style={{ marginBottom: '10px' }}>
                            <label>Global Seed: </label>
                            <input
                                type="number"
                                value={globalSeed}
                                onChange={e => setGlobalSeed(Number(e.target.value))}
                                style={{ width: '100px' }}
                            />
                            <button onClick={handleRandomSeed} style={{ marginLeft: '10px' }}>
                                🎲 Random
                            </button>
                        </div>
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <h4>Chunk Navigation</h4>
                        <div style={{ marginBottom: '10px' }}>
                            <label>Chunk X: </label>
                            <input
                                type="number"
                                value={chunkX}
                                onChange={e => setChunkX(Number(e.target.value))}
                                style={{ width: '80px' }}
                            />
                        </div>
                        <div style={{ marginBottom: '10px' }}>
                            <label>Chunk Y: </label>
                            <input
                                type="number"
                                value={chunkY}
                                onChange={e => setChunkY(Number(e.target.value))}
                                style={{ width: '80px' }}
                            />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '5px', maxWidth: '150px' }}>
                            <button onClick={() => handleNavigate(-1, -1)}>↖</button>
                            <button onClick={() => handleNavigate(0, -1)}>↑</button>
                            <button onClick={() => handleNavigate(1, -1)}>↗</button>
                            <button onClick={() => handleNavigate(-1, 0)}>←</button>
                            <button onClick={() => handleNavigate(0, 0)}>⊙</button>
                            <button onClick={() => handleNavigate(1, 0)}>→</button>
                            <button onClick={() => handleNavigate(-1, 1)}>↙</button>
                            <button onClick={() => handleNavigate(0, 1)}>↓</button>
                            <button onClick={() => handleNavigate(1, 1)}>↘</button>
                        </div>
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <h4>Testing</h4>
                        <button onClick={handleTestDeterminism} style={{ marginBottom: '10px', display: 'block' }}>
                            🧪 Test Determinism
                        </button>
                        <button onClick={handleBenchmark} style={{ marginBottom: '10px', display: 'block' }}>
                            ⏱️ Benchmark (10 chunks)
                        </button>
                    </div>

                    {/* Chunk Metadata */}
                    {chunk && (
                        <div style={{ marginBottom: '20px' }}>
                            <h4>Chunk Metadata</h4>
                            <div style={{ fontSize: '12px', fontFamily: 'monospace' }}>
                                <div>Hash: {chunk.hash}</div>
                                <div>Size: {chunk.width}×{chunk.height}</div>
                                <div>Avg Height: {chunk.meta.averageHeight.toFixed(3)}</div>
                                <div>Avg Temp: {chunk.meta.averageTemperature.toFixed(3)}</div>
                                <div>Avg Moisture: {chunk.meta.averageMoisture.toFixed(3)}</div>
                                <div>Dominant: {chunk.meta.dominantBiome}</div>
                                <div>POIs: {chunk.meta.pois.length}</div>
                                <div>Rivers: {chunk.meta.rivers.length}</div>
                                <div>Gen Time: {chunk.meta.lastGenTime.toFixed(1)}ms</div>
                            </div>
                        </div>
                    )}

                    {/* Benchmark Results */}
                    {benchmarkResults && (
                        <div style={{ marginBottom: '20px' }}>
                            <h4>Benchmark Results</h4>
                            <div style={{ fontSize: '12px', fontFamily: 'monospace' }}>
                                <div>Avg: {benchmarkResults.averageTime.toFixed(1)}ms</div>
                                <div>Min: {benchmarkResults.minTime.toFixed(1)}ms</div>
                                <div>Max: {benchmarkResults.maxTime.toFixed(1)}ms</div>
                                <div>Total: {benchmarkResults.totalTime.toFixed(1)}ms</div>
                            </div>
                        </div>
                    )}

                    {/* Cache Stats */}
                    {worldManager && (
                        <div style={{ marginBottom: '20px' }}>
                            <h4>Cache Stats</h4>
                            <div style={{ fontSize: '12px', fontFamily: 'monospace' }}>
                                {JSON.stringify(worldManager.getCacheStats(), null, 2)
                                    .split('\n')
                                    .map((line, i) => <div key={i}>{line}</div>)}
                            </div>
                        </div>
                    )}
                </div>

                {/* Visualization Panel */}
                <div style={{ flex: '1' }}>
                    <h4>Chunk Visualization {isGenerating && '(Generating...)'}</h4>
                    <canvas
                        ref={canvasRef}
                        style={{
                            border: '1px solid #ccc',
                            maxWidth: '500px',
                            maxHeight: '500px',
                            imageRendering: 'pixelated'
                        }}
                    />

                    {/* Legend */}
                    <div style={{ marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                        {Object.entries(TILE_COLORS).map(([tile, color]) => (
                            <div key={tile} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <div
                                    style={{
                                        width: '12px',
                                        height: '12px',
                                        backgroundColor: color,
                                        border: '1px solid #000'
                                    }}
                                />
                                <span style={{ fontSize: '12px' }}>{tile}</span>
                            </div>
                        ))}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <div style={{ width: '12px', height: '12px', backgroundColor: '#ff0000', borderRadius: '50%' }} />
                            <span style={{ fontSize: '12px' }}>POI</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ProceduralDevTools;
