// Visual System Types - Foundation for character portrait generation
// This provides the extensible type system for future visual features

export interface CharacterVisualData {
    // Basic character info
    name: string;
    species: string;
    archetype: string;
    level: number;

    // Character identity
    gender?: 'Female' | 'Male';

    // Physical characteristics
    appearance: {
        skinTone?: string;
        hairColor?: string;
        hairStyle?: string;
        eyeColor?: string;
        bodyType?: string;
        height?: 'short' | 'average' | 'tall';
        build?: 'slim' | 'average' | 'stocky' | 'muscular';
    };

    // Equipment/clothing (for future expansion)
    equipment?: {
        armor?: string;
        weapon?: string;
        accessories?: string[];
    };

    // Visual style preferences
    style?: {
        artStyle?: 'realistic' | 'stylized' | 'pixel' | 'cartoon';
        colorScheme?: 'natural' | 'vibrant' | 'muted' | 'fantasy';
    };
}

export interface PortraitOptions {
    size: 'small' | 'medium' | 'large';
    format: 'svg' | 'png' | 'jpg';
    quality?: 'low' | 'medium' | 'high';
    background?: 'transparent' | 'solid' | 'gradient';
}

export interface VisualAsset {
    id: string;
    category: string;
    subcategory?: string;
    species?: string[];
    archetype?: string[];
    tags?: string[];
    path: string;
    metadata?: Record<string, any>;
}

export interface RenderContext {
    canvas?: HTMLCanvasElement;
    ctx?: CanvasRenderingContext2D;
    svg?: SVGElement;
    options: PortraitOptions;
}

// For future 3D expansion
export interface Visual3DContext {
    scene?: any; // THREE.Scene or similar
    camera?: any;
    renderer?: any;
    model?: any;
}

// Extensible plugin system for future visual features
export interface VisualPlugin {
    name: string;
    version: string;
    render: (data: CharacterVisualData, context: RenderContext) => Promise<string | HTMLElement>;
    supports: (species: string, archetype: string) => boolean;
}

export type VisualGenerationResult = {
    success: boolean;
    data?: string | HTMLElement;
    error?: string;
    metadata?: {
        renderTime: number;
        cacheKey?: string;
        assets: string[];
    };
};