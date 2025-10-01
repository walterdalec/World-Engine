// 2D Canvas/SVG Renderer for Character Portraits
// Handles rendering character visuals to Canvas or SVG formats

import { CharacterVisualData, PortraitOptions, RenderContext } from './types';
import { getClassVisualTheme } from './classmap';
import { assetManager, getFallbackSpecies } from './assets';
import { loadLayeredPortrait, getAssetLayers, loadPortraitFromExternalManifest, loadPortraitFromPreset, getPresetsByFilter } from './manifest';

interface LayerDefinition {
    name: string;
    zIndex: number;
    render: (ctx: CanvasRenderingContext2D | SVGElement, data: CharacterVisualData) => void;
}

class Renderer2D {
    private layers: LayerDefinition[] = [];

    constructor() {
        this.setupDefaultLayers();
    }

    /**
     * Setup default rendering layers
     */
    private setupDefaultLayers(): void {
        this.layers = [
            { name: 'background', zIndex: 0, render: this.renderBackground.bind(this) },
            { name: 'body', zIndex: 10, render: this.renderBody.bind(this) },
            { name: 'clothing', zIndex: 20, render: this.renderClothing.bind(this) },
            { name: 'hair', zIndex: 30, render: this.renderHair.bind(this) },
            { name: 'face', zIndex: 40, render: this.renderFace.bind(this) },
            { name: 'accessories', zIndex: 50, render: this.renderAccessories.bind(this) },
            { name: 'effects', zIndex: 60, render: this.renderEffects.bind(this) }
        ];

        // Sort by z-index
        this.layers.sort((a, b) => a.zIndex - b.zIndex);
    }

    /**
     * Render to Canvas
     */
    async renderToCanvas(
        data: CharacterVisualData,
        options: PortraitOptions,
        canvas: HTMLCanvasElement
    ): Promise<HTMLCanvasElement> {
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Cannot get 2D context from canvas');

        // Setup canvas
        this.setupCanvas(canvas, ctx, options);

        // Render layers
        for (const layer of this.layers) {
            try {
                layer.render(ctx, data);
            } catch (error) {
                console.warn(`Failed to render layer ${layer.name}:`, error);
            }
        }

        return canvas;
    }

    /**
     * Render to SVG
     */
    async renderToSVG(
        data: CharacterVisualData,
        options: PortraitOptions
    ): Promise<string> {
        const dimensions = this.getDimensions(options.size);

        // Try to use asset-based rendering first
        const assetBasedSVG = await this.tryAssetBasedSVG(data, dimensions);
        if (assetBasedSVG) {
            return assetBasedSVG;
        }

        // Fallback to procedural generation
        let svg = `<svg width="${dimensions.width}" height="${dimensions.height}" viewBox="0 0 ${dimensions.width} ${dimensions.height}" xmlns="http://www.w3.org/2000/svg">`;

        // Render layers to SVG
        for (const layer of this.layers) {
            try {
                const layerSvg = this.renderLayerToSVG(layer, data, dimensions);
                svg += layerSvg;
            } catch (error) {
                console.warn(`Failed to render SVG layer ${layer.name}:`, error);
            }
        }

        svg += '</svg>';
        return svg;
    }

