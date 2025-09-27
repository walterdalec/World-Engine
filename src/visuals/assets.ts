// Visual Asset Management System
// Handles loading, caching, and organizing visual assets for character generation

import { VisualAsset } from './types';

interface AssetManifest {
  version: string;
  lastUpdated: string;
  assets: VisualAsset[];
  categories: string[];
  species: string[];
  archetypes: string[];
}

class VisualAssetManager {
  private assets: Map<string, VisualAsset> = new Map();
  private manifest: AssetManifest | null = null;
  private loadingPromise: Promise<void> | null = null;

  /**
   * Initialize the asset system by loading the manifest
   */
  async initialize(): Promise<void> {
    if (this.loadingPromise) {
      return this.loadingPromise;
    }

    this.loadingPromise = this.loadManifest();
    return this.loadingPromise;
  }

  /**
   * Load the asset manifest from public/assets/portraits/manifest.json
   */
  private async loadManifest(): Promise<void> {
    try {
      const response = await fetch('/assets/portraits/manifest.json');
      if (!response.ok) {
        console.warn('Portrait manifest not found, using empty asset system');
        this.initializeEmptyManifest();
        return;
      }

      this.manifest = await response.json();
      this.indexAssets();
    } catch (error) {
      console.warn('Failed to load portrait manifest:', error);
      this.initializeEmptyManifest();
    }
  }

  /**
   * Initialize with empty manifest for development
   */
  private initializeEmptyManifest(): void {
    this.manifest = {
      version: '1.0.0',
      lastUpdated: new Date().toISOString(),
      assets: [],
      categories: ['base', 'hair', 'eyes', 'clothing', 'accessories'],
      species: ['Human', 'Sylvanborn', 'Nightborn', 'Stormcaller', 'Crystalborn', 'Draketh', 'Alloy', 'Voidkin'],
      archetypes: ['Warrior', 'Scout', 'Mage', 'Guardian', 'Ranger', 'Rogue', 'Artificer', 'Thorn Knight', 'Ashblade', 'Ironclad', 'Stormbreaker', 'Voidhunter', 'Crystal Guardian', 'Greenwarden']
    };
  }

  /**
   * Index assets for quick lookup
   */
  private indexAssets(): void {
    if (!this.manifest) return;

    this.assets.clear();
    for (const asset of this.manifest.assets) {
      this.assets.set(asset.id, asset);
    }
  }

  /**
   * Get assets by category
   */
  getAssetsByCategory(category: string): VisualAsset[] {
    return Array.from(this.assets.values()).filter(asset => asset.category === category);
  }

  /**
   * Get assets for specific species
   */
  getAssetsForSpecies(species: string): VisualAsset[] {
    return Array.from(this.assets.values()).filter(asset => 
      !asset.species || asset.species.includes(species)
    );
  }

  /**
   * Get assets for specific archetype
   */
  getAssetsForArchetype(archetype: string): VisualAsset[] {
    return Array.from(this.assets.values()).filter(asset =>
      !asset.archetype || asset.archetype.includes(archetype)
    );
  }

  /**
   * Get filtered assets
   */
  getFilteredAssets(filters: {
    category?: string;
    species?: string;
    archetype?: string;
    tags?: string[];
  }): VisualAsset[] {
    return Array.from(this.assets.values()).filter(asset => {
      if (filters.category && asset.category !== filters.category) return false;
      if (filters.species && asset.species && !asset.species.includes(filters.species)) return false;
      if (filters.archetype && asset.archetype && !asset.archetype.includes(filters.archetype)) return false;
      if (filters.tags && asset.tags) {
        const hasAnyTag = filters.tags.some(tag => asset.tags!.includes(tag));
        if (!hasAnyTag) return false;
      }
      return true;
    });
  }

  /**
   * Get asset by ID
   */
  getAsset(id: string): VisualAsset | undefined {
    return this.assets.get(id);
  }

  /**
   * Get available categories
   */
  getCategories(): string[] {
    return this.manifest?.categories || [];
  }

  /**
   * Get supported species
   */
  getSupportedSpecies(): string[] {
    return this.manifest?.species || [];
  }

  /**
   * Get supported archetypes
   */
  getSupportedArchetypes(): string[] {
    return this.manifest?.archetypes || [];
  }

  /**
   * Check if assets are loaded
   */
  isLoaded(): boolean {
    return this.manifest !== null;
  }

  /**
   * Get asset statistics
   */
  getStats() {
    return {
      totalAssets: this.assets.size,
      categories: this.getCategories().length,
      species: this.getSupportedSpecies().length,
      archetypes: this.getSupportedArchetypes().length,
      version: this.manifest?.version || 'unknown'
    };
  }
}

// Singleton instance
export const assetManager = new VisualAssetManager();

// Utility functions
export async function ensureAssetsLoaded(): Promise<void> {
  await assetManager.initialize();
}

export function getAssetUrl(path: string): string {
  return `/assets/portraits/${path}`;
}