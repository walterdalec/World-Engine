import React, { useState } from 'react';

interface NameGeneratorProps {
  onBack?: () => void;
}

// Name components for different categories
const NAME_DATA = {
  human: {
    male: {
      first: ["Aiden", "Aldric", "Arthur", "Bjorn", "Caius", "Damien", "Edmund", "Gareth", "Hector", "Ivan", "Jasper", "Kai", "Leander", "Marcus", "Nolan", "Owen", "Pierce", "Quinn", "Rowan", "Soren", "Thane", "Ulric", "Victor", "Willem", "Xavier", "Yorick", "Zander"],
      last: ["Blackwood", "Brightblade", "Stormwind", "Ironforge", "Goldleaf", "Silverstone", "Ravencrest", "Drakemoor", "Thornfield", "Ashworth", "Redmane", "Whitehall", "Greycastle", "Bluestone", "Greenwood"]
    },
    female: {
      first: ["Aria", "Brenna", "Celeste", "Diana", "Elena", "Freya", "Gwen", "Helena", "Iris", "Jade", "Kira", "Luna", "Mira", "Nora", "Olivia", "Petra", "Quinn", "Raven", "Sera", "Tara", "Una", "Vera", "Willa", "Xara", "Yara", "Zara"],
      last: ["Blackwood", "Brightblade", "Stormwind", "Ironforge", "Goldleaf", "Silverstone", "Ravencrest", "Drakemoor", "Thornfield", "Ashworth", "Redmane", "Whitehall", "Greycastle", "Bluestone", "Greenwood"]
    }
  },
  elf: {
    male: {
      first: ["Aelindra", "Beiro", "Celeborn", "Daeron", "Elrond", "Faelar", "Galinndan", "Halimath", "Ivellios", "Jaelynn", "Kelvhan", "Lamlis", "Mindartis", "Naal", "Otaehryn", "Peren", "Quarion", "Riardon", "Silvyr", "Thamior", "Uldreyin", "Vanuath", "Wranvyre", "Xalvador", "Yeshelne", "Zoltan"],
      last: ["Amakir", "Amakir", "Bereris", "Cithreth", "Enna", "Galinndan", "Hadarai", "Immeral", "Ivellios", "Korfel", "Lamlis", "Mindartis", "Naal", "Nutae", "Paelinn", "Peren", "Riardon", "Rolen", "Silvyr", "Suhnaal", "Thamior", "Theriatis", "Theriapis", "Thervan", "Uthemar", "Vanuath", "Varis"]
    },
    female: {
      first: ["Adrie", "Birel", "Caelynn", "Dara", "Enna", "Galinndan", "Hadarai", "Immeral", "Ivellios", "Jannalor", "Korfel", "Lamlis", "Mialee", "Nutae", "Quelenna", "Sariel", "Shanairra", "Shava", "Silaqui", "Suhnaal", "Thamior", "Theriatis", "Theriapis", "Thervan", "Uthemar", "Vanuath", "Varis"],
      last: ["Amakir", "Bereris", "Cithreth", "Enna", "Galinndan", "Hadarai", "Immeral", "Ivellios", "Korfel", "Lamlis", "Mindartis", "Naal", "Nutae", "Paelinn", "Peren", "Riardon", "Rolen", "Silvyr", "Suhnaal", "Thamior", "Theriatis", "Theriapis", "Thervan", "Uthemar", "Vanuath", "Varis"]
    }
  },
  dwarf: {
    male: {
      first: ["Adrik", "Baern", "Darrak", "Eberk", "Fargrim", "Gardain", "Harbek", "Kildrak", "Morgran", "Orsik", "Rangrim", "Taklinn", "Thorek", "Ulfgar", "Vondal", "Balin", "Dain", "Dwalin", "Gloin", "Groin", "Nain", "Ori", "Oin", "Bifur", "Bofur", "Bombur", "Dori"],
      last: ["Battlehammer", "Brawnanvil", "Dankil", "Fireforge", "Frostbeard", "Gorunn", "Holderhek", "Ironfist", "Loderr", "Lutgehr", "Rumnaheim", "Strakeln", "Torunn", "Ungart", "Axebreaker", "Battlehammer", "Brawnanvil", "Dankil", "Fireforge", "Frostbeard", "Gorunn", "Holderhek", "Ironfist", "Loderr", "Lutgehr", "Rumnaheim"]
    },
    female: {
      first: ["Amber", "Bardryn", "Diesa", "Eldeth", "Gunnloda", "Guthkea", "Katernin", "Liftrasa", "Mardred", "Riswynn", "Sannl", "Torbera", "Torgga", "Vistra", "Kathra", "Kristryd", "Ilde", "Liftrasa", "Mardred", "Riswynn", "Sannl", "Torbera", "Torgga", "Vistra", "Welby", "Darrak", "Eberk"],
      last: ["Battlehammer", "Brawnanvil", "Dankil", "Fireforge", "Frostbeard", "Gorunn", "Holderhek", "Ironfist", "Loderr", "Lutgehr", "Rumnaheim", "Strakeln", "Torunn", "Ungart", "Axebreaker", "Battlehammer", "Brawnanvil", "Dankil", "Fireforge", "Frostbeard", "Gorunn", "Holderhek", "Ironfist", "Loderr", "Lutgehr", "Rumnaheim"]
    }
  },
  orc: {
    male: {
      first: ["Grokk", "Thokk", "Uruk", "Grash", "Mokk", "Drakk", "Snagg", "Gruul", "Krusk", "Thrag", "Vrokk", "Ghash", "Brokk", "Skarr", "Gorthak", "Mordak", "Ughak", "Grommash", "Thrall", "Garrosh", "Durotan", "Orgrim", "Blackhand", "Kilrogg", "Kargath", "Dentarg", "Hurkan"],
      last: ["Skullsplitter", "Bloodfang", "Ironjaw", "Bonecrusher", "Flameaxe", "Stormrage", "Shadowmoon", "Frostwolf", "Blackrock", "Bleeding Hollow", "Burning Blade", "Dragonmaw", "Laughing Skull", "Shattered Hand", "Twilight's Hammer", "Warsong", "Thunderlord", "Red Walker", "Whiteclaw", "Redstone", "Broken Bone", "Burning Eye", "Dark Spear", "Death's Head", "Frozen Rock", "Lightning's Blade", "Poisoned Spear"]
    },
    female: {
      first: ["Baggi", "Emen", "Engong", "Kansif", "Myev", "Neega", "Ovak", "Ownka", "Shautha", "Sutha", "Vola", "Volen", "Yevelda", "Grenda", "Mokka", "Urzul", "Shra", "Grakia", "Vrokka", "Thokka", "Greshka", "Mordka", "Ughka", "Snaggka", "Kruska", "Thraka", "Vroska"],
      last: ["Skullsplitter", "Bloodfang", "Ironjaw", "Bonecrusher", "Flameaxe", "Stormrage", "Shadowmoon", "Frostwolf", "Blackrock", "Bleeding Hollow", "Burning Blade", "Dragonmaw", "Laughing Skull", "Shattered Hand", "Twilight's Hammer", "Warsong", "Thunderlord", "Red Walker", "Whiteclaw", "Redstone", "Broken Bone", "Burning Eye", "Dark Spear", "Death's Head", "Frozen Rock", "Lightning's Blade", "Poisoned Spear"]
    }
  },
  places: {
    cities: ["Ravenspire", "Goldenhaven", "Ironhold", "Crystallake", "Thornwall", "Silverbrook", "Dragonrest", "Shadowmere", "Brightwater", "Stormhaven", "Millbrook", "Oakenford", "Rosewood", "Blackwater", "Whitestone", "Redmoor", "Greenvale", "Bluehaven", "Yellowhill", "Purplemist"],
    towns: ["Millhaven", "Brookshire", "Oakheart", "Pinewood", "Willowdale", "Maplegrove", "Birchwood", "Elmhurst", "Cedarfall", "Ashwood", "Hickory Hill", "Walnut Creek", "Cherry Blossom", "Apple Orchard", "Pear Valley", "Plum Grove", "Peach Hollow", "Berry Fields", "Vine Ridge", "Flower Meadow"],
    taverns: ["The Prancing Pony", "The Drunken Dragon", "The Golden Griffin", "The Silver Stag", "The Red Rose", "The Blue Moon", "The Green Goblin", "The Purple Parrot", "The Black Swan", "The White Wolf", "The Rusty Anchor", "The Broken Wheel", "The Laughing Dwarf", "The Singing Bard", "The Dancing Bear", "The Sleeping Giant", "The Weeping Willow", "The Howling Wolf", "The Roaring Lion", "The Soaring Eagle"]
  }
};

