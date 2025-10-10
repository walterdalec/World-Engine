// ──────────────────────────────────────────────────────────────────────────────
// File: src/features/battle/hex/los.ts
// Purpose: Hex Line‑of‑Sight & Raycast utilities built on coords.ts + math.ts.
//          Supports hard occluders (tiles/edges), soft cover scoring, optional
//          elevation blocking, and visibility fields within a radius.
//
// Dependencies: src/hex/coords.ts, src/hex/math.ts
// No rendering here—pure math that your engine/AI can call.
// ──────────────────────────────────────────────────────────────────────────────

import type { AxialLike, Axial } from './coords';
import { axial, axialKey } from './coords';
import { axialLine, axialRange } from './math';

//#region Types
/** True if this tile (hex center) blocks sight fully. */
export type BlocksSightAtFn = (_hex: AxialLike) => boolean;
/** True if the boundary (edge) between two adjacent hexes blocks sight. */
export type BlocksSightEdgeFn = (_from: AxialLike, _to: AxialLike) => boolean;
/** Soft cover contribution in [0..1] (e.g., tall grass = 0.25, forest = 0.5). */
export type SoftCoverAtFn = (_hex: AxialLike) => number;
/** Optional elevation accessor (integer or float heights). */
export type ElevationAtFn = (_hex: AxialLike) => number | null | undefined;

export interface LOSOptions {
  /** Tile occlusion (solid walls, mountains). Default: always false. */
  blocksAt?: BlocksSightAtFn;
  /** Edge occlusion (walls/doors between hexes). Default: always false. */
  blocksEdge?: BlocksSightEdgeFn;
  /** Soft cover contributions per mid‑ray hex. Default: none. */
  softCoverAt?: SoftCoverAtFn;
  /** Optional elevation function. If provided, uses height to block LOS. */
  elevationAt?: ElevationAtFn;
  /** If true, an opaque target hex is still considered visible. Default true. */
  seeOpaqueTarget?: boolean;
  /** Max sum of soft cover before capping (pre‑penalty). Default: 3.0 */
  maxSoftCover?: number;
  /** Exponential factor for turning cover sum into [0..1] penalty. Default 0.7 */
  softCoverK?: number;
}

export interface RayStep {
  hex: Axial;
  index: number; // 0..N along inclusive line
  kind: 'start' | 'mid' | 'target';
  blockedTile?: boolean;
  blockedEdge?: boolean;
  softCover?: number;
  elevation?: number | null;
}

export interface Raycast {
  /** Inclusive discrete line from A to B. */
  steps: RayStep[];
  /** True if nothing blocked the ray under the chosen rules. */
  clear: boolean;
  /** Sum of soft cover contributions on mid steps (capped). */
  coverSum: number;
  /** Derived [0..1] penalty from soft cover (0 = none, 1 = fully obscured). */
  coverPenalty: number;
  /** First blocking reason if any. */
  blockedBy?: 'tile' | 'edge' | 'elevation';
}
//#endregion

//#region Helpers
function defaultFalse() {
  return false;
}
function defaultZero() {
  return 0;
}

function computeCoverPenalty(sum: number, k: number): number {
  // Smooth non‑linear mapping: 1 - e^{-k * sum}, clamped to [0,1]
  if (sum <= 0) return 0;
  const raw = 1 - Math.exp(-k * sum);
  return Math.max(0, Math.min(1, raw)); // Clamp to [0,1] for negative k
}
//#endregion

//#region Core Raycast
/**
 * Trace a ray between two axial hexes using the discrete axialLine.
 * Applies tile/edge/elevation checks to mid steps (and optionally the target).
 */
