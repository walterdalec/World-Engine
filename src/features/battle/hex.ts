/**
 * hex.ts - Essential hex grid utilities for tactical battle system
 * Minimal, production-ready hex coordinate math
 */

export interface HexCoord {
    q: number; // column (axial coordinate)
    r: number; // row (axial coordinate)  
}

export interface CubeCoord {
    x: number;
    y: number;
    z: number;
}

// Convert axial to cube coordinates for distance calculations
export function axialToCube(hex: HexCoord): CubeCoord {
    const x = hex.q;
    const z = hex.r;
    const y = -x - z;
    return { x, y, z };
}

// Convert cube back to axial coordinates
export function cubeToAxial(cube: CubeCoord): HexCoord {
    return { q: cube.x, r: cube.z };
}

// Distance between two hex coordinates using cube math
export function hexDistance(a: HexCoord, b: HexCoord): number {
    const ac = axialToCube(a);
    const bc = axialToCube(b);
    return Math.max(
        Math.abs(ac.x - bc.x),
        Math.abs(ac.y - bc.y),
        Math.abs(ac.z - bc.z)
    );
}

// Get the 6 neighboring hexes (pointy-top orientation)
export function hexNeighbors(center: HexCoord): HexCoord[] {
    return [
        { q: center.q + 1, r: center.r },     // 0: right
        { q: center.q + 1, r: center.r - 1 }, // 1: top-right
        { q: center.q, r: center.r - 1 },     // 2: top-left
        { q: center.q - 1, r: center.r },     // 3: left
        { q: center.q - 1, r: center.r + 1 }, // 4: bottom-left
        { q: center.q, r: center.r + 1 },     // 5: bottom-right
    ];
}

// Get hex in specific direction from center
export function hexDirection(center: HexCoord, direction: number): HexCoord {
    const neighbors = hexNeighbors(center);
    return neighbors[direction % 6];
}

// BFS to find all hexes within range (movement points)
export function hexRange(center: HexCoord, range: number): HexCoord[] {
    const results: HexCoord[] = [];

    for (let q = -range; q <= range; q++) {
        const r1 = Math.max(-range, -q - range);
        const r2 = Math.min(range, -q + range);

        for (let r = r1; r <= r2; r++) {
            const hex = { q: center.q + q, r: center.r + r };
            results.push(hex);
        }
    }

    return results;
}

// Get all hexes at specific distance (ring)
export function hexRing(center: HexCoord, radius: number): HexCoord[] {
    if (radius === 0) return [center];

    const results: HexCoord[] = [];
    let hex = { q: center.q - radius, r: center.r + radius };

    for (let direction = 0; direction < 6; direction++) {
        for (let step = 0; step < radius; step++) {
            results.push({ ...hex });
            hex = hexDirection(hex, direction);
        }
    }

    return results;
}

// Simple pathfinding between two hexes (straight line approximation)
export function hexLinePath(start: HexCoord, end: HexCoord): HexCoord[] {
    const distance = hexDistance(start, end);
    if (distance === 0) return [start];

    const path: HexCoord[] = [];

    for (let i = 0; i <= distance; i++) {
        const t = i / distance;
        const q = Math.round(start.q * (1 - t) + end.q * t);
        const r = Math.round(start.r * (1 - t) + end.r * t);
        path.push({ q, r });
    }

    return path;
}

// Check if hex coordinate is valid (for grid bounds)
export function isValidHex(hex: HexCoord, bounds?: { minQ: number; maxQ: number; minR: number; maxR: number }): boolean {
    if (!bounds) return true;

    return hex.q >= bounds.minQ &&
        hex.q <= bounds.maxQ &&
        hex.r >= bounds.minR &&
        hex.r <= bounds.maxR;
}

// Convert hex to string key for Maps/Sets
export function hexKey(hex: HexCoord): string {
    return `${hex.q},${hex.r}`;
}

// Parse hex from string key
export function keyToHex(key: string): HexCoord {
    const [q, r] = key.split(',').map(Number);
    return { q, r };
}

// Get all hexes in a filled area (blast radius)
export function hexBlast(center: HexCoord, radius: number): HexCoord[] {
    const results: HexCoord[] = [];

    for (let distance = 0; distance <= radius; distance++) {
        if (distance === 0) {
            results.push(center);
        } else {
            results.push(...hexRing(center, distance));
        }
    }

    return results;
}

// ==================== PATHFINDING ALGORITHMS ====================

/**
 * Binary Heap Priority Queue for A* pathfinding
 */
