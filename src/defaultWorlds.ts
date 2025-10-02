import type { Preset } from './engine.d';

// Consolidated class definitions - 6 core archetypes
export const CLASS_DEFINITIONS = {
  // Male classes
  'Knight': {
    name: 'Knight',
    description: 'Elite warriors trained in heavy combat, combining the skills of thorn knights, ashblades, and sky knights.',
    statModifiers: { strength: 4, constitution: 3, wisdom: 1, intelligence: 1, dexterity: 2, charisma: 3 },
    primaryStats: ['Strength', 'Constitution'],
    abilities: ['Heavy Strike', 'Shield Wall', 'Warrior\'s Resolve'],
    equipment: ['Forged Blade', 'Heavy Armor', 'War Shield'],
    faction: 'Warrior Orders'
  },
  'Ranger': {
    name: 'Ranger',
    description: 'Skilled scouts and survivalists who know the secrets of wilderness, wasteland, and sky.',
    statModifiers: { strength: 2, constitution: 3, wisdom: 3, intelligence: 2, dexterity: 4, charisma: 1 },
    primaryStats: ['Dexterity', 'Wisdom'],
    abilities: ['Track', 'Survival Instinct', 'Precise Shot'],
    equipment: ['Ranger Bow', 'Travel Gear', 'Camouflage Cloak'],
    faction: 'Scout Guilds'
  },
  'Chanter': {
    name: 'Chanter',
    description: 'Priests and singers who channel power through voice, bone, and ancient rites.',
    statModifiers: { strength: 1, constitution: 2, wisdom: 3, intelligence: 3, dexterity: 1, charisma: 4 },
    primaryStats: ['Charisma', 'Wisdom'],
    abilities: ['Sacred Song', 'Ritual Magic', 'Divine Word'],
    equipment: ['Sacred Focus', 'Ritual Robes', 'Prayer Beads'],
    faction: 'Religious Orders'
  },

  // Female classes
  'Mystic': {
    name: 'Mystic',
    description: 'Powerful spellcasters who master fire, storm, nature, and elemental forces.',
    statModifiers: { strength: 1, constitution: 2, wisdom: 4, intelligence: 4, dexterity: 2, charisma: 1 },
    primaryStats: ['Intelligence', 'Wisdom'],
    abilities: ['Elemental Bolt', 'Magic Shield', 'Arcane Sight'],
    equipment: ['Mystic Staff', 'Enchanted Robes', 'Spell Focus'],
    faction: 'Mage Circles'
  },
  'Guardian': {
    name: 'Guardian',
    description: 'Protectors and healers who commune with nature, plants, and life forces.',
    statModifiers: { strength: 2, constitution: 3, wisdom: 4, intelligence: 2, dexterity: 1, charisma: 2 },
    primaryStats: ['Wisdom', 'Constitution'],
    abilities: ['Nature\'s Blessing', 'Healing Touch', 'Life Ward'],
    equipment: ['Living Staff', 'Natural Armor', 'Herb Pouch'],
    faction: 'Druidic Circles'
  },
  'Corsair': {
    name: 'Corsair',
    description: 'Agile fighters and void-touched raiders who master sky combat and shadow magic.',
    statModifiers: { strength: 3, constitution: 2, wisdom: 1, intelligence: 2, dexterity: 4, charisma: 2 },
    primaryStats: ['Dexterity', 'Strength'],
    abilities: ['Void Step', 'Shadow Strike', 'Evasion'],
    equipment: ['Curved Blade', 'Light Armor', 'Grappling Hook'],
    faction: 'Pirate Crews'
  }
};

export const DEFAULT_WORLDS: Preset[] = [
  {
    name: 'Verdance',
    seed: 'verdance-seed-001',
    description: 'A lush frontier of spirit plants, deep roots, and hidden sects.',
    factions: ['Druidic Circles', 'Warrior Orders', 'Scout Guilds'],
    classes: ['Guardian', 'Knight', 'Ranger'],
    lore: 'In the heart of the Verdance, ancient spirit plants pulse with ethereal light, their roots forming vast networks beneath the forest floor that whisper secrets across continents. The Druidic Circles have learned to walk between shadow and root, using nature magic to commune with the deepest, oldest growths.'
  },
  {
    name: 'Ashenreach',
    seed: 'ashenreach-seed-002',
    description: 'A scorched expanse of ash dunes, ember cults, and bone singers.',
    factions: ['Religious Orders', 'Warrior Orders', 'Scout Guilds'],
    classes: ['Chanter', 'Knight', 'Ranger'],
    lore: 'The Ashenreach was not always a wasteland. Once, it was the Golden Empire of Solmere, a realm of crystal spires and sun-blessed fields. But the Great Burning came without warning—whether by dragon fire, fallen star, or the Empire\'s own hubris, none can say for certain.'
  },
  {
    name: 'Skyvault',
    seed: 'skyvault-seed-003',
    description: 'Floating citadels and shattered islands drifting in endless skies.',
    factions: ['Mage Circles', 'Pirate Crews', 'Warrior Orders'],
    classes: ['Mystic', 'Corsair', 'Knight'],
    lore: 'When the ancient world shattered in the Sundering, entire continents were cast into the sky, held aloft by veins of raw aetheric force. Now the Skyvault stretches across three layers of heaven.'
  }
];
