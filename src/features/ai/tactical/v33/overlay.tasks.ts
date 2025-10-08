export function overlayTaskIcon(task: any): string {
    switch (task?.kind) {
        case 'Ram': return '🐏';
        case 'Ladder': return '🪜';
        case 'Sap': return '⛏️';
        case 'Bomb': return '💣';
        default: return '⚔️';
    }
}

export function overlayMoralePip(moraleValue: number): string {
    if (moraleValue >= 80) return '🟢'; // High morale
    if (moraleValue >= 60) return '🟡'; // Steady
    if (moraleValue >= 30) return '🟠'; // Shaken
    if (moraleValue >= 10) return '🔴'; // Wavering
    return '💀'; // Routing
}

export function emitTaskOverlay(state: any, tasks: any[]): void {
    if (!state.overlays) state.overlays = {};

    for (const task of tasks) {
        if (task.targetHex) {
            const key = `${task.targetHex.q},${task.targetHex.r}`;
            state.overlays[key] = {
                icon: overlayTaskIcon(task),
                tooltip: `${task.kind}: ${task.description || 'Tactical objective'}`
            };
        }
    }
}