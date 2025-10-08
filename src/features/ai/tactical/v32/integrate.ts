import { planSiegeTasks, assignTasks, moraleShockOnBreach, type UnitLite } from './tasks.siege';
import { computeSplitPlan, type SplitPlan } from './lanes.split';
import { pairKey, initBucket, updateBucket, type Bucket } from './fit.autoresolve';
import type { Task } from '../v30/siege';

export interface V32Runtime {
  split?: SplitPlan;
  tasks: Task[];
  taskAssign: Record<string, string>;
  regroupTurn?: number;
  buckets: Record<string, Bucket>;
  lastSeed?: number;
  handledBreaches: Set<string>;
}

type AttachOpts = {
  attackerFactionId?: string;
  defenderFactionId?: string;
};

export function attachV32(brain: any, world: any | undefined, state: any, opts: AttachOpts = {}): void {
  if (!brain) return;
  const buckets = ensureAutoBuckets(world);
  brain.v32 = {
    split: undefined,
    tasks: [],
    taskAssign: {},
    regroupTurn: undefined,
    buckets,
    lastSeed: resolveSeed(state),
    handledBreaches: new Set<string>(),
  } as V32Runtime;

  // Initial split plan
  const seed = brain.v32.lastSeed ?? 0;
  const risk = brain.intent?.riskTolerance ?? 50;
  brain.v32.split = computeSplitPlan(seed, brain.v30?.lanes ?? [], brain.v30?.field, risk);

  if (opts.attackerFactionId && opts.defenderFactionId) {
    brain.v32.pairKey = pairKey(
      world?.factions?.[opts.attackerFactionId]?.cultureId ?? 'unknown',
      world?.factions?.[opts.defenderFactionId]?.cultureId ?? 'unknown',
    );
  }
}

export function v32Tick(brain: any, world: any | undefined, state: any): void {
  if (!brain?.v32) return;
  const runtime: V32Runtime = brain.v32;

  const seed = resolveSeed(state);
  if (runtime.lastSeed !== seed) {
    runtime.split = computeSplitPlan(seed, brain.v30?.lanes ?? [], brain.v30?.field, brain.intent?.riskTolerance ?? 50);
    runtime.lastSeed = seed;
  }

  const breaches = (state.events ?? []).filter((evt: any) => evt.kind === 'Breach');
  for (const breach of breaches) {
    if (breach?.id && !runtime.handledBreaches.has(breach.id)) {
      runtime.handledBreaches.add(breach.id);
      const shock = moraleShockOnBreach(breach.kind ?? 'Wall');
      pushEvent(state, { kind: 'MoraleShock', shock, breachId: breach.id });
    }
  }

  const shouldReplan =
    !runtime.tasks.length ||
    breaches.some((evt: any) => evt.time === state.time) ||
    (runtime.regroupTurn != null && state.turn >= runtime.regroupTurn);

  if (shouldReplan) {
    const plan = planSiegeTasks(seed, state.siegeObjs ?? state.siege?.objects ?? [], collectUnits(state));
    runtime.tasks = plan.tasks;
    runtime.taskAssign = assignTasks(runtime.tasks, collectUnits(state));
    runtime.regroupTurn = state.turn + (runtime.split?.regroupAt ?? 6);
  }
}

export function onBattleEnd_AutoFit(world: any, summary: any): void {
  if (!world) return;
  const buckets = ensureAutoBuckets(world);
  const fA = summary?.factionA;
  const fB = summary?.factionB;
  if (!fA || !fB) return;
  const key = pairKey(world.factions?.[fA]?.cultureId ?? 'unknown', world.factions?.[fB]?.cultureId ?? 'unknown');
  const bucket = buckets[key] ?? (buckets[key] = initBucket());
  updateBucket(bucket, {
    dmgA: summary?.dmgA ?? 0,
    dmgB: summary?.dmgB ?? 0,
    rounds: summary?.rounds ?? bucket.coeffs.rounds,
  });
}

function collectUnits(state: any): UnitLite[] {
  return (state.units ?? [])
    .filter((u: any) => !u.isDead && (u.team === 'A' || u.faction === 'Player'))
    .map((u: any) => ({
      id: u.id,
      pos: u.pos ?? { q: 0, r: 0 },
      role: (u.role as any) ?? inferRole(u),
      atk: u.stats?.atk ?? u.atk ?? 6,
      def: u.stats?.def ?? u.def ?? 4,
      morale: u.morale ?? 50,
    }));
}

function inferRole(u: any): UnitLite['role'] {
  const arche = (u.archetype ?? '').toLowerCase();
  if (arche.includes('shield') || arche.includes('guard')) return 'Shield';
  if (arche.includes('siege') || arche.includes('ram')) return 'Siege';
  if (arche.includes('rogue') || arche.includes('skirm')) return 'Skirmisher';
  return 'Infantry';
}

function ensureAutoBuckets(world: any): Record<string, Bucket> {
  if (!world) return {};
  world.autoBuckets = world.autoBuckets ?? {};
  return world.autoBuckets;
}

function pushEvent(state: any, evt: any): void {
  if (!state) return;
  const events = Array.isArray(state.events) ? state.events : (state.events = []);
  events.push({ t: state.time ?? 0, ...evt });
}

function resolveSeed(state: any): number {
  if (typeof state?.seed === 'number') return state.seed;
  const str = state?.context?.seed;
  if (typeof str === 'string') {
    let hash = 0;
    for (let i = 0; i < str.length; i += 1) {
      hash = (hash * 31 + str.charCodeAt(i)) | 0;
    }
    return hash >>> 0;
  }
  return 0;
}
