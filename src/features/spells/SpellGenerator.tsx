import React, { useState } from 'react';
import { storage } from "../../core/services/storage";
import { PREMADE_SPELLS as _PREMADE_SPELLS, getAllPremadeSpells, getPremadeSpellsBySchool } from './PremadeSpells';
import CustomSpellCreator from './CustomSpellCreator';

interface SpellGeneratorProps {
  onBack?: () => void;
}

// Simple spell data for the random generator
const SPELL_DATA = {
  schools: [
    { name: "Abjuration", description: "Protective magic", color: "#3b82f6" },
    { name: "Conjuration", description: "Summoning and creation", color: "#10b981" },
    { name: "Divination", description: "Information gathering", color: "#f59e0b" },
    { name: "Enchantment", description: "Mind control and charm", color: "#ec4899" },
    { name: "Evocation", description: "Destructive energy", color: "#ef4444" },
    { name: "Healing", description: "Restoration and recovery", color: "#22c55e" },
    { name: "Illusion", description: "Deception and trickery", color: "#8b5cf6" },
    { name: "Necromancy", description: "Death and undeath", color: "#6b7280" },
    { name: "Transmutation", description: "Transformation", color: "#06b6d4" }
  ]
};

interface GeneratedSpell {
  name: string;
  level: number;
  school: string;
  castingTime: string;
  range: string;
  components: string[];
  duration: string;
  description: string;
  color: string;
}

