/**
 * Road System - A* Pathfinding with Passes & Fords
 * 
 * Connects meaningful POIs (settlements, forts, ruins, dungeons) with a tiered road network.
 * Respects impassable mountains/rivers except at generated passes/fords/bridges.
 * Produces arterial roads, minor roads, and trails; includes Pixi painters.
 * 
 * Network Tiers:
 * - ARTERIAL: Major roads connecting cities/towns
 * - MINOR: Spurs connecting villages to main network
 * - TRAIL: Paths to ruins, dungeons, shrines
 * 
 * Adapted from procedural terrain generation reference code.
 */

import { Graphics, Container } from 'pixi.js';

export interface TerrainData {
    width: number;
    height: number;
    tileCost: Float32Array;
    riverMask?: Uint8Array;
    mountainMask?: Uint8Array;
    elev?: Float32Array;
    seaLevel?: number;
    crossings?: Array<{ x: number; y: number }>;
    passes?: Array<{ x: number; y: number }>;
}

export type POITag = 'CITY' | 'TOWN' | 'VILLAGE' | 'HAMLET' | 'FORTRESS' | 'RUIN' | 'DUNGEON' | 'SHRINE';

export interface POI {
    id?: string;
    pos?: { x: number; y: number };
    x?: number;
    y?: number;
    q?: number;
    r?: number;
    tag?: string;
    type?: string;
    settlementType?: string;
}

export interface Node {
    id: string;
    pos: { x: number; y: number };
    tag: POITag;
    degree: number;
    raw?: POI;
}

export interface Road {
    kind: 'ARTERIAL' | 'MINOR' | 'TRAIL';
    a: string;
    b: string;
    poly: Array<{ x: number; y: number }>;
    length: number;
}

interface CostFieldOptions {
    crossPenalty?: number;
    passPenalty?: number;
    nearRiverPenalty?: number;
}

interface ConnectOptions extends CostFieldOptions {
    kHub?: number;
    maxSpur?: number;
    maxTrail?: number;
    arterialMinTier?: POITag;
    hubTags?: POITag[];
    minorTags?: POITag[];
    siteTags?: POITag[];
}

interface SelectionResult {
    hubs: Node[];
    minors: Node[];
    sites: Node[];
}

interface PathSearchResult {
    node: Node;
    path: Array<{ x: number; y: number }>;
    pathCost: number;
}

// ---------- Cost Field ----------
export function buildCostField(data: TerrainData, opts: CostFieldOptions = {}): Float32Array {
    const W = data.width;
    const H = data.height;
    const INF = 1e9;
    const base = new Float32Array(W * H);

    // Start from tileCost baseline
    for (let i = 0; i < W * H; i++) base[i] = data.tileCost[i];

    // Rivers & mountains are impassable except at crossings/passes
    if (data.riverMask) {
        for (let i = 0; i < W * H; i++) if (data.riverMask[i]) base[i] = INF;
    }
    if (data.mountainMask) {
        for (let i = 0; i < W * H; i++) if (data.mountainMask[i]) base[i] = INF;
    }
    if (data.elev && data.seaLevel !== undefined) {
        for (let i = 0; i < W * H; i++) if (data.elev[i] <= data.seaLevel) base[i] = INF;
    }

    // Reopen legal crossing cells
    const crossPenalty = opts.crossPenalty ?? 3.0;
    const passPenalty = opts.passPenalty ?? 2.0;

    if (data.crossings) {
        for (const c of data.crossings) base[c.y * W + c.x] = Math.min(5, crossPenalty);
    }
    if (data.passes) {
        for (const p of data.passes) base[p.y * W + p.x] = Math.min(5, passPenalty);
    }

    // Soft penalty near rivers to guide to narrow points
    const nearRiver = opts.nearRiverPenalty ?? 0.4;
    if (nearRiver > 0 && data.riverMask) {
        const out = new Float32Array(base);
        for (let y = 1; y < H - 1; y++) {
            for (let x = 1; x < W - 1; x++) {
                const i = y * W + x;
                if (base[i] >= INF) continue;
                let adj = 0;
                for (let dy = -1; dy <= 1; dy++)
                    for (let dx = -1; dx <= 1; dx++) {
                        if (dx === 0 && dy === 0) continue;
                        const j = (y + dy) * W + (x + dx);
                        if (data.riverMask[j]) adj++;
                    }
                if (adj > 0) out[i] = base[i] + nearRiver * Math.min(4, adj);
            }
        }
        return out;
    }

    return base;
}

