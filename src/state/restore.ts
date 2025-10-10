/**
 * State Restore System
 * Canvas 02 - Deserialize and validate game state
 */

import { GameState, isValidState } from './types';

/**
 * Parse and validate a state snapshot
 */
export function parseSnapshot(json: string): GameState {
    const parsed = JSON.parse(json);

    if (!isValidState(parsed)) {
        throw new Error('Invalid game state structure');
    }

    console.log(`📂 Restored state from Day ${parsed.meta.day}`);
    return parsed;
}

/**
 * Restore from uploaded file
 */
export function restoreFromFile(): Promise<GameState> {
    return new Promise((resolve, reject) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';

        input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) {
                reject(new Error('No file selected'));
                return;
            }

            const reader = new FileReader();

            reader.onload = (event) => {
                try {
                    const json = event.target?.result as string;
                    const state = parseSnapshot(json);
                    resolve(state);
                } catch (error) {
                    reject(error);
                }
            };

            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsText(file);
        };

        input.click();
    });
}

/**
 * Create a simple diff between two states (for debugging)
 */
export function createStateDiff(oldState: GameState, newState: GameState): Record<string, any> {
    const diff: Record<string, any> = {};

    if (oldState.meta.day !== newState.meta.day) {
        diff.day = { old: oldState.meta.day, new: newState.meta.day };
    }

    if (oldState.party.gold !== newState.party.gold) {
        diff.gold = { old: oldState.party.gold, new: newState.party.gold };
    }

    if (JSON.stringify(oldState.party.position) !== JSON.stringify(newState.party.position)) {
        diff.position = { old: oldState.party.position, new: newState.party.position };
    }

    return diff;
}
