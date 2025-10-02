/**
 * Character validation using TypeScript types
 * Provides type safety and basic validation
 */

// Base types for validation
export type Species = 'Human' | 'Sylvanborn' | 'Nightborn' | 'Stormcaller';
export type World = 'Verdance' | 'Ashenreach' | 'Skyvault';
export type Gender = 'male' | 'female' | 'other';

// Stats validation (D&D style point-buy)
export interface CharacterStats {
    might: number;
    agility: number;
    intellect: number;
    awareness: number;
}

// Equipment validation
export interface CharacterEquipment {
    weapon?: string;
    armor?: string;
    items: string[];
}

// Abilities validation
export interface CharacterAbility {
    name: string;
    description: string;
    cooldown?: number;
    damage?: string;
    effect?: string;
}

// Main character interface
export interface Character {
    // Core identity
    name: string;
    species: Species;
    archetype: string;
    world: World;

    // Demographics
    age?: number;
    gender?: Gender;
    pronouns: string;

    // Game mechanics
    stats: CharacterStats;
    level: number;
    experience: number;
    hitPoints: number;

    // Equipment and abilities
    equipment: CharacterEquipment;
    abilities: CharacterAbility[];

    // Background and traits
    background?: string;
    traits: string[];
    flaws: string[];
    bonds: string[];

    // Map-related data (for procedural generation)
    startingLocation?: {
        world: World;
        region?: string;
        coordinates?: {
            x: number;
            y: number;
        };
    };

    // Visual data
    portraitUrl?: string;
    portraitData?: {
        species: string;
        archetype: string;
        gender: string;
        customizations?: Record<string, any>;
    };

    // Metadata
    createdAt: Date;
    lastModified: Date;
    version: string;
}

/**
 * Simple validation helpers
 */
export const validateCharacter = (data: any): Character => {
    // Basic validation
    if (!data.name || typeof data.name !== 'string') {
        throw new Error('Character name is required');
    }
    if (!data.species || !isValidSpecies(data.species)) {
        throw new Error('Valid species is required');
    }
    if (!data.world || !isValidWorld(data.world)) {
        throw new Error('Valid world is required');
    }

    return data as Character;
};

export const validatePartialCharacter = (data: any): Partial<Character> => {
    return data as Partial<Character>;
};

export const isValidSpecies = (species: string): species is Species => {
    return ['Human', 'Sylvanborn', 'Nightborn', 'Stormcaller'].includes(species);
};

export const isValidWorld = (world: string): world is World => {
    return ['Verdance', 'Ashenreach', 'Skyvault'].includes(world);
};

export const isValidGender = (gender: string): gender is Gender => {
    return ['male', 'female', 'other'].includes(gender);
};

/**
 * Character factory with defaults
 */
export const createEmptyCharacter = (): Partial<Character> => ({
    name: '',
    species: undefined,
    archetype: '',
    world: undefined,
    stats: {
        might: 10,
        agility: 10,
        intellect: 10,
        awareness: 10
    },
    level: 1,
    experience: 0,
    hitPoints: 10,
    equipment: { items: [] },
    abilities: [],
    traits: [],
    flaws: [],
    bonds: [],
    pronouns: "they/them"
});

/**
 * Map-specific validation for procedural generation
 */
export interface MapData {
    character: Character;
    worldSettings: {
        climate: 'temperate' | 'arctic' | 'desert' | 'tropical';
        terrain: 'plains' | 'mountains' | 'forest' | 'swamp' | 'coast';
        dangerLevel: number; // 1-10
        populationDensity: 'sparse' | 'moderate' | 'dense';
    };
    partyData?: Character[];
}