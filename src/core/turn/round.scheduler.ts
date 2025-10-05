/**
 * Round-based Initiative Scheduler
 * Fixed order per round with AP refresh and optional carry-over
 */

import { TIEBREAK, type TimelineEntry } from './timeline.common';

export class RoundScheduler {
    round = 1;
    private order: TimelineEntry[] = [];
    private idx = 0;

    constructor(units: TimelineEntry[], private apCarry = 0) {
        this.reseed(units);
    }

    reseed(units: TimelineEntry[]): void {
        // Refresh AP and compute deterministic order
        this.order = units
            .map(u => ({
                ...u,
                ap: Math.min(u.apMax, Math.floor(u.ap * this.apCarry) + u.apMax)
            }))
            .sort(TIEBREAK);
        this.idx = 0;
    }

    next(): TimelineEntry {
        const u = this.order[this.idx]!;
        this.idx = (this.idx + 1) % this.order.length;

        if (this.idx === 0) {
            this.round++;
            // Refresh AP for new round
            for (const unit of this.order) {
                unit.ap = Math.min(unit.apMax, Math.floor(unit.ap * this.apCarry) + unit.apMax);
            }
        }

        return u;
    }

    getCurrentRound(): number {
        return this.round;
    }

    getOrder(): readonly TimelineEntry[] {
        return this.order;
    }
}