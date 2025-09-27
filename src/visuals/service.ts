// Visual Generation Service
// Main service for generating character portraits and visuals

import { CharacterVisualData, PortraitOptions, VisualGenerationResult, VisualPlugin } from './types';
import { assetManager, ensureAssetsLoaded } from './assets';
import { getClassVisualTheme, generateDefaultAppearance } from './classmap';
import { createCharacterRandom, ColorVariations } from './seed';

class VisualService {
  private plugins: Map<string, VisualPlugin> = new Map();
  private initialized = false;

  /**
   * Initialize the visual service
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    try {
      await ensureAssetsLoaded();
      this.registerDefaultPlugins();
      this.initialized = true;
      console.log('Visual service initialized');
    } catch (error) {
      console.error('Failed to initialize visual service:', error);
      throw error;
    }
  }

  /**
   * Register default visual plugins
   */
  private registerDefaultPlugins(): void {
    // Placeholder text renderer (fallback)
    this.registerPlugin({
      name: 'text-placeholder',
      version: '1.0.0',
      render: this.renderTextPlaceholder.bind(this),
      supports: () => true
    });

    // TODO: Add SVG, Canvas, and 3D renderers in future updates
  }

  /**
   * Register a visual plugin
   */
  registerPlugin(plugin: VisualPlugin): void {
    this.plugins.set(plugin.name, plugin);
  }

  /**
   * Generate character portrait
   */
  async generatePortrait(
    characterData: CharacterVisualData,
    options: PortraitOptions = { size: 'medium', format: 'svg' }
  ): Promise<VisualGenerationResult> {
    const startTime = performance.now();

    try {
      if (!this.initialized) {
        await this.initialize();
      }

      // Enhance character data with generated defaults
      const enhancedData = this.enhanceCharacterData(characterData);
      
      // Find suitable plugin
      const plugin = this.findBestPlugin(enhancedData.species, enhancedData.archetype);
      if (!plugin) {
        throw new Error('No suitable visual plugin found');
      }

      // Generate the visual
      const context = this.createRenderContext(options);
      const result = await plugin.render(enhancedData, context);
      
      const renderTime = performance.now() - startTime;
      
      return {
        success: true,
        data: result,
        metadata: {
          renderTime,
          cacheKey: this.generateCacheKey(characterData, options),
          assets: this.getUsedAssets(enhancedData)
        }
      };

    } catch (error) {
      const renderTime = performance.now() - startTime;
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          renderTime,
          assets: []
        }
      };
    }
  }

  /**
   * Enhance character data with generated defaults
   */
  private enhanceCharacterData(data: CharacterVisualData): CharacterVisualData {
    const rng = createCharacterRandom(data);
    
    // Generate appearance if missing
    const appearance = data.appearance || {};
    const defaultAppearance = generateDefaultAppearance(data.species, data.archetype);
    
    // Use seed-based generation for missing values
    const colorVariations = ColorVariations.forSpecies(data.species, rng);
    
    return {
      ...data,
      appearance: {
        ...defaultAppearance,
        ...appearance,
        // Fill in missing color values with seeded variations
        skinTone: appearance.skinTone || colorVariations.skinTone,
        hairColor: appearance.hairColor || colorVariations.hairColor,
        eyeColor: appearance.eyeColor || colorVariations.eyeColor
      },
      style: data.style || {
        artStyle: 'stylized',
        colorScheme: 'natural'
      }
    };
  }

  /**
   * Find best plugin for character
   */
  private findBestPlugin(species: string, archetype: string): VisualPlugin | null {
    const pluginArray = Array.from(this.plugins.values());
    for (const plugin of pluginArray) {
      if (plugin.supports(species, archetype)) {
        return plugin;
      }
    }
    return null;
  }

  /**
   * Create render context
   */
  private createRenderContext(options: PortraitOptions) {
    return {
      options,
      // Canvas/SVG context will be added by specific renderers
    };
  }

  /**
   * Generate cache key for portrait
   */
  private generateCacheKey(data: CharacterVisualData, options: PortraitOptions): string {
    const keyData = {
      name: data.name,
      species: data.species,
      archetype: data.archetype,
      level: data.level,
      appearance: data.appearance,
      size: options.size,
      format: options.format
    };
    return btoa(JSON.stringify(keyData));
  }

  /**
   * Get assets used for character
   */
  private getUsedAssets(data: CharacterVisualData): string[] {
    const assets: string[] = [];
    
    // Get class-specific assets
    const theme = getClassVisualTheme(data.archetype);
    if (theme?.preferredAssets) {
      Object.values(theme.preferredAssets).flat().forEach(asset => {
        assets.push(asset);
      });
    }

    return assets;
  }

  /**
   * Text placeholder renderer (fallback)
   */
  private async renderTextPlaceholder(
    data: CharacterVisualData,
    context: any
  ): Promise<string> {
    const { size } = context.options;
    const dimensions: Record<string, number> = {
      small: 64,
      medium: 128,
      large: 256
    };
    
    const dim = dimensions[size as string] || 128;
    const theme = getClassVisualTheme(data.archetype);
    const primaryColor = theme?.colorPalette.primary || '#666';
    
    // Create simple SVG placeholder
    return `
      <svg width="${dim}" height="${dim}" viewBox="0 0 ${dim} ${dim}" xmlns="http://www.w3.org/2000/svg">
        <rect width="${dim}" height="${dim}" fill="${primaryColor}" opacity="0.2"/>
        <circle cx="${dim/2}" cy="${dim/3}" r="${dim/8}" fill="${primaryColor}" opacity="0.4"/>
        <rect x="${dim/4}" y="${dim/2}" width="${dim/2}" height="${dim/3}" fill="${primaryColor}" opacity="0.3"/>
        <text x="${dim/2}" y="${dim-10}" text-anchor="middle" font-family="Arial" font-size="10" fill="${primaryColor}">
          ${data.name}
        </text>
        <text x="${dim/2}" y="${dim-25}" text-anchor="middle" font-family="Arial" font-size="8" fill="${primaryColor}" opacity="0.7">
          ${data.species} ${data.archetype}
        </text>
      </svg>
    `;
  }

  /**
   * Get service statistics
   */
  getStats() {
    return {
      initialized: this.initialized,
      plugins: this.plugins.size,
      pluginNames: Array.from(this.plugins.keys()),
      assetStats: assetManager.getStats()
    };
  }

  /**
   * Check if service is ready
   */
  isReady(): boolean {
    return this.initialized && assetManager.isLoaded();
  }
}

// Singleton instance
export const visualService = new VisualService();

// Convenience functions
export async function generateCharacterPortrait(
  characterData: CharacterVisualData,
  options?: PortraitOptions
): Promise<VisualGenerationResult> {
  return visualService.generatePortrait(characterData, options);
}

export async function initializeVisualSystem(): Promise<void> {
  await visualService.initialize();
}

export function isVisualSystemReady(): boolean {
  return visualService.isReady();
}