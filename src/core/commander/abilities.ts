// packages/core/src/commander/abilities.ts
import type { WorldState } from '../action/types';
import type { CommandAbility } from './types';
import type { Axial } from '../action/types';
import { selectHexes } from '../spell/selectors';
import { applySpell } from '../spell/resolver';

// Use the spell resolver to apply effects; no mana costs, just AP + cooldowns
export function effectCommandAbility(state: WorldState, commanderId: string, ability: CommandAbility, aimed: Axial) {
    const targets = selectHexes({
        id: ability.id,
        name: ability.name,
        school: 'Spirit' as any,
        level: 1,
        manaCost: 0,
        apCost: ability.apCost,
        range: ability.range,
        aoe: ability.aoe,
        width: ability.width,
        effects: ability.effects,
    } as any,
        (state.units.get(commanderId) as any).pos,
        aimed,
        state.blocksLos,
        state.passable,
        (h) => state.occupied?.has?.(`${h.q},${h.r}`));

    return applySpell(state, commanderId, {
        id: ability.id,
        name: ability.name,
        school: 'Spirit' as any,
        level: 1,
        manaCost: 0,
        apCost: ability.apCost,
        range: ability.range,
        aoe: ability.aoe,
        width: ability.width,
        effects: ability.effects,
    } as any, targets);
}