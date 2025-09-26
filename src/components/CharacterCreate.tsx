// src/components/CharacterCreate.tsx
import React, { useMemo, useState } from "react";

type Stats = "STR" | "DEX" | "CON" | "INT" | "WIS" | "CHA";

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

const MAX_TRAITS = 3;

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

function abilityMod(score: number) {
  return Math.floor((score - 10) / 2);
}

// Simple 27-point buy: 8→15; cost = 1 per point increase.
const POINTS_POOL = 27;
const MIN_STAT = 8;
const MAX_STAT = 15;

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
      spent += Math.max(0, char.stats[k] - MIN_STAT); // linear cost
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
      if (pointsLeft <= 0) return c;
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
    const hp = 10 + abilityMod(char.stats.CON) * lvl;
    const carry = 15 * char.stats.STR;
    return { level: lvl, hp, carry };
  }, [char.stats]);

  return (
    <div style={container}>
      {/* LEFT: form */}
      <div style={{ display: "grid", gap: 16 }}>
        <div style={card}>
          <h2 style={sectionTitle}>Identity</h2>
          <div style={{ display: "grid", gap: 8 }}>
            <TextRow label="Name" value={char.name} onChange={(v) => setField("name", v)} />
            <TextRow label="Pronouns" value={char.pronouns} onChange={(v) => setField("pronouns", v)} placeholder="she/her, he/him, they/them…" />
            <TextRow label="Species" value={char.species} onChange={(v) => setField("species", v)} placeholder="Human, Sylvanborn, Alloy, etc." />
            <TextRow label="Archetype" value={char.archetype} onChange={(v) => setField("archetype", v)} placeholder="Ranger, Artificer, Mystic…" />
            <TextAreaRow label="Background" value={char.background} onChange={(v) => setField("background", v)} placeholder="One-paragraph origin." />
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
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
            {(Object.keys(char.stats) as Stats[]).map((k) => (
              <div key={k} style={{ border: "1px solid #334155", borderRadius: 10, padding: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <strong>{k}</strong>
                  {char.mode === "POINT_BUY" && (
                    <span>
                      <button onClick={() => dec(k)} disabled={char.stats[k] <= MIN_STAT}>−</button>
                      <button onClick={() => inc(k)} disabled={char.stats[k] >= MAX_STAT || pointsLeft <= 0} style={{ marginLeft: 6 }}>＋</button>
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 28, textAlign: "center", marginTop: 6 }}>{char.stats[k]}</div>
                <div style={{ fontSize: 12, textAlign: "center", opacity: 0.8 }}>mod {abilityMod(char.stats[k]) >= 0 ? "+" : ""}{abilityMod(char.stats[k])}</div>
              </div>
            ))}
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
          {(Object.keys(char.stats) as Stats[]).map((k) => (
            <div key={k} style={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8, padding: 8, textAlign: "center" }}>
              <div style={{ fontSize: 12, opacity: 0.8 }}>{k}</div>
              <div style={{ fontSize: 20 }}>{char.stats[k]}</div>
              <div style={{ fontSize: 12, opacity: 0.8 }}>({abilityMod(char.stats[k]) >= 0 ? "+" : ""}{abilityMod(char.stats[k])})</div>
            </div>
          ))}
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