import type { Hex } from './destructibles';
import { edgeKey } from './destructibles';

export interface PathContext {
  neighbors: (h: Hex) => Hex[];
  blockedEdges: Set<string>;
  blockedCells: Set<string>;
}

const DIRS: readonly Hex[] = [
  { q: 1, r: 0 },
  { q: 1, r: -1 },
  { q: 0, r: -1 },
  { q: -1, r: 0 },
  { q: -1, r: 1 },
  { q: 0, r: 1 },
];

export function neighbors6(h: Hex): Hex[] {
  return DIRS.map((d) => ({ q: h.q + d.q, r: h.r + d.r }));
}

export function passable(ctx: PathContext, from: Hex, to: Hex): boolean {
  if (ctx.blockedCells.has(cellKey(to))) return false;
  return !ctx.blockedEdges.has(edgeKey(from, to));
}

export function pathfind(ctx: PathContext, start: Hex, goal: Hex): Hex[] {
  const open: Hex[] = [start];
  const came = new Map<string, Hex>();
  const g = new Map<string, number>([[cellKey(start), 0]]);
  const f = new Map<string, number>([[cellKey(start), heuristic(start, goal)]]);

  while (open.length) {
    open.sort((a, b) => (f.get(cellKey(a)) ?? Infinity) - (f.get(cellKey(b)) ?? Infinity));
    const current = open.shift()!;

    if (current.q === goal.q && current.r === goal.r) {
      return reconstruct(came, current);
    }

    for (const nb of ctx.neighbors(current)) {
      if (!passable(ctx, current, nb)) continue;
      const tentative = (g.get(cellKey(current)) ?? Infinity) + 1;
      if (tentative < (g.get(cellKey(nb)) ?? Infinity)) {
        came.set(cellKey(nb), current);
        g.set(cellKey(nb), tentative);
        f.set(cellKey(nb), tentative + heuristic(nb, goal));
        if (!open.find((h) => cellKey(h) === cellKey(nb))) {
          open.push(nb);
        }
      }
    }
  }

  return [start];
}

function heuristic(a: Hex, b: Hex): number {
  const ax = a.q;
  const az = -a.q - a.r;
  const ay = a.r;
  const bx = b.q;
  const bz = -b.q - b.r;
  const by = b.r;
  return Math.max(Math.abs(ax - bx), Math.abs(ay - by), Math.abs(az - bz));
}

function reconstruct(came: Map<string, Hex>, current: Hex): Hex[] {
  const out = [current];
  let k = cellKey(current);

  while (came.has(k)) {
    const prev = came.get(k)!;
    out.unshift(prev);
    k = cellKey(prev);
  }

  return out;
}

function cellKey(h: Hex): string {
  return `${h.q},${h.r}`;
}
