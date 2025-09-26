// src/components/CharacterCreate.tsx
import React, { useMemo, useState } from "react";

type Stats = "STR" | "DEX" | "CON" | "INT" | "WIS" | "CHA";

function calculateStatCost(value: number): number {
  // Base cost is 0 for stat value 8
  // Each point above 8 costs: 1 point for 9-14, 2 points for 15-16, 3 points for 17+
  let cost = 0;
  for (let statValue = 9; statValue <= value; statValue++) {
    if (statValue <= 14) cost += 1;      // Values 9-14: 1 point each
    else if (statValue <= 16) cost += 2; // Values 15-16: 2 points each  
    else cost += 3;                      // Values 17+: 3 points each
  }
  return cost;
}

type Character = {
  name: string;
  pronouns: string;
  species: string;
  archetype: string;
  background: string;
  stats: Record<Stats, number>;
  traits: string[];
  portraitUrl?: string;
  mode: "POINT_BUY" | "ROLL";
};

const DEFAULT_STATS: Record<Stats, number> = {
  STR: 8, DEX: 8, CON: 8, INT: 8, WIS: 8, CHA: 8,
};

const TRAIT_CATALOG = [
  "Brave", "Clever", "Cunning", "Empathic", "Stoic",
  "Lucky", "Observant", "Silver Tongue", "Iron Will", "Swift",
];

const SPECIES_OPTIONS = [
  "Human", "Sylvanborn", "Alloy", "Draketh", "Voidkin", "Crystalborn", "Stormcaller"
];

const ARCHETYPE_OPTIONS = [
  "Ranger", "Artificer", "Mystic", "Guardian", "Scholar", "Rogue", "Warrior", "Healer"
];

const CLASS_OPTIONS = [
  "Fighter", "Wizard", "Rogue", "Cleric", "Ranger", "Paladin", "Barbarian", "Sorcerer", "Warlock", "Bard"
];

// Racial stat modifiers - balanced with equal positives and negatives
const RACIAL_MODIFIERS: Record<string, Partial<Record<Stats, number>>> = {
  "Human": { STR: 1, CHA: 1, CON: -1, WIS: -1 }, // Strong and social, but less hardy and wise
  "Sylvanborn": { DEX: 2, WIS: 1, STR: -2, CON: -1 }, // Graceful and wise, but frail
  "Alloy": { CON: 2, INT: 1, DEX: -2, CHA: -1 }, // Durable and smart, but rigid and impersonal
  "Draketh": { STR: 2, CHA: 1, DEX: -1, WIS: -2 }, // Strong and charismatic, but clumsy and impulsive
  "Voidkin": { INT: 2, WIS: 1, STR: -1, CHA: -2 }, // Brilliant and perceptive, but weak and unsettling
  "Crystalborn": { CON: 1, INT: 2, DEX: -1, CHA: -2 }, // Resilient and bright, but inflexible and cold
  "Stormcaller": { DEX: 1, CHA: 2, CON: -1, STR: -2 }, // Quick and magnetic, but fragile and weak
};

// Class stat preferences (suggested bonuses, not mandatory)
const CLASS_MODIFIERS: Record<string, Partial<Record<Stats, number>>> = {
  "Fighter": { STR: 2, CON: 1 }, // Strength and endurance
  "Wizard": { INT: 2, WIS: 1 }, // Intelligence and wisdom
  "Rogue": { DEX: 2, INT: 1 }, // Dexterity and cunning
  "Cleric": { WIS: 2, CHA: 1 }, // Wisdom and divine presence
  "Ranger": { DEX: 2, WIS: 1 }, // Dexterity and nature wisdom
  "Paladin": { STR: 1, CHA: 2 }, // Divine strength and charisma
  "Barbarian": { STR: 2, CON: 1 }, // Raw strength and toughness
  "Sorcerer": { CHA: 2, CON: 1 }, // Natural magic and constitution
  "Warlock": { CHA: 2, INT: 1 }, // Charismatic power and knowledge
  "Bard": { CHA: 2, DEX: 1 }, // Charisma and agility
};

