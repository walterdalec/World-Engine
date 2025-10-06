// packages/core/src/spell/selectors.ts
import type { Axial } from '../action/types';
import { axialDistance, hexLine, hexRingAt, los } from '../action/hex';
import type { Spell } from './types';

export type LOSFn = (h: Axial) => boolean;
export type PassableFn = (h: Axial) => boolean; // for landing checks
export type OccupiedFn = (h: Axial) => boolean; // prevent landing on units

export function selectHexes(
    spell: Spell,
    origin: Axial,
    aimed: Axial,
    blocks: LOSFn,
    passable?: PassableFn,
    occupied?: OccupiedFn
): Axial[] {
    if (axialDistance(origin, aimed) > spell.range) return [];

    const isTeleport = !!(spell.tags?.includes('teleport') || spell.tags?.includes('blink'));
    const needsLOS = spell.needsLOS !== false; // default true
    const canLand = (h: Axial) => (passable ? passable(h) : true) && (occupied ? !occupied(h) : true);

    if (spell.aoe === 'single') {
        if (isTeleport && !canLand(aimed)) return [];
        return needsLOS ? (los(origin, aimed, blocks).visible ? [aimed] : []) : [aimed];
    }

    if (spell.aoe === 'line') {
        const L = hexLine(origin, aimed).slice(1, (spell.width || spell.range) + 1);
        const out: Axial[] = [];
        for (const h of L) {
            if (blocks(h)) break;
            out.push(h);
        }
        return out;
    }

    if (spell.aoe === 'blast') {
        const radius = Math.max(0, (spell.width || 2));
        const cells: Axial[] = [];
        for (let r = 0; r <= radius; r++) {
            cells.push(...hexRingAt(aimed, r));
        }
        if (isTeleport && !canLand(aimed)) return [];
        return needsLOS ? (los(origin, aimed, blocks).visible ? cells : []) : cells;
    }

    if (spell.aoe === 'cone') {
        const length = Math.max(1, spell.width || 3);
        const main = hexLine(origin, aimed).slice(1, length + 1);
        const out = new Set<string>();
        const key = (h: Axial) => `${h.q},${h.r}`;
        const neigh = (h: Axial) => [
            { q: h.q + 1, r: h.r },
            { q: h.q + 1, r: h.r - 1 },
            { q: h.q, r: h.r - 1 },
            { q: h.q - 1, r: h.r },
            { q: h.q - 1, r: h.r + 1 },
            { q: h.q, r: h.r + 1 }
        ] as Axial[];

        for (const step of main) {
            if (blocks(step)) break;
            out.add(key(step));
            for (const n of neigh(step)) {
                out.add(key(n));
            }
        }

        return (main.length && los(origin, main[0]!, blocks).visible)
            ? Array.from(out).map(s => {
                const [q, r] = s.split(',').map(Number);
                return { q, r } as Axial;
            })
            : [];
    }

    return [];
}

/**
 * Legacy function name for compatibility
 */
export function selectTargets(
    pattern: string,
    origin: Axial,
    target: Axial,
    range: number,
    aoeSize: number
): Axial[] {
    // Create a minimal spell object for the function
    const spell: Spell = {
        id: 'temp',
        name: 'temp',
        school: 'Fire',
        level: 1,
        manaCost: 0,
        apCost: 1,
        range,
        aoe: pattern as any,
        effects: [],
        needsLOS: true
    };

    return selectHexes(spell, origin, target, () => false, () => true, () => false);
}