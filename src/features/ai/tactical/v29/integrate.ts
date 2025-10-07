import { createObserver, observeTick, toStyleVector } from './observer';
import {
  CounterMatrix,
  counterFromStyle,
  applyCountersToScores,
  type CounterWeights,
  type PlaybookId,
} from './counters';

type Maybe<T> = T | undefined;

interface V29Runtime {
  obs: ReturnType<typeof createObserver>;
  counters?: CounterWeights;
  base?: CounterWeights;
}

export function attachV29(
  brain: any,
  world: any,
  _state: any,
  opts: { enemyFactionId?: string; enemyPlaybookId?: PlaybookId } = {},
): void {
  const faction = opts.enemyFactionId ? world?.factions?.[opts.enemyFactionId] : undefined;
  const pbId = (opts.enemyPlaybookId ?? faction?.cultureId ?? 'unknown') as PlaybookId;
  const baseCounters = CounterMatrix[pbId] ?? CounterMatrix.unknown;

  const runtime: V29Runtime = {
    obs: createObserver(),
    base: baseCounters,
  };

  brain.v29 = runtime;

  const original = brain._v29Score ?? brain.scoreCandidates?.bind(brain) ?? (() => []);
  if (!brain._v29Score) brain._v29Score = original;

  brain.scoreCandidates = (bb: any) => {
    const cards = original(bb) ?? [];
    const weights: Maybe<CounterWeights> = brain.v29?.counters ?? runtime.base ?? CounterMatrix.unknown;
    return applyCountersToScores(cards, weights ?? CounterMatrix.unknown);
  };
}

export function v29Tick(brain: any, state: any): void {
  if (!brain?.v29) return;
  const recent = Array.isArray(state?.events) ? state.events.slice(-12) : [];
  observeTick(brain.v29.obs, recent);

  if (!brain.v29.counters && brain.v29.obs.ticks > 6) {
    const style = toStyleVector(brain.v29.obs);
    brain.v29.counters = counterFromStyle(style);
    if (Array.isArray(state?.events)) {
      state.events.push({ t: state.time, kind: 'CounterLearned', style });
    }
  }
}
