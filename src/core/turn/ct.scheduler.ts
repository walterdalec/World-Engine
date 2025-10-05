/**
 * CT (Continuous Time) Scheduler
 * Initiative meters fill by speed; when reaching threshold, unit gets turn
 */

import type { TimelineEntry } from './timeline.common';

export class CTScheduler {
    time = 0; // integer ticks
    private list: TimelineEntry[] = [];
    private threshold = 100; // meter needed to act

    constructor(units: TimelineEntry[], threshold = 100) {
        this.list = units.map(u => ({ ...u, meter: 0, nextTick: 0 }));
        this.threshold = threshold;
    }

    /** Advance timeline until some unit hits threshold */
    advance(): TimelineEntry {
        for (; ;) {
            this.time++;

            for (const u of this.list) {
                if (u.stunned) continue;

                u.meter += u.speed;
                if (u.meter >= this.threshold) {
                    u.meter -= this.threshold; // carry remainder to reduce drift
                    u.nextTick = this.time;
                    return u;
                }
            }
        }
    }

    /** After an action that costs time, push forward global time */
    consume(u: TimelineEntry, timeCost: number): void {
        // Advance global time and let others accrue; keeps relative fairness
        this.time += Math.max(0, timeCost | 0);
    }

    getTime(): number {
        return this.time;
    }

    getUnits(): readonly TimelineEntry[] {
        return this.list;
    }

    setThreshold(threshold: number): void {
        this.threshold = threshold;
    }
}