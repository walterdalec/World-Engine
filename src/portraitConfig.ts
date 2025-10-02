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
    // MALE-ONLY CLASSES (6)
    'Thorn Knight': 'male',
    'Ashblade': 'male',
    'Dust Ranger': 'male',
    'Stormcaller': 'male',
    'Sky Knight': 'male',
    'Wind Sage': 'male',

    // FEMALE-ONLY CLASSES (6)
    'Greenwarden': 'female',
    'Sapling Adept': 'female',
    'Bloomcaller': 'female',
    'Cinder Mystic': 'female',
    'Bonechanter': 'female',
    'Voidwing': 'female'
};

/**
 * Portrait configurations with image paths
 * Each species needs one portrait per gender-locked class
 */
export const PORTRAIT_CONFIGS: AllPortraitConfigs = {
    'human': {
        // Male classes
        'Thorn Knight': {
            genderLocked: 'male',
            imagePath: '/assets/portraits-realistic/human-thorn-knight-male.jpg',
            description: 'Human warrior with thorn-covered armor'
        },
        'Ashblade': {
            genderLocked: 'male',
            imagePath: '/assets/portraits-realistic/human-ashblade-male.jpg',
            description: 'Human warrior with ash-forged blade'
        },
        'Dust Ranger': {
            genderLocked: 'male',
            imagePath: '/assets/portraits-realistic/human-dust-ranger-male.jpg',
            description: 'Human desert scout and survivor'
        },
        'Stormcaller': {
            genderLocked: 'male',
            imagePath: '/assets/portraits-realistic/human-stormcaller-male.jpg',
            description: 'Human lightning mage'
        },
        'Sky Knight': {
            genderLocked: 'male',
            imagePath: '/assets/portraits-realistic/human-sky-knight-male.jpg',
            description: 'Human aerial cavalry warrior'
        },
        'Wind Sage': {
            genderLocked: 'male',
            imagePath: '/assets/portraits-realistic/human-wind-sage-male.jpg',
            description: 'Human scholarly monk of air magic'
        },

        // Female classes
        'Greenwarden': {
            genderLocked: 'female',
            imagePath: '/assets/portraits-realistic/human-greenwarden-female.jpg',
            description: 'Human nature guardian'
        },
        'Sapling Adept': {
            genderLocked: 'female',
            imagePath: '/assets/portraits-realistic/human-sapling-adept-female.jpg',
            description: 'Human nature magic student'
        },
        'Bloomcaller': {
            genderLocked: 'female',
            imagePath: '/assets/portraits-realistic/human-bloomcaller-female.jpg',
            description: 'Human diplomatic plant speaker'
        },
        'Cinder Mystic': {
            genderLocked: 'female',
            imagePath: '/assets/portraits-realistic/human-cinder-mystic-female.jpg',
            description: 'Human fire sorceress'
        },
        'Bonechanter': {
            genderLocked: 'female',
            imagePath: '/assets/portraits-realistic/human-bonechanter-female.jpg',
            description: 'Human necromantic priest'
        },
        'Voidwing': {
            genderLocked: 'female',
            imagePath: '/assets/portraits-realistic/human-voidwing-female.jpg',
            description: 'Human sky pirate'
        }
    },

    'sylvanborn': {
        // Male classes
        'Thorn Knight': {
            genderLocked: 'male',
            imagePath: '/assets/portraits-realistic/sylvanborn-thorn-knight-male.jpg',
            description: 'Sylvanborn warrior-druid'
        },
        'Ashblade': {
            genderLocked: 'male',
            imagePath: '/assets/portraits-realistic/sylvanborn-ashblade-male.jpg',
            description: 'Sylvanborn ash warrior'
        },
        'Dust Ranger': {
            genderLocked: 'male',
            imagePath: '/assets/portraits-realistic/sylvanborn-dust-ranger-male.jpg',
            description: 'Sylvanborn desert wanderer'
        },
        'Stormcaller': {
            genderLocked: 'male',
            imagePath: '/assets/portraits-realistic/sylvanborn-stormcaller-male.jpg',
            description: 'Sylvanborn storm mage'
        },
        'Sky Knight': {
            genderLocked: 'male',
            imagePath: '/assets/portraits-realistic/sylvanborn-sky-knight-male.jpg',
            description: 'Sylvanborn aerial knight'
        },
        'Wind Sage': {
            genderLocked: 'male',
            imagePath: '/assets/portraits-realistic/sylvanborn-wind-sage-male.jpg',
            description: 'Sylvanborn air mystic'
        },

        // Female classes
        'Greenwarden': {
            genderLocked: 'female',
            imagePath: '/assets/portraits-realistic/sylvanborn-greenwarden-female.jpg',
            description: 'Sylvanborn nature guardian'
        },
        'Sapling Adept': {
            genderLocked: 'female',
            imagePath: '/assets/portraits-realistic/sylvanborn-sapling-adept-female.jpg',
            description: 'Sylvanborn plant mage'
        },
        'Bloomcaller': {
            genderLocked: 'female',
            imagePath: '/assets/portraits-realistic/sylvanborn-bloomcaller-female.jpg',
            description: 'Sylvanborn flower diplomat'
        },
        'Cinder Mystic': {
            genderLocked: 'female',
            imagePath: '/assets/portraits-realistic/sylvanborn-cinder-mystic-female.jpg',
            description: 'Sylvanborn flame sorceress'
        },
        'Bonechanter': {
            genderLocked: 'female',
            imagePath: '/assets/portraits-realistic/sylvanborn-bonechanter-female.jpg',
            description: 'Sylvanborn bone singer'
        },
        'Voidwing': {
            genderLocked: 'female',
            imagePath: '/assets/portraits-realistic/sylvanborn-voidwing-female.jpg',
            description: 'Sylvanborn void pirate'
        }
    },

    'nightborn': {
        // Male classes
        'Thorn Knight': {
            genderLocked: 'male',
            imagePath: '/assets/portraits-realistic/nightborn-thorn-knight-male.jpg',
            description: 'Nightborn shadow warrior'
        },
        'Ashblade': {
            genderLocked: 'male',
            imagePath: '/assets/portraits-realistic/nightborn-ashblade-male.jpg',
            description: 'Nightborn ash blade master'
        },
        'Dust Ranger': {
            genderLocked: 'male',
            imagePath: '/assets/portraits-realistic/nightborn-dust-ranger-male.jpg',
            description: 'Nightborn wasteland scout'
        },
        'Stormcaller': {
            genderLocked: 'male',
            imagePath: '/assets/portraits-realistic/nightborn-stormcaller-male.jpg',
            description: 'Nightborn lightning wielder'
        },
        'Sky Knight': {
            genderLocked: 'male',
            imagePath: '/assets/portraits-realistic/nightborn-sky-knight-male.jpg',
            description: 'Nightborn sky guardian'
        },
        'Wind Sage': {
            genderLocked: 'male',
            imagePath: '/assets/portraits-realistic/nightborn-wind-sage-male.jpg',
            description: 'Nightborn air philosopher'
        },

        // Female classes
        'Greenwarden': {
            genderLocked: 'female',
            imagePath: '/assets/portraits-realistic/nightborn-greenwarden-female.jpg',
            description: 'Nightborn nature protector'
        },
        'Sapling Adept': {
            genderLocked: 'female',
            imagePath: '/assets/portraits-realistic/nightborn-sapling-adept-female.jpg',
            description: 'Nightborn growth mage'
        },
        'Bloomcaller': {
            genderLocked: 'female',
            imagePath: '/assets/portraits-realistic/nightborn-bloomcaller-female.jpg',
            description: 'Nightborn plant speaker'
        },
        'Cinder Mystic': {
            genderLocked: 'female',
            imagePath: '/assets/portraits-realistic/nightborn-cinder-mystic-female.jpg',
            description: 'Nightborn fire mystic'
        },
        'Bonechanter': {
            genderLocked: 'female',
            imagePath: '/assets/portraits-realistic/nightborn-bonechanter-female.jpg',
            description: 'Nightborn death singer'
        },
        'Voidwing': {
            genderLocked: 'female',
            imagePath: '/assets/portraits-realistic/nightborn-voidwing-female.jpg',
            description: 'Nightborn void corsair'
        }
    },

    'stormcaller': {
        // Male classes
        'Thorn Knight': {
            genderLocked: 'male',
            imagePath: '/assets/portraits-realistic/stormcaller-thorn-knight-male.jpg',
            description: 'Stormcaller elemental warrior'
        },
        'Ashblade': {
            genderLocked: 'male',
            imagePath: '/assets/portraits-realistic/stormcaller-ashblade-male.jpg',
            description: 'Stormcaller storm-forged warrior'
        },
        'Dust Ranger': {
            genderLocked: 'male',
            imagePath: '/assets/portraits-realistic/stormcaller-dust-ranger-male.jpg',
            description: 'Stormcaller weather tracker'
        },
        'Stormcaller': {
            genderLocked: 'male',
            imagePath: '/assets/portraits-realistic/stormcaller-stormcaller-male.jpg',
            description: 'Stormcaller lightning master'
        },
        'Sky Knight': {
            genderLocked: 'male',
            imagePath: '/assets/portraits-realistic/stormcaller-sky-knight-male.jpg',
            description: 'Stormcaller storm rider'
        },
        'Wind Sage': {
            genderLocked: 'male',
            imagePath: '/assets/portraits-realistic/stormcaller-wind-sage-male.jpg',
            description: 'Stormcaller wind master'
        },

        // Female classes
        'Greenwarden': {
            genderLocked: 'female',
            imagePath: '/assets/portraits-realistic/stormcaller-greenwarden-female.jpg',
            description: 'Stormcaller storm guardian'
        },
        'Sapling Adept': {
            genderLocked: 'female',
            imagePath: '/assets/portraits-realistic/stormcaller-sapling-adept-female.jpg',
            description: 'Stormcaller weather mage'
        },
        'Bloomcaller': {
            genderLocked: 'female',
            imagePath: '/assets/portraits-realistic/stormcaller-bloomcaller-female.jpg',
            description: 'Stormcaller storm speaker'
        },
        'Cinder Mystic': {
            genderLocked: 'female',
            imagePath: '/assets/portraits-realistic/stormcaller-cinder-mystic-female.jpg',
            description: 'Stormcaller lightning sorceress'
        },
        'Bonechanter': {
            genderLocked: 'female',
            imagePath: '/assets/portraits-realistic/stormcaller-bonechanter-female.jpg',
            description: 'Stormcaller storm chanter'
        },
        'Voidwing': {
            genderLocked: 'female',
            imagePath: '/assets/portraits-realistic/stormcaller-voidwing-female.jpg',
            description: 'Stormcaller tempest pirate'
        }
    }
};

/**
 * Get the gender lock for a specific archetype (applies to all species)
 */
export function getGenderLock(species: string, archetype: string): 'male' | 'female' | null {
    // Check global gender locks first
    const globalLock = GLOBAL_GENDER_LOCKS[archetype];
    if (globalLock) return globalLock;

    // Fallback to species-specific config (for backwards compatibility)
    const speciesConfig = PORTRAIT_CONFIGS[species.toLowerCase()];
    if (!speciesConfig) return null;

    const classConfig = speciesConfig[archetype];
    if (!classConfig) return null;

    return classConfig.genderLocked || null;
}

/**
 * Get the portrait image path for a species/archetype combination
 */
export function getPortraitImagePath(species: string, archetype: string, gender: string): string | null {
    const speciesConfig = PORTRAIT_CONFIGS[species.toLowerCase()];
    if (!speciesConfig) return null;

    const classConfig = speciesConfig[archetype];
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