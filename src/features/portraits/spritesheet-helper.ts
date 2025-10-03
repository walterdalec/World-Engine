
/**
 * Spritesheet Helper for World Engine Portraits
 * Handles extraction from DENZI CC0 spritesheets
 */

export interface SpriteCoords {
    source: string;
    x: number;
    y: number;
    width: number;
    height: number;
}

export const SPRITE_MAPPINGS: Record<string, SpriteCoords> = {
    // Real character sprites from DENZI CC0 tileset
    'human_male_1': { source: 'denzi-tileset.png', x: 0, y: 0, width: 32, height: 32 },
    'human_female_1': { source: 'denzi-tileset.png', x: 32, y: 0, width: 32, height: 32 },
    'warrior_1': { source: 'denzi-monsters.png', x: 0, y: 0, width: 32, height: 48 },
    'mage_1': { source: 'denzi-monsters.png', x: 32, y: 0, width: 32, height: 48 },
    'rogue_1': { source: 'denzi-monsters.png', x: 64, y: 0, width: 32, height: 48 },
    
    // Add more mappings as needed...
};

/**
 * Extract sprite from spritesheet using canvas
 */
export function extractSpriteFromSheet(
    sourceCanvas: HTMLCanvasElement, 
    coords: SpriteCoords
): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = coords.width;
    canvas.height = coords.height;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');
    
    ctx.drawImage(
        sourceCanvas,
        coords.x, coords.y, coords.width, coords.height,
        0, 0, coords.width, coords.height
    );
    
    return canvas;
}

/**
 * Get character sprite mapping for World Engine species/archetype
 */
export function getCharacterSpriteMapping(species: string, archetype: string, gender: string): string | null {
    // Map World Engine characters to DENZI sprites
    const mappings: Record<string, string> = {
        'human_greenwarden_male': 'human_male_1',
        'human_greenwarden_female': 'human_female_1',
        'human_ashblade_male': 'warrior_1',
        'human_ashblade_female': 'warrior_1',
        'sylvanborn_greenwarden_male': 'human_male_1', // Fallback to human for now
        'sylvanborn_greenwarden_female': 'human_female_1',
        // Add more mappings...
    };
    
    const key = `${species}_${archetype}_${gender}`;
    return mappings[key] || null;
}
