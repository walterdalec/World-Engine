import React, { useState, useEffect } from 'react';

interface Character {
  id?: string;
  name: string;
  class?: string;
  characterClass?: string; // Support both formats
  race?: string;
  level?: number;
  baseStats?: {
    strength: number;
    constitution: number;
    wisdom: number;
    intelligence: number;
    dexterity: number;
    charisma: number;
  };
  finalStats?: {
    strength: number;
    constitution: number;
    wisdom: number;
    intelligence: number;
    dexterity: number;
    charisma: number;
  };
  hitPoints?: number;
  knownSpells?: string[];
  knownCantrips?: string[];
  data?: any; // For characters from CharacterCreate
}

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

interface SpellAssignmentProps {
  onBack?: () => void;
}

export default function SpellAssignment({ onBack }: SpellAssignmentProps) {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [availableSpells, setAvailableSpells] = useState<GeneratedSpell[]>([]);
  const [selectedCharacter, setSelectedCharacter] = useState<number>(-1);
  const [selectedSpell, setSelectedSpell] = useState<number>(-1);

  // Helper functions to normalize character data
  const getCharacterClass = (character: Character): string => {
    return character.class || character.characterClass || 'Unknown';
  };

  const getCharacterLevel = (character: Character): number => {
    return character.level || character.data?.level || 1;
  };

  const getCharacterStats = (character: Character) => {
    if (character.finalStats) return character.finalStats;
    if (character.data?.stats) return character.data.stats;
    // Default stats for characters without stat data
    return {
      strength: 10,
      constitution: 10,
      wisdom: 10,
      intelligence: 10,
      dexterity: 10,
      charisma: 10
    };
  };

  // Create test characters if no real characters exist
  const createTestCharacters = (): Character[] => [
    {
      id: 'test-cleric',
      name: "Elara the Cleric",
      class: "Cleric",
      race: "Human",
      level: 3,
      baseStats: { strength: 12, constitution: 14, wisdom: 16, intelligence: 10, dexterity: 13, charisma: 15 },
      finalStats: { strength: 12, constitution: 14, wisdom: 16, intelligence: 10, dexterity: 13, charisma: 15 },
      hitPoints: 28,
      knownSpells: [],
      knownCantrips: []
    },
    {
      id: 'test-wizard',
      name: "Merlin the Wise",
      class: "Wizard",
      race: "Elf",
      level: 4,
      baseStats: { strength: 8, constitution: 12, wisdom: 13, intelligence: 17, dexterity: 14, charisma: 10 },
      finalStats: { strength: 8, constitution: 12, wisdom: 13, intelligence: 17, dexterity: 14, charisma: 10 },
      hitPoints: 24,
      knownSpells: [],
      knownCantrips: []
    },
    {
      id: 'test-paladin',
      name: "Sir Roland",
      class: "Paladin",
      race: "Human",
      level: 3,
      baseStats: { strength: 16, constitution: 14, wisdom: 11, intelligence: 10, dexterity: 10, charisma: 15 },
      finalStats: { strength: 16, constitution: 14, wisdom: 11, intelligence: 10, dexterity: 10, charisma: 15 },
      hitPoints: 32,
      knownSpells: [],
      knownCantrips: []
    },
    {
      id: 'test-sorcerer',
      name: "Luna Stormcaller",
      class: "Sorcerer",
      race: "Dragonborn",
      level: 2,
      baseStats: { strength: 10, constitution: 13, wisdom: 12, intelligence: 11, dexterity: 14, charisma: 16 },
      finalStats: { strength: 10, constitution: 13, wisdom: 12, intelligence: 11, dexterity: 14, charisma: 16 },
      hitPoints: 18,
      knownSpells: [],
      knownCantrips: []
    },
    {
      id: 'test-druid',
      name: "Thorn Earthwalker",
      class: "Druid",
      race: "Half-Elf",
      level: 3,
      baseStats: { strength: 11, constitution: 14, wisdom: 16, intelligence: 12, dexterity: 13, charisma: 14 },
      finalStats: { strength: 11, constitution: 14, wisdom: 16, intelligence: 12, dexterity: 13, charisma: 14 },
      hitPoints: 26,
      knownSpells: [],
      knownCantrips: []
    }
  ];

  // Load characters and spells on component mount
  useEffect(() => {
    try {
      const savedCharacters = JSON.parse(localStorage.getItem('world-engine-characters') || '[]');
      const savedSpells = JSON.parse(localStorage.getItem('world-engine-saved-spells') || '[]');
      
      // Always include test characters for easy testing
      const testCharacters = createTestCharacters();
      
      // Merge saved characters with test characters, avoiding duplicates
      const allCharacters = [...testCharacters];
      
      savedCharacters.forEach((savedChar: any) => {
        // Don't add if it's a test character (check by ID)
        if (!testCharacters.find(test => test.id === savedChar.id)) {
          allCharacters.push(savedChar);
        }
      });
      
      setCharacters(allCharacters);
      setAvailableSpells(savedSpells);
      
      console.log('Loaded characters:', allCharacters.length, 'characters (', testCharacters.length, 'test +', savedCharacters.length, 'saved)');
    } catch (error) {
      console.error('Error loading data:', error);
      // Fallback to just test characters
      setCharacters(createTestCharacters());
    }
  }, []);

  const canCharacterLearnSpell = (character: Character, spell: GeneratedSpell): boolean => {
    const characterClass = getCharacterClass(character);
    const level = getCharacterLevel(character);
    
    // Check if character can learn this type of spell based on class
    const spellcastingClasses = {
      'Wizard': { schools: ['all'], maxLevel: Math.ceil(level / 2) + 1, stat: 'intelligence' },
      'Sorcerer': { schools: ['all'], maxLevel: Math.ceil(level / 2) + 1, stat: 'charisma' },
      'Cleric': { schools: ['Abjuration', 'Divination', 'Evocation', 'Healing'], maxLevel: Math.ceil(level / 2) + 1, stat: 'wisdom' },
      'Druid': { schools: ['Conjuration', 'Divination', 'Evocation', 'Transmutation', 'Healing'], maxLevel: Math.ceil(level / 2) + 1, stat: 'wisdom' },
      'Paladin': { schools: ['Abjuration', 'Evocation', 'Healing'], maxLevel: Math.max(1, Math.ceil((level - 1) / 4)), stat: 'charisma' },
      'Ranger': { schools: ['Conjuration', 'Divination', 'Transmutation'], maxLevel: Math.max(1, Math.ceil((level - 1) / 4)), stat: 'wisdom' },
      'Bard': { schools: ['all'], maxLevel: Math.ceil(level / 2) + 1, stat: 'charisma' },
      'Warlock': { schools: ['all'], maxLevel: Math.min(5, Math.ceil(level / 2) + 1), stat: 'charisma' }
    };

    const classInfo = spellcastingClasses[characterClass as keyof typeof spellcastingClasses];
    if (!classInfo) return false; // Non-spellcasting class

    // Check spell level
    if (spell.level > classInfo.maxLevel) return false;

    // Check school restrictions
    if (classInfo.schools[0] !== 'all' && !classInfo.schools.includes(spell.school)) return false;

    // Check if already known
    if (spell.level === 0) {
      return !character.knownCantrips?.includes(spell.name);
    } else {
      return !character.knownSpells?.includes(spell.name);
    }
  };

  const assignSpell = () => {
    if (selectedCharacter === -1 || selectedSpell === -1) return;

    const character = characters[selectedCharacter];
    const spell = availableSpells[selectedSpell];

    if (!canCharacterLearnSpell(character, spell)) {
      alert(`${character.name} cannot learn ${spell.name}!`);
      return;
    }

    const updatedCharacters = characters.map((char, index) => {
      if (index === selectedCharacter) {
        if (spell.level === 0) {
          // Cantrip
          return {
            ...char,
            knownCantrips: [...(char.knownCantrips || []), spell.name]
          };
        } else {
          // Regular spell
          return {
            ...char,
            knownSpells: [...(char.knownSpells || []), spell.name]
          };
        }
      }
      return char;
    });

    setCharacters(updatedCharacters);
    localStorage.setItem('world-engine-characters', JSON.stringify(updatedCharacters));

    // Reset selections
    setSelectedCharacter(-1);
    setSelectedSpell(-1);
  };

  const removeSpell = (characterIndex: number, spellName: string, isCantrip: boolean) => {
    const updatedCharacters = characters.map((char, index) => {
      if (index === characterIndex) {
        if (isCantrip) {
          return {
            ...char,
            knownCantrips: char.knownCantrips?.filter(s => s !== spellName) || []
          };
        } else {
          return {
            ...char,
            knownSpells: char.knownSpells?.filter(s => s !== spellName) || []
          };
        }
      }
      return char;
    });

    setCharacters(updatedCharacters);
    localStorage.setItem('world-engine-characters', JSON.stringify(updatedCharacters));
  };

  const getSpellcastingInfo = (character: Character) => {
    const characterClass = getCharacterClass(character);
    const level = getCharacterLevel(character);
    
    const spellcastingClasses = {
      'Wizard': { maxLevel: Math.ceil(level / 2) + 1, stat: 'Intelligence' },
      'Sorcerer': { maxLevel: Math.ceil(level / 2) + 1, stat: 'Charisma' },
      'Cleric': { maxLevel: Math.ceil(level / 2) + 1, stat: 'Wisdom' },
      'Druid': { maxLevel: Math.ceil(level / 2) + 1, stat: 'Wisdom' },
      'Paladin': { maxLevel: Math.max(1, Math.ceil((level - 1) / 4)), stat: 'Charisma' },
      'Ranger': { maxLevel: Math.max(1, Math.ceil((level - 1) / 4)), stat: 'Wisdom' },
      'Bard': { maxLevel: Math.ceil(level / 2) + 1, stat: 'Charisma' },
      'Warlock': { maxLevel: Math.min(5, Math.ceil(level / 2) + 1), stat: 'Charisma' }
    };

    return spellcastingClasses[characterClass as keyof typeof spellcastingClasses];
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
      color: "#e2e8f0",
      padding: "2rem"
    }}>
      {/* Header */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "2rem",
        padding: "1rem",
        background: "rgba(15, 23, 42, 0.8)",
        borderRadius: "8px",
        border: "1px solid #334155"
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "2rem", fontWeight: "bold" }}>Spell Assignment</h1>
          <p style={{ margin: "0.5rem 0 0", opacity: 0.8 }}>
            Assign spells to characters based on their class and abilities
          </p>
        </div>
        {onBack && (
          <button
            onClick={onBack}
            style={{
              padding: "0.5rem 1rem",
              background: "#475569",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer"
            }}
          >
            Back to Menu
          </button>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
        {/* Left Panel - Spell Assignment */}
        <div style={{
          background: "rgba(30, 41, 59, 0.8)",
          border: "1px solid #334155",
          borderRadius: "8px",
          padding: "1.5rem"
        }}>
          <h2 style={{ margin: "0 0 1rem", color: "#3b82f6" }}>Assign Spells</h2>

          {characters.length === 0 && (
            <p style={{ color: "#94a3b8", fontStyle: "italic" }}>
              No characters found. Create some characters first!
            </p>
          )}

          {availableSpells.length === 0 && (
            <p style={{ color: "#94a3b8", fontStyle: "italic" }}>
              No spells available. Generate some spells first!
            </p>
          )}

          {characters.length > 0 && availableSpells.length > 0 && (
            <>
              {/* Character Selection */}
              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>
                  Select Character:
                </label>
                <select
                  value={selectedCharacter}
                  onChange={(e) => setSelectedCharacter(parseInt(e.target.value))}
                  style={{
                    width: "100%",
                    padding: "0.5rem",
                    background: "#1e293b",
                    border: "1px solid #475569",
                    borderRadius: "4px",
                    color: "#e2e8f0"
                  }}
                >
                  <option value={-1}>Choose a character...</option>
                  {characters.map((char, index) => {
                    const spellInfo = getSpellcastingInfo(char);
                    const characterClass = getCharacterClass(char);
                    const level = getCharacterLevel(char);
                    return (
                      <option key={index} value={index}>
                        {char.name} ({characterClass}, Level {level}
                        {spellInfo ? ` - Max Spell Level ${spellInfo.maxLevel}` : ' - No Spellcasting'})
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Spell Selection */}
              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>
                  Select Spell:
                </label>
                <select
                  value={selectedSpell}
                  onChange={(e) => setSelectedSpell(parseInt(e.target.value))}
                  style={{
                    width: "100%",
                    padding: "0.5rem",
                    background: "#1e293b",
                    border: "1px solid #475569",
                    borderRadius: "4px",
                    color: "#e2e8f0"
                  }}
                >
                  <option value={-1}>Choose a spell...</option>
                  {availableSpells.map((spell, index) => {
                    const canLearn = selectedCharacter >= 0 ? 
                      canCharacterLearnSpell(characters[selectedCharacter], spell) : true;
                    return (
                      <option 
                        key={index} 
                        value={index} 
                        disabled={!canLearn}
                        style={{ color: canLearn ? "#e2e8f0" : "#6b7280" }}
                      >
                        {spell.name} (Level {spell.level}, {spell.school})
                        {!canLearn ? " - Cannot Learn" : ""}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Assign Button */}
              <button
                onClick={assignSpell}
                disabled={selectedCharacter === -1 || selectedSpell === -1}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  background: selectedCharacter >= 0 && selectedSpell >= 0 ? "#3b82f6" : "#475569",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "1rem",
                  cursor: selectedCharacter >= 0 && selectedSpell >= 0 ? "pointer" : "not-allowed",
                  fontWeight: "bold"
                }}
              >
                Assign Spell
              </button>

              {/* Spell Compatibility Info */}
              {selectedCharacter >= 0 && selectedSpell >= 0 && (
                <div style={{
                  marginTop: "1rem",
                  padding: "1rem",
                  background: canCharacterLearnSpell(characters[selectedCharacter], availableSpells[selectedSpell])
                    ? "rgba(34, 197, 94, 0.1)" : "rgba(239, 68, 68, 0.1)",
                  border: `1px solid ${canCharacterLearnSpell(characters[selectedCharacter], availableSpells[selectedSpell])
                    ? "#22c55e" : "#ef4444"}`,
                  borderRadius: "6px"
                }}>
                  <p style={{ margin: 0, fontSize: "0.9rem" }}>
                    {canCharacterLearnSpell(characters[selectedCharacter], availableSpells[selectedSpell])
                      ? `✓ ${characters[selectedCharacter].name} can learn ${availableSpells[selectedSpell].name}!`
                      : `✗ ${characters[selectedCharacter].name} cannot learn ${availableSpells[selectedSpell].name}.`
                    }
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Right Panel - Character Spell Lists */}
        <div style={{
          background: "rgba(30, 41, 59, 0.8)",
          border: "1px solid #334155",
          borderRadius: "8px",
          padding: "1.5rem"
        }}>
          <h2 style={{ margin: "0 0 1rem", color: "#22c55e" }}>Character Spells</h2>

          {characters.length === 0 ? (
            <p style={{ color: "#94a3b8", fontStyle: "italic" }}>
              No characters to display.
            </p>
          ) : (
            <div style={{ maxHeight: "70vh", overflowY: "auto" }}>
              {characters.map((char, charIndex) => {
                const spellInfo = getSpellcastingInfo(char);
                return (
                  <div
                    key={charIndex}
                    style={{
                      marginBottom: "1.5rem",
                      padding: "1rem",
                      background: "rgba(15, 23, 42, 0.6)",
                      border: "1px solid #475569",
                      borderRadius: "6px"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <h3 style={{ margin: 0, color: "#f8fafc" }}>{char.name}</h3>
                      <span style={{ fontSize: "0.8rem", color: "#94a3b8" }}>
                        {getCharacterClass(char)} Level {getCharacterLevel(char)}
                      </span>
                    </div>

                    {spellInfo ? (
                      <>
                        <p style={{ margin: "0.5rem 0", fontSize: "0.8rem", color: "#94a3b8" }}>
                          Spellcasting Stat: {spellInfo.stat} | Max Spell Level: {spellInfo.maxLevel}
                        </p>

                        {/* Cantrips */}
                        {char.knownCantrips && char.knownCantrips.length > 0 && (
                          <div style={{ marginBottom: "0.5rem" }}>
                            <h4 style={{ margin: "0 0 0.25rem", fontSize: "0.9rem", color: "#60a5fa" }}>
                              Cantrips:
                            </h4>
                            {char.knownCantrips.map((cantrip, spellIndex) => (
                              <div key={spellIndex} style={{ 
                                display: "flex", 
                                justifyContent: "space-between", 
                                alignItems: "center",
                                padding: "0.25rem 0.5rem",
                                background: "rgba(59, 130, 246, 0.1)",
                                border: "1px solid #3b82f6",
                                borderRadius: "4px",
                                margin: "0.25rem 0",
                                fontSize: "0.8rem"
                              }}>
                                <span>{cantrip}</span>
                                <button
                                  onClick={() => removeSpell(charIndex, cantrip, true)}
                                  style={{
                                    background: "#ef4444",
                                    color: "white",
                                    border: "none",
                                    borderRadius: "3px",
                                    padding: "0.125rem 0.25rem",
                                    fontSize: "0.7rem",
                                    cursor: "pointer"
                                  }}
                                >
                                  Remove
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Spells */}
                        {char.knownSpells && char.knownSpells.length > 0 && (
                          <div>
                            <h4 style={{ margin: "0 0 0.25rem", fontSize: "0.9rem", color: "#34d399" }}>
                              Spells:
                            </h4>
                            {char.knownSpells.map((spell, spellIndex) => (
                              <div key={spellIndex} style={{ 
                                display: "flex", 
                                justifyContent: "space-between", 
                                alignItems: "center",
                                padding: "0.25rem 0.5rem",
                                background: "rgba(34, 197, 94, 0.1)",
                                border: "1px solid #22c55e",
                                borderRadius: "4px",
                                margin: "0.25rem 0",
                                fontSize: "0.8rem"
                              }}>
                                <span>{spell}</span>
                                <button
                                  onClick={() => removeSpell(charIndex, spell, false)}
                                  style={{
                                    background: "#ef4444",
                                    color: "white",
                                    border: "none",
                                    borderRadius: "3px",
                                    padding: "0.125rem 0.25rem",
                                    fontSize: "0.7rem",
                                    cursor: "pointer"
                                  }}
                                >
                                  Remove
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        {(!char.knownSpells || char.knownSpells.length === 0) && 
                         (!char.knownCantrips || char.knownCantrips.length === 0) && (
                          <p style={{ fontSize: "0.8rem", color: "#6b7280", fontStyle: "italic" }}>
                            No spells learned yet.
                          </p>
                        )}
                      </>
                    ) : (
                      <p style={{ fontSize: "0.8rem", color: "#6b7280", fontStyle: "italic" }}>
                        This class cannot cast spells.
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
