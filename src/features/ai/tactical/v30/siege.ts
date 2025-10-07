import type { Hex, ThreatField } from './field';
import { addHazard, addCover, addIntent } from './field';

export type SiegeObjKind = 'Gate' | 'Wall' | 'Tower' | 'Breach';

export interface SiegeObj {
  id: string;
  kind: SiegeObjKind;
  hex: Hex;
  hp: number;
  armor: number;
}

export type TaskKind = 'Ram' | 'Sap' | 'Ladder' | 'Bomb';

export interface Task {
  id: string;
  kind: TaskKind;
  targetId: string;
  assignedUnit?: string;
  progress: number;
}

export function registerSiege(tf: ThreatField, obj: SiegeObj): void {
  if (obj.kind === 'Wall' || obj.kind === 'Tower') {
    addCover(tf, obj.hex, 1);
  }
  if (obj.kind === 'Gate') {
    addHazard(tf, obj.hex, 2);
  }
}

export function planBreach(field: ThreatField, objs: SiegeObj[], gatePreferred = true): { task: TaskKind; target: string } | null {
  if (!objs.length) return null;
  const gate = objs.find((o) => o.kind === 'Gate');
  if (gatePreferred && gate) {
    addIntent(field, gate.hex, 3);
    return { task: 'Ram', target: gate.id };
  }
  const walls = objs.filter((o) => o.kind === 'Wall');
  if (walls.length) {
    const soft = [...walls].sort((a, b) => a.armor - b.armor)[0]!;
    addIntent(field, soft.hex, 2);
    return { task: 'Sap', target: soft.id };
  }
  const fallback = objs[0]!;
  addIntent(field, fallback.hex, 1.5);
  return { task: 'Bomb', target: fallback.id };
}

export function tickTask(task: Task, objs: Record<string, SiegeObj>, dps: number): Task {
  const target = objs[task.targetId];
  if (!target) return task;
  const eff =
    dps *
    (task.kind === 'Ram'
      ? 1.0
      : task.kind === 'Sap'
      ? 0.7
      : task.kind === 'Bomb'
      ? 1.5
      : 0.8);
  target.hp = Math.max(0, target.hp - eff);
  const total = target.hp + eff;
  task.progress = total <= 0 ? 1 : 1 - target.hp / Math.max(1, total);
  return task;
}