// ---------- A* Pathfinding on 8-neighbor grid ----------
export function astarPath(
    data: TerrainData,
    cost: Float32Array,
    start: { x: number; y: number },
    goal: { x: number; y: number }
): Array<{ x: number; y: number }> {
    const W = data.width;
    const H = data.height;
    const INF = 1e9;
    const idx = (x: number, y: number) => y * W + x;
    const inB = (x: number, y: number) => x >= 0 && y >= 0 && x < W && y < H;

    const sx = clampInt(Math.round(start.x), 0, W - 1);
    const sy = clampInt(Math.round(start.y), 0, H - 1);
    const gx = clampInt(Math.round(goal.x), 0, W - 1);
    const gy = clampInt(Math.round(goal.y), 0, H - 1);

    if (cost[idx(sx, sy)] >= INF || cost[idx(gx, gy)] >= INF) return [];

    const h = (x: number, y: number) => Math.hypot(x - gx, y - gy);
    const open = new MinHeap<{ i: number; x: number; y: number; f: number }>((a, b) => a.f - b.f);

    const came = new Int32Array(W * H).fill(-1);
    const gScore = new Float32Array(W * H).fill(Infinity);
    const fScore = new Float32Array(W * H).fill(Infinity);

    const startI = idx(sx, sy);
    gScore[startI] = 0;
    fScore[startI] = h(sx, sy);
    open.push({ i: startI, x: sx, y: sy, f: fScore[startI] });

    const nbr: Array<[number, number, number]> = [
        [-1, 0, 1],
        [1, 0, 1],
        [0, -1, 1],
        [0, 1, 1],
        [-1, -1, Math.SQRT2],
        [1, -1, Math.SQRT2],
        [-1, 1, Math.SQRT2],
        [1, 1, Math.SQRT2],
    ];

    while (open.size() > 0) {
        const cur = open.pop()!;
        if (cur.i === idx(gx, gy)) break;

        const cx = cur.x;
        const cy = cur.y;
        for (const [dx, dy, mul] of nbr) {
            const nx = cx + dx;
            const ny = cy + dy;
            if (!inB(nx, ny)) continue;
            const ni = idx(nx, ny);
            const c = cost[ni];
            if (!isFinite(c) || c >= INF) continue;
            const step = ((cost[cur.i] + c) * 0.5 * mul); // avg cell cost * distance
            const tentative = gScore[cur.i] + step;
            if (tentative < gScore[ni]) {
                came[ni] = cur.i;
                gScore[ni] = tentative;
                const f = tentative + h(nx, ny);
                fScore[ni] = f;
                open.push({ i: ni, x: nx, y: ny, f });
            }
        }
    }

    // Reconstruct path
    const out: Array<{ x: number; y: number }> = [];
    let ci = idx(gx, gy);
    if (came[ci] === -1) return out;
    while (ci !== -1) {
        const x = ci % W;
        const y = (ci / W) | 0;
        out.push({ x, y });
        ci = came[ci];
    }
    out.reverse();
    return out;
}

// ---------- Path Postprocess ----------
export function simplifyRDP(points: Array<{ x: number; y: number }>, epsilon = 1.5): Array<{ x: number; y: number }> {
    if (points.length < 3) return points.slice();
    const out = [points[0]];
    rdp(0, points.length - 1, points, epsilon, out);
    out.push(points[points.length - 1]);
    return out;
}

function rdp(a: number, b: number, pts: Array<{ x: number; y: number }>, eps: number, out: Array<{ x: number; y: number }>) {
    let maxD = 0;
    let idx = -1;
    const A = pts[a];
    const B = pts[b];
    for (let i = a + 1; i < b; i++) {
        const d = pointLineDistance(pts[i], A, B);
        if (d > maxD) {
            maxD = d;
            idx = i;
        }
    }
    if (maxD > eps) {
        rdp(a, idx, pts, eps, out);
        out.push(pts[idx]);
        rdp(idx, b, pts, eps, out);
    }
}

