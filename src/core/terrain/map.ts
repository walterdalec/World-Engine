// packages/core/src/terrain/map.ts
import type { Axial } from '../action/types';
import type { TerrainCell, TerrainKind } from './types';
import { DEFAULT_TERRAIN } from './registry';

const key = (h: Axial) => `${h.q},${h.r}`;

export class TerrainMap {
    private cells = new Map<string, TerrainCell>();

    set(h: Axial, cell: TerrainCell) {
        this.cells.set(key(h), cell);
    }

    get(h: Axial): TerrainCell {
        return this.cells.get(key(h)) ?? { t: 'grass' };
    }

    kind(h: Axial): TerrainKind {
        return this.get(h).t;
    }

    elevation(h: Axial): number {
        return this.get(h).elev ?? 0;
    }

    specials(h: Axial) {
        return this.get(h).specials ?? DEFAULT_TERRAIN[this.kind(h)].special ?? [];
    }

    defenseBonus(h: Axial): number {
        return DEFAULT_TERRAIN[this.kind(h)].defenseBonus;
    }
}