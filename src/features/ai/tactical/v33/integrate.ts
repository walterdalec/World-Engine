import type { Hex } from '../v30/field';
import { createMorale, moraleTick } from './morale';
import { auraAt, type AuraSpec } from './aura';
import { shouldRally, applyRally } from './rally';
import { planEscort, tickEscort, type EscortPlan } from './escort';
import { assignSuppression } from './suppression';
import { emitTaskOverlay } from './overlay.tasks';

import type { SplitPlan } from '../v32/lanes.split';
import type { Bucket } from '../v32/fit.autoresolve';

export interface V33Runtime {
    split?: SplitPlan;
    escorts: EscortPlan[];
    lastRally: number;
    aura: AuraSpec;
    buckets?: Record<string, Bucket>;
}

export function attachV33(brain: any, world: any, state: any): void {
    if (!brain) return;
    const auraStrength = 0.8 +
        (state.commanderA?.personality?.honor ? state.commanderA.personality.honor * 0.001 : 0) +
        (state.commanderA?.personality?.aggression ? state.commanderA.personality.aggression * 0.0005 : 0);

    const aura: AuraSpec = {
        radius: 4,
        strength: Math.min(1, Math.max(0.5, auraStrength)),
    };

    const seed = resolveSeed(state);
    for (const unit of state.units ?? []) {
        unit.aiMorale = createMorale(seed, 50 + Math.round((unit.leadership ?? 0) / 2));
    }

    brain.v33 = {
        split: brain.v32?.split,
        escorts: [],
        lastRally: -999,
        aura,
        buckets: world?.autoBuckets,
    } as V33Runtime;
}

export function v33Tick(brain: any, world: any, state: any): void {
    if (!brain?.v33) return;
    const runtime: V33Runtime = brain.v33;

    const friendlyUnits = (state.units ?? []).filter((u: any) => u.team === 'A' || u.faction === 'Player');
    const enemies = (state.units ?? []).filter((u: any) => u.team === 'B' || u.faction === 'Enemy');

    let routing = 0;
    let shaken = 0;

    for (const unit of friendlyUnits) {
        if (!unit.aiMorale) {
            unit.aiMorale = createMorale(resolveSeed(state), 60);
        }
        const inputs = collectInputs(state, unit, friendlyUnits, runtime.aura, brain);
        unit.aiMorale = moraleTick(unit.aiMorale, state.turn ?? 0, inputs);
        if (unit.aiMorale.status === 'Routing') routing += 1;
        else if (unit.aiMorale.status !== 'Steady') shaken += 1;
    }

    const laneCollapsed = Boolean(brain.v31?.laneStates?.some((lane: any) => lane.collapsed));
    const rallyCooldown = 5;
    const shakenRatio = friendlyUnits.length ? shaken / friendlyUnits.length : 0;
    const canRally = (state.turn ?? 0) >= runtime.lastRally + rallyCooldown;
    if (canRally && shouldRally(state.turn ?? 0, laneCollapsed, routing, shakenRatio)) {
        const commander = state.commanderA;
        if (commander?.pos) {
            const evt = applyRally(friendlyUnits, commander.pos, 4, 18);
            runtime.lastRally = state.turn ?? 0;
            pushEvent(state, { kind: 'Rally', payload: evt });
        }
    }

    const tasks = brain.v32?.tasks ?? [];
    if (!runtime.escorts.length && tasks.length) {
        const pool = friendlyUnits.map((u: any) => ({ id: u.id, role: u.role ?? inferRole(u), pos: u.pos ?? { q: 0, r: 0 } }));
        for (const task of tasks) {
            const plan = planEscort(task, pool, state.anchorA ?? { q: 0, r: 0 });
            if (plan) runtime.escorts.push(plan);
        }
        if (tasks.length) {
            const shooters = friendlyUnits.filter((u: any) => {
                const role = (u.role ?? '').toLowerCase();
                return role.includes('archer') || role.includes('ranger') || role.includes('mage');
            });
            if (shooters.length) {
                const laneTarget = resolveLaneTarget(state, tasks[0]);
                if (laneTarget) assignSuppression(state, shooters, laneTarget);
            }
        }
    }

    runtime.escorts = runtime.escorts.map((plan) =>
        tickEscort(plan, { unitsById: indexById(state.units ?? []), enemies }),
    );

    emitTaskOverlay(state, tasks);
}