function pointLineDistance(P: { x: number; y: number }, A: { x: number; y: number }, B: { x: number; y: number }): number {
    const vx = B.x - A.x;
    const vy = B.y - A.y;
    const wx = P.x - A.x;
    const wy = P.y - A.y;
    const c1 = vx * wx + vy * wy;
    const c2 = vx * vx + vy * vy;
    const t = c2 ? Math.max(0, Math.min(1, c1 / c2)) : 0;
    const px = A.x + t * vx;
    const py = A.y + t * vy;
    return Math.hypot(P.x - px, P.y - py);
}

export function smoothPath(
    points: Array<{ x: number; y: number }>,
    { tension = 0.5, segments = 8 } = {}
): Array<{ x: number; y: number }> {
    if (points.length < 3) return points.slice();
    const out: Array<{ x: number; y: number }> = [];
    for (let i = -1; i < points.length - 2; i++) {
        const p0 = points[Math.max(0, i)];
        const p1 = points[i + 1];
        const p2 = points[i + 2];
        const p3 = points[Math.min(points.length - 1, i + 3)];
        for (let t = 0; t <= 1; t += 1 / segments) {
            const tt = t;
            const tt2 = tt * tt;
            const tt3 = tt2 * tt;
            const q0 = -tension * tt3 + 2 * tension * tt2 - tension * tt;
            const q1 = (2 - tension) * tt3 + (tension - 3) * tt2 + 1;
            const q2 = (tension - 2) * tt3 + (3 - 2 * tension) * tt2 + tension * tt;
            const q3 = tension * tt3 - tension * tt2;
            const x = q0 * p0.x + q1 * p1.x + q2 * p2.x + q3 * p3.x;
            const y = q0 * p0.y + q1 * p1.y + q2 * p2.y + q3 * p3.y;
            out.push({ x, y });
        }
    }
    return out;
}

// ---------- POI Selection & Network Build ----------
export function selectRoadTargets(pois: POI[], opts: ConnectOptions = {}): SelectionResult {
    const hubTags = opts.hubTags ?? ['CITY', 'TOWN', 'FORTRESS'];
    const minorTags = opts.minorTags ?? ['VILLAGE', 'HAMLET'];
    const siteTags = opts.siteTags ?? ['RUIN', 'DUNGEON', 'SHRINE'];

    const hubs: Node[] = [];
    const minors: Node[] = [];
    const sites: Node[] = [];

    for (const p of pois) {
        const tag = normalizePOITag(p);
        const node: Node = {
            id: p.id ?? makePOIId(p),
            pos: p.pos ?? { x: p.x ?? p.q ?? 0, y: p.y ?? p.r ?? 0 },
            tag,
            degree: 0,
            raw: p,
        };

        if (hubTags.includes(tag)) hubs.push(node);
        else if (minorTags.includes(tag)) minors.push(node);
        else if (siteTags.includes(tag)) sites.push(node);
    }

    return { hubs, minors, sites };
}

export function connectPOIs(pois: POI[], data: TerrainData, opts: ConnectOptions = {}): { roads: Road[]; nodes: Node[] } {
    const { hubs, minors, sites } = selectRoadTargets(pois, opts);
    const kHub = opts.kHub ?? 3;
    const maxSpur = opts.maxSpur ?? 380;
    const maxTrail = opts.maxTrail ?? 280;

    const cost = buildCostField(data, opts);
    const roads: Road[] = [];
    const nodes: Node[] = [...hubs, ...minors, ...sites];

    // --- 1) Trunk network among hubs
    const edges = kNearestEdges(hubs, kHub);
    const parent = new DisjointSet(hubs.length);
    const planned = new Set<string>();

    for (const e of edges.sort((a, b) => a.d - b.d)) {
        if (parent.find(e.i) !== parent.find(e.j)) {
            const r = addRoadBetween(hubs[e.i], hubs[e.j], 'ARTERIAL');
            if (r) {
                parent.union(e.i, e.j);
                markDegree(hubs[e.i], hubs[e.j]);
            }
        }
    }

    // --- 2) Spurs from minors to nearest hub/trunk node
    for (const m of minors) {
        const nearest = nearestByPath(m, hubs, data, cost, 3);
        if (!nearest) continue;
        if (nearest.pathCost > maxSpur) continue;
        const r = addRoadPolyline(m, nearest.node, nearest.path, 'MINOR');
        if (r) markDegree(m, nearest.node);
    }

    // --- 3) Trails to sites (ruins/dungeons/shrines)
    for (const s of sites) {
        const candidates = [...hubs, ...minors].filter((n) => n.degree > 0);
        const near = nearestByPath(s, candidates.length ? candidates : hubs, data, cost, 3);
        if (!near) continue;
        if (near.pathCost > maxTrail) continue;
        const r = addRoadPolyline(s, near.node, near.path, 'TRAIL');
        if (r) markDegree(s, near.node);
    }

    return { roads, nodes };

    // Helpers
    function addRoadBetween(A: Node, B: Node, kind: 'ARTERIAL' | 'MINOR' | 'TRAIL'): Road | null {
        const raw = astarPath(data, cost, A.pos, B.pos);
        if (!raw.length) return null;
        return addRoadPolyline(A, B, raw, kind);
    }

    function addRoadPolyline(A: Node, B: Node, raw: Array<{ x: number; y: number }>, kind: 'ARTERIAL' | 'MINOR' | 'TRAIL'): Road | null {
        const key = A.id < B.id ? `${A.id}-${B.id}` : `${B.id}-${A.id}`;
        if (planned.has(key)) return null;
        planned.add(key);
        const simple = simplifyRDP(raw, 1.25);
        const smooth = smoothPath(simple, { tension: 0.5, segments: 6 });
        const road: Road = { kind, a: A.id, b: B.id, poly: smooth, length: pathLength(smooth) };
        roads.push(road);
        return road;
    }
}

