// packages/core/src/terrain/tiled.ts
/** Minimal parser: expects a Tile Layer named "terrain" and optional Object Layer named "elevation". */
import type { Axial } from '../action/types';
import { TerrainMap } from './map';
import type { TerrainKind } from './types';

// Hex coordinate conversion for Tiled maps (odd-r offset to axial)
function offsetOddRToAxial(col: number, row: number): Axial {
    const q = col - (row - (row & 1)) / 2;
    const r = row;
    return { q, r };
}

// Inverse conversion (currently unused but kept for future use)
function _axialToOffsetOddR(axial: Axial): { col: number; row: number } {
    const col = axial.q + (axial.r - (axial.r & 1)) / 2;
    const row = axial.r;
    return { col, row };
}

export interface TiledMap {
    width: number;
    height: number;
    layers: any[];
    tilesets: any[];
}

export interface TilesetIndex {
    [gid: number]: TerrainKind;
}

export function tilesetIndex(tilesets: any[]): TilesetIndex {
    const idx: TilesetIndex = {};
    for (const ts of tilesets) {
        const first = ts.firstgid | 0;
        for (const t of ts.tiles ?? []) {
            const kind = (t.properties?.find((p: any) => p.name === 'terrainKind')?.value ?? 'grass') as TerrainKind;
            idx[first + (t.id | 0)] = kind;
        }
    }
    return idx;
}

export function parseTiledToTerrain(tiled: TiledMap): TerrainMap {
    const tmap = new TerrainMap();
    const idx = tilesetIndex(tiled.tilesets);
    const terrainLayer = tiled.layers.find((l: any) => l.name === 'terrain' && l.type === 'tilelayer');
    if (!terrainLayer) throw new Error('Missing tile layer "terrain"');

    const data: number[] = terrainLayer.data; // assumed CSV → array of gids row-major
    for (let row = 0; row < tiled.height; row++) {
        for (let col = 0; col < tiled.width; col++) {
            const gid = data[row * tiled.width + col] | 0;
            const kind = idx[gid] ?? 'grass';
            const a: Axial = offsetOddRToAxial(col, row);
            tmap.set(a, { t: kind });
        }
    }

    const elevLayer = tiled.layers.find((l: any) => l.name === 'elevation' && l.type === 'tilelayer');
    if (elevLayer) {
        const edata: number[] = elevLayer.data;
        for (let row = 0; row < tiled.height; row++) {
            for (let col = 0; col < tiled.width; col++) {
                const elev = edata[row * tiled.width + col] | 0;
                if (!elev) continue;
                const a: Axial = offsetOddRToAxial(col, row);
                const cell = tmap.get(a);
                cell.elev = elev - 1;
                tmap.set(a, cell);
            }
        }
    }

    return tmap;
}