export function overlayTaskIcon(kind: string): string {
  if (kind === 'Ram') return '??';
  if (kind === 'Ladder') return '??';
  if (kind === 'Bomb') return '??';
  if (kind === 'Sap') return '?';
  return '?';
}

export function overlayMoralePip(value: number): string {
  if (value < 10) return '??';
  if (value < 30) return '??';
  if (value < 60) return '??';
  return '??';
}

export function emitTaskOverlay(state: any, tasks: any[]): void {
  if (!Array.isArray(tasks)) return;
  const events = Array.isArray(state.events) ? state.events : (state.events = []);
  for (const task of tasks) {
    events.push({ t: state.time ?? 0, kind: 'Overlay', icon: overlayTaskIcon(task.kind), target: task.targetId });
  }
}
