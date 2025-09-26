import React, { useState, useEffect } from 'react';
import { Engine } from '../engine.d';

// Use the same Character type as CharacterCreate
type Character = {
  name: string;
  pronouns: string;
  species: string;
  archetype: string;
  background: string;
  stats: Record<string, number>;
  traits: string[];
  portraitUrl?: string;
  mode: "POINT_BUY" | "ROLL";
};

type Props = { 
  eng: Engine; 
  party: Character[]; 
  setParty: (p: Character[]) => void; 
  onStart: () => void;
  onCreateNew: () => void; // Navigate to character creator
};

interface SavedCharacter {
  id: string;
  name: string;
  race: string;
  characterClass: string;
  level: number;
  createdAt: string;
  data: Character;
}

const PRESET_CHARACTERS = [
  {
    name: "Kira Stormwind",
    pronouns: "she/her",
    species: "Stormcaller",
    archetype: "Storm Herald",
    background: "A former temple acolyte who left their old life behind after a mystical awakening. Now they seek knowledge in the wider world, wielding storm magic passed down through generations.",
    stats: { STR: 10, DEX: 14, CON: 12, INT: 15, WIS: 13, CHA: 11 },
    traits: ["Observant", "Silver Tongue", "Swift"],
    portraitUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&h=300&fit=crop&crop=face",
    mode: "POINT_BUY" as const
  },
  {
    name: "Marcus Ironforge",
    pronouns: "he/him", 
    species: "Alloy",
    archetype: "Dust Warden",
    background: "Born in the crystal caves, they were raised by wise elders and learned the ways of crafting. Their greatest challenge was mastering the fusion of magic and metal that defines their people.",
    stats: { STR: 13, DEX: 11, CON: 15, INT: 14, WIS: 12, CHA: 8 },
    traits: ["Clever", "Iron Will", "Stoic"],
    portraitUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop&crop=face",
    mode: "POINT_BUY" as const
  },
  {
    name: "Zara Nightwhisper",
    pronouns: "they/them",
    species: "Voidkin", 
    archetype: "Wind Sage",
    background: "A wandering soul from the shadow realm who fought in great battles against the encroaching darkness. Their destiny was forever changed when they discovered their connection to the void grants them unique abilities.",
    stats: { STR: 9, DEX: 15, CON: 11, INT: 12, WIS: 14, CHA: 13 },
    traits: ["Cunning", "Lucky", "Observant"],
    portraitUrl: "https://images.unsplash.com/photo-1494790108755-2616c4b43e69?w=300&h=300&fit=crop&crop=face",
    mode: "POINT_BUY" as const
  },
  {
    name: "Theron Greenbough",
    pronouns: "he/him",
    species: "Sylvanborn",
    archetype: "Greenwarden",
    background: "A guardian of the ancient forests who communes with the spirits of nature. After witnessing the corruption of his homeland, he seeks allies to restore the natural balance.",
    stats: { STR: 12, DEX: 13, CON: 14, INT: 10, WIS: 16, CHA: 9 },
    traits: ["Nature's Friend", "Keen Senses", "Patient"],
    portraitUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&h=300&fit=crop&crop=face",
    mode: "POINT_BUY" as const
  }
] as Character[];

