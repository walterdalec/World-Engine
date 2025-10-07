
export type Dir6 = 0 | 1 | 2 | 3 | 4 | 5;

export interface DirHeat {
  n: number;
  ne: number;
  nw: number;
  s: number;
  sw: number;
  se: number;
}

export interface Danger2D {
  heat: Record<string, DirHeat>;
  decay: number;
}

export function createDanger2D(decay = 0.9): Danger2D {
  return { heat: {}, decay };
}

function key(q: number, r: number) {
  return `${q},${r}`;
}

const fields = ['n', 'ne', 'nw', 's', 'sw', 'se'] as const;

export function addDirectional(dm: Danger2D, hex: { q: number; r: number }, dir: Dir6, amount: number) {
  if (!hex) return;
  const k = key(hex.q, hex.r);
  const cell = dm.heat[k] ?? (dm.heat[k] = { n: 0, ne: 0, nw: 0, s: 0, sw: 0, se: 0 });
  const field = fields[dir] ?? 'n';
  (cell as any)[field] += amount;
}

export function decay2D(dm: Danger2D) {
  for (const cell of Object.values(dm.heat)) {
    cell.n *= dm.decay;
    cell.ne *= dm.decay;
    cell.nw *= dm.decay;
    cell.s *= dm.decay;
    cell.sw *= dm.decay;
    cell.se *= dm.decay;
  }
}

export function dirDangerAt(dm: Danger2D, hex: { q: number; r: number }, approach: Dir6) {
  const cell = dm.heat[key(hex.q, hex.r)];
  if (!cell) return 0;
  const field = fields[approach] ?? 'n';
  return (cell as any)[field] ?? 0;
}
