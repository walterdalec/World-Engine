/**
 * Character Creator Rules & Budgets
 * TODO #16 — Character Creator & Progression Bridge
 * 
 * Defines the mechanical rules for character creation including:
 * - Point-buy stat budgets by level
 * - Species, background, and archetype modifiers
 * - Magic mastery level gates
 * - Equipment and ability requirements
 */

import type {
    SpeciesId, BackgroundId, ArchetypeId, StatAllocation, School,
    SpeciesDefinition, BackgroundDefinition, ArchetypeDefinition
} from './types';

// Point-buy budget calculation
export const StatBudgetByLevel = (level: number): number => {
    // Base budget: 40 points at level 1, +4 per level
    return 40 + (level - 1) * 4;
};

// Stat constraints
export const MaxPerStat = 18;
export const MinPerStat = 3;
export const BaseStatValue = 8; // Starting value before point allocation

// Point-buy costs: progressive cost increase
export const StatPointCost = (targetValue: number): number => {
    let cost = 0;
    for (let i = BaseStatValue + 1; i <= targetValue; i++) {
        if (i <= 13) cost += 1;      // 9-13: 1 point each
        else if (i <= 15) cost += 2; // 14-15: 2 points each
        else cost += 3;              // 16+: 3 points each
    }
    return cost;
};

// Species definitions with mechanical modifiers
export const SpeciesMods: Record<SpeciesId, SpeciesDefinition> = {
    human: {
        id: 'human',
        name: 'Human',
        description: 'Versatile and adaptable, humans excel in leadership and diplomacy.',
        statModifiers: { cha: 1, lck: 1 },
        traits: ['Adaptable', 'Ambitious'],
        culturalBackground: 'Diverse settlements and kingdoms',
        lifespan: '60-80 years',
        physicalTraits: 'Medium build, varied appearance'
    },
    sylvanborn: {
        id: 'sylvanborn',
        name: 'Sylvanborn',
        description: 'Nature-touched beings with deep connection to forests and growing things.',
        statModifiers: { dex: 2, wis: 1, con: -1 },
        traits: ['Nature Affinity', 'Forest Walker'],
        resistances: { nature: 25, poison: 15 },
        culturalBackground: 'Ancient groves and tree-cities',
        lifespan: '120-200 years',
        physicalTraits: 'Tall, graceful, bark-like skin patterns'
    },
    nightborn: {
        id: 'nightborn',
        name: 'Nightborn',
        description: 'Shadow-touched people with mastery over darkness and stealth.',
        statModifiers: { dex: 2, int: 1, str: -1 },
        traits: ['Shadow Step', 'Darkvision'],
        resistances: { shadow: 25, fear: 15 },
        culturalBackground: 'Underground cities and twilight realms',
        lifespan: '80-120 years',
        physicalTraits: 'Pale skin, dark eyes, moves silently'
    },
    stormcaller: {
        id: 'stormcaller',
        name: 'Stormcaller',
        description: 'Sky-born people who command wind and lightning.',
        statModifiers: { spd: 2, cha: 1, con: -1 },
        traits: ['Storm Touched', 'Wind Walker'],
        resistances: { air: 25, lightning: 20 },
        culturalBackground: 'Mountain peaks and sky citadels',
        lifespan: '70-100 years',
        physicalTraits: 'Tall, lean, hair that moves like wind'
    },
    crystalborn: {
        id: 'crystalborn',
        name: 'Crystalborn',
        description: 'Gem-touched beings with crystalline growths and earth magic.',
        statModifiers: { con: 2, int: 1, spd: -1 },
        traits: ['Crystal Resonance', 'Earth Sense'],
        resistances: { earth: 25, physical: 10 },
        culturalBackground: 'Crystal caves and mineral sanctuaries',
        lifespan: '150-300 years',
        physicalTraits: 'Crystalline protrusions, translucent skin'
    },
    draketh: {
        id: 'draketh',
        name: 'Draketh',
        description: 'Dragon-blooded warriors with scales and fierce pride.',
        statModifiers: { str: 2, cha: 1, wis: -1 },
        traits: ['Dragon Blood', 'Breath Weapon'],
        resistances: { fire: 30, fear: 20 },
        culturalBackground: 'Clan holds and dragon lairs',
        lifespan: '100-200 years',
        physicalTraits: 'Scales, reptilian eyes, imposing presence'
    },
    alloy: {
        id: 'alloy',
        name: 'Alloy',
        description: 'Constructed beings of metal and magic with analytical minds.',
        statModifiers: { con: 2, int: 2, cha: -2 },
        traits: ['Construct Nature', 'Analytical Mind'],
        resistances: { poison: 100, disease: 100, mental: 25 },
        culturalBackground: 'Artificer workshops and mechanical cities',
        lifespan: 'Indefinite (with maintenance)',
        physicalTraits: 'Metallic body, glowing energy cores'
    },
    voidkin: {
        id: 'voidkin',
        name: 'Voidkin',
        description: 'Beings touched by the space between stars, wielding alien magic.',
        statModifiers: { int: 2, wis: 1, str: -1, cha: -1 },
        traits: ['Void Touched', 'Cosmic Insight'],
        resistances: { psychic: 30, arcane: 15 },
        culturalBackground: 'Interdimensional enclaves and star-touched sites',
        lifespan: 'Variable (affected by void exposure)',
        physicalTraits: 'Shifting features, star-filled eyes'
    }
};