export function snapshotV33(brain: any) {
    return {
        rallyLast: brain?.v33?.lastRally,
        escorts: brain?.v33?.escorts?.length ?? 0,
    };
}

function collectInputs(state: any, unit: any, allies: any[], aura: AuraSpec, brain: any) {
    const nearby = allies.filter((ally) => ally.id !== unit.id && ally.pos && unit.pos && hexDist(ally.pos, unit.pos) <= 2);
    const maxHp = unit.maxHp ?? unit.stats?.hp ?? unit.hpMax ?? 1;
    const hp = unit.hp ?? maxHp;

    const events = state.events ?? [];
    const underFire = events.slice(-5).some((evt: any) => evt.kind === 'RangedHit' && evt.targetId === unit.id);
    const fearAura = events.slice(-10).some((evt: any) => evt.kind === 'TerrorPulse' && evt.hex && unit.pos && hexDist(evt.hex, unit.pos) <= 3) ? 4 : 0;

    const terrainCover: Set<string> = state.terrain?.cover instanceof Set
        ? state.terrain.cover
        : new Set<string>();
    const inCover = terrainCover.has(cellKey(unit.pos));

    const commander = state.commanderA;
    const auraBoost = commander?.pos ? auraAt(commander.pos, unit.pos, aura) : 0;

    const weather = state.environment?.weather ?? {};
    const weatherPenalty =
        (weather.temperature != null && weather.temperature < 0 ? -2 : 0) +
        (weather.temperature != null && weather.temperature > 30 ? -2 : 0) +
        (weather.precipitation != null && weather.precipitation > 70 ? -2 : 0);

    const taskAssign = brain.v32?.taskAssign ?? {};
    const assignedTask = Object.entries(taskAssign).find(([, unitId]) => unitId === unit.id)?.[0];
    const task = brain.v32?.tasks?.find((t: any) => t.id === assignedTask);

    return {
        hpFrac: maxHp ? hp / maxHp : 1,
        dmgTakenThisTurn: Math.max(0, (unit.deltaHp ?? 0) < 0 ? Math.abs(unit.deltaHp) / Math.max(1, maxHp) : 0),
        alliesNearby: nearby.length,
        underFire,
        inCover,
        inAura: auraBoost,
        taskFocus: task?.kind,
        weatherPenalty,
        fearAura,
    };
}

function resolveLaneTarget(state: any, task: any): [Hex, Hex] | undefined {
    const anchor = state.anchorA ?? { q: 0, r: 0 };
    const target = state.siegeTargets?.[task.targetId] ?? task.targetHex ?? anchor;
    return [anchor, target];
}

function indexById(units: any[]): Record<string, any> {
    const out: Record<string, any> = {};
    for (const unit of units) {
        if (unit?.id) out[unit.id] = unit;
    }
    return out;
}

function inferRole(unit: any): string {
    const arche = (unit.archetype ?? '').toLowerCase();
    if (arche.includes('shield') || arche.includes('guard')) return 'Shield';
    if (arche.includes('siege')) return 'Siege';
    if (arche.includes('archer') || arche.includes('ranger')) return 'Archer';
    if (arche.includes('mage') || arche.includes('caster')) return 'Mage';
    return 'Infantry';
}

function resolveSeed(state: any): number {
    if (typeof state?.seed === 'number') return state.seed;
    const str = state?.context?.seed;
    if (typeof str === 'string') {
        let hash = 0;
        for (let i = 0; i < str.length; i += 1) {
            hash = (hash * 33 + str.charCodeAt(i)) | 0;
        }
        return hash >>> 0;
    }
    return 0;
}

function pushEvent(state: any, evt: any): void {
    const events = Array.isArray(state.events) ? state.events : (state.events = []);
    events.push({ t: state.time ?? 0, ...evt });
}

function hexDist(a: Hex, b: Hex): number {
    const ax = a.q;
    const ay = a.r;
    const az = -ax - ay;
    const bx = b.q;
    const by = b.r;
    const bz = -bx - by;
    return Math.max(Math.abs(ax - bx), Math.abs(ay - by), Math.abs(az - bz));
}

function cellKey(h: Hex): string {
    return `${h.q},${h.r}`;
}