export function attachV33(_brain: any, _world: any, _state: any): void {
    // V33 DevTools - placeholder for development utilities
    console.log('🧠 AI v33 DevTools attached');
}

export function snapshotV33Runtime(brain: any): any {
    return {
        version: 'v33',
        morale: brain?.v33?.escorts?.length || 0,
        rally: brain?.v33?.lastRally || -999,
        timestamp: Date.now()
    };
}

export function debugMoraleState(units: any[]): void {
    console.log('🎭 Morale Debug:');
    for (const unit of units) {
        if (unit.aiMorale) {
            console.log(`  ${unit.id}: ${unit.aiMorale.status} (${unit.aiMorale.value})`);
        }
    }
}