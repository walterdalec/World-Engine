/**
 * World Size Configuration Demo
 * TODO #11 Extension Demo
 * 
 * Simple demo component to test the world size configuration system
 */

import React, { useState } from 'react';
import { 
    WORLD_SIZE_CONFIGS,
    detectRecommendedWorldSize,
    getWorldSizeConfig,
    validateWorldSizeForSystem,
    calculateWorldCoverage 
} from './worldSizes';

export const WorldSizeDemo: React.FC = () => {
    const [selectedSize, setSelectedSize] = useState(detectRecommendedWorldSize());
    const [testResults, setTestResults] = useState<{
        validation: ReturnType<typeof validateWorldSizeForSystem>;
        coverage: ReturnType<typeof calculateWorldCoverage>;
    } | null>(null);

    const runTests = () => {
        const validation = validateWorldSizeForSystem(selectedSize);
        const config = getWorldSizeConfig(selectedSize);
        const coverage = calculateWorldCoverage(config);
        
        setTestResults({ validation, coverage });
    };

    const config = getWorldSizeConfig(selectedSize);

    return (
        <div style={{ 
            padding: '20px', 
            maxWidth: '800px', 
            margin: '0 auto',
            fontFamily: 'system-ui, sans-serif'
        }}>
            <h2>🌍 World Size Configuration Demo</h2>
            <p>Testing the performance-based world size system for TODO #11.</p>

            <div style={{ marginBottom: '20px' }}>
                <h3>Available World Sizes</h3>
                <div style={{ display: 'grid', gap: '10px', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
                    {Object.values(WORLD_SIZE_CONFIGS).map((size) => (
                        <div 
                            key={size.id}
                            style={{
                                border: selectedSize === size.id ? '2px solid #0066cc' : '1px solid #ccc',
                                borderRadius: '8px',
                                padding: '15px',
                                cursor: 'pointer',
                                backgroundColor: selectedSize === size.id ? '#f0f8ff' : '#fff'
                            }}
                            onClick={() => setSelectedSize(size.id)}
                        >
                            <h4 style={{ margin: '0 0 8px 0' }}>{size.displayName}</h4>
                            <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#666' }}>
                                {size.description}
                            </p>
                            <div style={{ fontSize: '12px', color: '#888' }}>
                                Max chunks: {size.maxChunks.toLocaleString()} | 
                                Memory: {size.maxMemoryMB}MB | 
                                Stream radius: {size.streamRadius}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
                <h3>Selected Configuration: {config.displayName}</h3>
                <div style={{ 
                    backgroundColor: '#f5f5f5', 
                    padding: '15px', 
                    borderRadius: '8px',
                    fontFamily: 'monospace',
                    fontSize: '14px'
                }}>
                    <div><strong>Max Chunks:</strong> {config.maxChunks.toLocaleString()}</div>
                    <div><strong>Memory Limit:</strong> {config.maxMemoryMB}MB</div>
                    <div><strong>Chunk Size:</strong> {config.chunkSize}×{config.chunkSize}</div>
                    <div><strong>Stream Radius:</strong> {config.streamRadius} chunks</div>
                    <div><strong>Fog of War:</strong> {config.fogEnabled ? `Enabled (${config.revealRadius}px reveal)` : 'Disabled'}</div>
                    <div><strong>World Bounds:</strong> {config.worldBounds 
                        ? `${config.worldBounds.maxChunkX - config.worldBounds.minChunkX + 1}×${config.worldBounds.maxChunkY - config.worldBounds.minChunkY + 1} chunks`
                        : 'Unknown'
                    }</div>
                </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
                <button 
                    onClick={runTests}
                    style={{
                        padding: '10px 20px',
                        backgroundColor: '#0066cc',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '16px'
                    }}
                >
                    🧪 Run Performance Tests
                </button>
            </div>

            {testResults && (
                <div>
                    <h3>Test Results</h3>
                    
                    <div style={{ marginBottom: '15px' }}>
                        <h4>System Validation</h4>
                        <div style={{ 
                            padding: '10px', 
                            borderRadius: '4px',
                            backgroundColor: testResults.validation.supported ? '#d4edda' : '#f8d7da',
                            border: `1px solid ${testResults.validation.supported ? '#c3e6cb' : '#f5c6cb'}`
                        }}>
                            <div><strong>Supported:</strong> {testResults.validation.supported ? '✅ Yes' : '❌ No'}</div>
                            {testResults.validation.warnings.length > 0 && (
                                <div>
                                    <strong>Warnings:</strong>
                                    <ul style={{ margin: '5px 0 0 20px' }}>
                                        {testResults.validation.warnings.map((warning: string, i: number) => (
                                            <li key={i}>{warning}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            {testResults.validation.recommendations.length > 0 && (
                                <div>
                                    <strong>Recommendations:</strong>
                                    <ul style={{ margin: '5px 0 0 20px' }}>
                                        {testResults.validation.recommendations.map((rec: string, i: number) => (
                                            <li key={i}>{rec}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>

                    <div>
                        <h4>World Coverage Analysis</h4>
                        <div style={{ 
                            backgroundColor: '#f8f9fa', 
                            padding: '10px', 
                            borderRadius: '4px',
                            fontFamily: 'monospace',
                            fontSize: '14px'
                        }}>
                            <div><strong>Total Tiles:</strong> {testResults.coverage.totalTiles.toLocaleString()}</div>
                            <div><strong>Area:</strong> {testResults.coverage.estimatedKmSquared.toFixed(1)} km²</div>
                            <div><strong>Exploration Time:</strong> {testResults.coverage.explorationTimeEstimate}</div>
                        </div>
                    </div>
                </div>
            )}

            <div style={{ marginTop: '30px', padding: '15px', backgroundColor: '#fff3cd', borderRadius: '8px' }}>
                <h4>🎮 Performance Tips</h4>
                <ul style={{ margin: '10px 0', paddingLeft: '20px' }}>
                    <li><strong>Laptops/Older PCs:</strong> Use Small or Medium worlds for best performance</li>
                    <li><strong>Gaming PCs:</strong> Large or Extra Large worlds provide great exploration without lag</li>
                    <li><strong>High-end Systems:</strong> Extremely Large or Colossal worlds for maximum freedom</li>
                    <li><strong>Memory Usage:</strong> Actual usage grows dynamically as you explore</li>
                    <li><strong>Fog of War:</strong> Helps performance by hiding distant areas you haven't visited</li>
                </ul>
            </div>
        </div>
    );
};

export default WorldSizeDemo;
