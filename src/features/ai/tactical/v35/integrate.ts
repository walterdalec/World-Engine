import { CommanderRoot } from './bt.nodes';
import { buildOrders } from './orders';
import { createBlackboard } from './blackboard';

export interface V35Runtime {
  root: ReturnType<typeof CommanderRoot>;
  orders: ReturnType<typeof buildOrders>;
  blackboard: ReturnType<typeof createBlackboard>;
}

export function attachV35(brain: any, _world: any | undefined, state: any): void {
  if (!brain) return;
  const primaryLane: 'Left' | 'Center' | 'Right' =
    brain.v30?.lanes?.find((lane: any) => lane?.id)?.id ?? 'Center';
  const blackboard = createBlackboard(primaryLane);
  brain.v35 = {
    root: CommanderRoot(),
    orders: buildOrders(),
    blackboard,
  } as V35Runtime;
}

export function v35Tick(brain: any, state: any): void {
  if (!brain?.v35) return;
  const ctx = {
    time: state.time ?? 0,
    seed: state.seed ?? 0,
    state,
    brain,
    blackboard: brain.v35.blackboard,
  };
  const status = brain.v35.root.tick(ctx);
  if (status === 'Failure') {
    const events = Array.isArray(state.events) ? state.events : (state.events = []);
    events.push({ t: state.time ?? 0, kind: 'CommanderIdle' });
  }
}
