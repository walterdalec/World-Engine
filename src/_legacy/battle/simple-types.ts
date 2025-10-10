// Simple types for minimal battle system (matches your engine.ts examples)
export type Team = "player" | "enemy";

export interface Unit {
    id: string;
    name: string;
    team: Team;
    q: number;
    r: number;              // axial coordinates
    move: number;           // hexes per turn
    hp: number;
    maxHp: number;
    atk: number;
    def: number;
    spd: number;            // speed for initiative order
    defended?: boolean;     // set when Defend is used (reset next turn)
    alive?: boolean;
    // Add missing properties for compatibility
    mp?: number;
    maxMp?: number;
    abilities?: string[];
}

export type Phase = "awaitAction" | "moveSelect" | "animating";

export interface Bounds {
    qMin: number; qMax: number; rMin: number; rMax: number;
}

export interface GameState {
    units: Record<string, Unit>;
    order: string[];        // initiative order (ids)
    turnIndex: number;      // pointer into order
    round: number;
    selectedUnitId: string; // whose turn it is
    phase: Phase;

    // movement preview
    reachable: Set<string>; // "q,r"
    pathPreview: Record<string, { q: number; r: number }[]>;

    worldBounds: Bounds;
}