/**
 * Game Menu - Tabbed in-game menu system
 */

import React, { useState, useMemo } from 'react';
import { WorldEngine } from '../engine/index';
import { CLASS_DEFINITIONS } from '../defaultWorlds';
import { SimplePortraitPreview, SimpleUtils } from '../visuals';

// Species and trait definitions for character creation
const SPECIES_OPTIONS = [
  "Human", "Sylvanborn", "Nightborn", "Stormcaller"
];

const GENDER_OPTIONS = [
  "Female", "Male"
];

const SPECIES_TRAIT_RULES: Record<string, {
  automatic: string[];
  forbidden: string[];
  preferred: string[];
  description: string;
}> = {
  "Human": {
    automatic: [],
    forbidden: [],
    preferred: ["Brave", "Clever", "Silver Tongue"],
    description: "Adaptable and versatile, humans can develop any traits through experience."
  },
  "Sylvanborn": {
    automatic: ["Nature's Friend"],
    forbidden: ["Cunning"],
    preferred: ["Observant", "Keen Senses", "Patient"],
    description: "Forest dwellers with an innate connection to nature."
  },
  "Nightborn": {
    automatic: ["Observant"],
    forbidden: ["Nature's Friend"],
    preferred: ["Clever", "Iron Will", "Cunning"],
    description: "Shadow-touched beings with enhanced perception but unnatural aura."
  },
  "Stormcaller": {
    automatic: ["Swift"],
    forbidden: ["Patient"],
    preferred: ["Brave", "Observant", "Silver Tongue"],
    description: "Sky-born people infused with elemental storm energy."
  }
};

const TRAIT_DEFINITIONS = {
  "Brave": {
    name: "Brave",
    description: "Resistant to fear and intimidation effects. +2 bonus to courage-based checks.",
    mechanicalEffect: "fear_resistance",
    bonus: { type: "courage", value: 2 }
  },
  "Clever": {
    name: "Clever",
    description: "Quick thinking in complex situations. +2 bonus to puzzle-solving and investigation.",
    mechanicalEffect: "intelligence_bonus",
    bonus: { type: "investigation", value: 2 }
  },
  "Cunning": {
    name: "Cunning",
    description: "Skilled at deception and misdirection. +2 bonus to stealth and deception checks.",
    mechanicalEffect: "deception_bonus",
    bonus: { type: "stealth", value: 2 }
  },
  "Empathic": {
    name: "Empathic",
    description: "Deeply understands others' emotions. +2 bonus to persuasion and healing checks.",
    mechanicalEffect: "social_bonus",
    bonus: { type: "persuasion", value: 2 }
  },
  "Stoic": {
    name: "Stoic",
    description: "Unshaken by pain or hardship. +2 bonus to endurance and resistance checks.",
    mechanicalEffect: "endurance_bonus",
    bonus: { type: "endurance", value: 2 }
  },
  "Lucky": {
    name: "Lucky",
    description: "Fortune favors you. Once per encounter, reroll any failed check.",
    mechanicalEffect: "reroll_ability",
    bonus: { type: "reroll", value: 1 }
  },
  "Observant": {
    name: "Observant",
    description: "Notice details others miss. +2 bonus to perception and awareness checks.",
    mechanicalEffect: "perception_bonus",
    bonus: { type: "perception", value: 2 }
  },
  "Silver Tongue": {
    name: "Silver Tongue",
    description: "Naturally persuasive speaker. +2 bonus to all social interaction checks.",
    mechanicalEffect: "social_master",
    bonus: { type: "social", value: 2 }
  },
  "Iron Will": {
    name: "Iron Will",
    description: "Mental fortitude against magical effects. +2 bonus to resist mental magic.",
    mechanicalEffect: "mental_resistance",
    bonus: { type: "mental_defense", value: 2 }
  },
  "Swift": {
    name: "Swift",
    description: "Faster movement and reflexes. +2 bonus to speed and reaction checks.",
    mechanicalEffect: "speed_bonus",
    bonus: { type: "speed", value: 2 }
  },
  "Nature's Friend": {
    name: "Nature's Friend",
    description: "Animals and plants respond favorably. +2 bonus to nature-based interactions.",
    mechanicalEffect: "nature_bonus",
    bonus: { type: "nature", value: 2 }
  },
  "Keen Senses": {
    name: "Keen Senses",
    description: "Enhanced sensory perception. +2 bonus to detect hidden things or dangers.",
    mechanicalEffect: "detection_bonus",
    bonus: { type: "detection", value: 2 }
  },
  "Patient": {
    name: "Patient",
    description: "Calm and methodical approach. +2 bonus to sustained concentration tasks.",
    mechanicalEffect: "concentration_bonus",
    bonus: { type: "concentration", value: 2 }
  },
  "Resilient": {
    name: "Resilient",
    description: "Exceptionally tough constitution. +2 HP per level beyond normal.",
    mechanicalEffect: "hp_bonus",
    bonus: { type: "hp_per_level", value: 2 }
  },
  "Hardy": {
    name: "Hardy",
    description: "Natural toughness and endurance. +1 HP per level beyond normal.",
    mechanicalEffect: "hp_bonus_small",
    bonus: { type: "hp_per_level", value: 1 }
  },
  "Frail": {
    name: "Frail",
    description: "Delicate constitution, but often comes with other gifts. -2 HP per level.",
    mechanicalEffect: "hp_penalty",
    bonus: { type: "hp_per_level", value: -2 }
  }
};

const TRAIT_CATALOG = Object.keys(TRAIT_DEFINITIONS);

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

// Calculate ability modifier from stat value
function abilityMod(stat: number): number {
  return Math.floor((stat - 10) / 2);
}

