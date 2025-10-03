/**
 * Game Modals - Handles all modal dialogs and popups
 */

import React from 'react';
import { WorldEngine, Encounter } from '../../core/engine';

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
            border: `3px solid ${activeEncounter.danger === 'extreme' ? '#dc2626' :
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
                border: `1px solid ${activeEncounter.danger === 'extreme' ? '#dc2626' :
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
            maxWidth: '900px',
            width: '95%',
            maxHeight: '85vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ margin: 0, color: '#3b82f6' }}>� Party Characters</h2>
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

            <CharacterList engine={engine} />
          </div>
        </div>
      )}
    </>
  );
}

// Character List Component
function CharacterList({ engine }: { engine: { getPartyCharacters: () => any[] } }) {
  const characters = engine.getPartyCharacters();

  if (characters.length === 0) {
    return (
      <div style={{
        padding: '32px',
        textAlign: 'center',
        background: 'rgba(239, 68, 68, 0.1)',
        border: '1px solid rgba(239, 68, 68, 0.3)',
        borderRadius: '8px',
        color: '#fca5a5'
      }}>
        <h3 style={{ margin: '0 0 16px 0' }}>⚠️ No Characters in Party</h3>
        <p style={{ margin: 0, fontSize: '14px' }}>
          Add characters to your party to view their information and manage their abilities.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gap: '20px' }}>
      {characters.map((char, index) => (
        <div key={char.id} style={{
          background: 'rgba(59, 130, 246, 0.1)',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          borderRadius: '8px',
          padding: '20px'
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: '20px', alignItems: 'start' }}>
            {/* Character Portrait */}
            <div style={{
              width: '64px',
              height: '64px',
              background: 'rgba(99, 102, 241, 0.2)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '32px'
            }}>
              👤
            </div>

            {/* Character Info */}
            <div>
              <h3 style={{ margin: '0 0 8px 0', color: '#60a5fa' }}>{char.name}</h3>
              <div style={{ fontSize: '14px', color: '#cbd5e1', marginBottom: '12px' }}>
                Level {char.level} {char.species} {char.archetype} • {char.gender}
              </div>

              {/* Stats Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' }}>
                <div style={{ fontSize: '12px' }}>
                  <div style={{ color: '#94a3b8' }}>Health</div>
                  <div style={{ color: '#4ade80', fontWeight: 'bold' }}>{char.hitPoints}/{char.maxHitPoints}</div>
                </div>
                <div style={{ fontSize: '12px' }}>
                  <div style={{ color: '#94a3b8' }}>Stamina</div>
                  <div style={{ color: '#facc15', fontWeight: 'bold' }}>{char.stamina}/{char.maxStamina}</div>
                </div>
                <div style={{ fontSize: '12px' }}>
                  <div style={{ color: '#94a3b8' }}>Ether</div>
                  <div style={{ color: '#8b5cf6', fontWeight: 'bold' }}>{char.ether}/{char.maxEther}</div>
                </div>
              </div>

              {/* Attributes */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '8px', fontSize: '11px' }}>
                <div><span style={{ color: '#94a3b8' }}>STR:</span> {char.stats.strength}</div>
                <div><span style={{ color: '#94a3b8' }}>DEX:</span> {char.stats.dexterity}</div>
                <div><span style={{ color: '#94a3b8' }}>CON:</span> {char.stats.constitution}</div>
                <div><span style={{ color: '#94a3b8' }}>INT:</span> {char.stats.intelligence}</div>
                <div><span style={{ color: '#94a3b8' }}>WIS:</span> {char.stats.wisdom}</div>
                <div><span style={{ color: '#94a3b8' }}>CHA:</span> {char.stats.charisma}</div>
              </div>
            </div>

            {/* Experience Bar */}
            <div style={{ minWidth: '120px' }}>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>
                XP: {char.experience}
              </div>
              <div style={{
                width: '100%',
                height: '8px',
                background: 'rgba(75, 85, 99, 0.5)',
                borderRadius: '4px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${(char.experience % 100)}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #3b82f6, #60a5fa)',
                  borderRadius: '4px'
                }} />
              </div>
            </div>
          </div>

          {/* Abilities and Spells */}
          <div style={{ marginTop: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <h4 style={{ margin: '0 0 8px 0', color: '#4ade80', fontSize: '14px' }}>⚔️ Abilities ({char.knownAbilities.length})</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {char.knownAbilities.length > 0 ?
                  char.knownAbilities.slice(0, 3).map((ability: string, i: number) => (
                    <div key={i} style={{
                      padding: '2px 6px',
                      background: 'rgba(34, 197, 94, 0.2)',
                      borderRadius: '4px',
                      fontSize: '10px',
                      color: '#4ade80'
                    }}>
                      {ability}
                    </div>
                  )) :
                  <div style={{ fontSize: '10px', color: '#6b7280', fontStyle: 'italic' }}>None learned</div>
                }
                {char.knownAbilities.length > 3 && (
                  <div style={{ fontSize: '10px', color: '#6b7280' }}>+{char.knownAbilities.length - 3} more</div>
                )}
              </div>
            </div>

            <div>
              <h4 style={{ margin: '0 0 8px 0', color: '#8b5cf6', fontSize: '14px' }}>✨ Spells ({char.knownSpells.length})</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {char.knownSpells.length > 0 ?
                  char.knownSpells.slice(0, 3).map((spell: string, i: number) => (
                    <div key={i} style={{
                      padding: '2px 6px',
                      background: 'rgba(139, 92, 246, 0.2)',
                      borderRadius: '4px',
                      fontSize: '10px',
                      color: '#8b5cf6'
                    }}>
                      {spell}
                    </div>
                  )) :
                  <div style={{ fontSize: '10px', color: '#6b7280', fontStyle: 'italic' }}>None learned</div>
                }
                {char.knownSpells.length > 3 && (
                  <div style={{ fontSize: '10px', color: '#6b7280' }}>+{char.knownSpells.length - 3} more</div>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
