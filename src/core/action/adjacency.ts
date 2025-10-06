/**
 * Adjacency Helper
 * Find adjacent units for opportunity attacks and zone of control
 */

import { neighbors } from './hex';
import type { WorldState } from './types';

export function adjacentEnemiesOf(state: WorldState, id: string): string[] {
    const me = state.units.get(id);
    if (!me) return [];

    const out: string[] = [];
    const adjacentHexes = neighbors(me.pos);

    for (const hex of adjacentHexes) {
        const key = `${hex.q},${hex.r}`;
        state.units.forEach(unit => {
            if (`${unit.pos.q},${unit.pos.r}` === key && unit.team !== me.team) {
                out.push(unit.id);
            }
        });
    }

    return out;
}

export function adjacentAlliesOf(state: WorldState, id: string): string[] {
    const me = state.units.get(id);
    if (!me) return [];

    const out: string[] = [];
    const adjacentHexes = neighbors(me.pos);

    for (const hex of adjacentHexes) {
        const key = `${hex.q},${hex.r}`;
        state.units.forEach(unit => {
            if (`${unit.pos.q},${unit.pos.r}` === key && unit.team === me.team && unit.id !== me.id) {
                out.push(unit.id);
            }
        });
    }

    return out;
}

export function adjacentUnitsOf(state: WorldState, id: string): string[] {
    const me = state.units.get(id);
    if (!me) return [];

    const out: string[] = [];
    const adjacentHexes = neighbors(me.pos);

    for (const hex of adjacentHexes) {
        const key = `${hex.q},${hex.r}`;
        state.units.forEach(unit => {
            if (`${unit.pos.q},${unit.pos.r}` === key) {
                out.push(unit.id);
            }
        });
    }

    return out;
}