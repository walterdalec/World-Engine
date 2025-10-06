// packages/core/src/terrain/types.ts
export type TerrainKind = 'grass' | 'forest' | 'hill' | 'mountain' | 'water' | 'fortress' | 'marsh' | 'road';

export interface HexTerrain {
    kind: TerrainKind;
    movementCost: number;              // integer ≥1 (caps handled in registry)
    defenseBonus: number;              // e.g., +0..+40 (%), applied in damage pipeline (#06)
    elevation?: number;                // meters or abstract steps; optional per-cell override
    special?: Array<'blocks_line_of_sight' | 'flying_only' | 'regeneration' | 'impassable'>; // added 'impassable'
}

export interface TerrainCell {
    t: TerrainKind;
    elev?: number;
    specials?: HexTerrain['special'];
}