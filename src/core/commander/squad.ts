// packages/core/src/commander/squad.ts
import type { WorldState } from '../action/types';
import { axialDistance } from '../action/hex';

export function unitLeaderId(world: WorldState, unitId: string): string | undefined {
    const u: any = world.units.get(unitId);
    return u?.leaderId || u?.meta?.leaderId;
}

export function commanderOf(world: WorldState, unitId: string) {
    const lid = unitLeaderId(world, unitId);
    return lid ? world.units.get(lid) : undefined;
}

export function inCommandRadius(world: WorldState, unitId: string): boolean {
    const cmd: any = commanderOf(world, unitId);
    if (!cmd) return false;

    const u: any = world.units.get(unitId);
    if (!u || !u.pos || !cmd.pos) return false;

    const r = Math.max(0, cmd.commandRadius | 0);
    return axialDistance(u.pos, cmd.pos) <= r;
}

// Apply or remove cohesion penalties; returns true if status changed
export function applyCohesion(world: WorldState, unitId: string): boolean {
    const u: any = world.units.get(unitId);
    if (!u) return false;

    const has = (name: string) => u.statuses?.some((s: any) => s.name === name);
    const add = (name: string) => u.statuses?.push({ name, turns: 1 });
    const rem = (name: string) => u.statuses = (u.statuses || []).filter((s: any) => s.name !== name);

    const ok = inCommandRadius(world, unitId);

    if (!ok) {
        if (!has('cohesion_break')) {
            add('cohesion_break');
            return true;
        }
    } else {
        if (has('cohesion_break')) {
            rem('cohesion_break');
            return true;
        }
    }

    return false;
}