/**
 * Simple PNG Portrait System - Working Backup with Placeholders
 * Temporary solution while GitHub Pages asset deployment is resolved
 */

export interface PortraitLayer {
    type: 'base' | 'race' | 'class' | 'deco';
    src: string;
    zIndex: number;
}

export interface SimplePortraitOptions {
    gender: 'male' | 'female';
    species: string;
    archetype: string;
    decorations?: string[];
    size?: { width: number; height: number };
}

export interface PortraitResult {
    success: boolean;
    layers: PortraitLayer[];
    dataUrl?: string;
    error?: string;
}

/**
 * Generate a colored placeholder portrait until assets are working
 */
function generatePlaceholderPortrait(species: string, archetype: string, gender: string): string {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;

    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    // Species-based colors
    const speciesColors: Record<string, string> = {
        'human': '#FFB366',
        'sylvanborn': '#90EE90',
        'alloy': '#C0C0C0',
        'draketh': '#DC143C',
        'voidkin': '#4B0082',
        'crystalborn': '#98D8FF',
        'stormcaller': '#FFD700'
    };

    // Archetype-based accents
    const archetypeAccents: Record<string, string> = {
        'greenwarden': '#228B22',
        'ashblade': '#FF4500',
        'stormcaller': '#1E90FF',
        'bonechanter': '#8B4513',
        'voidwing': '#800080',
        'wind sage': '#87CEEB',
        'sky knight': '#4169E1',
        'dust ranger': '#D2B48C',
        'cinder mystic': '#FF6347',
        'thorn knight': '#8FBC8F',
        'sapling adept': '#9ACD32',
        'bloomcaller': '#FF69B4'
    };

    const primaryColor = speciesColors[species.toLowerCase()] || '#808080';
    const accentColor = archetypeAccents[archetype.toLowerCase()] || '#404040';

    // Draw background
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, 128, 128);

    // Draw character silhouette
    ctx.fillStyle = primaryColor;
    ctx.fillRect(32, 32, 64, 80); // Body
    ctx.fillRect(48, 16, 32, 32); // Head

    // Add accent details
    ctx.fillStyle = accentColor;
    ctx.fillRect(40, 40, 48, 12); // Chest accent

    // Add simple facial features
    ctx.fillStyle = '#000000';
    ctx.fillRect(56, 24, 3, 3); // Left eye
    ctx.fillRect(69, 24, 3, 3); // Right eye
    ctx.fillRect(60, 32, 8, 2); // Mouth

    // Add gender indicator
    if (gender === 'female') {
        ctx.fillStyle = '#FF69B4';
        ctx.fillRect(60, 12, 8, 4); // Hair ribbon
    } else {
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(58, 14, 12, 2); // Facial hair
    }

    // Add species/archetype text
    ctx.fillStyle = '#000000';
    ctx.font = '8px monospace';
    ctx.fillText(species.substring(0, 8), 4, 120);
    ctx.fillText(archetype.substring(0, 8), 4, 110);

    console.log(`🎨 Generated placeholder portrait: ${gender} ${species} ${archetype}`);
    return canvas.toDataURL('image/png');
}

/**
 * Main portrait generation function - simplified for placeholder mode
 */
export async function generateSimplePortrait(options: SimplePortraitOptions): Promise<PortraitResult> {
    try {
        const { gender, species, archetype } = options;

        console.log(`🎭 Generating placeholder portrait: ${gender} ${species} ${archetype}`);

        // Generate placeholder directly
        const dataUrl = generatePlaceholderPortrait(species, archetype, gender);

        return {
            success: true,
            layers: [{
                type: 'base',
                src: dataUrl,
                zIndex: 1
            }],
            dataUrl
        };

    } catch (error) {
        console.error('🎭 Portrait generation error:', error);
        return {
            success: false,
            layers: [],
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

/**
 * Simple caching for generated portraits
 */
const portraitCache = new Map<string, PortraitResult>();

export function getCachedPortrait(options: SimplePortraitOptions): PortraitResult | null {
    const key = JSON.stringify(options);
    return portraitCache.get(key) || null;
}

export function setCachedPortrait(options: SimplePortraitOptions, result: PortraitResult): void {
    const key = JSON.stringify(options);
    portraitCache.set(key, result);
}