    /**
     * Try asset-based SVG rendering using the new layered system
     */
    private async tryAssetBasedSVG(
        data: CharacterVisualData,
        dimensions: { width: number; height: number }
    ): Promise<string | null> {
        // Try the original species first, then fallbacks
        const speciesToTry = [data.species];

        // Add fallback species
        const fallbackSpecies = getFallbackSpecies(data.species);
        if (fallbackSpecies && fallbackSpecies !== data.species) {
            speciesToTry.push(fallbackSpecies);
        }

        // Always try Human as final fallback
        if (!speciesToTry.includes('Human')) {
            speciesToTry.push('Human');
        }

        for (const species of speciesToTry) {
            try {
                const result = await this.trySpeciesAssets(species, data.archetype, data.gender);
                if (result) {
                    // Customize colors and dimensions
                    const theme = getClassVisualTheme(data.archetype);
                    let customizedSVG = result;

                    if (theme) {
                        customizedSVG = this.applyThemeColors(customizedSVG, theme);
                    }

                    // Ensure proper dimensions
                    customizedSVG = customizedSVG.replace(
                        /<svg([^>]*?)width=["'][^"']*["']([^>]*?)height=["'][^"']*["']/i,
                        `<svg$1width="${dimensions.width}"$2height="${dimensions.height}"`
                    );

                    if (!customizedSVG.includes('viewBox')) {
                        customizedSVG = customizedSVG.replace(
                            /<svg([^>]*?)>/i,
                            `<svg$1 viewBox="0 0 ${dimensions.width} ${dimensions.height}">`
                        );
                    }

                    return customizedSVG;
                }
            } catch (error) {
                // Continue to next species
                continue;
            }
        }

        return null; // All attempts failed
    }

    /**
     * Try assets for a specific species
     */
    private async trySpeciesAssets(species: string, archetype: string, gender?: string): Promise<string | null> {
        try {
            // Try preset system first
            const filterCriteria = {
                species: species,
                archetype: archetype,
                gender: gender || 'Female'
            };

            const presets = await getPresetsByFilter(filterCriteria);
            if (presets.length > 0) {
                return await loadPortraitFromPreset(presets[0].id);
            }

            // Try external manifest
            try {
                return await loadPortraitFromExternalManifest(species, archetype);
            } catch (externalError) {
                // Try internal manifest
                return await loadLayeredPortrait(species, archetype, `${species} ${archetype}`);
            }
        } catch (error) {
            return null;
        }
    }

    /**
     * Apply theme colors to SVG content
     */
    private applyThemeColors(svg: string, theme: any): string {
        let customized = svg;

        // Apply primary color to clothing elements
        customized = customized.replace(
            /#4c1d95/g,
            theme.colorPalette.primary
        );

        // Apply secondary color to accents
        customized = customized.replace(
            /#6d28d9/g,
            theme.colorPalette.secondary
        );

        // Apply accent color to highlights
        customized = customized.replace(
            /#fbbf24/g,
            theme.colorPalette.accent || theme.colorPalette.primary
        );

        return customized;
    }

    /**
     * Setup canvas properties
     */
    private setupCanvas(
        canvas: HTMLCanvasElement,
        ctx: CanvasRenderingContext2D,
        options: PortraitOptions
    ): void {
        const dimensions = this.getDimensions(options.size);

        canvas.width = dimensions.width;
        canvas.height = dimensions.height;

        // Setup rendering quality
        ctx.imageSmoothingEnabled = options.quality !== 'low';
        ctx.imageSmoothingQuality = options.quality === 'high' ? 'high' : 'medium';

        // Clear canvas
        ctx.clearRect(0, 0, dimensions.width, dimensions.height);
    }

    /**
     * Get dimensions for size
     */
    private getDimensions(size: string): { width: number; height: number } {
        const sizes: Record<string, { width: number; height: number }> = {
            small: { width: 64, height: 64 },
            medium: { width: 128, height: 128 },
            large: { width: 256, height: 256 }
        };
        return sizes[size] || sizes.medium;
    }

    /**
     * Render layer to SVG string
     */
    private renderLayerToSVG(
        layer: LayerDefinition,
        data: CharacterVisualData,
        dimensions: { width: number; height: number }
    ): string {
        // Create temporary SVG element for layer rendering
        const mockSvg = {
            innerHTML: '',
            appendChild: (element: any) => {
                mockSvg.innerHTML += element.outerHTML || element.toString();
            }
        };

        try {
            layer.render(mockSvg as any, data);
            return mockSvg.innerHTML;
        } catch (error) {
            console.warn(`Error rendering ${layer.name} to SVG:`, error);
            return '';
        }
    }

    // Layer rendering methods (placeholder implementations for skeleton)

