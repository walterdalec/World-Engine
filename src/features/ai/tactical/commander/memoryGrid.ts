
import type { MemoryGridCfg, MemoryGridState } from './types';

export function createMemoryGrid(): MemoryGridState {
  return { cells: {}, lastUpdateTurn: 0 };
}

function key(q: number, r: number) {
  return `${q},${r}`;
}

export function writeHit(
  grid: MemoryGridState,
  cfg: MemoryGridCfg,
  hex: { q: number; r: number },
  facingDir: number,
  hpLost: number,
) {
  if (!hex) return;
  const cell = (grid.cells[key(hex.q, hex.r)] ||= { heat: 0, dir: [0, 0, 0, 0, 0, 0] });
  const weight = (cfg.writeOn.dmgPerHP ?? 0.2) * Math.max(0, hpLost);
  cell.heat += weight;
  cell.dir[facingDir % 6] += weight * (cfg.dirWeight ?? 0.5);
}

export function writeBlock(grid: MemoryGridState, cfg: MemoryGridCfg, hex: { q: number; r: number }) {
  if (!hex) return;
  const cell = (grid.cells[key(hex.q, hex.r)] ||= { heat: 0, dir: [0, 0, 0, 0, 0, 0] });
  cell.heat += cfg.writeOn.losBlocked ?? 0.3;
}

export function writeSuccess(grid: MemoryGridState, cfg: MemoryGridCfg, hex: { q: number; r: number }) {
  if (!hex) return;
  const cell = (grid.cells[key(hex.q, hex.r)] ||= { heat: 0, dir: [0, 0, 0, 0, 0, 0] });
  cell.heat -= Math.abs(cfg.writeOn.successPush ?? 0.4);
}

export function decay(grid: MemoryGridState, cfg: MemoryGridCfg) {
  const decayRate = Math.max(0, Math.min(1, cfg.decayPerTurn ?? 0.1));
  for (const k of Object.keys(grid.cells)) {
    const cell = grid.cells[k];
    cell.heat *= 1 - decayRate;
    for (let i = 0; i < 6; i += 1) cell.dir[i] *= 1 - decayRate;
    if (Math.abs(cell.heat) < 0.01) delete grid.cells[k];
  }
}

export function readHeat(grid: MemoryGridState, hex: { q: number; r: number }, dir?: number) {
  const cell = grid.cells[key(hex.q, hex.r)];
  if (!cell) return 0;
  return cell.heat + (dir != null ? cell.dir[dir % 6] ?? 0 : 0);
}

export function coldestOf(grid: MemoryGridState, hexes: { q: number; r: number; dir?: number }[]) {
  let bestIndex = -1;
  let bestScore = Infinity;
  for (let i = 0; i < hexes.length; i += 1) {
    const hex = hexes[i];
    const score = readHeat(grid, hex, hex.dir);
    if (score < bestScore) {
      bestScore = score;
      bestIndex = i;
    }
  }
  return bestIndex >= 0 ? hexes[bestIndex] : null;
}
