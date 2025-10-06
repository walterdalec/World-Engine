/**
 * Formation Facing System
 * Handles unit facing directions and arc classification for tactical combat
 */

export type Dir = 0 | 1 | 2 | 3 | 4 | 5; // axial directions: 0=E, then counter-clockwise every 60°

export const DIR_VECTORS = [
    { q: 1, r: 0 },    // 0: East
    { q: 1, r: -1 },   // 1: Northeast  
    { q: 0, r: -1 },   // 2: Northwest
    { q: -1, r: 0 },   // 3: West
    { q: -1, r: 1 },   // 4: Southwest
    { q: 0, r: 1 }     // 5: Southeast
] as const;

/**
 * Calculate the dominant direction from point A to point B
 */
export function dirBetween(a: { q: number; r: number }, b: { q: number; r: number }): Dir {
    const dq = b.q - a.q;
    const dr = b.r - a.r;

    // Handle zero vector (same position)
    if (dq === 0 && dr === 0) return 0;

    // For adjacent hexes, we can map directly
    for (let i = 0; i < 6; i++) {
        const v = DIR_VECTORS[i]!;
        if (v.q === dq && v.r === dr) {
            return i as Dir;
        }
    }

    // For non-adjacent hexes, find the best fit direction
    // Convert to cube coordinates for better angle calculation
    const dx = dq;
    const dy = dr;
    const dz = -dq - dr;

    // Find the direction vector with the smallest angle
    let best: Dir = 0;
    let bestDot = -Infinity;

    for (let i = 0; i < 6; i++) {
        const v = DIR_VECTORS[i]!;
        const vx = v.q;
        const vy = v.r;
        const vz = -v.q - v.r;

        // Dot product in cube space
        const dot = dx * vx + dy * vy + dz * vz;
        if (dot > bestDot) {
            bestDot = dot;
            best = i as Dir;
        }
    }

    return best;
}/**
 * Calculate the directional difference between two directions (0-3 steps apart)
 */
export function dirDiff(a: Dir, b: Dir): number {
    const raw = Math.abs(a - b);
    return Math.min(raw, 6 - raw); // 0..3 steps apart
}

export type Arc = 'front' | 'side' | 'rear';

/**
 * Classify the arc from which an attack is coming based on facing and attacker direction
 * @param targetFacing The direction the target is facing
 * @param attackerDirFromTarget The direction from target to attacker
 * @param tolerance How many direction steps count as "front" (default 1)
 */
export function classifyArc(targetFacing: Dir, attackerDirFromTarget: Dir, tolerance: 0 | 1 = 1): Arc {
    const d = dirDiff(targetFacing, attackerDirFromTarget);

    if (d <= tolerance) return 'front';
    if (d === 3) return 'rear';  // Exactly opposite (3 steps away)
    return 'side';  // Everything else (1-2 steps when tolerance is 0, or 2 steps when tolerance is 1)
}/**
 * Get the direction vectors for the front arc based on facing and tolerance
 */
export function getFrontArc(facing: Dir, tolerance: 0 | 1 = 1): Dir[] {
    const result: Dir[] = [facing];

    if (tolerance === 1) {
        result.push(((facing + 1) % 6) as Dir);
        result.push(((facing + 5) % 6) as Dir);
    }

    return result;
}

/**
 * Get the direction vectors for the rear arc based on facing
 */
export function getRearArc(facing: Dir, tolerance: 0 | 1 = 1): Dir[] {
    const opposite = ((facing + 3) % 6) as Dir;
    const result: Dir[] = [opposite];

    if (tolerance === 1) {
        result.push(((opposite + 1) % 6) as Dir);
        result.push(((opposite + 5) % 6) as Dir);
    }

    return result;
}