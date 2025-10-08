export interface SuppressionOrder {
  shooterId: string;
  lane: [any, any];
  priority: number;
}

export function assignSuppression(state: any, shooters: any[], lane: [any, any]): SuppressionOrder[] {
  const orders: SuppressionOrder[] = [];
  for (const shooter of shooters) {
    orders.push({ shooterId: shooter.id, lane, priority: 1 });
    shooter.intent = shooter.intent ?? {};
    shooter.intent.suppression = { lane };
  }
  if (orders.length) {
    const events = Array.isArray(state.events) ? state.events : (state.events = []);
    events.push({ t: state.time ?? 0, kind: 'SuppressionAssign', orders });
  }
  return orders;
}
