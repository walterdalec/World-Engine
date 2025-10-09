export interface PlanTickLog {
  t: number;
  plan: string;
  phase: string;
  advantage: number;
  danger: number;
}

export interface BattleTelemetry {
  key: string;
  plans: PlanTickLog[];
  casualtiesA: number;
  casualtiesB: number;
  rounds: number;
  result: 'A' | 'B' | 'Draw';
  style: { flank: number; volley: number; push: number; collapse: number };
}

export function createTelemetry(key: string): BattleTelemetry {
  return {
    key,
    plans: [],
    casualtiesA: 0,
    casualtiesB: 0,
    rounds: 0,
    result: 'Draw',
    style: { flank: 0, volley: 0, push: 0, collapse: 0 },
  };
}

export function tickTelemetry(telemetry: BattleTelemetry | undefined, state: any, ctx: any) {
  if (!telemetry) return;
  const plan = ctx.blackboard?.lastPick ?? 'HoldLine';
  const phase = ctx.blackboard?.phase ?? 'Hold';
  const advantage = computeAdvantage(state);
  const danger = laneDanger(ctx, ctx.blackboard?.primaryLane ?? 'Center');
  telemetry.plans.push({ t: state.turn ?? telemetry.plans.length, plan, phase, advantage, danger });
}

export function finalizeTelemetry(telemetry: BattleTelemetry | undefined, state: any) {
  if (!telemetry) return undefined;
  const hpA0 = sum((state.units ?? []).filter((u: any) => u.team === 'A').map((u: any) => u.maxHp ?? 0));
  const hpB0 = sum((state.units ?? []).filter((u: any) => u.team === 'B').map((u: any) => u.maxHp ?? 0));
  const hpA = sum((state.units ?? []).filter((u: any) => u.team === 'A').map((u: any) => Math.max(0, u.hp ?? 0)));
  const hpB = sum((state.units ?? []).filter((u: any) => u.team === 'B').map((u: any) => Math.max(0, u.hp ?? 0)));
  telemetry.casualtiesA = Math.max(0, hpA0 - hpA);
  telemetry.casualtiesB = Math.max(0, hpB0 - hpB);
  telemetry.rounds = state.round ?? state.turn ?? telemetry.plans.length;
  telemetry.result = hpA === hpB ? 'Draw' : hpA > hpB ? 'A' : 'B';
  const total = Math.max(1, telemetry.plans.length);
  telemetry.style.flank = telemetry.plans.filter(p => p.plan === 'Flank').length / total;
  telemetry.style.volley = fraction(state.events, 'FocusFire', total);
  telemetry.style.push = telemetry.plans.filter(p => p.plan === 'AdvancePrimary' || p.plan === 'Breach').length / total;
  telemetry.style.collapse = fraction(state.events, 'CommanderWithdraw', total);
  return telemetry;
}

function computeAdvantage(state: any) {
  const hpA = sum((state.units ?? []).filter((u: any) => u.team === 'A').map((u: any) => Math.max(0, u.hp ?? 0)));
  const hpB = sum((state.units ?? []).filter((u: any) => u.team === 'B').map((u: any) => Math.max(0, u.hp ?? 0)));
  return (hpA - hpB) / Math.max(1, hpA + hpB);
}

function laneDanger(ctx: any, laneId: 'Left' | 'Center' | 'Right') {
  const lane = ctx.brain?.v30?.lanes?.find((l: any) => l.id === laneId);
  const goal = lane?.goals?.at(-1);
  if (!goal) return 0;
  const cell = ctx.brain?.v30?.field?.grid?.[`${goal.q},${goal.r}`];
  if (!cell) return 0;
  return Math.max(0, (cell.threat ?? 0) - (cell.support ?? 0));
}

function fraction(events: any[], kind: string, total: number) {
  if (!Array.isArray(events)) return 0;
  const hits = events.filter((evt: any) => evt?.name === kind || evt?.kind === kind).length;
  return Math.min(1, hits / Math.max(1, total));
}

function sum(values: number[]): number {
  return values.reduce((acc, value) => acc + value, 0);
}
