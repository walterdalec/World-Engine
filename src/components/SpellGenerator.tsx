import React, { useState } from 'react';

interface SpellGeneratorProps {
  onBack?: () => void;
}

// Spell component data
const SPELL_DATA = {
  schools: [
    { name: "Abjuration", description: "Protective magic", color: "#3b82f6" },
    { name: "Conjuration", description: "Summoning and creation", color: "#10b981" },
    { name: "Divination", description: "Information gathering", color: "#f59e0b" },
    { name: "Enchantment", description: "Mind control and charm", color: "#ec4899" },
    { name: "Evocation", description: "Destructive energy", color: "#ef4444" },
    { name: "Illusion", description: "Deception and trickery", color: "#8b5cf6" },
    { name: "Necromancy", description: "Death and undeath", color: "#6b7280" },
    { name: "Transmutation", description: "Transformation", color: "#06b6d4" }
  ],
  levels: [
    { level: 0, name: "Cantrip", description: "Simple magic, unlimited use" },
    { level: 1, name: "1st Level", description: "Basic spells" },
    { level: 2, name: "2nd Level", description: "Moderate spells" },
    { level: 3, name: "3rd Level", description: "Advanced spells" },
    { level: 4, name: "4th Level", description: "Powerful magic" },
    { level: 5, name: "5th Level", description: "High-level spells" },
    { level: 6, name: "6th Level", description: "Master magic" },
    { level: 7, name: "7th Level", description: "Legendary spells" },
    { level: 8, name: "8th Level", description: "Epic magic" },
    { level: 9, name: "9th Level", description: "Reality-altering power" }
  ],
  components: {
    verbal: ["Ancient words", "Mystical chant", "Power word", "Incantation", "Arcane phrase"],
    somatic: ["Precise gestures", "Complex hand movements", "Ritualistic dance", "Finger patterns", "Sweeping motions"],
    material: ["Crystal focus", "Rare herbs", "Precious metals", "Ancient runes", "Elemental essence", "Sacred symbols", "Exotic components"]
  },
  durations: ["Instantaneous", "1 round", "1 minute", "10 minutes", "1 hour", "8 hours", "24 hours", "7 days", "30 days", "Permanent", "Until dispelled"],
  ranges: ["Self", "Touch", "30 feet", "60 feet", "120 feet", "300 feet", "500 feet", "1 mile", "Unlimited", "Sight"],
  castingTimes: ["1 action", "1 bonus action", "1 reaction", "1 minute", "10 minutes", "1 hour", "8 hours", "24 hours"],
  
  effects: {
    abjuration: ["Creates protective barrier", "Wards against harm", "Dispels magic", "Banishes creatures", "Prevents effects", "Shields from damage"],
    conjuration: ["Summons creatures", "Creates objects", "Opens portals", "Teleports beings", "Manifests energy", "Brings forth allies"],
    divination: ["Reveals information", "Scries distant locations", "Predicts future", "Detects magic", "Unveils secrets", "Grants insight"],
    enchantment: ["Charms targets", "Controls minds", "Influences emotions", "Compels actions", "Alters memories", "Dominates will"],
    evocation: ["Deals damage", "Creates energy", "Generates force", "Produces elements", "Unleashes power", "Destroys matter"],
    illusion: ["Creates false images", "Obscures reality", "Hides objects", "Deceives senses", "Alters appearance", "Confuses perception"],
    necromancy: ["Animates dead", "Drains life force", "Speaks with dead", "Curses targets", "Manipulates souls", "Controls undeath"],
    transmutation: ["Changes form", "Alters properties", "Transforms matter", "Enhances abilities", "Modifies structure", "Reshapes reality"]
  },
  
  adjectives: ["Ancient", "Blazing", "Chilling", "Dark", "Ethereal", "Flaming", "Glowing", "Hidden", "Infinite", "Jagged", "Kinetic", "Luminous", "Mystic", "Nebulous", "Obliterating", "Prismatic", "Quickening", "Radiant", "Searing", "Thunderous", "Umbral", "Vivid", "Withering", "Xenolithic", "Yielding", "Zealous"],
  nouns: ["Blade", "Bolt", "Chain", "Disk", "Eye", "Fist", "Globe", "Hand", "Image", "Javelin", "Key", "Lance", "Missile", "Needle", "Orb", "Prism", "Quill", "Ray", "Shield", "Tentacle", "Umbrella", "Veil", "Wall", "Xerus", "Yoke", "Zone"]
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
  const [selectedSchool, setSelectedSchool] = useState<string>('any');
  const [selectedLevel, setSelectedLevel] = useState<number>(-1); // -1 for any
  const [generatedSpells, setGeneratedSpells] = useState<GeneratedSpell[]>([]);
  const [savedSpells, setSavedSpells] = useState<GeneratedSpell[]>([]);

  const getRandomElement = <T,>(array: T[]): T => {
    return array[Math.floor(Math.random() * array.length)];
  };

  const generateSpellName = (): string => {
    const adjective = getRandomElement(SPELL_DATA.adjectives);
    const noun = getRandomElement(SPELL_DATA.nouns);
    
    // Sometimes add a possessive or "of" phrase
    const variations = [
      `${adjective} ${noun}`,
      `${noun} of ${adjective.toLowerCase()}`,
      `${adjective} ${noun}'s ${getRandomElement(['Touch', 'Embrace', 'Wrath', 'Blessing', 'Curse'])}`
    ];
    
    return getRandomElement(variations);
  };

  const generateSpell = (): GeneratedSpell => {
    // Choose school
    const school = selectedSchool === 'any' 
      ? getRandomElement(SPELL_DATA.schools)
      : SPELL_DATA.schools.find(s => s.name.toLowerCase() === selectedSchool) || getRandomElement(SPELL_DATA.schools);
    
    // Choose level
    const level = selectedLevel === -1 
      ? getRandomElement(SPELL_DATA.levels)
      : SPELL_DATA.levels.find(l => l.level === selectedLevel) || getRandomElement(SPELL_DATA.levels);
    
    // Generate components (always verbal, sometimes somatic, sometimes material)
    const components: string[] = [];
    components.push(`V (${getRandomElement(SPELL_DATA.components.verbal)})`);
    
    if (Math.random() > 0.3) {
      components.push(`S (${getRandomElement(SPELL_DATA.components.somatic)})`);
    }
    
    if (Math.random() > 0.4) {
      components.push(`M (${getRandomElement(SPELL_DATA.components.material)})`);
    }
    
    // Generate effect description
    const effects = SPELL_DATA.effects[school.name.toLowerCase() as keyof typeof SPELL_DATA.effects] || SPELL_DATA.effects.evocation;
    const primaryEffect = getRandomElement(effects);
    
    // Create description based on school and level
    let description = primaryEffect;
    
    if (level.level === 0) {
      description += ". This cantrip can be cast at will.";
    } else if (level.level >= 5) {
      description += ". When cast using a spell slot of 6th level or higher, the effects are enhanced.";
    }
    
    // Add flavor text based on school
    const flavorTexts = {
      abjuration: "Protective energies swirl around the target.",
      conjuration: "Reality bends as the magic takes effect.",
      divination: "Knowledge flows into your mind.",
      enchantment: "The target's eyes glaze over momentarily.",
      evocation: "Energy crackles through the air.",
      illusion: "The air shimmers with deceptive magic.",
      necromancy: "Dark energy pulses ominously.",
      transmutation: "The very essence of matter shifts."
    };
    
    const flavor = flavorTexts[school.name.toLowerCase() as keyof typeof flavorTexts];
    if (flavor) {
      description += ` ${flavor}`;
    }
    
    return {
      name: generateSpellName(),
      level: level.level,
      school: school.name,
      castingTime: getRandomElement(SPELL_DATA.castingTimes),
      range: getRandomElement(SPELL_DATA.ranges),
      components,
      duration: getRandomElement(SPELL_DATA.durations),
      description,
      color: school.color
    };
  };

  const generateSpells = (count: number = 6) => {
    const spells: GeneratedSpell[] = [];
    
    for (let i = 0; i < count; i++) {
      const spell = generateSpell();
      // Avoid duplicate names
      if (!spells.find(s => s.name === spell.name)) {
        spells.push(spell);
      } else {
        i--; // Try again
      }
    }
    
    setGeneratedSpells(spells);
  };

  const saveSpell = (spell: GeneratedSpell) => {
    if (!savedSpells.find(s => s.name === spell.name)) {
      const updated = [...savedSpells, spell];
      setSavedSpells(updated);
      localStorage.setItem('world-engine-saved-spells', JSON.stringify(updated));
    }
  };

  const removeSavedSpell = (spellName: string) => {
    const updated = savedSpells.filter(s => s.name !== spellName);
    setSavedSpells(updated);
    localStorage.setItem('world-engine-saved-spells', JSON.stringify(updated));
  };

  const exportSavedSpells = () => {
    const dataStr = JSON.stringify(savedSpells, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `world-engine-spells-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Load saved spells on component mount
  React.useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('world-engine-saved-spells') || '[]');
      setSavedSpells(saved);
    } catch (error) {
      console.error('Error loading saved spells:', error);
    }
  }, []);

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
          <h1 style={{ margin: 0, fontSize: "2.5rem", fontWeight: "bold" }}>Spell Generator</h1>
          <p style={{ margin: "0.5rem 0 0", opacity: 0.8 }}>
            Create custom spells with magical effects and descriptions
          </p>
        </div>
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
            Back to Menu
          </button>
        )}
      </div>

      <div style={{ display: "flex", height: "calc(100vh - 120px)" }}>
        {/* Left Panel - Controls */}
        <div style={{
          flex: 1,
          padding: "2rem",
          borderRight: "1px solid #334155",
          overflowY: "auto"
        }}>
          <div style={{ marginBottom: "2rem" }}>
            <h3 style={{ marginBottom: "1rem", color: "#f1f5f9" }}>School of Magic</h3>
            <select
              value={selectedSchool}
              onChange={(e) => setSelectedSchool(e.target.value)}
              style={{
                width: "100%",
                padding: "0.75rem",
                background: "#1e293b",
                border: "1px solid #334155",
                borderRadius: "4px",
                color: "#e2e8f0",
                fontSize: "1rem"
              }}
            >
              <option value="any">Any School</option>
              {SPELL_DATA.schools.map(school => (
                <option key={school.name} value={school.name.toLowerCase()}>
                  {school.name} - {school.description}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: "2rem" }}>
            <h3 style={{ marginBottom: "1rem", color: "#f1f5f9" }}>Spell Level</h3>
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(parseInt(e.target.value))}
              style={{
                width: "100%",
                padding: "0.75rem",
                background: "#1e293b",
                border: "1px solid #334155",
                borderRadius: "4px",
                color: "#e2e8f0",
                fontSize: "1rem"
              }}
            >
              <option value={-1}>Any Level</option>
              {SPELL_DATA.levels.map(level => (
                <option key={level.level} value={level.level}>
                  {level.name} - {level.description}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => generateSpells(6)}
            style={{
              width: "100%",
              padding: "1rem",
              background: "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: "6px",
              fontSize: "1.1rem",
              fontWeight: "bold",
              cursor: "pointer",
              marginBottom: "1rem"
            }}
          >
            Generate Spells
          </button>

          <button
            onClick={() => generateSpells(12)}
            style={{
              width: "100%",
              padding: "0.75rem",
              background: "#059669",
              color: "white",
              border: "none",
              borderRadius: "6px",
              fontSize: "1rem",
              cursor: "pointer"
            }}
          >
            Generate More (12)
          </button>
        </div>

        {/* Center Panel - Generated Spells */}
        <div style={{
          flex: 2,
          padding: "2rem",
          borderRight: "1px solid #334155",
          overflowY: "auto"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
            <h3 style={{ margin: 0, color: "#f1f5f9" }}>Generated Spells</h3>
            {generatedSpells.length > 0 && (
              <span style={{ color: "#94a3b8", fontSize: "0.9rem" }}>
                {generatedSpells.length} spells
              </span>
            )}
          </div>

          {generatedSpells.length === 0 ? (
            <div style={{
              textAlign: "center",
              padding: "3rem",
              color: "#64748b",
              fontStyle: "italic"
            }}>
              Click "Generate Spells" to create magical effects!
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {generatedSpells.map((spell, index) => (
                <div key={index} style={{
                  padding: "1.5rem",
                  background: "rgba(15, 23, 42, 0.5)",
                  border: `2px solid ${spell.color}`,
                  borderRadius: "8px"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                    <div>
                      <h4 style={{ margin: "0 0 0.5rem", fontSize: "1.3rem", color: spell.color }}>
                        {spell.name}
                      </h4>
                      <p style={{ margin: 0, color: "#94a3b8", fontSize: "0.9rem" }}>
                        {spell.level === 0 ? "Cantrip" : `${spell.level}${spell.level === 1 ? 'st' : spell.level === 2 ? 'nd' : spell.level === 3 ? 'rd' : 'th'} level`} {spell.school.toLowerCase()}
                      </p>
                    </div>
                    <button
                      onClick={() => saveSpell(spell)}
                      disabled={savedSpells.find(s => s.name === spell.name) !== undefined}
                      style={{
                        padding: "0.5rem 1rem",
                        background: savedSpells.find(s => s.name === spell.name) ? "#374151" : "#059669",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        fontSize: "0.9rem",
                        cursor: savedSpells.find(s => s.name === spell.name) ? "not-allowed" : "pointer"
                      }}
                    >
                      {savedSpells.find(s => s.name === spell.name) ? "Saved" : "Save"}
                    </button>
                  </div>
                  
                  <div style={{ fontSize: "0.9rem", color: "#cbd5e1", lineHeight: "1.4" }}>
                    <p style={{ margin: "0.5rem 0" }}><strong>Casting Time:</strong> {spell.castingTime}</p>
                    <p style={{ margin: "0.5rem 0" }}><strong>Range:</strong> {spell.range}</p>
                    <p style={{ margin: "0.5rem 0" }}><strong>Components:</strong> {spell.components.join(', ')}</p>
                    <p style={{ margin: "0.5rem 0" }}><strong>Duration:</strong> {spell.duration}</p>
                    <p style={{ margin: "1rem 0 0", fontStyle: "italic" }}>{spell.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Panel - Saved Spells */}
        <div style={{
          flex: 1,
          padding: "2rem"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
            <h3 style={{ margin: 0, color: "#f1f5f9" }}>Saved Spells</h3>
            {savedSpells.length > 0 && (
              <button
                onClick={exportSavedSpells}
                style={{
                  padding: "0.5rem",
                  background: "#374151",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  fontSize: "0.8rem",
                  cursor: "pointer"
                }}
              >
                Export
              </button>
            )}
          </div>

          {savedSpells.length === 0 ? (
            <div style={{
              textAlign: "center",
              padding: "2rem",
              color: "#64748b",
              fontStyle: "italic"
            }}>
              Save spells you like here!
            </div>
          ) : (
            <div style={{
              maxHeight: "calc(100vh - 250px)",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem"
            }}>
              {savedSpells.map((spell, index) => (
                <div key={index} style={{
                  padding: "1rem",
                  background: "rgba(15, 23, 42, 0.3)",
                  border: `1px solid ${spell.color}`,
                  borderRadius: "6px",
                  display: "flex",
                  flexDirection: "column"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <h5 style={{ margin: "0 0 0.25rem", color: spell.color, fontSize: "1rem" }}>
                        {spell.name}
                      </h5>
                      <p style={{ margin: 0, fontSize: "0.8rem", color: "#94a3b8" }}>
                        Level {spell.level} {spell.school}
                      </p>
                    </div>
                    <button
                      onClick={() => removeSavedSpell(spell.name)}
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
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}