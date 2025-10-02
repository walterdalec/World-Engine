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
    },

    'crystalborn': {
        // Male classes
        'Thorn Knight': {
            genderLocked: 'male',
            imagePath: '/assets/portraits-realistic/crystalborn-thorn-knight-male.jpg',
            description: 'Crystalborn gem warrior'
        },
        'Ashblade': {
            genderLocked: 'male',
            imagePath: '/assets/portraits-realistic/crystalborn-ashblade-male.jpg',
            description: 'Crystalborn crystal blade fighter'
        },
        'Dust Ranger': {
            genderLocked: 'male',
            imagePath: '/assets/portraits-realistic/crystalborn-dust-ranger-male.jpg',
            description: 'Crystalborn mineral scout'
        },
        'Stormcaller': {
            genderLocked: 'male',
            imagePath: '/assets/portraits-realistic/crystalborn-stormcaller-male.jpg',
            description: 'Crystalborn crystal mage'
        },
        'Sky Knight': {
            genderLocked: 'male',
            imagePath: '/assets/portraits-realistic/crystalborn-sky-knight-male.jpg',
            description: 'Crystalborn gem knight'
        },
        'Wind Sage': {
            genderLocked: 'male',
            imagePath: '/assets/portraits-realistic/crystalborn-wind-sage-male.jpg',
            description: 'Crystalborn crystal sage'
        },

        // Female classes
        'Greenwarden': {
            genderLocked: 'female',
            imagePath: '/assets/portraits-realistic/crystalborn-greenwarden-female.jpg',
            description: 'Crystalborn gem guardian'
        },
        'Sapling Adept': {
            genderLocked: 'female',
            imagePath: '/assets/portraits-realistic/crystalborn-sapling-adept-female.jpg',
            description: 'Crystalborn crystal student'
        },
        'Bloomcaller': {
            genderLocked: 'female',
            imagePath: '/assets/portraits-realistic/crystalborn-bloomcaller-female.jpg',
            description: 'Crystalborn gem speaker'
        },
        'Cinder Mystic': {
            genderLocked: 'female',
            imagePath: '/assets/portraits-realistic/crystalborn-cinder-mystic-female.jpg',
            description: 'Crystalborn fire crystal mage'
        },
        'Bonechanter': {
            genderLocked: 'female',
            imagePath: '/assets/portraits-realistic/crystalborn-bonechanter-female.jpg',
            description: 'Crystalborn crystal chanter'
        },
        'Voidwing': {
            genderLocked: 'female',
            imagePath: '/assets/portraits-realistic/crystalborn-voidwing-female.jpg',
            description: 'Crystalborn gem pirate'
        }
    },

    'draketh': {
        // Male classes
        'Thorn Knight': {
            genderLocked: 'male',
            imagePath: '/assets/portraits-realistic/draketh-thorn-knight-male.jpg',
            description: 'Draketh draconic warrior'
        },
        'Ashblade': {
            genderLocked: 'male',
            imagePath: '/assets/portraits-realistic/draketh-ashblade-male.jpg',
            description: 'Draketh flame-forged warrior'
        },
        'Dust Ranger': {
            genderLocked: 'male',
            imagePath: '/assets/portraits-realistic/draketh-dust-ranger-male.jpg',
            description: 'Draketh desert hunter'
        },
        'Stormcaller': {
            genderLocked: 'male',
            imagePath: '/assets/portraits-realistic/draketh-stormcaller-male.jpg',
            description: 'Draketh storm dragon'
        },
        'Sky Knight': {
            genderLocked: 'male',
            imagePath: '/assets/portraits-realistic/draketh-sky-knight-male.jpg',
            description: 'Draketh dragon knight'
        },
        'Wind Sage': {
            genderLocked: 'male',
            imagePath: '/assets/portraits-realistic/draketh-wind-sage-male.jpg',
            description: 'Draketh wind dragon'
        },

        // Female classes
        'Greenwarden': {
            genderLocked: 'female',
            imagePath: '/assets/portraits-realistic/draketh-greenwarden-female.jpg',
            description: 'Draketh nature dragon'
        },
        'Sapling Adept': {
            genderLocked: 'female',
            imagePath: '/assets/portraits-realistic/draketh-sapling-adept-female.jpg',
            description: 'Draketh growth dragon'
        },
        'Bloomcaller': {
            genderLocked: 'female',
            imagePath: '/assets/portraits-realistic/draketh-bloomcaller-female.jpg',
            description: 'Draketh flower dragon'
        },
        'Cinder Mystic': {
            genderLocked: 'female',
            imagePath: '/assets/portraits-realistic/draketh-cinder-mystic-female.jpg',
            description: 'Draketh fire dragoness'
        },
        'Bonechanter': {
            genderLocked: 'female',
            imagePath: '/assets/portraits-realistic/draketh-bonechanter-female.jpg',
            description: 'Draketh death dragon'
        },
        'Voidwing': {
            genderLocked: 'female',
            imagePath: '/assets/portraits-realistic/draketh-voidwing-female.jpg',
            description: 'Draketh void dragoness'
        }
    },

    'alloy': {
        // Male classes
        'Thorn Knight': {
            genderLocked: 'male',
            imagePath: '/assets/portraits-realistic/alloy-thorn-knight-male.jpg',
            description: 'Alloy mechanical warrior'
        },
        'Ashblade': {
            genderLocked: 'male',
            imagePath: '/assets/portraits-realistic/alloy-ashblade-male.jpg',
            description: 'Alloy steel blade master'
        },
        'Dust Ranger': {
            genderLocked: 'male',
            imagePath: '/assets/portraits-realistic/alloy-dust-ranger-male.jpg',
            description: 'Alloy mechanical scout'
        },
        'Stormcaller': {
            genderLocked: 'male',
            imagePath: '/assets/portraits-realistic/alloy-stormcaller-male.jpg',
            description: 'Alloy electric mage'
        },
        'Sky Knight': {
            genderLocked: 'male',
            imagePath: '/assets/portraits-realistic/alloy-sky-knight-male.jpg',
            description: 'Alloy flying construct'
        },
        'Wind Sage': {
            genderLocked: 'male',
            imagePath: '/assets/portraits-realistic/alloy-wind-sage-male.jpg',
            description: 'Alloy air processor'
        },

        // Female classes
        'Greenwarden': {
            genderLocked: 'female',
            imagePath: '/assets/portraits-realistic/alloy-greenwarden-female.jpg',
            description: 'Alloy nature construct'
        },
        'Sapling Adept': {
            genderLocked: 'female',
            imagePath: '/assets/portraits-realistic/alloy-sapling-adept-female.jpg',
            description: 'Alloy growth system'
        },
        'Bloomcaller': {
            genderLocked: 'female',
            imagePath: '/assets/portraits-realistic/alloy-bloomcaller-female.jpg',
            description: 'Alloy bio-interface'
        },
        'Cinder Mystic': {
            genderLocked: 'female',
            imagePath: '/assets/portraits-realistic/alloy-cinder-mystic-female.jpg',
            description: 'Alloy thermal mage'
        },
        'Bonechanter': {
            genderLocked: 'female',
            imagePath: '/assets/portraits-realistic/alloy-bonechanter-female.jpg',
            description: 'Alloy necro-tech'
        },
        'Voidwing': {
            genderLocked: 'female',
            imagePath: '/assets/portraits-realistic/alloy-voidwing-female.jpg',
            description: 'Alloy void engineer'
        }
    },

    'voidkin': {
        // Male classes
        'Thorn Knight': {
            genderLocked: 'male',
            imagePath: '/assets/portraits-realistic/voidkin-thorn-knight-male.jpg',
            description: 'Voidkin shadow warrior'
        },
        'Ashblade': {
            genderLocked: 'male',
            imagePath: '/assets/portraits-realistic/voidkin-ashblade-male.jpg',
            description: 'Voidkin void blade master'
        },
        'Dust Ranger': {
            genderLocked: 'male',
            imagePath: '/assets/portraits-realistic/voidkin-dust-ranger-male.jpg',
            description: 'Voidkin shadow scout'
        },
        'Stormcaller': {
            genderLocked: 'male',
            imagePath: '/assets/portraits-realistic/voidkin-stormcaller-male.jpg',
            description: 'Voidkin void storm mage'
        },
        'Sky Knight': {
            genderLocked: 'male',
            imagePath: '/assets/portraits-realistic/voidkin-sky-knight-male.jpg',
            description: 'Voidkin shadow knight'
        },
        'Wind Sage': {
            genderLocked: 'male',
            imagePath: '/assets/portraits-realistic/voidkin-wind-sage-male.jpg',
            description: 'Voidkin void sage'
        },

        // Female classes
        'Greenwarden': {
            genderLocked: 'female',
            imagePath: '/assets/portraits-realistic/voidkin-greenwarden-female.jpg',
            description: 'Voidkin shadow guardian'
        },
        'Sapling Adept': {
            genderLocked: 'female',
            imagePath: '/assets/portraits-realistic/voidkin-sapling-adept-female.jpg',
            description: 'Voidkin void mage'
        },
        'Bloomcaller': {
            genderLocked: 'female',
            imagePath: '/assets/portraits-realistic/voidkin-bloomcaller-female.jpg',
            description: 'Voidkin shadow speaker'
        },
        'Cinder Mystic': {
            genderLocked: 'female',
            imagePath: '/assets/portraits-realistic/voidkin-cinder-mystic-female.jpg',
            description: 'Voidkin void fire mage'
        },
        'Bonechanter': {
            genderLocked: 'female',
            imagePath: '/assets/portraits-realistic/voidkin-bonechanter-female.jpg',
            description: 'Voidkin void chanter'
        },
        'Voidwing': {
            genderLocked: 'female',
            imagePath: '/assets/portraits-realistic/voidkin-voidwing-female.jpg',
            description: 'Voidkin void corsair'
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