export type Hex = { q: number; r: number };
export type Edge = `${number},${number}->${number},${number}`;

export type SegmentKind = 'Wall' | 'Gate' | 'Tower';

export interface Segment {
  id: string;
  kind: SegmentKind;
  hex: Hex;
  hp: number;
  armor: number;
  blocksEdges: Edge[];
  blocksCells?: string[];
}

export interface SiegeGrid {
  segments: Record<string, Segment>;
  blockedEdges: Set<Edge>;
  blockedCells: Set<string>;
}

export function createSiegeGrid(): SiegeGrid {
  return {
    segments: {},
    blockedEdges: new Set<Edge>(),
    blockedCells: new Set<string>(),
  };
}

export function registerSegment(grid: SiegeGrid, seg: Segment): void {
  grid.segments[seg.id] = seg;
  for (const edge of seg.blocksEdges) {
    grid.blockedEdges.add(edge);
  }
  for (const cell of seg.blocksCells ?? []) {
    grid.blockedCells.add(cell);
  }
}

export function damageSegment(grid: SiegeGrid, id: string, dps: number): { destroyed: boolean; seg?: Segment } {
  const seg = grid.segments[id];
  if (!seg) return { destroyed: false, seg: undefined };

  const effective = Math.max(0, dps - seg.armor * 0.5);
  seg.hp = Math.max(0, seg.hp - effective);

  const destroyed = seg.hp <= 0;
  if (destroyed) {
    for (const edge of seg.blocksEdges) {
      grid.blockedEdges.delete(edge);
    }
    for (const cell of seg.blocksCells ?? []) {
      grid.blockedCells.delete(cell);
    }
  }

  return { destroyed, seg };
}

export function edgeKey(a: Hex, b: Hex): Edge {
  return `${a.q},${a.r}->${b.q},${b.r}` as Edge;
}

export function cellKey(h: Hex): string {
  return `${h.q},${h.r}`;
}
