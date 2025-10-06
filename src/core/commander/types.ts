// packages/core/src/commander/types.ts
import type { Unit } from '../unit/types';
import type { SpellEffect } from '../spell/types';

export interface Commander extends Unit {
    meta?: any; // keep compat with world units
    commandRadius: number;                 // tiles
    commandAbilities: CommandAbility[];    // per-commander list
    squad: string[];                       // unit IDs led by this commander
}

export interface CommandAbility {
    id: string;
    name: string;
    apCost: number;
    cooldown: number;                      // in own turns
    range: number;                         // hex distance from commander
    aoe: 'single' | 'blast' | 'line' | 'cone';
    width?: number;
    effects: SpellEffect[];                // reuse #07A effect schema
    tags?: string[];                       // e.g., ['rally','morale']
}

export interface SquadMeta {
    squadId?: string;                      // logical grouping (optional)
    leaderId?: string;                     // commander id
}

// World-scoped runtime state
export interface CommandRuntime {
    // ability cooldowns: commanderId -> abilityId -> remaining (turns)
    cooldowns: Map<string, Map<string, number>>;
    // aura cache: unitId -> active aura ids (from which commander)
    auraByUnit: Map<string, Set<string>>;
}