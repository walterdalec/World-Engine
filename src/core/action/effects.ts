/**
 * Action Effects System
 * Generate deltas from planned actions
 */

import type { Axial } from './types';
import type { WorldState, PlannedAction } from './types';
import type { DeltaBatch } from './deltas';
import { logEvt } from './log';
import { flankInfo, flankModifiers } from '../formation/flanking';
import { getFormation, Backline } from '../formation/formation';

// --- Movement ---
export function effectMove(state: WorldState, a: PlannedAction, origin: Axial): DeltaBatch {
    const to = a.targets[0];
    if (!to) return { byActor: a.actor, deltas: [], log: ['move:none'] };
    return {
        byActor: a.actor,
        deltas: [{ kind: 'pos', id: a.actor, from: origin, to }],
        log: [`move ${origin.q},${origin.r} -> ${to.q},${to.r}`]
    };
}

// --- Defend ---
export function effectDefend(state: WorldState, a: PlannedAction): DeltaBatch {
    return {
        byActor: a.actor,
        deltas: [{ kind: 'status-add', id: a.actor, name: 'defending', turns: 1 }],
        log: ['defend']
    };
}

// --- Wait ---
export function effectWait(state: WorldState, a: PlannedAction): DeltaBatch {
    return { byActor: a.actor, deltas: [], log: ['wait'] };
}

// --- Rally ---
export function effectRally(state: WorldState, a: PlannedAction, origin: Axial): DeltaBatch {
    const deltas: DeltaBatch['deltas'] = [];
    const targets = a.targets || [];

    for (const t of targets) {
        // Find unit at target hex
        let targetId: string | undefined;
        state.units.forEach(unit => {
            if (unit.pos.q === t.q && unit.pos.r === t.r) {
                targetId = unit.id;
            }
        });

        if (targetId) {
            deltas.push({ kind: 'status-add', id: targetId, name: 'morale_up', turns: 2 });
        }
    }

    return {
        byActor: a.actor,
        deltas,
        log: [logEvt('rally', { actor: a.actor, targets: deltas.length })]
    };
}

// --- Flee ---
export function effectFlee(state: WorldState, a: PlannedAction, origin: Axial): DeltaBatch {
    const to = a.targets[0];
    if (!to) return { byActor: a.actor, deltas: [], log: ['flee:none'] };
    return {
        byActor: a.actor,
        deltas: [{ kind: 'pos', id: a.actor, from: origin, to }],
        log: [logEvt('flee', { actor: a.actor, from: origin, to })]
    };
}

// --- Enhanced Attack (with flanking and formation bonuses) ---
export function effectAttack(state: WorldState, a: PlannedAction, origin: Axial): DeltaBatch {
    const deltas: any[] = [];
    const basePower = (a.data?.power || 0) || 6;
    const isRangedAttack = a.data?.isRanged || false;
    let hits = 0;

    for (const t of a.targets) {
        // Find target unit at hex
        let targetUnit: any = undefined;
        state.units.forEach(unit => {
            if (unit.pos.q === t.q && unit.pos.r === t.r) {
                targetUnit = unit;
            }
        });

        if (targetUnit) {
            // Get flanking information and modifiers
            const flankingInfo = flankInfo(state, a.actor, targetUnit.id);
            const flankMods = flankModifiers(flankingInfo);

            // Get formation bonuses
            const attackerFormation = getFormation(state.units.get(a.actor));
            const isBackRowAttack = attackerFormation?.row === 'back';
            const formationBonus = isBackRowAttack && isRangedAttack ? Backline.rangedAccuracyBonus / 2 : 0;

            // Calculate total damage multiplier
            const totalMultiplier = 100 + flankMods.multBonus + formationBonus;

            // Calculate damage with bonuses
            const enhancedPower = Math.floor(basePower * totalMultiplier / 100);
            const damage = Math.floor(enhancedPower * state.rng() + 1);

            if (damage > 0) {
                deltas.push({ kind: 'hp', id: targetUnit.id, delta: -damage });
                hits++;
            }

            // Log detailed attack information
            const logData = {
                actor: a.actor,
                target: targetUnit.id,
                basePower,
                finalPower: enhancedPower,
                damage,
                flanking: flankingInfo.arc,
                isFlanked: flankingInfo.isFlanked,
                isRanged: isRangedAttack,
                isBackRow: isBackRowAttack
            };

            deltas.push({
                kind: 'log',
                data: logEvt('attack_detailed', logData)
            });
        }
    }

    return {
        byActor: a.actor,
        deltas,
        log: [logEvt('attack', { actor: a.actor, power: basePower, hits })]
    };
}

// --- Opportunity Attack ---
export function effectOpportunityAttack(state: WorldState, defenderId: string, moverId: string): DeltaBatch {
    const def = state.units.get(defenderId);
    const mv = state.units.get(moverId);

    if (!def || !mv) {
        return {
            byActor: defenderId,
            deltas: [],
            log: [logEvt('oa', { defender: defenderId, mover: moverId, dmg: 0 })]
        };
    }

    const power = 4;
    const damage = Math.floor(power * state.rng() + 1);
    const deltas: any[] = [];

    if (damage > 0) {
        deltas.push({ kind: 'hp', id: mv.id, delta: -damage });
    }

    return {
        byActor: defenderId,
        deltas,
        log: [logEvt('oa', { defender: defenderId, mover: moverId, dmg: damage })]
    };
}

// --- Cast Spell (placeholder) ---
export function effectCast(state: WorldState, a: PlannedAction, origin: Axial): DeltaBatch {
    const spellId = a.data?.spellId as string;

    // Placeholder for spell system integration
    const deltas: any[] = [];

    // Apply mana cost
    const manaCost = a.cost.mana || 0;
    if (manaCost > 0) {
        deltas.push({ kind: 'mp', id: a.actor, delta: -manaCost });
    }

    // Apply AP cost for cast actions
    const apCost = a.cost.ap || 0;
    if (apCost > 0) {
        deltas.push({ kind: 'ap', id: a.actor, delta: -apCost });
    }

    return {
        byActor: a.actor,
        deltas,
        log: [`cast ${spellId || 'unknown'}`]
    };
}

// --- Command Ability (placeholder) ---
export function effectCommand(state: WorldState, a: PlannedAction, origin: Axial): DeltaBatch {
    const abilityId = a.data?.abilityId as string;

    // Placeholder for command system integration
    return {
        byActor: a.actor,
        deltas: [],
        log: [`command ${abilityId || 'unknown'}`]
    };
}

// --- Use Item (placeholder) ---
export function effectUse(state: WorldState, a: PlannedAction): DeltaBatch {
    return { byActor: a.actor, deltas: [], log: ['use:todo'] };
}
