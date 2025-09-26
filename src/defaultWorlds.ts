import type { Preset } from './engine.d';

// Class definitions with stat modifiers and abilities
export const CLASS_DEFINITIONS = {
  // Verdance Classes
  'Greenwarden': {
    name: 'Greenwarden',
    description: 'Protectors of the sacred groves, wielding nature magic and plant allies.',
    statModifiers: { strength: 2, constitution: 3, wisdom: 4, intelligence: 2, dexterity: 1, charisma: 2 },
    primaryStats: ['Wisdom', 'Constitution'],
    abilities: ['Commune with Plants', 'Nature\'s Shield', 'Healing Touch'],
    equipment: ['Ironwood Staff', 'Living Armor', 'Seed Pouch'],
    faction: 'The Rootspeakers'
  },
  'Thorn Knight': {
    name: 'Thorn Knight',
    description: 'Warriors who bond with thorned plants, masters of aggressive defense.',
    statModifiers: { strength: 4, constitution: 4, wisdom: 1, intelligence: 1, dexterity: 2, charisma: 2 },
    primaryStats: ['Strength', 'Constitution'],
    abilities: ['Thorn Armor', 'Spike Strike', 'Guardian\'s Stance'],
    equipment: ['Thorn Blade', 'Barkskin Mail', 'Shield of Briars'],
    faction: 'Thornweave Syndicate'
  },
  'Sapling Adept': {
    name: 'Sapling Adept',
    description: 'Young mages learning to channel the growth energies of spirit plants.',
    statModifiers: { strength: 1, constitution: 2, wisdom: 3, intelligence: 4, dexterity: 3, charisma: 1 },
    primaryStats: ['Intelligence', 'Wisdom'],
    abilities: ['Growth Burst', 'Plant Familiar', 'Verdant Bolt'],
    equipment: ['Sapling Wand', 'Apprentice Robes', 'Botanical Tome'],
    faction: 'The Rootspeakers'
  },
  'Bloomcaller': {
    name: 'Bloomcaller',
    description: 'Diplomatic negotiators who can speak with all forms of plant life.',
    statModifiers: { strength: 1, constitution: 2, wisdom: 3, intelligence: 2, dexterity: 2, charisma: 4 },
    primaryStats: ['Charisma', 'Wisdom'],
    abilities: ['Plant Speech', 'Soothing Pollen', 'Bloom Command'],
    equipment: ['Flower Crown', 'Silk Robes', 'Diplomatic Sash'],
    faction: 'Valebright Court'
  },

  // Ashenreach Classes
  'Ashblade': {
    name: 'Ashblade',
    description: 'Warriors who forge weapons from the bones and ash of the wasteland.',
    statModifiers: { strength: 4, constitution: 3, wisdom: 1, intelligence: 1, dexterity: 3, charisma: 2 },
    primaryStats: ['Strength', 'Dexterity'],
    abilities: ['Ash Strike', 'Heat Resistance', 'Bone Weapon'],
    equipment: ['Ashforged Blade', 'Bone Mail', 'Ember Cloak'],
    faction: 'The Cindermarch'
  },
  'Cinder Mystic': {
    name: 'Cinder Mystic',
    description: 'Spellcasters who draw power from the remnant fires of the Great Burning.',
    statModifiers: { strength: 1, constitution: 2, wisdom: 4, intelligence: 4, dexterity: 2, charisma: 1 },
    primaryStats: ['Intelligence', 'Wisdom'],
    abilities: ['Cinder Bolt', 'Flame Ward', 'Ash Scrying'],
    equipment: ['Ember Staff', 'Cinderwoven Robes', 'Fire Gem'],
    faction: 'Ember Cult'
  },
  'Dust Ranger': {
    name: 'Dust Ranger',
    description: 'Scouts and survivors who know every secret of the wasteland.',
    statModifiers: { strength: 2, constitution: 3, wisdom: 3, intelligence: 2, dexterity: 4, charisma: 1 },
    primaryStats: ['Dexterity', 'Wisdom'],
    abilities: ['Track in Ash', 'Sandstorm Cloak', 'Desert Navigation'],
    equipment: ['Recurved Bow', 'Desert Garb', 'Survival Pack'],
    faction: 'Duskward Nomads'
  },
  'Bonechanter': {
    name: 'Bonechanter',
    description: 'Necromantic priests who sing to the bones of the ancient dead.',
    statModifiers: { strength: 1, constitution: 2, wisdom: 3, intelligence: 3, dexterity: 1, charisma: 4 },
    primaryStats: ['Charisma', 'Wisdom'],
    abilities: ['Bone Song', 'Speak with Dead', 'Ossify'],
    equipment: ['Bone Flute', 'Death Shroud', 'Skull Talisman'],
    faction: 'Bonechanters'
  },

  // Skyvault Classes  
  'Stormcaller': {
    name: 'Stormcaller',
    description: 'Elemental mages who command lightning and wind magic.',
    statModifiers: { strength: 1, constitution: 2, wisdom: 3, intelligence: 4, dexterity: 3, charisma: 1 },
    primaryStats: ['Intelligence', 'Dexterity'],
    abilities: ['Lightning Bolt', 'Wind Walk', 'Storm Shield'],
    equipment: ['Storm Rod', 'Sky Silk Robes', 'Weather Compass'],
    faction: 'Stormcaller Guild'
  },
  'Voidwing': {
    name: 'Voidwing',
    description: 'Sky pirates who master aerial combat and void magic.',
    statModifiers: { strength: 3, constitution: 2, wisdom: 1, intelligence: 2, dexterity: 4, charisma: 2 },
    primaryStats: ['Dexterity', 'Strength'],
    abilities: ['Void Step', 'Sky Strike', 'Gravity Defiance'],
    equipment: ['Void Cutlass', 'Flight Harness', 'Pirate\'s Coat'],
    faction: 'Voidwing Pirates'
  },
  'Sky Knight': {
    name: 'Sky Knight',
    description: 'Noble warriors who ride winged mounts and uphold celestial codes.',
    statModifiers: { strength: 4, constitution: 3, wisdom: 2, intelligence: 2, dexterity: 2, charisma: 3 },
    primaryStats: ['Strength', 'Charisma'],
    abilities: ['Mount Bond', 'Celestial Strike', 'Knight\'s Valor'],
    equipment: ['Sky Lance', 'Celestial Plate', 'Noble Seal'],
    faction: 'Celestial Observatory'
  },
  'Wind Sage': {
    name: 'Wind Sage',
    description: 'Scholarly monks who study the patterns of air and aether.',
    statModifiers: { strength: 1, constitution: 2, wisdom: 4, intelligence: 3, dexterity: 3, charisma: 1 },
    primaryStats: ['Wisdom', 'Intelligence'],
    abilities: ['Aether Sight', 'Wind Meditation', 'Air Walk'],
    equipment: ['Meditation Staff', 'Wind Robes', 'Aether Crystal'],
    faction: 'The Windwright Consortium'
  }
};