const BACKGROUND_TEMPLATES = [
  "A former {profession} who left their old life behind after {event}. Now they seek {goal} in the wider world.",
  "Born in {location}, they were raised by {guardian} and learned the ways of {skill}. Their greatest challenge was {challenge}.",
  "Once served as {role} until {tragedy} changed everything. Now they wander, carrying {burden} and seeking {redemption}.",
  "Discovered their {talent} at a young age in {homeland}. After {incident}, they must now {quest}.",
  "A {descriptor} soul from {origin} who {past_action}. Their destiny was forever changed when {turning_point}."
];

const BACKGROUND_WORDS = {
  profession: ["merchant", "soldier", "scholar", "artisan", "noble", "farmer", "sailor", "miner"],
  event: ["a great betrayal", "a mystical awakening", "a terrible loss", "a divine vision", "a forbidden discovery"],
  goal: ["redemption", "knowledge", "vengeance", "peace", "power", "understanding", "justice"],
  location: ["the mountains", "the deep forests", "a bustling city", "a remote village", "the desert wastes", "coastal towns"],
  guardian: ["wise elders", "a mysterious mentor", "ancient spirits", "temple priests", "nomadic tribes"],
  skill: ["combat", "magic", "diplomacy", "survival", "crafting", "healing"],
  challenge: ["surviving in the wilderness", "uncovering dark secrets", "protecting their community", "mastering their abilities"],
  role: ["a royal guard", "a temple acolyte", "a guild member", "a traveling performer", "a court advisor"],
  tragedy: ["war came to their lands", "a plague struck", "they were falsely accused", "dark forces emerged"],
  burden: ["ancient knowledge", "a family secret", "a cursed artifact", "the weight of prophecy"],
  redemption: ["to right past wrongs", "to prove their worth", "to save their people", "to break an ancient curse"],
  talent: ["gift for magic", "exceptional strength", "keen insight", "natural charisma", "connection to nature"],
  homeland: ["the crystal caves", "the floating islands", "the shadow realm", "the golden plains"],
  incident: ["the great storm", "a dragon's attack", "political upheaval", "a mystical convergence"],
  quest: ["find their true purpose", "restore balance", "uncover their heritage", "save their homeland"],
  descriptor: ["wandering", "noble", "mysterious", "brave", "cunning", "wise", "fierce"],
  origin: ["distant lands", "humble beginnings", "royal bloodline", "ancient lineage", "forgotten realms"],
  past_action: ["fought in great battles", "studied forbidden lore", "communed with spirits", "crafted legendary items"],
  turning_point: ["they discovered their true nature", "fate intervened", "they made a fateful choice", "destiny called"]
};

const PREMADE_CHARACTERS = [
  {
    name: "Kira Stormwind",
    pronouns: "she/her",
    species: "Stormcaller",
    archetype: "Mystic",
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
    archetype: "Artificer",
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
    archetype: "Rogue",
    background: "A wandering soul from the shadow realm who fought in great battles against the encroaching darkness. Their destiny was forever changed when they discovered their connection to the void grants them unique abilities.",
    stats: { STR: 9, DEX: 15, CON: 11, INT: 12, WIS: 14, CHA: 13 },
    traits: ["Cunning", "Lucky", "Observant"],
    portraitUrl: "https://images.unsplash.com/photo-1494790108755-2616c4b43e69?w=300&h=300&fit=crop&crop=face",
    mode: "POINT_BUY" as const
  }
];

const MAX_TRAITS = 3;

function canAffordStatIncrease(currentValue: number, pointsLeft: number): boolean {
  if (currentValue >= MAX_STAT) return false;
  const newValue = currentValue + 1;
  const currentCost = calculateStatCost(currentValue);
  const newCost = calculateStatCost(newValue);
  return pointsLeft >= (newCost - currentCost);
}

