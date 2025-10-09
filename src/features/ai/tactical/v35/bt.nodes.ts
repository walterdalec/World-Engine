import { Sequence, Selector, Leaf, type BTNode as _BTNode, type BTNodeContext, type TickStatus } from './bt.core';
import { scorePlans, applyLearnedBias, type Plan } from './scoring';
import { tickTelemetry } from '../../learn/telemetry';
import { choosePlanWithBandit, scenarioKeyFromState } from '../../learn/gateway';
import { nextPhase } from './phases';
import { buildOrders } from './orders';

export const CommanderRoot = () =>
  new Selector([
    new Sequence([
      new Leaf(ctx => evaluatePhase(ctx)),
      new Leaf(ctx => pickPlan(ctx)),
      new Leaf(ctx => issueOrders(ctx)),
    ]),
    new Leaf(ctx => withdrawIfBroken(ctx)),
  ]);

function evaluatePhase(ctx: BTNodeContext): TickStatus {
  const inputs = collectPhaseInputs(ctx);
  ctx.blackboard.phase = nextPhase(ctx.blackboard.phase, inputs);
  return 'Success';
}

function pickPlan(ctx: BTNodeContext): TickStatus {
  const scores = collectScores(ctx);
  const pick = choosePlanWithBandit(scores, ctx);
  if (!pick) return 'Failure';
  ctx.blackboard.lastPick = pick as Plan;
  if (ctx.brain?.v35?.telemetry) tickTelemetry(ctx.brain.v35.telemetry, ctx.state, ctx);
  return 'Success';
}

function issueOrders(ctx: BTNodeContext): TickStatus {
  const plan = ctx.blackboard.lastPick as Plan | undefined;
  if (!plan) return 'Failure';
  ctx.brain.v35.orders = ctx.brain.v35.orders ?? buildOrders();
  const handler = ctx.brain.v35.orders[plan];
  if (!handler) return 'Failure';
  const ok = handler(ctx);
  if (ok) ctx.blackboard.lastOrdersAt = ctx.time;
  return ok ? 'Success' : 'Failure';
}

function withdrawIfBroken(ctx: BTNodeContext): TickStatus {
  if (ctx.blackboard.phase !== 'Withdraw') return 'Failure';
  ctx.state.events.push({ t: ctx.time, kind: 'CommanderWithdraw' });
  return 'Success';
}

function collectPhaseInputs(ctx: BTNodeContext) {
  const friendly = (ctx.state.units ?? []).filter((u: any) => u.team === 'A' || u.faction === 'Player');
  const moraleAvg = average(friendly.map((u: any) => u.aiMorale?.value ?? 60));
  const routingCount = friendly.filter((u: any) => u.aiMorale?.status === 'Routing').length;
  const primaryLane = ctx.blackboard.primaryLane;
  const laneGoal = ctx.brain.v30?.lanes?.find((lane: any) => lane.id === primaryLane)?.goals?.at(-1);
  const dangerAtFront = laneGoal ? laneDangerAt(ctx, laneGoal) : 0;
  const advantage = computeAdvantage(ctx.state);
  const risk = ctx.brain.intent?.riskTolerance ?? 50;
  return { moraleAvg, routingCount, dangerAtFront, advantage, risk };
}

function collectScores(ctx: BTNodeContext) {
  const stance = ctx.brain.intent?.stance ?? 'Defensive';
  const risk = ctx.brain.intent?.riskTolerance ?? 50;
  const friendly = (ctx.state.units ?? []).filter((u: any) => u.team === 'A' || u.faction === 'Player');
  const moraleAvg = average(friendly.map((u: any) => u.aiMorale?.value ?? 60));
  const dangerLeft = laneDanger(ctx, 'Left');
  const dangerCenter = laneDanger(ctx, 'Center');
  const dangerRight = laneDanger(ctx, 'Right');
  const advantage = computeAdvantage(ctx.state);
  const scores = scorePlans({
    stance,
    risk,
    moraleAvg,
    dangerLeft,
    dangerCenter,
    dangerRight,
    advantage,
    playbook: ctx.brain.v28?.playbook,
    psyche: ctx.brain.v27?.psyche,
    counters: ctx.brain.v29?.counters,
    scenario: ctx.brain.v26?.scenario ? { Siege: ctx.brain.v26.scenario === 'Siege' } : {},
  });
  applyLearnedBias(scores, {
    world: ctx.world ?? ctx.brain?.v35?.world ?? ctx.brain?.world,
    scenarioKey: () => scenarioKeyFromState(ctx.state),
  });
  return scores;
}

function laneDanger(ctx: BTNodeContext, id: 'Left' | 'Center' | 'Right'): number {
  const lane = ctx.brain.v30?.lanes?.find((l: any) => l.id === id);
  const goal = lane?.goals?.at(-1);
  if (!goal) return 0;
  return laneDangerAt(ctx, goal);
}

function laneDangerAt(ctx: BTNodeContext, hex: { q: number; r: number }) {
  const cell = ctx.brain.v30?.field?.grid?.[`${hex.q},${hex.r}`];
  if (!cell) return 0;
  return Math.max(0, (cell.threat ?? 0) - (cell.support ?? 0));
}

function computeAdvantage(state: any): number {
  const friendlyHp = sum((state.units ?? []).filter((u: any) => u.team === 'A').map((u: any) => u.hp ?? 0));
  const enemyHp = sum((state.units ?? []).filter((u: any) => u.team === 'B').map((u: any) => u.hp ?? 0));
  const total = Math.max(1, friendlyHp + enemyHp);
  return (friendlyHp - enemyHp) / total;
}

function sum(values: number[]): number {
  return values.reduce((acc, value) => acc + value, 0);
}

function average(values: number[]): number {
  if (!values.length) return 0;
  return sum(values) / values.length;
}


