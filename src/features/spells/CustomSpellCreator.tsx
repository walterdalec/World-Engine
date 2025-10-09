import React, { useState } from 'react';

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

interface CustomSpellCreatorProps {
  onBack?: () => void;
  onSpellCreated?: (_spell: GeneratedSpell) => void;
}

const SCHOOLS = [
  { name: "Abjuration", description: "Protective magic", color: "#3b82f6" },
  { name: "Conjuration", description: "Summoning and creation", color: "#10b981" },
  { name: "Divination", description: "Information gathering", color: "#f59e0b" },
  { name: "Enchantment", description: "Mind control and charm", color: "#ec4899" },
  { name: "Evocation", description: "Destructive energy", color: "#ef4444" },
  { name: "Healing", description: "Restoration and recovery", color: "#22c55e" },
  { name: "Illusion", description: "Deception and trickery", color: "#8b5cf6" },
  { name: "Necromancy", description: "Death and undeath", color: "#6b7280" },
  { name: "Transmutation", description: "Transformation", color: "#06b6d4" }
];

const CASTING_TIMES = [
  "1 action", "1 bonus action", "1 reaction", "2 actions", "3 actions", 
  "1 full round", "2 rounds", "3 rounds", "1 minute", "10 minutes", "1 hour"
];

const RANGES = [
  "Self", "Touch", "10 feet", "30 feet", "60 feet", "120 feet", 
  "300 feet", "500 feet", "1 mile", "Sight", "Special"
];

const DURATIONS = [
  "Instantaneous", "1 round", "2 rounds", "3 rounds", "5 rounds", 
  "10 rounds", "1 minute (10 rounds)", "10 minutes", "1 hour", "8 hours", 
  "24 hours", "Until dispelled", "Permanent", "Concentration, up to 1 round",
  "Concentration, up to 3 rounds", "Concentration, up to 10 rounds", 
  "Concentration, up to 10 minutes", "Concentration, up to 1 hour"
];

// Component options for different spell levels
const COMPONENT_OPTIONS = {
  verbal: [
    "Simple word", "Quick chant", "Whispered phrase", "Ancient incantation", 
    "Mystical chant", "Power word", "Arcane phrase", "Sacred prayer", 
    "Elemental call", "Divine invocation"
  ],
  somatic: [
    "Quick gesture", "Simple motion", "Finger snap", "Hand wave", 
    "Precise gestures", "Complex hand movements", "Ritualistic dance", 
    "Finger patterns", "Sweeping motions", "Sacred signs"
  ],
  material: [
    "Small focus", "Tiny crystal", "Bit of string", "Drop of water", 
    "Crystal focus", "Rare herbs", "Precious metals", "Ancient runes", 
    "Elemental essence", "Sacred symbols", "Diamond dust", "Silver wire"
  ]
};

// Guidelines for balanced spells by level
const SPELL_GUIDELINES = {
  0: {
    damage: "1d4 to 1d6",
    healing: "1d4",
    effects: "Minor utility, small bonuses (+1), brief duration",
    limitations: "Single target, short range, minimal impact"
  },
  1: {
    damage: "1d8 to 3d6",
    healing: "1d8 + modifier",
    effects: "Basic combat/utility, small area effects, moderate bonuses (+2)",
    limitations: "Limited targets, moderate range and duration"
  },
  2: {
    damage: "2d8 to 5d6", 
    healing: "2d8 + modifier",
    effects: "Enhanced effects, larger areas, significant bonuses (+3-4)",
    limitations: "Multiple targets, good range and duration"
  },
  3: {
    damage: "3d8 to 8d6",
    healing: "3d8 + modifier", 
    effects: "Powerful effects, condition removal, major bonuses (+4-5)",
    limitations: "Large areas, long duration, powerful utility"
  }
};

