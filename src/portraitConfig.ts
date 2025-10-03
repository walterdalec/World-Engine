/**
 * Portrait Configuration System
 * Defines gender locks and image mappings for classes
 */

export interface PortraitConfig {
    genderLocked?: 'male' | 'female';
    imagePath?: string;
    description?: string;
}

export interface SpeciesPortraitConfig {
    [archetype: string]: PortraitConfig;
}

export interface AllPortraitConfigs {
    [species: string]: SpeciesPortraitConfig;
}

/**
 * Global Gender Locks - Apply to ALL races
 * Each class is locked to one gender across all species
 */
const GLOBAL_GENDER_LOCKS: { [archetype: string]: 'male' | 'female' } = {
    // MALE-ONLY CLASSES (3)
    'Knight': 'male',
    'Ranger': 'male',
    'Chanter': 'male',

    // FEMALE-ONLY CLASSES (3)
    'Mystic': 'female',
    'Guardian': 'female',
    'Corsair': 'female'
};

/**
 * Portrait configurations with image paths
 * Each species needs one portrait per gender-locked class
 */
export const PORTRAIT_CONFIGS: AllPortraitConfigs = {
    'human': {
        // Male classes
        'Knight': {
            genderLocked: 'male',
            imagePath: '/World-Engine/assets/portraits-realistic/human-knight-male.png',
            description: 'Human warrior with heavy armor and weapons'
        },
        'Ranger': {
            genderLocked: 'male',
            imagePath: '/World-Engine/assets/portraits-realistic/human-ranger-male.png',
            description: 'Human scout and wasteland survivor'
        },
        'Chanter': {
            genderLocked: 'male',
            imagePath: '/World-Engine/assets/portraits-realistic/human-chanter-male.png',
            description: 'Human priest and bone singer'
        },

        // Female classes
        'Mystic': {
            genderLocked: 'female',
            imagePath: '/World-Engine/assets/portraits-realistic/human-mystic-female.png',
            description: 'Human spellcaster with elemental magic'
        },
        'Guardian': {
            genderLocked: 'female',
            imagePath: '/World-Engine/assets/portraits-realistic/human-guardian-female.png',
            description: 'Human nature protector and healer'
        },
        'Corsair': {
            genderLocked: 'female',
            imagePath: '/World-Engine/assets/portraits-realistic/human-corsair-female.jpg',
            description: 'Human sky pirate and void warrior'
        }
    },

    'sylvanborn': {
        // Male classes
        'Knight': {
            genderLocked: 'male',
            imagePath: '/World-Engine/assets/portraits-realistic/sylvanborn-knight-male.png',
            description: 'Sylvanborn warrior-druid with natural armor'
        },
        'Ranger': {
            genderLocked: 'male',
            imagePath: '/World-Engine/assets/portraits-realistic/sylvanborn-ranger-male.png',
            description: 'Sylvanborn forest wanderer and tracker'
        },
        'Chanter': {
            genderLocked: 'male',
            imagePath: '/World-Engine/assets/portraits-realistic/sylvanborn-chanter-male.png',
            description: 'Sylvanborn sage and ancient singer'
        },

        // Female classes
        'Mystic': {
            genderLocked: 'female',
            imagePath: '/World-Engine/assets/portraits-realistic/sylvanborn-mystic-female.png',
            description: 'Sylvanborn nature mage with plant magic'
        },
        'Guardian': {
            genderLocked: 'female',
            imagePath: '/World-Engine/assets/portraits-realistic/sylvanborn-guardian-female.png',
            description: 'Sylvanborn grove protector and life keeper'
        },
        'Corsair': {
            genderLocked: 'female',
            imagePath: '/World-Engine/assets/portraits-realistic/sylvanborn-corsair-female.jpg',
            description: 'Sylvanborn shadow dancer and void walker'
        }
    },

    'nightborn': {
        // Male classes
        'Knight': {
            genderLocked: 'male',
            imagePath: '/World-Engine/assets/portraits-realistic/nightborn-knight-male.png',
            description: 'Nightborn shadow warrior with dark armor'
        },
        'Ranger': {
            genderLocked: 'male',
            imagePath: '/World-Engine/assets/portraits-realistic/nightborn-ranger-male.png',
            description: 'Nightborn shadow scout and stalker'
        },
        'Chanter': {
            genderLocked: 'male',
            imagePath: '/World-Engine/assets/portraits-realistic/nightborn-chanter-male.png',
            description: 'Nightborn death priest and void singer'
        },

        // Female classes
        'Mystic': {
            genderLocked: 'female',
            imagePath: '/World-Engine/assets/portraits-realistic/nightborn-mystic-female.png',
            description: 'Nightborn shadow mage with void magic'
        },
        'Guardian': {
            genderLocked: 'female',
            imagePath: '/World-Engine/assets/portraits-realistic/nightborn-guardian-female.png',
            description: 'Nightborn dark protector and shadow healer'
        },
        'Corsair': {
            genderLocked: 'female',
            imagePath: '/World-Engine/assets/portraits-realistic/nightborn-corsair-female.jpg',
            description: 'Nightborn void pirate and darkness master'
        }
    },

    'stormcaller': {
        // Male classes
        'Knight': {
            genderLocked: 'male',
            imagePath: '/World-Engine/assets/portraits-realistic/stormcaller-knight-male.png',
            description: 'Stormcaller sky warrior with storm weapons'
        },
        'Ranger': {
            genderLocked: 'male',
            imagePath: '/World-Engine/assets/portraits-realistic/stormcaller-ranger-male.png',
            description: 'Stormcaller wind rider and weather tracker'
        },
        'Chanter': {
            genderLocked: 'male',
            imagePath: '/World-Engine/assets/portraits-realistic/stormcaller-chanter-male.png',
            description: 'Stormcaller storm priest and wind singer'
        },

        // Female classes
        'Mystic': {
            genderLocked: 'female',
            imagePath: '/World-Engine/assets/portraits-realistic/stormcaller-mystic-female.png',
            description: 'Stormcaller lightning mage with storm magic'
        },
        'Guardian': {
            genderLocked: 'female',
            imagePath: '/World-Engine/assets/portraits-realistic/stormcaller-guardian-female.png',
            description: 'Stormcaller sky protector and storm keeper'
        },
        'Corsair': {
            genderLocked: 'female',
            imagePath: '/World-Engine/assets/portraits-realistic/stormcaller-corsair-female.jpg',
            description: 'Stormcaller tempest pirate and void storm master'
        }
    }
};

