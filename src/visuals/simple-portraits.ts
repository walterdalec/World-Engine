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
        // Comprehensive character mapping to DENZI spritesheet coordinates
        // Maps all 7 species × 12 archetypes = 84 combinations
        const characterMappings: Record<string, { sheet: string; x: number; y: number; w: number; h: number }> = {
            // HUMAN characters - humanoid tileset (32x32)
            'human_greenwarden': { sheet: 'denzi-tileset.png', x: 0, y: 0, w: 32, h: 32 },
            'human_thorn knight': { sheet: 'denzi-tileset.png', x: 32, y: 0, w: 32, h: 32 },
            'human_sapling adept': { sheet: 'denzi-tileset.png', x: 64, y: 0, w: 32, h: 32 },
            'human_bloomcaller': { sheet: 'denzi-tileset.png', x: 96, y: 0, w: 32, h: 32 },
            'human_ashblade': { sheet: 'denzi-tileset.png', x: 128, y: 0, w: 32, h: 32 },
            'human_cinder mystic': { sheet: 'denzi-tileset.png', x: 160, y: 0, w: 32, h: 32 },
            'human_dust ranger': { sheet: 'denzi-tileset.png', x: 192, y: 0, w: 32, h: 32 },
            'human_bonechanter': { sheet: 'denzi-tileset.png', x: 224, y: 0, w: 32, h: 32 },
            'human_stormcaller': { sheet: 'denzi-tileset.png', x: 0, y: 32, w: 32, h: 32 },
            'human_voidwing': { sheet: 'denzi-tileset.png', x: 32, y: 32, w: 32, h: 32 },
            'human_sky knight': { sheet: 'denzi-tileset.png', x: 64, y: 32, w: 32, h: 32 },
            'human_wind sage': { sheet: 'denzi-tileset.png', x: 96, y: 32, w: 32, h: 32 },

            // SYLVANBORN characters - nature-themed tileset (32x32)
            'sylvanborn_greenwarden': { sheet: 'denzi-tileset.png', x: 128, y: 32, w: 32, h: 32 },
            'sylvanborn_thorn knight': { sheet: 'denzi-tileset.png', x: 160, y: 32, w: 32, h: 32 },
            'sylvanborn_sapling adept': { sheet: 'denzi-tileset.png', x: 192, y: 32, w: 32, h: 32 },
            'sylvanborn_bloomcaller': { sheet: 'denzi-tileset.png', x: 224, y: 32, w: 32, h: 32 },
            'sylvanborn_ashblade': { sheet: 'denzi-tileset.png', x: 0, y: 64, w: 32, h: 32 },
            'sylvanborn_cinder mystic': { sheet: 'denzi-tileset.png', x: 32, y: 64, w: 32, h: 32 },
            'sylvanborn_dust ranger': { sheet: 'denzi-tileset.png', x: 64, y: 64, w: 32, h: 32 },
            'sylvanborn_bonechanter': { sheet: 'denzi-tileset.png', x: 96, y: 64, w: 32, h: 32 },
            'sylvanborn_stormcaller': { sheet: 'denzi-tileset.png', x: 128, y: 64, w: 32, h: 32 },
            'sylvanborn_voidwing': { sheet: 'denzi-tileset.png', x: 160, y: 64, w: 32, h: 32 },
            'sylvanborn_sky knight': { sheet: 'denzi-tileset.png', x: 192, y: 64, w: 32, h: 32 },
            'sylvanborn_wind sage': { sheet: 'denzi-tileset.png', x: 224, y: 64, w: 32, h: 32 },

            // ALLOY characters - mechanical/constructs from tileset (32x32)
            'alloy_greenwarden': { sheet: 'denzi-tileset.png', x: 0, y: 96, w: 32, h: 32 },
            'alloy_thorn knight': { sheet: 'denzi-tileset.png', x: 32, y: 96, w: 32, h: 32 },
            'alloy_sapling adept': { sheet: 'denzi-tileset.png', x: 64, y: 96, w: 32, h: 32 },
            'alloy_bloomcaller': { sheet: 'denzi-tileset.png', x: 96, y: 96, w: 32, h: 32 },
            'alloy_ashblade': { sheet: 'denzi-tileset.png', x: 128, y: 96, w: 32, h: 32 },
            'alloy_cinder mystic': { sheet: 'denzi-tileset.png', x: 160, y: 96, w: 32, h: 32 },
            'alloy_dust ranger': { sheet: 'denzi-tileset.png', x: 192, y: 96, w: 32, h: 32 },
            'alloy_bonechanter': { sheet: 'denzi-tileset.png', x: 224, y: 96, w: 32, h: 32 },
            'alloy_stormcaller': { sheet: 'denzi-tileset.png', x: 0, y: 128, w: 32, h: 32 },
            'alloy_voidwing': { sheet: 'denzi-tileset.png', x: 32, y: 128, w: 32, h: 32 },
            'alloy_sky knight': { sheet: 'denzi-tileset.png', x: 64, y: 128, w: 32, h: 32 },
            'alloy_wind sage': { sheet: 'denzi-tileset.png', x: 96, y: 128, w: 32, h: 32 },

            // DRAKETH characters - dragon-like monsters (32x48)
            'draketh_greenwarden': { sheet: 'denzi-monsters.png', x: 0, y: 0, w: 32, h: 48 },
            'draketh_thorn knight': { sheet: 'denzi-monsters.png', x: 32, y: 0, w: 32, h: 48 },
            'draketh_sapling adept': { sheet: 'denzi-monsters.png', x: 64, y: 0, w: 32, h: 48 },
            'draketh_bloomcaller': { sheet: 'denzi-monsters.png', x: 96, y: 0, w: 32, h: 48 },
            'draketh_ashblade': { sheet: 'denzi-monsters.png', x: 128, y: 0, w: 32, h: 48 },
            'draketh_cinder mystic': { sheet: 'denzi-monsters.png', x: 160, y: 0, w: 32, h: 48 },
            'draketh_dust ranger': { sheet: 'denzi-monsters.png', x: 192, y: 0, w: 32, h: 48 },
            'draketh_bonechanter': { sheet: 'denzi-monsters.png', x: 224, y: 0, w: 32, h: 48 },
            'draketh_stormcaller': { sheet: 'denzi-monsters.png', x: 0, y: 48, w: 32, h: 48 },
            'draketh_voidwing': { sheet: 'denzi-monsters.png', x: 32, y: 48, w: 32, h: 48 },
            'draketh_sky knight': { sheet: 'denzi-monsters.png', x: 64, y: 48, w: 32, h: 48 },
            'draketh_wind sage': { sheet: 'denzi-monsters.png', x: 96, y: 48, w: 32, h: 48 },

            // VOIDKIN characters - shadow/void monsters (32x48)
            'voidkin_greenwarden': { sheet: 'denzi-monsters.png', x: 128, y: 48, w: 32, h: 48 },
            'voidkin_thorn knight': { sheet: 'denzi-monsters.png', x: 160, y: 48, w: 32, h: 48 },
            'voidkin_sapling adept': { sheet: 'denzi-monsters.png', x: 192, y: 48, w: 32, h: 48 },
            'voidkin_bloomcaller': { sheet: 'denzi-monsters.png', x: 224, y: 48, w: 32, h: 48 },
            'voidkin_ashblade': { sheet: 'denzi-monsters.png', x: 0, y: 96, w: 32, h: 48 },
            'voidkin_cinder mystic': { sheet: 'denzi-monsters.png', x: 32, y: 96, w: 32, h: 48 },
            'voidkin_dust ranger': { sheet: 'denzi-monsters.png', x: 64, y: 96, w: 32, h: 48 },
            'voidkin_bonechanter': { sheet: 'denzi-monsters.png', x: 96, y: 96, w: 32, h: 48 },
            'voidkin_stormcaller': { sheet: 'denzi-monsters.png', x: 128, y: 96, w: 32, h: 48 },
            'voidkin_voidwing': { sheet: 'denzi-monsters.png', x: 160, y: 96, w: 32, h: 48 },
            'voidkin_sky knight': { sheet: 'denzi-monsters.png', x: 192, y: 96, w: 32, h: 48 },
            'voidkin_wind sage': { sheet: 'denzi-monsters.png', x: 224, y: 96, w: 32, h: 48 },

            // CRYSTALBORN characters - crystal/elemental monsters (32x48)
            'crystalborn_greenwarden': { sheet: 'denzi-monsters.png', x: 0, y: 144, w: 32, h: 48 },
            'crystalborn_thorn knight': { sheet: 'denzi-monsters.png', x: 32, y: 144, w: 32, h: 48 },
            'crystalborn_sapling adept': { sheet: 'denzi-monsters.png', x: 64, y: 144, w: 32, h: 48 },
            'crystalborn_bloomcaller': { sheet: 'denzi-monsters.png', x: 96, y: 144, w: 32, h: 48 },
            'crystalborn_ashblade': { sheet: 'denzi-monsters.png', x: 128, y: 144, w: 32, h: 48 },
            'crystalborn_cinder mystic': { sheet: 'denzi-monsters.png', x: 160, y: 144, w: 32, h: 48 },
            'crystalborn_dust ranger': { sheet: 'denzi-monsters.png', x: 192, y: 144, w: 32, h: 48 },
            'crystalborn_bonechanter': { sheet: 'denzi-monsters.png', x: 224, y: 144, w: 32, h: 48 },
            'crystalborn_stormcaller': { sheet: 'denzi-monsters.png', x: 0, y: 192, w: 32, h: 48 },
            'crystalborn_voidwing': { sheet: 'denzi-monsters.png', x: 32, y: 192, w: 32, h: 48 },
            'crystalborn_sky knight': { sheet: 'denzi-monsters.png', x: 64, y: 192, w: 32, h: 48 },
            'crystalborn_wind sage': { sheet: 'denzi-monsters.png', x: 96, y: 192, w: 32, h: 48 },

            // STORMCALLER characters - elemental/storm monsters (32x48)
            'stormcaller_greenwarden': { sheet: 'denzi-monsters.png', x: 128, y: 192, w: 32, h: 48 },
            'stormcaller_thorn knight': { sheet: 'denzi-monsters.png', x: 160, y: 192, w: 32, h: 48 },
            'stormcaller_sapling adept': { sheet: 'denzi-monsters.png', x: 192, y: 192, w: 32, h: 48 },
            'stormcaller_bloomcaller': { sheet: 'denzi-monsters.png', x: 224, y: 192, w: 32, h: 48 },
            'stormcaller_ashblade': { sheet: 'denzi-monsters.png', x: 0, y: 240, w: 32, h: 48 },
            'stormcaller_cinder mystic': { sheet: 'denzi-monsters.png', x: 32, y: 240, w: 32, h: 48 },
            'stormcaller_dust ranger': { sheet: 'denzi-monsters.png', x: 64, y: 240, w: 32, h: 48 },
            'stormcaller_bonechanter': { sheet: 'denzi-monsters.png', x: 96, y: 240, w: 32, h: 48 },
            'stormcaller_stormcaller': { sheet: 'denzi-monsters.png', x: 128, y: 240, w: 32, h: 48 },
            'stormcaller_voidwing': { sheet: 'denzi-monsters.png', x: 160, y: 240, w: 32, h: 48 },
            'stormcaller_sky knight': { sheet: 'denzi-monsters.png', x: 192, y: 240, w: 32, h: 48 },
            'stormcaller_wind sage': { sheet: 'denzi-monsters.png', x: 224, y: 240, w: 32, h: 48 },

            // Fallback for any combination not found above
            'default': { sheet: 'denzi-tileset.png', x: 0, y: 160, w: 32, h: 32 }
        };

        const key = `${species.toLowerCase()}_${archetype.toLowerCase().replace(/\s+/g, ' ')}`;
        const mapping = characterMappings[key] || characterMappings['default'];

        console.log(`🗺️ Character mapping lookup: ${species} + ${archetype} → ${key} → ${mapping.sheet} (${mapping.x}, ${mapping.y})`);

        // Extract sprite from spritesheet
        const spriteUrl = await extractSpriteFromSheet(mapping.sheet, mapping.x, mapping.y, mapping.w, mapping.h);
        return spriteUrl;

    } catch (error) {
        console.log(`🔄 No spritesheet character found for ${species} ${archetype}, using fallback`);
        return null;
    }
}

