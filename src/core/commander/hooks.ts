// packages/core/src/commander/hooks.ts
import type { WorldState } from '../action/types';
import { recomputeAuras } from './aura';
import { applyCohesion } from './squad';
import { tickCooldowns } from './cooldowns';

export function onTurnStart(world: WorldState, unitId: string) {
    // Re-apply aura statuses and tick ability cooldowns for commanders
    recomputeAuras(world);
    const u: any = world.units.get(unitId);
    if (u?.commandRadius) {
        tickCooldowns(world, unitId);
    }
    // Update cohesion for all units in this commander's squad
    for (const v of Array.from(world.units.values())) {
        applyCohesion(world, v.id);
    }
}

export function onUnitMoved(world: WorldState, unitId: string) {
    // Recompute aura and cohesion when anyone moves
    recomputeAuras(world);
    applyCohesion(world, unitId);
}