    private renderBackground(ctx: CanvasRenderingContext2D | SVGElement, data: CharacterVisualData): void {
        const theme = getClassVisualTheme(data.archetype);
        const bgColor = theme?.colorPalette.secondary || '#f0f0f0';

        if (ctx instanceof CanvasRenderingContext2D) {
            // Canvas background
            const canvas = ctx.canvas;
            ctx.fillStyle = bgColor;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        } else {
            // SVG background - add to innerHTML if it's our mock object
            if ('innerHTML' in ctx) {
                (ctx as any).innerHTML += `<rect width="100%" height="100%" fill="${bgColor}" opacity="0.1"/>`;
            }
        }
    }

    private renderBody(ctx: CanvasRenderingContext2D | SVGElement, data: CharacterVisualData): void {
        const theme = getClassVisualTheme(data.archetype);
        const skinColor = this.getSkinColor(data.appearance?.skinTone || 'medium');

        if (ctx instanceof CanvasRenderingContext2D) {
            // Canvas body rendering
            const canvas = ctx.canvas;
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            const radius = Math.min(canvas.width, canvas.height) / 6;

            // Simple head circle
            ctx.fillStyle = skinColor;
            ctx.beginPath();
            ctx.arc(centerX, centerY - radius, radius, 0, Math.PI * 2);
            ctx.fill();

            // Simple body rectangle
            ctx.fillRect(centerX - radius / 2, centerY, radius, radius * 1.5);
        } else {
            // SVG body rendering
            if ('innerHTML' in ctx) {
                const skinColor = this.getSkinColor(data.appearance?.skinTone || 'medium');
                (ctx as any).innerHTML += `
          <circle cx="50%" cy="35%" r="15%" fill="${skinColor}"/>
          <rect x="42.5%" y="50%" width="15%" height="25%" fill="${skinColor}"/>
        `;
            }
        }
    }

    private renderClothing(ctx: CanvasRenderingContext2D | SVGElement, data: CharacterVisualData): void {
        const theme = getClassVisualTheme(data.archetype);
        const clothingColor = theme?.colorPalette.primary || '#666';

        if (ctx instanceof CanvasRenderingContext2D) {
            // Canvas clothing
            const canvas = ctx.canvas;
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            const width = canvas.width / 3;
            const height = canvas.height / 4;

            ctx.fillStyle = clothingColor;
            ctx.fillRect(centerX - width / 2, centerY + 10, width, height);
        } else {
            // SVG clothing
            if ('innerHTML' in ctx) {
                (ctx as any).innerHTML += `<rect x="37.5%" y="55%" width="25%" height="30%" fill="${clothingColor}"/>`;
            }
        }
    }

    private renderHair(ctx: CanvasRenderingContext2D | SVGElement, data: CharacterVisualData): void {
        const hairColor = this.getHairColor(data.appearance?.hairColor || 'brown');

        if (ctx instanceof CanvasRenderingContext2D) {
            // Canvas hair
            const canvas = ctx.canvas;
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            const radius = Math.min(canvas.width, canvas.height) / 5;

            ctx.fillStyle = hairColor;
            ctx.beginPath();
            ctx.arc(centerX, centerY - radius - 5, radius * 0.8, 0, Math.PI);
            ctx.fill();
        } else {
            // SVG hair
            if ('innerHTML' in ctx) {
                (ctx as any).innerHTML += `
          <path d="M 35% 25% Q 50% 15% 65% 25% Q 60% 30% 50% 30% Q 40% 30% 35% 25%" fill="${hairColor}"/>
        `;
            }
        }
    }