const FANTASY_SYLLABLES = {
  start: ["Ae", "Al", "Am", "An", "Ar", "Ba", "Bel", "Ber", "Bra", "Cal", "Cel", "Cor", "Da", "Del", "Dra", "El", "Er", "Fae", "Gal", "Gil", "Hal", "Ith", "Kor", "Lae", "Lor", "Mel", "Mor", "Nal", "Nor", "Quin", "Ral", "Sil", "Tal", "Thal", "Val", "Vel", "Xan", "Yor", "Zel"],
  middle: ["an", "ar", "as", "en", "er", "eth", "ia", "iel", "in", "ion", "is", "ith", "las", "len", "lin", "lon", "los", "neth", "oth", "ran", "ren", "rin", "ron", "ros", "san", "sen", "sin", "son", "sus", "tan", "ten", "tin", "ton", "tus", "van", "ven", "vin", "von", "vus"],
  end: ["ael", "aer", "ah", "al", "an", "ar", "ath", "el", "en", "er", "eth", "ia", "ial", "ian", "iel", "ien", "ier", "ies", "in", "ion", "is", "ith", "las", "len", "lin", "lon", "los", "neth", "oth", "ran", "ren", "rin", "ron", "ros", "us", "yn", "yr", "ys"]
};

export default function NameGenerator({ onBack }: NameGeneratorProps) {
  const [category, setCategory] = useState<string>('human');
  const [gender, setGender] = useState<string>('male');
  const [nameType, setNameType] = useState<string>('character');
  const [generatedNames, setGeneratedNames] = useState<string[]>([]);
  const [savedNames, setSavedNames] = useState<string[]>([]);

  const getRandomElement = <T,>(array: T[]): T => {
    return array[Math.floor(Math.random() * array.length)];
  };

  const generateCharacterName = () => {
    const data = NAME_DATA[category as keyof typeof NAME_DATA];
    if (data && typeof data === 'object' && 'male' in data) {
      const genderData = data[gender as keyof typeof data];
      if (genderData && typeof genderData === 'object' && 'first' in genderData) {
        const firstName = getRandomElement(genderData.first);
        const lastName = getRandomElement(genderData.last);
        return `${firstName} ${lastName}`;
      }
    }
    return "Unknown Name";
  };

  const generatePlaceName = () => {
    const places = NAME_DATA.places[category as keyof typeof NAME_DATA.places];
    return getRandomElement(places);
  };

  const generateFantasyName = () => {
    const syllableCount = Math.random() < 0.3 ? 2 : 3; // 30% chance for 2 syllables, 70% for 3
    let name = "";
    
    // Start syllable
    name += getRandomElement(FANTASY_SYLLABLES.start);
    
    // Middle syllables
    for (let i = 1; i < syllableCount - 1; i++) {
      name += getRandomElement(FANTASY_SYLLABLES.middle);
    }
    
    // End syllable (if more than 1 syllable)
    if (syllableCount > 1) {
      name += getRandomElement(FANTASY_SYLLABLES.end);
    }
    
    return name;
  };

  const generateNames = (count: number = 10) => {
    const names: string[] = [];
    
    for (let i = 0; i < count; i++) {
      let name: string;
      
      if (nameType === 'character') {
        name = generateCharacterName();
      } else if (nameType === 'place') {
        name = generatePlaceName();
      } else {
        name = generateFantasyName();
      }
      
      // Avoid duplicates
      if (!names.includes(name)) {
        names.push(name);
      } else {
        i--; // Try again
      }
    }
    
    setGeneratedNames(names);
  };

  const saveName = (name: string) => {
    if (!savedNames.includes(name)) {
      const updated = [...savedNames, name];
      setSavedNames(updated);
      localStorage.setItem('world-engine-saved-names', JSON.stringify(updated));
    }
  };

  const removeSavedName = (name: string) => {
    const updated = savedNames.filter(n => n !== name);
    setSavedNames(updated);
    localStorage.setItem('world-engine-saved-names', JSON.stringify(updated));
  };

  const exportSavedNames = () => {
    const dataStr = JSON.stringify(savedNames, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `world-engine-names-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Load saved names on component mount
  React.useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('world-engine-saved-names') || '[]');
      setSavedNames(saved);
    } catch (error) {
      console.error('Error loading saved names:', error);
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
          <h1 style={{ margin: 0, fontSize: "2.5rem", fontWeight: "bold" }}>Name Generator</h1>
          <p style={{ margin: "0.5rem 0 0", opacity: 0.8 }}>
            Generate fantasy names for characters and places
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
            <h3 style={{ marginBottom: "1rem", color: "#f1f5f9" }}>Name Type</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {["character", "place", "fantasy"].map(type => (
                <label key={type} style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
                  <input
                    type="radio"
                    name="nameType"
                    value={type}
                    checked={nameType === type}
                    onChange={(e) => setNameType(e.target.value)}
                    style={{ accentColor: "#3b82f6" }}
                  />
                  <span style={{ textTransform: "capitalize" }}>{type} Names</span>
                </label>
              ))}
            </div>
          </div>

          {nameType === 'character' && (
            <>
              <div style={{ marginBottom: "2rem" }}>
                <h3 style={{ marginBottom: "1rem", color: "#f1f5f9" }}>Race</h3>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
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
                  <option value="human">Human</option>
                  <option value="elf">Elf</option>
                  <option value="dwarf">Dwarf</option>
                  <option value="orc">Orc</option>
                </select>
              </div>

              <div style={{ marginBottom: "2rem" }}>
                <h3 style={{ marginBottom: "1rem", color: "#f1f5f9" }}>Gender</h3>
                <div style={{ display: "flex", gap: "1rem" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
                    <input
                      type="radio"
                      name="gender"
                      value="male"
                      checked={gender === 'male'}
                      onChange={(e) => setGender(e.target.value)}
                      style={{ accentColor: "#3b82f6" }}
                    />
                    Male
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
                    <input
                      type="radio"
                      name="gender"
                      value="female"
                      checked={gender === 'female'}
                      onChange={(e) => setGender(e.target.value)}
                      style={{ accentColor: "#3b82f6" }}
                    />
                    Female
                  </label>
                </div>
              </div>
            </>
          )}

          {nameType === 'place' && (
            <div style={{ marginBottom: "2rem" }}>
              <h3 style={{ marginBottom: "1rem", color: "#f1f5f9" }}>Place Type</h3>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
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
                <option value="cities">Cities</option>
                <option value="towns">Towns</option>
                <option value="taverns">Taverns</option>
              </select>
            </div>
          )}

          <button
            onClick={() => generateNames(10)}
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
            Generate Names
          </button>

          <button
            onClick={() => generateNames(25)}
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
            Generate More (25)
          </button>
        </div>

        {/* Center Panel - Generated Names */}
        <div style={{
          flex: 2,
          padding: "2rem",
          borderRight: "1px solid #334155"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
            <h3 style={{ margin: 0, color: "#f1f5f9" }}>Generated Names</h3>
            {generatedNames.length > 0 && (
              <span style={{ color: "#94a3b8", fontSize: "0.9rem" }}>
                {generatedNames.length} names
              </span>
            )}
          </div>

          {generatedNames.length === 0 ? (
            <div style={{
              textAlign: "center",
              padding: "3rem",
              color: "#64748b",
              fontStyle: "italic"
            }}>
              Click "Generate Names" to get started!
            </div>
          ) : (
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
              gap: "1rem",
              maxHeight: "calc(100vh - 250px)",
              overflowY: "auto"
            }}>
              {generatedNames.map((name, index) => (
                <div key={index} style={{
                  padding: "1rem",
                  background: "rgba(15, 23, 42, 0.5)",
                  border: "1px solid #334155",
                  borderRadius: "8px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}>
                  <span style={{ fontWeight: "500" }}>{name}</span>
                  <button
                    onClick={() => saveName(name)}
                    disabled={savedNames.includes(name)}
                    style={{
                      padding: "0.25rem 0.5rem",
                      background: savedNames.includes(name) ? "#374151" : "#059669",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      fontSize: "0.8rem",
                      cursor: savedNames.includes(name) ? "not-allowed" : "pointer"
                    }}
                  >
                    {savedNames.includes(name) ? "Saved" : "Save"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Panel - Saved Names */}
        <div style={{
          flex: 1,
          padding: "2rem"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
            <h3 style={{ margin: 0, color: "#f1f5f9" }}>Saved Names</h3>
            {savedNames.length > 0 && (
              <button
                onClick={exportSavedNames}
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

          {savedNames.length === 0 ? (
            <div style={{
              textAlign: "center",
              padding: "2rem",
              color: "#64748b",
              fontStyle: "italic"
            }}>
              Save names you like here!
            </div>
          ) : (
            <div style={{
              maxHeight: "calc(100vh - 250px)",
              overflowY: "auto"
            }}>
              {savedNames.map((name, index) => (
                <div key={index} style={{
                  padding: "0.75rem",
                  background: "rgba(15, 23, 42, 0.3)",
                  border: "1px solid #334155",
                  borderRadius: "6px",
                  marginBottom: "0.5rem",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}>
                  <span>{name}</span>
                  <button
                    onClick={() => removeSavedName(name)}
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
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
