import type { Hex } from './destructibles';
import { edgeKey as segEdgeKey } from './destructibles';

export interface LOSContext {
  blockedEdges: Set<string>;
  blockedCells: Set<string>;
}

export function hasLOS(ctx: LOSContext, a: Hex, b: Hex): boolean {
  const line = cubeLine(a, b);
  for (let i = 0; i < line.length - 1; i += 1) {
    const h = line[i]!;
    const e = segEdgeKey(h, line[i + 1]!);
    if (ctx.blockedCells.has(cellKey(h)) || ctx.blockedEdges.has(e)) {
      return false;
    }
  }
  return true;
}

function cubeLine(a: Hex, b: Hex): Hex[] {
  const N = hexDist(a, b);
  const out: Hex[] = [];
  for (let i = 0; i <= N; i += 1) {
    const t = N === 0 ? 0 : i / N;
    const cube = cubeRound(cubeLerp(axialToCube(a), axialToCube(b), t));
    out.push({ q: cube.x, r: cube.z });
  }
  return out;
}

function axialToCube(h: Hex) {
  const x = h.q;
  const z = h.r;
  const y = -x - z;
  return { x, y, z };
}

function cubeLerp(a: any, b: any, t: number) {
  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
    z: a.z + (b.z - a.z) * t,
  };
}

function cubeRound(c: any) {
  let rx = Math.round(c.x);
  let ry = Math.round(c.y);
  let rz = Math.round(c.z);

  const dx = Math.abs(rx - c.x);
  const dy = Math.abs(ry - c.y);
  const dz = Math.abs(rz - c.z);

  if (dx > dy && dx > dz) {
    rx = -ry - rz;
  } else if (dy > dz) {
    ry = -rx - rz;
  } else {
    rz = -rx - ry;
  }

  return { x: rx, y: ry, z: rz };
}

function hexDist(a: Hex, b: Hex): number {
  const ax = a.q;
  const az = -a.q - a.r;
  const ay = a.r;
  const bx = b.q;
  const bz = -b.q - b.r;
  const by = b.r;
  return Math.max(Math.abs(ax - bx), Math.abs(ay - by), Math.abs(az - bz));
}

function cellKey(h: Hex): string {
  return `${h.q},${h.r}`;
}