// Calculate HP and AC with all bonuses
function calculateHPAndAC(
  stats: Record<Stats, number>,
  species: string,
  archetype: string,
  level: number,
  traits: string[]
): { level: number; hp: number; ac: number; carry: number; naturalACBonus: number; totalHPPerLevel: number; classHPBonus: number; raceHPBonus: number; traitHPBonus: number } {
  const lvl = level;

  // Get final stats after applying racial and class bonuses
  const finalSTR = getFinalStat(stats.STR, "STR", species, archetype);
  const finalCON = getFinalStat(stats.CON, "CON", species, archetype);
  const finalDEX = getFinalStat(stats.DEX, "DEX", species, archetype);

  // Base HP calculation
  const baseHP = 8 + abilityMod(finalCON); // Level 1 HP
  const hpPerLevel = 1 + Math.max(0, abilityMod(finalCON)); // HP gained per level

  // Class-based HP bonus (based on combat role)
  let classHPBonus = 0;
  if (archetype === "Thorn Knight" || archetype === "Ashblade" || archetype === "Ironclad" ||
    archetype === "Stormbreaker" || archetype === "Voidhunter" || archetype === "Crystal Guardian") {
    classHPBonus = 3; // Heavy combat classes - high HP
  } else if (archetype === "Greenwarden" || archetype === "Guardian" || archetype === "Warrior") {
    classHPBonus = 2; // Medium combat classes - good HP
  } else if (archetype === "Ranger" || archetype === "Rogue" || archetype === "Artificer") {
    classHPBonus = 1; // Light combat classes - moderate HP
  } else {
    classHPBonus = 0; // Magic classes - low HP
  }

  // Race-based HP modifiers
  let raceHPBonus = 0;
  if (species === "Alloy") {
    raceHPBonus = 2; // Metal-infused - very tough
  } else if (species === "Draketh") {
    raceHPBonus = 2; // Dragon heritage - naturally tough
  } else if (species === "Crystalborn") {
    raceHPBonus = 1; // Crystal-hard - somewhat tough
  } else if (species === "Human") {
    raceHPBonus = 1; // Adaptable - slightly above average
  } else if (species === "Voidkin") {
    raceHPBonus = 0; // Otherworldly - average toughness
  } else if (species === "Sylvanborn") {
    raceHPBonus = -1; // Graceful but fragile
  } else if (species === "Stormcaller") {
    raceHPBonus = 0; // Light and agile - average toughness
  }

  // Trait-based HP bonuses
  let traitHPBonus = 0;
  if (traits.includes("Resilient")) {
    traitHPBonus += 2; // Tough trait adds HP per level
  }
  if (traits.includes("Hardy")) {
    traitHPBonus += 1; // Another toughness trait
  }
  if (traits.includes("Frail")) {
    traitHPBonus -= 2; // Negative trait reduces HP
  }

  // Calculate total HP per level (minimum 1 per level)
  const totalHPPerLevel = Math.max(1, hpPerLevel + classHPBonus + raceHPBonus + traitHPBonus);

  // Calculate final HP
  const hp = baseHP + (totalHPPerLevel * (lvl - 1)); // Level 1 gets base HP, then add per level

  // Calculate AC with natural bonus
  let naturalACBonus = 0;

  // Very small level bonus (+1 at level 8, +2 at level 16)
  if (lvl >= 16) naturalACBonus += 2;
  else if (lvl >= 8) naturalACBonus += 1;

  // Class-based bonus (combat training)
  if (archetype === "Thorn Knight" || archetype === "Ashblade" || archetype === "Ironclad" ||
    archetype === "Stormbreaker" || archetype === "Voidhunter" || archetype === "Crystal Guardian") {
    if (lvl >= 15) naturalACBonus += 2;
    else if (lvl >= 7) naturalACBonus += 1;
  }
  else if (archetype === "Greenwarden" || archetype === "Guardian" || archetype === "Warrior") {
    if (lvl >= 10) naturalACBonus += 1;
  }
  else if (archetype === "Ranger" || archetype === "Rogue" || archetype === "Artificer") {
    if (lvl >= 15) naturalACBonus += 1;
  }

  // Race-based bonus (natural toughness)
  if (species === "Alloy") {
    if (lvl >= 12) naturalACBonus += 1; // Metal-infused body
  } else if (species === "Draketh") {
    if (lvl >= 15) naturalACBonus += 1; // Dragon heritage - tough scales
  } else if (species === "Crystalborn") {
    if (lvl >= 15) naturalACBonus += 1; // Crystal-hard skin
  }

  // Hard cap at +5 total natural AC bonus
  naturalACBonus = Math.min(naturalACBonus, 5);

  const ac = 10 + abilityMod(finalDEX) + naturalACBonus;
  const carry = 15 * finalSTR;

  return { level: lvl, hp, ac, carry, naturalACBonus, totalHPPerLevel, classHPBonus, raceHPBonus, traitHPBonus };
}



// Species definitions with trait rules
const SPECIES_DEFINITIONS = {
  "Human": {
    name: "Human",
    description: "Adaptable and versatile, humans can develop any traits through experience.",
    statModifiers: { STR: 1, CHA: 1, CON: -1, WIS: -1 },
    automaticTraits: [],
    forbiddenTraits: [],
    preferredTraits: ["Brave", "Clever", "Silver Tongue"]
  },
  "Sylvanborn": {
    name: "Sylvanborn",
    description: "Forest dwellers with an innate connection to nature.",
    statModifiers: { DEX: 2, WIS: 1, STR: -2, CON: -1 },
    automaticTraits: ["Nature's Friend"],
    forbiddenTraits: ["Cunning"],
    preferredTraits: ["Observant", "Keen Senses", "Patient"]
  },
  "Alloy": {
    name: "Alloy",
    description: "Mechanical beings with logical minds but limited emotional range.",
    statModifiers: { CON: 2, INT: 1, DEX: -2, CHA: -1 },
    automaticTraits: ["Iron Will"],
    forbiddenTraits: ["Empathic", "Silver Tongue"],
    preferredTraits: ["Stoic", "Patient", "Clever"]
  },
  "Draketh": {
    name: "Draketh",
    description: "Proud dragon-descendants who rarely back down from challenges.",
    statModifiers: { STR: 2, CHA: 1, DEX: -1, WIS: -2 },
    automaticTraits: ["Brave"],
    forbiddenTraits: ["Patient"],
    preferredTraits: ["Swift", "Silver Tongue", "Stoic"]
  },
  "Voidkin": {
    name: "Voidkin",
    description: "Shadow-touched beings with enhanced perception but unnatural aura.",
    statModifiers: { INT: 2, WIS: 1, STR: -1, CHA: -2 },
    automaticTraits: ["Observant"],
    forbiddenTraits: ["Nature's Friend"],
    preferredTraits: ["Clever", "Iron Will", "Cunning"]
  },
  "Crystalborn": {
    name: "Crystalborn",
    description: "Living crystal beings with incredible mental fortitude.",
    statModifiers: { CON: 1, INT: 2, DEX: -1, CHA: -2 },
    automaticTraits: ["Stoic"],
    forbiddenTraits: ["Swift"],
    preferredTraits: ["Iron Will", "Patient", "Keen Senses"]
  },
  "Stormcaller": {
    name: "Stormcaller",
    description: "Sky-born people infused with elemental storm energy.",
    statModifiers: { DEX: 1, CHA: 2, CON: -1, STR: -2 },
    automaticTraits: ["Swift"],
    forbiddenTraits: ["Patient"],
    preferredTraits: ["Brave", "Observant", "Silver Tongue"]
  }
};

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

// Extract class modifiers from our comprehensive class definitions
const CLASS_MODIFIERS: Record<string, Partial<Record<Stats, number>>> = {};

// Populate class modifiers from CLASS_DEFINITIONS
Object.entries(CLASS_DEFINITIONS).forEach(([className, classData]) => {
  // Convert our stat modifier names to the Stats type used here
  CLASS_MODIFIERS[className] = {
    STR: classData.statModifiers.strength || 0,
    DEX: classData.statModifiers.dexterity || 0,
    CON: classData.statModifiers.constitution || 0,
    INT: classData.statModifiers.intelligence || 0,
    WIS: classData.statModifiers.wisdom || 0,
    CHA: classData.statModifiers.charisma || 0,
  };
});

// Get final stat after applying racial and class modifiers
function getFinalStat(baseStat: number, stat: Stats, species: string, archetype: string): number {
  let final = baseStat;

  // Add racial bonus (can be negative)
  const racialBonus = RACIAL_MODIFIERS[species]?.[stat] || 0;
  final += racialBonus;

  // Add class bonus (can be negative - balanced like racial bonuses)
  const classBonus = CLASS_MODIFIERS[archetype]?.[stat] || 0;
  final += classBonus;

  return Math.max(3, Math.min(final, 22)); // Cap between 3-22 (penalties can bring stats low, but not too low)
}

// Get the display text for bonuses
function getBonusText(stat: Stats, species: string, archetype: string): string {
  const racialBonus = RACIAL_MODIFIERS[species]?.[stat] || 0;
  const classBonus = CLASS_MODIFIERS[archetype]?.[stat] || 0;

  let text = "";
  if (racialBonus > 0) text += ` +${racialBonus} racial`;
  else if (racialBonus < 0) text += ` ${racialBonus} racial`;

  if (classBonus > 0) text += ` +${classBonus} class`;
  else if (classBonus < 0) text += ` ${classBonus} class`;

  return text.trim();
}