const container: React.CSSProperties = {
  display: "grid",
  gap: 16,
  gridTemplateColumns: "1fr 420px",
  padding: 24,
  alignItems: "start",
};

const card: React.CSSProperties = {
  border: "1px solid #cbd5e1",
  borderRadius: 12,
  padding: 16,
  background: "#0b0e12",
  color: "#e5e7eb",
};

const sectionTitle: React.CSSProperties = { margin: "8px 0 4px", opacity: 0.9 };

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function roll4d6DropLowest() {
  const rolls = [randInt(1, 6), randInt(1, 6), randInt(1, 6), randInt(1, 6)];
  rolls.sort((a, b) => b - a); // desc
  return rolls[0] + rolls[1] + rolls[2];
}

function download(filename: string, data: object) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function generateBackground(): string {
  const template = BACKGROUND_TEMPLATES[Math.floor(Math.random() * BACKGROUND_TEMPLATES.length)];
  
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    const options = BACKGROUND_WORDS[key as keyof typeof BACKGROUND_WORDS];
    if (options) {
      return options[Math.floor(Math.random() * options.length)];
    }
    return match;
  });
}

function abilityMod(score: number) {
  // Modified calculation: 8-9 = +0, 10-11 = +1, 12-13 = +2, etc.
  return Math.floor((score - 8) / 2);
}

// Calculate final stat with racial and class bonuses
function getFinalStat(baseStat: number, stat: Stats, species: string, archetype: string): number {
  let final = baseStat;
  
  // Add racial bonus (can be negative)
  const racialBonus = RACIAL_MODIFIERS[species]?.[stat] || 0;
  final += racialBonus;
  
  // Add class bonus (optional - these are suggestions, not automatic)
  // For now, let's make these optional bonuses that players can see but don't auto-apply
  
  return Math.max(3, Math.min(final, 22)); // Cap between 3-22 (racial penalties can bring stats low, but not too low)
}

// Get the display text for bonuses
function getBonusText(stat: Stats, species: string, archetype: string): string {
  const racialBonus = RACIAL_MODIFIERS[species]?.[stat] || 0;
  const classBonus = CLASS_MODIFIERS[archetype]?.[stat] || 0;
  
  let text = "";
  if (racialBonus > 0) text += ` +${racialBonus} racial`;
  if (racialBonus < 0) text += ` ${racialBonus} racial`;
  if (classBonus > 0) text += ` (+${classBonus} class)`;
  
  return text;
}

// Updated point buy calculation - costs 1 for 8-13, 2 for 14-15, 3 for 16-20
const POINTS_POOL = 27;
const MIN_STAT = 8;
const MAX_STAT = 20;