function kNearestEdges(nodes: Node[], k: number): Array<{ i: number; j: number; d: number }> {
    const edges: Array<{ i: number; j: number; d: number }> = [];
    for (let i = 0; i < nodes.length; i++) {
        const A = nodes[i];
        const d: Array<{ j: number; d: number }> = [];
        for (let j = 0; j < nodes.length; j++)
            if (i !== j) {
                const B = nodes[j];
                d.push({ j, d: Math.hypot(A.pos.x - B.pos.x, A.pos.y - B.pos.y) });
            }
        d.sort((a, b) => a.d - b.d)
            .slice(0, k)
            .forEach(({ j, d: dist }) => edges.push({ i, j, d: dist }));
    }
    return edges;
}

function nearestByPath(from: Node, targets: Node[], data: TerrainData, cost: Float32Array, sample = 3): PathSearchResult | null {
    if (!targets.length) return null;
    const scored: PathSearchResult[] = [];

    // Sample a few nearest by euclidean, then compute true path
    const near = [...targets]
        .sort(
            (a, b) =>
                Math.hypot(from.pos.x - a.pos.x, from.pos.y - a.pos.y) - Math.hypot(from.pos.x - b.pos.x, from.pos.y - b.pos.y)
        )
        .slice(0, Math.min(sample, targets.length));

    for (const t of near) {
        const raw = astarPath(data, cost, from.pos, t.pos);
        if (!raw.length) continue;
        scored.push({ node: t, path: raw, pathCost: pathCostApprox(raw, cost, data.width) });
    }

    if (!scored.length) return null;
    scored.sort((a, b) => a.pathCost - b.pathCost);
    return scored[0];
}

function pathCostApprox(poly: Array<{ x: number; y: number }>, cost: Float32Array, W: number): number {
    let s = 0;
    for (const p of poly) s += cost[((p.y | 0) * W + (p.x | 0))];
    return s / Math.max(1, poly.length);
}

function markDegree(a: Node, b: Node): void {
    a.degree++;
    b.degree++;
}

function makePOIId(p: POI): string {
    return `${(p.tag || p.type || 'POI')}-${Math.round(p.x ?? p.q ?? 0)}-${Math.round(p.y ?? p.r ?? 0)}`;
}

function normalizePOITag(p: POI): POITag {
    const t = (p.tag || p.type || p.settlementType || '').toUpperCase();
    if (t.includes('CITY')) return 'CITY';
    if (t.includes('TOWN')) return 'TOWN';
    if (t.includes('VILLAGE')) return 'VILLAGE';
    if (t.includes('HAMLET')) return 'HAMLET';
    if (t.includes('FORT')) return 'FORTRESS';
    if (t.includes('RUIN')) return 'RUIN';
    if (t.includes('DUNGEON')) return 'DUNGEON';
    if (t.includes('SHRINE')) return 'SHRINE';
    return 'HAMLET';
}

