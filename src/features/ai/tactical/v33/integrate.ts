import { createMorale, moraleTick } from './morale';
import { auraAt, type AuraSpec } from './aura';
import { shouldRally, applyRally } from './rally';
import { planEscort, tickEscort, type EscortPlan, type EscortContext } from './escort';
import { assignSuppression } from './suppression';
import { emitTaskOverlay } from './overlay.tasks';

export interface V33Runtime {
  escorts: EscortPlan[];
  lastRally: number;
  aura: AuraSpec;
}

export function attachV33(brain: any, _world: any | undefined, state: any): void {
  if (!brain) return;
  const aura: AuraSpec = { radius: 4, strength: 0.8 };
  const seed = resolveSeed(state);
  for (const unit of state.units ?? []) {
    unit.aiMorale = unit.aiMorale ?? createMorale(seed, 50 + Math.round((unit.leadership ?? 0) / 2));
  }
  brain.v33 = { escorts: [], lastRally: -999, aura } as V33Runtime;
}

export function v33Tick(brain: any, _world: any | undefined, state: any): void {
  if (!brain?.v33) return;
  const runtime: V33Runtime = brain.v33;
  const friendly = (state.units ?? []).filter((unit: any) => unit.team === 'A' || unit.faction === 'Player');
  const enemies = (state.units ?? []).filter((unit: any) => unit.team === 'B' || unit.faction === 'Enemy');

  let routing = 0;
  let shaken = 0;
  for (const unit of friendly) {
    const inputs = collectInputs(state, unit, friendly, runtime.aura, brain);
    unit.aiMorale = moraleTick(unit.aiMorale, state.turn ?? 0, inputs);
    if (unit.aiMorale.status === 'Routing') routing += 1;
    else if (unit.aiMorale.status !== 'Steady') shaken += 1;
  }

  const laneCollapsed = Boolean(brain.v31?.laneStates?.some((lane: any) => lane.collapsed));
  const shakenRatio = friendly.length ? shaken / friendly.length : 0;
  const canRally = (state.turn ?? 0) >= runtime.lastRally + 5;
  if (canRally && shouldRally(state.turn ?? 0, laneCollapsed, routing, shakenRatio)) {
    const commander = state.commanderA;
    if (commander?.pos) {
      const evt = applyRally(friendly, commander.pos, 4, 18);
      runtime.lastRally = state.turn ?? 0;
      pushEvent(state, { kind: 'Rally', payload: evt });
    }
  }

  const tasks = brain.v32?.tasks ?? [];
  if (!runtime.escorts.length && tasks.length) {
    const pool = friendly.map((unit: any) => ({ id: unit.id, role: unit.role ?? inferRole(unit), pos: unit.pos ?? { q: 0, r: 0 } }));
    for (const task of tasks) {
      const plan = planEscort(task, pool, state.anchorA ?? { q: 0, r: 0 });
      if (plan) runtime.escorts.push(plan);
    }
    const shooters = friendly.filter((unit: any) => {
      const role = (unit.role ?? '').toLowerCase();
      return role.includes('archer') || role.includes('ranger') || role.includes('mage');
    });
    if (shooters.length && tasks[0]) {
      assignSuppression(state, shooters, [state.anchorA ?? { q: 0, r: 0 }, state.siegeTargets?.[tasks[0].targetId] ?? tasks[0].targetHex ?? { q: 0, r: 0 }]);
    }
  }

  runtime.escorts = runtime.escorts.map(plan => tickEscort(plan, { unitById: indexById(state.units ?? []), enemies } as EscortContext));
  emitTaskOverlay(state, tasks);
}

function collectInputs(state: any, unit: any, allies: any[], aura: AuraSpec, brain: any) {
  const nearby = allies.filter((ally: any) => ally.id !== unit.id && ally.pos && unit.pos && hexDist(ally.pos, unit.pos) <= 2);
  const maxHp = unit.maxHp ?? unit.stats?.hp ?? unit.hpMax ?? 1;
  const hp = unit.hp ?? maxHp;
  const events = state.events ?? [];
  const underFire = events.slice(-5).some((evt: any) => evt.kind === 'RangedHit' && evt.targetId === unit.id);
  const fearAura = events.slice(-10).some((evt: any) => evt.kind === 'TerrorPulse' && evt.hex && unit.pos && hexDist(evt.hex, unit.pos) <= 3) ? 4 : 0;
  const terrainCover: Set<string> = state.terrain?.cover instanceof Set ? state.terrain.cover : new Set();
  const inCover = terrainCover.has(cellKey(unit.pos));
  const commander = state.commanderA;
  const auraBoost = commander?.pos ? auraAt(commander.pos, unit.pos, aura) : 0;
  const weather = state.environment?.weather ?? {};
  const weatherPenalty = (weather.temperature != null && weather.temperature < 0 ? -2 : 0) +
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
  return unit.role ?? 'Infantry';
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

function cellKey(h: { q: number; r: number }): string {
  return `${h.q},${h.r}`;
}

function hexDist(a: { q: number; r: number }, b: { q: number; r: number }): number {
  const ax = a.q;
  const ay = a.r;
  const az = -ax - ay;
  const bx = b.q;
  const by = b.r;
  const bz = -bx - by;
  return Math.max(Math.abs(ax - bx), Math.abs(ay - by), Math.abs(az - bz));
}
