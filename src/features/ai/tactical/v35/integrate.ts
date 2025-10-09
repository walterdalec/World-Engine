import { CommanderRoot } from './bt.nodes';
import { buildOrders } from './orders';
import { createBlackboard } from './blackboard';
import { createTelemetry, finalizeTelemetry, type BattleTelemetry } from '../../learn/telemetry';
import { scenarioKeyFromState, learnFromTelemetry } from '../../learn/gateway';

export interface V35Runtime {
  root: ReturnType<typeof CommanderRoot>;
  orders: ReturnType<typeof buildOrders>;
  blackboard: ReturnType<typeof createBlackboard>;
  world?: any;
  telemetry?: BattleTelemetry;
  telemetryFinalized?: boolean;
}

export function attachV35(brain: any, world: any | undefined, state: any): void {
  if (!brain) return;
  const primaryLane: 'Left' | 'Center' | 'Right' =
    brain.v30?.lanes?.find((lane: any) => lane?.id)?.id ?? 'Center';
  const blackboard = createBlackboard(primaryLane);
  const telemetry = createTelemetry(scenarioKeyFromState(state));
  if (world) world._lastAITelemetry = telemetry;
  brain.v35 = {
    root: CommanderRoot(),
    orders: buildOrders(),
    blackboard,
    world,
    telemetry,
    telemetryFinalized: false,
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
    world: brain.v35.world,
  };
  const status = brain.v35.root.tick(ctx);
  if (status === 'Failure') {
    const events = Array.isArray(state.events) ? state.events : (state.events = []);
    events.push({ t: state.time ?? 0, kind: 'CommanderIdle' });
  }

  if (!brain.v35.telemetryFinalized && isBattleOver(state)) {
    const telemetry = finalizeTelemetry(brain.v35.telemetry, state);
    if (telemetry) {
      brain.v35.telemetry = telemetry;
      if (brain.v35.world) {
        learnFromTelemetry(brain.v35.world, state, telemetry);
        brain.v35.world._lastAITelemetry = telemetry;
      }
    }
    brain.v35.telemetryFinalized = true;
  }
}

function isBattleOver(state: any): boolean {
  const phase = state?.phase ?? state?.status;
  return phase === 'Victory' || phase === 'Defeat' || phase === 'Draw' || Boolean(state?.outcome);
}
