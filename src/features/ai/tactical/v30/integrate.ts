import {
  createField,
  addThreat,
  addSupport,
  addIntent,
  addCover,
  addHazard,
  scoreHex,
  decay,
  type ThreatField,
  type Hex,
} from './field';
import { makeLanes, type Lane } from './lanes';
import {
  registerSiege,
  planBreach,
  type SiegeObj,
  type Task,
} from './siege';

export interface V30Runtime {
  field: ThreatField;
  lanes: Lane[];
  primary: 'Left' | 'Center' | 'Right';
  siege?: {
    objs: SiegeObj[];
    currentTask?: { task: Task['kind']; target: string } | null;
  };
  seed: number;
}

type BattleLike = {
  seed?: number;
  context?: { seed?: string };
  units?: Array<{
    id: string;
    faction?: string;
    team?: string;
    isDead?: boolean;
    pos?: Hex;
    stats?: { atk: number; rng: number };
    range?: number;
  }>;
  terrain?: Array<{ hex: Hex; cover?: number; hazard?: number }>;
  siege?: { objects?: SiegeObj[] };
};

export function attachV30(brain: any, state: BattleLike): void {
  const baseSeed = resolveSeed(state);
  const formation = brain.v24?.formation ?? {};
  const anchor: Hex = formation.anchor ?? { q: 0, r: 0 };
  const facing: 0 | 1 | 2 | 3 | 4 | 5 = formation.facing ?? 0;
  const lanes = makeLanes(anchor, facing);
  const runtime: V30Runtime = {
    field: createField(baseSeed),
    lanes,
    primary: 'Center',
    seed: baseSeed,
  };
  if (state.siege?.objects?.length) {
    runtime.siege = { objs: state.siege.objects.slice(), currentTask: null };
  }
  brain.v30 = runtime;
}

export function v30Tick(brain: any, state: BattleLike): void {
  if (!brain?.v30) return;
  const runtime: V30Runtime = brain.v30;
  const field = runtime.field;

  decay(field, 0.92);
  ingestTerrain(field, state);
  ingestUnits(field, state);
  handleSiege(field, runtime, state);

  const primaryLane = pickPrimaryLane(field, runtime.lanes);
  runtime.primary = primaryLane.id;
  for (const goal of primaryLane.goals) {
    addIntent(field, goal, 2);
  }
}

export function pickPrimaryLane(field: ThreatField, lanes: Lane[]): Lane {
  let best = lanes[1] ?? lanes[0]!;
  let bestScore = -Infinity;
  for (const lane of lanes) {
    const last = lane.goals.at(-1);
    if (!last) continue;
    const { danger, pull } = scoreHex(field, last);
    const score = pull - danger - lane.pressure;
    if (score > bestScore) {
      bestScore = score;
      best = lane;
    }
  }
  return best;
}

function ingestTerrain(field: ThreatField, state: BattleLike): void {
  const cells = state.terrain ?? [];
  for (const cellData of cells) {
    if (!cellData?.hex) continue;
    if (cellData.cover) addCover(field, cellData.hex, cellData.cover);
    if (cellData.hazard) addHazard(field, cellData.hex, cellData.hazard);
  }
}

function ingestUnits(field: ThreatField, state: BattleLike): void {
  const units = state.units ?? [];
  for (const unit of units) {
    if (!unit || unit.isDead || !unit.pos) continue;
    const atk = unit.stats?.atk ?? 6;
    const range = unit.stats?.rng ?? unit.range ?? 1;
    const power = atk * (range > 1 ? 0.8 : 1);
    const team = unit.team ?? unit.faction ?? 'Unknown';
    if (team === 'Enemy' || team === 'B') {
      addThreat(field, unit.pos, power);
    } else {
      addSupport(field, unit.pos, power * 0.6);
    }
  }
}

function handleSiege(field: ThreatField, runtime: V30Runtime, state: BattleLike): void {
  if (!state.siege?.objects?.length) return;
  runtime.siege = runtime.siege ?? { objs: [], currentTask: null };
  runtime.siege.objs = state.siege.objects.slice();

  for (const obj of runtime.siege.objs) {
    registerSiege(field, obj);
  }

  if (!runtime.siege.currentTask) {
    runtime.siege.currentTask = planBreach(field, runtime.siege.objs) ?? null;
  }
}

function resolveSeed(state: BattleLike): number {
  if (typeof state.seed === 'number') return state.seed;
  const strSeed = state.context?.seed;
  if (strSeed) {
    const hash = Array.from(strSeed).reduce((acc, ch) => ((acc << 5) - acc + ch.charCodeAt(0)) | 0, 0);
    return hash >>> 0;
  }
  return Date.now() & 0xffffffff;
}
