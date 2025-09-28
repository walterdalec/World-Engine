// src/components/CharacterCreate.tsx
import React, { useMemo, useState } from "react";
import { CLASS_DEFINITIONS } from '../defaultWorlds';
// Visual System Integration
import { PortraitPreview, VisualUtils, bindPortraitToCharacter, generateCharacterPortrait } from '../visuals';
import type { CharacterVisualData } from '../visuals';

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
  level?: number;
  knownSpells?: string[]; // Array of spell IDs
  knownCantrips?: string[]; // Array of cantrip IDs
};

const DEFAULT_STATS: Record<Stats, number> = {
  STR: 8, DEX: 8, CON: 8, INT: 8, WIS: 8, CHA: 8,
};

// Spell limitation calculations
function calculateMaxCantrips(level: number, intScore: number, wisScore: number): number {
  const baseCantrips = Math.floor(level / 2) + 1; // 1 at level 1, 2 at level 3, 3 at level 5, etc.
  const abilityBonus = Math.floor((Math.max(intScore, wisScore) - 10) / 2);
  return Math.max(1, baseCantrips + Math.max(0, abilityBonus));
}

function calculateMaxSpells(level: number, intScore: number, wisScore: number): number {
  if (level < 2) return 0; // No spells until level 2

  const baseSpells = Math.max(0, level - 1); // 1 at level 2, 2 at level 3, etc.
  const abilityBonus = Math.floor((Math.max(intScore, wisScore) - 12) / 2); // Bonus starts at 13+ ability score
  return Math.max(0, baseSpells + Math.max(0, abilityBonus));
}

function calculateMaxSpellLevel(level: number): number {
  if (level < 2) return 0; // No spells until level 2
  if (level < 4) return 1;  // 1st level spells at levels 2-3
  if (level < 6) return 2;  // 2nd level spells at levels 4-5
  if (level < 8) return 3;  // 3rd level spells at levels 6-7
  if (level < 10) return 4; // 4th level spells at levels 8-9
  if (level < 12) return 5; // 5th level spells at levels 10-11
  if (level < 14) return 6; // 6th level spells at levels 12-13
  if (level < 16) return 7; // 7th level spells at levels 14-15
  if (level < 18) return 8; // 8th level spells at levels 16-17
  return 9;                 // 9th level spells at levels 18+
}

function getSpellcastingClass(archetype: string): 'wizard' | 'cleric' | 'mixed' | 'none' {
  const wizardTypes = ['wizard', 'sorcerer', 'warlock'];
  const clericTypes = ['cleric', 'druid', 'ranger', 'paladin'];

  if (wizardTypes.includes(archetype.toLowerCase())) return 'wizard'; // INT-based
  if (clericTypes.includes(archetype.toLowerCase())) return 'cleric';  // WIS-based
  if (['bard'].includes(archetype.toLowerCase())) return 'mixed';      // Either INT or WIS
  return 'none';
}

// Comprehensive trait system with mechanical benefits
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

// Species trait restrictions and bonuses
const SPECIES_TRAIT_RULES: Record<string, {
  automatic: string[];
  forbidden: string[];
  preferred: string[];
  description: string;
}> = {
  "Human": {
    automatic: [], // Humans get no automatic traits - they're flexible
    forbidden: [], // Humans can choose any trait
    preferred: ["Brave", "Clever", "Silver Tongue"], // But these suit their adaptable nature
    description: "Adaptable and versatile, humans can develop any traits through experience."
  },
  "Sylvanborn": {
    automatic: ["Nature's Friend"], // Always connected to nature
    forbidden: ["Cunning"], // Too honest and straightforward for deception
    preferred: ["Observant", "Keen Senses", "Patient"],
    description: "Forest dwellers with an innate connection to nature."
  },
  "Alloy": {
    automatic: ["Iron Will"], // Constructed beings have strong mental defenses
    forbidden: ["Empathic", "Silver Tongue"], // Struggle with emotional connections
    preferred: ["Stoic", "Patient", "Clever"],
    description: "Mechanical beings with logical minds but limited emotional range."
  },
  "Draketh": {
    automatic: ["Brave"], // Draconic heritage makes them naturally fearless
    forbidden: ["Patient"], // Too hot-blooded for patience
    preferred: ["Swift", "Silver Tongue", "Stoic"],
    description: "Proud dragon-descendants who rarely back down from challenges."
  },
  "Voidkin": {
    automatic: ["Observant"], // Always aware of hidden truths
    forbidden: ["Nature's Friend"], // Void energy conflicts with natural forces
    preferred: ["Clever", "Iron Will", "Cunning"],
    description: "Shadow-touched beings with enhanced perception but unnatural aura."
  },
  "Crystalborn": {
    automatic: ["Stoic"], // Crystal nature makes them emotionally stable
    forbidden: ["Swift"], // Crystalline bodies are less agile
    preferred: ["Iron Will", "Patient", "Keen Senses"],
    description: "Living crystal beings with incredible mental fortitude."
  },
  "Stormcaller": {
    automatic: ["Swift"], // Storm magic enhances their speed
    forbidden: ["Patient"], // Storm energy makes them restless
    preferred: ["Brave", "Observant", "Silver Tongue"],
    description: "Sky-born people infused with elemental storm energy."
  }
};

