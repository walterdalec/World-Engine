// packages/core/src/commander/aura.ts
import type { WorldState } from '../action/types';
import { axialDistance } from '../action/hex';

export interface AuraDef {
    id: string;
    name: string;
    radius: number;                   // from commander
    status: { name: string; turns: number }; // re-applied each tick while in range
    stack: 'none' | 'highest' | 'sum';    // stacking rule across multiple commanders
    priority?: number;                // used for 'highest'
    squadOnly?: boolean;              // if true, only affect same leaderId
}

// Example catalog (can be expanded or moved to #07B later)
export const AURAS: Record<string, AuraDef> = {
    'aura.valor': { id: 'aura.valor', name: 'Valor', radius: 2, status: { name: 'valor', turns: 1 }, stack: 'highest', priority: 1 },
    'aura.focus': { id: 'aura.focus', name: 'Focus', radius: 2, status: { name: 'focus', turns: 1 }, stack: 'none' },
    'aura.guarded': { id: 'aura.guarded', name: 'Guarded', radius: 2, status: { name: 'guarded', turns: 1 }, stack: 'highest', priority: 2 },
    'aura.ward': { id: 'aura.ward', name: 'Ward', radius: 2, status: { name: 'ward_all', turns: 1 }, stack: 'sum' },
};

export function commanderAuras(world: WorldState, commanderId: string): AuraDef[] {
    const u: any = world.units.get(commanderId);
    const names: string[] = u?.meta?.auras || [];
    return names.map(n => AURAS[n]).filter(Boolean);
}

export function recomputeAuras(world: WorldState) {
    // Build map unitId -> { auraId -> {from, def} }
    const byUnit = new Map<string, Map<string, { from: string, def: AuraDef }>>();

    for (const u of Array.from(world.units.values())) {
        if (!(u as any).commandRadius) continue; // commander only
        const cmd: any = u;
        const auras = commanderAuras(world, cmd.id);
        if (!auras.length || !cmd.pos) continue;

        for (const v of Array.from(world.units.values())) {
            if (!v.pos) continue;
            if (auras.some(() => true)) {
                // filter by distance and squadOnly
                for (const ad of auras) {
                    if (ad.squadOnly && (v as any).leaderId !== cmd.id) continue;
                    if (axialDistance(v.pos, cmd.pos) <= (ad.radius ?? cmd.commandRadius)) {
                        let m = byUnit.get(v.id);
                        if (!m) {
                            m = new Map();
                            byUnit.set(v.id, m);
                        }
                        m.set(ad.id, { from: cmd.id, def: ad });
                    }
                }
            }
        }
    }

    // Resolve stacking and apply statuses as 1-turn buffs tagged as aura
    for (const [uid, amap] of Array.from(byUnit.entries())) {
        const u: any = world.units.get(uid);
        if (!u) continue;

        const chosen: { [statusName: string]: { def: AuraDef, from: string, count: number } } = {};

        for (const { from, def } of Array.from(amap.values())) {
            const s = def.status.name;
            if (!chosen[s]) {
                chosen[s] = { def, from, count: 1 };
            } else {
                if (def.stack === 'sum') {
                    chosen[s].count++;
                } else if (def.stack === 'highest') {
                    const cur = chosen[s].def.priority || 0;
                    const nv = def.priority || 0;
                    if (nv > cur) {
                        chosen[s] = { def, from, count: 1 };
                    }
                }
                // 'none' → keep first
            }
        }

        // Apply status-add once (turns=1); UI/engine re-applies every tick while in range
        u.statuses = u.statuses || [];
        for (const s of Object.values(chosen)) {
            u.statuses.push({
                name: s.def.status.name,
                turns: s.def.status.turns,
                source: 'aura',
                from: s.from,
                stacks: s.count
            });
        }
    }
}