export default function CharacterCreate() {
  const [char, setChar] = useState<Character>({
    name: "",
    pronouns: "",
    species: "",
    archetype: "",
    background: "",
    stats: { ...DEFAULT_STATS },
    traits: [],
    portraitUrl: "",
    mode: "POINT_BUY",
  });

  const pointsSpent = useMemo(() => {
    let spent = 0;
    (Object.keys(char.stats) as Stats[]).forEach((k) => {
      spent += calculateStatCost(char.stats[k]);
    });
    return spent;
  }, [char.stats]);

  const pointsLeft = POINTS_POOL - pointsSpent;

  function setField<K extends keyof Character>(key: K, val: Character[K]) {
    setChar((c) => ({ ...c, [key]: val }));
  }

  function inc(stat: Stats) {
    setChar((c) => {
      const v = c.stats[stat];
      if (c.mode !== "POINT_BUY") return c;
      if (v >= MAX_STAT) return c;
      if (!canAffordStatIncrease(v, pointsLeft)) return c;
      return { ...c, stats: { ...c.stats, [stat]: v + 1 } };
    });
  }

  function dec(stat: Stats) {
    setChar((c) => {
      const v = c.stats[stat];
      if (c.mode !== "POINT_BUY") return c;
      if (v <= MIN_STAT) return c;
      return { ...c, stats: { ...c.stats, [stat]: v - 1 } };
    });
  }

  function rollAll() {
    const rolled: Record<Stats, number> = { ...DEFAULT_STATS };
    (Object.keys(rolled) as Stats[]).forEach((k) => {
      rolled[k] = roll4d6DropLowest();
    });
    setChar((c) => ({ ...c, stats: rolled }));
  }

  function toggleTrait(t: string) {
    setChar((c) => {
      const has = c.traits.includes(t);
      if (has) return { ...c, traits: c.traits.filter((x) => x !== t) };
      if (c.traits.length >= MAX_TRAITS) return c;
      return { ...c, traits: [...c.traits, t] };
    });
  }

  function saveCharacter() {
    if (!char.name.trim()) {
      alert("Give your character a name before saving.");
      return;
    }
    const payload = { ...char, createdAt: new Date().toISOString() };
    localStorage.setItem("we:lastCharacter", JSON.stringify(payload));
    download(`${char.name.replace(/\s+/g, "_")}.json`, payload);
  }

  function loadLast() {
    const raw = localStorage.getItem("we:lastCharacter");
    if (!raw) return alert("No saved character found.");
    try {
      setChar(JSON.parse(raw));
    } catch {
      alert("Save file corrupted.");
    }
  }

  function loadPremade(character: Character) {
    setChar({ ...character });
  }

  function resetAll() {
    setChar({
      name: "",
      pronouns: "",
      species: "",
      archetype: "",
      background: "",
      stats: { ...DEFAULT_STATS },
      traits: [],
      portraitUrl: "",
      mode: "POINT_BUY",
    });
  }

  const derived = useMemo(() => {
    const lvl = 1;
    const finalCON = getFinalStat(char.stats.CON, "CON", char.species, char.archetype);
    const finalSTR = getFinalStat(char.stats.STR, "STR", char.species, char.archetype);
    const hp = 10 + abilityMod(finalCON) * lvl;
    const carry = 15 * finalSTR;
    return { level: lvl, hp, carry };
  }, [char.stats, char.species, char.archetype]);

  return (
    <div style={container}>
      {/* LEFT: form */}
      <div style={{ display: "grid", gap: 16 }}>
        <div style={card}>
          <h2 style={sectionTitle}>Identity</h2>
          <div style={{ display: "grid", gap: 8 }}>
            <TextRow label="Name" value={char.name} onChange={(v) => setField("name", v)} />
            <TextRow label="Pronouns" value={char.pronouns} onChange={(v) => setField("pronouns", v)} placeholder="she/her, he/him, they/them…" />
            <SelectRow label="Species" value={char.species} onChange={(v) => setField("species", v)} options={SPECIES_OPTIONS} />
            {char.species && RACIAL_MODIFIERS[char.species] && (
              <div style={{ fontSize: 12, opacity: 0.7, marginTop: -4 }}>
                Racial modifiers: {Object.entries(RACIAL_MODIFIERS[char.species]).map(([stat, bonus]) => 
                  `${stat} ${bonus > 0 ? '+' : ''}${bonus}`
                ).join(", ")}
              </div>
            )}
            <SelectRow label="Archetype" value={char.archetype} onChange={(v) => setField("archetype", v)} options={ARCHETYPE_OPTIONS} />
            <div style={{ display: "grid", gap: 4 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>Background</span>
                <button 
                  onClick={() => setField("background", generateBackground())}
                  style={{ 
                    padding: "4px 8px", 
                    fontSize: "12px", 
                    background: "#374151", 
                    color: "#e5e7eb", 
                    border: "none", 
                    borderRadius: "4px", 
                    cursor: "pointer" 
                  }}
                >
                  Generate Random
                </button>
              </div>
              <textarea
                value={char.background}
                onChange={(e) => setField("background", e.target.value)}
                placeholder="One-paragraph origin story..."
                rows={4}
                style={{ padding: 8, borderRadius: 8, border: "1px solid #334155", background: "#0f172a", color: "#e5e7eb", resize: "vertical" }}
              />
            </div>
            <TextRow label="Portrait URL" value={char.portraitUrl || ""} onChange={(v) => setField("portraitUrl", v)} placeholder="http(s)://…" />
          </div>
        </div>

        <div style={card}>
          <h2 style={sectionTitle}>Abilities</h2>

          <div style={{ display: "flex", gap: 12, marginBottom: 8 }}>
            <label><input type="radio" checked={char.mode === "POINT_BUY"} onChange={() => setField("mode", "POINT_BUY")} /> Point Buy</label>
            <label><input type="radio" checked={char.mode === "ROLL"} onChange={() => setField("mode", "ROLL")} /> Roll (4d6 drop lowest)</label>
            {char.mode === "ROLL" && (
              <button onClick={rollAll} style={{ marginLeft: "auto" }}>Roll All</button>
            )}
          </div>

          {char.mode === "POINT_BUY" && (
            <div style={{ marginBottom: 8, opacity: 0.9 }}>
              Points left: <strong>{pointsLeft}</strong> (Pool: {POINTS_POOL}, range {MIN_STAT}–{MAX_STAT})
              <div style={{ fontSize: 12, marginTop: 4, opacity: 0.7 }}>
                Cost: 8-13 = 1 point each, 14-15 = 2 points each, 16-20 = 3 points each
              </div>
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
            {(Object.keys(char.stats) as Stats[]).map((k) => {
              const baseStat = char.stats[k];
              const finalStat = getFinalStat(baseStat, k, char.species, char.archetype);
              const bonusText = getBonusText(k, char.species, char.archetype);
              
              return (
                <div key={k} style={{ border: "1px solid #334155", borderRadius: 10, padding: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <strong>{k}</strong>
                    {char.mode === "POINT_BUY" && (
                      <span>
                        <button onClick={() => dec(k)} disabled={char.stats[k] <= MIN_STAT}>−</button>
                        <button onClick={() => inc(k)} disabled={char.stats[k] >= MAX_STAT || !canAffordStatIncrease(char.stats[k], pointsLeft)} style={{ marginLeft: 6 }}>＋</button>
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 28, textAlign: "center", marginTop: 6 }}>
                    {finalStat !== baseStat ? (
                      <>
                        <span style={{ opacity: 0.6 }}>{baseStat}</span>
                        <span style={{ 
                          color: finalStat > baseStat ? "#10b981" : "#ef4444", 
                          marginLeft: 4 
                        }}>
                          →{finalStat}
                        </span>
                      </>
                    ) : (
                      finalStat
                    )}
                  </div>
                  <div style={{ fontSize: 12, textAlign: "center", opacity: 0.8 }}>
                    mod {abilityMod(finalStat) >= 0 ? "+" : ""}{abilityMod(finalStat)}
                  </div>
                  {bonusText && (
                    <div style={{ fontSize: 10, textAlign: "center", opacity: 0.6, marginTop: 2 }}>
                      {bonusText}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div style={card}>
          <h2 style={sectionTitle}>Traits <small style={{ opacity: 0.7 }}>(choose up to {MAX_TRAITS})</small></h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 6 }}>
            {TRAIT_CATALOG.map((t) => (
              <label key={t} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input
                  type="checkbox"
                  checked={char.traits.includes(t)}
                  onChange={() => toggleTrait(t)}
                  disabled={!char.traits.includes(t) && char.traits.length >= MAX_TRAITS}
                />
                {t}
              </label>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={saveCharacter}>Save (JSON + local)</button>
          <button onClick={loadLast}>Load Last</button>
          <button onClick={resetAll}>Reset</button>
        </div>

        <div style={card}>
          <h2 style={sectionTitle}>Premade Characters</h2>
          <div style={{ display: "grid", gap: 8 }}>
            {PREMADE_CHARACTERS.map((premade) => (
              <div key={premade.name} style={{ 
                border: "1px solid #334155", 
                borderRadius: 8, 
                padding: 12,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}>
                <div>
                  <div><strong>{premade.name}</strong></div>
                  <div style={{ fontSize: "12px", opacity: 0.8 }}>
                    {premade.species} {premade.archetype} • {premade.traits.join(", ")}
                  </div>
                </div>
                <button 
                  onClick={() => loadPremade(premade)}
                  style={{ 
                    padding: "6px 12px", 
                    background: "#059669", 
                    color: "#f9fafb", 
                    border: "none", 
                    borderRadius: "4px", 
                    cursor: "pointer",
                    fontSize: "12px"
                  }}
                >
                  Load
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT: live preview */}
      <div style={card}>
        <h2 style={{ marginTop: 0 }}>Preview</h2>
        {char.portraitUrl ? (
          <img src={char.portraitUrl} alt="portrait" style={{ width: "100%", borderRadius: 12, marginBottom: 8, objectFit: "cover" }} />
        ) : (
          <div style={{ border: "1px dashed #334155", borderRadius: 12, padding: 12, textAlign: "center", marginBottom: 8, opacity: 0.7 }}>
            Add a portrait URL for preview
          </div>
        )}

        <div><strong>{char.name || "Unnamed Adventurer"}</strong></div>
        <div style={{ opacity: 0.8, marginBottom: 8 }}>
          {[char.pronouns, char.species, char.archetype].filter(Boolean).join(" • ")}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6, marginBottom: 8 }}>
          {(Object.keys(char.stats) as Stats[]).map((k) => {
            const finalStat = getFinalStat(char.stats[k], k, char.species, char.archetype);
            return (
              <div key={k} style={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8, padding: 8, textAlign: "center" }}>
                <div style={{ fontSize: 12, opacity: 0.8 }}>{k}</div>
                <div style={{ fontSize: 20 }}>{finalStat}</div>
                <div style={{ fontSize: 12, opacity: 0.8 }}>({abilityMod(finalStat) >= 0 ? "+" : ""}{abilityMod(finalStat)})</div>
              </div>
            );
          })}
        </div>

        <div style={{ marginBottom: 8 }}>
          <div>HP: <strong>{derived.hp}</strong> • Carry: <strong>{derived.carry}</strong></div>
          {char.traits.length > 0 && (
            <div style={{ marginTop: 6 }}>Traits: {char.traits.join(", ")}</div>
          )}
        </div>

        {char.background && (
          <>
            <h3 style={sectionTitle}>Background</h3>
            <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.35 }}>{char.background}</p>
          </>
        )}
      </div>
    </div>
  );
}

function TextRow(props: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  const { label, value, onChange, placeholder } = props;
  return (
    <label style={{ display: "grid", gap: 4 }}>
      <span>{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ padding: 8, borderRadius: 8, border: "1px solid #334155", background: "#0f172a", color: "#e5e7eb" }}
      />
    </label>
  );
}

function TextAreaRow(props: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  const { label, value, onChange, placeholder } = props;
  return (
    <label style={{ display: "grid", gap: 4 }}>
      <span>{label}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={4}
        style={{ padding: 8, borderRadius: 8, border: "1px solid #334155", background: "#0f172a", color: "#e5e7eb", resize: "vertical" }}
      />
    </label>
  );
}

function SelectRow(props: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  const { label, value, onChange, options } = props;
  return (
    <label style={{ display: "grid", gap: 4 }}>
      <span>{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ 
          padding: 8, 
          borderRadius: 8, 
          border: "1px solid #334155", 
          background: "#0f172a", 
          color: "#e5e7eb",
          cursor: "pointer"
        }}
      >
        <option value="">Select {label}...</option>
        {options.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}