import type { Hex } from './field';

export type LaneId = 'Left' | 'Center' | 'Right';

export interface Lane {
  id: LaneId;
  axis: [Hex, Hex];
  goals: Hex[];
  pressure: number;
}

type Facing = 0 | 1 | 2 | 3 | 4 | 5;

const DIRS: readonly Hex[] = [
  { q: 1, r: 0 },
  { q: 1, r: -1 },
  { q: 0, r: -1 },
  { q: -1, r: 0 },
  { q: -1, r: 1 },
  { q: 0, r: 1 },
];

export function makeLanes(anchor: Hex, facing: Facing): Lane[] {
  const f = DIRS[facing];
  const left = DIRS[(facing + 2) % 6]!;
  const right = DIRS[(facing + 4) % 6]!;

  const center: [Hex, Hex] = [
    anchor,
    { q: anchor.q + f.q * 6, r: anchor.r + f.r * 6 },
  ];

  const leftAxis: [Hex, Hex] = [
    { q: anchor.q + left.q * 2, r: anchor.r + left.r * 2 },
    { q: center[1].q + left.q * 2, r: center[1].r + left.r * 2 },
  ];

  const rightAxis: [Hex, Hex] = [
    { q: anchor.q + right.q * 2, r: anchor.r + right.r * 2 },
    { q: center[1].q + right.q * 2, r: center[1].r + right.r * 2 },
  ];

  return [
    { id: 'Left', axis: leftAxis, goals: sampleAlong(leftAxis, 3), pressure: 0 },
    { id: 'Center', axis: center, goals: sampleAlong(center, 3), pressure: 0 },
    { id: 'Right', axis: rightAxis, goals: sampleAlong(rightAxis, 3), pressure: 0 },
  ];
}

export function sampleAlong(axis: [Hex, Hex], n: number): Hex[] {
  const out: Hex[] = [];
  for (let i = 1; i <= n; i += 1) {
    const t = i / (n + 1);
    out.push({
      q: Math.round(lerp(axis[0].q, axis[1].q, t)),
      r: Math.round(lerp(axis[0].r, axis[1].r, t)),
    });
  }
  return out;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}
