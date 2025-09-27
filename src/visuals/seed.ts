// Deterministic Random Generation System
// Provides consistent, seed-based randomization for character visuals

/**
 * Simple Linear Congruential Generator for deterministic randomization
 */
class SeededRandom {
    private seed: number;
    private current: number;

    constructor(seed: string | number) {
        if (typeof seed === 'string') {
            // Convert string to number using simple hash
            this.seed = this.hashString(seed);
        } else {
            this.seed = seed;
        }
        this.current = this.seed;
    }

    /**
     * Hash string to number
     */
    private hashString(str: string): number {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash);
    }

    /**
     * Generate next random number (0-1)
     */
    random(): number {
        // LCG formula: (a * seed + c) % m
        const a = 1664525;
        const c = 1013904223;
        const m = Math.pow(2, 32);

        this.current = (a * this.current + c) % m;
        return this.current / m;
    }

    /**
     * Generate random integer in range [min, max)
     */
    randomInt(min: number, max: number): number {
        return Math.floor(this.random() * (max - min)) + min;
    }

    /**
     * Choose random element from array
     */
    choose<T>(array: T[]): T {
        if (array.length === 0) throw new Error('Cannot choose from empty array');
        return array[this.randomInt(0, array.length)];
    }

    /**
     * Shuffle array (Fisher-Yates)
     */
    shuffle<T>(array: T[]): T[] {
        const result = [...array];
        for (let i = result.length - 1; i > 0; i--) {
            const j = this.randomInt(0, i + 1);
            [result[i], result[j]] = [result[j], result[i]];
        }
        return result;
    }

    /**
     * Generate weighted random choice
     */
    weightedChoose<T>(items: Array<{ item: T; weight: number }>): T {
        const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
        let randomValue = this.random() * totalWeight;

        for (const { item, weight } of items) {
            randomValue -= weight;
            if (randomValue <= 0) {
                return item;
            }
        }

        // Fallback to last item
        return items[items.length - 1].item;
    }

    /**
     * Reset to original seed
     */
    reset(): void {
        this.current = this.seed;
    }
}

/**
 * Generate character-specific seed from character data
 */
export function generateCharacterSeed(characterData: {
    name: string;
    species: string;
    archetype: string;
    level?: number;
}): string {
    return `${characterData.name}_${characterData.species}_${characterData.archetype}_${characterData.level || 1}`;
}

/**
 * Create seeded random generator for character
 */
export function createCharacterRandom(characterData: {
    name: string;
    species: string;
    archetype: string;
    level?: number;
}): SeededRandom {
    const seed = generateCharacterSeed(characterData);
    return new SeededRandom(seed);
}

/**
 * Generate consistent visual variations based on character
 */
export function generateVisualVariation<T>(
    characterData: { name: string; species: string; archetype: string },
    options: T[],
    variationKey?: string
): T {
    const seed = generateCharacterSeed(characterData) + (variationKey || '');
    const rng = new SeededRandom(seed);
    return rng.choose(options);
}

/**
 * Generate multiple consistent variations
 */
export function generateMultipleVariations<T>(
    characterData: { name: string; species: string; archetype: string },
    optionsMap: Record<string, T[]>
): Record<string, T> {
    const baseRng = createCharacterRandom(characterData);
    const result: Record<string, T> = {};

    for (const [key, options] of Object.entries(optionsMap)) {
        // Use different seeds for each variation type
        const variationRng = new SeededRandom(baseRng.randomInt(1, 1000000));
        result[key] = variationRng.choose(options);
    }

    return result;
}

/**
 * Color variation utilities
 */
export const ColorVariations = {
    /**
     * Generate color variations based on species
     */
    forSpecies(species: string, rng: SeededRandom): {
        skinTone: string;
        hairColor: string;
        eyeColor: string;
    } {
        const variations: Record<string, any> = {
            'Human': {
                skinTone: rng.choose(['fair', 'light', 'medium', 'olive', 'tan', 'dark']),
                hairColor: rng.choose(['blonde', 'brown', 'black', 'red', 'auburn']),
                eyeColor: rng.choose(['blue', 'brown', 'green', 'hazel', 'gray'])
            },
            'Sylvanborn': {
                skinTone: rng.choose(['fair', 'pale-green', 'bark-brown', 'olive']),
                hairColor: rng.choose(['green', 'brown', 'autumn-red', 'silver']),
                eyeColor: rng.choose(['green', 'gold', 'amber', 'forest-green'])
            },
            'Nightborn': {
                skinTone: rng.choose(['pale', 'ashen', 'moonlight', 'silver-pale']),
                hairColor: rng.choose(['black', 'silver', 'white', 'midnight-blue']),
                eyeColor: rng.choose(['violet', 'silver', 'pale-blue', 'starlight'])
            },
            'Stormcaller': {
                skinTone: rng.choose(['bronzed', 'storm-gray', 'sky-blue', 'medium']),
                hairColor: rng.choose(['white', 'silver', 'storm-gray', 'lightning-blue']),
                eyeColor: rng.choose(['blue', 'electric-blue', 'storm-gray', 'silver'])
            },
            'Crystalborn': {
                skinTone: rng.choose(['crystalline', 'translucent', 'prismatic', 'gem-like']),
                hairColor: rng.choose(['crystal', 'prismatic', 'diamond', 'sapphire']),
                eyeColor: rng.choose(['prismatic', 'crystal-blue', 'emerald', 'diamond'])
            },
            'Draketh': {
                skinTone: rng.choose(['scaled-red', 'scaled-green', 'scaled-blue', 'scaled-gold']),
                hairColor: rng.choose(['red', 'gold', 'copper', 'bronze']),
                eyeColor: rng.choose(['gold', 'amber', 'red', 'copper'])
            },
            'Alloy': {
                skinTone: rng.choose(['metallic', 'bronze', 'copper', 'steel-gray']),
                hairColor: rng.choose(['copper', 'bronze', 'steel', 'chrome']),
                eyeColor: rng.choose(['silver', 'copper', 'steel-blue', 'chrome'])
            },
            'Voidkin': {
                skinTone: rng.choose(['void-black', 'starlight', 'nebula', 'cosmic']),
                hairColor: rng.choose(['void-black', 'starlight', 'nebula', 'cosmic']),
                eyeColor: rng.choose(['starlight', 'void-black', 'nebula', 'cosmic'])
            }
        };

        return variations[species] || variations['Human'];
    }
};

export { SeededRandom };