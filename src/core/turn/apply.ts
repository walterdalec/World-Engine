/**
 * Effect Application (Simplified for TODO #03)
 * Applies resolved action effects to WorldState
 */

import type { WorldState, EffectStep } from './types';

export function applySteps(world: WorldState, steps: EffectStep[]): void {
    for (const s of steps) {
        const p: any = s.payload;

        switch (s.type) {
            case 'hp': {
                const u = world.units.get(p.id);
                if (u) {
                    u.hp = Math.max(0, u.hp + p.delta);
                }
                break;
            }

            case 'mp': {
                const u = world.units.get(p.id);
                if (u) {
                    u.mp = Math.max(0, u.mp + p.delta);
                }
                break;
            }

            case 'ap': {
                const u = world.units.get(p.id);
                if (u) {
                    u.ap = Math.max(0, u.ap + p.delta);
                }
                break;
            }

            case 'pos': {
                const u = world.units.get(p.id);
                if (u) {
                    world.occupied.delete(`${u.pos.q},${u.pos.r}`);
                    u.pos = p.to;
                    world.occupied.add(`${u.pos.q},${u.pos.r}`);
                }
                break;
            }

            case 'status-add': {
                const u = world.units.get(p.id);
                if (u) {
                    u.statuses = u.statuses || [];
                    const status: any = { name: p.name, turns: p.turns };
                    if (p.amount != null) status.amount = p.amount;
                    u.statuses.push(status);
                }
                break;
            }

            case 'status-rem': {
                const u = world.units.get(p.id);
                if (u && u.statuses) {
                    u.statuses = u.statuses.filter((st: any) => st.name !== p.name);
                }
                break;
            }

            case 'unit-dead': {
                const u = world.units.get(p.id);
                if (u) {
                    world.units.delete(p.id);
                    world.occupied.delete(`${u.pos.q},${u.pos.r}`);
                }
                break;
            }

            default:
                // Ignore unknown effect types for forward compatibility
                break;
        }
    }
}
