export type MoraleStatus = 'Steady' | 'Shaken' | 'Wavering' | 'Routing';

export interface MoraleState {
    value: number;
    status: MoraleStatus;
    lastShockTurn: number;
    regroupTimer?: number;
}

export interface MoraleInputs {
    hpFrac: number;
    dmgTakenThisTurn: number;
    alliesNearby: number;
    underFire: boolean;
    inCover: boolean;
    inAura: number;
    taskFocus?: 'Ram' | 'Sap' | 'Ladder' | 'Bomb';
    weatherPenalty: number;
    fearAura: number;
}

export function createMorale(_seed: number, base = 60): MoraleState {
    return { value: clamp(base, 0, 100), status: statusOf(base), lastShockTurn: -999 };
}

export function moraleTick(state: MoraleState, turn: number, inputs: MoraleInputs): MoraleState {
    let delta = (60 - state.value) * 0.02;

    if (inputs.dmgTakenThisTurn >= 0.2) delta -= 12;
    else if (inputs.dmgTakenThisTurn >= 0.1) delta -= 6;
    else if (inputs.dmgTakenThisTurn > 0) delta -= 2;

    delta += Math.min(4, Math.max(0, inputs.alliesNearby) * 0.6);
    if (inputs.underFire) delta -= 2.5;
    if (inputs.inCover) delta += 1.5;
    delta += inputs.inAura * 6;

    if (inputs.taskFocus === 'Ram' || inputs.taskFocus === 'Ladder') delta += 2;

    delta += inputs.weatherPenalty;
    delta -= inputs.fearAura;

    const nextValue = clamp(state.value + delta, 0, 100);
    const nextStatus = statusOf(nextValue);

    const next: MoraleState = {
        ...state,
        value: nextValue,
        status: nextStatus,
    };

    if (nextStatus !== state.status && nextStatus === 'Routing') {
        next.lastShockTurn = turn;
        next.regroupTimer = 3 + Math.round((80 - nextValue) / 10);
    }

    if (next.status === 'Routing' && next.regroupTimer != null && next.regroupTimer > 0) {
        next.regroupTimer -= 1;
    }

    return next;
}

export function statusOf(v: number): MoraleStatus {
    if (v < 10) return 'Routing';
    if (v < 30) return 'Wavering';
    if (v < 60) return 'Shaken';
    return 'Steady';
}

function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}