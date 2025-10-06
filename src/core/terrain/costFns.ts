// packages/core/src/terrain/costFns.ts
import type { Axial } from '../action/types';
import type { TerrainMap } from './map';
import { DEFAULT_TERRAIN, clampCost } from './registry';

export function makeCostFn(tmap: TerrainMap, encumbrance = 0) {
    return (h: Axial) => clampCost(DEFAULT_TERRAIN[tmap.kind(h)].movementCost + encumbrance);
}

export function makePassableFn(tmap: TerrainMap, opts?: { allowWater?: boolean; flying?: boolean }) {
    return (h: Axial) => {
        const specials = tmap.specials(h);
        if (specials.includes('impassable')) return false; // HARD STOP: hills/mountains (and any marked impassable)
        if (specials.includes('flying_only')) return !!opts?.flying || !!opts?.allowWater;
        return true;
    };
}