// Class trait restrictions and bonuses
const CLASS_TRAIT_RULES: Record<string, {
  automatic: string[];
  forbidden: string[];
  preferred: string[];
  description: string;
}> = {
  "Greenwarden": {
    automatic: ["Nature's Friend"],
    forbidden: [],
    preferred: ["Patient", "Observant", "Empathic"],
    description: "Nature's guardians with deep environmental connections."
  },
  "Thorn Knight": {
    automatic: ["Brave"],
    forbidden: ["Cunning"],
    preferred: ["Stoic", "Iron Will", "Swift"],
    description: "Honorable warriors who face threats head-on."
  },
  "Sapling Adept": {
    automatic: ["Patient"],
    forbidden: [],
    preferred: ["Clever", "Observant", "Nature's Friend"],
    description: "Scholarly nature mages who study growth and renewal."
  },
  "Bloom Caller": {
    automatic: ["Empathic"],
    forbidden: [],
    preferred: ["Silver Tongue", "Nature's Friend", "Patient"],
    description: "Charismatic druids who inspire growth and healing."
  },
  "Dust Warden": {
    automatic: ["Stoic"],
    forbidden: ["Empathic"],
    preferred: ["Brave", "Iron Will", "Observant"],
    description: "Ash-realm guardians hardened by harsh environments."
  },
  "Cindermage": {
    automatic: ["Clever"],
    forbidden: [],
    preferred: ["Iron Will", "Patient", "Observant"],
    description: "Fire scholars who manipulate destructive forces."
  },
  "Ash Walker": {
    automatic: ["Swift"],
    forbidden: ["Patient"],
    preferred: ["Observant", "Cunning", "Keen Senses"],
    description: "Desert scouts who move quickly through dangerous terrain."
  },
  "Ember Knight": {
    automatic: ["Brave"],
    forbidden: ["Cunning"],
    preferred: ["Silver Tongue", "Stoic", "Iron Will"],
    description: "Noble flame warriors with strong moral codes."
  },
  "Storm Herald": {
    automatic: ["Silver Tongue"],
    forbidden: [],
    preferred: ["Swift", "Brave", "Observant"],
    description: "Sky leaders who command through charisma and storm power."
  },
  "Wind Sage": {
    automatic: ["Keen Senses"],
    forbidden: [],
    preferred: ["Clever", "Patient", "Iron Will"],
    description: "Aerial mystics with enhanced perception and wisdom."
  },
  "Cloud Walker": {
    automatic: ["Swift"],
    forbidden: ["Stoic"],
    preferred: ["Observant", "Lucky", "Silver Tongue"],
    description: "Agile sky dancers who embrace freedom and movement."
  },
  "Sky Guardian": {
    automatic: ["Brave"],
    forbidden: [],
    preferred: ["Iron Will", "Stoic", "Observant"],
    description: "Stalwart defenders of the aerial realms."
  }
};

const SPECIES_OPTIONS = [
  "Human", "Sylvanborn", "Alloy", "Draketh", "Voidkin", "Crystalborn", "Stormcaller"
];

const PRONOUN_OPTIONS = [
  "she/her",
  "he/him",
  "they/them",
  "xe/xir",
  "ze/hir",
  "fae/faer"
];

const ARCHETYPE_OPTIONS = [
  "Ranger", "Artificer", "Mystic", "Guardian", "Scholar", "Rogue", "Warrior", "Healer"
];

const CLASS_OPTIONS = Object.keys(CLASS_DEFINITIONS);

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