    private renderFace(ctx: CanvasRenderingContext2D | SVGElement, data: CharacterVisualData): void {
        const eyeColor = this.getEyeColor(data.appearance?.eyeColor || 'brown');

        if (ctx instanceof CanvasRenderingContext2D) {
            // Canvas face features
            const canvas = ctx.canvas;
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            const eyeSize = 3;
            const eyeOffset = 8;

            // Eyes
            ctx.fillStyle = eyeColor;
            ctx.beginPath();
            ctx.arc(centerX - eyeOffset, centerY - 20, eyeSize, 0, Math.PI * 2);
            ctx.arc(centerX + eyeOffset, centerY - 20, eyeSize, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // SVG face features
            if ('innerHTML' in ctx) {
                (ctx as any).innerHTML += `
          <circle cx="45%" cy="32%" r="2%" fill="${eyeColor}"/>
          <circle cx="55%" cy="32%" r="2%" fill="${eyeColor}"/>
          <path d="M 47% 38% Q 50% 40% 53% 38%" stroke="#333" stroke-width="1" fill="none"/>
        `;
            }
        }
    }

    private renderAccessories(ctx: CanvasRenderingContext2D | SVGElement, data: CharacterVisualData): void {
        // Placeholder for future accessory rendering
        // Will be expanded when asset system is fully implemented
    }

    private renderEffects(ctx: CanvasRenderingContext2D | SVGElement, data: CharacterVisualData): void {
        const theme = getClassVisualTheme(data.archetype);
        const aura = theme?.visualTraits.aura;

        if (aura === 'magical' || aura === 'divine') {
            const effectColor = aura === 'magical' ? '#4B0082' : '#DAA520';

            if (ctx instanceof CanvasRenderingContext2D) {
                // Canvas magical effect
                const canvas = ctx.canvas;
                const centerX = canvas.width / 2;
                const centerY = canvas.height / 2;

                ctx.strokeStyle = effectColor;
                ctx.globalAlpha = 0.3;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(centerX, centerY, canvas.width / 3, 0, Math.PI * 2);
                ctx.stroke();
                ctx.globalAlpha = 1;
            } else {
                // SVG magical effect
                if ('innerHTML' in ctx) {
                    (ctx as any).innerHTML += `
            <circle cx="50%" cy="50%" r="35%" stroke="${effectColor}" stroke-width="2" fill="none" opacity="0.3"/>
          `;
                }
            }
        }
    }

    // Color utility methods
    private getSkinColor(tone: string): string {
        const colors: Record<string, string> = {
            'fair': '#FDBCB4',
            'light': '#EDB98A',
            'medium': '#C68642',
            'olive': '#A0785A',
            'tan': '#8D5524',
            'dark': '#654321',
            'pale': '#F5DEB3',
            'crystalline': '#E6E6FA',
            'metallic': '#C0C0C0',
            'scaled': '#8B4513'
        };
        return colors[tone] || colors['medium'];
    }

    private getHairColor(color: string): string {
        const colors: Record<string, string> = {
            'blonde': '#FAD5A5',
            'brown': '#8B4513',
            'black': '#000000',
            'red': '#B22222',
            'auburn': '#A52A2A',
            'green': '#228B22',
            'silver': '#C0C0C0',
            'white': '#F5F5F5',
            'crystal': '#E6E6FA',
            'copper': '#B87333'
        };
        return colors[color] || colors['brown'];
    }

    private getEyeColor(color: string): string {
        const colors: Record<string, string> = {
            'blue': '#4169E1',
            'brown': '#8B4513',
            'green': '#228B22',
            'hazel': '#8E7618',
            'gray': '#708090',
            'violet': '#8B008B',
            'gold': '#DAA520',
            'amber': '#FFBF00',
            'silver': '#C0C0C0'
        };
        return colors[color] || colors['brown'];
    }
}

// Export singleton
export const renderer2D = new Renderer2D();

// Convenience functions
export async function renderCharacterToCanvas(
    characterData: CharacterVisualData,
    options: PortraitOptions,
    canvas: HTMLCanvasElement
): Promise<HTMLCanvasElement> {
    return renderer2D.renderToCanvas(characterData, options, canvas);
}

export async function renderCharacterToSVG(
    characterData: CharacterVisualData,
    options: PortraitOptions
): Promise<string> {
    return renderer2D.renderToSVG(characterData, options);
}