class MinHeap<T> {
    private data: { k: number; v: T }[] = [];

    size(): number {
        return this.data.length;
    }

    push(k: number, v: T): void {
        const a = this.data;
        a.push({ k, v });
        this.up(a.length - 1);
    }

    pop(): T | undefined {
        const a = this.data;
        if (!a.length) return;

        const top = a[0]!.v;
        const last = a.pop()!;

        if (a.length) {
            a[0] = last;
            this.down(0);
        }

        return top;
    }

    private up(i: number): void {
        const a = this.data;
        while (i) {
            const p = (i - 1) >> 1;
            if (a[p]!.k <= a[i]!.k) break;
            [a[p]!, a[i]!] = [a[i]!, a[p]!];
            i = p;
        }
    }

    private down(i: number): void {
        const a = this.data;
        for (; ;) {
            const l = i * 2 + 1;
            const r = l + 1;
            let m = i;

            if (l < a.length && a[l]!.k < a[m]!.k) m = l;
            if (r < a.length && a[r]!.k < a[m]!.k) m = r;
            if (m === i) break;

            [a[m]!, a[i]!] = [a[i]!, a[m]!];
            i = m;
        }
    }
}

// Pathfinding function types
export type CostFn = (hex: HexCoord) => number;
export type PassableFn = (hex: HexCoord) => boolean;
export type BlockerFn = (hex: HexCoord) => boolean;

/**
 * Calculate movement range within budget using cost-accumulating BFS
 */
export function hexMoveRange(
    start: HexCoord,
    budget: number,
    cost: CostFn,
    passable: PassableFn = () => true
): Set<string> {
    const frontier: HexCoord[] = [start];
    const visited = new Map<string, number>();
    visited.set(hexKey(start), 0);

    while (frontier.length) {
        const cur = frontier.shift()!;
        const curCost = visited.get(hexKey(cur))!;

        for (const neighbor of hexNeighbors(cur)) {
            if (!passable(neighbor)) continue;

            const step = cost(neighbor);
            if (step < 0) continue;

            const newCost = curCost + step;
            const key = hexKey(neighbor);

            if (newCost <= budget && (!visited.has(key) || newCost < visited.get(key)!)) {
                visited.set(key, newCost);
                frontier.push(neighbor);
            }
        }
    }

    return new Set(visited.keys());
}

/**
 * Find shortest path using A* algorithm
 */
export function hexFindPath(
    start: HexCoord,
    goal: HexCoord,
    cost: CostFn,
    passable: PassableFn = () => true
): HexCoord[] | null {
    if (hexKey(start) === hexKey(goal)) return [start];

    const open = new MinHeap<HexCoord>();
    const g = new Map<string, number>();
    const came = new Map<string, HexCoord>();
    const startKey = hexKey(start);

    g.set(startKey, 0);
    open.push(0, start);

    while (open.size()) {
        const cur = open.pop()!;
        const curKey = hexKey(cur);

        if (curKey === hexKey(goal)) {
            // Reconstruct path
            const path: HexCoord[] = [cur];
            let k = curKey;
            while (came.has(k)) {
                const prev = came.get(k)!;
                path.push(prev);
                k = hexKey(prev);
            }
            return path.reverse();
        }

        const base = g.get(curKey)!;
        for (const neighbor of hexNeighbors(cur)) {
            if (!passable(neighbor)) continue;

            const step = cost(neighbor);
            if (step < 0) continue;

            const tentative = base + step;
            const nk = hexKey(neighbor);

            if (!g.has(nk) || tentative < g.get(nk)!) {
                g.set(nk, tentative);
                came.set(nk, cur);
                const h = hexDistance(neighbor, goal);
                open.push(tentative + h, neighbor);
            }
        }
    }

    return null;
}

/**
 * Line-of-sight check with blocker detection
 */
export interface LOSResult {
    visible: boolean;
    occluder?: HexCoord;
    line: HexCoord[];
}

export function hexLineOfSight(
    start: HexCoord,
    target: HexCoord,
    blocks: BlockerFn,
    opts?: { includeTarget?: boolean }
): LOSResult {
    const line = hexLinePath(start, target);
    const includeTarget = opts?.includeTarget ?? true;

    // Skip origin, check up to (but optionally including) target
    const end = includeTarget ? line.length : Math.max(0, line.length - 1);

    for (let i = 1; i < end; i++) {
        const hex = line[i]!;
        if (blocks(hex)) {
            return { visible: false, occluder: hex, line };
        }
    }

    return { visible: true, line };
}