/**
 * Get the gender lock for a specific archetype (applies to all species)
 */
export function getGenderLock(species: string, archetype: string): 'male' | 'female' | null {
    // Check global gender locks first - try exact match then case-insensitive
    let globalLock = GLOBAL_GENDER_LOCKS[archetype];
    if (!globalLock) {
        const archetypeKey = Object.keys(GLOBAL_GENDER_LOCKS).find(
            key => key.toLowerCase() === archetype.toLowerCase()
        );
        if (archetypeKey) {
            globalLock = GLOBAL_GENDER_LOCKS[archetypeKey];
        }
    }
    if (globalLock) return globalLock;

    // Fallback to species-specific config (for backwards compatibility)
    const speciesConfig = PORTRAIT_CONFIGS[species.toLowerCase()];
    if (!speciesConfig) return null;

    // Try exact match first, then case-insensitive match
    let classConfig = speciesConfig[archetype];
    if (!classConfig) {
        const archetypeKey = Object.keys(speciesConfig).find(
            key => key.toLowerCase() === archetype.toLowerCase()
        );
        if (archetypeKey) {
            classConfig = speciesConfig[archetypeKey];
        }
    }

    if (!classConfig) return null;

    return classConfig.genderLocked || null;
}

/**
 * Get the portrait image path for a species/archetype combination
 */
export function getPortraitImagePath(species: string, archetype: string, gender: string): string | null {
    const speciesConfig = PORTRAIT_CONFIGS[species.toLowerCase()];
    if (!speciesConfig) return null;

    // Try exact match first, then case-insensitive match
    let classConfig = speciesConfig[archetype];
    if (!classConfig) {
        // Try to find case-insensitive match
        const archetypeKey = Object.keys(speciesConfig).find(
            key => key.toLowerCase() === archetype.toLowerCase()
        );
        if (archetypeKey) {
            classConfig = speciesConfig[archetypeKey];
        }
    }

    if (!classConfig) return null;

    // Check if gender matches the lock (if any)
    const genderLock = getGenderLock(species, archetype);
    if (genderLock && genderLock !== gender) {
        return null;
    }

    return classConfig.imagePath || null;
}

/**
 * Check if a species/archetype combination is available for a given gender
 */
export function isValidGenderForClass(species: string, archetype: string, gender: string): boolean {
    const genderLock = getGenderLock(species, archetype);
    return genderLock === null || genderLock === gender;
}

/**
 * Get all available archetypes for a species and gender
 */
export function getAvailableArchetypes(species: string, gender: string, allArchetypes: string[]): string[] {
    return allArchetypes.filter(archetype =>
        isValidGenderForClass(species, archetype, gender)
    );
}