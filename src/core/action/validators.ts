/**
 * Action Validators
 * Validate AP, Range, LOS, Status, Collisions, etc.
 */

import { axialDistance } from './hex';
import { los } from './hex';
import { violatesZoC } from '../formation/zoc';
import type { WorldState, PlannedAction, ValidationResult, Axial } from './types';

export function validateAP(state: WorldState, a: PlannedAction): ValidationResult {
    const u = state.units.get(a.actor);
    if (!u) return { ok: false, reasons: ['no_actor'] };
    return { ok: u.ap >= a.cost.ap, reasons: u.ap >= a.cost.ap ? undefined : ['ap_insufficient'] };
}

export function validateLOS(state: WorldState, a: PlannedAction, origin: Axial): ValidationResult {
    for (const t of a.targets) {
        const res = los(origin, t, state.blocksLos);
        if (!res.visible) return { ok: false, reasons: [`los_blocked@${t.q},${t.r}`] };
    }
    return { ok: true };
}

export function validateRange(range: number, origin: Axial, targets: Axial[]): ValidationResult {
    return targets.every(t => axialDistance(origin, t) <= range) ?
        { ok: true } :
        { ok: false, reasons: ['out_of_range'] };
}

export function validateStatus(state: WorldState, a: PlannedAction): ValidationResult {
    const u = state.units.get(a.actor);
    if (!u) return { ok: false, reasons: ['no_actor'] };
    if (u.statuses?.stunned) return { ok: false, reasons: ['stunned'] };
    return { ok: true };
}

export function validateMoveCollision(state: WorldState, dests: { id: string; to: string }[]): ValidationResult {
    // Prevent two units ending on same hex in simultaneous movement; resolver will tie-break
    const seen = new Set<string>();
    for (const d of dests) {
        if (seen.has(d.to)) return { ok: false, reasons: ['move_conflict'] };
        seen.add(d.to);
    }
    return { ok: true };
}

export function validatePassable(state: WorldState, targets: Axial[]): ValidationResult {
    for (const target of targets) {
        if (!state.passable(target)) {
            return { ok: false, reasons: [`impassable@${target.q},${target.r}`] };
        }
    }
    return { ok: true };
}

export function validateMana(state: WorldState, a: PlannedAction): ValidationResult {
    const u = state.units.get(a.actor);
    if (!u) return { ok: false, reasons: ['no_actor'] };
    const manaCost = a.cost.mana || 0;
    return { ok: u.mp >= manaCost, reasons: u.mp >= manaCost ? undefined : ['mana_insufficient'] };
}

export function validateAlive(state: WorldState, a: PlannedAction): ValidationResult {
    const u = state.units.get(a.actor);
    if (!u) return { ok: false, reasons: ['no_actor'] };
    return { ok: u.hp > 0, reasons: u.hp > 0 ? undefined : ['actor_dead'] };
}

export function validateZoC(state: WorldState, a: PlannedAction): ValidationResult {
    if (a.kind !== 'move') return { ok: true }; // ZoC only applies to movement

    const destination = a.targets[0];
    if (!destination) return { ok: false, reasons: ['no_destination'] };

    const actor = state.units.get(a.actor);
    if (!actor) return { ok: false, reasons: ['no_actor'] };

    // Simple path from current position to destination
    const path = [actor.pos, destination];

    // Check if movement violates ZoC
    if (violatesZoC(state, a.actor, path)) {
        // Check if disengage flag is set
        if (!a.data?.disengage) {
            return { ok: false, reasons: ['zoc_blocked'] };
        }
    }

    return { ok: true };
}