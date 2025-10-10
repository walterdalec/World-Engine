/**
 * State Snapshot System
 * Canvas 02 - Serialize game state to JSON
 */

import { GameState } from './types';

/**
 * Create a snapshot of the current game state
 */
export function createSnapshot(state: GameState): string {
    const snapshot = {
        ...state,
        meta: {
            ...state.meta,
            savedAt: new Date().toISOString()
        }
    };

    return JSON.stringify(snapshot, null, 2);
}

/**
 * Download snapshot as a file
 */
export function downloadSnapshot(state: GameState, slotName = 'quicksave'): void {
    const json = createSnapshot(state);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const filename = `world-engine-${slotName}-day${state.meta.day}.json`;
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();

    URL.revokeObjectURL(url);

    console.log(`💾 Saved: ${filename}`);
}

/**
 * Save to localStorage (auto-save)
 */
export function saveToLocalStorage(state: GameState, slot = 'autosave'): void {
    const json = createSnapshot(state);
    const key = `world-engine-save-${slot}`;

    try {
        localStorage.setItem(key, json);
        console.log(`💾 Auto-saved to ${slot}`);
    } catch (error) {
        console.error('Failed to save to localStorage:', error);
    }
}

/**
 * Load from localStorage
 */
export function loadFromLocalStorage(slot = 'autosave'): GameState | null {
    const key = `world-engine-save-${slot}`;

    try {
        const json = localStorage.getItem(key);
        if (!json) return null;

        const state = JSON.parse(json);
        console.log(`📂 Loaded from ${slot}`);
        return state;
    } catch (error) {
        console.error('Failed to load from localStorage:', error);
        return null;
    }
}

/**
 * List all save slots in localStorage
 */
export function listSaveSlots(): string[] {
    const slots: string[] = [];
    const prefix = 'world-engine-save-';

    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(prefix)) {
            slots.push(key.substring(prefix.length));
        }
    }

    return slots;
}