export default function CustomSpellCreator({ onBack, onSpellCreated }: CustomSpellCreatorProps) {
  const [spellData, setSpellData] = useState({
    name: '',
    level: 0,
    school: 'Evocation',
    castingTime: '1 action',
    range: '60 feet',
    duration: 'Instantaneous',
    description: '',
    components: {
      verbal: false,
      somatic: false,
      material: false,
      verbalDetail: 'Ancient incantation',
      somaticDetail: 'Precise gestures',
      materialDetail: 'Crystal focus'
    }
  });

  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [previewSpell, setPreviewSpell] = useState<GeneratedSpell | null>(null);

  const validateSpell = (): string[] => {
    const errors: string[] = [];
    
    if (!spellData.name.trim()) {
      errors.push("Spell name is required");
    }
    
    if (spellData.name.length > 50) {
      errors.push("Spell name too long (max 50 characters)");
    }
    
    if (!spellData.description.trim()) {
      errors.push("Spell description is required");
    }
    
    if (spellData.description.length < 20) {
      errors.push("Spell description too short (minimum 20 characters)");
    }
    
    if (spellData.description.length > 500) {
      errors.push("Spell description too long (max 500 characters)");
    }
    
    if (!spellData.components.verbal && !spellData.components.somatic && !spellData.components.material) {
      errors.push("Spell must have at least one component (Verbal, Somatic, or Material)");
    }
    
    // Level-based validation
    if (spellData.level === 0) {
      if (spellData.duration.includes("hour") || spellData.duration.includes("day")) {
        errors.push("Cantrips cannot have durations longer than 10 minutes");
      }
      if (spellData.range === "1 mile" || spellData.range === "Sight") {
        errors.push("Cantrips should have limited range (max 120 feet)");
      }
    }
    
    return errors;
  };

  const generateSpell = (): GeneratedSpell | null => {
    const errors = validateSpell();
    if (errors.length > 0) {
      setValidationErrors(errors);
      return null;
    }
    
    setValidationErrors([]);
    
    const components: string[] = [];
    if (spellData.components.verbal) {
      components.push(`V (${spellData.components.verbalDetail})`);
    }
    if (spellData.components.somatic) {
      components.push(`S (${spellData.components.somaticDetail})`);
    }
    if (spellData.components.material) {
      components.push(`M (${spellData.components.materialDetail})`);
    }
    
    const school = SCHOOLS.find(s => s.name === spellData.school) || SCHOOLS[0];
    
    return {
      name: spellData.name,
      level: spellData.level,
      school: spellData.school,
      castingTime: spellData.castingTime,
      range: spellData.range,
      components,
      duration: spellData.duration,
      description: spellData.description,
      color: school.color
    };
  };

  const handlePreview = () => {
    const _spell = generateSpell();
    setPreviewSpell(_spell);
  };

  const handleSave = () => {
    const spell = generateSpell();
    if (spell && onSpellCreated) {
      onSpellCreated(spell);
    }
  };

  const getSelectedSchool = () => SCHOOLS.find(s => s.name === spellData.school) || SCHOOLS[0];
  const getGuidelines = () => SPELL_GUIDELINES[spellData.level as keyof typeof SPELL_GUIDELINES] || SPELL_GUIDELINES[0];

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
          <h1 style={{ margin: 0, fontSize: "2.5rem", fontWeight: "bold" }}>⚡ Custom Spell Creator</h1>
          <p style={{ margin: "0.5rem 0 0", opacity: 0.8 }}>
            Create your own balanced spells with limitations and guidelines
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
            Back
          </button>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
        {/* Spell Creation Form */}
        <div style={{
          background: "rgba(15, 23, 42, 0.6)",
          borderRadius: "8px",
          padding: "1.5rem",
          border: "1px solid #334155"
        }}>
          <h2 style={{ margin: "0 0 1.5rem", color: "#f1f5f9" }}>📝 Spell Details</h2>

          {/* Basic Info */}
          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ display: "block", marginBottom: "0.5rem", color: "#cbd5e1" }}>
              Spell Name
            </label>
            <input
              type="text"
              value={spellData.name}
              onChange={(e) => setSpellData({ ...spellData, name: e.target.value })}
              placeholder="Enter spell name..."
              style={{
                width: "100%",
                padding: "0.75rem",
                background: "#374151",
                border: "1px solid #4b5563",
                borderRadius: "6px",
                color: "#f9fafb",
                fontSize: "1rem"
              }}
            />
          </div>

          {/* Level and School */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", color: "#cbd5e1" }}>
                Spell Level
              </label>
              <select
                value={spellData.level}
                onChange={(e) => setSpellData({ ...spellData, level: parseInt(e.target.value) })}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  background: "#374151",
                  border: "1px solid #4b5563",
                  borderRadius: "6px",
                  color: "#f9fafb",
                  fontSize: "1rem"
                }}
              >
                <option value={0}>Cantrip</option>
                <option value={1}>1st Level</option>
                <option value={2}>2nd Level</option>
                <option value={3}>3rd Level</option>
              </select>
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", color: "#cbd5e1" }}>
                School of Magic
              </label>
              <select
                value={spellData.school}
                onChange={(e) => setSpellData({ ...spellData, school: e.target.value })}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  background: "#374151",
                  border: "1px solid #4b5563",
                  borderRadius: "6px",
                  color: "#f9fafb",
                  fontSize: "1rem"
                }}
              >
                {SCHOOLS.map(school => (
                  <option key={school.name} value={school.name}>
                    {school.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Casting Details */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", color: "#cbd5e1" }}>
                Casting Time
              </label>
              <select
                value={spellData.castingTime}
                onChange={(e) => setSpellData({ ...spellData, castingTime: e.target.value })}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  background: "#374151",
                  border: "1px solid #4b5563",
                  borderRadius: "6px",
                  color: "#f9fafb",
                  fontSize: "0.9rem"
                }}
              >
                {CASTING_TIMES.map(time => (
                  <option key={time} value={time}>{time}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", color: "#cbd5e1" }}>
                Range
              </label>
              <select
                value={spellData.range}
                onChange={(e) => setSpellData({ ...spellData, range: e.target.value })}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  background: "#374151",
                  border: "1px solid #4b5563",
                  borderRadius: "6px",
                  color: "#f9fafb",
                  fontSize: "0.9rem"
                }}
              >
                {RANGES.map(range => (
                  <option key={range} value={range}>{range}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", color: "#cbd5e1" }}>
                Duration
              </label>
              <select
                value={spellData.duration}
                onChange={(e) => setSpellData({ ...spellData, duration: e.target.value })}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  background: "#374151",
                  border: "1px solid #4b5563",
                  borderRadius: "6px",
                  color: "#f9fafb",
                  fontSize: "0.9rem"
                }}
              >
                {DURATIONS.map(duration => (
                  <option key={duration} value={duration}>{duration}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Components */}
          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ display: "block", marginBottom: "0.75rem", color: "#cbd5e1" }}>
              Components
            </label>
            
            {/* Verbal Component */}
            <div style={{ marginBottom: "0.75rem" }}>
              <label style={{ display: "flex", alignItems: "center", marginBottom: "0.5rem" }}>
                <input
                  type="checkbox"
                  checked={spellData.components.verbal}
                  onChange={(e) => setSpellData({
                    ...spellData,
                    components: { ...spellData.components, verbal: e.target.checked }
                  })}
                  style={{ marginRight: "0.5rem" }}
                />
                <span style={{ color: "#f9fafb" }}>Verbal (V)</span>
              </label>
              {spellData.components.verbal && (
                <select
                  value={spellData.components.verbalDetail}
                  onChange={(e) => setSpellData({
                    ...spellData,
                    components: { ...spellData.components, verbalDetail: e.target.value }
                  })}
                  style={{
                    width: "100%",
                    padding: "0.5rem",
                    background: "#4b5563",
                    border: "1px solid #6b7280",
                    borderRadius: "4px",
                    color: "#f9fafb",
                    fontSize: "0.9rem"
                  }}
                >
                  {COMPONENT_OPTIONS.verbal.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Somatic Component */}
            <div style={{ marginBottom: "0.75rem" }}>
              <label style={{ display: "flex", alignItems: "center", marginBottom: "0.5rem" }}>
                <input
                  type="checkbox"
                  checked={spellData.components.somatic}
                  onChange={(e) => setSpellData({
                    ...spellData,
                    components: { ...spellData.components, somatic: e.target.checked }
                  })}
                  style={{ marginRight: "0.5rem" }}
                />
                <span style={{ color: "#f9fafb" }}>Somatic (S)</span>
              </label>
              {spellData.components.somatic && (
                <select
                  value={spellData.components.somaticDetail}
                  onChange={(e) => setSpellData({
                    ...spellData,
                    components: { ...spellData.components, somaticDetail: e.target.value }
                  })}
                  style={{
                    width: "100%",
                    padding: "0.5rem",
                    background: "#4b5563",
                    border: "1px solid #6b7280",
                    borderRadius: "4px",
                    color: "#f9fafb",
                    fontSize: "0.9rem"
                  }}
                >
                  {COMPONENT_OPTIONS.somatic.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Material Component */}
            <div>
              <label style={{ display: "flex", alignItems: "center", marginBottom: "0.5rem" }}>
                <input
                  type="checkbox"
                  checked={spellData.components.material}
                  onChange={(e) => setSpellData({
                    ...spellData,
                    components: { ...spellData.components, material: e.target.checked }
                  })}
                  style={{ marginRight: "0.5rem" }}
                />
                <span style={{ color: "#f9fafb" }}>Material (M)</span>
              </label>
              {spellData.components.material && (
                <input
                  type="text"
                  value={spellData.components.materialDetail}
                  onChange={(e) => setSpellData({
                    ...spellData,
                    components: { ...spellData.components, materialDetail: e.target.value }
                  })}
                  placeholder="Describe material component..."
                  style={{
                    width: "100%",
                    padding: "0.5rem",
                    background: "#4b5563",
                    border: "1px solid #6b7280",
                    borderRadius: "4px",
                    color: "#f9fafb",
                    fontSize: "0.9rem"
                  }}
                />
              )}
            </div>
          </div>

          {/* Description */}
          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ display: "block", marginBottom: "0.5rem", color: "#cbd5e1" }}>
              Spell Description
            </label>
            <textarea
              value={spellData.description}
              onChange={(e) => setSpellData({ ...spellData, description: e.target.value })}
              placeholder="Describe what the spell does, its effects, damage, bonuses, etc..."
              rows={4}
              style={{
                width: "100%",
                padding: "0.75rem",
                background: "#374151",
                border: "1px solid #4b5563",
                borderRadius: "6px",
                color: "#f9fafb",
                fontSize: "1rem",
                resize: "vertical"
              }}
            />
            <div style={{ fontSize: "0.8rem", color: "#94a3b8", marginTop: "0.25rem" }}>
              {spellData.description.length}/500 characters
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: "flex", gap: "1rem" }}>
            <button
              onClick={handlePreview}
              style={{
                flex: 1,
                padding: "0.75rem",
                background: getSelectedSchool().color,
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "1rem",
                fontWeight: "bold"
              }}
            >
              👁️ Preview Spell
            </button>
            <button
              onClick={handleSave}
              disabled={!previewSpell}
              style={{
                flex: 1,
                padding: "0.75rem",
                background: previewSpell ? "#059669" : "#374151",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: previewSpell ? "pointer" : "not-allowed",
                fontSize: "1rem",
                fontWeight: "bold"
              }}
            >
              💾 Save Spell
            </button>
          </div>

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <div style={{
              marginTop: "1rem",
              padding: "1rem",
              background: "rgba(220, 38, 38, 0.2)",
              border: "1px solid #dc2626",
              borderRadius: "6px"
            }}>
              <h4 style={{ margin: "0 0 0.5rem", color: "#fca5a5" }}>Validation Errors:</h4>
              <ul style={{ margin: 0, paddingLeft: "1.5rem", color: "#fca5a5" }}>
                {validationErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Guidelines and Preview */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* Guidelines */}
          <div style={{
            background: "rgba(15, 23, 42, 0.6)",
            borderRadius: "8px",
            padding: "1.5rem",
            border: `2px solid ${getSelectedSchool().color}`
          }}>
            <h2 style={{ margin: "0 0 1rem", color: getSelectedSchool().color }}>
              📋 {getSelectedSchool().name} Guidelines
            </h2>
            <p style={{ margin: "0 0 1rem", color: "#cbd5e1", fontStyle: "italic" }}>
              {getSelectedSchool().description}
            </p>
            
            <div style={{ marginBottom: "1rem" }}>
              <h4 style={{ margin: "0 0 0.5rem", color: "#f1f5f9" }}>
                Level {spellData.level} {spellData.level === 0 ? "Cantrip" : ""} Limits:
              </h4>
              <div style={{ fontSize: "0.9rem", color: "#94a3b8" }}>
                <p style={{ margin: "0.25rem 0" }}>
                  <strong>Damage:</strong> {getGuidelines().damage}
                </p>
                <p style={{ margin: "0.25rem 0" }}>
                  <strong>Healing:</strong> {getGuidelines().healing}
                </p>
                <p style={{ margin: "0.25rem 0" }}>
                  <strong>Effects:</strong> {getGuidelines().effects}
                </p>
                <p style={{ margin: "0.25rem 0" }}>
                  <strong>Limitations:</strong> {getGuidelines().limitations}
                </p>
              </div>
            </div>

            <div style={{
              padding: "1rem",
              background: "rgba(59, 130, 246, 0.1)",
              borderRadius: "6px",
              border: "1px solid #3b82f6"
            }}>
              <h4 style={{ margin: "0 0 0.5rem", color: "#93c5fd" }}>💡 Design Tips:</h4>
              <ul style={{ margin: 0, paddingLeft: "1.5rem", color: "#cbd5e1", fontSize: "0.9rem" }}>
                <li>Be specific about targets, ranges, and effects</li>
                <li>Higher level spells should have more complex components</li>
                <li>Balance damage with utility - not every spell needs to do damage</li>
                <li>Consider what class would use this spell</li>
                <li>Make effects interesting but not overpowered</li>
              </ul>
            </div>
          </div>

          {/* Spell Preview */}
          {previewSpell && (
            <div style={{
              background: "rgba(15, 23, 42, 0.6)",
              borderRadius: "8px",
              padding: "1.5rem",
              border: `2px solid ${previewSpell.color}`
            }}>
              <h2 style={{ margin: "0 0 1rem", color: "#f1f5f9" }}>👁️ Spell Preview</h2>
              
              <div style={{
                background: "rgba(15, 23, 42, 0.8)",
                borderRadius: "6px",
                padding: "1.5rem",
                border: `1px solid ${previewSpell.color}`
              }}>
                <div style={{ marginBottom: "1rem" }}>
                  <h3 style={{ margin: "0 0 0.25rem", color: previewSpell.color, fontSize: "1.5rem" }}>
                    {previewSpell.name}
                  </h3>
                  <p style={{ margin: 0, color: "#94a3b8", fontSize: "0.9rem" }}>
                    {previewSpell.level === 0 ? "Cantrip" : `${previewSpell.level}st Level`} {previewSpell.school}
                  </p>
                </div>

                <div style={{ marginBottom: "1rem", fontSize: "0.9rem", color: "#cbd5e1" }}>
                  <p style={{ margin: "0.25rem 0" }}>
                    <strong>Casting Time:</strong> {previewSpell.castingTime}
                  </p>
                  <p style={{ margin: "0.25rem 0" }}>
                    <strong>Range:</strong> {previewSpell.range}
                  </p>
                  <p style={{ margin: "0.25rem 0" }}>
                    <strong>Components:</strong> {previewSpell.components.join(", ")}
                  </p>
                  <p style={{ margin: "0.25rem 0" }}>
                    <strong>Duration:</strong> {previewSpell.duration}
                  </p>
                </div>

                <div>
                  <p style={{ margin: 0, color: "#e2e8f0", lineHeight: "1.5" }}>
                    {previewSpell.description}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
