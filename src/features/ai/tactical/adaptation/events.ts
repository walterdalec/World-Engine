
export type MicroEvent = 'dodge' | 'brace' | 'panic' | 'charge' | 'kite' | 'focus';

export function emit(state: any, unitId: string, ev: MicroEvent, data: Record<string, unknown> = {}) {
  const events = ((state as any).events ??= []);
  events.push({ t: (state as any).time ?? 0, kind: 'Micro', unitId, ev, ...data });
}
