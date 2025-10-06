/**
 * Action Resolution System
 * Simultaneous window with conflict/tie rules
 */

import type { WorldState, PlannedAction, ResolutionReport } from './types';
import type { DeltaBatch, Delta } from './deltas';
import { applyDelta } from './deltas';
import { adjacentEnemiesOf } from './adjacency';
import { enemiesAdjacentTo, violatesZoC } from '../formation/zoc';
import {
    effectMove,
    effectAttack,
    effectDefend,
    effectCast,
    effectCommand,
    effectRally,
    effectFlee,
    effectWait,
    effectUse,
    effectOpportunityAttack
} from './effects';

const KIND_RANK: Record<string, number> = {
    defend: 0,
    wait: 1,
    rally: 2,
    move: 3,
    flee: 3,
    command: 4,
    cast: 5,
    attack: 6,
    use: 7
};

export function resolveSimultaneous(state: WorldState, actions: PlannedAction[]): ResolutionReport {
    // 1) Freeze origin snapshot
    const snapshot = new Map<string, { pos: string; hp: number; mp: number; ap: number }>();
    state.units.forEach(u => {
        snapshot.set(u.id, {
            pos: `${u.pos.q},${u.pos.r}`,
            hp: u.hp,
            mp: u.mp,
            ap: u.ap
        });
    });

    // 2) Deterministic action order for conflicts
    const speedOf = (id: string) => state.units.get(id)?.speed ?? 0;
    actions.sort((a, b) =>
        (speedOf(b.actor) - speedOf(a.actor)) ||
        (a.actor < b.actor ? -1 : 1) ||
        (KIND_RANK[a.kind] - KIND_RANK[b.kind])
    );

    const actionsByActor = new Map(actions.map(a => [a.actor, a] as const));

    // 3) Build delta batches without applying (targets computed from snapshot)
    const batches: DeltaBatch[] = [];
    for (const a of actions) {
        const originUnit = state.units.get(a.actor);
        if (!originUnit) continue;

        const origin = originUnit.pos;

        switch (a.kind) {
            case 'move': batches.push(effectMove(state, a, origin)); break;
            case 'flee': batches.push(effectFlee(state, a, origin)); break;
            case 'rally': batches.push(effectRally(state, a, origin)); break;
            case 'attack': batches.push(effectAttack(state, a, origin)); break;
            case 'defend': batches.push(effectDefend(state, a)); break;
            case 'wait': batches.push(effectWait(state, a)); break;
            case 'cast': batches.push(effectCast(state, a, origin)); break;
            case 'command': batches.push(effectCommand(state, a, origin)); break;
            case 'use': batches.push(effectUse(state, a)); break;
        }
    }

    // 4) Apply in phases: costs -> reactions(OA) -> movement -> damage -> statuses -> deaths
    const applied: Delta[] = [];

    // Phase 1: Action Point Costs (except cast, which handles its own costs)
    for (const b of batches) {
        const a = actionsByActor.get(b.byActor);
        if (!a) continue;

        if (a.kind !== 'cast') { // Cast handles its own AP/MP costs in effects
            const apCost = (a.kind === 'move' || a.kind === 'flee') && a.computed?.moveCost != null ?
                (a.computed.moveCost | 0) :
                (a.cost.ap | 0);
            if (apCost) {
                applied.push({ kind: 'ap', id: b.byActor, delta: -apCost });
            }
        }
    }

    // Phase 2: Reactions - Enhanced Opportunity Attacks for ZoC violations
    const preDamage = new Map<string, number>();
    for (const b of batches) {
        const a = actionsByActor.get(b.byActor);
        if (!a || (a.kind !== 'move' && a.kind !== 'flee')) continue;

        const unit = state.units.get(a.actor);
        if (!unit) continue;

        // Check for ZoC violations (leaving adjacency without disengage)
        if (a.kind === 'move' && !a.data?.disengage) {
            const destination = a.targets[0];
            if (destination) {
                const path = [unit.pos, destination];
                if (violatesZoC(state, a.actor, path)) {
                    // Get enemies that were adjacent before movement
                    const adjacentEnemies = enemiesAdjacentTo(state, a.actor);

                    for (const enemyId of adjacentEnemies) {
                        const enemy = state.units.get(enemyId);
                        if (!enemy) continue;

                        // Check if this enemy will no longer be adjacent after movement
                        const distanceAfter = Math.max(
                            Math.abs(destination.q - enemy.pos.q),
                            Math.abs(destination.r - enemy.pos.r),
                            Math.abs((destination.q + destination.r) - (enemy.pos.q + enemy.pos.r))
                        );

                        if (distanceAfter > 1) {
                            // This enemy loses adjacency - trigger OA
                            const oa = effectOpportunityAttack(state, enemyId, a.actor);
                            for (const d of oa.deltas) {
                                if (d.kind === 'hp') {
                                    preDamage.set(d.id, (preDamage.get(d.id) || 0) + d.delta);
                                    applied.push(d);
                                }
                            }
                        }
                    }
                }
            }
        }

        // Handle explicit disengage moves (flee or move with disengage flag)
        if ((a.kind === 'flee' && a.data?.disengage) || (a.kind === 'move' && a.data?.disengage)) {
            const adjEnemies: string[] = adjacentEnemiesOf(state, b.byActor);
            for (const eid of adjEnemies) {
                const oa = effectOpportunityAttack(state, eid, b.byActor);
                for (const d of oa.deltas) {
                    if (d.kind === 'hp') {
                        preDamage.set(d.id, (preDamage.get(d.id) || 0) + d.delta);
                        applied.push(d);
                    }
                }
            }
        }
    }

    // Phase 3: Movement with collision tiebreak (highest speed wins) and death‑skip due to OA
    const occupancy = new Map<string, string>();
    state.units.forEach(u => {
        occupancy.set(`${u.pos.q},${u.pos.r}`, u.id);
    });

    for (const b of batches) {
        const a = actionsByActor.get(b.byActor);
        if (!a) continue;

        for (const d of b.deltas) {
            if (d.kind === 'pos') {
                const u = state.units.get(d.id);
                if (!u) continue;

                const hpAfterOA = u.hp + (preDamage.get(d.id) || 0);
                if (hpAfterOA <= 0) continue; // Skip movement if dead from OA

                const key = `${d.to.q},${d.to.r}`;
                if (!occupancy.has(key)) {
                    occupancy.delete(`${d.from.q},${d.from.r}`);
                    occupancy.set(key, d.id);
                    applied.push(d);
                }
                // Else collision - movement blocked
            }
        }
    }

    // Phase 4: Damage (sum per target from non‑OA sources, then apply)
    const damage = new Map<string, number>();
    for (const b of batches) {
        for (const d of b.deltas) {
            if (d && d.kind === 'hp') {
                damage.set(d.id, (damage.get(d.id) || 0) + d.delta);
            }
        }
    }
    damage.forEach((delta, id) => {
        applied.push({ kind: 'hp', id, delta });
    });

    // Phase 5: Status add/remove and other effects
    for (const b of batches) {
        for (const d of b.deltas) {
            if (d.kind === 'status-add' || d.kind === 'status-rem' || d.kind === 'mp') {
                applied.push(d);
            }
        }
    }

    // Phase 6: Deaths
    const totals = new Map<string, number>();
    state.units.forEach(u => {
        totals.set(u.id, u.hp + (preDamage.get(u.id) || 0) + (damage.get(u.id) || 0));
    });

    const deaths: string[] = [];
    totals.forEach((hp, id) => {
        if (hp <= 0) deaths.push(id);
    });

    for (const id of deaths) {
        applied.push({ kind: 'unit-dead', id });
    }

    const log = batches.flatMap(b => b.log);
    const steps = applied.map(d => ({ type: d.kind, payload: d }));

    return { steps, seed: 0, log };
}

/**
 * Apply resolution results to world state
 */
export function applyResolution(state: WorldState, report: ResolutionReport): void {
    for (const step of report.steps) {
        applyDelta(state, step.payload);
    }
}