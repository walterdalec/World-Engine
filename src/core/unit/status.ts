// packages/core/src/unit/status.ts
import type { StatusInst, Unit } from './types';

export type StatusHook = {
    preHit?: (u: Unit, ctx: any) => void;                 // before hit calc
    onHit?: (u: Unit, ctx: any, dmgInOut: any) => void;    // when a hit lands (modify damage)
    onTurnStart?: (u: Unit) => void;                     // decrement durations handled externally
};

export const StatusLib: Record<string, StatusHook> = {
    stunned: {},
    defending: {
        onHit: (u, ctx, io) => {
            if (ctx.kind === 'Physical') {
                io.final = Math.floor(io.final / 2);
            }
        }
    },
    burn: {
        onTurnStart: (u) => {
            /* DoT applied elsewhere via effects */
        }
    },
    poison: {
        onTurnStart: (u) => {
            /* DoT via effects */
        }
    },
    vulnerable: {
        onHit: (u, ctx, io) => {
            io.final = Math.floor(io.final * 1.25);
        }
    }
};

export function tickStatuses(u: Unit) {
    u.statuses = u.statuses.map(s => ({ ...s, turns: s.turns - 1 })).filter(s => s.turns > 0);
}