
export type Gesture = 'rotate' | 'refuse_left' | 'refuse_right' | 'advance_stage' | 'collapse';

export function emitGesture(state: any, side: 'A' | 'B', gesture: Gesture, data: Record<string, unknown> = {}) {
  const events = ((state as any).events ??= []);
  events.push({ t: (state as any).time ?? 0, kind: 'CommanderGesture', side, gesture, ...data });
}
