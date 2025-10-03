import React, { useState } from 'react';
import { rng } from "../../core/services/random";
import { storage } from "../../core/services/storage";

interface Character {
  name: string;
  class: string;
  baseStats: {
    strength: number;
    constitution: number;
    wisdom: number;
    intelligence: number;
    dexterity: number;
    charisma: number;
  };
  finalStats: {
    strength: number;
    constitution: number;
    wisdom: number;
    intelligence: number;
    dexterity: number;
    charisma: number;
  };
  hitPoints: number;
  level: number;
  knownSpells?: string[];
  knownCantrips?: string[];
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

interface HealingSystemProps {
  onBack?: () => void;
}

export default function HealingSystem({ onBack }: HealingSystemProps) {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [availableSpells, setAvailableSpells] = useState<GeneratedSpell[]>([]);
  const [healingLog, setHealingLog] = useState<string[]>([]);

  // Load characters and spells on component mount
  React.useEffect(() => {
    try {
      const savedCharacters = JSON.parse(storage.local.getItem('world-engine-characters') || '[]');
      const savedSpells = JSON.parse(storage.local.getItem('world-engine-saved-spells') || '[]');
      
      // Debug: Log the raw saved characters
      console.log('Raw saved characters:', savedCharacters);
      
      // Always include test characters for easy testing
      const testCharacters: Character[] = [
        {
          name: "Elara the Cleric",
          class: "Cleric",
          baseStats: { strength: 12, constitution: 14, wisdom: 16, intelligence: 10, dexterity: 13, charisma: 15 },
          finalStats: { strength: 12, constitution: 14, wisdom: 16, intelligence: 10, dexterity: 13, charisma: 15 },
          hitPoints: 32, // Slightly injured
          level: 3,
          knownSpells: ["Cure Light Wounds", "Healing Word", "Prayer of Healing"]
        },
        {
          name: "Thorin Ironbeard",
          class: "Fighter",
          baseStats: { strength: 16, constitution: 15, wisdom: 11, intelligence: 9, dexterity: 12, charisma: 10 },
          finalStats: { strength: 16, constitution: 15, wisdom: 11, intelligence: 9, dexterity: 12, charisma: 10 },
          hitPoints: 18, // Badly injured
          level: 2
        },
        {
          name: "Luna Shadowstep",
          class: "Rogue",
          baseStats: { strength: 10, constitution: 12, wisdom: 14, intelligence: 13, dexterity: 17, charisma: 11 },
          finalStats: { strength: 10, constitution: 12, wisdom: 14, intelligence: 13, dexterity: 17, charisma: 11 },
          hitPoints: 22, // Moderately injured
          level: 2
        }
      ];
      
      // Merge test characters with saved characters, avoiding duplicates by name
      const allCharacters = [...testCharacters];
      
      // Add saved characters that aren't already in test characters
      savedCharacters.forEach((savedChar: any) => {
        // Check if this is a character from CharacterCreate (has characterClass and data field)
        if (savedChar.characterClass && savedChar.name && !allCharacters.find(test => test.name === savedChar.name)) {
          // Get character data from nested structure
          const charData = savedChar.data || savedChar;
          
          // Calculate HP based on constitution and level (more realistic)
          const constitution = charData.constitution || charData.baseStats?.constitution || 14;
          const level = savedChar.level || charData.level || 1;
          const baseHP = 10 + Math.floor((constitution - 10) / 2) * level;
          const maxHP = Math.max(baseHP + (level * 6), 20); // Minimum 20 HP
          
          // Convert saved character format to expected format
          const normalizedChar: Character = {
            name: savedChar.name,
            class: savedChar.characterClass,
            baseStats: { 
              strength: charData.strength || 10, 
              constitution: constitution, 
              wisdom: charData.wisdom || 12, 
              intelligence: charData.intelligence || 11, 
              dexterity: charData.dexterity || 13, 
              charisma: charData.charisma || 10 
            },
            finalStats: { 
              strength: charData.strength || 10, 
              constitution: constitution, 
              wisdom: charData.wisdom || 12, 
              intelligence: charData.intelligence || 11, 
              dexterity: charData.dexterity || 13, 
              charisma: charData.charisma || 10 
            },
            hitPoints: maxHP, // Start at full HP
            level: level,
            knownSpells: charData.knownSpells || [],
            knownCantrips: charData.knownCantrips || []
          };
          allCharacters.push(normalizedChar);
        }
      });
      
      setCharacters(allCharacters);
      addToLog(`Loaded ${allCharacters.length} characters for healing system (${testCharacters.length} test + ${allCharacters.length - testCharacters.length} saved)`);
      
      // Debug log for custom characters
      const customChars = allCharacters.filter(char => !testCharacters.find(test => test.name === char.name));
      if (customChars.length > 0) {
        addToLog(`Custom characters loaded: ${customChars.map(c => `${c.name} (${c.hitPoints} HP)`).join(', ')}`);
      }
      
      setAvailableSpells(savedSpells);
    } catch (error) {
      console.error('Error loading data:', error);
      // Fallback to just test characters
      const testCharacters: Character[] = [
        {
          name: "Elara the Cleric",
          class: "Cleric",
          baseStats: { strength: 12, constitution: 14, wisdom: 16, intelligence: 10, dexterity: 13, charisma: 15 },
          finalStats: { strength: 12, constitution: 14, wisdom: 16, intelligence: 10, dexterity: 13, charisma: 15 },
          hitPoints: 32,
          level: 3,
          knownSpells: ["Cure Light Wounds", "Healing Word", "Prayer of Healing"]
        }
      ];
      setCharacters(testCharacters);
      addToLog("Loaded fallback test characters");
    }
  }, []);

  const addToLog = (message: string) => {
    setHealingLog(prev => [...prev, message]);
  };

  const rollDice = (sides: number): number => {
    return Math.floor(rng.next() * sides) + 1;
  };

  const getModifier = (stat: number): number => {
    return Math.floor((stat - 10) / 2);
  };

  const castHealingSpell = (caster: Character, spell: GeneratedSpell, target: Character) => {
    const spellDesc = spell.description.toLowerCase();
    const isHealing = spellDesc.includes('heal') || spellDesc.includes('restore');
    
    if (!isHealing) {
      addToLog(`❌ ${spell.name} is not a healing spell!`);
      return;
    }

    // Calculate healing amount based on spell level and caster's wisdom
    let healingAmount = 0;
    const wisModifier = getModifier(caster.finalStats.wisdom);
    
    if (spell.level === 0) {
      // Cantrip healing
      healingAmount = rollDice(4) + wisModifier;
    } else {
      // Leveled spell healing
      healingAmount = rollDice(8) * spell.level + wisModifier;
    }

    healingAmount = Math.max(1, healingAmount); // Minimum 1 healing

    const oldHP = target.hitPoints;
    const newHP = Math.min(target.hitPoints + healingAmount, 100); // Assuming max 100 HP

    setCharacters(prev => 
      prev.map(char => 
        char.name === target.name 
          ? { ...char, hitPoints: newHP }
          : char
      )
    );

    const actualHealing = newHP - oldHP;
    addToLog(`✨ ${caster.name} casts ${spell.name} on ${target.name}`);
    addToLog(`💚 ${target.name} heals ${actualHealing} HP (${oldHP} → ${newHP})`);
    
    if (actualHealing === 0) {
      addToLog(`${target.name} is already at full health!`);
    }
  };

  const naturalHealing = (character: Character) => {
    const conModifier = getModifier(character.finalStats.constitution);
    const healingAmount = Math.max(1, rollDice(4) + conModifier);
    
    const oldHP = character.hitPoints;
    const newHP = Math.min(character.hitPoints + healingAmount, 100);

    setCharacters(prev => 
      prev.map(char => 
        char.name === character.name 
          ? { ...char, hitPoints: newHP }
          : char
      )
    );

    const actualHealing = newHP - oldHP;
    addToLog(`🛡️ ${character.name} takes a rest and recovers naturally`);
    addToLog(`💚 Natural healing: ${actualHealing} HP (${oldHP} → ${newHP})`);
  };

  const simulateInjury = (character: Character) => {
    // Make sure character has valid hitPoints
    if (isNaN(character.hitPoints) || character.hitPoints === undefined) {
      addToLog(`❌ Error: ${character.name} has invalid HP data. Cannot simulate injury.`);
      return;
    }

    const damage = rollDice(20) + rollDice(6); // Random damage for testing
    const oldHP = character.hitPoints;
    const newHP = Math.max(0, character.hitPoints - damage);

    setCharacters(prev => 
      prev.map(char => 
        char.name === character.name 
          ? { ...char, hitPoints: newHP }
          : char
      )
    );

    addToLog(`💥 ${character.name} suffers an injury: ${damage} damage (${oldHP} → ${newHP})`);
    
    if (newHP === 0) {
      addToLog(`💀 ${character.name} is unconscious and needs immediate healing!`);
    }
  };

  const getHealingSpells = (): GeneratedSpell[] => {
    return availableSpells.filter(spell => 
      spell.description.toLowerCase().includes('heal') || 
      spell.description.toLowerCase().includes('restore')
    );
  };

  const getHealthColor = (hp: number): string => {
    if (hp <= 0) return '#991b1b';
    if (hp <= 25) return '#dc2626';
    if (hp <= 50) return '#f59e0b';
    if (hp <= 75) return '#eab308';
    return '#10b981';
  };

  const getHealthStatus = (hp: number): string => {
    if (hp <= 0) return 'Unconscious';
    if (hp <= 25) return 'Critical';
    if (hp <= 50) return 'Injured';
    if (hp <= 75) return 'Wounded';
    return 'Healthy';
  };

  const healingSpells = getHealingSpells();

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
      color: "#e2e8f0",
      padding: "2rem"
    }}>
      {/* Header */}
      <div style={{
        padding: "1.5rem 2rem",
        borderBottom: "1px solid #334155",
        background: "rgba(15, 23, 42, 0.8)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        borderRadius: "8px",
        marginBottom: "2rem"
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "2.5rem", fontWeight: "bold" }}>⚕️ Healing & Recovery System</h1>
          <p style={{ margin: "0.5rem 0 0", opacity: 0.8 }}>
            Manage your party's health and use healing magic
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

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
        {/* Character Health Status */}
        <div style={{
          background: "rgba(15, 23, 42, 0.6)",
          borderRadius: "8px",
          padding: "1.5rem",
          border: "1px solid #334155"
        }}>
          <h2 style={{ margin: "0 0 1.5rem", color: "#f1f5f9" }}>👥 Party Health Status</h2>
          
          {characters.length === 0 ? (
            <div style={{
              textAlign: "center",
              padding: "2rem",
              color: "#64748b",
              fontStyle: "italic"
            }}>
              No characters found. Create some characters first!
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {characters.map((character, index) => (
                <div key={index} style={{
                  padding: "1rem",
                  background: "rgba(15, 23, 42, 0.8)",
                  border: `2px solid ${getHealthColor(character.hitPoints)}`,
                  borderRadius: "6px"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <h3 style={{ margin: "0 0 0.25rem", color: "#f1f5f9" }}>{character.name}</h3>
                      <p style={{ margin: 0, color: "#94a3b8", fontSize: "0.9rem" }}>
                        {character.class} • Level {character.level}
                      </p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{
                        fontSize: "1.2rem",
                        fontWeight: "bold",
                        color: getHealthColor(character.hitPoints)
                      }}>
                        {character.hitPoints}/100 HP
                      </div>
                      <div style={{
                        fontSize: "0.8rem",
                        color: getHealthColor(character.hitPoints)
                      }}>
                        {getHealthStatus(character.hitPoints)}
                      </div>
                    </div>
                  </div>

                  {/* Health Bar */}
                  <div style={{
                    marginTop: "0.75rem",
                    width: "100%",
                    height: "8px",
                    background: "#374151",
                    borderRadius: "4px",
                    overflow: "hidden"
                  }}>
                    <div style={{
                      width: `${character.hitPoints}%`,
                      height: "100%",
                      background: getHealthColor(character.hitPoints),
                      transition: "width 0.3s ease"
                    }} />
                  </div>

                  {/* Action Buttons */}
                  <div style={{
                    marginTop: "1rem",
                    display: "flex",
                    gap: "0.5rem",
                    flexWrap: "wrap"
                  }}>
                    <button
                      onClick={() => naturalHealing(character)}
                      style={{
                        padding: "0.5rem 1rem",
                        background: "#059669",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "0.9rem"
                      }}
                    >
                      🛏️ Natural Rest
                    </button>
                    <button
                      onClick={() => simulateInjury(character)}
                      style={{
                        padding: "0.5rem 1rem",
                        background: "#dc2626",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "0.9rem"
                      }}
                    >
                      💥 Simulate Injury
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Healing Magic */}
        <div style={{
          background: "rgba(15, 23, 42, 0.6)",
          borderRadius: "8px",
          padding: "1.5rem",
          border: "1px solid #334155"
        }}>
          <h2 style={{ margin: "0 0 1.5rem", color: "#f1f5f9" }}>✨ Healing Magic</h2>
          
          {healingSpells.length === 0 ? (
            <div style={{
              textAlign: "center",
              padding: "2rem",
              color: "#64748b",
              fontStyle: "italic"
            }}>
              No healing spells found. Generate some healing spells in the Spell Generator!
            </div>
          ) : (
            <div>
              <p style={{ color: "#94a3b8", marginBottom: "1rem" }}>
                Available healing spells: {healingSpells.length}
              </p>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {healingSpells.map((spell, spellIndex) => (
                  <div key={spellIndex} style={{
                    padding: "1rem",
                    background: "rgba(15, 23, 42, 0.8)",
                    border: `2px solid ${spell.color}`,
                    borderRadius: "6px"
                  }}>
                    <div style={{ marginBottom: "0.75rem" }}>
                      <h4 style={{ margin: "0 0 0.25rem", color: spell.color }}>
                        {spell.name}
                      </h4>
                      <p style={{ margin: 0, fontSize: "0.8rem", color: "#94a3b8" }}>
                        {spell.level === 0 ? "Cantrip" : `Level ${spell.level}`} • {spell.school}
                      </p>
                      <p style={{ margin: "0.5rem 0", fontSize: "0.9rem", color: "#cbd5e1" }}>
                        {spell.description}
                      </p>
                    </div>

                    {/* Caster Selection */}
                    <div style={{ marginBottom: "0.75rem" }}>
                      <label style={{ fontSize: "0.9rem", color: "#94a3b8", marginBottom: "0.5rem", display: "block" }}>
                        Choose caster:
                      </label>
                      <select style={{
                        width: "100%",
                        padding: "0.5rem",
                        background: "#374151",
                        border: "1px solid #6b7280",
                        borderRadius: "4px",
                        color: "#f9fafb"
                      }}>
                        <option value="">Select a character...</option>
                        {characters.map((char, charIndex) => (
                          <option key={charIndex} value={charIndex}>
                            {char.name} (Level {char.level} {char.class})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Target Selection */}
                    <div style={{ marginBottom: "0.75rem" }}>
                      <label style={{ fontSize: "0.9rem", color: "#94a3b8", marginBottom: "0.5rem", display: "block" }}>
                        Choose target:
                      </label>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                        {characters.map((char, charIndex) => (
                          <button
                            key={charIndex}
                            onClick={() => {
                              const casterSelect = document.querySelector(`select`) as HTMLSelectElement;
                              const casterIndex = parseInt(casterSelect?.value || '0');
                              if (casterSelect?.value && characters[casterIndex]) {
                                castHealingSpell(characters[casterIndex], spell, char);
                              } else {
                                addToLog('❌ Please select a caster first!');
                              }
                            }}
                            style={{
                              padding: "0.5rem 0.75rem",
                              background: char.hitPoints < 100 ? "#3b82f6" : "#6b7280",
                              color: "white",
                              border: "none",
                              borderRadius: "4px",
                              cursor: char.hitPoints < 100 ? "pointer" : "not-allowed",
                              fontSize: "0.8rem"
                            }}
                            disabled={char.hitPoints >= 100}
                          >
                            {char.name} ({char.hitPoints}/100)
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Healing Log */}
      <div style={{
        marginTop: "2rem",
        padding: "1.5rem",
        background: "rgba(15, 23, 42, 0.6)",
        borderRadius: "8px",
        border: "1px solid #334155"
      }}>
        <h3 style={{ margin: "0 0 1rem", color: "#f1f5f9" }}>📜 Healing Log</h3>
        <div style={{
          background: "rgba(0, 0, 0, 0.3)",
          borderRadius: "4px",
          padding: "1rem",
          maxHeight: "200px",
          overflowY: "auto",
          fontSize: "0.9rem"
        }}>
          {healingLog.length === 0 ? (
            <p style={{ color: "#64748b", fontStyle: "italic" }}>No healing actions yet...</p>
          ) : (
            healingLog.slice(-10).map((entry, index) => (
              <div key={index} style={{ marginBottom: "0.5rem", color: "#d1d5db" }}>
                {entry}
              </div>
            ))
          )}
        </div>
        
        <button
          onClick={() => setHealingLog([])}
          style={{
            marginTop: "1rem",
            padding: "0.5rem 1rem",
            background: "#6b7280",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "0.9rem"
          }}
        >
          Clear Log
        </button>
      </div>
    </div>
  );
}