import type { Hex } from '../v30/field';

export interface AuraSpec {
    radius: number;
    strength: number;
}

export function auraAt(commanderPos: Hex, unitPos: Hex, aura: AuraSpec): number {
    const distance = hexDist(commanderPos, unitPos);
    if (distance > aura.radius) return 0;

    // Linear falloff: full strength at distance 0, zero at radius
    const falloff = Math.max(0, 1 - distance / aura.radius);
    return aura.strength * falloff;
}

function hexDist(a: Hex, b: Hex): number {
    const ax = a.q;
    const ay = a.r;
    const az = -ax - ay;
    const bx = b.q;
    const by = b.r;
    const bz = -bx - by;
    return Math.max(Math.abs(ax - bx), Math.abs(ay - by), Math.abs(az - bz));
}