// packages/core/src/terrain/los.blockers.ts
import type { Axial } from '../action/types';
import { hexLine } from '../action/hex';
import type { TerrainMap } from './map';

export function makeLOSFn(tmap: TerrainMap, opts?: { heightBlockDelta?: number }) {
    const delta = opts?.heightBlockDelta ?? 2; // blocks if rise > 2 between consecutive steps
    return (h: Axial) => {
        const specials = tmap.specials(h);
        if (specials.includes('blocks_line_of_sight')) return true;
        // elevation handled by wrapper (see below) using consecutive comparisons along the line
        return false;
    };
}

// Optional wrapper adding elevation-based occlusion using the hex line steps
export function losWithElevation(a: Axial, b: Axial, tmap: TerrainMap, baseBlock: (h: Axial) => boolean, maxRise = 2) {
    const line = hexLine(a, b);
    for (let i = 1; i < line.length; i++) {
        const h = line[i]!;
        if (baseBlock(h)) return { visible: false, occluder: h, line } as const;
        const prev = line[i - 1]!;
        if (tmap.elevation(h) - tmap.elevation(prev) > maxRise) return { visible: false, occluder: h, line } as const;
    }
    return { visible: true, line } as const;
}