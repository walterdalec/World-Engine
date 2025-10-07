/**
 * Delta System
 * Atomic changes for undo/replay functionality
 */

import type { Axial } from './types';

export type Delta =
    | { kind: 'hp'; id: string; delta: number }
    | { kind: 'mp'; id: string; delta: number }
    | { kind: 'ap'; id: string; delta: number }
    | { kind: 'pos'; id: string; from: Axial; to: Axial }
    | { kind: 'status-add'; id: string; name: string; turns: number; amount?: number }
    | { kind: 'status-rem'; id: string; name: string }
    | { kind: 'unit-dead'; id: string }
    | { kind: 'terrain'; at: Axial; change: string; tile?: string; duration?: number };

export interface DeltaBatch {
    byActor: string;
    deltas: Delta[];
    log: string[];
}

export function applyDelta(state: any, delta: Delta): void {
    switch (delta.kind) {
        case 'hp': {
            const unit = state.units.get(delta.id);
            if (unit) unit.hp += delta.delta;
            break;
        }
        case 'mp': {
            const unit = state.units.get(delta.id);
            if (unit) unit.mp += delta.delta;
            break;
        }
        case 'ap': {
            const unit = state.units.get(delta.id);
            if (unit) unit.ap += delta.delta;
            break;
        }
        case 'pos': {
            const unit = state.units.get(delta.id);
            if (unit) {
                // Update occupied set
                const fromKey = `${delta.from.q},${delta.from.r}`;
                const toKey = `${delta.to.q},${delta.to.r}`;
                state.occupied.delete(fromKey);
                state.occupied.add(toKey);
                // Update unit position
                unit.pos = delta.to;
            }
            break;
        }
        case 'status-add': {
            const unit = state.units.get(delta.id);
            if (unit) {
                if (!unit.statuses) unit.statuses = {};
                unit.statuses[delta.name] = delta.turns;
            }
            break;
        }
        case 'status-rem': {
            const unit = state.units.get(delta.id);
            if (unit && unit.statuses) {
                delete unit.statuses[delta.name];
            }
            break;
        }
        case 'unit-dead': {
            const unit = state.units.get(delta.id);
            if (unit) {
                // Remove from occupied set
                const key = `${unit.pos.q},${unit.pos.r}`;
                state.occupied.delete(key);
                // Remove from units
                state.units.delete(delta.id);
            }
            break;
        }
        case 'terrain': {
            // Terrain changes would be handled by terrain system
            // This is a placeholder for future terrain modification
            break;
        }
    }
}