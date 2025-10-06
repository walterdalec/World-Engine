// packages/core/src/morale/apply.ts - Simple morale system for spell integration
export type MoraleState = 'steady' | 'shaken' | 'wavering' | 'routing';

export interface MoraleMods {
    accMult: number;    // accuracy multiplier (e.g., 1.0 = normal, 0.8 = -20%)
    critPermille: number; // crit shift in permille (e.g., +50 = +5% crit chance)
}

export function modsFor(state: MoraleState): MoraleMods {
    switch (state) {
        case 'steady': return { accMult: 1.0, critPermille: 0 };
        case 'shaken': return { accMult: 0.9, critPermille: -20 };
        case 'wavering': return { accMult: 0.8, critPermille: -40 };
        case 'routing': return { accMult: 0.6, critPermille: -80 };
    }
}