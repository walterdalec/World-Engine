/**
 * Simple PNG Portrait System
 * Replaces the complex SVG system with straightforward PNG layering
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
 * Try to extract a character sprite from the DENZI spritesheets
 */
async function trySpritesheetCharacter(species: string, archetype: string, gender: string): Promise<string | null> {
    try {
        // Simple character mapping to DENZI spritesheet coordinates
        const characterMappings: Record<string, { sheet: string; x: number; y: number; w: number; h: number }> = {
            'human_greenwarden': { sheet: 'denzi-tileset.png', x: 0, y: 0, w: 32, h: 32 },
            'human_ashblade': { sheet: 'denzi-tileset.png', x: 32, y: 0, w: 32, h: 32 },
            'sylvanborn_greenwarden': { sheet: 'denzi-tileset.png', x: 64, y: 0, w: 32, h: 32 },
            'draketh_stormcaller': { sheet: 'denzi-monsters.png', x: 0, y: 0, w: 32, h: 48 },
            'alloy_stormcaller': { sheet: 'denzi-monsters.png', x: 32, y: 0, w: 32, h: 48 },
            'voidkin_voidwing': { sheet: 'denzi-monsters.png', x: 64, y: 0, w: 32, h: 48 },
            'crystalborn_skyknight': { sheet: 'denzi-monsters.png', x: 96, y: 0, w: 32, h: 48 },
            // Add fallback for any combination
            'default': { sheet: 'denzi-tileset.png', x: 0, y: 32, w: 32, h: 32 }
        };

        const key = `${species}_${archetype}`;
        const mapping = characterMappings[key] || characterMappings['default'];

        // Extract sprite from spritesheet
        const spriteUrl = await extractSpriteFromSheet(mapping.sheet, mapping.x, mapping.y, mapping.w, mapping.h);
        return spriteUrl;

    } catch (error) {
        console.log(`🔄 No spritesheet character found for ${species} ${archetype}, using fallback`);
        return null;
    }
}

/**
 * Extract a sprite from a spritesheet using canvas
 */
async function extractSpriteFromSheet(sheetName: string, x: number, y: number, w: number, h: number): Promise<string> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';

        img.onload = () => {
            // Create canvas for extracted sprite
            const canvas = document.createElement('canvas');
            canvas.width = w * 4; // Scale up 4x for better visibility
            canvas.height = h * 4;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error('Could not get canvas context'));
                return;
            }

            // Draw the sprite section from the sheet, scaled up
            ctx.imageSmoothingEnabled = false; // Pixel art should stay crisp
            ctx.drawImage(img, x, y, w, h, 0, 0, w * 4, h * 4);

            // Convert to data URL
            const dataUrl = canvas.toDataURL('image/png');
            console.log(`🎨 Extracted sprite from ${sheetName} at (${x},${y}) -> ${dataUrl.length} bytes`);
            resolve(dataUrl);
        };

        img.onerror = () => {
            console.log(`❌ Failed to load spritesheet: ${sheetName}`);
            reject(new Error(`Failed to load spritesheet: ${sheetName}`));
        };

        img.src = getAssetUrl(`portraits-new/${sheetName}`);
    });
}

/**
 * Generate portrait using PNG layering system with spritesheet fallbacks
 */
