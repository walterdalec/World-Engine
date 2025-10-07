
import type { Order } from './types';
import type { ScriptCtx, ScriptId } from './types';

export function runScript(id: ScriptId, ctx: ScriptCtx) {
  switch (id) {
    case 'StdOpener':
      return stdOpener(ctx);
    case 'OrderlyRetreat':
      return orderlyRetreat(ctx);
    case 'FlankProbe':
      return flankProbe(ctx);
    default:
      return;
  }
}

function stdOpener(ctx: ScriptCtx) {
  ctx.issue(makeOrder(ctx, 'AdvanceLine', 60, 4));
  ctx.issue(makeOrder(ctx, 'HoldPosition', 55, 4));
}

function orderlyRetreat(ctx: ScriptCtx) {
  ctx.issue(makeOrder(ctx, 'Fallback', 80, 3));
  ctx.issue(makeOrder(ctx, 'Rally', 70, 2));
  ctx.issue(makeOrder(ctx, 'ProtectAsset', 65, 5));
}

function flankProbe(ctx: ScriptCtx) {
  const order = makeOrder(ctx, 'Flank', 58, 3, 'skirmishers');
  ctx.issue(order);
}

function makeOrder(ctx: ScriptCtx, kind: Order['kind'], priority: number, ttl: number, groupTag?: string): Order {
  return {
    id: nid(ctx),
    kind,
    priority,
    ttl,
    groupTag,
  } as Order;
}

function nid(ctx: ScriptCtx) {
  const r = ctx.rng ? ctx.rng() : Math.random();
  return `scr_${r.toString(36).slice(2, 9)}`;
}
