/**
 * Action System Types
 * Pure TypeScript, engine‑agnostic action system with deterministic validation and resolution
 */

// Re-export hex coordinate type (compatible with battle system)
export interface Axial {
    q: number;
    r: number;
}

export type ActionKind = 'move' | 'attack' | 'cast' | 'command' | 'use' | 'wait' | 'defend' | 'flee' | 'rally';
export type TargetPattern = 'self' | 'single' | 'line' | 'cone' | 'blast' | 'multi';

export interface PlannedAction {
    actor: string;
    kind: ActionKind;
    targets: Axial[];            // resolved hex targets from selectors
    cost: { ap: number; time?: number; mana?: number; reagents?: string[] };
    data?: any;                  // e.g., weapon id, spell id, cone angle, etc.
    snapshotId?: number;         // optional snapshot stamp from TurnManager
    computed?: {                 // populated by validators
        moveCost?: number;       // server-truth AP cost for path
        path?: Axial[];          // cached path for animation
    };
}

export interface ValidationResult {
    ok: boolean;
    reasons?: string[];
}

export interface WorldUnit {
    id: string;
    team: string;
    pos: Axial;
    hp: number;
    mp: number;
    ap: number;
    speed: number;
    statuses?: Record<string, number>; // name -> remaining rounds
}

export interface WorldState {
    units: Map<string, WorldUnit>;
    occupied: Set<string>;                   // `${q},${r}` for quick lookups
    terrainCost: (h: Axial) => number;      // from terrain system
    passable: (h: Axial) => boolean;        // from terrain system
    blocksLos: (h: Axial) => boolean;       // from terrain system
    rng: () => number;                      // injected deterministic RNG
}

export interface EffectStep {
    type: string;
    payload: any;
}

export interface ResolutionReport {
    steps: EffectStep[];
    seed: number;
    log: string[];
}