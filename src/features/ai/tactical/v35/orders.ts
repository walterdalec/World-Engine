import type { Plan } from './scoring';

export type OrderFn = (ctx: any) => boolean;

export function buildOrders(): Record<Plan, OrderFn> {
  return {
    HoldLine: ctx => orderHoldLine(ctx),
    AdvancePrimary: ctx => orderAdvance(ctx, ctx.blackboard.primaryLane),
    AdvanceSecondary: ctx => (ctx.blackboard.secondaryLane ? orderAdvance(ctx, ctx.blackboard.secondaryLane) : false),
    Flank: ctx => orderFlank(ctx),
    FocusFire: ctx => orderFocusFire(ctx),
    Rotate: ctx => orderRotate(ctx),
    RefuseHot: ctx => orderRefuse(ctx),
    Fallback: ctx => orderFallback(ctx),
    Rally: ctx => orderRally(ctx),
    Breach: ctx => orderBreach(ctx),
  };
}

function orderHoldLine(ctx: any): boolean {
  pushCmd(ctx, 'HoldLine', { lane: ctx.blackboard.primaryLane });
  ctx.brain.v24?.rehydrate?.();
  return true;
}

function orderAdvance(ctx: any, lane: 'Left' | 'Center' | 'Right'): boolean {
  pushCmd(ctx, 'Advance', { lane });
  ctx.brain.v25?.queue?.push({ type: 'StagedAdvance', lane });
  return true;
}

function orderFlank(ctx: any): boolean {
  pushCmd(ctx, 'Flank', {});
  ctx.brain.v25?.queue?.push({ type: 'RotateFlank', lane: ctx.blackboard.primaryLane });
  return true;
}

function orderFocusFire(ctx: any): boolean {
  pushCmd(ctx, 'FocusFire', {});
  ctx.state.events.push({ t: ctx.time, kind: 'CommanderFocusFire' });
  return true;
}

function orderRotate(ctx: any): boolean {
  pushCmd(ctx, 'Rotate', {});
  ctx.brain.v25?.queue?.push({ type: 'Rotate' });
  return true;
}

function orderRefuse(ctx: any): boolean {
  pushCmd(ctx, 'RefuseHot', {});
  ctx.brain.v25?.queue?.push({ type: 'RefuseFlank', lane: ctx.blackboard.primaryLane });
  return true;
}

function orderFallback(ctx: any): boolean {
  pushCmd(ctx, 'Fallback', {});
  ctx.state.events.push({ t: ctx.time, kind: 'CommanderFallback' });
  return true;
}

function orderRally(ctx: any): boolean {
  pushCmd(ctx, 'Rally', {});
  ctx.brain.v33 && (ctx.brain.v33.lastRally = Math.max(ctx.brain.v33.lastRally ?? 0, ctx.time));
  return true;
}

function orderBreach(ctx: any): boolean {
  pushCmd(ctx, 'Breach', {});
  if (ctx.brain.v32) ctx.brain.v32.forceTasks = true;
  return true;
}

function pushCmd(ctx: any, name: string, extra: Record<string, unknown>) {
  ctx.state.events.push({ t: ctx.time, kind: 'Cmd', name, ...extra });
}
