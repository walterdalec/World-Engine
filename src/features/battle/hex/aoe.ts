// ──────────────────────────────────────────────────────────────────────────────
// File: src/features/battle/hex/aoe.ts
// Purpose: Pure‑math AoE template generators for a hex grid. Produces sets of
//          hexes for circle/disc, donut/annulus, thick lines/beams, cones with
//          configurable aperture, and utility set ops + LOS filtering hooks.
//
// Dependencies: coords.ts, math.ts, (optionally) los.ts
// No rendering here. Results are Axial[] plus Set<string> helpers.
// ──────────────────────────────────────────────────────────────────────────────

import type { Axial, AxialLike, CubeLike } from './coords';
import { axial, axialKey, axialToCube, cubeToAxial, CUBE_DIRS } from './coords';
import { axialRange, cubeAdd, cubeScale, cubeLine, cubeDirection } from './math';
import type { Direction } from './math';

//#region Types

export interface LineSpec {
  dir: Direction;
  length: number;
  /** Thickness in hexes (1 = single file, 2 = add one ring lateral, etc.). */
  thickness?: number;
  /** Include the origin cell in the mask. Default true. */
  includeOrigin?: boolean;
}

export interface ConeSpec {
  dir: Direction;
  /** Radius in hex steps. */
  radius: number;
  /** Aperture measured in adjacent direction steps on each side of `dir`.
   * 0 → narrow (≈60°), 1 → medium (≈120°), 2 → wide (≈180°). */
  widen?: 0 | 1 | 2;
  /** Include the origin cell in the mask. Default false. */
  includeOrigin?: boolean;
}

export interface DonutSpec {
  min: number;
  max: number;
  includeOrigin?: boolean; // ignored if min>0
}

export type HexSet = Set<string>;
//#endregion

//#region Helpers — sets
export function toKeySet(list: AxialLike[]): HexSet {
  const s = new Set<string>();
  for (const h of list) s.add(axialKey(h));
  return s;
}

export function fromKeySet(keys: Iterable<string>): Axial[] {
  const out: Axial[] = [];
  const keyArray = Array.from(keys); // ES5 compatible iteration
  for (const k of keyArray) {
    const [q, r] = k.split(',').map(Number);
    out.push(axial(q, r));
  }
  return out;
}

export function setUnion(a: HexSet, b: HexSet): HexSet {
  const s = new Set(a);
  const bArray = Array.from(b); // ES5 compatible iteration
  for (const k of bArray) s.add(k);
  return s;
}

export function setIntersect(a: HexSet, b: HexSet): HexSet {
  const s = new Set<string>();
  const smaller = a.size <= b.size ? a : b;
  const bigger = a.size <= b.size ? b : a;
  const smallerArray = Array.from(smaller); // ES5 compatible iteration
  for (const k of smallerArray) if (bigger.has(k)) s.add(k);
  return s;
}

export function setDiff(a: HexSet, b: HexSet): HexSet {
  const s = new Set<string>();
  const aArray = Array.from(a); // ES5 compatible iteration
  for (const k of aArray) if (!b.has(k)) s.add(k);
  return s;
}
//#endregion

//#region Circle / Disk / Donut
export function aoeCircle(center: AxialLike, radius: number): Axial[] {
  return axialRange(center, radius);
}

export function aoeDonut(center: AxialLike, spec: DonutSpec): Axial[] {
  const { min, max } = spec;
  if (min < 0 || max < 0 || max < min) return [];
  if (max === 0) return spec.includeOrigin ? [axial(center.q, center.r)] : [];
  const ring = axialRange(center, max);
  if (min === 0) return ring;
  const inner = new Set(aoeCircle(center, min - 1).map(axialKey));
  return ring.filter(h => !inner.has(axialKey(h)));
}
//#endregion

//#region Direction utilities
/** Minimal difference between direction indices on 6‑cycle. */
export function dirDiff(a: number, b: number): number {
  const d = Math.abs(a - b) % 6;
  return Math.min(d, 6 - d);
}

/** Which of the 6 cardinal directions most closely matches `rel`? */
export function dominantDirectionIndex(rel: CubeLike): Direction {
  // Choose the direction with maximum dot product
  let best = 0;
  let bestDot = -Infinity;
  for (let i = 0; i < 6; i++) {
    const d = CUBE_DIRS[i];
    const dot = rel.x * d.x + rel.y * d.y + rel.z * d.z;
    if (dot > bestDot) {
      bestDot = dot;
      best = i;
    }
  }
  return best as Direction;
}
//#endregion

