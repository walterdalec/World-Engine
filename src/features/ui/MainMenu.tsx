import React, { useState, useEffect, useCallback } from 'react';
import { storage } from "../../core/services/storage";
import { SimplePortraitPreview } from '../portraits';

interface Campaign {
  id: string;
  name: string;
  worldPreset: string;
  seed: string;
  createdAt: string;
  lastPlayed: string;
  characters: string[]; // Character IDs
}

interface SavedCharacter {
  id: string;
  name: string;
  race: string;
  characterClass: string;
  level: number;
  createdAt: string;
  data: any; // Full character data
}

interface Props {
  onNewCampaign: () => void;
  onLoadCampaign: (_campaign: Campaign) => void;
  onNameGenerator: () => void;
  onSpellGenerator: () => void;
  onSpellAssignment: () => void;
  onHealingSystem: () => void;
  onCharacterCreate: () => void;
  onClassicCharacterCreate?: () => void;
  onPortraitTest: () => void;
  onAutoUpdater: () => void;
  onBrigandineHex?: () => void;
  onEnhancedMap: () => void;
  onSimpleMap: () => void;
  onHexMap?: () => void;
  onSmoothMap?: () => void;
  onCombatUIDemo: () => void;
  onProcedural: () => void;
  onEncounters?: () => void;
  onIntegratedCampaign?: () => void;
  onEngineTest?: () => void;
  onTimeSystemDemo?: () => void;
  onFactionAIDemo?: () => void;
  onPartyFrameworkDemo?: () => void;
}

