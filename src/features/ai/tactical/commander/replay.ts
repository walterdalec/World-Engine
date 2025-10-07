
export interface ReplayEvent {
  t: number;
  k: string;
  d: any;
}

export interface Replay {
  seed: number;
  events: ReplayEvent[];
}

export function createReplay(seed: number): Replay {
  return { seed, events: [] };
}

export function pushReplay(replay: Replay, t: number, key: string, data: any) {
  replay.events.push({ t, k: key, d: data });
}
