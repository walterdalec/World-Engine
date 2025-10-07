
export interface ReplayEvent {
  t: number;
  kind: string;
  payload: any;
}

export interface Replay {
  seed: number;
  meta: any;
  events: ReplayEvent[];
}

export function createReplay(seed: number, meta: any = {}): Replay {
  return { seed, meta, events: [] };
}

export function record(replay: Replay, kind: string, payload: any, t: number) {
  replay.events.push({ t, kind, payload });
}

export function attachRecorder(state: any, replay: Replay) {
  const push = (kind: string) => (payload: any) => record(replay, kind, payload, state.time ?? 0);
  if (typeof state.on === 'function') {
    state.on('CommanderGesture', push('CommanderGesture'));
    state.on('FormationAssign', push('FormationAssign'));
    state.on('CommanderOrder', push('CommanderOrder'));
    state.on('Micro', push('Micro'));
    state.on('Damage', push('Damage'));
  } else {
    state.exec = state.exec ?? {};
    const originalEmit = state.exec.emitEvent;
    state.exec.emitEvent = (event: any) => {
      if (originalEmit) originalEmit(event);
      if (event?.kind) record(replay, event.kind, event, state.time ?? 0);
    };
  }
}

export function exportReplay(replay: Replay) {
  return JSON.stringify(replay);
}
