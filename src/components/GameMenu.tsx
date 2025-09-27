/**
 * Game Menu - Tabbed in-game menu system
 */

import React, { useState } from 'react';
import { WorldEngine } from '../engine/index';

interface GameMenuProps {
  engine: WorldEngine;
  isVisible: boolean;
  onClose: () => void;
  showGrid: boolean;
  onToggleGrid: () => void;
  cameraLocked: boolean;
  onToggleCameraLock: () => void;
  stats: {
    chunks: { loaded?: number; total?: number } | any;
    discovered: number;
    timeOfDay: string;
    gameTime: string;
  };
}

type MenuTab = 'stats' | 'abilities' | 'spells' | 'creation' | 'settings';

export default function GameMenu({ 
  engine, 
  isVisible, 
  onClose, 
  showGrid, 
  onToggleGrid, 
  cameraLocked, 
  onToggleCameraLock, 
  stats 
}: GameMenuProps) {
  const [activeTab, setActiveTab] = useState<MenuTab>('stats');

  if (!isVisible) return null;

  return (
    <div style={{
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      background: 'rgba(0, 0, 0, 0.95)',
      color: '#f9fafb',
      padding: '0',
      borderRadius: '12px',
      border: '2px solid #374151',
      width: '80vw',
      maxWidth: '900px',
      height: '80vh',
      maxHeight: '700px',
      zIndex: 300,
      boxShadow: '0 12px 48px rgba(0, 0, 0, 0.8)',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Menu Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '20px 24px',
        borderBottom: '2px solid #374151'
      }}>
        <h2 style={{ margin: 0, color: '#f1f5f9', fontSize: '24px' }}>🎮 Game Menu</h2>
        <button
          onClick={onClose}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#94a3b8',
            fontSize: '24px',
            cursor: 'pointer',
            padding: '0',
            width: '32px',
            height: '32px'
          }}
        >
          ×
        </button>
      </div>

      {/* Tab Navigation */}
      <div style={{
        display: 'flex',
        borderBottom: '2px solid #374151',
        backgroundColor: 'rgba(0, 0, 0, 0.3)'
      }}>
        {[
          { id: 'stats', label: '📊 Character Stats', icon: '📊' },
          { id: 'abilities', label: '⚔️ Physical Abilities', icon: '⚔️' },
          { id: 'spells', label: '✨ Magical Spells', icon: '✨' },
          { id: 'creation', label: '🔨 Creation Workshop', icon: '🔨' },
          { id: 'settings', label: '⚙️ Game Settings', icon: '⚙️' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as MenuTab)}
            style={{
              flex: 1,
              padding: '12px 16px',
              background: activeTab === tab.id ? '#374151' : 'transparent',
              color: activeTab === tab.id ? '#f9fafb' : '#94a3b8',
              border: 'none',
              borderBottom: activeTab === tab.id ? '3px solid #3b82f6' : '3px solid transparent',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: activeTab === tab.id ? 'bold' : 'normal',
              transition: 'all 0.2s'
            }}
          >
            {tab.icon} {tab.label.split(' ').slice(1).join(' ')}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={{
        flex: 1,
        padding: '24px',
        overflowY: 'auto',
        backgroundColor: 'rgba(0, 0, 0, 0.2)'
      }}>
        {activeTab === 'stats' && (
          <div>
            <h3 style={{ margin: '0 0 20px 0', color: '#3b82f6' }}>📊 Character Statistics</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
              {/* Basic Info */}
              <div style={{
                background: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                borderRadius: '8px',
                padding: '16px'
              }}>
                <h4 style={{ margin: '0 0 12px 0', color: '#60a5fa' }}>Basic Information</h4>
                <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
                  <div><strong>Level:</strong> {engine.state.party.level}</div>
                  <div><strong>Experience:</strong> {engine.state.party.experience}/{engine.state.party.level * 100}</div>
                  <div><strong>Position:</strong> ({engine.state.party.x}, {engine.state.party.y})</div>
                </div>
              </div>

              {/* Health & Resources */}
              <div style={{
                background: 'rgba(34, 197, 94, 0.1)',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                borderRadius: '8px',
                padding: '16px'
              }}>
                <h4 style={{ margin: '0 0 12px 0', color: '#4ade80' }}>Health & Resources</h4>
                <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
                  <div>
                    <strong>Health:</strong>
                    <span style={{ 
                      color: engine.state.party.hitPoints / engine.state.party.maxHitPoints > 0.7 ? '#4ade80' : 
                             engine.state.party.hitPoints / engine.state.party.maxHitPoints > 0.3 ? '#eab308' : '#ef4444',
                      fontWeight: 'bold',
                      marginLeft: '8px'
                    }}>
                      {engine.state.party.hitPoints}/{engine.state.party.maxHitPoints}
                    </span>
                  </div>
                  <div>
                    <strong>Stamina:</strong>
                    <span style={{ 
                      color: engine.state.party.stamina / engine.state.party.maxStamina > 0.7 ? '#4ade80' : 
                             engine.state.party.stamina / engine.state.party.maxStamina > 0.3 ? '#eab308' : '#ef4444',
                      fontWeight: 'bold',
                      marginLeft: '8px'
                    }}>
                      {engine.state.party.stamina}/{engine.state.party.maxStamina}
                    </span>
                  </div>
                  <div>
                    <strong>Ether:</strong>
                    <span style={{ 
                      color: engine.state.party.ether / engine.state.party.maxEther > 0.7 ? '#4ade80' : 
                             engine.state.party.ether / engine.state.party.maxEther > 0.3 ? '#eab308' : '#ef4444',
                      fontWeight: 'bold',
                      marginLeft: '8px'
                    }}>
                      {engine.state.party.ether}/{engine.state.party.maxEther}
                    </span>
                  </div>
                </div>
              </div>

              {/* Attributes */}
              <div style={{
                background: 'rgba(168, 85, 247, 0.1)',
                border: '1px solid rgba(168, 85, 247, 0.3)',
                borderRadius: '8px',
                padding: '16px'
              }}>
                <h4 style={{ margin: '0 0 12px 0', color: '#a855f7' }}>Attributes</h4>
                <div style={{ fontSize: '14px', lineHeight: '1.6', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                  <div><strong>STR:</strong> {engine.state.party.stats.strength}</div>
                  <div><strong>DEX:</strong> {engine.state.party.stats.dexterity}</div>
                  <div><strong>CON:</strong> {engine.state.party.stats.constitution}</div>
                  <div><strong>INT:</strong> {engine.state.party.stats.intelligence}</div>
                  <div><strong>WIS:</strong> {engine.state.party.stats.wisdom}</div>
                  <div><strong>CHA:</strong> {engine.state.party.stats.charisma}</div>
                </div>
              </div>

              {/* Equipment */}
              <div style={{
                background: 'rgba(234, 179, 8, 0.1)',
                border: '1px solid rgba(234, 179, 8, 0.3)',
                borderRadius: '8px',
                padding: '16px'
              }}>
                <h4 style={{ margin: '0 0 12px 0', color: '#eab308' }}>Equipment</h4>
                <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
                  {engine.state.party.equipment.length > 0 ? (
                    engine.state.party.equipment.map((item, i) => (
                      <div key={i} style={{ color: '#4ade80' }}>{item.replace(/_/g, ' ')}</div>
                    ))
                  ) : (
                    <div style={{ color: '#94a3b8', fontStyle: 'italic' }}>No equipment</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'abilities' && (
          <div>
            <h3 style={{ margin: '0 0 20px 0', color: '#4ade80' }}>⚔️ Physical Abilities</h3>
            
            {/* Known Abilities */}
            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ margin: '0 0 12px 0', color: '#22c55e' }}>Known Abilities</h4>
              {engine.state.party.knownAbilities.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '8px' }}>
                  {engine.state.party.knownAbilities.map((ability, i) => (
                    <div key={i} style={{ 
                      padding: '8px 12px', 
                      background: 'rgba(34, 197, 94, 0.2)',
                      borderRadius: '6px',
                      border: '1px solid #22c55e',
                      fontSize: '13px'
                    }}>
                      {ability}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: '14px', color: '#94a3b8', fontStyle: 'italic' }}>
                  No physical abilities learned yet.
                </div>
              )}
            </div>

            {/* Available Abilities */}
            <div>
              <h4 style={{ margin: '0 0 12px 0', color: '#eab308' }}>Available to Learn</h4>
              {(() => {
                try {
                  const available = engine.getAvailablePhysicalAbilities().filter(
                    ability => !engine.state.party.knownAbilities.includes(ability.name)
                  );
                  
                  return available.length > 0 ? (
                    <div style={{ display: 'grid', gap: '12px' }}>
                      {available.slice(0, 6).map((ability, i) => (
                        <div key={i} style={{ 
                          padding: '16px', 
                          background: 'rgba(234, 179, 8, 0.2)',
                          borderRadius: '8px',
                          border: '1px solid #eab308'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 'bold', color: '#fbbf24', fontSize: '16px' }}>{ability.name}</div>
                              <div style={{ fontSize: '12px', color: '#e2e8f0', marginTop: '4px' }}>
                                {ability.school} • {ability.tier} • Stamina: {ability.staminaCost}
                              </div>
                              <div style={{ fontSize: '13px', color: '#cbd5e1', marginTop: '8px' }}>
                                {ability.description}
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                const success = engine.learnPhysicalAbility(ability.name);
                                if (success) {
                                  console.log(`Learned ${ability.name}!`);
                                }
                              }}
                              style={{
                                marginLeft: '12px',
                                padding: '8px 16px',
                                background: '#059669',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '12px',
                                fontWeight: 'bold'
                              }}
                            >
                              Learn
                            </button>
                          </div>
                        </div>
                      ))}
                      {available.length > 6 && (
                        <div style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic', textAlign: 'center', marginTop: '12px' }}>
                          ... and {available.length - 6} more abilities available
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ fontSize: '14px', color: '#94a3b8', fontStyle: 'italic' }}>
                      No new physical abilities available.
                    </div>
                  );
                } catch (error) {
                  console.error('Error getting physical abilities:', error);
                  return (
                    <div style={{ fontSize: '14px', color: '#ef4444' }}>
                      Error loading physical abilities
                    </div>
                  );
                }
              })()}
            </div>
          </div>
        )}

        {activeTab === 'spells' && (
          <div>
            <h3 style={{ margin: '0 0 20px 0', color: '#8b5cf6' }}>✨ Magical Spells</h3>
            
            {/* Known Spells */}
            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ margin: '0 0 12px 0', color: '#a855f7' }}>Known Spells</h4>
              {engine.state.party.knownSpells.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '8px' }}>
                  {engine.state.party.knownSpells.map((spell, i) => (
                    <div key={i} style={{ 
                      padding: '8px 12px', 
                      background: 'rgba(139, 92, 246, 0.2)',
                      borderRadius: '6px',
                      border: '1px solid #8b5cf6',
                      fontSize: '13px'
                    }}>
                      {spell}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: '14px', color: '#94a3b8', fontStyle: 'italic' }}>
                  No spells learned yet.
                </div>
              )}
            </div>

            {/* Available Spells */}
            <div>
              <h4 style={{ margin: '0 0 12px 0', color: '#06b6d4' }}>Available to Learn</h4>
              {(() => {
                try {
                  const available = engine.getAvailableMagicalSpells().filter(
                    spell => !engine.state.party.knownSpells.includes(spell.name)
                  );
                  
                  return available.length > 0 ? (
                    <div style={{ display: 'grid', gap: '12px' }}>
                      {available.slice(0, 6).map((spell, i) => (
                        <div key={i} style={{ 
                          padding: '16px', 
                          background: 'rgba(6, 182, 212, 0.2)',
                          borderRadius: '8px',
                          border: '1px solid #06b6d4'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 'bold', color: '#22d3ee', fontSize: '16px' }}>{spell.name}</div>
                              <div style={{ fontSize: '12px', color: '#e2e8f0', marginTop: '4px' }}>
                                {spell.school} • {spell.tier} • Ether: {spell.etherCost}
                                {spell.range && ` • Range: ${spell.range}`}
                              </div>
                              <div style={{ fontSize: '13px', color: '#cbd5e1', marginTop: '8px' }}>
                                {spell.description}
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                const success = engine.learnMagicalSpell(spell.name);
                                if (success) {
                                  console.log(`Learned ${spell.name}!`);
                                }
                              }}
                              style={{
                                marginLeft: '12px',
                                padding: '8px 16px',
                                background: '#0891b2',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '12px',
                                fontWeight: 'bold'
                              }}
                            >
                              Learn
                            </button>
                          </div>
                        </div>
                      ))}
                      {available.length > 6 && (
                        <div style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic', textAlign: 'center', marginTop: '12px' }}>
                          ... and {available.length - 6} more spells available
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ fontSize: '14px', color: '#94a3b8', fontStyle: 'italic' }}>
                      No new magical spells available.
                    </div>
                  );
                } catch (error) {
                  console.error('Error getting magical spells:', error);
                  return (
                    <div style={{ fontSize: '14px', color: '#ef4444' }}>
                      Error loading magical spells
                    </div>
                  );
                }
              })()}
            </div>
          </div>
        )}

        {activeTab === 'creation' && (
          <div>
            <h3 style={{ margin: '0 0 20px 0', color: '#f59e0b' }}>🔨 Creation Workshop</h3>
            
            <div style={{ marginBottom: '20px', fontSize: '14px', color: '#e2e8f0' }}>
              <p style={{ margin: '0 0 12px 0', fontStyle: 'italic' }}>
                Design your own custom abilities and spells! Combine different elements, effects, and properties 
                to create unique powers tailored to your playstyle.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
              {/* Physical Ability Creation */}
              <div style={{
                background: 'rgba(34, 197, 94, 0.1)',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                borderRadius: '8px',
                padding: '20px'
              }}>
                <h4 style={{ 
                  margin: '0 0 16px 0', 
                  color: '#4ade80',
                  borderBottom: '2px solid #4ade80',
                  paddingBottom: '8px'
                }}>
                  ⚔️ Physical Ability Designer
                </h4>
                
                <div style={{ fontSize: '12px', color: '#cbd5e1', marginBottom: '12px' }}>
                  <strong>Available Schools:</strong>
                </div>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(2, 1fr)', 
                  gap: '6px',
                  fontSize: '11px',
                  marginBottom: '16px'
                }}>
                  {['Weaponmastery', 'Combat', 'Athletics', 'Tactics', 'Survival', 'Stealth', 'Defense', 'Berserker'].map(school => (
                    <div key={school} style={{
                      padding: '6px 8px',
                      background: 'rgba(34, 197, 94, 0.2)',
                      borderRadius: '4px',
                      border: '1px solid #22c55e',
                      textAlign: 'center',
                      color: '#4ade80'
                    }}>
                      {school}
                    </div>
                  ))}
                </div>
                
                <div style={{ 
                  padding: '12px',
                  background: 'rgba(0, 0, 0, 0.3)',
                  borderRadius: '6px',
                  fontSize: '11px',
                  color: '#94a3b8'
                }}>
                  <div><strong>📋 Coming Soon:</strong></div>
                  <div>• Drag & drop ability components</div>
                  <div>• Custom stamina costs & requirements</div>
                  <div>• Multi-effect combinations</div>
                  <div>• Save/share custom abilities</div>
                </div>
              </div>

              {/* Magical Spell Creation */}
              <div style={{
                background: 'rgba(139, 92, 246, 0.1)',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                borderRadius: '8px',
                padding: '20px'
              }}>
                <h4 style={{ 
                  margin: '0 0 16px 0', 
                  color: '#8b5cf6',
                  borderBottom: '2px solid #8b5cf6',
                  paddingBottom: '8px'
                }}>
                  ✨ Spell Forge
                </h4>
                
                <div style={{ fontSize: '12px', color: '#cbd5e1', marginBottom: '12px' }}>
                  <strong>Available Schools:</strong>
                </div>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(2, 1fr)', 
                  gap: '6px',
                  fontSize: '11px',
                  marginBottom: '16px'
                }}>
                  {['Evocation', 'Enchantment', 'Transmutation', 'Divination', 'Conjuration', 'Necromancy', 'Illusion', 'Abjuration'].map(school => (
                    <div key={school} style={{
                      padding: '6px 8px',
                      background: 'rgba(139, 92, 246, 0.2)',
                      borderRadius: '4px',
                      border: '1px solid #8b5cf6',
                      textAlign: 'center',
                      color: '#a78bfa'
                    }}>
                      {school}
                    </div>
                  ))}
                </div>
                
                <div style={{ 
                  padding: '12px',
                  background: 'rgba(0, 0, 0, 0.3)',
                  borderRadius: '6px',
                  fontSize: '11px',
                  color: '#94a3b8'
                }}>
                  <div><strong>🧪 Coming Soon:</strong></div>
                  <div>• Elemental spell weaving</div>
                  <div>• Custom ether costs & casting times</div>
                  <div>• Area of effect designer</div>
                  <div>• Spell component requirements</div>
                </div>
              </div>
            </div>

            {/* Workshop Status */}
            <div style={{
              marginTop: '24px',
              padding: '16px',
              background: 'rgba(234, 179, 8, 0.1)',
              borderRadius: '8px',
              border: '1px solid rgba(234, 179, 8, 0.3)',
              fontSize: '14px',
              textAlign: 'center'
            }}>
              <div style={{ color: '#fbbf24', fontWeight: 'bold', marginBottom: '8px' }}>
                🚧 Workshop Under Construction
              </div>
              <div style={{ color: '#cbd5e1' }}>
                The creation system is being built! For now, discover abilities and spells 
                through exploration and leveling up.
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div>
            <h3 style={{ margin: '0 0 20px 0', color: '#6b7280' }}>⚙️ Game Settings</h3>
            
            <div style={{ display: 'grid', gap: '20px' }}>
              <div style={{
                background: 'rgba(107, 114, 128, 0.1)',
                border: '1px solid rgba(107, 114, 128, 0.3)',
                borderRadius: '8px',
                padding: '20px'
              }}>
                <h4 style={{ margin: '0 0 16px 0', color: '#9ca3af' }}>Display Settings</h4>
                
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <label style={{ fontSize: '14px', color: '#e2e8f0' }}>Show Grid</label>
                  <button
                    onClick={onToggleGrid}
                    style={{
                      padding: '6px 12px',
                      background: showGrid ? '#059669' : '#374151',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    {showGrid ? 'ON' : 'OFF'}
                  </button>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <label style={{ fontSize: '14px', color: '#e2e8f0' }}>Camera Lock</label>
                  <button
                    onClick={onToggleCameraLock}
                    style={{
                      padding: '6px 12px',
                      background: cameraLocked ? '#059669' : '#374151',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    {cameraLocked ? 'LOCKED' : 'FREE'}
                  </button>
                </div>
              </div>

              <div style={{
                background: 'rgba(107, 114, 128, 0.1)',
                border: '1px solid rgba(107, 114, 128, 0.3)',
                borderRadius: '8px',
                padding: '20px'
              }}>
                <h4 style={{ margin: '0 0 16px 0', color: '#9ca3af' }}>Game Information</h4>
                <div style={{ fontSize: '13px', lineHeight: '1.6', color: '#cbd5e1' }}>
                  <div><strong>Time:</strong> {stats.gameTime}</div>
                  <div><strong>Weather:</strong> {engine.state.weather.type} ({Math.round(engine.state.weather.intensity * 100)}%)</div>
                  <div><strong>Chunks Loaded:</strong> {(stats.chunks as any).loaded || 0}</div>
                  <div><strong>Discovered Tiles:</strong> {stats.discovered}</div>
                  <div>
                    <strong>Encounter Risk:</strong>
                    <span style={{ 
                      color: engine.state.encounterClock.riskLevel > 0.7 ? '#ef4444' : 
                             engine.state.encounterClock.riskLevel > 0.4 ? '#eab308' : '#4ade80',
                      fontWeight: 'bold',
                      marginLeft: '8px'
                    }}>
                      {Math.round(engine.state.encounterClock.riskLevel * 100)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}