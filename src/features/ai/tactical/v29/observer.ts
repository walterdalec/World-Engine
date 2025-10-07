import type { StyleVector } from './counters';

export interface ObserverState {
  ticks: number;
  events: number;
  flankGestures: number;
  volleys: number;
  stagedPushes: number;
  collapses: number;
}

export function createObserver(): ObserverState {
  return { ticks: 0, events: 0, flankGestures: 0, volleys: 0, stagedPushes: 0, collapses: 0 };
}

export function observeTick(obs: ObserverState, recent: any[]): void {
  obs.ticks += 1;
  for (const evt of recent) {
    obs.events += 1;
    if (evt?.kind === 'CommanderGesture') {
      if (evt.g === 'refuse_left' || evt.g === 'refuse_right') obs.flankGestures += 1;
      if (evt.g === 'advance_stage') obs.stagedPushes += 1;
      if (evt.g === 'collapse') obs.collapses += 1;
    }
    if (evt?.kind === 'FormationAssign') {
      // Placeholder for future density heuristics.
    }
    if (evt?.kind === 'RangedHit') obs.volleys += 1;
  }
}

export function toStyleVector(obs: ObserverState): StyleVector {
  const safe = (n: number) => Math.min(1, n / Math.max(1, obs.ticks));
  return {
    flankRate: safe(obs.flankGestures * 0.5),
    volleyRate: safe(obs.volleys * 0.1),
    pushRate: safe(obs.stagedPushes * 0.5),
    collapseRate: safe(obs.collapses * 0.5),
  };
}
