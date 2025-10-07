
import type { CommanderBrain } from './commander';

export function snapshotCommander(brain: CommanderBrain) {
  const bb: any = (brain as any).bb;
  const pending: any[] = (brain as any).pendingSignals ?? [];
  return {
    time: bb?.time ?? 0,
    risk: bb?.risk ?? 0,
    lastSignalCount: pending.length,
  };
}

export function snapshotMemoryGrid(brain: CommanderBrain) {
  const grid: any = (brain as any).grid;
  if (!grid) return [];
  const entries: any[] = [];
  for (const key of Object.keys(grid.cells || {})) {
    const cell = grid.cells[key];
    entries.push({ key, heat: Number(cell.heat?.toFixed?.(2) ?? cell.heat), dir: (cell.dir || []).map((n: number) => Number(n.toFixed?.(2) ?? n)) });
  }
  return entries.sort((a, b) => (b.heat ?? 0) - (a.heat ?? 0)).slice(0, 24);
}
