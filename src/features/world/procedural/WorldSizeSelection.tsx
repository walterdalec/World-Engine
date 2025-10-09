/**
 * World Size Selection Component
 * TODO #11 Extension - Performance-Based World Creation
 * 
 * UI for selecting world size with performance recommendations and warnings.
 */

import React, { useState, useEffect } from 'react';
import {
    getWorldSizeOptions,
    detectRecommendedWorldSize,
    validateWorldSizeForSystem,
    calculateWorldCoverage,
    getWorldSizeConfig,
    type _WorldSizeConfig
} from './worldSizes';

interface WorldSizeSelectionProps {
    selectedSize: string;
    onSizeChange: (sizeId: string) => void;
    className?: string;
}

export function WorldSizeSelection({
    selectedSize,
    onSizeChange,
    className = ''
}: WorldSizeSelectionProps) {
    const [expandedCard, setExpandedCard] = useState<string | null>(null);
    const [recommendedSize] = useState(() => detectRecommendedWorldSize());

    const sizeOptions = getWorldSizeOptions();

    const handleSizeSelect = (sizeId: string) => {
        onSizeChange(_sizeId);
    };

    const toggleExpanded = (sizeId: string) => {
        setExpandedCard(expandedCard === sizeId ? null : sizeId);
    };

    return (
        <div className={`world-size-selection ${className}`}>
            <div style={{ marginBottom: '20px' }}>
                <h3>🌍 World Size Selection</h3>
                <p style={{ opacity: 0.8, marginBottom: '10px' }}>
                    Choose a world size based on your system's performance capabilities.
                </p>
                <div style={{
                    padding: '10px',
                    backgroundColor: '#e3f2fd',
                    borderRadius: '8px',
                    border: '1px solid #2196f3'
                }}>
                    <strong>💡 Recommended for your system: </strong>
                    <span style={{ color: '#1976d2' }}>
                        {getWorldSizeConfig(recommendedSize).displayName}
                    </span>
                </div>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '15px'
            }}>
                {sizeOptions.map(config => {
                    const isSelected = selectedSize === config.id;
                    const isRecommended = recommendedSize === config.id;
                    const validation = validateWorldSizeForSystem(config.id);
                    const coverage = calculateWorldCoverage(config);
                    const isExpanded = expandedCard === config.id;

                    return (
                        <div
                            key={config.id}
                            style={{
                                border: isSelected ? '3px solid #4f46e5' : '2px solid #e5e7eb',
                                borderRadius: '12px',
                                padding: '16px',
                                cursor: 'pointer',
                                backgroundColor: isSelected ? '#f8fafc' : 'white',
                                position: 'relative',
                                transition: 'all 0.2s ease'
                            }}
                            onClick={() => handleSizeSelect(config.id)}
                        >
                            {isRecommended && (
                                <div style={{
                                    position: 'absolute',
                                    top: '-8px',
                                    right: '12px',
                                    backgroundColor: '#10b981',
                                    color: 'white',
                                    padding: '4px 8px',
                                    borderRadius: '12px',
                                    fontSize: '12px',
                                    fontWeight: 'bold'
                                }}>
                                    RECOMMENDED
                                </div>
                            )}

                            <div style={{ marginBottom: '12px' }}>
                                <h4 style={{ margin: '0 0 8px 0', fontSize: '18px' }}>
                                    {config.displayName}
                                </h4>
                                <p style={{
                                    margin: '0',
                                    opacity: 0.8,
                                    fontSize: '14px',
                                    lineHeight: '1.4'
                                }}>
                                    {config.description}
                                </p>
                            </div>

                            {/* Quick Stats */}
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr',
                                gap: '8px',
                                marginBottom: '12px',
                                fontSize: '13px'
                            }}>
                                <div>
                                    <strong>Memory:</strong> {config.maxMemoryMB}MB
                                </div>
                                <div>
                                    <strong>Chunks:</strong> {
                                        config.maxChunks === Infinity ? '∞' : config.maxChunks
                                    }
                                </div>
                                <div>
                                    <strong>Size:</strong> {config.chunkSize}×{config.chunkSize}
                                </div>
                                <div>
                                    <strong>Exploration:</strong> {coverage.explorationTimeEstimate}
                                </div>
                            </div>

                            {/* Warning indicators */}
                            {validation.warnings.length > 0 && (
                                <div style={{
                                    backgroundColor: '#fef3c7',
                                    border: '1px solid #f59e0b',
                                    borderRadius: '6px',
                                    padding: '8px',
                                    marginBottom: '8px'
                                }}>
                                    <div style={{ fontSize: '12px', color: '#92400e' }}>
                                        ⚠️ {validation.warnings.length} performance warning(s)
                                    </div>
                                </div>
                            )}

                            {/* Expand/Collapse button */}
                            <button
                                style={{
                                    width: '100%',
                                    padding: '6px 12px',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '6px',
                                    backgroundColor: '#f9fafb',
                                    cursor: 'pointer',
                                    fontSize: '12px'
                                }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    toggleExpanded(config.id);
                                }}
                            >
                                {isExpanded ? '▲ Hide Details' : '▼ Show Details'}
                            </button>

                            {/* Expanded details */}
                            {isExpanded && (
                                <div style={{
                                    marginTop: '12px',
                                    padding: '12px',
                                    backgroundColor: '#f8f9fa',
                                    borderRadius: '8px',
                                    fontSize: '13px'
                                }}>
                                    <h5 style={{ margin: '0 0 8px 0' }}>Technical Details</h5>

                                    <div style={{ marginBottom: '8px' }}>
                                        <strong>World Bounds:</strong> {
                                            config.worldBounds
                                                ? `${config.worldBounds.maxChunkX - config.worldBounds.minChunkX + 1}×${config.worldBounds.maxChunkY - config.worldBounds.minChunkY + 1} chunks`
                                                : 'Unlimited'
                                        }
                                    </div>

                                    <div style={{ marginBottom: '8px' }}>
                                        <strong>Streaming:</strong> {config.streamRadius} chunk radius
                                    </div>

                                    <div style={{ marginBottom: '8px' }}>
                                        <strong>Fog of War:</strong> {config.fogEnabled ? 'Enabled' : 'Disabled'}
                                    </div>

                                    <div style={{ marginBottom: '8px' }}>
                                        <strong>Estimated Coverage:</strong> {
                                            coverage.estimatedKmSquared === -1
                                                ? 'Unlimited'
                                                : `${coverage.estimatedKmSquared.toFixed(1)} km²`
                                        }
                                    </div>

                                    {validation.warnings.length > 0 && (
                                        <div style={{ marginTop: '12px' }}>
                                            <h6 style={{ margin: '0 0 6px 0', color: '#dc2626' }}>
                                                ⚠️ Performance Warnings:
                                            </h6>
                                            {validation.warnings.map((warning, i) => (
                                                <div key={i} style={{
                                                    fontSize: '12px',
                                                    color: '#dc2626',
                                                    marginBottom: '4px'
                                                }}>
                                                    • {warning}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {validation.recommendations.length > 0 && (
                                        <div style={{ marginTop: '8px' }}>
                                            <h6 style={{ margin: '0 0 6px 0', color: '#059669' }}>
                                                💡 Recommendations:
                                            </h6>
                                            {validation.recommendations.map((rec, i) => (
                                                <div key={i} style={{
                                                    fontSize: '12px',
                                                    color: '#059669',
                                                    marginBottom: '4px'
                                                }}>
                                                    • {rec}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Selected size summary */}
            {selectedSize && (
                <div style={{
                    marginTop: '20px',
                    padding: '16px',
                    backgroundColor: '#f0f9ff',
                    border: '2px solid #0ea5e9',
                    borderRadius: '12px'
                }}>
                    <h4 style={{ margin: '0 0 8px 0' }}>
                        ✅ Selected: {getWorldSizeConfig(selectedSize).displayName}
                    </h4>
                    <p style={{ margin: '0', opacity: 0.8 }}>
                        {getWorldSizeConfig(selectedSize).description}
                    </p>
                </div>
            )}
        </div>
    );
}

export default WorldSizeSelection;