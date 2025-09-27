import React, { useState, useEffect } from 'react';
import PortraitDisplay from './PortraitDisplay';

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
  onLoadCampaign: (campaign: Campaign) => void;
  onNameGenerator: () => void;
  onSpellGenerator: () => void;
  onSpellAssignment: () => void;
  onHealingSystem: () => void;
  onPortraitStudio: () => void;
}

export function MainMenu({ onNewCampaign, onLoadCampaign, onNameGenerator, onSpellGenerator, onSpellAssignment, onHealingSystem, onPortraitStudio }: Props) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [characters, setCharacters] = useState<SavedCharacter[]>([]);
  const [activeTab, setActiveTab] = useState<'campaigns' | 'characters'>('campaigns');
  const [selectedCharacter, setSelectedCharacter] = useState<SavedCharacter | null>(null);

  useEffect(() => {
    // Load saved campaigns and characters from localStorage
    loadCampaigns();
    loadCharacters();
  }, []);

  const loadCampaigns = () => {
    try {
      // Try to recover campaigns using the enhanced recovery system
      let campaigns = recoverCampaigns();
      setCampaigns(campaigns);

      // Show recovery message if campaigns were recovered from backup
      const primarySaved = localStorage.getItem('world-engine-campaigns');
      const backupSaved = localStorage.getItem('world-engine-campaigns-backup');

      if (!primarySaved && backupSaved && campaigns.length > 0) {
        alert('⚠️ Primary save was missing, but your campaigns were recovered from backup!');
      }
    } catch (error) {
      console.error('Error loading campaigns:', error);
      setCampaigns([]);
    }
  };

  // Enhanced recovery function (matches the one in index.tsx)
  const recoverCampaigns = () => {
    try {
      // Try primary storage first
      let campaigns = JSON.parse(localStorage.getItem('world-engine-campaigns') || '[]');

      if (campaigns.length === 0) {
        // Try backup storage
        const backup = JSON.parse(localStorage.getItem('world-engine-campaigns-backup') || '{}');
        if (backup.campaigns && backup.campaigns.length > 0) {
          campaigns = backup.campaigns;
          localStorage.setItem('world-engine-campaigns', JSON.stringify(campaigns));
          console.log('Recovered campaigns from backup storage');
        }
      }

      if (campaigns.length === 0) {
        // Try session storage
        const sessionCampaigns = JSON.parse(sessionStorage.getItem('world-engine-campaigns-session') || '[]');
        if (sessionCampaigns.length > 0) {
          campaigns = sessionCampaigns;
          localStorage.setItem('world-engine-campaigns', JSON.stringify(campaigns));
          console.log('Recovered campaigns from session storage');
        }
      }

      return campaigns;
    } catch (error) {
      console.error('Error recovering campaigns:', error);
      return [];
    }
  };

  const loadCharacters = () => {
    try {
      const saved = localStorage.getItem('world-engine-characters');
      if (saved) {
        setCharacters(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading characters:', error);
    }
  };

  const deleteCampaign = (campaignId: string) => {
    const updated = campaigns.filter(c => c.id !== campaignId);
    setCampaigns(updated);
    localStorage.setItem('world-engine-campaigns', JSON.stringify(updated));
  };

  const deleteCharacter = (characterId: string) => {
    const updated = characters.filter(c => c.id !== characterId);
    setCharacters(updated);
    localStorage.setItem('world-engine-characters', JSON.stringify(updated));
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
      alert('✅ Backup downloaded successfully!');
    } catch (error) {
      console.error('Error downloading backup:', error);
      alert('❌ Failed to download backup');
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
          localStorage.setItem('world-engine-campaigns', JSON.stringify(backup.campaigns));
          localStorage.setItem('world-engine-campaigns-backup', JSON.stringify(backup));
          setCampaigns(backup.campaigns);
        }

        if (backup.characters && Array.isArray(backup.characters)) {
          // Save characters
          localStorage.setItem('world-engine-characters', JSON.stringify(backup.characters));
          localStorage.setItem('world-engine-characters-backup', JSON.stringify(backup.characters));
          setCharacters(backup.characters);
        }

        alert(`✅ Backup imported successfully!\nCampaigns: ${backup.campaigns?.length || 0}\nCharacters: ${backup.characters?.length || 0}`);
      } catch (error) {
        console.error('Error importing backup:', error);
        alert('❌ Invalid backup file format');
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
      const backupChars = localStorage.getItem('world-engine-characters-backup');
      if (backupChars) {
        const chars = JSON.parse(backupChars);
        if (Array.isArray(chars)) {
          localStorage.setItem('world-engine-characters', JSON.stringify(chars));
          setCharacters(chars);
        }
      }

      alert(`🔄 Recovery attempt completed!\nRecovered ${recovered.length} campaigns`);
    } catch (error) {
      console.error('Error during recovery:', error);
      alert('❌ Recovery failed');
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
            <PortraitDisplay
              portraitData={character.data?.portraitUrl || ''}
              size={120}
              style={{ flexShrink: 0 }}
            />
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
              {character.data.pronouns && (
                <div style={{ marginBottom: '15px' }}>
                  <h4 style={{ margin: '0 0 8px 0', color: '#8b5cf6' }}>Pronouns</h4>
                  <p style={{ margin: 0, color: '#e2e8f0' }}>{character.data.pronouns}</p>
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
                    {character.data.traits.map((trait: string, index: number) => (
                      <span
                        key={index}
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
                          {character.data.knownCantrips.map((cantrip: string, index: number) => (
                            <span
                              key={index}
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
                          {character.data.knownSpells.map((spell: string, index: number) => (
                            <span
                              key={index}
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

              <div style={newCardStyle} onClick={onPortraitStudio}>
                <div style={{ fontSize: '3rem', marginBottom: '10px' }}>🎨</div>
                <h3 style={{ margin: '0 0 5px 0' }}>Portrait Studio</h3>
                <p style={{ margin: 0, opacity: 0.9 }}>Create character portraits</p>
              </div>

              {characters.map(character => (
                <div key={character.id} style={cardStyle}>
                  <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                    <PortraitDisplay
                      portraitData={character.data?.portraitUrl || ''}
                      size={60}
                      style={{ flexShrink: 0 }}
                    />
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