import type { BattleState, HexPosition } from "./types";
import {
    attachV30,
    v30Tick,
    scoreHex,
    type Hex as ThreatHex,
} from "../ai/tactical/v30";

const NEIGHBOR_DIRS: readonly ThreatHex[] = [
    { q: 1, r: 0 },
    { q: 1, r: -1 },
    { q: 0, r: -1 },
    { q: -1, r: 0 },
    { q: -1, r: 1 },
    { q: 0, r: 1 },
];

interface TacticalRuntime {
    brain: any;
    lastTickTurn: number;
}

const runtimes = new Map<string, TacticalRuntime>();

function ensureRuntime(state: BattleState): TacticalRuntime {
    let runtime = runtimes.get(state.id);
    if (!runtime) {
        const anchor = {
            q: Math.floor(state.grid.width / 2),
            r: Math.floor(state.grid.height / 2),
        };
        const brain: any = {
            v24: { formation: { anchor, facing: 0 as 0 } },
        };
        attachV30(brain, state as any);
        runtime = { brain, lastTickTurn: -1 };
        runtimes.set(state.id, runtime);
    }
    return runtime;
}

function tickField(runtime: TacticalRuntime, state: BattleState) {
    if (runtime.lastTickTurn === state.turn) return;
    v30Tick(runtime.brain, state as any);
    runtime.lastTickTurn = state.turn;
}

export interface AIAction {
    type: "move" | "ability" | "wait";
    unitId: string;
    targetPos?: HexPosition;
    abilityId?: string;
}

export function calculateAIAction(state: BattleState, unitId: string): AIAction | null {
    const unit = state.units.find((u) => u.id === unitId);
    if (!unit || !unit.pos || unit.isDead) {
        return null;
    }

    const runtime = ensureRuntime(state);
    tickField(runtime, state);
    const field = runtime.brain?.v30?.field;
    if (!field) {
        return { type: "wait", unitId };
    }

    const currentScore = scoreHex(field, unit.pos as ThreatHex);
    let bestScore = currentScore.pull - currentScore.danger;
    let bestPos: ThreatHex = unit.pos as ThreatHex;

    for (const dir of NEIGHBOR_DIRS) {
        const candidate = { q: unit.pos.q + dir.q, r: unit.pos.r + dir.r };
        if (!isPassable(state, candidate)) continue;
        const { danger, pull } = scoreHex(field, candidate);
        const score = pull - danger;
        if (score > bestScore) {
            bestScore = score;
            bestPos = candidate;
        }
    }

    if (bestPos.q === unit.pos.q && bestPos.r === unit.pos.r) {
        return { type: "wait", unitId };
    }

    return {
        type: "move",
        unitId,
        targetPos: bestPos,
    };
}

export function calculateAdvancedAIAction(state: BattleState, unitId: string): AIAction | null {
    return calculateAIAction(state, unitId);
}

export function executeAITurn(state: BattleState): void {
    const runtime = ensureRuntime(state);
    tickField(runtime, state);
    const enemyUnits = state.units.filter(
        (u) => !u.isDead && (u.faction === "Enemy" || u.team === "Enemy"),
    );
    for (const unit of enemyUnits) {
        calculateAIAction(state, unit.id);
    }
}

export function initializeTacticalAI(state: BattleState): void {
    ensureRuntime(state);
}

export function tickTacticalAI(state: BattleState): void {
    const runtime = ensureRuntime(state);
    tickField(runtime, state);
}

function isPassable(state: BattleState, hex: ThreatHex): boolean {
    const tile = state.grid.tiles.find((t) => t.q === hex.q && t.r === hex.r);
    if (!tile) return false;
    if (tile.occupied) return tile.occupied === "";
    return tile.passable !== false;
}
