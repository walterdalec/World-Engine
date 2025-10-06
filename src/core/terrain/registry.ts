// packages/core/src/terrain/registry.ts
import type { HexTerrain, TerrainKind } from './types';

export const DEFAULT_TERRAIN: Record<TerrainKind, HexTerrain> = {
    grass: { kind: 'grass', movementCost: 1, defenseBonus: 0 },
    road: { kind: 'road', movementCost: 1, defenseBonus: 0 },
    forest: { kind: 'forest', movementCost: 2, defenseBonus: 15, special: ['blocks_line_of_sight'] },
    hill: { kind: 'hill', movementCost: 5, defenseBonus: 20, special: ['blocks_line_of_sight', 'impassable'] },
    mountain: { kind: 'mountain', movementCost: 5, defenseBonus: 30, special: ['blocks_line_of_sight', 'impassable'] },
    water: { kind: 'water', movementCost: 5, defenseBonus: 0, special: ['flying_only'] },
    fortress: { kind: 'fortress', movementCost: 2, defenseBonus: 25, special: ['blocks_line_of_sight', 'regeneration'] },
    marsh: { kind: 'marsh', movementCost: 3, defenseBonus: -5 },
};

export function clampCost(n: number) {
    return Math.max(1, Math.min(5, Math.round(n)));
}