function pathLength(p: Array<{ x: number; y: number }>): number {
    let L = 0;
    for (let i = 1; i < p.length; i++) L += Math.hypot(p[i].x - p[i - 1].x, p[i].y - p[i - 1].y);
    return L;
}

// ---------- Pixi Painting ----------
export function paintRoadsPIXI(container: Graphics, roads: Road[], opts: { zIndex?: number } = {}): Graphics {
    const g = new Graphics();
    if (opts.zIndex !== undefined) g.zIndex = opts.zIndex;

    for (const r of roads) {
        const style =
            r.kind === 'ARTERIAL'
                ? { w: 3, c: 0xc2a266 }
                : r.kind === 'MINOR'
                ? { w: 2, c: 0x9b7e45 }
                : { w: 1, c: 0x556b2f };

        g.lineStyle(style.w, style.c, 1.0);

        let first = true;
        for (const p of r.poly) {
            if (first) {
                g.moveTo(p.x, p.y);
                first = false;
            } else {
                g.lineTo(p.x, p.y);
            }
        }
    }

    container.addChild(g);
    return g;
}

export function paintRoadEndpointsPIXI(container: Container, nodes: Node[], opts: { zIndex?: number } = {}): Container {
    const layer = new Container();
    if (opts.zIndex !== undefined) layer.zIndex = opts.zIndex;

    const colors: Record<POITag, number> = {
        CITY: 0xffd166,
        TOWN: 0xf6ae2d,
        VILLAGE: 0x9ccc65,
        HAMLET: 0xaed581,
        FORTRESS: 0xc0392b,
        RUIN: 0x8d6e63,
        DUNGEON: 0x7e57c2,
        SHRINE: 0x64b5f6,
    };

    for (const n of nodes) {
        const g = new Graphics();
        g.beginFill(colors[n.tag] ?? 0xffffff, 1);
        const r = n.tag === 'CITY' || n.tag === 'FORTRESS' ? 5 : n.tag === 'TOWN' ? 4 : 3;
        g.drawCircle(n.pos.x, n.pos.y, r);
        g.endFill();
        layer.addChild(g);
    }

    container.addChild(layer);
    return layer;
}

// ---------- Utils ----------
class DisjointSet {
    private p: Int32Array;
    private r: Int32Array;

    constructor(n: number) {
        this.p = new Int32Array(n);
        this.r = new Int32Array(n);
        for (let i = 0; i < n; i++) this.p[i] = i;
    }

    find(x: number): number {
        while (this.p[x] !== x) {
            this.p[x] = this.p[this.p[x]];
            x = this.p[x];
        }
        return x;
    }

    union(a: number, b: number): void {
        a = this.find(a);
        b = this.find(b);
        if (a === b) return;
        if (this.r[a] < this.r[b]) this.p[a] = b;
        else if (this.r[b] < this.r[a]) this.p[b] = a;
        else {
            this.p[b] = a;
            this.r[a]++;
        }
    }
}

class MinHeap<T> {
    private cmp: (_a: T, _b: T) => number;
    private arr: T[];

    constructor(cmp: (_a: T, _b: T) => number) {
        this.cmp = cmp;
        this.arr = [];
    }

    size(): number {
        return this.arr.length;
    }

    push(v: T): void {
        const a = this.arr;
        a.push(v);
        let i = a.length - 1;
        while (i > 0) {
            const p = (i - 1) >> 1;
            if (this.cmp(a[i], a[p]) >= 0) break;
            [a[i], a[p]] = [a[p], a[i]];
            i = p;
        }
    }

    pop(): T | undefined {
        const a = this.arr;
        if (a.length === 0) return undefined;
        if (a.length === 1) return a.pop();
        const top = a[0];
        a[0] = a.pop()!;
        this._down(0);
        return top;
    }

    private _down(i: number): void {
        const a = this.arr;
        const n = a.length;
        while (true) {
            const l = i * 2 + 1;
            const r = l + 1;
            let m = i;
            if (l < n && this.cmp(a[l], a[m]) < 0) m = l;
            if (r < n && this.cmp(a[r], a[m]) < 0) m = r;
            if (m === i) break;
            [a[i], a[m]] = [a[m], a[i]];
            i = m;
        }
    }
}

function clampInt(v: number, lo: number, hi: number): number {
    return v < lo ? lo : v > hi ? hi : (v | 0);
}
