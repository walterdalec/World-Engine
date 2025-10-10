/**
 * Content Pack Loader
 * Canvas 03 - Load and validate content packs
 */

import { z } from 'zod';
import {
    ContentPack,
    ContentPackSchema,
    BiomePack,
    UnitPack,
    ItemPack,
    SpellPack,
    FactionPack
} from './schemas';

export interface PackRegistry {
    biomes: Map<string, BiomePack>;
    units: Map<string, UnitPack>;
    items: Map<string, ItemPack>;
    spells: Map<string, SpellPack>;
    factions: Map<string, FactionPack>;
}

export interface ValidationError {
    packId: string;
    field: string;
    message: string;
    value?: any;
    suggestion?: string;
}

/**
 * Create empty registry
 */
export function createRegistry(): PackRegistry {
    return {
        biomes: new Map(),
        units: new Map(),
        items: new Map(),
        spells: new Map(),
        factions: new Map()
    };
}

/**
 * Format Zod error to friendly message
 */
function formatZodError(error: z.ZodError, packId: string): ValidationError[] {
    return error.issues.slice(0, 5).map((err: z.ZodIssue) => {
        const field = err.path.join('.');
        let suggestion: string | undefined;

        // Provide helpful suggestions based on error type
        if (err.code === 'invalid_type') {
            suggestion = `Expected ${(err as any).expected}, got ${(err as any).received}`;
        } else if (err.code === 'too_small') {
            suggestion = `Minimum value is ${(err as any).minimum}`;
        } else if (err.code === 'too_big') {
            suggestion = `Maximum value is ${(err as any).maximum}`;
        } else if (field.includes('color')) {
            suggestion = 'Use hex color format: #RRGGBB';
        }

        return {
            packId,
            field,
            message: err.message,
            suggestion
        };
    });
}

/**
 * Validate and register a content pack
 */
export function validateAndRegister(
    packData: unknown,
    registry: PackRegistry
): { success: boolean; errors: ValidationError[] } {
    const errors: ValidationError[] = [];

    try {
        // Validate pack structure
        const pack = ContentPackSchema.parse(packData) as ContentPack;
        const packId = pack.manifest.id;

        console.log(`📦 Loading pack: ${packId} v${pack.manifest.version}`);

        // Register biomes
        if (pack.biomes) {
            pack.biomes.forEach(biome => {
                const key = `${packId}:${biome.id}`;
                if (registry.biomes.has(key)) {
                    errors.push({
                        packId,
                        field: `biomes.${biome.id}`,
                        message: 'Duplicate biome ID',
                        suggestion: 'Use a unique ID or different pack namespace'
                    });
                } else {
                    registry.biomes.set(key, biome);
                }
            });
        }

        // Register units
        if (pack.units) {
            pack.units.forEach(unit => {
                const key = `${packId}:${unit.id}`;
                if (registry.units.has(key)) {
                    errors.push({
                        packId,
                        field: `units.${unit.id}`,
                        message: 'Duplicate unit ID',
                        suggestion: 'Use a unique ID or different pack namespace'
                    });
                } else {
                    registry.units.set(key, unit);
                }
            });
        }

        // Register items
        if (pack.items) {
            pack.items.forEach(item => {
                const key = `${packId}:${item.id}`;
                if (registry.items.has(key)) {
                    errors.push({
                        packId,
                        field: `items.${item.id}`,
                        message: 'Duplicate item ID',
                        suggestion: 'Use a unique ID or different pack namespace'
                    });
                } else {
                    registry.items.set(key, item);
                }
            });
        }

        // Register spells
        if (pack.spells) {
            pack.spells.forEach(spell => {
                const key = `${packId}:${spell.id}`;
                if (registry.spells.has(key)) {
                    errors.push({
                        packId,
                        field: `spells.${spell.id}`,
                        message: 'Duplicate spell ID',
                        suggestion: 'Use a unique ID or different pack namespace'
                    });
                } else {
                    registry.spells.set(key, spell);
                }
            });
        }

        // Register factions
        if (pack.factions) {
            pack.factions.forEach(faction => {
                const key = `${packId}:${faction.id}`;
                if (registry.factions.has(key)) {
                    errors.push({
                        packId,
                        field: `factions.${faction.id}`,
                        message: 'Duplicate faction ID',
                        suggestion: 'Use a unique ID or different pack namespace'
                    });
                } else {
                    registry.factions.set(key, faction);
                }
            });
        }

        if (errors.length === 0) {
            console.log(`✅ Pack loaded: ${packId} (${(pack.biomes?.length || 0) +
                (pack.units?.length || 0) +
                (pack.items?.length || 0) +
                (pack.spells?.length || 0) +
                (pack.factions?.length || 0)
                } entries)`);
        }

        return { success: errors.length === 0, errors };

    } catch (error) {
        if (error instanceof z.ZodError) {
            const packId = (packData as any)?.manifest?.id || 'unknown';
            return {
                success: false,
                errors: formatZodError(error, packId)
            };
        }

        return {
            success: false,
            errors: [{
                packId: 'unknown',
                field: 'root',
                message: error instanceof Error ? error.message : 'Unknown error',
                suggestion: 'Check JSON syntax and structure'
            }]
        };
    }
}

/**
 * Load pack from JSON string
 */
export function loadPackFromJSON(json: string, registry: PackRegistry) {
    try {
        const data = JSON.parse(json);
        return validateAndRegister(data, registry);
    } catch (error) {
        return {
            success: false,
            errors: [{
                packId: 'unknown',
                field: 'root',
                message: 'Invalid JSON',
                suggestion: 'Check for syntax errors (missing commas, quotes, etc.)'
            }]
        };
    }
}

/**
 * Export registry to JSON (for debugging/testing)
 */
export function exportRegistry(registry: PackRegistry): string {
    const exported = {
        biomes: Array.from(registry.biomes.entries()).map(([key, data]) => ({ key, ...data })),
        units: Array.from(registry.units.entries()).map(([key, data]) => ({ key, ...data })),
        items: Array.from(registry.items.entries()).map(([key, data]) => ({ key, ...data })),
        spells: Array.from(registry.spells.entries()).map(([key, data]) => ({ key, ...data })),
        factions: Array.from(registry.factions.entries()).map(([key, data]) => ({ key, ...data }))
    };

    return JSON.stringify(exported, null, 2);
}

/**
 * Get registry stats
 */
export function getRegistryStats(registry: PackRegistry) {
    return {
        biomes: registry.biomes.size,
        units: registry.units.size,
        items: registry.items.size,
        spells: registry.spells.size,
        factions: registry.factions.size,
        total: registry.biomes.size + registry.units.size + registry.items.size +
            registry.spells.size + registry.factions.size
    };
}
