
import type { BattleState } from '../../../battle/types';
import type { Order } from './types';

export function serializeOrder(order: Order) {
  return JSON.stringify(order);
}

export function deserializeOrder(payload: string): Order {
  return JSON.parse(payload) as Order;
}

export function dispatchOrderToUnits(state: BattleState, order: Order) {
  const message = `Commander order: ${order.kind}` + (order.targetUnitId ? ` -> ${order.targetUnitId}` : '');
  state.log.push(message);
}