export function traceRay(a: AxialLike, b: AxialLike, opts: LOSOptions = {}): Raycast {
  const blocksAt = opts.blocksAt ?? (defaultFalse as BlocksSightAtFn);
  const blocksEdge = opts.blocksEdge ?? (defaultFalse as BlocksSightEdgeFn);
  const softCoverAt = opts.softCoverAt ?? (defaultZero as SoftCoverAtFn);
  const elevationAt = opts.elevationAt;
  const seeOpaqueTarget = opts.seeOpaqueTarget ?? true;
  const maxSoft = opts.maxSoftCover ?? 3.0;
  const k = opts.softCoverK ?? 0.7;

  const line = axialLine(a, b);
  const steps: RayStep[] = [];

  let coverSum = 0;
  let blockedBy: Raycast['blockedBy'] | undefined;
  let clear = true;

  for (let i = 0; i < line.length; i++) {
    const hex = line[i];
    const kind: RayStep['kind'] = i === 0 ? 'start' : i === line.length - 1 ? 'target' : 'mid';
    const prev = i > 0 ? line[i - 1] : undefined;

    const step: RayStep = { hex: axial(hex.q, hex.r), index: i, kind };

    // Edge blocker check for transitions (skip for first since no edge)
    if (prev) {
      const edgeBlocked = !!blocksEdge(prev, hex);
      if (edgeBlocked && kind !== 'start') {
        step.blockedEdge = true;
        if (clear) {
          clear = false;
          blockedBy = 'edge';
        }
      }
    }

    // Tile blocker check
    const opaque = !!blocksAt(hex);
    if (opaque && (kind === 'mid' || (kind === 'target' && !seeOpaqueTarget))) {
      step.blockedTile = true;
      if (clear) {
        clear = false;
        blockedBy = 'tile';
      }
    }

    // Soft cover accumulation (mid steps only)
    if (kind === 'mid') {
      const c = Math.max(0, Math.min(1, softCoverAt(hex) || 0));
      step.softCover = c;
      coverSum += c;
    }

    // Elevation occlusion (optional): if any intermediate cell's height rises
    // above the interpolated sight line from A to B, block.
    if (elevationAt) {
      const hA = elevationAt(a) ?? 0;
      const hB = elevationAt(b) ?? 0;
      const t = line.length <= 1 ? 1 : i / (line.length - 1);
      const hLine = hA + (hB - hA) * t;
      const hMid = elevationAt(hex);
      step.elevation = hMid ?? null;
      // Strictly greater than line height blocks; add bias if you want leniency.
      if (kind === 'mid' && hMid != null && hMid > hLine) {
        if (clear) {
          clear = false;
          blockedBy = 'elevation';
        }
      }
    }

    steps.push(step);
  }

  // Cap cover, compute penalty
  coverSum = Math.min(coverSum, maxSoft);
  const coverPenalty = computeCoverPenalty(coverSum, k);

  return { steps, clear, coverSum, coverPenalty, blockedBy };
}

/** Boolean LOS test sugar. */
export function hasLineOfSight(a: AxialLike, b: AxialLike, opts: LOSOptions = {}): boolean {
  return traceRay(a, b, opts).clear;
}
//#endregion

//#region Visibility Field (brute‑force within radius)
/**
 * Compute visible hexes within a radius by brute‑force ray casting.
 * Complexity ~ O(R^3), acceptable for small R (battle maps typically R ≤ 10).
 */
export function visibleWithinRadius(
  origin: AxialLike,
  radius: number,
  opts: LOSOptions = {},
): Set<string> {
  const out = new Set<string>();
  const disk = axialRange(origin, radius);
  for (const h of disk) {
    if (hasLineOfSight(origin, h, opts)) out.add(axialKey(h));
  }
  return out;
}
//#endregion

//#region Cover Utilities
export interface CoverResult {
  clear: boolean;
  penalty: number; // [0..1] obscuration penalty from soft cover
  sum: number; // raw (capped) cover sum
  blockedBy?: 'tile' | 'edge' | 'elevation';
  debug?: RayStep[];
}

/**
 * Convenience: get a compact cover/LOS read in one call. Supply opts.softCoverAt
 * to enable penalty; otherwise returns zero.
 */
export function coverBetween(a: AxialLike, b: AxialLike, opts: LOSOptions = {}): CoverResult {
  const rc = traceRay(a, b, opts);
  return {
    clear: rc.clear,
    penalty: rc.coverPenalty,
    sum: rc.coverSum,
    blockedBy: rc.blockedBy,
    debug: rc.steps,
  };
}
//#endregion
