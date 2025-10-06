// packages/core/src/unit/equipment.ts
import type { EquipmentSlots, EquipmentMod, Stats, Derived, Resist } from './types';

export function gatherEquipMods(eq: EquipmentSlots) {
    const mods: EquipmentMod[] = [eq.weapon?.mod, eq.armor?.mod, eq.accessory?.mod].filter(Boolean) as EquipmentMod[];
    const stats: Partial<Stats> = {};
    const derived: Partial<Derived> = {};
    const resist: Partial<Resist> = {};
    let armor = 0;
    let power = 0;
    const tags = new Set<string>();

    for (const m of mods) {
        if (m.stats) {
            for (const k in m.stats) {
                (stats as any)[k] = ((stats as any)[k] || 0) + (m.stats as any)[k];
            }
        }
        if (m.derived) {
            for (const k in m.derived) {
                (derived as any)[k] = ((derived as any)[k] || 0) + (m.derived as any)[k];
            }
        }
        if (m.resist) {
            for (const k in m.resist) {
                (resist as any)[k] = ((resist as any)[k] || 0) + (m.resist as any)[k];
            }
        }
        armor += m.armor || 0;
        power += m.power || 0;
        (m.tags || []).forEach(t => tags.add(t));
    }

    return { stats, derived, resist, armor, power, tags: Array.from(tags) };
}