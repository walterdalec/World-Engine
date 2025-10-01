import { generateCharacterPortrait } from './service';
import { CharacterVisualData } from './types';

/**
 * Preloads portraits for a list of characters
 */
export async function preloadPortraits(characters: CharacterVisualData[]): Promise<void> {
    console.log(`🔍 Preloading ${characters.length} portraits`);

    // Process in batches to avoid overwhelming the browser
    const batchSize = 3;
    const batches = [];

    for (let i = 0; i < characters.length; i += batchSize) {
        batches.push(characters.slice(i, i + batchSize));
    }

    for (const batch of batches) {
        await Promise.all(batch.map(character =>
            generateCharacterPortrait(character).catch((err: Error) =>
                console.error(`Failed to preload portrait for ${character.name}:`, err)
            )
        ));
    }

    console.log('✅ Portrait preloading complete');
}

/**
 * Preload portraits for common character combinations
 */
export async function preloadCommonPortraits(): Promise<void> {
    const commonCharacters: CharacterVisualData[] = [
        { name: 'Human Warrior', species: 'Human', archetype: 'Warrior', level: 1, appearance: {} },
        { name: 'Human Mage', species: 'Human', archetype: 'Mage', level: 1, appearance: {} },
        { name: 'Sylvanborn Ranger', species: 'Sylvanborn', archetype: 'Ranger', level: 1, appearance: {} },
    ];

    console.log(`🎭 Preloading ${commonCharacters.length} common character portraits...`);

    // Preload portraits in parallel
    const preloadPromises = commonCharacters.map(character =>
        generateCharacterPortrait(character).catch((err: Error) =>
            console.error(`Failed to preload portrait for ${character.name}:`, err)
        )
    );

    await Promise.all(preloadPromises);
    console.log('✅ Common portrait preloading complete');
}