/**
 * Game Modals - Handles all modal dialogs and popups
 */

import React from 'react';
import { WorldEngine, Encounter } from '../engine/index';

interface GameModalsProps {
  engine: WorldEngine;
  showWorldGenModal: boolean;
  onCloseWorldGenModal: () => void;
  onWorldGenSubmit: (config: any) => void;
  showEncounterModal: boolean;
  onCloseEncounterModal: () => void;
  onEncounterAction: (action: 'fight' | 'flee' | 'negotiate' | 'explore') => void;
  showCharacterModal: boolean;
  onCloseCharacterModal: () => void;
}

export default function GameModals({
  engine,
  showWorldGenModal,
  onCloseWorldGenModal,
  onWorldGenSubmit,
  showEncounterModal,
  onCloseEncounterModal,
  onEncounterAction,
  showCharacterModal,
  onCloseCharacterModal
}: GameModalsProps) {
  const activeEncounter = engine.getActiveEncounter();

  return (
    <>
      {/* World Generation Modal */}
      {showWorldGenModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            backgroundColor: '#1f2937',
            color: '#f9fafb',
            padding: '32px',
            borderRadius: '12px',
            border: '2px solid #374151',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '80vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ margin: 0, color: '#3b82f6' }}>🌍 World Generation Settings</h2>
              <button
                onClick={onCloseWorldGenModal}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  fontSize: '24px',
                  cursor: 'pointer'
                }}
              >
                ×
              </button>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <p style={{ color: '#cbd5e1', marginBottom: '16px' }}>
                Customize your world generation parameters. Changes will regenerate the entire world.
              </p>
              
              <div style={{ display: 'grid', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#e2e8f0' }}>
                    Sea Level (0.0 = No Ocean, 1.0 = All Ocean)
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    defaultValue={engine.state.config.world.seaLevel}
                    style={{ width: '100%' }}
                  />
                </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#e2e8f0' }}>
                    Continent Frequency (Lower = Larger Continents)
                  </label>
                  <input
                    type="range"
                    min="0.0001"
                    max="0.01"
                    step="0.0001"
                    defaultValue={engine.state.config.world.continentFreq}
                    style={{ width: '100%' }}
                  />
                </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#e2e8f0' }}>
                    Feature Frequency (Lower = Larger Features)
                  </label>
                  <input
                    type="range"
                    min="0.001"
                    max="0.1"
                    step="0.001"
                    defaultValue={engine.state.config.world.featureFreq}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={onCloseWorldGenModal}
                style={{
                  padding: '12px 24px',
                  background: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // For now, just close modal - actual config implementation needed
                  onWorldGenSubmit({});
                  onCloseWorldGenModal();
                }}
                style={{
                  padding: '12px 24px',
                  background: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Apply Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Encounter Modal */}
      {showEncounterModal && activeEncounter && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            backgroundColor: '#1f2937',
            color: '#f9fafb',
            padding: '32px',
            borderRadius: '12px',
            border: `3px solid ${
              activeEncounter.danger === 'extreme' ? '#dc2626' :
              activeEncounter.danger === 'high' ? '#ea580c' :
              activeEncounter.danger === 'medium' ? '#eab308' :
              activeEncounter.danger === 'low' ? '#65a30d' : '#059669'
            }`,
            maxWidth: '700px',
            width: '90%',
            maxHeight: '80vh',
            overflowY: 'auto',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8)'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{ 
                fontSize: '48px', 
                marginBottom: '16px',
                filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.8))'
              }}>
                {activeEncounter.type === 'combat' ? '⚔️' :
                 activeEncounter.type === 'discovery' ? '🗺️' :
                 activeEncounter.type === 'trader' ? '🏪' :
                 activeEncounter.type === 'event' ? '📜' : '❓'}
              </div>
              
              <h2 style={{ 
                margin: '0 0 8px 0', 
                color: '#f1f5f9',
                fontSize: '28px',
                textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)'
              }}>
                {activeEncounter.name}
              </h2>
              
              <div style={{
                display: 'inline-block',
                padding: '4px 12px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: 'bold',
                backgroundColor: 
                  activeEncounter.danger === 'extreme' ? 'rgba(220, 38, 38, 0.3)' :
                  activeEncounter.danger === 'high' ? 'rgba(234, 88, 12, 0.3)' :
                  activeEncounter.danger === 'medium' ? 'rgba(234, 179, 8, 0.3)' :
                  activeEncounter.danger === 'low' ? 'rgba(101, 163, 13, 0.3)' : 'rgba(5, 150, 105, 0.3)',
                color: 
                  activeEncounter.danger === 'extreme' ? '#fca5a5' :
                  activeEncounter.danger === 'high' ? '#fdba74' :
                  activeEncounter.danger === 'medium' ? '#fde047' :
                  activeEncounter.danger === 'low' ? '#a3e635' : '#6ee7b7',
                border: `1px solid ${
                  activeEncounter.danger === 'extreme' ? '#dc2626' :
                  activeEncounter.danger === 'high' ? '#ea580c' :
                  activeEncounter.danger === 'medium' ? '#eab308' :
                  activeEncounter.danger === 'low' ? '#65a30d' : '#059669'
                }`
              }}>
                {activeEncounter.danger.toUpperCase()} RISK
              </div>
            </div>

            <div style={{
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              padding: '20px',
              borderRadius: '8px',
              marginBottom: '24px',
              border: '1px solid rgba(75, 85, 99, 0.5)'
            }}>
              <p style={{ 
                margin: 0, 
                fontSize: '16px', 
                lineHeight: '1.6',
                color: '#e2e8f0'
              }}>
                {activeEncounter.description}
              </p>
            </div>

            {/* Potential Rewards */}
            {activeEncounter.rewards && (
              <div style={{ marginBottom: '24px' }}>
                <h4 style={{ margin: '0 0 12px 0', color: '#fbbf24' }}>💰 Potential Rewards</h4>
                <div style={{ 
                  fontSize: '14px', 
                  color: '#cbd5e1',
                  backgroundColor: 'rgba(251, 191, 36, 0.1)',
                  padding: '12px',
                  borderRadius: '6px',
                  border: '1px solid rgba(251, 191, 36, 0.3)'
                }}>
                  {activeEncounter.rewards.experience && (
                    <div>🎓 Experience: {activeEncounter.rewards.experience}</div>
                  )}
                  {activeEncounter.rewards.gold && (
                    <div>💰 Gold: {activeEncounter.rewards.gold}</div>
                  )}
                  {activeEncounter.rewards.items && activeEncounter.rewards.items.length > 0 && (
                    <div>🎒 Items: {activeEncounter.rewards.items.join(', ')}</div>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', 
              gap: '12px' 
            }}>
              {activeEncounter.type === 'combat' && (
                <>
                  <button
                    onClick={() => onEncounterAction('fight')}
                    style={{
                      padding: '12px 16px',
                      background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      boxShadow: '0 4px 8px rgba(220, 38, 38, 0.3)'
                    }}
                  >
                    ⚔️ Fight
                  </button>
                  <button
                    onClick={() => onEncounterAction('flee')}
                    style={{
                      padding: '12px 16px',
                      background: 'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      boxShadow: '0 4px 8px rgba(234, 179, 8, 0.3)'
                    }}
                  >
                    🏃 Flee
                  </button>
                </>
              )}
              
              {(activeEncounter.type === 'trader' || activeEncounter.type === 'event') && (
                <button
                  onClick={() => onEncounterAction('negotiate')}
                  style={{
                    padding: '12px 16px',
                    background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    boxShadow: '0 4px 8px rgba(59, 130, 246, 0.3)'
                  }}
                >
                  💬 Interact
                </button>
              )}
              
              {activeEncounter.type === 'discovery' && (
                <button
                  onClick={() => onEncounterAction('explore')}
                  style={{
                    padding: '12px 16px',
                    background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    boxShadow: '0 4px 8px rgba(5, 150, 105, 0.3)'
                  }}
                >
                  🔍 Explore
                </button>
              )}
              
              {/* Always show dismiss option */}
              <button
                onClick={onCloseEncounterModal}
                style={{
                  padding: '12px 16px',
                  background: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  boxShadow: '0 4px 8px rgba(107, 114, 128, 0.3)'
                }}
              >
                🚪 Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Character Info Modal */}
      {showCharacterModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            backgroundColor: '#1f2937',
            color: '#f9fafb',
            padding: '32px',
            borderRadius: '12px',
            border: '2px solid #374151',
            maxWidth: '800px',
            width: '90%',
            maxHeight: '80vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ margin: 0, color: '#3b82f6' }}>👤 Character Information</h2>
              <button
                onClick={onCloseCharacterModal}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  fontSize: '24px',
                  cursor: 'pointer'
                }}
              >
                ×
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
              {/* Basic Stats */}
              <div style={{
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                borderRadius: '8px',
                padding: '20px'
              }}>
                <h3 style={{ margin: '0 0 16px 0', color: '#60a5fa' }}>Character Stats</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', fontSize: '14px' }}>
                  <div><strong>Level:</strong> {engine.state.party.level}</div>
                  <div><strong>Experience:</strong> {engine.state.party.experience}/{engine.state.party.level * 100}</div>
                  <div><strong>HP:</strong> {engine.state.party.hitPoints}/{engine.state.party.maxHitPoints}</div>
                  <div><strong>Stamina:</strong> {engine.state.party.stamina}/{engine.state.party.maxStamina}</div>
                  <div><strong>Ether:</strong> {engine.state.party.ether}/{engine.state.party.maxEther}</div>
                  <div><strong>Gold:</strong> {engine.state.party.supplies.gold}</div>
                </div>
              </div>

              {/* Attributes */}
              <div style={{
                backgroundColor: 'rgba(168, 85, 247, 0.1)',
                border: '1px solid rgba(168, 85, 247, 0.3)',
                borderRadius: '8px',
                padding: '20px'
              }}>
                <h3 style={{ margin: '0 0 16px 0', color: '#a855f7' }}>Attributes</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', fontSize: '14px' }}>
                  <div><strong>STR:</strong> {engine.state.party.stats.strength}</div>
                  <div><strong>DEX:</strong> {engine.state.party.stats.dexterity}</div>
                  <div><strong>CON:</strong> {engine.state.party.stats.constitution}</div>
                  <div><strong>INT:</strong> {engine.state.party.stats.intelligence}</div>
                  <div><strong>WIS:</strong> {engine.state.party.stats.wisdom}</div>
                  <div><strong>CHA:</strong> {engine.state.party.stats.charisma}</div>
                </div>
              </div>

              {/* Abilities & Spells */}
              <div style={{
                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                borderRadius: '8px',
                padding: '20px'
              }}>
                <h3 style={{ margin: '0 0 16px 0', color: '#4ade80' }}>Known Abilities</h3>
                <div style={{ fontSize: '13px' }}>
                  {engine.state.party.knownAbilities.length > 0 ? (
                    engine.state.party.knownAbilities.map((ability, i) => (
                      <div key={i} style={{ 
                        padding: '4px 8px', 
                        margin: '2px',
                        backgroundColor: 'rgba(34, 197, 94, 0.2)',
                        borderRadius: '4px',
                        display: 'inline-block'
                      }}>
                        {ability}
                      </div>
                    ))
                  ) : (
                    <div style={{ color: '#9ca3af', fontStyle: 'italic' }}>No abilities learned</div>
                  )}
                </div>
              </div>

              <div style={{
                backgroundColor: 'rgba(139, 92, 246, 0.1)',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                borderRadius: '8px',
                padding: '20px'
              }}>
                <h3 style={{ margin: '0 0 16px 0', color: '#8b5cf6' }}>Known Spells</h3>
                <div style={{ fontSize: '13px' }}>
                  {engine.state.party.knownSpells.length > 0 ? (
                    engine.state.party.knownSpells.map((spell, i) => (
                      <div key={i} style={{ 
                        padding: '4px 8px', 
                        margin: '2px',
                        backgroundColor: 'rgba(139, 92, 246, 0.2)',
                        borderRadius: '4px',
                        display: 'inline-block'
                      }}>
                        {spell}
                      </div>
                    ))
                  ) : (
                    <div style={{ color: '#9ca3af', fontStyle: 'italic' }}>No spells learned</div>
                  )}
                </div>
              </div>

              {/* Equipment */}
              <div style={{
                backgroundColor: 'rgba(234, 179, 8, 0.1)',
                border: '1px solid rgba(234, 179, 8, 0.3)',
                borderRadius: '8px',
                padding: '20px',
                gridColumn: 'span 2'
              }}>
                <h3 style={{ margin: '0 0 16px 0', color: '#eab308' }}>Equipment & Supplies</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', fontSize: '14px' }}>
                  <div>
                    <strong>Equipment:</strong>
                    <div style={{ marginTop: '8px' }}>
                      {engine.state.party.equipment.length > 0 ? (
                        engine.state.party.equipment.map((item, i) => (
                          <div key={i} style={{ 
                            padding: '4px 8px', 
                            margin: '2px',
                            backgroundColor: 'rgba(234, 179, 8, 0.2)',
                            borderRadius: '4px',
                            display: 'inline-block'
                          }}>
                            {item.replace(/_/g, ' ')}
                          </div>
                        ))
                      ) : (
                        <div style={{ color: '#9ca3af', fontStyle: 'italic' }}>No equipment</div>
                      )}
                    </div>
                  </div>
                  <div>
                    <strong>Supplies:</strong>
                    <div style={{ marginTop: '8px' }}>
                      <div>Food: {engine.state.party.supplies.food}</div>
                      <div>Water: {engine.state.party.supplies.water}</div>
                      <div>Gold: {engine.state.party.supplies.gold}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}