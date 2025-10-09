/**
 * Turn System Types & Contracts
 * Deterministic turn flow with Round and CT initiative modes
 */

export type UnitId = string;
export type TeamId = string;

export interface UnitRef {
    id: UnitId;
    team: TeamId;
    speed: number;      // initiative; integer ≥ 0
    apMax: number;      // max AP per round/turn
    ap: number;         // current AP (mutable in manager)
    gcd?: number;       // global cooldown ticks (CT mode)
    flags?: {
        stunned?: boolean;  // cannot act while true
        skipNext?: boolean; // consumes next turn, then clears
    };
    meta?: Record<string, any>; // optional game data (class, name)
}

export type InitiativeMode = 'round' | 'ct';

// Placeholder types for action system integration (TODO #04)
export interface PlannedAction {
    actor: UnitId;
    kind: string;
    targets?: any[];
    cost: { ap: number; time?: number };
    data?: Record<string, any>;
}

export interface WorldState {
    units: Map<string, any>;
    occupied: Set<string>;
    terrainCost: (_pos: any) => number;
    passable: (_pos: any) => boolean;
    blocksLos: (_pos: any) => boolean;
}

export interface ResolutionReport {
    steps: EffectStep[];
    seed: number;
    log: string[];
}

export interface EffectStep {
    type: string;
    payload: any;
}

export interface TurnEvent {
    type: 'turn-start' | 'turn-end' | 'round-start' | 'round-end' | 'tick';
    unit?: UnitId;
    round?: number;
    time?: number;
}

export interface TurnHooks {
    onTurnStart?: (_u: UnitRef) => void;
    onActionDeclared?: (_a: PlannedAction, _verdict: { ok: boolean; reasons?: string[] }) => void;
    onResolve?: (_r: ResolutionReport) => void;
    onRoundEnd?: (_n: number) => void;
}