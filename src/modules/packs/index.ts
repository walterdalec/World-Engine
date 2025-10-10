/**
 * Packs Module
 * Canvas 03 - Content pack loading and management
 */

import type { EngineModule, EventBus, TickContext, InitContext } from '../../engine/types';
import { createRegistry, validateAndRegister, getRegistryStats, type PackRegistry, type ValidationError } from '../../packs';

export class PacksModule implements EngineModule {
    readonly id = 'packs';
    private events?: EventBus;
    private registry: PackRegistry = createRegistry();

    init(ctx: InitContext): void {
        this.events = ctx.events;

        // Respond to pack loading requests
        ctx.events.respond<{ json: string }, { success: boolean; errors: ValidationError[] }>
            ('packs/load', async (req) => {
                try {
                    const data = JSON.parse(req.json);
                    return validateAndRegister(data, this.registry);
                } catch {
                    return {
                        success: false,
                        errors: [{
                            packId: 'unknown',
                            field: 'root',
                            message: 'Invalid JSON',
                            suggestion: 'Check for syntax errors'
                        }]
                    };
                }
            });

        // Respond to registry stats requests
        ctx.events.respond<void, ReturnType<typeof getRegistryStats>>
            ('packs/stats', async () => getRegistryStats(this.registry));

        // Respond to registry clear requests
        ctx.events.respond<void, void>('packs/clear', async () => {
            this.registry = createRegistry();
        });

        console.log('📦 PacksModule initialized');
    }

    start(): void {
        // Nothing to start
    }

    tick(_ctx: TickContext): void {
        // No tick logic needed
    }

    stop(): void {
        // Nothing to stop
    }
}