export function CharacterLibrary({ eng, party, setParty, onStart, onCreateNew }: Props) {
  const [savedCharacters, setSavedCharacters] = useState<SavedCharacter[]>([]);
  const [selectedTab, setSelectedTab] = useState<'saved' | 'presets'>('saved');

  useEffect(() => {
    // Load saved characters from localStorage
    try {
      const saved = JSON.parse(localStorage.getItem('world-engine-characters') || '[]');
      setSavedCharacters(saved);
    } catch (error) {
      console.error('Error loading saved characters:', error);
      setSavedCharacters([]);
    }
  }, []);

  const addToParty = (character: Character) => {
    if (party.length >= 4) {
      alert('Party is full! Maximum 4 characters.');
      return;
    }
    
    if (party.some(c => c.name === character.name)) {
      alert('Character already in party!');
      return;
    }
    
    setParty([...party, character]);
  };

  const removeFromParty = (index: number) => {
    setParty(party.filter((_, i) => i !== index));
  };

  const deleteCharacter = (id: string) => {
    const confirmed = window.confirm('Are you sure you want to delete this character? This cannot be undone.');
    if (!confirmed) return;
    
    const updated = savedCharacters.filter(c => c.id !== id);
    setSavedCharacters(updated);
    localStorage.setItem('world-engine-characters', JSON.stringify(updated));
  };

  const selected = (typeof eng.state.meta.presets.loaded === 'string')
    ? eng.state.meta.presets.loaded
    : eng.state.meta.presets.loaded?.name;

  return (
    <div style={{ 
      display: "flex", 
      flexDirection: "column", 
      height: "100vh", 
      background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
      color: "#e2e8f0"
    }}>
      {/* Header */}
      <div style={{ 
        padding: "1.5rem", 
        borderBottom: "1px solid #334155",
        background: "rgba(15, 23, 42, 0.8)"
      }}>
        <h1 style={{ margin: 0, fontSize: "2rem", fontWeight: "bold" }}>Character Library</h1>
        <p style={{ margin: "0.5rem 0 0", opacity: 0.8 }}>
          Selected World: <span style={{ color: "#60a5fa", fontWeight: "bold" }}>{selected || "None"}</span>
        </p>
      </div>

      <div style={{ display: "flex", flex: 1 }}>
        {/* Left Panel - Character Selection */}
        <div style={{ 
          flex: 2, 
          padding: "1.5rem", 
          borderRight: "1px solid #334155",
          overflowY: "auto"
        }}>
          {/* Tab Navigation */}
          <div style={{ 
            display: "flex", 
            marginBottom: "1.5rem",
            borderBottom: "1px solid #334155"
          }}>
            <button
              onClick={() => setSelectedTab('saved')}
              style={{
                padding: "0.75rem 1.5rem",
                background: selectedTab === 'saved' ? "#3b82f6" : "transparent",
                color: selectedTab === 'saved' ? "white" : "#94a3b8",
                border: "none",
                borderBottom: selectedTab === 'saved' ? "2px solid #3b82f6" : "2px solid transparent",
                cursor: "pointer",
                fontSize: "1rem"
              }}
            >
              Saved Characters ({savedCharacters.length})
            </button>
            <button
              onClick={() => setSelectedTab('presets')}
              style={{
                padding: "0.75rem 1.5rem",
                background: selectedTab === 'presets' ? "#3b82f6" : "transparent",
                color: selectedTab === 'presets' ? "white" : "#94a3b8",
                border: "none",
                borderBottom: selectedTab === 'presets' ? "2px solid #3b82f6" : "2px solid transparent",
                cursor: "pointer",
                fontSize: "1rem"
              }}
            >
              Preset Characters ({PRESET_CHARACTERS.length})
            </button>
          </div>

          {/* Create New Button */}
          <button
            onClick={onCreateNew}
            style={{
              width: "100%",
              padding: "0.75rem",
              marginBottom: "1.5rem",
              background: "#10b981",
              color: "white",
              border: "none",
              borderRadius: "6px",
              fontSize: "1rem",
              cursor: "pointer",
              fontWeight: "bold"
            }}
          >
            Create New Character
          </button>

          {/* Character List */}
          <div style={{ display: "grid", gap: "1rem" }}>
            {selectedTab === 'saved' ? (
              savedCharacters.length === 0 ? (
                <div style={{ 
                  textAlign: "center", 
                  padding: "2rem", 
                  color: "#64748b",
                  fontStyle: "italic"
                }}>
                  No saved characters yet. Create your first character!
                </div>
              ) : (
                savedCharacters.map((char) => (
                  <div key={char.id} style={{
                    background: "#1e293b",
                    border: "1px solid #334155",
                    borderRadius: "8px",
                    padding: "1rem"
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <h3 style={{ margin: "0 0 0.5rem", color: "#f1f5f9" }}>{char.name}</h3>
                        <p style={{ margin: "0.25rem 0", color: "#94a3b8", fontSize: "0.9rem" }}>
                          {char.race} {char.characterClass}
                        </p>
                        <p style={{ margin: "0.25rem 0", color: "#64748b", fontSize: "0.8rem" }}>
                          Created: {new Date(char.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <button
                          onClick={() => addToParty(char.data)}
                          style={{
                            padding: "0.5rem 1rem",
                            background: "#3b82f6",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            fontSize: "0.8rem",
                            cursor: "pointer"
                          }}
                        >
                          Add to Party
                        </button>
                        <button
                          onClick={() => deleteCharacter(char.id)}
                          style={{
                            padding: "0.5rem 1rem",
                            background: "#ef4444",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            fontSize: "0.8rem",
                            cursor: "pointer"
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )
            ) : (
              PRESET_CHARACTERS.map((char, index) => (
                <div key={index} style={{
                  background: "#1e293b",
                  border: "1px solid #334155",
                  borderRadius: "8px",
                  padding: "1rem"
                }}>
                  <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                    {char.portraitUrl && (
                      <img
                        src={char.portraitUrl}
                        alt={char.name}
                        style={{
                          width: "60px",
                          height: "60px",
                          borderRadius: "50%",
                          objectFit: "cover"
                        }}
                      />
                    )}
                    <div style={{ flex: 1 }}>
                      <h3 style={{ margin: "0 0 0.5rem", color: "#f1f5f9" }}>{char.name}</h3>
                      <p style={{ margin: "0.25rem 0", color: "#94a3b8", fontSize: "0.9rem" }}>
                        {char.species} {char.archetype}
                      </p>
                      <p style={{ 
                        margin: "0.5rem 0 0", 
                        color: "#64748b", 
                        fontSize: "0.8rem",
                        maxWidth: "300px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap"
                      }}>
                        {char.background}
                      </p>
                    </div>
                    <button
                      onClick={() => addToParty(char)}
                      style={{
                        padding: "0.5rem 1rem",
                        background: "#3b82f6",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        fontSize: "0.8rem",
                        cursor: "pointer"
                      }}
                    >
                      Add to Party
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Panel - Current Party */}
        <div style={{ 
          flex: 1, 
          padding: "1.5rem",
          background: "rgba(15, 23, 42, 0.5)"
        }}>
          <h2 style={{ marginBottom: "1rem" }}>Current Party ({party.length}/4)</h2>
          
          {party.length === 0 ? (
            <div style={{ 
              textAlign: "center", 
              padding: "2rem", 
              color: "#64748b",
              fontStyle: "italic"
            }}>
              No characters in party. Add characters to get started!
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {party.map((char, index) => (
                <div key={index} style={{
                  background: "#1e293b",
                  border: "1px solid #334155",
                  borderRadius: "8px",
                  padding: "1rem"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <h4 style={{ margin: "0 0 0.25rem", color: "#f1f5f9" }}>{char.name}</h4>
                      <p style={{ margin: "0", color: "#94a3b8", fontSize: "0.8rem" }}>
                        {char.species} {char.archetype}
                      </p>
                    </div>
                    <button
                      onClick={() => removeFromParty(index)}
                      style={{
                        padding: "0.25rem 0.5rem",
                        background: "#ef4444",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        fontSize: "0.7rem",
                        cursor: "pointer"
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Start Adventure Button */}
          <button
            onClick={onStart}
            disabled={party.length === 0}
            style={{
              width: "100%",
              padding: "1rem",
              marginTop: "1.5rem",
              background: party.length === 0 ? "#374151" : "#059669",
              color: party.length === 0 ? "#6b7280" : "white",
              border: "none",
              borderRadius: "6px",
              fontSize: "1.1rem",
              fontWeight: "bold",
              cursor: party.length === 0 ? "not-allowed" : "pointer"
            }}
          >
            {party.length === 0 ? "Add Characters to Start" : "Start Adventure"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default CharacterLibrary;