/**
 * Extract a sprite from a spritesheet using canvas with retry logic
 */
async function extractSpriteFromSheet(sheetName: string, x: number, y: number, w: number, h: number, retryCount = 0): Promise<string> {
    return new Promise((resolve, reject) => {
        const img = new Image();

        // Set CORS to handle GitHub Pages
        img.crossOrigin = 'anonymous';

        console.log(`🔍 Creating image for spritesheet: ${sheetName}`); img.onload = () => {
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
            console.log(`❌ Failed to load spritesheet: ${sheetName} (attempt ${retryCount + 1})`);
            console.log(`🔍 Full URL attempted: ${getAssetUrl(`portraits-new/${sheetName}`)}`);
            console.log(`🌐 Current location: ${window.location.href}`);
            console.log(`🔗 Base path logic: isLocal=${window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'}`);

            // Retry up to 2 times with delay
            if (retryCount < 2) {
                console.log(`🔄 Retrying spritesheet load in ${(retryCount + 1) * 1000}ms...`);
                setTimeout(() => {
                    extractSpriteFromSheet(sheetName, x, y, w, h, retryCount + 1)
                        .then(resolve)
                        .catch(reject);
                }, (retryCount + 1) * 1000);
            } else {
                reject(new Error(`Failed to load spritesheet: ${sheetName} after ${retryCount + 1} attempts`));
            }
        };

        img.src = getAssetUrl(`portraits-new/${sheetName}`);
        console.log(`🔍 Attempting to load spritesheet from: ${img.src}`);
        console.log(`🌐 window.location.href: ${window.location.href}`);
        console.log(`🌐 window.location.hostname: ${window.location.hostname}`);
        console.log(`🌐 process.env.PUBLIC_URL: ${process.env.PUBLIC_URL || 'undefined'}`);

        // Add a timeout to catch hanging requests
        setTimeout(() => {
            if (!img.complete) {
                console.log(`⏰ Spritesheet load timeout for: ${sheetName}`);
                reject(new Error(`Timeout loading spritesheet: ${sheetName}`));
            }
        }, 10000);
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