// Background definitions with social and skill modifiers
export const BackgroundMods: Record<BackgroundId, BackgroundDefinition> = {
    commoner: {
        id: 'commoner',
        name: 'Commoner',
        description: 'Humble origins with practical skills and hardy constitution.',
        statModifiers: { con: 1, str: 1 },
        startingGold: 50,
        bonusEquipment: ['work_tools', 'common_clothes'],
        socialConnections: ['Local Farmers', 'Village Elders'],
        knowledgeAreas: ['Local Geography', 'Folk Remedies']
    },
    noble: {
        id: 'noble',
        name: 'Noble',
        description: 'High-born with education, wealth, and social connections.',
        statModifiers: { cha: 2, int: 1 },
        startingGold: 200,
        bonusEquipment: ['fine_clothes', 'signet_ring', 'educated_tome'],
        socialConnections: ['Court Officials', 'Merchant Guilds', 'Other Nobles'],
        knowledgeAreas: ['History', 'Politics', 'Etiquette']
    },
    outcast: {
        id: 'outcast',
        name: 'Outcast',
        description: 'Rejected by society, developing self-reliance and cunning.',
        statModifiers: { dex: 1, lck: 1, cha: -1 },
        startingGold: 25,
        bonusEquipment: ['survival_kit', 'worn_cloak'],
        socialConnections: ['Other Outcasts', 'Criminal Contacts'],
        knowledgeAreas: ['Survival', 'Street Wisdom', 'Hidden Paths']
    },
    acolyte: {
        id: 'acolyte',
        name: 'Acolyte',
        description: 'Trained in religious traditions and divine magic.',
        statModifiers: { wis: 2, int: 1 },
        startingGold: 75,
        bonusEquipment: ['holy_symbol', 'prayer_book', 'ritual_robes'],
        socialConnections: ['Religious Orders', 'Temple Hierarchy'],
        knowledgeAreas: ['Theology', 'Ancient Lore', 'Healing Arts']
    },
    ranger: {
        id: 'ranger',
        name: 'Ranger',
        description: 'Wilderness guide with tracking skills and nature knowledge.',
        statModifiers: { dex: 1, spd: 1, wis: 1 },
        startingGold: 100,
        bonusEquipment: ['hunting_bow', 'trail_rations', 'wilderness_gear'],
        socialConnections: ['Hunter Lodges', 'Wilderness Guides', 'Druid Circles'],
        knowledgeAreas: ['Animal Behavior', 'Weather Patterns', 'Terrain Navigation']
    },
    scholar: {
        id: 'scholar',
        name: 'Scholar',
        description: 'Academic with extensive knowledge and research skills.',
        statModifiers: { int: 2, wis: 1, con: -1 },
        startingGold: 150,
        bonusEquipment: ['research_tomes', 'writing_materials', 'scholar_robes'],
        socialConnections: ['Academic Institutions', 'Sage Councils', 'Library Networks'],
        knowledgeAreas: ['Arcane Theory', 'Historical Records', 'Linguistic Studies']
    },
    mercenary: {
        id: 'mercenary',
        name: 'Mercenary',
        description: 'Professional soldier with combat experience and practical skills.',
        statModifiers: { str: 1, con: 1, dex: 1 },
        startingGold: 125,
        bonusEquipment: ['mercenary_blade', 'field_armor', 'campaign_pack'],
        socialConnections: ['Mercenary Companies', 'Veterans', 'Arms Dealers'],
        knowledgeAreas: ['Military Tactics', 'Equipment Maintenance', 'Campaign Geography']
    },
    wanderer: {
        id: 'wanderer',
        name: 'Wanderer',
        description: 'Traveled far and wide, gaining diverse experiences and contacts.',
        statModifiers: { spd: 1, lck: 1, wis: 1 },
        startingGold: 75,
        bonusEquipment: ['traveler_pack', 'road_clothes', 'navigation_tools'],
        socialConnections: ['Caravan Masters', 'Innkeepers', 'Fellow Travelers'],
        knowledgeAreas: ['Foreign Customs', 'Trade Routes', 'Cultural Practices']
    }
};