export default function SpellGenerator({ onBack }: SpellGeneratorProps) {
  const [mode, setMode] = useState<'menu' | 'premade' | 'custom'>('menu');
  const [selectedSchool, setSelectedSchool] = useState<string>('any');
  const [generatedSpells, setGeneratedSpells] = useState<GeneratedSpell[]>([]);
  const [savedSpells, setSavedSpells] = useState<GeneratedSpell[]>([]);

  // Load saved spells on mount
  React.useEffect(() => {
    try {
      const saved = JSON.parse(storage.local.getItem('world-engine-saved-spells') || '[]');
      setSavedSpells(saved);
    } catch (error) {
      console.error('Error loading saved spells:', error);
      setSavedSpells([]);
    }
  }, []);

  // Handle custom spell creation
  const handleCustomSpellCreated = (spell: GeneratedSpell) => {
    setGeneratedSpells(prev => [spell, ...prev]);
    console.log(`✨ Created custom spell: ${spell.name}`);
    setMode('menu');
  };

  // Load premade spells by school
  const loadPremadeSpells = (school?: string) => {
    let spells: GeneratedSpell[] = [];

    if (school && school !== 'any') {
      spells = getPremadeSpellsBySchool(school);
      console.log(`📚 Loaded ${spells.length} premade ${school} spells`);
    } else {
      spells = getAllPremadeSpells();
      console.log(`📚 Loaded ${spells.length} premade spells from all schools`);
    }

    setGeneratedSpells(spells);
  };

  // Save spell to collection
  const saveSpell = (spell: GeneratedSpell) => {
    if (savedSpells.find(s => s.name === spell.name)) {
      alert('Spell already saved!');
      return;
    }

    const newSavedSpells = [...savedSpells, spell];
    setSavedSpells(newSavedSpells);
    storage.local.setItem('world-engine-saved-spells', JSON.stringify(newSavedSpells));
    console.log('Spell saved:', spell.name);
  };

  // Remove saved spell
  const _removeSavedSpell = (spellName: string) => {
    const updated = savedSpells.filter(s => s.name !== spellName);
    setSavedSpells(updated);
    storage.local.setItem('world-engine-saved-spells', JSON.stringify(updated));
  };

  // Render different modes
  if (mode === 'custom') {
    return (
      <CustomSpellCreator
        onBack={() => setMode('menu')}
        onSpellCreated={handleCustomSpellCreated}
      />
    );
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
      color: "#e2e8f0"
    }}>
      {/* Header */}
      <div style={{
        padding: "1.5rem 2rem",
        borderBottom: "1px solid #334155",
        background: "rgba(15, 23, 42, 0.8)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "2.5rem", fontWeight: "bold" }}>
            ⚡ Spell Workshop
          </h1>
          <p style={{ margin: "0.5rem 0 0", opacity: 0.8 }}>
            {mode === 'menu' ? 'Choose your spell creation method' :
              mode === 'premade' ? 'Browse curated spell collections' :
                'Generate random magical spells'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {mode !== 'menu' && (
            <button
              onClick={() => setMode('menu')}
              style={{
                padding: "0.75rem 1.5rem",
                background: "#6366f1",
                color: "#f9fafb",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "1rem"
              }}
            >
              🏠 Main Menu
            </button>
          )}
          {onBack && (
            <button
              onClick={onBack}
              style={{
                padding: "0.75rem 1.5rem",
                background: "#374151",
                color: "#f9fafb",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "1rem"
              }}
            >
              Back to Game
            </button>
          )}
        </div>
      </div>

      {mode === 'menu' && (
        <div style={{ padding: "3rem 2rem" }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
            gap: "2rem",
            maxWidth: "1200px",
            margin: "0 auto"
          }}>
            {/* Premade Spells */}
            <div style={{
              background: "rgba(15, 23, 42, 0.6)",
              borderRadius: "12px",
              padding: "2rem",
              border: "2px solid #10b981",
              cursor: "pointer",
              transition: "all 0.3s ease"
            }}
              onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-4px)"}
              onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0px)"}
              onClick={() => setMode('premade')}>
              <div style={{
                fontSize: "3rem",
                textAlign: "center",
                marginBottom: "1rem"
              }}>📚</div>
              <h2 style={{
                margin: "0 0 1rem",
                color: "#10b981",
                textAlign: "center",
                fontSize: "1.5rem"
              }}>Premade Spell Collections</h2>
              <p style={{
                margin: "0 0 1.5rem",
                color: "#cbd5e1",
                textAlign: "center",
                lineHeight: "1.6"
              }}>
                Browse carefully crafted spells for each school of magic.
                Perfect for quick gameplay and learning spell mechanics.
              </p>
              <div style={{
                background: "rgba(16, 185, 129, 0.1)",
                borderRadius: "6px",
                padding: "1rem",
                border: "1px solid #10b981"
              }}>
                <h4 style={{ margin: "0 0 0.5rem", color: "#6ee7b7" }}>✨ Features:</h4>
                <ul style={{ margin: 0, paddingLeft: "1.5rem", color: "#d1fae5" }}>
                  <li>Balanced and tested spells</li>
                  <li>Organized by school and level</li>
                  <li>Rich flavor text and descriptions</li>
                  <li>Ready to use immediately</li>
                </ul>
              </div>
            </div>

            {/* Custom Creator */}
            <div style={{
              background: "rgba(15, 23, 42, 0.6)",
              borderRadius: "12px",
              padding: "2rem",
              border: "2px solid #ef4444",
              cursor: "pointer",
              transition: "all 0.3s ease"
            }}
              onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-4px)"}
              onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0px)"}
              onClick={() => setMode('custom')}>
              <div style={{
                fontSize: "3rem",
                textAlign: "center",
                marginBottom: "1rem"
              }}>⚒️</div>
              <h2 style={{
                margin: "0 0 1rem",
                color: "#ef4444",
                textAlign: "center",
                fontSize: "1.5rem"
              }}>Custom Spell Creator</h2>
              <p style={{
                margin: "0 0 1.5rem",
                color: "#cbd5e1",
                textAlign: "center",
                lineHeight: "1.6"
              }}>
                Design your own spells from scratch with built-in balance guidelines.
                Perfect for experienced players who want full creative control.
              </p>
              <div style={{
                background: "rgba(239, 68, 68, 0.1)",
                borderRadius: "6px",
                padding: "1rem",
                border: "1px solid #ef4444"
              }}>
                <h4 style={{ margin: "0 0 0.5rem", color: "#fca5a5" }}>🛠️ Features:</h4>
                <ul style={{ margin: 0, paddingLeft: "1.5rem", color: "#fee2e2" }}>
                  <li>Complete creative freedom</li>
                  <li>Balance guidelines and validation</li>
                  <li>Component customization</li>
                  <li>Real-time spell preview</li>
                </ul>
              </div>

              <div style={{
                background: "rgba(245, 158, 11, 0.1)",
                borderRadius: "6px",
                padding: "0.75rem",
                border: "1px solid #f59e0b",
                marginTop: "1rem"
              }}>
                <div style={{ color: "#fbbf24", fontSize: "0.9rem", textAlign: "center" }}>
                  ⚠️ For Experienced Players
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div style={{
            marginTop: "3rem",
            textAlign: "center",
            padding: "2rem",
            background: "rgba(15, 23, 42, 0.4)",
            borderRadius: "8px",
            border: "1px solid #334155"
          }}>
            <h3 style={{ margin: "0 0 1rem", color: "#f1f5f9" }}>📊 Spell Library Stats</h3>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "1rem",
              maxWidth: "800px",
              margin: "0 auto"
            }}>
              {SPELL_DATA.schools.map(school => {
                const count = getPremadeSpellsBySchool(school.name).length;
                return (
                  <div key={school.name} style={{
                    padding: "1rem",
                    background: "rgba(15, 23, 42, 0.6)",
                    borderRadius: "6px",
                    border: `1px solid ${school.color}`
                  }}>
                    <div style={{ color: school.color, fontWeight: "bold" }}>{school.name}</div>
                    <div style={{ color: "#94a3b8", fontSize: "0.9rem" }}>{count} spells</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {mode === 'premade' && (
        <div style={{ display: "flex", height: "calc(100vh - 120px)" }}>
          {/* School Selection */}
          <div style={{
            width: "300px",
            padding: "2rem",
            borderRight: "1px solid #334155",
            overflowY: "auto",
            background: "rgba(15, 23, 42, 0.4)"
          }}>
            <h3 style={{ marginBottom: "1rem", color: "#f1f5f9" }}>📚 Browse by School</h3>

            <button
              onClick={() => loadPremadeSpells('any')}
              style={{
                width: "100%",
                padding: "1rem",
                marginBottom: "0.5rem",
                background: selectedSchool === 'any' ? "#374151" : "rgba(15, 23, 42, 0.6)",
                border: "1px solid #4b5563",
                borderRadius: "6px",
                color: "#f9fafb",
                cursor: "pointer",
                textAlign: "left",
                fontSize: "1rem"
              }}
            >
              🌟 All Schools ({getAllPremadeSpells().length} spells)
            </button>

            {SPELL_DATA.schools.map(school => {
              const count = getPremadeSpellsBySchool(school.name).length;
              return (
                <button
                  key={school.name}
                  onClick={() => {
                    setSelectedSchool(school.name.toLowerCase());
                    loadPremadeSpells(school.name);
                  }}
                  style={{
                    width: "100%",
                    padding: "1rem",
                    marginBottom: "0.5rem",
                    background: selectedSchool === school.name.toLowerCase() ? school.color : "rgba(15, 23, 42, 0.6)",
                    border: `1px solid ${school.color}`,
                    borderRadius: "6px",
                    color: selectedSchool === school.name.toLowerCase() ? "#ffffff" : school.color,
                    cursor: "pointer",
                    textAlign: "left",
                    fontSize: "0.9rem",
                    transition: "all 0.2s ease"
                  }}
                >
                  <div style={{ fontWeight: "bold" }}>{school.name}</div>
                  <div style={{ fontSize: "0.8rem", opacity: 0.8 }}>
                    {school.description} ({count} spells)
                  </div>
                </button>
              );
            })}
          </div>

          {/* Spell Display */}
          <div style={{
            flex: 1,
            padding: "2rem",
            overflowY: "auto"
          }}>
            {generatedSpells.length === 0 ? (
              <div style={{
                textAlign: "center",
                padding: "3rem",
                color: "#94a3b8"
              }}>
                <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>📚</div>
                <h3 style={{ margin: "0 0 1rem", color: "#cbd5e1" }}>Select a School</h3>
                <p>Choose a school of magic from the left panel to browse curated spells.</p>
              </div>
            ) : (
              <div>
                <h2 style={{ margin: "0 0 1.5rem", color: "#f1f5f9" }}>
                  {selectedSchool === 'any' ? 'All Schools' :
                    SPELL_DATA.schools.find(s => s.name.toLowerCase() === selectedSchool)?.name || 'Spells'}
                  <span style={{ color: "#94a3b8", fontSize: "1rem", fontWeight: "normal", marginLeft: "1rem" }}>
                    ({generatedSpells.length} spells)
                  </span>
                </h2>

                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
                  gap: "1.5rem"
                }}>
                  {generatedSpells.map((spell, index) => (
                    <div key={index} style={{
                      background: "rgba(15, 23, 42, 0.8)",
                      borderRadius: "8px",
                      padding: "1.5rem",
                      border: `2px solid ${spell.color}`,
                      transition: "transform 0.2s ease"
                    }}>
                      <div style={{ marginBottom: "1rem" }}>
                        <h3 style={{ margin: "0 0 0.25rem", color: spell.color, fontSize: "1.3rem" }}>
                          {spell.name}
                        </h3>
                        <p style={{ margin: 0, color: "#94a3b8", fontSize: "0.9rem" }}>
                          {spell.level === 0 ? "Cantrip" : `Level ${spell.level}`} {spell.school}
                        </p>
                      </div>

                      <div style={{ marginBottom: "1rem", fontSize: "0.9rem", color: "#cbd5e1" }}>
                        <p style={{ margin: "0.25rem 0" }}>
                          <strong>Casting Time:</strong> {spell.castingTime}
                        </p>
                        <p style={{ margin: "0.25rem 0" }}>
                          <strong>Range:</strong> {spell.range}
                        </p>
                        <p style={{ margin: "0.25rem 0" }}>
                          <strong>Components:</strong> {spell.components.join(", ")}
                        </p>
                        <p style={{ margin: "0.25rem 0" }}>
                          <strong>Duration:</strong> {spell.duration}
                        </p>
                      </div>

                      <div style={{ marginBottom: "1.5rem" }}>
                        <p style={{ margin: 0, color: "#e2e8f0", lineHeight: "1.5" }}>
                          {spell.description}
                        </p>
                      </div>

                      <button
                        onClick={() => saveSpell(spell)}
                        style={{
                          width: "100%",
                          padding: "0.75rem",
                          background: "#059669",
                          color: "white",
                          border: "none",
                          borderRadius: "6px",
                          cursor: "pointer",
                          fontSize: "1rem",
                          fontWeight: "bold"
                        }}
                      >
                        💾 Save to Spellbook
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Saved Spells Count */}
      {savedSpells.length > 0 && (
        <div style={{
          position: "fixed",
          bottom: "2rem",
          right: "2rem",
          background: "rgba(15, 23, 42, 0.9)",
          border: "1px solid #334155",
          borderRadius: "8px",
          padding: "1rem",
          color: "#f1f5f9"
        }}>
          💾 {savedSpells.length} spells saved
        </div>
      )}
    </div>
  );
}