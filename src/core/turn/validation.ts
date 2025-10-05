/**
 * Action Validation (Simplified for TODO #03)
 * Basic validation before full integration with TODO #04
 */

import type { WorldState, PlannedAction } from './types';

export interface ValidationResult {
    ok: boolean;
    reasons?: string[];
}

export function validateAction(world: WorldState, a: PlannedAction): ValidationResult {
    const reasons: string[] = [];
    const actor = world.units.get(a.actor);

    if (!actor) {
        return { ok: false, reasons: ['no_actor'] };
    }

    // Basic AP check
    if (actor.ap < (a.cost.ap || 0)) {
        reasons.push('insufficient_ap');
    }

    // Basic status checks
    if (actor.statuses) {
        const stunned = actor.statuses.some((s: any) => s.name === 'stunned');
        if (stunned && a.kind !== 'wait') {
            reasons.push('stunned');
        }
    }

    // Kind-specific basic validation
    if (a.kind === 'move') {
        if (!a.targets || a.targets.length === 0) {
            reasons.push('no_destination');
        }
    }

    if (a.kind === 'attack' || a.kind === 'cast') {
        if (!a.targets || a.targets.length === 0) {
            reasons.push('no_target');
        }
    }

    return {
        ok: reasons.length === 0,
        reasons: reasons.length > 0 ? reasons : undefined
    };
}