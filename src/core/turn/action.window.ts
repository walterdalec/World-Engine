/**
 * Simultaneous Resolution Window
 * Collects actions for deterministic batch resolution
 */

import type { PlannedAction } from './types';

export class ActionWindow {
    private buf: PlannedAction[] = [];

    declare(a: PlannedAction): void {
        this.buf.push(a);
    }

    clear(): void {
        this.buf.length = 0;
    }

    /** Deterministic sort by (speed desc, actorId asc, kind order) applied by manager */
    drain(): PlannedAction[] {
        return this.buf.splice(0, this.buf.length);
    }

    size(): number {
        return this.buf.length;
    }

    isEmpty(): boolean {
        return this.buf.length === 0;
    }
}