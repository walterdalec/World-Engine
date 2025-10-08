import type { Hex } from '../v30/field';

export interface EscortPlan {
  taskId: string;
  engineerId: string;
  escorts: { left: string; right: string };
  guardArc: [Hex, Hex];
  ready: boolean;
}

export interface EscortContext {
  unitById: Record<string, any>;
  enemies: any[];
}

export function planEscort(task: { id: string; kind: string; targetId: string }, pool: any[], anchor: Hex): EscortPlan | null {
  const engineer = pool.find((unit: any) => unit.role === 'Siege') ?? pool.find((unit: any) => unit.role === 'Infantry');
  const left = pool.find((unit: any) => unit.role === 'Shield' && unit.id !== engineer?.id);
  const right = pool.find((unit: any) => unit.role === 'Shield' && unit.id !== engineer?.id && unit.id !== left?.id);
  if (!engineer || !left || !right) return null;

  const guardArc: [Hex, Hex] = [
    { q: anchor.q - 1, r: anchor.r },
    { q: anchor.q + 1, r: anchor.r },
  ];

  return {
    taskId: task.id,
    engineerId: engineer.id,
    escorts: { left: left.id, right: right.id },
    guardArc,
    ready: false,
  };
}

export function tickEscort(plan: EscortPlan, state: EscortContext): EscortPlan {
  const engineer = state.unitById?.[plan.engineerId];
  const left = state.unitById?.[plan.escorts.left];
  const right = state.unitById?.[plan.escorts.right];
  if (!engineer || !left || !right) return plan;

  moveToFlank(left, engineer.pos, -1);
  moveToFlank(right, engineer.pos, +1);

  const threat = state.enemies?.find(enemy => enemy?.pos && inArc(enemy.pos, plan.guardArc));
  if (threat) {
    issueIntercept([left, right], threat);
  }

  const ready = [left, right].every(guard => guard?.pos && hexDist(guard.pos, engineer.pos) <= 1);
  return { ...plan, ready };
}

function moveToFlank(unit: any, center: Hex, offset: -1 | 1): void {
  if (!unit?.pos) return;
  const target: Hex = { q: center.q + offset, r: center.r };
  unit.intent = unit.intent ?? {};
  unit.intent.escort = { target };
}

function inArc(pos: Hex, arc: [Hex, Hex]): boolean {
  return hexDist(pos, arc[0]) <= 2 || hexDist(pos, arc[1]) <= 2;
}

function issueIntercept(guards: any[], threat: any): void {
  for (const guard of guards) {
    if (!guard) continue;
    guard.intent = guard.intent ?? {};
    guard.intent.intercept = { targetId: threat.id };
  }
}

function hexDist(a: Hex, b: Hex): number {
  const ax = a.q;
  const ay = a.r;
  const az = -ax - ay;
  const bx = b.q;
  const by = b.r;
  const bz = -bx - by;
  return Math.max(Math.abs(ax - bx), Math.abs(ay - by), Math.abs(az - bz));
}
