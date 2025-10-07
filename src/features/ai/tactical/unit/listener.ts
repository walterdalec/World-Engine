
import type { Order as CommanderOrder } from '../commander/types';
import type { UnitBlackboard } from './types';

export function assignOrdersToUnits(orders: CommanderOrder[], units: UnitBlackboard[]) {
  for (const order of orders) {
    for (const bb of units) {
      if (shouldAssign(order, bb)) {
        bb.currentOrder = order;
      }
    }
  }
}

function shouldAssign(order: CommanderOrder, bb: UnitBlackboard) {
  if (!bb.currentOrder) return true;
  return (order.priority ?? 0) >= (bb.currentOrder.priority ?? 0);
}