export function MainMenu({ onNewCampaign, onLoadCampaign, onNameGenerator, onSpellGenerator, onSpellAssignment, onHealingSystem, onCharacterCreate, onClassicCharacterCreate, onPortraitTest, onAutoUpdater, onBrigandineHex, onEnhancedMap, onSimpleMap, onHexMap, onSmoothMap, onCombatUIDemo, onProcedural, onEncounters, onIntegratedCampaign, onEngineTest, onTimeSystemDemo, onFactionAIDemo, onPartyFrameworkDemo }: Props) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [characters, setCharacters] = useState<SavedCharacter[]>([]);
  const [activeTab, setActiveTab] = useState<'campaigns' | 'characters'>('campaigns');
  const [selectedCharacter, setSelectedCharacter] = useState<SavedCharacter | null>(null);

  // Enhanced recovery function (matches the one in index.tsx)
  const recoverCampaigns = useCallback(() => {
    try {
      // Try primary storage first
      let campaigns = JSON.parse(storage.local.getItem('world-engine-campaigns') || '[]');

      if (campaigns.length === 0) {
        // Try backup storage
        const backup = JSON.parse(storage.local.getItem('world-engine-campaigns-backup') || '{}');
        if (backup.campaigns && backup.campaigns.length > 0) {
          campaigns = backup.campaigns;
          storage.local.setItem('world-engine-campaigns', JSON.stringify(campaigns));
          console.log('Recovered campaigns from backup storage');
        }
      }

      if (campaigns.length === 0) {
        // Try session storage
        const sessionCampaigns = JSON.parse(storage.session.getItem('world-engine-campaigns-session') || '[]');
        if (sessionCampaigns.length > 0) {
          campaigns = sessionCampaigns;
          storage.local.setItem('world-engine-campaigns', JSON.stringify(campaigns));
          console.log('Recovered campaigns from session storage');
        }
      }

      return campaigns;
    } catch (error) {
      console.error('Error recovering campaigns:', error);
      return [];
    }
  }, []);

  const loadCampaigns = useCallback(() => {
    try {
      const recovered = recoverCampaigns();
      setCampaigns(recovered);
    } catch (error) {
      console.error('Error loading campaigns:', error);
      setCampaigns([]);
    }
  }, [recoverCampaigns]);

  const loadCharacters = useCallback(() => {
    try {
      const saved = storage.local.getItem('world-engine-characters');
      if (saved) {
        setCharacters(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading characters:', error);
    }
  }, []);

  const deleteCampaign = (campaignId: string) => {
    const updated = campaigns.filter(c => c.id !== campaignId);
    setCampaigns(updated);
    storage.local.setItem('world-engine-campaigns', JSON.stringify(updated));
  };

  useEffect(() => {
    // Load saved campaigns and characters from localStorage
    loadCampaigns();
    loadCharacters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const deleteCharacter = (characterId: string) => {
    const updated = characters.filter(c => c.id !== characterId);
    setCharacters(updated);
    storage.local.setItem('world-engine-characters', JSON.stringify(updated));
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Backup and recovery functions
  const downloadBackup = () => {
    try {
      const backup = {
        campaigns,
        characters,
        exportDate: new Date().toISOString(),
        version: '2.0',
        worldEngineVersion: 'v1.0.0'
      };

      const dataStr = JSON.stringify(backup, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `world-engine-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);
      alert('Backup downloaded successfully!');
    } catch (error) {
      console.error('Error downloading backup:', error);
      alert('Failed to download backup');
    }
  };

  const handleImportBackup = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const backup = JSON.parse(e.target?.result as string);

        if (backup.campaigns && Array.isArray(backup.campaigns)) {
          // Save campaigns
          storage.local.setItem('world-engine-campaigns', JSON.stringify(backup.campaigns));
          storage.local.setItem('world-engine-campaigns-backup', JSON.stringify(backup));
          setCampaigns(backup.campaigns);
        }

        if (backup.characters && Array.isArray(backup.characters)) {
          // Save characters
          storage.local.setItem('world-engine-characters', JSON.stringify(backup.characters));
          storage.local.setItem('world-engine-characters-backup', JSON.stringify(backup.characters));
          setCharacters(backup.characters);
        }

        alert(`Backup imported successfully!
Campaigns: ${backup.campaigns?.length || 0}
Characters: ${backup.characters?.length || 0}`);
      } catch (error) {
        console.error('Error importing backup:', error);
        alert('Invalid backup file format');
      }
    };
    reader.readAsText(file);

    // Reset input value so same file can be selected again
    event.target.value = '';
  };

  const forceRecovery = () => {
    try {
      const recovered = recoverCampaigns();
      setCampaigns(recovered);

      // Try to recover characters too
      const backupChars = storage.local.getItem('world-engine-characters-backup');
      if (backupChars) {
        const chars = JSON.parse(backupChars);
        if (Array.isArray(chars)) {
          storage.local.setItem('world-engine-characters', JSON.stringify(chars));
          setCharacters(chars);
        }
      }

      alert(`Recovery attempt completed!
Recovered ${recovered.length} campaigns`);
    } catch (error) {
      console.error('Error during recovery:', error);
      alert('Recovery failed');
    }
  };

  const menuStyle: React.CSSProperties = {
    background: 'linear-gradient(135deg, #0c1426 0%, #1e293b 100%)',
    minHeight: '100vh',
    color: '#f8fafc',
    fontFamily: 'system-ui, -apple-system, sans-serif'
  };

  const headerStyle: React.CSSProperties = {
    textAlign: 'center',
    padding: '40px 20px',
    borderBottom: '1px solid #334155'
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '3rem',
    fontWeight: 'bold',
    margin: '0 0 10px 0',
    background: 'linear-gradient(45deg, #3b82f6, #8b5cf6)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text'
  };

  const subtitleStyle: React.CSSProperties = {
    fontSize: '1.2rem',
    color: '#94a3b8',
    margin: 0
  };

  const containerStyle: React.CSSProperties = {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '40px 20px'
  };

  const tabsStyle: React.CSSProperties = {
    display: 'flex',
    marginBottom: '30px',
    borderBottom: '1px solid #334155'
  };

  const tabStyle = (isActive: boolean): React.CSSProperties => ({
    padding: '12px 24px',
    background: 'none',
    border: 'none',
    color: isActive ? '#3b82f6' : '#94a3b8',
    fontSize: '1.1rem',
    fontWeight: isActive ? '600' : '400',
    cursor: 'pointer',
    borderBottom: isActive ? '2px solid #3b82f6' : '2px solid transparent',
    transition: 'all 0.2s ease'
  });

  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '20px',
    marginBottom: '30px'
  };

  const cardStyle: React.CSSProperties = {
    background: '#1e293b',
    border: '1px solid #334155',
    borderRadius: '12px',
    padding: '20px',
    transition: 'all 0.2s ease',
    cursor: 'pointer'
  };

  const newCardStyle: React.CSSProperties = {
    ...cardStyle,
    background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
    border: '1px solid #10b981',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '120px'
  };

  const buttonStyle: React.CSSProperties = {
    background: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    padding: '8px 16px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    transition: 'background 0.2s ease'
  };

  const deleteButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    background: '#dc2626',
    marginLeft: '8px'
  };

  // Character Detail Modal Component
  const CharacterDetailModal = ({ character, onClose }: { character: SavedCharacter; onClose: () => void }) => {
    const modalOverlayStyle: React.CSSProperties = {
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      background: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
      padding: '20px'
    };

    const modalContentStyle: React.CSSProperties = {
      background: '#1e293b',
      border: '1px solid #334155',
      borderRadius: '12px',
      padding: '30px',
      maxWidth: '600px',
      maxHeight: '80vh',
      width: '100%',
      overflowY: 'auto',
      color: '#f8fafc'
    };

    const statGridStyle: React.CSSProperties = {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
      gap: '15px',
      margin: '20px 0'
    };

    const statBoxStyle: React.CSSProperties = {
      background: '#0f172a',
      padding: '12px',
      borderRadius: '8px',
      textAlign: 'center',
      border: '1px solid #334155'
    };

    return (
      <div style={modalOverlayStyle} onClick={onClose}>
        <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ margin: 0, color: '#3b82f6' }}>{character.name}</h2>
            <button
              onClick={onClose}
              style={{
                background: '#374151',
                color: '#f8fafc',
                border: 'none',
                borderRadius: '6px',
                padding: '8px 12px',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              ✕
            </button>
          </div>

          <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
            {character.data?.name && character.data?.species && character.data?.archetype && character.data?.gender ? (
              <SimplePortraitPreview
                gender={character.data.gender.toLowerCase() as 'male' | 'female'}
                species={character.data.species.toLowerCase()}
                archetype={character.data.archetype.toLowerCase()}
                size="small"
              />
            ) : (
              <div style={{
                width: 120,
                height: 120,
                background: '#374151',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#9ca3af',
                fontSize: '24px',
                flexShrink: 0
              }}>
                👤
              </div>
            )}
            <div style={{ flex: 1 }}>
              <p style={{ margin: '5px 0', fontSize: '18px' }}>
                <strong>{character.race} {character.characterClass}</strong>
              </p>
              <p style={{ margin: '5px 0', color: '#94a3b8' }}>Level {character.level}</p>
              <p style={{ margin: '5px 0', color: '#64748b', fontSize: '14px' }}>
                Created: {formatDate(character.createdAt)}
              </p>
            </div>
          </div>

          {character.data && (
            <>
              {character.data.gender && (
                <div style={{ marginBottom: '15px' }}>
                  <h4 style={{ margin: '0 0 8px 0', color: '#8b5cf6' }}>Gender</h4>
                  <p style={{ margin: 0, color: '#e2e8f0' }}>{character.data.gender}</p>
                </div>
              )}

              {character.data.background && (
                <div style={{ marginBottom: '15px' }}>
                  <h4 style={{ margin: '0 0 8px 0', color: '#8b5cf6' }}>Background</h4>
                  <p style={{ margin: 0, color: '#e2e8f0' }}>{character.data.background}</p>
                </div>
              )}

              {character.data.stats && (
                <div style={{ marginBottom: '20px' }}>
                  <h4 style={{ margin: '0 0 12px 0', color: '#8b5cf6' }}>Ability Scores</h4>
                  <div style={statGridStyle}>
                    {Object.entries(character.data.stats).map(([stat, value]) => {
                      const numValue = Number(value);
                      return (
                        <div key={stat} style={statBoxStyle}>
                          <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#94a3b8', marginBottom: '4px' }}>
                            {stat.toUpperCase()}
                          </div>
                          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#f1f5f9' }}>{numValue}</div>
                          <div style={{ fontSize: '12px', color: '#64748b' }}>
                            {numValue >= 10 ? '+' : ''}{Math.floor((numValue - 10) / 2)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {character.data.traits && character.data.traits.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                  <h4 style={{ margin: '0 0 12px 0', color: '#8b5cf6' }}>Traits</h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {character.data.traits.map((trait: string, _index: number) => (
                      <span
                        key={_index}
                        style={{
                          background: '#0f172a',
                          color: '#e2e8f0',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          border: '1px solid #334155'
                        }}
                      >
                        {trait}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {((character.data.knownCantrips && character.data.knownCantrips.length > 0) ||
                (character.data.knownSpells && character.data.knownSpells.length > 0)) && (
                  <div style={{ marginBottom: '20px' }}>
                    <h4 style={{ margin: '0 0 12px 0', color: '#8b5cf6' }}>Spells & Magic</h4>

                    {character.data.level && (
                      <p style={{ margin: '0 0 8px 0', color: '#94a3b8', fontSize: '14px' }}>
                        Level {character.data.level} Character
                      </p>
                    )}

                    {character.data.knownCantrips && character.data.knownCantrips.length > 0 && (
                      <div style={{ marginBottom: '12px' }}>
                        <h5 style={{ margin: '0 0 6px 0', color: '#ec4899' }}>Known Cantrips:</h5>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          {character.data.knownCantrips.map((cantrip: string, _index: number) => (
                            <span
                              key={_index}
                              style={{
                                background: '#ec4899',
                                color: 'white',
                                padding: '3px 8px',
                                borderRadius: '4px',
                                fontSize: '11px',
                                fontWeight: 'bold'
                              }}
                            >
                              {cantrip}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {character.data.knownSpells && character.data.knownSpells.length > 0 && (
                      <div>
                        <h5 style={{ margin: '0 0 6px 0', color: '#3b82f6' }}>Known Spells:</h5>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          {character.data.knownSpells.map((spell: string, _index: number) => (
                            <span
                              key={_index}
                              style={{
                                background: '#3b82f6',
                                color: 'white',
                                padding: '3px 8px',
                                borderRadius: '4px',
                                fontSize: '11px',
                                fontWeight: 'bold'
                              }}
                            >
                              {spell}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

              {character.data.mode && (
                <div style={{ marginBottom: '15px' }}>
                  <h4 style={{ margin: '0 0 8px 0', color: '#8b5cf6' }}>Creation Method</h4>
                  <p style={{ margin: 0, color: '#e2e8f0' }}>
                    {character.data.mode === 'POINT_BUY' ? 'Point Buy System' : 'Dice Roll'}
                  </p>
                </div>
              )}
            </>
          )}

          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <button
              onClick={onClose}
              style={{
                ...buttonStyle,
                background: '#059669',
                padding: '10px 20px',
                fontSize: '16px'
              }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={menuStyle}>
      <div style={headerStyle}>
        <h1 style={titleStyle}>World Engine</h1>
        <p style={subtitleStyle}>Campaign & Character Management</p>

        {/* Backup and Recovery Controls */}
        <div style={{
          marginTop: '20px',
          display: 'flex',
          gap: '12px',
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={downloadBackup}
            style={{
              ...buttonStyle,
              background: '#059669',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            💾 Download Backup
          </button>

          <label style={{
            ...buttonStyle,
            background: '#7c3aed',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer'
          }}>
            📂 Import Backup
            <input
              type="file"
              accept=".json"
              onChange={handleImportBackup}
              style={{ display: 'none' }}
            />
          </label>

          <button
            onClick={forceRecovery}
            style={{
              ...buttonStyle,
              background: '#dc2626',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            🔄 Force Recovery
          </button>
        </div>

        <p style={{
          fontSize: '0.85rem',
          color: '#64748b',
          marginTop: '12px',
          fontStyle: 'italic'
        }}>
          💡 Auto-saves every 10 campaign saves • Backup before major changes
        </p>
      </div>

      <div style={containerStyle}>
        <div style={tabsStyle}>
          <button
            style={tabStyle(activeTab === 'campaigns')}
            onClick={() => setActiveTab('campaigns')}
          >
            Campaigns
          </button>
          <button
            style={tabStyle(activeTab === 'characters')}
            onClick={() => setActiveTab('characters')}
          >
            Character Library
          </button>
        </div>

        {activeTab === 'campaigns' && (
          <div>
            <div style={gridStyle}>
              <div style={newCardStyle} onClick={onNewCampaign}>
                <div style={{ fontSize: '3rem', marginBottom: '10px' }}>+</div>
                <h3 style={{ margin: '0 0 5px 0' }}>New Campaign</h3>
                <p style={{ margin: 0, opacity: 0.9 }}>Start a new adventure</p>
              </div>

              {onIntegratedCampaign && (
                <div style={{ ...newCardStyle, background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' }} onClick={onIntegratedCampaign}>
                  <div style={{ fontSize: '3rem', marginBottom: '10px' }}>🌍</div>
                  <h3 style={{ margin: '0 0 5px 0' }}>Integrated Campaign</h3>
                  <p style={{ margin: 0, opacity: 0.9 }}>All systems working together!</p>
                </div>
              )}

              {onEngineTest && (
                <div style={{ ...newCardStyle, background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }} onClick={onEngineTest}>
                  <div style={{ fontSize: '3rem', marginBottom: '10px' }}>⚙️</div>
                  <h3 style={{ margin: '0 0 5px 0' }}>Engine Test (Canvas 01)</h3>
                  <p style={{ margin: 0, opacity: 0.9 }}>New engine skeleton</p>
                </div>
              )}

              {onTimeSystemDemo && (
                <div style={{ ...newCardStyle, background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }} onClick={onTimeSystemDemo}>
                  <div style={{ fontSize: '3rem', marginBottom: '10px' }}>⏰</div>
                  <h3 style={{ margin: '0 0 5px 0' }}>Time System (Canvas 08)</h3>
                  <p style={{ margin: 0, opacity: 0.9 }}>Pause, speed control, idle policies</p>
                </div>
              )}

              {onFactionAIDemo && (
                <div style={{ ...newCardStyle, background: 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)' }} onClick={onFactionAIDemo}>
                  <div style={{ fontSize: '3rem', marginBottom: '10px' }}>🏛️</div>
                  <h3 style={{ margin: '0 0 5px 0' }}>Faction AI (Canvas 09)</h3>
                  <p style={{ margin: 0, opacity: 0.9 }}>Autonomous factions with goals & planning</p>
                </div>
              )}

              {onPartyFrameworkDemo && (
                <div style={{ ...newCardStyle, background: 'linear-gradient(135deg, #f59e0b 0%, #dc2626 100%)' }} onClick={onPartyFrameworkDemo}>
                  <div style={{ fontSize: '3rem', marginBottom: '10px' }}>👥</div>
                  <h3 style={{ margin: '0 0 5px 0' }}>Party Framework (Canvas 10)</h3>
                  <p style={{ margin: 0, opacity: 0.9 }}>Hero + Hirelings with wages & morale</p>
                </div>
              )}

              {campaigns.map(campaign => (
                <div key={campaign.id} style={cardStyle}>
                  <h3 style={{ margin: '0 0 10px 0', color: '#f1f5f9' }}>{campaign.name}</h3>
                  <p style={{ margin: '0 0 5px 0', color: '#94a3b8', fontSize: '0.9rem' }}>
                    World: {campaign.worldPreset || 'Custom'}
                  </p>
                  <p style={{ margin: '0 0 5px 0', color: '#94a3b8', fontSize: '0.9rem' }}>
                    Seed: {campaign.seed.substring(0, 20)}...
                  </p>
                  <p style={{ margin: '0 0 15px 0', color: '#64748b', fontSize: '0.8rem' }}>
                    Last played: {formatDate(campaign.lastPlayed)}
                  </p>
                  <div>
                    <button
                      style={buttonStyle}
                      onClick={() => onLoadCampaign(campaign)}
                    >
                      Load Campaign
                    </button>
                    <button
                      style={deleteButtonStyle}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm('Delete this campaign?')) {
                          deleteCampaign(campaign.id);
                        }
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {campaigns.length === 0 && (
              <div style={{ textAlign: 'center', color: '#64748b', fontSize: '1.1rem', marginTop: '60px' }}>
                <p>No campaigns yet. Create your first campaign to begin!</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'characters' && (
          <div>
            <div style={gridStyle}>
              <div style={newCardStyle} onClick={onCharacterCreate}>
                <div style={{ fontSize: '3rem', marginBottom: '10px' }}>⚔️</div>
                <h3 style={{ margin: '0 0 5px 0' }}>Character Creator</h3>
                <p style={{ margin: 0, opacity: 0.9 }}>Create new characters</p>
              </div>

              {onClassicCharacterCreate && (
                <div style={newCardStyle} onClick={onClassicCharacterCreate}>
                  <div style={{ fontSize: '3rem', marginBottom: '10px' }}>🏰</div>
                  <h3 style={{ margin: '0 0 5px 0' }}>Classic Creator</h3>
                  <p style={{ margin: 0, opacity: 0.9 }}>M&M 1-2 style creator</p>
                </div>
              )}

              <div style={newCardStyle} onClick={onNameGenerator}>
                <div style={{ fontSize: '3rem', marginBottom: '10px' }}>📜</div>
                <h3 style={{ margin: '0 0 5px 0' }}>Name Generator</h3>
                <p style={{ margin: 0, opacity: 0.9 }}>Generate fantasy names</p>
              </div>

              <div style={newCardStyle} onClick={onSpellGenerator}>
                <div style={{ fontSize: '3rem', marginBottom: '10px' }}>✨</div>
                <h3 style={{ margin: '0 0 5px 0' }}>Spell Generator</h3>
                <p style={{ margin: 0, opacity: 0.9 }}>Create custom spells</p>
              </div>

              <div style={newCardStyle} onClick={onSpellAssignment}>
                <div style={{ fontSize: '3rem', marginBottom: '10px' }}>📜</div>
                <h3 style={{ margin: '0 0 5px 0' }}>Assign Spells</h3>
                <p style={{ margin: 0, opacity: 0.9 }}>Give spells to characters</p>
              </div>

              <div style={newCardStyle} onClick={onHealingSystem}>
                <div style={{ fontSize: '3rem', marginBottom: '10px' }}>⚕️</div>
                <h3 style={{ margin: '0 0 5px 0' }}>Healing System</h3>
                <p style={{ margin: 0, opacity: 0.9 }}>Manage party health & healing</p>
              </div>

              {/* Primary tactical battle system */}
              {onBrigandineHex && (
                <div style={newCardStyle} onClick={onBrigandineHex}>
                  <div style={{ fontSize: '3rem', marginBottom: '10px' }}>🏰</div>
                  <h3 style={{ margin: '0 0 5px 0' }}>Brigandine Hex Battle</h3>
                  <p style={{ margin: 0, opacity: 0.9 }}>Brigandine-style tactical skirmish</p>
                </div>
              )}

              <div style={newCardStyle} onClick={onCombatUIDemo}>
                <div style={{ fontSize: '3rem', marginBottom: '10px' }}>🎮</div>
                <h3 style={{ margin: '0 0 5px 0' }}>Combat UI Demo</h3>
                <p style={{ margin: 0, opacity: 0.9 }}>World Engine combat interface showcase</p>
              </div>

              <div style={newCardStyle} onClick={onPortraitTest}>
                <div style={{ fontSize: '3rem', marginBottom: '10px' }}>🎭</div>
                <h3 style={{ margin: '0 0 5px 0' }}>Portrait Test</h3>
                <p style={{ margin: 0, opacity: 0.9 }}>Test all portrait combinations</p>
              </div>

              <div style={newCardStyle} onClick={onAutoUpdater}>
                <div style={{ fontSize: '3rem', marginBottom: '10px' }}>🔄</div>
                <h3 style={{ margin: '0 0 5px 0' }}>Auto-Updater Test</h3>
                <p style={{ margin: 0, opacity: 0.9 }}>Test desktop app auto-updater</p>
              </div>

              <div style={newCardStyle} onClick={onEnhancedMap}>
                <div style={{ fontSize: '3rem', marginBottom: '10px' }}>🗺️</div>
                <h3 style={{ margin: '0 0 5px 0' }}>Strategic Map</h3>
                <p style={{ margin: 0, opacity: 0.9 }}>Enhanced world map with factions</p>
              </div>

              <div style={newCardStyle} onClick={onSimpleMap}>
                <div style={{ fontSize: '3rem', marginBottom: '10px' }}>🌍</div>
                <h3 style={{ margin: '0 0 5px 0' }}>Exploration Map</h3>
                <p style={{ margin: 0, opacity: 0.9 }}>Simple campaign world map</p>
              </div>

              {onHexMap && (
                <div style={newCardStyle} onClick={onHexMap}>
                  <div style={{ fontSize: '3rem', marginBottom: '10px' }}>⬡</div>
                  <h3 style={{ margin: '0 0 5px 0' }}>Hex World Map</h3>
                  <p style={{ margin: 0, opacity: 0.9 }}>Professional hex-based overworld</p>
                </div>
              )}

              {onSmoothMap && (
                <div style={newCardStyle} onClick={onSmoothMap}>
                  <div style={{ fontSize: '3rem', marginBottom: '10px' }}>🌊</div>
                  <h3 style={{ margin: '0 0 5px 0' }}>Smooth World Map</h3>
                  <p style={{ margin: 0, opacity: 0.9 }}>Organic continuous terrain (NEW!)</p>
                </div>
              )}

              <div style={newCardStyle} onClick={onProcedural}>
                <div style={{ fontSize: '3rem', marginBottom: '10px' }}>🗺️</div>
                <h3 style={{ margin: '0 0 5px 0' }}>Procedural Gen</h3>
                <p style={{ margin: 0, opacity: 0.9 }}>Dev tools for world generation</p>
              </div>

              {onEncounters && (
                <div style={newCardStyle} onClick={onEncounters}>
                  <div style={{ fontSize: '3rem', marginBottom: '10px' }}>🗡️</div>
                  <h3 style={{ margin: '0 0 5px 0' }}>Encounters Test</h3>
                  <p style={{ margin: 0, opacity: 0.9 }}>Test encounters & gates system</p>
                </div>
              )}

              {characters.map(character => (
                <div key={character.id} style={cardStyle}>
                  <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                    {character.data?.name && character.data?.species && character.data?.archetype && character.data?.gender ? (
                      <SimplePortraitPreview
                        gender={character.data.gender.toLowerCase() as 'male' | 'female'}
                        species={character.data.species.toLowerCase()}
                        archetype={character.data.archetype.toLowerCase()}
                        size="small"
                      />
                    ) : (
                      <div style={{
                        width: 60,
                        height: 60,
                        background: '#374151',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#9ca3af',
                        fontSize: '16px',
                        flexShrink: 0
                      }}>
                        👤
                      </div>
                    )}
                    <div style={{ flex: 1 }}>
                      <h3 style={{ margin: '0 0 8px 0', color: '#f1f5f9' }}>{character.name}</h3>
                      <p style={{ margin: '0 0 4px 0', color: '#94a3b8', fontSize: '0.9rem' }}>
                        {character.race} {character.characterClass}
                      </p>
                      <p style={{ margin: '0', color: '#94a3b8', fontSize: '0.9rem' }}>
                        Level {character.level}
                      </p>
                    </div>
                  </div>
                  <p style={{ margin: '0 0 15px 0', color: '#64748b', fontSize: '0.8rem' }}>
                    Created: {formatDate(character.createdAt)}
                  </p>
                  <div>
                    <button
                      style={buttonStyle}
                      onClick={() => setSelectedCharacter(character)}
                    >
                      View Character
                    </button>
                    <button
                      style={deleteButtonStyle}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm('Delete this character?')) {
                          deleteCharacter(character.id);
                        }
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {characters.length === 0 && (
              <div style={{ textAlign: 'center', color: '#64748b', fontSize: '1.1rem', marginTop: '60px' }}>
                <p>No saved characters yet. Create your first character!</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Character Detail Modal */}
      {selectedCharacter && (
        <CharacterDetailModal
          character={selectedCharacter}
          onClose={() => setSelectedCharacter(null)}
        />
      )}
    </div>
  );
}
