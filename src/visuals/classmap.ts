// Character Class to Visual Mapping System
// Maps game archetypes to visual themes and asset preferences

import { CharacterVisualData } from './types';

interface ClassVisualTheme {
  archetype: string;
  colorPalette: {
    primary: string;
    secondary: string;
    accent: string;
    metal?: string;
  };
  preferredAssets: {
    armor?: string[];
    weapons?: string[];
    accessories?: string[];
  };
  visualTraits: {
    build?: 'slim' | 'average' | 'stocky' | 'muscular';
    stance?: 'relaxed' | 'alert' | 'aggressive' | 'scholarly';
    aura?: 'none' | 'magical' | 'divine' | 'primal' | 'technological';
  };
  description: string;
}

// Visual themes for each archetype
const CLASS_VISUAL_THEMES: Record<string, ClassVisualTheme> = {
  'Warrior': {
    archetype: 'Warrior',
    colorPalette: {
      primary: '#8B4513', // Brown leather
      secondary: '#C0C0C0', // Steel
      accent: '#DAA520', // Gold
      metal: '#C0C0C0'
    },
    preferredAssets: {
      armor: ['leather', 'chainmail', 'plate'],
      weapons: ['sword', 'axe', 'mace'],
      accessories: ['belt', 'bracers', 'cloak']
    },
    visualTraits: {
      build: 'muscular',
      stance: 'alert',
      aura: 'none'
    },
    description: 'Sturdy and practical, with well-worn equipment'
  },

  'Scout': {
    archetype: 'Scout',
    colorPalette: {
      primary: '#228B22', // Forest green
      secondary: '#8B4513', // Brown leather
      accent: '#2F4F4F', // Dark slate
      metal: '#696969'
    },
    preferredAssets: {
      armor: ['leather', 'studded'],
      weapons: ['bow', 'dagger', 'shortbow'],
      accessories: ['quiver', 'pouch', 'cloak']
    },
    visualTraits: {
      build: 'slim',
      stance: 'alert',
      aura: 'none'
    },
    description: 'Practical outdoor gear in earth tones'
  },

  'Mage': {
    archetype: 'Mage',
    colorPalette: {
      primary: '#4B0082', // Indigo
      secondary: '#191970', // Midnight blue
      accent: '#FFD700', // Gold
      metal: '#DAA520'
    },
    preferredAssets: {
      armor: ['robes', 'light'],
      weapons: ['staff', 'wand', 'tome'],
      accessories: ['amulet', 'ring', 'sash']
    },
    visualTraits: {
      build: 'average',
      stance: 'scholarly',
      aura: 'magical'
    },
    description: 'Flowing robes with mystical accessories'
  },

  'Guardian': {
    archetype: 'Guardian',
    colorPalette: {
      primary: '#4682B4', // Steel blue
      secondary: '#C0C0C0', // Silver
      accent: '#FFD700', // Gold
      metal: '#C0C0C0'
    },
    preferredAssets: {
      armor: ['plate', 'scale', 'chainmail'],
      weapons: ['shield', 'sword', 'mace'],
      accessories: ['cloak', 'symbol', 'bracers']
    },
    visualTraits: {
      build: 'stocky',
      stance: 'alert',
      aura: 'divine'
    },
    description: 'Heavy armor with protective symbols'
  },

  'Ranger': {
    archetype: 'Ranger',
    colorPalette: {
      primary: '#8FBC8F', // Dark sea green
      secondary: '#8B4513', // Saddle brown
      accent: '#2E8B57', // Sea green
      metal: '#696969'
    },
    preferredAssets: {
      armor: ['leather', 'hide'],
      weapons: ['bow', 'sword', 'knife'],
      accessories: ['quiver', 'pack', 'cloak']
    },
    visualTraits: {
      build: 'average',
      stance: 'relaxed',
      aura: 'primal'
    },
    description: 'Nature-themed gear with practical design'
  },

  'Rogue': {
    archetype: 'Rogue',
    colorPalette: {
      primary: '#2F2F2F', // Dark gray
      secondary: '#000000', // Black
      accent: '#8B0000', // Dark red
      metal: '#696969'
    },
    preferredAssets: {
      armor: ['leather', 'light'],
      weapons: ['dagger', 'shortsword', 'crossbow'],
      accessories: ['belt', 'gloves', 'hood']
    },
    visualTraits: {
      build: 'slim',
      stance: 'alert',
      aura: 'none'
    },
    description: 'Dark, practical clothing for stealth'
  },

  'Artificer': {
    archetype: 'Artificer',
    colorPalette: {
      primary: '#CD853F', // Peru
      secondary: '#B8860B', // Dark goldenrod
      accent: '#00CED1', // Dark turquoise
      metal: '#B87333'
    },
    preferredAssets: {
      armor: ['leather', 'studded', 'scale'],
      weapons: ['crossbow', 'hammer', 'gadget'],
      accessories: ['goggles', 'tools', 'pouches']
    },
    visualTraits: {
      build: 'average',
      stance: 'scholarly',
      aura: 'technological'
    },
    description: 'Practical gear with technological enhancements'
  }

  // TODO: Add specialized archetypes (Thorn Knight, Ashblade, etc.) in future updates
};

/**
 * Get visual theme for a character archetype
 */
export function getClassVisualTheme(archetype: string): ClassVisualTheme | null {
  return CLASS_VISUAL_THEMES[archetype] || null;
}

/**
 * Get color palette for archetype
 */
export function getClassColors(archetype: string): ClassVisualTheme['colorPalette'] | null {
  const theme = getClassVisualTheme(archetype);
  return theme?.colorPalette || null;
}

/**
 * Get preferred assets for archetype
 */
export function getPreferredAssets(archetype: string): ClassVisualTheme['preferredAssets'] | null {
  const theme = getClassVisualTheme(archetype);
  return theme?.preferredAssets || null;
}

/**
 * Generate default appearance for character based on species and archetype
 */
export function generateDefaultAppearance(species: string, archetype: string): CharacterVisualData['appearance'] {
  const theme = getClassVisualTheme(archetype);
  
  // Species-based defaults
  const speciesDefaults: Record<string, Partial<CharacterVisualData['appearance']>> = {
    'Human': { skinTone: 'medium', hairColor: 'brown', eyeColor: 'brown' },
    'Sylvanborn': { skinTone: 'fair', hairColor: 'green', eyeColor: 'green' },
    'Nightborn': { skinTone: 'pale', hairColor: 'black', eyeColor: 'violet' },
    'Stormcaller': { skinTone: 'medium', hairColor: 'silver', eyeColor: 'blue' },
    'Crystalborn': { skinTone: 'crystalline', hairColor: 'crystal', eyeColor: 'prismatic' },
    'Draketh': { skinTone: 'scaled', hairColor: 'red', eyeColor: 'gold' },
    'Alloy': { skinTone: 'metallic', hairColor: 'copper', eyeColor: 'silver' },
    'Voidkin': { skinTone: 'dark', hairColor: 'void', eyeColor: 'starlight' }
  };

  const base = speciesDefaults[species] || speciesDefaults['Human'];
  
  return {
    ...base,
    build: theme?.visualTraits.build || 'average',
    height: 'average'
  };
}

/**
 * Get all available class themes
 */
export function getAllClassThemes(): ClassVisualTheme[] {
  return Object.values(CLASS_VISUAL_THEMES);
}

/**
 * Check if archetype has visual theme
 */
export function hasVisualTheme(archetype: string): boolean {
  return archetype in CLASS_VISUAL_THEMES;
}