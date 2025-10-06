// packages/core/src/commander/cooldowns.ts
import type { WorldState } from '../action/types';
import type { CommandRuntime } from './types';

export function getRuntime(world: WorldState): CommandRuntime {
    if (!(world as any).commander) {
        (world as any).commander = {
            cooldowns: new Map(),
            auraByUnit: new Map()
        } as CommandRuntime;
    }
    return (world as any).commander as CommandRuntime;
}

export function getCooldown(world: WorldState, cid: string, abilityId: string) {
    const rt = getRuntime(world);
    const m = rt.cooldowns.get(cid);
    return (m && m.get(abilityId)) || 0;
}

export function setCooldown(world: WorldState, cid: string, abilityId: string, turns: number) {
    const rt = getRuntime(world);
    let m = rt.cooldowns.get(cid);
    if (!m) {
        m = new Map();
        rt.cooldowns.set(cid, m);
    }
    m.set(abilityId, Math.max(0, turns | 0));
}

export function tickCooldowns(world: WorldState, cid: string) {
    const rt = getRuntime(world);
    const m = rt.cooldowns.get(cid);
    if (!m) return;

    for (const k of Array.from(m.keys())) {
        m.set(k, Math.max(0, (m.get(k) || 0) - 1));
    }
}