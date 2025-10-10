/**
 * Core Module
 * Canvas 01-02 - Baseline module with state management
 */

import { EngineModule, TickContext, InitContext } from '../../engine/types';
import {
    GameState,
    createInitialState,
    createSnapshot,
    downloadSnapshot,
    saveToLocalStorage,
    loadFromLocalStorage,
    parseSnapshot,
    restoreFromFile,
    createStateDiff
} from '../../state';

let ticks = 0;
let gameState: GameState;

export const CoreModule: EngineModule = {
    id: 'core',

    init({ events }: InitContext) {
        console.log('🎮 Core module initializing...');

        // Initialize game state
        gameState = createInitialState();
        console.log('📊 Initial state created:', gameState);

        // Register state/snapshot responder
        events.respond<void, string>('state/snapshot', async () => {
            return createSnapshot(gameState);
        });

        // Register state/restore responder
        events.respond<string, void>('state/restore', async (json) => {
            const oldState = gameState;
            gameState = parseSnapshot(json);
            const diff = createStateDiff(oldState, gameState);
            console.log('📂 State restored. Changes:', diff);
            events.emit('state/restored', { state: gameState, diff });
        });

        // Register state/get responder (for other modules)
        events.respond<void, GameState>('state/get', async () => {
            return gameState;
        });

        // Handle save requests
        events.on('save/download', () => {
            downloadSnapshot(gameState);
        });

        events.on('save/autosave', () => {
            saveToLocalStorage(gameState);
        });

        // Handle load requests
        events.on('load/file', async () => {
            try {
                const state = await restoreFromFile();
                const oldState = gameState;
                gameState = state;
                const diff = createStateDiff(oldState, gameState);
                console.log('📂 State loaded from file. Changes:', diff);
                events.emit('state/restored', { state: gameState, diff });
            } catch (error) {
                console.error('Failed to load file:', error);
                events.emit('load/error', { error });
            }
        });

        events.on('load/autosave', () => {
            const state = loadFromLocalStorage();
            if (state) {
                const oldState = gameState;
                gameState = state;
                const diff = createStateDiff(oldState, gameState);
                console.log('📂 State loaded from autosave. Changes:', diff);
                events.emit('state/restored', { state: gameState, diff });
            } else {
                console.warn('No autosave found');
            }
        });
    },

    start({ events }) {
        console.log('🎮 Core module started');
        events.emit('core/boot', { at: Date.now() });

        // Auto-save every 5 minutes
        setInterval(() => {
            saveToLocalStorage(gameState);
        }, 5 * 60 * 1000);
    },

    tick(ctx: TickContext) {
        ticks++;

        // Advance game day every 30 seconds (900 ticks)
        if (ticks % 900 === 0) {
            gameState.meta.day++;
            ctx.events.emit('game/day-advanced', { day: gameState.meta.day });
        }

        // Emit debug tick every second (30 ticks at 30fps)
        if (ticks % 30 === 0) {
            ctx.events.emit('debug/tick', { ticks, time: ctx.time, day: gameState.meta.day });
        }
    }
};

