/**
 * World Module
 * Canvas 04 - World grid generation and management
 */

import type { EngineModule, EventBus, TickContext, InitContext } from '../../engine/types';
import { generateWorld, getWorldStats, getTile, type WorldGrid, type WorldGridConfig } from '../../world';

export class WorldModule implements EngineModule {
    readonly id = 'world';
    private events?: EventBus;
    private grid?: WorldGrid;

    init(ctx: InitContext): void {
        this.events = ctx.events;

        // Respond to world generation requests
        ctx.events.respond<{ seed: number; config: WorldGridConfig }, WorldGrid>(
            'world/generate',
            async (req) => {
                this.grid = generateWorld(req.seed, req.config);
                ctx.events.emit('world/generated', { grid: this.grid });
                return this.grid;
            }
        );

        // Respond to tile lookup requests
        ctx.events.respond<{ x: number; y: number }, ReturnType<typeof getTile>>(
            'world/getTile',
            async (req) => {
                if (!this.grid) return undefined;
                return getTile(this.grid, req.x, req.y);
            }
        );

        // Respond to world stats requests
        ctx.events.respond<void, ReturnType<typeof getWorldStats> | null>(
            'world/stats',
            async () => {
                if (!this.grid) return null;
                return getWorldStats(this.grid);
            }
        );

        console.log('🌍 WorldModule initialized');
    }

    start(): void {
        // Nothing to start
    }

    tick(_ctx: TickContext): void {
        // No tick logic needed for static world
    }

    stop(): void {
        // Nothing to stop
    }
}
