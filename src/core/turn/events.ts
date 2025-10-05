/**
 * Event Bus for Turn System
 * Simple callback management for turn events
 */

import type { TurnHooks, PlannedAction, ResolutionReport, UnitRef } from './types';

export class TurnEvents {
    private h: TurnHooks = {};

    set(h: TurnHooks): void {
        this.h = h;
    }

    start(u: UnitRef): void {
        this.h.onTurnStart?.(u);
    }

    declared(a: PlannedAction, verdict: { ok: boolean; reasons?: string[] }): void {
        this.h.onActionDeclared?.(a, verdict);
    }

    resolve(r: ResolutionReport): void {
        this.h.onResolve?.(r);
    }

    roundEnd(n: number): void {
        this.h.onRoundEnd?.(n);
    }
}