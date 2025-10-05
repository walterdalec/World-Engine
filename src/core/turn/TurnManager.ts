/**
 * TurnManager - Main Facade for Turn System
 * Supports both Round and CT initiative modes with deterministic resolution
 */

import { mulberry32 } from './rng';
import { RoundScheduler } from './round.scheduler';
import { CTScheduler } from './ct.scheduler';
import { ActionWindow } from './action.window';
import { fromUnit, type TimelineEntry } from './timeline.common';
import type {
    InitiativeMode,
    TurnEvent,
    TurnHooks,
    UnitRef,
    PlannedAction,
    WorldState,
    ResolutionReport
} from './types';
import { validateAction } from './validation';
import { applySteps } from './apply';

export class TurnManager {
    readonly mode: InitiativeMode;
    private units = new Map<string, TimelineEntry>();
    private round?: RoundScheduler;
    private ct?: CTScheduler;
    private aw = new ActionWindow();
    private rand: () => number;
    private hooks: TurnHooks = {};
    private world?: WorldState;

    constructor(mode: InitiativeMode, seed = 1234, hooks?: TurnHooks) {
        this.mode = mode;
        this.rand = mulberry32(seed);
        this.hooks = hooks ?? {};
    }

    attachWorld(w: WorldState): void {
        this.world = w;
    }

    addUnit(u: UnitRef): void {
        this.units.set(u.id, fromUnit(u));
        this.reseed();
    }

    removeUnit(id: string): void {
        this.units.delete(id);
        this.reseed();
    }

    setHooks(h: TurnHooks): void {
        this.hooks = h;
    }

    private reseed(): void {
        const arr = Array.from(this.units.values());
        if (this.mode === 'round') {
            this.round = new RoundScheduler(arr, 0.25); // 25% AP carry-over
        } else {
            this.ct = new CTScheduler(arr, 100);
        }
    }

    declareAction(a: PlannedAction): void {
        if (!this.world) {
            this.aw.declare(a);
            this.hooks.onActionDeclared?.(a, { ok: true });
            return;
        }

        const verdict = validateAction(this.world, a);
        if (verdict.ok) {
            this.aw.declare(a);
        }
        this.hooks.onActionDeclared?.(a, verdict);
    }

    /** Resolve current action window against WorldState, apply deltas, and sync AP/time */
    resolve(): ResolutionReport {
        const actions = this.aw.drain();

        if (!this.world) {
            // Fallback: stub report when no world attached
            return {
                steps: actions.map(a => ({ type: 'stub', payload: a })),
                seed: (this.rand() * 1e9) | 0,
                log: actions.map(a => `${a.actor}:${a.kind}`)
            };
        }

        // Deterministic ordering by speed desc, then actor ID asc, then action kind
        const kindRank: Record<string, number> = {
            defend: 0, wait: 1, move: 2, cast: 3, attack: 4, use: 5
        };

        const speedOf = (id: string) => this.units.get(id)?.speed ?? 0;

        actions.sort((a, b) =>
            (speedOf(b.actor) - speedOf(a.actor)) ||
            (a.actor < b.actor ? -1 : 1) ||
            ((kindRank[a.kind] ?? 99) - (kindRank[b.kind] ?? 99))
        );

        // Create resolution report (simplified for TODO #03)
        const log = actions.map(a => `${a.actor}:${a.kind}`);
        const steps = actions.map(a => ({ type: 'action', payload: a }));
        const report: ResolutionReport = {
            steps,
            seed: (this.rand() * 1e9) | 0,
            log
        };

        // Apply effects to world state
        applySteps(this.world, steps);

        // Sync AP to timeline and advance CT time by summed action time per actor
        const timeByActor = new Map<string, number>();
        for (const a of actions) {
            timeByActor.set(a.actor, (timeByActor.get(a.actor) || 0) + (a.cost.time || 0));
        }

        timeByActor.forEach((t, id) => {
            const u = this.units.get(id);
            if (!u) return;

            // Sync AP from world state unit if present
            const wu = this.world!.units.get(id);
            if (wu) {
                u.ap = Math.max(0, Math.min(u.apMax, wu.ap));
            }

            if (this.mode === 'ct') {
                this.ct!.consume(u, t);
            }
        });

        this.hooks.onResolve?.(report);
        return report;
    }

    /** Advance to next acting unit. For CT, advances time internally */
    next(): TurnEvent {
        if (this.mode === 'round') {
            const u = this.round!.next();

            if (u.stunned || u.skipNext) {
                u.skipNext = false;
                return this.next();
            }

            this.hooks.onTurnStart?.(u as any);
            return {
                type: 'turn-start',
                unit: u.id,
                round: this.round!.getCurrentRound()
            };
        } else {
            const u = this.ct!.advance();

            if (u.stunned) {
                return this.next();
            }

            this.hooks.onTurnStart?.(u as any);
            return {
                type: 'turn-start',
                unit: u.id,
                time: this.ct!.getTime()
            };
        }
    }

    /** Apply time/AP costs after resolving a unit's action(s) */
    consume(actor: string, apCost: number, timeCost = 0): void {
        const u = this.units.get(actor);
        if (!u) return;

        u.ap = Math.max(0, u.ap - apCost);
        if (this.mode === 'ct') {
            this.ct!.consume(u, timeCost);
        }
    }

    /** Get current state for debugging/UI */
    getState() {
        return {
            mode: this.mode,
            units: Array.from(this.units.values()),
            currentRound: this.round?.getCurrentRound(),
            currentTime: this.ct?.getTime(),
            actionWindowSize: this.aw.size()
        };
    }
}