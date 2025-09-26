import React, { useState, useEffect } from 'react';

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
  onCharacterCreator: () => void;
}

export function MainMenu({ onNewCampaign, onLoadCampaign, onCharacterCreator }: Props) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [characters, setCharacters] = useState<SavedCharacter[]>([]);
  const [activeTab, setActiveTab] = useState<'campaigns' | 'characters'>('campaigns');

  useEffect(() => {
    // Load saved campaigns and characters from localStorage
    loadCampaigns();
    loadCharacters();
  }, []);

  const loadCampaigns = () => {
    try {
      const saved = localStorage.getItem('world-engine-campaigns');
      if (saved) {
        setCampaigns(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading campaigns:', error);
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

  return (
    <div style={menuStyle}>
      <div style={headerStyle}>
        <h1 style={titleStyle}>World Engine</h1>
        <p style={subtitleStyle}>Campaign & Character Management</p>
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
              <div style={newCardStyle} onClick={onCharacterCreator}>
                <div style={{ fontSize: '3rem', marginBottom: '10px' }}>⚔️</div>
                <h3 style={{ margin: '0 0 5px 0' }}>Create Character</h3>
                <p style={{ margin: 0, opacity: 0.9 }}>Build a new character</p>
              </div>

              {characters.map(character => (
                <div key={character.id} style={cardStyle}>
                  <h3 style={{ margin: '0 0 10px 0', color: '#f1f5f9' }}>{character.name}</h3>
                  <p style={{ margin: '0 0 5px 0', color: '#94a3b8', fontSize: '0.9rem' }}>
                    {character.race} {character.characterClass}
                  </p>
                  <p style={{ margin: '0 0 5px 0', color: '#94a3b8', fontSize: '0.9rem' }}>
                    Level {character.level}
                  </p>
                  <p style={{ margin: '0 0 15px 0', color: '#64748b', fontSize: '0.8rem' }}>
                    Created: {formatDate(character.createdAt)}
                  </p>
                  <div>
                    <button
                      style={buttonStyle}
                      onClick={() => {
                        // TODO: Load character into editor
                        console.log('Load character:', character);
                      }}
                    >
                      Edit Character
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
    </div>
  );
}