export async function generateSimplePortrait(options: SimplePortraitOptions): Promise<PortraitResult> {
    try {
        const { gender, species, archetype, decorations = [], size = { width: 300, height: 380 } } = options;

        console.log(`🎭 Generating portrait: ${gender} ${species} ${archetype}`);

        // First, try to use a character from the DENZI spritesheets as primary portrait
        const spritesheetCharacter = await trySpritesheetCharacter(species, archetype, gender);
        if (spritesheetCharacter) {
            console.log(`✨ Using spritesheet character for ${species} ${archetype}`);
            return {
                success: true,
                layers: [{
                    type: 'base',
                    src: spritesheetCharacter,
                    zIndex: 1
                }],
                dataUrl: spritesheetCharacter
            };
        }

        // Fallback to layered system with placeholder files
        console.log(`🔄 Falling back to layered placeholder system`);
        const layers: PortraitLayer[] = [];

        // Base layer (gender-specific) - always include
        const basePath = getAssetUrl(`portraits-new/base/${gender}/neutral.png`);
        console.log(`🎭 Base layer: ${basePath}`);
        layers.push({
            type: 'base',
            src: basePath,
            zIndex: 1
        });

        // Race layer (species overlay) - always include  
        const racePath = getAssetUrl(`portraits-new/race/${species}.png`);
        console.log(`🎭 Race layer: ${racePath}`);
        layers.push({
            type: 'race',
            src: racePath,
            zIndex: 2
        });

        // Class layer (archetype overlay) - always include
        const classPath = getAssetUrl(`portraits-new/class/${archetype}.png`);
        console.log(`🎭 Class layer: ${classPath}`);
        layers.push({
            type: 'class',
            src: classPath,
            zIndex: 3
        });

        // Optional decoration layers
        decorations.forEach((deco, index) => {
            const decoPath = getAssetUrl(`portraits-new/deco/${deco}.png`);
            layers.push({
                type: 'deco',
                src: decoPath,
                zIndex: 10 + index
            });
        });

        console.log(`🎭 Total layers planned: ${layers.length}`);

        // Generate composite image
        const dataUrl = await compositeImages(layers, size);

        return {
            success: true,
            layers,
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
 * Composite multiple PNG layers into a single image
 */
async function compositeImages(layers: PortraitLayer[], size: { width: number; height: number }): Promise<string> {
    return new Promise((resolve, reject) => {
        console.log(`🎨 Starting canvas composite with ${layers.length} layers`);

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
            console.error('🎨 Canvas context not available');
            reject(new Error('Canvas context not available'));
            return;
        }

        canvas.width = size.width;
        canvas.height = size.height;

        // Clear canvas with transparent background
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        console.log(`🎨 Canvas initialized: ${canvas.width}x${canvas.height}`);

        // Load and draw all layers
        const loadPromises = layers
            .sort((a, b) => a.zIndex - b.zIndex) // Draw in z-order
            .map(layer => loadAndDrawLayer(ctx, layer, size));

        Promise.all(loadPromises)
            .then(() => {
                console.log(`🎨 All layers processed, generating data URL`);
                const dataUrl = canvas.toDataURL('image/png');
                console.log(`🎨 Data URL generated, length: ${dataUrl.length}`);
                resolve(dataUrl);
            })
            .catch((error) => {
                console.error('🎨 Canvas composite error:', error);
                reject(error);
            });
    });
}

/**
 * Load and draw a single layer onto canvas
 */
function loadAndDrawLayer(
    ctx: CanvasRenderingContext2D,
    layer: PortraitLayer,
    size: { width: number; height: number }
): Promise<void> {
    return new Promise((resolve) => {
        const img = new Image();

        img.onload = () => {
            try {
                console.log(`✅ Loaded layer: ${layer.type} from ${layer.src}`);
                // Scale and center the image
                const scale = Math.min(size.width / img.width, size.height / img.height);
                const scaledWidth = img.width * scale;
                const scaledHeight = img.height * scale;
                const x = (size.width - scaledWidth) / 2;
                const y = (size.height - scaledHeight) / 2;

                ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
                resolve();
            } catch (error) {
                console.warn(`❌ Failed to draw layer: ${layer.type} - ${error}`);
                resolve();
            }
        };

        img.onerror = (e) => {
            console.warn(`❌ Failed to load layer: ${layer.type} from ${layer.src}`);
            resolve();
        };

        console.log(`🔄 Loading layer: ${layer.type} from ${layer.src}`);
        img.src = layer.src;
    });
}

/**
 * Get asset URL with proper base path handling
 */
function getAssetUrl(path: string): string {
    // For local development, use relative paths
    // For production (GitHub Pages), use the PUBLIC_URL
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

    if (isLocal) {
        const basePath = `assets/${path}`;
        console.log(`🔗 Local asset URL: ${basePath}`);
        return basePath;
    } else {
        const publicUrl = process.env.PUBLIC_URL || '';
        const basePath = `${publicUrl}/assets/${path}`;
        console.log(`🔗 Production asset URL: ${basePath}`);
        return basePath;
    }
}/**
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