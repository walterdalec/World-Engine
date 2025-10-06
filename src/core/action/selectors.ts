/**
 * Targeting Helpers for Action System
 * Select hexes based on action patterns and ranges
 */

import { axialDistance, hexLine, hexRingAt, hexBlastAt } from './hex';
import type { Axial } from './types';

export function selectSingle(origin: Axial, target: Axial, range: number): Axial[] {
    return axialDistance(origin, target) <= range ? [target] : [];
}

export function selectLine(origin: Axial, target: Axial, range: number): Axial[] {
    const line = hexLine(origin, target);
    return line.length - 1 <= range ? line.slice(1) : [];
}

export function selectBlast(center: Axial, radius: number): Axial[] {
    return hexBlastAt(center, radius);
}

export function selectCone(origin: Axial, toward: Axial, length: number): Axial[] {
    // Minimal cone: union of lines fanning within 60° around origin→toward
    const out: Axial[] = [];
    for (let i = 1; i <= length; i++) {
        const line = hexLine(origin, toward).slice(1, i + 1);
        out.push(...line);
    }
    return out;
}

export function selectRing(center: Axial, radius: number): Axial[] {
    return hexRingAt(center, radius);
}

export function selectSelf(origin: Axial): Axial[] {
    return [origin];
}

export function selectMulti(targets: Axial[], range: number, origin: Axial): Axial[] {
    return targets.filter(target => axialDistance(origin, target) <= range);
}