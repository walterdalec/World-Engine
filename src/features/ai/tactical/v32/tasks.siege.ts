import type { Hex } from '../v30/field';
import type { SiegeObj, Task } from '../v30/siege';
import { seedRng } from '../util/seed';

export type SiegeRole = 'Shield' | 'Infantry' | 'Siege' | 'Skirmisher';

export interface UnitLite {
  id: string;
  pos: Hex;
  role: SiegeRole;
  atk: number;
  def: number;
  morale: number;
}

export interface TaskPlan {
  tasks: Task[];
  moraleShock?: { kind: 'Breach' | 'GateDown'; amount: number };
}

export function planSiegeTasks(seed: number, objs: SiegeObj[], units: UnitLite[]): TaskPlan {
  const rng = seedRng(seed);
  const out: Task[] = [];

  const gate = objs.find((o) => o.kind === 'Gate');
  const walls = objs.filter((o) => o.kind === 'Wall');

  const useGate = Boolean(gate) && rng() < 0.65;
  if (useGate && gate) {
    out.push({
      id: `task_ram_${gate.id}`,
      kind: 'Ram',
      targetId: gate.id,
      progress: 0,
    });
  } else if (walls.length) {
    const soft = [...walls].sort((a, b) => a.armor - b.armor)[0]!;
    out.push({
      id: `task_sap_${soft.id}`,
      kind: 'Sap',
      targetId: soft.id,
      progress: 0,
    });
  }

  const hasSkirmishers = units.some((u) => u.role === 'Skirmisher');
  const flankWalls = walls.slice(0, Math.min(2, walls.length));
  for (const wall of flankWalls) {
    if (rng() < 0.5) {
      out.push({
        id: `task_ladder_${wall.id}`,
        kind: 'Ladder',
        targetId: wall.id,
        progress: 0,
      });
    }
    if (hasSkirmishers && rng() < 0.3) {
      out.push({
        id: `task_bomb_${wall.id}`,
        kind: 'Bomb',
        targetId: wall.id,
        progress: 0,
      });
    }
  }

  return { tasks: out };
}

export function assignTasks(tasks: Task[], units: UnitLite[]): Record<string, string> {
  const assignments: Record<string, string> = {};
  const pool = [...units].sort((a, b) => {
    const roleDiff = rolePriority(a.role) - rolePriority(b.role);
    if (roleDiff !== 0) return roleDiff;
    return b.morale - a.morale;
  });

  for (const task of tasks) {
    const unit = pool.shift();
    if (unit) {
      assignments[task.id] = unit.id;
    }
  }

  return assignments;
}

function rolePriority(role: SiegeRole): number {
  const order: Record<SiegeRole, number> = { Siege: 0, Shield: 1, Infantry: 2, Skirmisher: 3 };
  return order[role] ?? 3;
}

export function moraleShockOnBreach(segKind: 'Gate' | 'Wall' | 'Tower'): { attacker: number; defender: number } {
  const amount = segKind === 'Gate' ? 12 : 8;
  return { attacker: +amount, defender: -amount };
}