//#region Line / Beam (with thickness)
/**
 * Build a thick line by marching `length` steps along `dir` and expanding
 * laterally by `thickness-1` using side directions (dir±2) each step.
 */
export function aoeLine(center: AxialLike, spec: LineSpec): Axial[] {
  const { dir, length } = spec;
  const thickness = Math.max(1, spec.thickness ?? 1);
  const includeOrigin = spec.includeOrigin ?? true;

  const results = new Set<string>();
  const start = axialToCube(center);
  const fwd = cubeDirection(dir);
  const sideL = cubeDirection(((dir + 2) % 6) as Direction);
  const sideR = cubeDirection(((dir + 4) % 6) as Direction);

  if (includeOrigin) results.add(axialKey(center));

  let cursor = start;
  for (let step = 1; step <= length; step++) {
    cursor = cubeAdd(cursor, fwd);
    // center column
    const cAx = cubeToAxial(cursor);
    results.add(axialKey(cAx));
    // lateral expansion
    for (let w = 1; w < thickness; w++) {
      const L = cubeAdd(cursor, cubeScale(sideL, w));
      const R = cubeAdd(cursor, cubeScale(sideR, w));
      results.add(axialKey(cubeToAxial(L)));
      results.add(axialKey(cubeToAxial(R)));
    }
  }

  return fromKeySet(results);
}

/** A bolt between two points, optionally truncated by maxLength. */
export function aoeBoltBetween(a: AxialLike, b: AxialLike, maxLength?: number): Axial[] {
  const line = cubeLine(axialToCube(a), axialToCube(b)).map(cubeToAxial);
  if (maxLength == null) return line;
  return line.slice(0, Math.min(line.length, Math.max(0, maxLength + 1)));
}
//#endregion

//#region Cones
/**
 * Hex cone centered at `center`, facing `dir`, radius `radius`, aperture by
 * `widen` (0..2). Uses dominant direction classification to keep it cheap.
 */
export function aoeCone(center: AxialLike, spec: ConeSpec): Axial[] {
  const { dir, radius } = spec;
  const widen = spec.widen ?? 1;
  const includeOrigin = spec.includeOrigin ?? false;

  const c0 = axialToCube(center);
  const disk = axialRange(center, radius);
  const out: Axial[] = [];

  for (const h of disk) {
    const rel = axialToCube(h);
    // translate rel to be relative to center
    const v = { x: rel.x - c0.x, y: rel.y - c0.y, z: rel.z - c0.z };
    const r = Math.max(Math.abs(v.x), Math.abs(v.y), Math.abs(v.z));
    if (r === 0) {
      if (includeOrigin) out.push(axial(h.q, h.r));
      continue;
    }
    const d = dominantDirectionIndex(v);
    if (dirDiff(d, dir) <= widen) out.push(axial(h.q, h.r));
  }

  return out;
}
//#endregion

//#region Filtering by LOS / blockers (optional)
export interface LOSLike {
  hasLineOfSight: (_a: AxialLike, _b: AxialLike) => boolean;
}

/** Filter a set of AoE hexes by a boolean LOS test. */
export function filterByLOS(origin: AxialLike, cells: AxialLike[], los: LOSLike): Axial[] {
  return cells.filter(h => los.hasLineOfSight(origin, h));
}

/** Stop a bolt/line early when a predicate says the segment is blocked. */
export function clipLineByBlockers(
  origin: AxialLike,
  cellsAlongLine: AxialLike[],
  isBlockedAt: (_hex: AxialLike) => boolean,
  includeBlockedCell = true
): Axial[] {
  const out: Axial[] = [];
  for (const h of cellsAlongLine) {
    out.push(axial(h.q, h.r));
    if (isBlockedAt(h)) {
      if (!includeBlockedCell) out.pop();
      break;
    }
  }
  return out;
}
//#endregion

//#region Convenience bundles
export function circleKeys(center: AxialLike, radius: number): HexSet {
  return toKeySet(aoeCircle(center, radius));
}

export function donutKeys(center: AxialLike, spec: DonutSpec): HexSet {
  return toKeySet(aoeDonut(center, spec));
}

export function lineKeys(center: AxialLike, spec: LineSpec): HexSet {
  return toKeySet(aoeLine(center, spec));
}

export function coneKeys(center: AxialLike, spec: ConeSpec): HexSet {
  return toKeySet(aoeCone(center, spec));
}
//#endregion