const CLASS_OPTIONS = Object.keys(CLASS_DEFINITIONS);
const BACKGROUND_OPTIONS = ["Commoner", "Noble", "Soldier", "Scholar", "Merchant", "Artisan", "Criminal", "Folk Hero", "Hermit", "Entertainer"];
const MAX_TRAITS = 2; // Maximum number of selectable traits (excluding automatic traits)

const DEFAULT_STATS: Record<Stats, number> = {
  STR: 8, DEX: 8, CON: 8, INT: 8, WIS: 8, CHA: 8,
};

interface GameMenuProps {
  engine: WorldEngine;
  isVisible: boolean;
  onClose: () => void;
  showGrid: boolean;
  onToggleGrid: () => void;
  cameraLocked: boolean;
  onToggleCameraLock: () => void;
  onRefresh?: () => void; // Callback to force parent component refresh
  stats: {
    chunks: { loaded?: number; total?: number } | any;
    discovered: number;
    timeOfDay: string;
    gameTime: string;
  };
}

type MenuTab = 'stats' | 'abilities' | 'spells' | 'creation' | 'settings';

export default function GameMenu({
  engine,
  isVisible,
  onClose,
  showGrid,
  onToggleGrid,
  cameraLocked,
  onToggleCameraLock,
  onRefresh,
  stats
}: GameMenuProps) {
  const [activeTab, setActiveTab] = useState<MenuTab>('stats');
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null);

  if (!isVisible) return null; return (
    <div style={{
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      background: 'rgba(0, 0, 0, 0.95)',
      color: '#f9fafb',
      padding: '0',
      borderRadius: '12px',
      border: '2px solid #374151',
      width: '80vw',
      maxWidth: '900px',
      height: '80vh',
      maxHeight: '700px',
      zIndex: 300,
      boxShadow: '0 12px 48px rgba(0, 0, 0, 0.8)',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Menu Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '20px 24px',
        borderBottom: '2px solid #374151'
      }}>
        <h2 style={{ margin: 0, color: '#f1f5f9', fontSize: '24px' }}>🎮 Game Menu</h2>
        <button
          onClick={onClose}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#94a3b8',
            fontSize: '24px',
            cursor: 'pointer',
            padding: '0',
            width: '32px',
            height: '32px'
          }}
        >
          ×
        </button>
      </div>

      {/* Tab Navigation */}
      <div style={{
        display: 'flex',
        borderBottom: '2px solid #374151',
        backgroundColor: 'rgba(0, 0, 0, 0.3)'
      }}>
        {[
          { id: 'stats', label: '📊 Character Stats', icon: '📊' },
          { id: 'abilities', label: '⚔️ Physical Abilities', icon: '⚔️' },
          { id: 'spells', label: '✨ Magical Spells', icon: '✨' },
          { id: 'creation', label: '� Create Character', icon: '�' },
          { id: 'settings', label: '⚙️ Game Settings', icon: '⚙️' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as MenuTab)}
            style={{
              flex: 1,
              padding: '12px 16px',
              background: activeTab === tab.id ? '#374151' : 'transparent',
              color: activeTab === tab.id ? '#f9fafb' : '#94a3b8',
              border: 'none',
              borderBottom: activeTab === tab.id ? '3px solid #3b82f6' : '3px solid transparent',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: activeTab === tab.id ? 'bold' : 'normal',
              transition: 'all 0.2s'
            }}
          >
            {tab.icon} {tab.label.split(' ').slice(1).join(' ')}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={{
        flex: 1,
        padding: '24px',
        overflowY: 'auto',
        backgroundColor: 'rgba(0, 0, 0, 0.2)'
      }}>
        {activeTab === 'stats' && (
          <div>
            <h3 style={{ margin: '0 0 20px 0', color: '#3b82f6' }}>📊 Character Statistics</h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
              {/* Basic Info */}
              <div style={{
                background: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                borderRadius: '8px',
                padding: '16px'
              }}>
                <h4 style={{ margin: '0 0 12px 0', color: '#60a5fa' }}>Basic Information</h4>
                <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
                  <div><strong>Level:</strong> {engine.state.party.level}</div>
                  <div><strong>Experience:</strong> {engine.state.party.experience}/{engine.state.party.level * 100}</div>
                  <div><strong>Position:</strong> ({engine.state.party.x}, {engine.state.party.y})</div>
                </div>
              </div>

              {/* Health & Resources */}
              <div style={{
                background: 'rgba(34, 197, 94, 0.1)',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                borderRadius: '8px',
                padding: '16px'
              }}>
                <h4 style={{ margin: '0 0 12px 0', color: '#4ade80' }}>Health & Resources</h4>
                <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
                  <div>
                    <strong>Health:</strong>
                    <span style={{
                      color: engine.state.party.hitPoints / engine.state.party.maxHitPoints > 0.7 ? '#4ade80' :
                        engine.state.party.hitPoints / engine.state.party.maxHitPoints > 0.3 ? '#eab308' : '#ef4444',
                      fontWeight: 'bold',
                      marginLeft: '8px'
                    }}>
                      {engine.state.party.hitPoints}/{engine.state.party.maxHitPoints}
                    </span>
                  </div>
                  <div>
                    <strong>Stamina:</strong>
                    <span style={{
                      color: engine.state.party.stamina / engine.state.party.maxStamina > 0.7 ? '#4ade80' :
                        engine.state.party.stamina / engine.state.party.maxStamina > 0.3 ? '#eab308' : '#ef4444',
                      fontWeight: 'bold',
                      marginLeft: '8px'
                    }}>
                      {engine.state.party.stamina}/{engine.state.party.maxStamina}
                    </span>
                  </div>
                  <div>
                    <strong>Ether:</strong>
                    <span style={{
                      color: engine.state.party.ether / engine.state.party.maxEther > 0.7 ? '#4ade80' :
                        engine.state.party.ether / engine.state.party.maxEther > 0.3 ? '#eab308' : '#ef4444',
                      fontWeight: 'bold',
                      marginLeft: '8px'
                    }}>
                      {engine.state.party.ether}/{engine.state.party.maxEther}
                    </span>
                  </div>
                </div>
              </div>

              {/* Attributes */}
              <div style={{
                background: 'rgba(168, 85, 247, 0.1)',
                border: '1px solid rgba(168, 85, 247, 0.3)',
                borderRadius: '8px',
                padding: '16px'
              }}>
                <h4 style={{ margin: '0 0 12px 0', color: '#a855f7' }}>Attributes</h4>
                <div style={{ fontSize: '14px', lineHeight: '1.6', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                  <div><strong>STR:</strong> {engine.state.party.stats.strength}</div>
                  <div><strong>DEX:</strong> {engine.state.party.stats.dexterity}</div>
                  <div><strong>CON:</strong> {engine.state.party.stats.constitution}</div>
                  <div><strong>INT:</strong> {engine.state.party.stats.intelligence}</div>
                  <div><strong>WIS:</strong> {engine.state.party.stats.wisdom}</div>
                  <div><strong>CHA:</strong> {engine.state.party.stats.charisma}</div>
                </div>
              </div>

              {/* Equipment */}
              <div style={{
                background: 'rgba(234, 179, 8, 0.1)',
                border: '1px solid rgba(234, 179, 8, 0.3)',
                borderRadius: '8px',
                padding: '16px'
              }}>
                <h4 style={{ margin: '0 0 12px 0', color: '#eab308' }}>Equipment</h4>
                <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
                  {engine.state.party.equipment.length > 0 ? (
                    engine.state.party.equipment.map((item, i) => (
                      <div key={i} style={{ color: '#4ade80' }}>{item.replace(/_/g, ' ')}</div>
                    ))
                  ) : (
                    <div style={{ color: '#94a3b8', fontStyle: 'italic' }}>No equipment</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'abilities' && (
          <div>
            <h3 style={{ margin: '0 0 20px 0', color: '#4ade80' }}>⚔️ Physical Abilities</h3>

            {/* Known Abilities */}
            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ margin: '0 0 12px 0', color: '#22c55e' }}>Known Abilities</h4>
              {engine.state.party.knownAbilities.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '8px' }}>
                  {engine.state.party.knownAbilities.map((ability, i) => (
                    <div key={i} style={{
                      padding: '8px 12px',
                      background: 'rgba(34, 197, 94, 0.2)',
                      borderRadius: '6px',
                      border: '1px solid #22c55e',
                      fontSize: '13px'
                    }}>
                      {ability}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: '14px', color: '#94a3b8', fontStyle: 'italic' }}>
                  No physical abilities learned yet.
                </div>
              )}
            </div>

            {/* Available Abilities by School */}
            <div>
              <h4 style={{ margin: '0 0 12px 0', color: '#eab308' }}>Available to Learn by School</h4>
              <CharacterSelector engine={engine} selectedCharacterId={selectedCharacterId} onSelectCharacter={setSelectedCharacterId} />
              {selectedCharacterId && <AbilitiesBySchool engine={engine} characterId={selectedCharacterId} />}
            </div>
          </div>
        )}

        {activeTab === 'spells' && (
          <div>
            <h3 style={{ margin: '0 0 20px 0', color: '#8b5cf6' }}>✨ Magical Spells</h3>

            {/* Known Spells */}
            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ margin: '0 0 12px 0', color: '#a855f7' }}>Known Spells</h4>
              {engine.state.party.knownSpells.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '8px' }}>
                  {engine.state.party.knownSpells.map((spell, i) => (
                    <div key={i} style={{
                      padding: '8px 12px',
                      background: 'rgba(139, 92, 246, 0.2)',
                      borderRadius: '6px',
                      border: '1px solid #8b5cf6',
                      fontSize: '13px'
                    }}>
                      {spell}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: '14px', color: '#94a3b8', fontStyle: 'italic' }}>
                  No spells learned yet.
                </div>
              )}
            </div>

            {/* Available Spells by School */}
            <div>
              <h4 style={{ margin: '0 0 12px 0', color: '#06b6d4' }}>Available to Learn by School</h4>
              <CharacterSelector engine={engine} selectedCharacterId={selectedCharacterId} onSelectCharacter={setSelectedCharacterId} />
              {selectedCharacterId && <SpellsBySchool engine={engine} characterId={selectedCharacterId} />}
            </div>
          </div>
        )}

        {activeTab === 'creation' && (
          <div>
            <h3 style={{ margin: '0 0 20px 0', color: '#f59e0b' }}>� Character Creation</h3>

            <CharacterCreationForm engine={engine} />
          </div>
        )}

        {activeTab === 'settings' && (
          <div>
            <h3 style={{ margin: '0 0 20px 0', color: '#6b7280' }}>⚙️ Game Settings</h3>

            <div style={{ display: 'grid', gap: '20px' }}>
              <div style={{
                background: 'rgba(107, 114, 128, 0.1)',
                border: '1px solid rgba(107, 114, 128, 0.3)',
                borderRadius: '8px',
                padding: '20px'
              }}>
                <h4 style={{ margin: '0 0 16px 0', color: '#9ca3af' }}>Display Settings</h4>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <label style={{ fontSize: '14px', color: '#e2e8f0' }}>Show Grid</label>
                  <button
                    onClick={onToggleGrid}
                    style={{
                      padding: '6px 12px',
                      background: showGrid ? '#059669' : '#374151',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    {showGrid ? 'ON' : 'OFF'}
                  </button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <label style={{ fontSize: '14px', color: '#e2e8f0' }}>Camera Lock</label>
                  <button
                    onClick={onToggleCameraLock}
                    style={{
                      padding: '6px 12px',
                      background: cameraLocked ? '#059669' : '#374151',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    {cameraLocked ? 'LOCKED' : 'FREE'}
                  </button>
                </div>
              </div>

              <div style={{
                background: 'rgba(107, 114, 128, 0.1)',
                border: '1px solid rgba(107, 114, 128, 0.3)',
                borderRadius: '8px',
                padding: '20px'
              }}>
                <h4 style={{ margin: '0 0 16px 0', color: '#9ca3af' }}>Game Information</h4>
                <div style={{ fontSize: '13px', lineHeight: '1.6', color: '#cbd5e1' }}>
                  <div><strong>Time:</strong> {stats.gameTime}</div>
                  <div><strong>Weather:</strong> {engine.state.weather.type} ({Math.round(engine.state.weather.intensity * 100)}%)</div>
                  <div><strong>Chunks Loaded:</strong> {(stats.chunks as any).loaded || 0}</div>
                  <div><strong>Discovered Tiles:</strong> {stats.discovered}</div>
                  <div>
                    <strong>Encounter Risk:</strong>
                    <span style={{
                      color: engine.state.encounterClock.riskLevel > 0.7 ? '#ef4444' :
                        engine.state.encounterClock.riskLevel > 0.4 ? '#eab308' : '#4ade80',
                      fontWeight: 'bold',
                      marginLeft: '8px'
                    }}>
                      {Math.round(engine.state.encounterClock.riskLevel * 100)}%
                    </span>
                  </div>
                </div>
              </div>

              <div style={{
                background: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                borderRadius: '8px',
                padding: '20px'
              }}>
                <h4 style={{ margin: '0 0 16px 0', color: '#60a5fa' }}>💾 Save & Load</h4>
                <div style={{ display: 'grid', gap: '12px' }}>
                  <div style={{ fontSize: '12px', color: '#cbd5e1', marginBottom: '8px' }}>
                    Your game is automatically saved when you move, create characters, or learn abilities.
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '8px' }}>
                    <button
                      onClick={() => {
                        try {
                          const saveData = engine.save();
                          const blob = new Blob([saveData], { type: 'application/json' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `world-engine-save-${new Date().toISOString().split('T')[0]}.json`;
                          a.click();
                          URL.revokeObjectURL(url);
                          alert('Game saved to file!');
                        } catch (error) {
                          alert('Failed to save game: ' + error);
                        }
                      }}
                      style={{
                        padding: '8px 12px',
                        background: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}
                    >
                      📥 Export Save
                    </button>

                    <button
                      onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = '.json';
                        input.onchange = (e) => {
                          const file = (e.target as HTMLInputElement).files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (e) => {
                              try {
                                const saveData = e.target?.result as string;
                                const success = engine.load(saveData);
                                if (success) {
                                  // Force a refresh of the parent component to show loaded data
                                  onRefresh?.();
                                  alert('Game loaded successfully! Your characters and progress have been restored.');
                                } else {
                                  alert('Failed to load save file. Please check the file format.');
                                }
                              } catch (error) {
                                alert('Failed to load game: ' + error);
                              }
                            };
                            reader.readAsText(file);
                          }
                        };
                        input.click();
                      }}
                      style={{
                        padding: '8px 12px',
                        background: '#059669',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}
                    >
                      📤 Import Save
                    </button>

                    <button
                      onClick={() => {
                        if (confirm('Are you sure you want to start a new game? This will delete your current progress.')) {
                          localStorage.removeItem('world-engine-save');
                          alert('Save data cleared! Refresh the page to start a new game.');
                        }
                      }}
                      style={{
                        padding: '8px 12px',
                        background: '#dc2626',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}
                    >
                      🗑️ New Game
                    </button>
                  </div>

                  <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '8px' }}>
                    <div><strong>Seed:</strong> {engine.state.seed}</div>
                    <div><strong>Characters:</strong> {engine.state.characters.length}</div>
                    <div><strong>Last Save:</strong> Auto-saved to browser</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Character selector component
function CharacterSelector({
  engine,
  selectedCharacterId,
  onSelectCharacter
}: {
  engine: WorldEngine;
  selectedCharacterId: string | null;
  onSelectCharacter: (id: string | null) => void;
}) {
  const characters = engine.getPartyCharacters();

  if (characters.length === 0) {
    return (
      <div style={{
        padding: '16px',
        background: 'rgba(239, 68, 68, 0.1)',
        border: '1px solid rgba(239, 68, 68, 0.3)',
        borderRadius: '8px',
        marginBottom: '16px',
        fontSize: '14px',
        color: '#fca5a5'
      }}>
        ⚠️ No characters in party. Add characters to assign abilities and spells.
      </div>
    );
  }

  return (
    <div style={{ marginBottom: '16px' }}>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {characters.map(char => (
          <button
            key={char.id}
            onClick={() => onSelectCharacter(selectedCharacterId === char.id ? null : char.id)}
            style={{
              padding: '8px 16px',
              background: selectedCharacterId === char.id ? '#3b82f6' : 'rgba(59, 130, 246, 0.2)',
              border: selectedCharacterId === char.id ? '2px solid #60a5fa' : '1px solid rgba(59, 130, 246, 0.3)',
              borderRadius: '6px',
              color: selectedCharacterId === char.id ? '#f9fafb' : '#94a3b8',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: selectedCharacterId === char.id ? 'bold' : 'normal',
              transition: 'all 0.2s'
            }}
          >
            👤 {char.name} (Lv.{char.level})
          </button>
        ))}
      </div>
      {selectedCharacterId && (
        <div style={{
          marginTop: '12px',
          padding: '12px',
          background: 'rgba(59, 130, 246, 0.1)',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          borderRadius: '6px',
          fontSize: '13px',
          color: '#cbd5e1'
        }}>
          Selected: <strong>{characters.find(c => c.id === selectedCharacterId)?.name}</strong>
        </div>
      )}
    </div>
  );
}

// Abilities organized by school dropdown component
function AbilitiesBySchool({ engine, characterId }: { engine: WorldEngine; characterId: string }) {
  const [openSchools, setOpenSchools] = useState<Set<string>>(new Set());

  const character = engine.getCharacter(characterId);
  const abilitiesBySchool = useMemo(() => {
    if (!character) return {};

    try {
      const available = engine.getAvailablePhysicalAbilitiesForCharacter(characterId).filter(
        ability => !character.knownAbilities.includes(ability.name)
      );

      const grouped: Record<string, any[]> = {};
      available.forEach(ability => {
        if (!grouped[ability.school]) {
          grouped[ability.school] = [];
        }
        grouped[ability.school].push(ability);
      });

      return grouped;
    } catch (error) {
      console.error('Error loading abilities:', error);
      return {};
    }
  }, [character?.level, JSON.stringify(character?.stats), JSON.stringify(character?.knownAbilities), characterId]);

  if (!character) {
    return (
      <div style={{ fontSize: '14px', color: '#ef4444' }}>
        Character not found.
      </div>
    );
  }

  const toggleSchool = (school: string) => {
    const newOpen = new Set(openSchools);
    if (newOpen.has(school)) {
      newOpen.delete(school);
    } else {
      newOpen.add(school);
    }
    setOpenSchools(newOpen);
  };

  const schools = Object.keys(abilitiesBySchool).sort();

  if (schools.length === 0) {
    return (
      <div style={{ fontSize: '14px', color: '#94a3b8', fontStyle: 'italic' }}>
        No new physical abilities available.
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gap: '8px' }}>
      {schools.map(school => (
        <div key={school} style={{
          border: '1px solid rgba(34, 197, 94, 0.3)',
          borderRadius: '8px',
          background: 'rgba(34, 197, 94, 0.1)'
        }}>
          <button
            onClick={() => toggleSchool(school)}
            style={{
              width: '100%',
              padding: '12px 16px',
              background: 'transparent',
              border: 'none',
              color: '#4ade80',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <span>⚔️ {school} ({abilitiesBySchool[school].length})</span>
            <span style={{ fontSize: '18px' }}>{openSchools.has(school) ? '▼' : '▶'}</span>
          </button>

          {openSchools.has(school) && (
            <div style={{ padding: '0 16px 16px 16px', display: 'grid', gap: '12px' }}>
              {abilitiesBySchool[school].map((ability: any, i: number) => (
                <div key={i} style={{
                  padding: '16px',
                  background: 'rgba(234, 179, 8, 0.2)',
                  borderRadius: '8px',
                  border: '1px solid #eab308'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 'bold', color: '#fbbf24', fontSize: '16px' }}>{ability.name}</div>
                      <div style={{ fontSize: '12px', color: '#e2e8f0', marginTop: '4px' }}>
                        {ability.school} • {ability.tier} • Stamina: {ability.staminaCost}
                      </div>
                      <div style={{ fontSize: '13px', color: '#cbd5e1', marginTop: '8px' }}>
                        {ability.description}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        const success = engine.learnPhysicalAbilityForCharacter(characterId, ability.name);
                        if (success) {
                          console.log(`${character.name} learned ${ability.name}!`);
                        }
                      }}
                      style={{
                        marginLeft: '12px',
                        padding: '8px 16px',
                        background: '#059669',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}
                    >
                      Learn
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// Spells organized by school dropdown component
function SpellsBySchool({ engine, characterId }: { engine: WorldEngine; characterId: string }) {
  const [openSchools, setOpenSchools] = useState<Set<string>>(new Set());

  const character = engine.getCharacter(characterId);
  const spellsBySchool = useMemo(() => {
    if (!character) return {};

    try {
      const available = engine.getAvailableMagicalSpellsForCharacter(characterId).filter(
        spell => !character.knownSpells.includes(spell.name)
      );

      const grouped: Record<string, any[]> = {};
      available.forEach(spell => {
        if (!grouped[spell.school]) {
          grouped[spell.school] = [];
        }
        grouped[spell.school].push(spell);
      });

      return grouped;
    } catch (error) {
      console.error('Error loading spells:', error);
      return {};
    }
  }, [character?.level, JSON.stringify(character?.stats), JSON.stringify(character?.knownSpells), characterId]);

  if (!character) {
    return (
      <div style={{ fontSize: '14px', color: '#ef4444' }}>
        Character not found.
      </div>
    );
  }

  const toggleSchool = (school: string) => {
    const newOpen = new Set(openSchools);
    if (newOpen.has(school)) {
      newOpen.delete(school);
    } else {
      newOpen.add(school);
    }
    setOpenSchools(newOpen);
  };

  const schools = Object.keys(spellsBySchool).sort();

  if (schools.length === 0) {
    return (
      <div style={{ fontSize: '14px', color: '#94a3b8', fontStyle: 'italic' }}>
        No new magical spells available.
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gap: '8px' }}>
    </div>
  );
}

// Character Creation Form Component
function CharacterCreationForm({ engine }: { engine: WorldEngine }) {
  const [formData, setFormData] = useState({
    name: '',
    gender: 'Female',
    species: 'Human',
    archetype: 'Greenwarden',
    background: 'Commoner',
    level: 1,
    stats: {
      strength: 10,
      dexterity: 10,
      constitution: 10,
      intelligence: 10,
      wisdom: 10,
      charisma: 10
    },
    traits: [] as string[]
  });

  const [availablePoints, setAvailablePoints] = useState(27); // Point-buy system
  const [selectedTraits, setSelectedTraits] = useState<string[]>([]);

  // Get species information
  const speciesInfo = SPECIES_TRAIT_RULES[formData.species as keyof typeof SPECIES_TRAIT_RULES];

  const handleStatChange = (stat: keyof typeof formData.stats, value: number) => {
    const oldValue = formData.stats[stat];
    const cost = calculateStatCost(value) - calculateStatCost(oldValue);

    if (availablePoints - cost >= 0 && value >= 8 && value <= 20) {
      setFormData(prev => ({
        ...prev,
        stats: { ...prev.stats, [stat]: value }
      }));
      setAvailablePoints(prev => prev - cost);
    }
  };

  const getStatCost = (value: number): number => {
    // Use the same cost calculation as calculateStatCost for consistency
    return calculateStatCost(value);
  };

  const handleAddTrait = (trait: string) => {
    if (!selectedTraits.includes(trait)) {
      setSelectedTraits(prev => [...prev, trait]);
    }
  };

  const handleRemoveTrait = (trait: string) => {
    setFormData(prev => ({
      ...prev,
      traits: prev.traits.filter(t => t !== trait)
    }));
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      alert('Please enter a character name.');
      return;
    }

    const character = engine.addCharacter({
      name: formData.name.trim(),
      gender: formData.gender,
      species: formData.species,
      archetype: formData.archetype,
      background: formData.background,
      level: formData.level,
      experience: 0,
      stats: formData.stats,
      traits: formData.traits
    });

    alert(`${character.name} has been added to your party!`);

    // Reset form
    setFormData({
      name: '',
      gender: 'Female',
      species: 'Human',
      archetype: 'Fighter',
      background: 'Commoner',
      level: 1,
      stats: {
        strength: 10,
        dexterity: 10,
        constitution: 10,
        intelligence: 10,
        wisdom: 10,
        charisma: 10
      },
      traits: []
    });
    setAvailablePoints(27);
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
      {/* Basic Information */}
      <div style={{
        background: 'rgba(59, 130, 246, 0.1)',
        border: '1px solid rgba(59, 130, 246, 0.3)',
        borderRadius: '8px',
        padding: '20px'
      }}>
        <h4 style={{
          margin: '0 0 16px 0',
          color: '#60a5fa',
          borderBottom: '2px solid #60a5fa',
          paddingBottom: '8px'
        }}>
          📋 Basic Information
        </h4>

        <div style={{ display: 'grid', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '4px' }}>
              Character Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter character name..."
              style={{
                width: '100%',
                padding: '8px 12px',
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid #374151',
                borderRadius: '6px',
                color: '#f9fafb',
                fontSize: '14px'
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '4px' }}>
                Gender
              </label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid #374151',
                  borderRadius: '6px',
                  color: '#f9fafb',
                  fontSize: '14px'
                }}
              >
                {GENDER_OPTIONS.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '4px' }}>
                Level
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={formData.level}
                onChange={(e) => setFormData(prev => ({ ...prev, level: parseInt(e.target.value) || 1 }))}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid #374151',
                  borderRadius: '6px',
                  color: '#f9fafb',
                  fontSize: '14px'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '4px' }}>
                Species
              </label>
              <select
                value={formData.species}
                onChange={(e) => setFormData(prev => ({ ...prev, species: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid #374151',
                  borderRadius: '6px',
                  color: '#f9fafb',
                  fontSize: '14px'
                }}
              >
                {SPECIES_OPTIONS.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
              {/* Display racial modifiers */}
              {formData.species && RACIAL_MODIFIERS[formData.species] && (
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
                  Racial modifiers: {Object.entries(RACIAL_MODIFIERS[formData.species]).map(([stat, bonus]) =>
                    `${stat} ${bonus! > 0 ? '+' : ''}${bonus}`
                  ).join(", ")}
                </div>
              )}
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '4px' }}>
                Class
              </label>
              <select
                value={formData.archetype}
                onChange={(e) => setFormData(prev => ({ ...prev, archetype: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid #374151',
                  borderRadius: '6px',
                  color: '#f9fafb',
                  fontSize: '14px'
                }}
              >
                {CLASS_OPTIONS.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
              {/* Display class modifiers */}
              {formData.archetype && CLASS_MODIFIERS[formData.archetype] && (
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
                  Class modifiers: {Object.entries(CLASS_MODIFIERS[formData.archetype]).map(([stat, bonus]) =>
                    `${stat} ${bonus! > 0 ? '+' : ''}${bonus}`
                  ).filter(str => !str.includes(' 0')).join(", ") || 'None'}
                </div>
              )}
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '4px' }}>
                Background
              </label>
              <select
                value={formData.background}
                onChange={(e) => setFormData(prev => ({ ...prev, background: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid #374151',
                  borderRadius: '6px',
                  color: '#f9fafb',
                  fontSize: '14px'
                }}
              >
                {BACKGROUND_OPTIONS.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Ability Scores */}
      <div style={{
        background: 'rgba(34, 197, 94, 0.1)',
        border: '1px solid rgba(34, 197, 94, 0.3)',
        borderRadius: '8px',
        padding: '20px'
      }}>
        <h4 style={{
          margin: '0 0 16px 0',
          color: '#4ade80',
          borderBottom: '2px solid #4ade80',
          paddingBottom: '8px'
        }}>
          ⚡ Ability Scores
        </h4>

        <div style={{ marginBottom: '16px', fontSize: '12px', color: '#cbd5e1' }}>
          Points Available: <strong style={{ color: availablePoints > 0 ? '#4ade80' : '#ef4444' }}>
            {availablePoints}
          </strong>
        </div>

        <div style={{ marginBottom: '12px', fontSize: '11px', color: '#94a3b8', lineHeight: '1.4' }}>
          <strong>Point Cost:</strong> 8-14 (1 point each), 15-16 (2 points each), 17-20 (3 points each)
        </div>

        <div style={{ display: 'grid', gap: '8px' }}>
          {Object.entries(formData.stats).map(([stat, value]) => (
            <div key={stat} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '80px', fontSize: '13px', color: '#e2e8f0', textTransform: 'capitalize' }}>
                {stat.slice(0, 3).toUpperCase()}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={() => handleStatChange(stat as keyof typeof formData.stats, value - 1)}
                  disabled={value <= 8}
                  style={{
                    width: '24px',
                    height: '24px',
                    background: value > 8 ? '#374151' : '#1f2937',
                    color: value > 8 ? '#f9fafb' : '#6b7280',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: value > 8 ? 'pointer' : 'not-allowed',
                    fontSize: '14px'
                  }}
                >
                  −
                </button>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '60px' }}>
                  <div style={{
                    fontSize: '16px',
                    fontWeight: 'bold',
                    color: '#f9fafb'
                  }}>
                    {value}
                  </div>
                  {(() => {
                    const finalStat = getFinalStat(value, stat as Stats, formData.species, formData.archetype);
                    const modifier = abilityMod(finalStat);
                    return finalStat !== value ? (
                      <div style={{ fontSize: '12px', color: finalStat > value ? '#4ade80' : '#f87171' }}>
                        {finalStat} ({modifier >= 0 ? '+' : ''}{modifier})
                      </div>
                    ) : (
                      <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                        ({modifier >= 0 ? '+' : ''}{modifier})
                      </div>
                    );
                  })()}
                </div>
                <button
                  onClick={() => handleStatChange(stat as keyof typeof formData.stats, value + 1)}
                  disabled={value >= 20 || availablePoints - (getStatCost(value + 1) - getStatCost(value)) < 0}
                  style={{
                    width: '24px',
                    height: '24px',
                    background: (value < 20 && availablePoints - (getStatCost(value + 1) - getStatCost(value)) >= 0) ? '#374151' : '#1f2937',
                    color: (value < 20 && availablePoints - (getStatCost(value + 1) - getStatCost(value)) >= 0) ? '#f9fafb' : '#6b7280',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: (value < 20 && availablePoints - (getStatCost(value + 1) - getStatCost(value)) >= 0) ? 'pointer' : 'not-allowed',
                    fontSize: '14px'
                  }}
                >
                  +
                </button>
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                <div>Cost: {getStatCost(value)}</div>
                {(() => {
                  // Map long form to short form
                  const statMap: Record<string, Stats> = {
                    'strength': 'STR',
                    'dexterity': 'DEX',
                    'constitution': 'CON',
                    'intelligence': 'INT',
                    'wisdom': 'WIS',
                    'charisma': 'CHA'
                  };
                  const statKey = statMap[stat];
                  const bonusText = getBonusText(statKey, formData.species, formData.archetype);
                  return bonusText ? <div style={{ fontSize: '10px', color: '#6b7280' }}>{bonusText}</div> : null;
                })()}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Character Preview Section */}
      <div style={{
        marginBottom: '20px',
        padding: '15px',
        background: 'rgba(55, 65, 81, 0.3)',
        borderRadius: '8px',
        border: '1px solid #374151'
      }}>
        <h4 style={{
          margin: '0 0 15px 0',
          color: '#f9fafb',
          fontSize: '16px',
          borderBottom: '2px solid #374151',
          paddingBottom: '8px'
        }}>
          🎭 Character Preview
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '15px' }}>
          {/* Final Stats */}
          <div>
            <h5 style={{ margin: '0 0 10px 0', color: '#d1d5db', fontSize: '14px', fontWeight: 'bold' }}>Final Stats</h5>
            {Object.entries(formData.stats).map(([stat, value]) => {
              // Map long form to short form
              const statMap: Record<string, Stats> = {
                'strength': 'STR',
                'dexterity': 'DEX',
                'constitution': 'CON',
                'intelligence': 'INT',
                'wisdom': 'WIS',
                'charisma': 'CHA'
              };

              const statKey = statMap[stat];
              const finalStat = getFinalStat(value, statKey, formData.species, formData.archetype);
              const modifier = abilityMod(finalStat);
              return (
                <div key={stat} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '12px',
                  color: '#d1d5db',
                  marginBottom: '2px'
                }}>
                  <span>{statKey}</span>
                  <span style={{ color: finalStat !== value ? '#4ade80' : '#f9fafb' }}>
                    {finalStat} ({modifier >= 0 ? '+' : ''}{modifier})
                  </span>
                </div>
              );
            })}
          </div>

          {/* HP and AC */}
          <div>
            <h5 style={{ margin: '0 0 10px 0', color: '#d1d5db', fontSize: '14px', fontWeight: 'bold' }}>Combat Stats</h5>
            {(() => {
              // Convert formData.stats to Stats format
              const statsForCalc: Record<Stats, number> = {
                STR: formData.stats.strength,
                DEX: formData.stats.dexterity,
                CON: formData.stats.constitution,
                INT: formData.stats.intelligence,
                WIS: formData.stats.wisdom,
                CHA: formData.stats.charisma
              };

              // Get all traits (automatic + selected)
              const allTraits = [...(speciesInfo?.automatic || []), ...selectedTraits];

              const { hp, ac } = calculateHPAndAC(statsForCalc, formData.species, formData.archetype, formData.level, allTraits);
              const conMod = abilityMod(getFinalStat(formData.stats.constitution, 'CON', formData.species, formData.archetype));
              const dexMod = abilityMod(getFinalStat(formData.stats.dexterity, 'DEX', formData.species, formData.archetype));

              return (
                <>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '12px',
                    color: '#d1d5db',
                    marginBottom: '2px'
                  }}>
                    <span>HP</span>
                    <span style={{ color: '#ef4444' }}>{hp}</span>
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '10px',
                    color: '#9ca3af',
                    marginLeft: '10px',
                    marginBottom: '4px'
                  }}>
                    <span>Base: 10 + CON mod</span>
                    <span>10 + {conMod >= 0 ? '+' : ''}{conMod}</span>
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '12px',
                    color: '#d1d5db',
                    marginBottom: '2px'
                  }}>
                    <span>AC</span>
                    <span style={{ color: '#3b82f6' }}>{ac}</span>
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '10px',
                    color: '#9ca3af',
                    marginLeft: '10px'
                  }}>
                    <span>Base: 10 + DEX mod</span>
                    <span>10 + {dexMod >= 0 ? '+' : ''}{dexMod}</span>
                  </div>
                </>
              );
            })()}
          </div>

          {/* Point Summary */}
          <div>
            <h5 style={{ margin: '0 0 10px 0', color: '#d1d5db', fontSize: '14px', fontWeight: 'bold' }}>Point Buy</h5>
            {(() => {
              const totalPointsUsed = Object.values(formData.stats).reduce((sum, value) => sum + getStatCost(value), 0);
              return (
                <>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '12px',
                    color: availablePoints === 0 ? '#4ade80' : availablePoints > 0 ? '#fbbf24' : '#ef4444',
                    marginBottom: '2px'
                  }}>
                    <span>Available</span>
                    <span>{availablePoints}</span>
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '12px',
                    color: '#d1d5db'
                  }}>
                    <span>Used</span>
                    <span>{totalPointsUsed}</span>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Traits */}
      <div style={{
        background: 'rgba(168, 85, 247, 0.1)',
        border: '1px solid rgba(168, 85, 247, 0.3)',
        borderRadius: '8px',
        padding: '20px'
      }}>
        <h4 style={{
          margin: '0 0 16px 0',
          color: '#a855f7',
          borderBottom: '2px solid #a855f7',
          paddingBottom: '8px'
        }}>
          ✨ Character Traits <small style={{ opacity: 0.7, fontSize: '12px' }}>(choose up to {MAX_TRAITS})</small>
        </h4>

        {speciesInfo && (
          <div style={{ marginBottom: '16px' }}>
            {speciesInfo.automatic.length > 0 && (
              <div style={{ marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', color: '#10b981', fontWeight: 'bold' }}>Automatic Traits: </span>
                {speciesInfo.automatic.join(', ')}
              </div>
            )}
            {speciesInfo.forbidden.length > 0 && (
              <div style={{ marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', color: '#ef4444', fontWeight: 'bold' }}>Forbidden Traits: </span>
                {speciesInfo.forbidden.join(', ')}
              </div>
            )}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
          {TRAIT_CATALOG.map(trait => {
            const traitInfo = TRAIT_DEFINITIONS[trait as keyof typeof TRAIT_DEFINITIONS];
            const isSelected = selectedTraits.includes(trait);
            const isAutomatic = speciesInfo?.automatic.includes(trait);
            const isForbidden = speciesInfo?.forbidden.includes(trait);
            const isPreferred = speciesInfo?.preferred.includes(trait);
            const isDisabled = (!isSelected && selectedTraits.length >= MAX_TRAITS) || isForbidden;

            return (
              <div
                key={trait}
                onClick={() => {
                  if (!isAutomatic && !isForbidden && !isDisabled) {
                    if (isSelected) {
                      setSelectedTraits(prev => prev.filter(t => t !== trait));
                    } else if (selectedTraits.length < MAX_TRAITS) {
                      setSelectedTraits(prev => [...prev, trait]);
                    }
                  }
                }}
                style={{
                  padding: '8px',
                  borderRadius: '6px',
                  cursor: (isAutomatic || isForbidden || isDisabled) ? 'not-allowed' : 'pointer',
                  border: '1px solid',
                  borderColor: isAutomatic ? '#10b981' : isForbidden ? '#ef4444' : isSelected ? '#a855f7' : isPreferred ? '#06b6d4' : '#4b5563',
                  background: isAutomatic ? 'rgba(16, 185, 129, 0.2)' : isForbidden ? 'rgba(239, 68, 68, 0.2)' : isSelected ? 'rgba(168, 85, 247, 0.2)' : isPreferred ? 'rgba(6, 182, 212, 0.1)' : 'rgba(75, 85, 99, 0.1)',
                  opacity: (isForbidden || isDisabled) ? 0.5 : 1
                }}
              >
                <div style={{ fontSize: '14px', fontWeight: 'bold', color: isAutomatic ? '#10b981' : isForbidden ? '#ef4444' : isSelected ? '#a855f7' : '#e2e8f0', marginBottom: '4px' }}>
                  {trait}
                  {isAutomatic && ' (Auto)'}
                  {isForbidden && ' (Forbidden)'}
                  {isPreferred && ' (Preferred)'}
                </div>
                <div style={{ fontSize: '12px', color: '#94a3b8', lineHeight: '1.3' }}>
                  {traitInfo.description}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: '16px' }}>
          <div style={{ fontSize: '14px', color: '#e2e8f0', marginBottom: '8px' }}>
            Selected Traits ({selectedTraits.length}/{MAX_TRAITS}): {[...(speciesInfo?.automatic || []), ...selectedTraits].join(', ') || 'None'}
          </div>
        </div>
      </div>

      {/* Character Preview */}
      {formData.name && (
        <div style={{
          gridColumn: '1 / -1',
          background: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: '8px',
          padding: '20px'
        }}>
          <h4 style={{
            margin: '0 0 16px 0',
            color: '#10b981',
            borderBottom: '2px solid #10b981',
            paddingBottom: '8px'
          }}>
            🌟 Character Preview
          </h4>

          {(() => {
            // Convert formData stats to the format expected by calculateHPAndAC
            const statsForCalc: Record<Stats, number> = {
              STR: formData.stats.strength,
              DEX: formData.stats.dexterity,
              CON: formData.stats.constitution,
              INT: formData.stats.intelligence,
              WIS: formData.stats.wisdom,
              CHA: formData.stats.charisma
            };

            const allTraits = [...(speciesInfo?.automatic || []), ...selectedTraits];
            const calculated = calculateHPAndAC(statsForCalc, formData.species, formData.archetype, formData.level, allTraits);

            return (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
                <div>
                  <h5 style={{ color: '#e2e8f0', marginBottom: '12px' }}>Basic Info</h5>
                  <div style={{ fontSize: '14px', color: '#cbd5e1', lineHeight: '1.6' }}>
                    <div><strong>{formData.name}</strong> ({formData.gender})</div>
                    <div>{formData.species} {formData.archetype}</div>
                    <div>Level {formData.level} {formData.background}</div>
                  </div>
                </div>

                <div>
                  <h5 style={{ color: '#e2e8f0', marginBottom: '12px' }}>Combat Stats</h5>
                  <div style={{ fontSize: '14px', color: '#cbd5e1', lineHeight: '1.6' }}>
                    <div><strong>Hit Points:</strong> {calculated.hp}</div>
                    <div><strong>Armor Class:</strong> {calculated.ac}</div>
                    <div><strong>Carrying Capacity:</strong> {calculated.carry} lbs</div>
                    {calculated.naturalACBonus > 0 && (
                      <div style={{ fontSize: '12px', opacity: 0.7 }}>
                        +{calculated.naturalACBonus} natural AC bonus
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h5 style={{ color: '#e2e8f0', marginBottom: '12px' }}>Ability Scores</h5>
                  <div style={{ fontSize: '14px', color: '#cbd5e1', lineHeight: '1.6', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '4px' }}>
                    <div><strong>STR:</strong> {statsForCalc.STR} ({abilityMod(statsForCalc.STR) >= 0 ? '+' : ''}{abilityMod(statsForCalc.STR)})</div>
                    <div><strong>DEX:</strong> {statsForCalc.DEX} ({abilityMod(statsForCalc.DEX) >= 0 ? '+' : ''}{abilityMod(statsForCalc.DEX)})</div>
                    <div><strong>CON:</strong> {statsForCalc.CON} ({abilityMod(statsForCalc.CON) >= 0 ? '+' : ''}{abilityMod(statsForCalc.CON)})</div>
                    <div><strong>INT:</strong> {statsForCalc.INT} ({abilityMod(statsForCalc.INT) >= 0 ? '+' : ''}{abilityMod(statsForCalc.INT)})</div>
                    <div><strong>WIS:</strong> {statsForCalc.WIS} ({abilityMod(statsForCalc.WIS) >= 0 ? '+' : ''}{abilityMod(statsForCalc.WIS)})</div>
                    <div><strong>CHA:</strong> {statsForCalc.CHA} ({abilityMod(statsForCalc.CHA) >= 0 ? '+' : ''}{abilityMod(statsForCalc.CHA)})</div>
                  </div>
                </div>

                <div>
                  <h5 style={{ color: '#e2e8f0', marginBottom: '12px' }}>Traits</h5>
                  <div style={{ fontSize: '14px', color: '#cbd5e1', lineHeight: '1.6' }}>
                    {allTraits.length > 0 ? allTraits.join(', ') : 'None'}
                  </div>
                  <div style={{ fontSize: '12px', marginTop: '8px' }}>
                    <div style={{ color: '#10b981' }}>HP per level: +{calculated.totalHPPerLevel}</div>
                    <div style={{ color: '#94a3b8' }}>
                      (Base: +{1 + Math.max(0, abilityMod(statsForCalc.CON))},
                      Class: +{calculated.classHPBonus},
                      Race: {calculated.raceHPBonus >= 0 ? '+' : ''}{calculated.raceHPBonus},
                      Traits: {calculated.traitHPBonus >= 0 ? '+' : ''}{calculated.traitHPBonus})
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Create Button */}
      <div style={{
        gridColumn: '1 / -1',
        display: 'flex',
        justifyContent: 'center',
        marginTop: '20px'
      }}>
        <button
          onClick={handleSubmit}
          disabled={!formData.name.trim()}
          style={{
            padding: '16px 32px',
            background: !formData.name.trim() ? '#374151' : '#059669',
            color: '#f9fafb',
            border: 'none',
            borderRadius: '8px',
            cursor: !formData.name.trim() ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            fontWeight: 'bold',
            transition: 'all 0.2s'
          }}
        >
          🎉 Create Character {availablePoints > 0 ? `(${availablePoints} points remaining)` : ''}
        </button>
      </div>
    </div>
  );
}