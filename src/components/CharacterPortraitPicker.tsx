import React, { useState, useMemo } from 'react';
import { PortraitOptions, Palette } from './CharacterPortraitStudio';

// Simplified version of the portrait components for inline use
class SeededRandom {
  private seed: number;
  constructor(seed: string) { this.seed = SeededRandom.hash(seed); }
  static hash(str: string) {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  next() { let x = this.seed + 0x9e3779b9; x^=x<<13; x^=x>>>17; x^=x<<5; this.seed = x>>>0; return (this.seed>>>0)/0x100000000; }
  int(min: number, max: number) { return Math.floor(this.next() * (max - min + 1)) + min; }
  pick<T>(arr: readonly T[]) { return arr[this.int(0, arr.length - 1)]; }
}

// Default palettes
const Palettes: Record<string, Palette> = {
  Rootspeakers: { primary: "#84cc16", secondary: "#16a34a", metal: "#8b8b8b", leather: "#6b4f29", cloth: "#e2e8f0", accent: "#22c55e" },
  Thornweave:   { primary: "#14532d", secondary: "#4d7c0f", metal: "#9ca3af", leather: "#5b4322", cloth: "#0f172a", accent: "#84cc16" },
  Valebright:   { primary: "#f59e0b", secondary: "#fef3c7", metal: "#cbd5e1", leather: "#7c3e00", cloth: "#fafaf9", accent: "#eab308" },
  Skyvault:     { primary: "#38bdf8", secondary: "#0ea5e9", metal: "#94a3b8", leather: "#334155", cloth: "#e2f2ff", accent: "#7dd3fc" },
  Ashenreach:   { primary: "#9ca3af", secondary: "#374151", metal: "#d1d5db", leather: "#4b5563", cloth: "#111827", accent: "#f87171" },
};

type Race = "Human" | "Draken" | "Elf" | "Dwarf" | "Halfling" | "Automaton" | "Fae";
type Archetype = "Mage" | "Warrior" | "Ranger" | "Rogue" | "Cleric" | "Paladin" | "Bard" | "Necromancer" | "Elementalist" | "Alchemist" | "Greenwarden" | "Thorn Knight" | "Sapling Adept" | "Bloomcaller" | "Stormsinger" | "Shadowblade" | "Skyspear";
type BodyType = "slim" | "standard" | "heavy";

// Portrait generation function (simplified version of the main studio)
function generatePortraitData(opts: PortraitOptions, palette: Palette): string {
  // This returns a data URL that can be stored as portraitUrl
  // For now, we'll generate a unique identifier that represents the portrait
  return `portrait:${opts.seed}:${opts.race}:${opts.archetype}:${opts.body}:${opts.faction}:${opts.variant || 0}`;
}

interface Props {
  characterName: string;
  characterRace: string;
  characterClass: string;
  onPortraitChange: (portraitData: string) => void;
}

export default function CharacterPortraitPicker({ characterName, characterRace, characterClass, onPortraitChange }: Props) {
  const [showPicker, setShowPicker] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState(0);
  const [selectedPalette, setSelectedPalette] = useState('Rootspeakers');
  const [selectedBody, setSelectedBody] = useState<BodyType>('standard');

  // Map character data to portrait options
  const normalizedRace: Race = useMemo(() => {
    if (!characterRace) return 'Human';
    const race = characterRace.toLowerCase();
    // Map your actual game races to portrait system races
    if (race === 'human') return 'Human';
    if (race === 'draketh') return 'Draken';  // Dragon-like race -> Draken
    if (race === 'sylvanborn') return 'Elf';  // Forest-dwellers -> Elf features
    if (race === 'alloy') return 'Automaton'; // Mechanical beings -> Automaton
    if (race === 'voidkin') return 'Fae';     // Shadow-touched -> Fae (otherworldly)
    if (race === 'crystalborn') return 'Dwarf'; // Crystal beings -> Dwarf (sturdy)
    if (race === 'stormcaller') return 'Halfling'; // Sky-born -> Halfling (agile)
    return 'Human'; // Default fallback
  }, [characterRace]);

  const normalizedClass: Archetype = useMemo(() => {
    if (!characterClass) return 'Warrior';
    const c = characterClass.toLowerCase();
    // Map your actual game classes to portrait system archetypes
    if (c === 'greenwarden') return "Greenwarden";
    if (c === 'thorn knight') return "Thorn Knight";
    if (c === 'sapling adept') return "Sapling Adept";
    if (c === 'bloomcaller') return "Bloomcaller";
    if (c === 'ashblade') return "Warrior";        // Ash warrior -> Warrior
    if (c === 'cinder mystic') return "Mage";      // Fire mage -> Mage
    if (c === 'dust ranger') return "Ranger";      // Desert scout -> Ranger
    if (c === 'bonechanter') return "Necromancer"; // Bone magic -> Necromancer
    if (c === 'stormcaller') return "Stormsinger"; // Storm magic -> Stormsinger
    if (c === 'voidwing') return "Shadowblade";    // Void warrior -> Shadowblade
    if (c === 'sky knight') return "Skyspear";     // Sky warrior -> Skyspear
    if (c === 'wind sage') return "Elementalist";  // Wind magic -> Elementalist
    return "Warrior"; // Default fallback
  }, [characterClass]);

  // Generate seed from character name
  const portraitSeed = useMemo(() => {
    return characterName ? `${characterName.toLowerCase().replace(/\s+/g, '-')}-001` : 'default-001';
  }, [characterName]);

  const currentPortraitOpts: PortraitOptions = {
    seed: `${portraitSeed}-v${selectedVariant}`,
    race: normalizedRace,
    archetype: normalizedClass,
    body: selectedBody,
    faction: selectedPalette as keyof typeof Palettes,
    variant: selectedVariant,
  };

  const currentPalette = Palettes[selectedPalette];

  const handleConfirmPortrait = () => {
    const portraitData = generatePortraitData(currentPortraitOpts, currentPalette);
    onPortraitChange(portraitData);
    setShowPicker(false);
  };

  if (!showPicker) {
    return (
      <div style={{ marginTop: '20px' }}>
        <button
          onClick={() => setShowPicker(true)}
          style={{
            background: '#7c3aed',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '10px 20px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          🎨 Generate Portrait
        </button>
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      background: 'rgba(0,0,0,0.8)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        background: '#1e293b',
        borderRadius: '16px',
        padding: '30px',
        maxWidth: '600px',
        width: '100%',
        maxHeight: '80vh',
        overflow: 'auto',
        color: '#f8fafc'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0 }}>Portrait Generator</h2>
          <button
            onClick={() => setShowPicker(false)}
            style={{
              background: '#374151',
              color: '#f8fafc',
              border: 'none',
              borderRadius: '6px',
              padding: '8px 12px',
              cursor: 'pointer'
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ marginBottom: '20px', padding: '15px', background: '#0f172a', borderRadius: '8px' }}>
          <p style={{ margin: '0 0 5px 0', fontSize: '14px', color: '#94a3b8' }}>Generating portrait for:</p>
          <p style={{ margin: '0', fontSize: '16px', fontWeight: 'bold' }}>
            {characterName} • {characterRace} {characterClass}
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#94a3b8' }}>
              Body Type
            </label>
            <select
              value={selectedBody}
              onChange={(e) => setSelectedBody(e.target.value as BodyType)}
              style={{
                width: '100%',
                background: '#374151',
                border: '1px solid #4b5563',
                borderRadius: '6px',
                padding: '8px',
                color: '#f8fafc'
              }}
            >
              <option value="slim">Slim</option>
              <option value="standard">Standard</option>
              <option value="heavy">Heavy</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#94a3b8' }}>
              Theme Palette
            </label>
            <select
              value={selectedPalette}
              onChange={(e) => setSelectedPalette(e.target.value)}
              style={{
                width: '100%',
                background: '#374151',
                border: '1px solid #4b5563',
                borderRadius: '6px',
                padding: '8px',
                color: '#f8fafc'
              }}
            >
              {Object.keys(Palettes).map(palette => (
                <option key={palette} value={palette}>{palette}</option>
              ))}
            </select>
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#94a3b8' }}>
              Style Variant: {selectedVariant}
            </label>
            <input
              type="range"
              min="0"
              max="11"
              value={selectedVariant}
              onChange={(e) => setSelectedVariant(parseInt(e.target.value))}
              style={{ width: '100%' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
              <span>Classic</span>
              <span>Varied</span>
            </div>
          </div>
        </div>

        {/* Portrait Preview Placeholder */}
        <div style={{
          background: `linear-gradient(135deg, ${currentPalette.primary}22, ${currentPalette.secondary}22)`,
          borderRadius: '12px',
          padding: '30px',
          textAlign: 'center',
          marginBottom: '20px',
          border: `2px solid ${currentPalette.accent}33`
        }}>
          <div style={{ fontSize: '48px', marginBottom: '10px' }}>
            {normalizedRace === 'Elf' ? '🧝' : 
             normalizedRace === 'Dwarf' ? '💎' :
             normalizedRace === 'Fae' ? '🌟' :
             normalizedRace === 'Draken' ? '🐲' :
             normalizedRace === 'Automaton' ? '🤖' :
             normalizedRace === 'Halfling' ? '⚡' : '👤'}
          </div>
          <p style={{ margin: '0', color: '#94a3b8' }}>
            Preview: {normalizedRace} {normalizedClass}
          </p>
          <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#6b7280' }}>
            Seed: {currentPortraitOpts.seed}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button
            onClick={() => setShowPicker(false)}
            style={{
              background: '#374151',
              color: '#f8fafc',
              border: 'none',
              borderRadius: '8px',
              padding: '10px 20px',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmPortrait}
            style={{
              background: '#059669',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '10px 20px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Use This Portrait
          </button>
        </div>
      </div>
    </div>
  );
}