const MAX_TRAITS = 2;

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
  if (racialBonus < 0) text += ` ${racialBonus} racial`;
  if (classBonus > 0) text += ` +${classBonus} class`;
  if (classBonus < 0) text += ` ${classBonus} class`;

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
    level: 1,
    knownSpells: [],
    knownCantrips: [],
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

  // Get trait mechanical benefits for display
  function getTraitBenefits(character: Character): string[] {
    return character.traits.map(traitName => {
      const trait = TRAIT_DEFINITIONS[traitName as keyof typeof TRAIT_DEFINITIONS];
      if (!trait) return `${traitName}: Unknown effect`;
      return `${trait.name}: ${trait.description}`;
    });
  }

  // Get automatic traits for current species and class
  function getAutomaticTraits(): string[] {
    const automatic = new Set<string>();

    // Add species automatic traits
    if (char.species) {
      const speciesRules = SPECIES_TRAIT_RULES[char.species as keyof typeof SPECIES_TRAIT_RULES];
      if (speciesRules) {
        speciesRules.automatic.forEach(trait => automatic.add(trait));
      }
    }

    // Add class automatic traits
    if (char.archetype) {
      const classRules = CLASS_TRAIT_RULES[char.archetype as keyof typeof CLASS_TRAIT_RULES];
      if (classRules) {
        classRules.automatic.forEach(trait => automatic.add(trait));
      }
    }

    return Array.from(automatic);
  }

  // Check if a trait is forbidden for current species/class
  function isTraitForbidden(traitName: string): boolean {
    // Check species restrictions
    if (char.species) {
      const speciesRules = SPECIES_TRAIT_RULES[char.species as keyof typeof SPECIES_TRAIT_RULES];
      if (speciesRules?.forbidden && speciesRules.forbidden.includes(traitName)) {
        return true;
      }
    }

    // Check class restrictions
    if (char.archetype) {
      const classRules = CLASS_TRAIT_RULES[char.archetype as keyof typeof CLASS_TRAIT_RULES];
      if (classRules?.forbidden && classRules.forbidden.includes(traitName)) {
        return true;
      }
    }

    return false;
  }

  // Check if a trait is preferred (helpful for UI hints)
  function isTraitPreferred(traitName: string): boolean {
    // Check species preferences
    if (char.species) {
      const speciesRules = SPECIES_TRAIT_RULES[char.species as keyof typeof SPECIES_TRAIT_RULES];
      if (speciesRules?.preferred && speciesRules.preferred.includes(traitName)) {
        return true;
      }
    }

    // Check class preferences
    if (char.archetype) {
      const classRules = CLASS_TRAIT_RULES[char.archetype as keyof typeof CLASS_TRAIT_RULES];
      if (classRules?.preferred && classRules.preferred.includes(traitName)) {
        return true;
      }
    }

    return false;
  }

  // Apply automatic traits when species or class changes
  React.useEffect(() => {
    const automaticTraits = getAutomaticTraits();
    const currentTraits = new Set(char.traits);
    let needsUpdate = false;

    // Add missing automatic traits
    automaticTraits.forEach(trait => {
      if (!currentTraits.has(trait)) {
        currentTraits.add(trait);
        needsUpdate = true;
      }
    });

    // Remove forbidden traits
    Array.from(currentTraits).forEach(trait => {
      if (isTraitForbidden(trait)) {
        currentTraits.delete(trait);
        needsUpdate = true;
      }
    });

    if (needsUpdate) {
      setChar(c => ({ ...c, traits: Array.from(currentTraits) }));
    }
  }, [char.species, char.archetype]);

  function toggleTrait(t: string) {
    setChar((c) => {
      const has = c.traits.includes(t);
      if (has) return { ...c, traits: c.traits.filter((x) => x !== t) };
      if (c.traits.length >= MAX_TRAITS) return c;
      return { ...c, traits: [...c.traits, t] };
    });
  }

  async function saveCharacter() {
    if (!char.name.trim()) {
      alert("Give your character a name before saving.");
      return;
    }

    try {
      // Create snapshot with portrait binding
      const characterWithPortrait = { ...char, createdAt: new Date().toISOString() };
      await bindPortraitToCharacter(characterWithPortrait, {
        body: "standard",
        palette: "Rootspeakers",
        size: { width: 300, height: 380 }
      });

      localStorage.setItem("we:lastCharacter", JSON.stringify(characterWithPortrait));
      download(`${char.name.replace(/\s+/g, "_")}.json`, characterWithPortrait);
    } catch (error) {
      console.error('Error saving character with portrait:', error);
      // Fallback to saving without portrait
      const payload = { ...char, createdAt: new Date().toISOString() };
      localStorage.setItem("we:lastCharacter", JSON.stringify(payload));
      download(`${char.name.replace(/\s+/g, "_")}.json`, payload);
    }
  }

  // Finalize character with portrait binding (from patch example)
  async function finalizeCharacter(character: any) {
    await bindPortraitToCharacter(character, {
      body: "standard",
      palette: "Rootspeakers", // Could be mapped from species/archetype
      size: { width: 300, height: 380 }
    });
    // now character.portraitUrl contains the generated portrait PNG data URL
    return character;
  }

  async function saveToLibrary() {
    if (!char.name.trim()) {
      alert("Give your character a name before saving.");
      return;
    }

    console.log("Saving character to library:", char);

    try {
      // Finalize character with auto-generated portrait (following patch example)
      const finalizedCharacter = await finalizeCharacter({ ...char });

      // Get existing character library
      const existingCharacters = JSON.parse(localStorage.getItem('world-engine-characters') || '[]');
      console.log("Existing characters:", existingCharacters);

      // Create character data for library
      const characterData = {
        id: `char-${Date.now()}`,
        name: finalizedCharacter.name,
        race: finalizedCharacter.species,
        characterClass: finalizedCharacter.archetype,
        level: finalizedCharacter.level || 1,
        createdAt: new Date().toISOString(),
        data: { ...finalizedCharacter, createdAt: new Date().toISOString() }
      };

      console.log("Character data to save:", characterData);

      // Add to library
      existingCharacters.push(characterData);
      localStorage.setItem('world-engine-characters', JSON.stringify(existingCharacters));
      // Create backup
      localStorage.setItem('world-engine-characters-backup', JSON.stringify(existingCharacters));
      console.log("Saved to localStorage, total characters:", existingCharacters.length);

      alert(`${char.name} has been saved to your character library!`);
    } catch (error) {
      console.error('Error saving to library:', error);
      alert('Error saving character to library.');
    }
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
    const lvl = char.level || 1;
    const finalCON = getFinalStat(char.stats.CON, "CON", char.species, char.archetype);
    const finalSTR = getFinalStat(char.stats.STR, "STR", char.species, char.archetype);
    const finalDEX = getFinalStat(char.stats.DEX, "DEX", char.species, char.archetype);

    // Calculate HP with class and race modifiers
    let baseHP = 10; // Starting HP
    let hpPerLevel = abilityMod(finalCON); // Base CON modifier per level

    // Class-based HP per level modifiers
    let classHPBonus = 0;
    if (char.archetype === "Thorn Knight" || char.archetype === "Crystal Guardian" || char.archetype === "Ironclad") {
      classHPBonus = 3; // Heavy warriors - lots of HP per level
    } else if (char.archetype === "Ashblade" || char.archetype === "Stormbreaker" || char.archetype === "Voidhunter") {
      classHPBonus = 2; // Medium warriors - good HP per level
    } else if (char.archetype === "Greenwarden" || char.archetype === "Guardian" || char.archetype === "Warrior") {
      classHPBonus = 2; // Defensive classes - good HP
    } else if (char.archetype === "Ranger" || char.archetype === "Rogue" || char.archetype === "Artificer" || char.archetype === "Healer") {
      classHPBonus = 1; // Medium classes - moderate HP
    } else if (char.archetype === "Bloomcaller" || char.archetype === "Mystic") {
      classHPBonus = 1; // Support classes - moderate HP
    } else {
      classHPBonus = 0; // Magic classes (Sapling Adept, Scholar, Storm Herald) - low HP
    }

    // Race-based HP modifiers
    let raceHPBonus = 0;
    if (char.species === "Alloy") {
      raceHPBonus = 2; // Metal-infused - very tough
    } else if (char.species === "Draketh") {
      raceHPBonus = 2; // Dragon heritage - naturally tough
    } else if (char.species === "Crystalborn") {
      raceHPBonus = 1; // Crystal-hard - somewhat tough
    } else if (char.species === "Human") {
      raceHPBonus = 1; // Adaptable - slightly above average
    } else if (char.species === "Voidkin") {
      raceHPBonus = 0; // Otherworldly - average toughness
    } else if (char.species === "Sylvanborn") {
      raceHPBonus = -1; // Graceful but fragile
    } else if (char.species === "Stormcaller") {
      raceHPBonus = 0; // Light and agile - average toughness
    }

    // Trait-based HP bonuses
    let traitHPBonus = 0;
    if (char.traits.includes("Resilient")) {
      traitHPBonus += 2; // Tough trait adds HP per level
    }
    if (char.traits.includes("Hardy")) {
      traitHPBonus += 1; // Another toughness trait
    }
    if (char.traits.includes("Frail")) {
      traitHPBonus -= 2; // Negative trait reduces HP
    }

    // Calculate total HP per level (minimum 1 per level)
    const totalHPPerLevel = Math.max(1, hpPerLevel + classHPBonus + raceHPBonus + traitHPBonus);

    // Calculate final HP
    const hp = baseHP + (totalHPPerLevel * (lvl - 1)); // Level 1 gets base HP, then add per level

    // Calculate AC with natural bonus (much more conservative)
    let naturalACBonus = 0;

    // Very small level bonus (+1 at level 8, +2 at level 16)
    if (lvl >= 16) naturalACBonus += 2;
    else if (lvl >= 8) naturalACBonus += 1;

    // Class-based bonus (combat training) - using actual class names
    const archetype = char.archetype;

    // Heavy combat classes - fighters and warriors (max +2 at level 20)
    if (archetype === "Thorn Knight" || archetype === "Ashblade" || archetype === "Ironclad" ||
      archetype === "Stormbreaker" || archetype === "Voidhunter" || archetype === "Crystal Guardian") {
      if (lvl >= 15) naturalACBonus += 2;
      else if (lvl >= 7) naturalACBonus += 1;
    }
    // Defensive specialists and guardians (max +1 at level 20)
    else if (archetype === "Greenwarden" || archetype === "Guardian" || archetype === "Warrior") {
      if (lvl >= 10) naturalACBonus += 1;
    }
    // Medium combat classes - some martial training (max +1 at high level)
    else if (archetype === "Ranger" || archetype === "Rogue" || archetype === "Artificer") {
      if (lvl >= 15) naturalACBonus += 1;
    }
    // Light combat and magic classes get no class bonus

    // Race-based bonus (natural toughness) - very small bonuses
    if (char.species === "Alloy") {
      if (lvl >= 12) naturalACBonus += 1; // Metal-infused body
    } else if (char.species === "Draketh") {
      if (lvl >= 15) naturalACBonus += 1; // Dragon heritage - tough scales
    } else if (char.species === "Crystalborn") {
      if (lvl >= 15) naturalACBonus += 1; // Crystal-hard skin
    }
    // Other races get no racial AC bonus

    // Hard cap at +5 total natural AC bonus
    naturalACBonus = Math.min(naturalACBonus, 5);

    const ac = 10 + abilityMod(finalDEX) + naturalACBonus;
    const carry = 15 * finalSTR;

    return { level: lvl, hp, ac, carry, naturalACBonus, totalHPPerLevel, classHPBonus, raceHPBonus, traitHPBonus };
  }, [char.stats, char.species, char.archetype, char.level, char.traits]);

  return (
    <div style={container}>
      {/* LEFT: form */}
      <div style={{ display: "grid", gap: 16 }}>
        <div style={card}>
          <h2 style={sectionTitle}>Identity</h2>
          <div style={{ display: "grid", gap: 8 }}>
            <TextRow label="Name" value={char.name} onChange={(v) => setField("name", v)} />
            <SelectRow label="Pronouns" value={char.pronouns} onChange={(v) => setField("pronouns", v)} options={PRONOUN_OPTIONS} />
            <SelectRow label="Species" value={char.species} onChange={(v) => setField("species", v)} options={SPECIES_OPTIONS} />
            {char.species && RACIAL_MODIFIERS[char.species] && (
              <div style={{ fontSize: 12, opacity: 0.7, marginTop: -4 }}>
                Racial modifiers: {Object.entries(RACIAL_MODIFIERS[char.species]).map(([stat, bonus]) =>
                  `${stat} ${bonus > 0 ? '+' : ''}${bonus}`
                ).join(", ")}
              </div>
            )}
            <SelectRow label="Class" value={char.archetype} onChange={(v) => setField("archetype", v)} options={CLASS_OPTIONS} />
            <div style={{ display: "grid", gap: 4 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>Level</span>
              </div>
              <input
                type="number"
                min="1"
                max="20"
                value={char.level || 1}
                onChange={(e) => setField("level", parseInt(e.target.value) || 1)}
                style={{
                  padding: "8px",
                  border: "1px solid #374151",
                  borderRadius: "4px",
                  background: "#1f2937",
                  color: "#f9fafb",
                  fontSize: "14px"
                }}
              />
            </div>
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

            {/* Portrait Information */}
            <div style={{ display: "grid", gap: 4 }}>
              <span>Portrait</span>
              <div style={{ padding: '12px', background: '#1e293b', borderRadius: '8px', border: '1px solid #475569' }}>
                <div style={{ fontSize: '14px', color: '#e5e7eb', fontWeight: 'bold', marginBottom: '8px' }}>
                  � Live Portrait Preview
                </div>
                <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '8px' }}>
                  Your character portrait is generated automatically and displayed in the preview panel →
                </div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>
                  Portrait updates live as you change name, species, and class.
                  When you save, a snapshot will be stored with your character.
                </div>
              </div>
            </div>
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

          {/* Trait System Explanation */}
          <div style={{ marginBottom: "16px", padding: "12px", background: "rgba(71, 85, 105, 0.1)", border: "1px solid #475569", borderRadius: "8px" }}>
            <div style={{ display: "flex", gap: "24px", fontSize: "0.85em", color: "#94a3b8" }}>
              <div><span style={{ color: "#10b981", fontWeight: "bold" }}>●</span> Automatic - Required by your species/class</div>
              <div><span style={{ color: "#f59e0b", fontWeight: "bold" }}>●</span> Recommended - Fits your background well</div>
              <div><span style={{ color: "#ef4444", fontWeight: "bold" }}>●</span> Forbidden - Conflicts with your nature</div>
            </div>
          </div>

          {/* Show species/class info if selected */}
          {(char.species || char.archetype) && (
            <div style={{ marginBottom: "16px", padding: "12px", background: "rgba(30, 41, 59, 0.5)", border: "1px solid #334155", borderRadius: "8px" }}>
              {char.species && SPECIES_TRAIT_RULES[char.species] && (
                <div style={{ marginBottom: char.archetype ? "8px" : "0" }}>
                  <strong style={{ color: "#e2e8f0" }}>Species - {char.species}:</strong>
                  <div style={{ color: "#94a3b8", marginLeft: "8px", fontSize: "0.9em", marginTop: "2px" }}>
                    {SPECIES_TRAIT_RULES[char.species].description}
                  </div>
                </div>
              )}
              {char.archetype && CLASS_TRAIT_RULES[char.archetype] && (
                <div>
                  <strong style={{ color: "#e2e8f0" }}>Class - {char.archetype}:</strong>
                  <div style={{ color: "#94a3b8", marginLeft: "8px", fontSize: "0.9em", marginTop: "2px" }}>
                    {CLASS_TRAIT_RULES[char.archetype].description}
                  </div>
                </div>
              )}
            </div>
          )}
          <div style={{ display: "grid", gap: 12 }}>
            {TRAIT_CATALOG.map((t) => {
              const traitDef = TRAIT_DEFINITIONS[t as keyof typeof TRAIT_DEFINITIONS];
              const isSelected = char.traits.includes(t);
              const isAutomatic = getAutomaticTraits().includes(t);
              const isForbidden = isTraitForbidden(t);
              const isPreferred = isTraitPreferred(t);
              const isDisabled = (!isSelected && char.traits.length >= MAX_TRAITS) || isForbidden;

              let borderColor = "#374151";
              let backgroundColor = "rgba(15, 23, 42, 0.5)";
              let badgeText = "";
              let badgeColor = "";

              if (isAutomatic) {
                borderColor = "#10b981";
                backgroundColor = "rgba(16, 185, 129, 0.1)";
                badgeText = "AUTOMATIC";
                badgeColor = "#10b981";
              } else if (isForbidden) {
                borderColor = "#ef4444";
                backgroundColor = "rgba(239, 68, 68, 0.1)";
                badgeText = "FORBIDDEN";
                badgeColor = "#ef4444";
              } else if (isSelected) {
                borderColor = "#3b82f6";
                backgroundColor = "rgba(59, 130, 246, 0.1)";
              } else if (isPreferred) {
                borderColor = "#f59e0b";
                backgroundColor = "rgba(245, 158, 11, 0.05)";
                badgeText = "RECOMMENDED";
                badgeColor = "#f59e0b";
              }

              return (
                <label key={t} style={{
                  display: "flex",
                  gap: 12,
                  alignItems: "flex-start",
                  padding: "12px",
                  border: `2px solid ${borderColor}`,
                  borderRadius: "8px",
                  background: backgroundColor,
                  cursor: (isDisabled && !isAutomatic) ? "not-allowed" : "pointer",
                  opacity: (isDisabled && !isAutomatic) ? 0.5 : 1,
                  position: "relative"
                }}>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => !isAutomatic && !isForbidden && toggleTrait(t)}
                    disabled={isAutomatic || isForbidden || (!isSelected && char.traits.length >= MAX_TRAITS)}
                    style={{ marginTop: "2px" }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ fontWeight: "bold", color: "#f1f5f9" }}>{traitDef.name}</div>
                      {badgeText && (
                        <span style={{
                          fontSize: "0.7em",
                          padding: "2px 6px",
                          borderRadius: "4px",
                          backgroundColor: badgeColor,
                          color: "white",
                          fontWeight: "bold"
                        }}>
                          {badgeText}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: "0.9em", color: "#94a3b8", marginTop: "4px" }}>
                      {traitDef.description}
                    </div>
                  </div>
                </label>
              );
            })}
          </div>

          {/* Show selected trait benefits */}
          {char.traits.length > 0 && (
            <div style={{ marginTop: "16px", padding: "12px", background: "rgba(16, 185, 129, 0.1)", border: "1px solid #10b981", borderRadius: "8px" }}>
              <h3 style={{ margin: "0 0 8px", color: "#10b981", fontSize: "1rem" }}>Active Trait Benefits:</h3>
              {getTraitBenefits(char).map((benefit, index) => (
                <div key={index} style={{ fontSize: "0.9em", color: "#e5e7eb", marginBottom: "4px" }}>
                  • {benefit}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Spell Management Section */}
        {getSpellcastingClass(char.archetype) !== 'none' && (
          <div style={card}>
            <h2 style={sectionTitle}>Spells & Cantrips</h2>

            {/* Spell Capacity Display */}
            <div style={{ marginBottom: "16px", padding: "12px", background: "rgba(59, 130, 246, 0.1)", border: "1px solid #3b82f6", borderRadius: "8px" }}>
              <h3 style={{ margin: "0 0 8px", color: "#3b82f6", fontSize: "1rem" }}>Spell Capacity ({getSpellcastingClass(char.archetype)} caster):</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", fontSize: "0.9em" }}>
                <div>
                  <strong>Cantrips:</strong> {char.knownCantrips?.length || 0} / {calculateMaxCantrips(char.level || 1, char.stats.INT, char.stats.WIS)}
                </div>
                <div>
                  <strong>Spells:</strong> {char.knownSpells?.length || 0} / {calculateMaxSpells(char.level || 1, char.stats.INT, char.stats.WIS)}
                </div>
                <div>
                  <strong>Max Spell Level:</strong> {calculateMaxSpellLevel(char.level || 1)}
                </div>
                <div>
                  <strong>Primary Ability:</strong> {getSpellcastingClass(char.archetype) === 'wizard' ? `INT (${char.stats.INT})` :
                    getSpellcastingClass(char.archetype) === 'cleric' ? `WIS (${char.stats.WIS})` :
                      `INT (${char.stats.INT}) or WIS (${char.stats.WIS})`}
                </div>
              </div>
            </div>

            {/* Cantrip Selection */}
            <div style={{ marginBottom: "16px" }}>
              <h3 style={{ margin: "0 0 8px", color: "#8b5cf6", fontSize: "1.1rem" }}>Known Cantrips:</h3>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "8px" }}>
                {(char.knownCantrips || []).map((cantripId, index) => {
                  const cantrip = JSON.parse(localStorage.getItem('world-engine-saved-spells') || '[]')
                    .find((spell: any) => spell.name === cantripId && spell.level === 0);
                  return (
                    <span
                      key={index}
                      style={{
                        background: "#1e293b",
                        color: "#e2e8f0",
                        padding: "4px 8px",
                        borderRadius: "4px",
                        fontSize: "12px",
                        border: "1px solid #8b5cf6",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px"
                      }}
                    >
                      {cantrip?.name || cantripId}
                      <button
                        onClick={() => {
                          const updated = (char.knownCantrips || []).filter((_, i) => i !== index);
                          setField("knownCantrips", updated);
                        }}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#ef4444",
                          cursor: "pointer",
                          padding: "0",
                          fontSize: "12px"
                        }}
                      >
                        ✕
                      </button>
                    </span>
                  );
                })}
              </div>
              <button
                onClick={() => {
                  const savedSpells = JSON.parse(localStorage.getItem('world-engine-saved-spells') || '[]');
                  const availableCantrips = savedSpells.filter((spell: any) =>
                    spell.level === 0 && !(char.knownCantrips || []).includes(spell.name)
                  );

                  if (availableCantrips.length === 0) {
                    alert('No saved cantrips available! Create some cantrips in the Spell Generator first.');
                    return;
                  }

                  if ((char.knownCantrips || []).length >= calculateMaxCantrips(char.level || 1, char.stats.INT, char.stats.WIS)) {
                    alert('Maximum cantrips reached! Increase level or ability scores for more.');
                    return;
                  }

                  const randomCantrip = availableCantrips[Math.floor(Math.random() * availableCantrips.length)];
                  const updated = [...(char.knownCantrips || []), randomCantrip.name];
                  setField("knownCantrips", updated);
                }}
                disabled={(char.knownCantrips || []).length >= calculateMaxCantrips(char.level || 1, char.stats.INT, char.stats.WIS)}
                style={{
                  padding: "6px 12px",
                  background: (char.knownCantrips || []).length >= calculateMaxCantrips(char.level || 1, char.stats.INT, char.stats.WIS) ? "#374151" : "#8b5cf6",
                  color: "#f9fafb",
                  border: "none",
                  borderRadius: "4px",
                  cursor: (char.knownCantrips || []).length >= calculateMaxCantrips(char.level || 1, char.stats.INT, char.stats.WIS) ? "not-allowed" : "pointer",
                  fontSize: "12px"
                }}
              >
                + Add Random Cantrip
              </button>
            </div>

            {/* Spell Selection */}
            {calculateMaxSpells(char.level || 1, char.stats.INT, char.stats.WIS) > 0 && (
              <div style={{ marginBottom: "16px" }}>
                <h3 style={{ margin: "0 0 8px", color: "#8b5cf6", fontSize: "1.1rem" }}>Known Spells:</h3>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "8px" }}>
                  {(char.knownSpells || []).map((spellId, index) => {
                    const spell = JSON.parse(localStorage.getItem('world-engine-saved-spells') || '[]')
                      .find((s: any) => s.name === spellId && s.level > 0);
                    return (
                      <span
                        key={index}
                        style={{
                          background: "#1e293b",
                          color: "#e2e8f0",
                          padding: "4px 8px",
                          borderRadius: "4px",
                          fontSize: "12px",
                          border: "1px solid #3b82f6",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px"
                        }}
                      >
                        {spell?.name || spellId} {spell && `(${spell.level})`}
                        <button
                          onClick={() => {
                            const updated = (char.knownSpells || []).filter((_, i) => i !== index);
                            setField("knownSpells", updated);
                          }}
                          style={{
                            background: "none",
                            border: "none",
                            color: "#ef4444",
                            cursor: "pointer",
                            padding: "0",
                            fontSize: "12px"
                          }}
                        >
                          ✕
                        </button>
                      </span>
                    );
                  })}
                </div>
                <button
                  onClick={() => {
                    const savedSpells = JSON.parse(localStorage.getItem('world-engine-saved-spells') || '[]');
                    const maxLevel = calculateMaxSpellLevel(char.level || 1);
                    const availableSpells = savedSpells.filter((spell: any) =>
                      spell.level > 0 && spell.level <= maxLevel && !(char.knownSpells || []).includes(spell.name)
                    );

                    if (availableSpells.length === 0) {
                      alert(`No saved spells available up to level ${maxLevel}! Create some spells in the Spell Generator first.`);
                      return;
                    }

                    if ((char.knownSpells || []).length >= calculateMaxSpells(char.level || 1, char.stats.INT, char.stats.WIS)) {
                      alert('Maximum spells reached! Increase level or ability scores for more.');
                      return;
                    }

                    const randomSpell = availableSpells[Math.floor(Math.random() * availableSpells.length)];
                    const updated = [...(char.knownSpells || []), randomSpell.name];
                    setField("knownSpells", updated);
                  }}
                  disabled={(char.knownSpells || []).length >= calculateMaxSpells(char.level || 1, char.stats.INT, char.stats.WIS)}
                  style={{
                    padding: "6px 12px",
                    background: (char.knownSpells || []).length >= calculateMaxSpells(char.level || 1, char.stats.INT, char.stats.WIS) ? "#374151" : "#3b82f6",
                    color: "#f9fafb",
                    border: "none",
                    borderRadius: "4px",
                    cursor: (char.knownSpells || []).length >= calculateMaxSpells(char.level || 1, char.stats.INT, char.stats.WIS) ? "not-allowed" : "pointer",
                    fontSize: "12px"
                  }}
                >
                  + Add Random Spell (max level {calculateMaxSpellLevel(char.level || 1)})
                </button>
              </div>
            )}

            {calculateMaxSpells(char.level || 1, char.stats.INT, char.stats.WIS) === 0 && (
              <div style={{ padding: "12px", background: "rgba(156, 163, 175, 0.1)", border: "1px solid #6b7280", borderRadius: "8px", textAlign: "center", color: "#9ca3af" }}>
                No spells available at level {char.level || 1}. Reach level 2 to learn spells!
              </div>
            )}
          </div>
        )}

        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={saveCharacter}>Save (JSON + local)</button>
          <button onClick={saveToLibrary}>Save to Library</button>
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
        {char.name && char.species && char.archetype ? (
          <PortraitPreview
            character={VisualUtils.createCharacterData({
              name: char.name,
              species: char.species,
              archetype: char.archetype,
              level: char.level || 1
            })}
            size="large"
            style={{ width: "100%", borderRadius: 12, marginBottom: 8 }}
          />
        ) : (
          <div style={{ border: "1px dashed #334155", borderRadius: 12, padding: 12, textAlign: "center", marginBottom: 8, opacity: 0.7 }}>
            Add a name, species, and class to see portrait
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
          <div>HP: <strong>{derived.hp}</strong> • AC: <strong>{derived.ac}</strong> • Carry: <strong>{derived.carry}</strong></div>
          {derived.naturalACBonus > 0 && (
            <div style={{ fontSize: 12, opacity: 0.7, marginTop: 2 }}>
              Natural AC Bonus: +{derived.naturalACBonus} (from level/class/race)
            </div>
          )}
          {(derived.classHPBonus > 0 || derived.raceHPBonus !== 0 || derived.traitHPBonus !== 0) && (
            <div style={{ fontSize: 12, opacity: 0.7, marginTop: 2 }}>
              HP per level: {derived.totalHPPerLevel} = {abilityMod(getFinalStat(char.stats.CON, "CON", char.species, char.archetype))} (CON)
              {derived.classHPBonus > 0 && ` + ${derived.classHPBonus} (${char.archetype})`}
              {derived.raceHPBonus !== 0 && ` ${derived.raceHPBonus >= 0 ? '+' : ''}${derived.raceHPBonus} (${char.species})`}
              {derived.traitHPBonus !== 0 && ` ${derived.traitHPBonus >= 0 ? '+' : ''}${derived.traitHPBonus} (traits)`}
            </div>
          )}
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