export const DEFAULT_WORLDS: Preset[] = [
  {
    name: 'Verdance',
    seed: 'verdance-seed-001',
    description: 'A lush frontier of spirit plants, deep roots, and hidden sects.',
    factions: ['Hollowshade Clan', 'Valebright Court', 'Thornweave Syndicate', 'The Rootspeakers'],
    classes: ['Greenwarden', 'Thorn Knight', 'Sapling Adept', 'Bloomcaller'],
    lore: 'In the heart of the Verdance, ancient spirit plants pulse with ethereal light, their roots forming vast networks beneath the forest floor that whisper secrets across continents. The Hollowshade Clan has learned to walk between shadow and root, using umbral magic to commune with the deepest, oldest growths. They believe the plants hold memories of the world\'s first age, when magic flowed freely through all living things.'
  },
  {
    name: 'Ashenreach',
    seed: 'ashenreach-seed-002',
    description: 'A scorched expanse of ash dunes, ember cults, and bone singers.',
    factions: ['Ember Cult', 'Bonechanters', 'Duskward Nomads', 'The Cindermarch'],
    classes: ['Ashblade', 'Cinder Mystic', 'Dust Ranger', 'Bonechanter'],
    lore: 'The Ashenreach was not always a wasteland. Once, it was the Golden Empire of Solmere, a realm of crystal spires and sun-blessed fields. But the Great Burning came without warning—whether by dragon fire, fallen star, or the Empire\'s own hubris, none can say for certain.'
  },
  {
    name: 'Skyvault',
    seed: 'skyvault-seed-003',
    description: 'Floating citadels and shattered islands drifting in endless skies.',
    factions: ['Stormcaller Guild', 'Voidwing Pirates', 'Celestial Observatory', 'The Windwright Consortium'],
    classes: ['Stormcaller', 'Voidwing', 'Sky Knight', 'Wind Sage'],
    lore: 'When the ancient world shattered in the Sundering, entire continents were cast into the sky, held aloft by veins of raw aetheric force. Now the Skyvault stretches across three layers of heaven.'
  }
];
