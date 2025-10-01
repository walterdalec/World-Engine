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
 * Generate portrait using PNG layering system - simplified approach
 */
export async function generateSimplePortrait(options: SimplePortraitOptions): Promise<PortraitResult> {
    try {
        const { gender, species, archetype, decorations = [], size = { width: 300, height: 380 } } = options;

        // Build layer stack - always try to load the basic layers
        const layers: PortraitLayer[] = [];

        // Base layer (gender-specific) - always include
        const basePath = getAssetUrl(`portraits-new/base/${gender}/neutral.png`);
        layers.push({
            type: 'base',
            src: basePath,
            zIndex: 1
        });

        // Race layer (species overlay) - always include  
        const racePath = getAssetUrl(`portraits-new/race/${species}.png`);
        layers.push({
            type: 'race',
            src: racePath,
            zIndex: 2
        });

        // Class layer (archetype overlay) - always include
        const classPath = getAssetUrl(`portraits-new/class/${archetype}.png`);
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

        // Generate composite image
        const dataUrl = await compositeImages(layers, size);

        return {
            success: true,
            layers,
            dataUrl
        };

    } catch (error) {
        // Silently handle errors to prevent console spam
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
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
            reject(new Error('Canvas context not available'));
            return;
        }

        canvas.width = size.width;
        canvas.height = size.height;

        // Load and draw all layers
        const loadPromises = layers
            .sort((a, b) => a.zIndex - b.zIndex) // Draw in z-order
            .map(layer => loadAndDrawLayer(ctx, layer, size));

        Promise.all(loadPromises)
            .then(() => {
                const dataUrl = canvas.toDataURL('image/png');
                resolve(dataUrl);
            })
            .catch(reject);
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
                // Scale and center the image
                const scale = Math.min(size.width / img.width, size.height / img.height);
                const scaledWidth = img.width * scale;
                const scaledHeight = img.height * scale;
                const x = (size.width - scaledWidth) / 2;
                const y = (size.height - scaledHeight) / 2;

                ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
                resolve();
            } catch (error) {
                // Silently continue with other layers - don't spam console
                resolve();
            }
        };

        img.onerror = () => {
            // Silently fail for missing assets to prevent console spam
            resolve();
        };

        img.src = layer.src;
    });
}

/**
 * Get asset URL with proper base path handling
 */
function getAssetUrl(path: string): string {
    const publicUrl = process.env.PUBLIC_URL || '';
    return `${publicUrl}/assets/${path}`;
}/**
 * Simple caching for generated portraits
 */
const portraitCache = new Map<string, string>();

export function getCachedPortrait(options: SimplePortraitOptions): string | null {
    const key = JSON.stringify(options);
    return portraitCache.get(key) || null;
}

export function setCachedPortrait(options: SimplePortraitOptions, dataUrl: string): void {
    const key = JSON.stringify(options);
    portraitCache.set(key, dataUrl);
}