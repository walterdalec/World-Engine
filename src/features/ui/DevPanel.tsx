/**
 * Development Panel for World Generation Testing
 * 
 * Provides live controls for:
 * - World generation parameters
 * - Map layer toggles  
 * - Performance monitoring
 * - Seed management
 */

import React, { useState, useCallback, useEffect } from 'react';
import { rng } from "../../core/services/random";
import { WorldEngine } from '../../core/engine';
import type { WorldGenConfig } from '../../proc/chunks';

interface DevPanelProps {
  engine: WorldEngine;
  onConfigChange: (config: Partial<WorldGenConfig>) => void;
}

interface LayerToggles {
  elevation: boolean;
  temperature: boolean;
  moisture: boolean;
  biomes: boolean;
  rivers: boolean;
  roads: boolean;
  factions: boolean;
  grid: boolean;
}

export default function DevPanel({ engine, onConfigChange }: DevPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<WorldGenConfig>(engine.state.config.world);
  const [layers, setLayers] = useState<LayerToggles>({
    elevation: false,
    temperature: false,
    moisture: false,
    biomes: true,
    rivers: false,
    roads: false,
    factions: false,
    grid: false
  });
  const [stats, setStats] = useState(engine.getStats());
  const [newSeed, setNewSeed] = useState(engine.state.seed);

  // Update stats periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setStats(engine.getStats());
    }, 1000);

    return () => clearInterval(interval);
  }, [engine]);

  const handleConfigChange = useCallback((key: keyof WorldGenConfig, value: number) => {
    const newConfig = { ...config, [key]: value };
    setConfig(newConfig);
    onConfigChange(newConfig);
  }, [config, onConfigChange]);

  const handleLayerToggle = useCallback((layer: keyof LayerToggles) => {
    setLayers(prev => ({ ...prev, [layer]: !prev[layer] }));
  }, []);

  const regenerateWorld = useCallback(() => {
    // Create new engine with different seed
    const _newEngine = new WorldEngine(newSeed, { world: config });
    // In a real app, you'd update the parent component's engine
    console.log('Would regenerate world with seed:', newSeed);
  }, [newSeed, config]);

  const copyShareUrl = useCallback(() => {
    const url = new URL(window.location.href);
    url.searchParams.set('seed', engine.state.seed);
    url.searchParams.set('seaLevel', config.seaLevel.toString());
    url.searchParams.set('continentFreq', config.continentFreq.toString());
    url.searchParams.set('warpStrength', config.warpStrength.toString());

    navigator.clipboard.writeText(url.toString());
    alert('Share URL copied to clipboard!');
  }, [engine.state.seed, config]);

  const exportSave = useCallback(() => {
    const saveData = engine.save();
    const blob = new Blob([saveData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `world_${engine.state.seed}_day${engine.state.time.day}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [engine]);

  if (!isOpen) {
    return (
      <div style={{
        position: 'fixed',
        top: '10px',
        right: '10px',
        zIndex: 1000
      }}>
        <button
          onClick={() => setIsOpen(true)}
          style={{
            padding: '8px 16px',
            background: '#374151',
            color: '#f9fafb',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          🔧 Dev Tools
        </button>
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      width: '320px',
      maxHeight: 'calc(100vh - 20px)',
      background: '#1f2937',
      border: '1px solid #374151',
      borderRadius: '8px',
      padding: '16px',
      color: '#f9fafb',
      fontSize: '13px',
      overflowY: 'auto',
      zIndex: 1000
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ margin: 0 }}>World Dev Panel</h3>
        <button
          onClick={() => setIsOpen(false)}
          style={{
            background: 'none',
            border: 'none',
            color: '#9ca3af',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          ✕
        </button>
      </div>

      {/* World Stats */}
      <div style={{ marginBottom: '16px', padding: '8px', background: '#0f172a', borderRadius: '4px' }}>
        <h4 style={{ margin: '0 0 8px 0' }}>Performance</h4>
        <div style={{ fontSize: '12px', lineHeight: '1.4' }}>
          <div>Chunks: {stats.chunks.generatedChunks} / {stats.chunks.totalChunks}</div>
          <div>Tiles: {stats.chunks.totalTiles.toLocaleString()}</div>
          <div>Memory: {stats.chunks.memoryEstimateMB.toFixed(1)} MB</div>
          <div>Discovered: {stats.discovered.toLocaleString()}</div>
          <div>Time: {stats.gameTime}</div>
        </div>
      </div>

      {/* World Generation Config */}
      <div style={{ marginBottom: '16px' }}>
        <h4 style={{ margin: '0 0 8px 0' }}>World Generation</h4>

        <div style={{ marginBottom: '8px' }}>
          <label style={{ display: 'block', marginBottom: '2px' }}>
            Sea Level: {config.seaLevel.toFixed(3)}
          </label>
          <input
            type="range"
            min="0.3"
            max="0.5"
            step="0.005"
            value={config.seaLevel}
            onChange={(e) => handleConfigChange('seaLevel', parseFloat(e.target.value))}
            style={{ width: '100%' }}
          />
        </div>

        <div style={{ marginBottom: '8px' }}>
          <label style={{ display: 'block', marginBottom: '2px' }}>
            Continent Frequency: {(config.continentFreq * 1000).toFixed(2)}e-3
          </label>
          <input
            type="range"
            min="0.0005"
            max="0.002"
            step="0.0001"
            value={config.continentFreq}
            onChange={(e) => handleConfigChange('continentFreq', parseFloat(e.target.value))}
            style={{ width: '100%' }}
          />
        </div>

        <div style={{ marginBottom: '8px' }}>
          <label style={{ display: 'block', marginBottom: '2px' }}>
            Warp Strength: {config.warpStrength}
          </label>
          <input
            type="range"
            min="200"
            max="1200"
            step="50"
            value={config.warpStrength}
            onChange={(e) => handleConfigChange('warpStrength', parseFloat(e.target.value))}
            style={{ width: '100%' }}
          />
        </div>

        <div style={{ marginBottom: '8px' }}>
          <label style={{ display: 'block', marginBottom: '2px' }}>
            Feature Frequency: {(config.featureFreq * 1000).toFixed(1)}e-3
          </label>
          <input
            type="range"
            min="0.005"
            max="0.015"
            step="0.001"
            value={config.featureFreq}
            onChange={(e) => handleConfigChange('featureFreq', parseFloat(e.target.value))}
            style={{ width: '100%' }}
          />
        </div>
      </div>

      {/* Layer Toggles */}
      <div style={{ marginBottom: '16px' }}>
        <h4 style={{ margin: '0 0 8px 0' }}>Map Layers</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
          {Object.entries(layers).map(([key, enabled]) => (
            <label key={key} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={enabled}
                onChange={() => handleLayerToggle(key as keyof LayerToggles)}
                style={{ marginRight: '6px' }}
              />
              {key.charAt(0).toUpperCase() + key.slice(1)}
            </label>
          ))}
        </div>
      </div>

      {/* Seed Management */}
      <div style={{ marginBottom: '16px' }}>
        <h4 style={{ margin: '0 0 8px 0' }}>Seed Management</h4>
        <div style={{ marginBottom: '8px' }}>
          <label style={{ display: 'block', marginBottom: '2px' }}>Current Seed:</label>
          <input
            type="text"
            value={newSeed}
            onChange={(e) => setNewSeed(e.target.value)}
            style={{
              width: '100%',
              padding: '4px',
              background: '#374151',
              border: '1px solid #4b5563',
              borderRadius: '4px',
              color: '#f9fafb',
              fontSize: '12px'
            }}
          />
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            onClick={regenerateWorld}
            style={{
              flex: 1,
              padding: '6px',
              background: '#dc2626',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            Regenerate
          </button>
          <button
            onClick={() => setNewSeed(rng.next().toString(36).substring(2, 15))}
            style={{
              flex: 1,
              padding: '6px',
              background: '#059669',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            Random
          </button>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '4px' }}>
        <button
          onClick={copyShareUrl}
          style={{
            flex: 1,
            padding: '8px',
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          Copy Share URL
        </button>
        <button
          onClick={exportSave}
          style={{
            flex: 1,
            padding: '8px',
            background: '#8b5cf6',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          Export Save
        </button>
      </div>

      {/* Weather & Time Info */}
      <div style={{ marginTop: '16px', padding: '8px', background: '#0f172a', borderRadius: '4px' }}>
        <h4 style={{ margin: '0 0 8px 0' }}>Current Conditions</h4>
        <div style={{ fontSize: '12px', lineHeight: '1.4' }}>
          <div>Weather: {engine.state.weather.type} (intensity: {(engine.state.weather.intensity * 100).toFixed(0)}%)</div>
          <div>Visibility: {(engine.state.weather.visibility * 100).toFixed(0)}%</div>
          <div>Movement: {(engine.state.weather.movementModifier * 100).toFixed(0)}% speed</div>
          <div>Encounter Risk: {(engine.state.encounterClock.riskLevel * 100).toFixed(0)}%</div>
          <div>Party: ({engine.state.party.x}, {engine.state.party.y})</div>
        </div>
      </div>

      {/* Region & Chokepoint Info */}
      <div style={{ marginTop: '16px', padding: '8px', background: '#0f172a', borderRadius: '4px' }}>
        <h4 style={{ margin: '0 0 8px 0' }}>Region & Fortifications</h4>
        <div style={{ fontSize: '12px', lineHeight: '1.4' }}>
          {(() => {
            const currentRegion = engine.getCurrentRegion();
            const partyX = engine.state.party.x;
            const partyY = engine.state.party.y;

            // Find nearby chokepoints within 50 tiles
            const nearbyChokepoints = engine.getChokepoints().filter(cp => {
              const dx = cp.x - partyX;
              const dy = cp.y - partyY;
              const distance = Math.sqrt(dx * dx + dy * dy);
              return distance <= 50 && engine.isDiscovered(cp.x, cp.y);
            }).sort((a, b) => {
              const distA = Math.sqrt((a.x - partyX) ** 2 + (a.y - partyY) ** 2);
              const distB = Math.sqrt((b.x - partyX) ** 2 + (b.y - partyY) ** 2);
              return distA - distB;
            });

            return (
              <>
                {currentRegion ? (
                  <>
                    <div><strong>{currentRegion.name}</strong> (Danger Level: {currentRegion.difficultyLevel})</div>
                    <div style={{ color: '#94a3b8', fontSize: '11px', marginBottom: '8px' }}>
                      {currentRegion.description}
                    </div>
                  </>
                ) : (
                  <div style={{ color: '#64748b' }}>Unknown Region</div>
                )}

                {nearbyChokepoints.length > 0 && (
                  <>
                    <div style={{ marginTop: '8px', marginBottom: '4px', color: '#f1f5f9' }}>
                      <strong>Nearby Fortifications:</strong>
                    </div>
                    {nearbyChokepoints.slice(0, 3).map((cp, _index) => {
                      const distance = Math.sqrt((cp.x - partyX) ** 2 + (cp.y - partyY) ** 2);
                      const fortification = cp.fortification;

                      return (
                        <div key={`${cp.x},${cp.y}`} style={{
                          marginBottom: '4px',
                          padding: '4px',
                          background: 'rgba(0,0,0,0.3)',
                          borderRadius: '2px'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{
                              color: fortification ?
                                (fortification.cleared ? '#4ade80' :
                                  fortification.level >= 6 ? '#dc2626' : '#eab308') :
                                '#94a3b8'
                            }}>
                              {fortification ? fortification.name : `${cp.type} chokepoint`}
                            </span>
                            <span style={{ color: '#64748b' }}>
                              {distance.toFixed(1)} tiles
                            </span>
                          </div>
                          {fortification && (
                            <div style={{ fontSize: '10px', color: '#94a3b8' }}>
                              Level {fortification.level} {fortification.type}
                              {fortification.cleared ? ' (CLEARED)' : ` (Req: Lv${fortification.requiredLevel})`}
                              {!fortification.cleared && fortification.requiredGear.length > 0 && (
                                <div>Gear needed: {fortification.requiredGear.join(', ')}</div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {nearbyChokepoints.length > 3 && (
                      <div style={{ fontSize: '10px', color: '#64748b', fontStyle: 'italic' }}>
                        ...and {nearbyChokepoints.length - 3} more
                      </div>
                    )}
                  </>
                )}

                {nearbyChokepoints.length === 0 && (
                  <div style={{ color: '#64748b', fontStyle: 'italic', marginTop: '8px' }}>
                    No fortifications discovered nearby
                  </div>
                )}
              </>
            );
          })()}
        </div>
      </div>
    </div>
  );
}