// Archetype definitions with combat roles and default loadouts
export const ArchetypeDefaults: Record<ArchetypeId, ArchetypeDefinition> = {
    warrior: {
        id: 'warrior',
        name: 'Warrior',
        description: 'Frontline fighter specializing in melee combat and protection.',
        combatRole: 'melee',
        primaryStats: ['str', 'con'],
        defaultEquipment: {
            weapon: 'iron_sword',
            armor: 'leather_armor'
        },
        startingAbilities: ['power_attack', 'defensive_stance'],
        formationPreference: 'front'
    },
    ranger: {
        id: 'ranger',
        name: 'Ranger',
        description: 'Skilled archer and scout with wilderness expertise.',
        combatRole: 'ranged',
        primaryStats: ['dex', 'wis'],
        defaultEquipment: {
            weapon: 'shortbow',
            armor: 'leather_armor'
        },
        startingAbilities: ['precise_shot', 'track'],
        magicTraditions: ['Nature', 'Air'],
        formationPreference: 'back'
    },
    mage: {
        id: 'mage',
        name: 'Mage',
        description: 'Arcane spellcaster with mastery over elemental forces.',
        combatRole: 'caster',
        primaryStats: ['int', 'wis'],
        defaultEquipment: {
            weapon: 'oak_staff',
            armor: 'cloth_robes'
        },
        startingAbilities: ['arcane_bolt', 'mana_shield'],
        magicTraditions: ['Fire', 'Air', 'Water', 'Earth', 'Arcane'],
        formationPreference: 'back'
    },
    priest: {
        id: 'priest',
        name: 'Priest',
        description: 'Divine spellcaster focused on healing and support magic.',
        combatRole: 'support',
        primaryStats: ['wis', 'cha'],
        defaultEquipment: {
            weapon: 'ash_wand',
            armor: 'cloth_robes'
        },
        startingAbilities: ['heal', 'bless'],
        magicTraditions: ['Divine', 'Spirit'],
        formationPreference: 'back'
    },
    commander: {
        id: 'commander',
        name: 'Commander',
        description: 'Military leader with tactical abilities and inspiring presence.',
        combatRole: 'leader',
        primaryStats: ['cha', 'int'],
        defaultEquipment: {
            weapon: 'iron_sword',
            armor: 'brigandine',
            shield: 'round_shield'
        },
        startingAbilities: ['rally', 'tactical_strike'],
        commandCapable: true,
        formationPreference: 'flexible'
    },
    knight: {
        id: 'knight',
        name: 'Knight',
        description: 'Elite heavy warrior with honor-bound code and superior equipment.',
        combatRole: 'melee',
        primaryStats: ['str', 'cha'],
        defaultEquipment: {
            weapon: 'knight_sword',
            armor: 'plate_armor',
            shield: 'knight_shield'
        },
        startingAbilities: ['righteous_strike', 'armor_mastery'],
        formationPreference: 'front'
    },
    mystic: {
        id: 'mystic',
        name: 'Mystic',
        description: 'Advanced spellcaster with deep understanding of magical forces.',
        combatRole: 'caster',
        primaryStats: ['int', 'wis'],
        defaultEquipment: {
            weapon: 'mystic_orb',
            armor: 'enchanted_robes'
        },
        startingAbilities: ['elemental_mastery', 'arcane_sight'],
        magicTraditions: ['Arcane', 'Shadow', 'Spirit'],
        formationPreference: 'back'
    },
    guardian: {
        id: 'guardian',
        name: 'Guardian',
        description: 'Protector with defensive abilities and healing magic.',
        combatRole: 'support',
        primaryStats: ['con', 'wis'],
        defaultEquipment: {
            weapon: 'guardian_staff',
            armor: 'guardian_mail',
            shield: 'tower_shield'
        },
        startingAbilities: ['protective_ward', 'regeneration'],
        magicTraditions: ['Nature', 'Divine'],
        formationPreference: 'front'
    },
    chanter: {
        id: 'chanter',
        name: 'Chanter',
        description: 'Vocal spellcaster using songs and chants to weave magic.',
        combatRole: 'support',
        primaryStats: ['cha', 'wis'],
        defaultEquipment: {
            weapon: 'chanter_harp',
            armor: 'performer_garb'
        },
        startingAbilities: ['inspiring_song', 'voice_of_power'],
        magicTraditions: ['Spirit', 'Divine'],
        formationPreference: 'back'
    },
    corsair: {
        id: 'corsair',
        name: 'Corsair',
        description: 'Agile fighter specializing in mobility and dual-wielding.',
        combatRole: 'melee',
        primaryStats: ['dex', 'cha'],
        defaultEquipment: {
            weapon: 'corsair_blade',
            armor: 'corsair_coat'
        },
        startingAbilities: ['dual_strike', 'evasive_maneuvers'],
        formationPreference: 'front'
    }
};

// Magic mastery level gates (level requirements for each mastery rank)
export const MasteryLevelGate = {
    1: 1,  // Basic mastery available at level 1
    2: 4,  // Skilled mastery requires level 4
    3: 7,  // Expert mastery requires level 7
    4: 10  // Grandmaster mastery requires level 10
} as const;

// Spell level gates (character level required for each spell level)
export const SpellLevelGate = {
    0: 1,  // Cantrips at level 1
    1: 2,  // 1st level spells at level 2
    2: 4,  // 2nd level spells at level 4
    3: 6,  // 3rd level spells at level 6
    4: 8,  // 4th level spells at level 8
    5: 10, // 5th level spells at level 10
    6: 12, // 6th level spells at level 12
    7: 14, // 7th level spells at level 14
    8: 16, // 8th level spells at level 16
    9: 18  // 9th level spells at level 18
} as const;

// Commander requirements
export const CommanderRequirements = {
    minLevel: 3,
    minCharisma: 12,
    requiredTraits: [] as string[], // Optional: could require leadership traits
    baseCommandRadius: 2,
    maxAuras: 3,
    maxCommandAbilities: 5
} as const;