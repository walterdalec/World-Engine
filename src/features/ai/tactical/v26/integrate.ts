
import { createDanger2D, addDirectional, decay2D, type Dir6 } from './memory2d';
import { makeScenario, applyScenarioRules } from './scenarios';
import { batchClassify } from './roles.auto';
import { createReplay, attachRecorder } from './replay';
import type { ScenarioKind } from './scenarios';

export interface V26Runtime {
  d2: ReturnType<typeof createDanger2D>;
  scenario?: ScenarioKind;
  scoringAdjust?: Record<string, number>;
}

export function attachV26(
  brain: any,
  state: any,
  opts: { regionTags?: string[]; isAmbush?: boolean; anchor: { q: number; r: number }; facing: 0 | 1 | 2 | 3 | 4 | 5 },
) {
  const runtime: V26Runtime = { d2: createDanger2D(0.92) };
  brain.v26 = runtime;

  const tags = opts.regionTags ?? [];
  const scenario: ScenarioKind | undefined = opts.isAmbush
    ? 'Ambush'
    : tags.includes('Fort')
    ? 'Siege'
    : tags.includes('Bridge')
    ? 'Bridge'
    : undefined;

  if (scenario) {
    const plan = makeScenario(scenario, opts.anchor, opts.facing);
    runtime.scenario = scenario;
    brain.intent = plan.intent;
    brain.v24 = brain.v24 ?? {};
    brain.v24.formation = plan.formation;
    runtime.scoringAdjust = applyScenarioRules(plan, {});
  }

  const unitStats = state.unitStatsById || buildUnitStatsFallback(state);
  const roles = batchClassify(unitStats);
  state.events.push({ t: state.time ?? 0, kind: 'AutoRolesV26', roles });

  state.replay = createReplay(state.seed ?? 0, { region: state.regionId, tags });
  attachRecorder(state, state.replay);
}

export function v26Tick(brain: any, state: any) {
  const runtime: V26Runtime | undefined = brain.v26;
  if (!runtime) return;

  const recent = state.events?.slice(-10) ?? [];
  for (const event of recent) {
    switch (event.kind) {
      case 'AoeHit':
        if (event.hex && typeof event.dir === 'number') addDirectional(runtime.d2, event.hex, event.dir as Dir6, 3);
        break;
      case 'RangedHit':
        if (event.hex && typeof event.dir === 'number') addDirectional(runtime.d2, event.hex, event.dir as Dir6, 1);
        break;
      case 'UnitKilled': {
        const unit = state.unitsById?.[event.unitId];
        if (unit?.pos && typeof event.dir === 'number') addDirectional(runtime.d2, unit.pos, event.dir as Dir6, 5);
        break;
      }
      default:
        break;
    }
  }
  decay2D(runtime.d2);

  if (runtime.scoringAdjust && typeof brain.scoreCandidates === 'function') {
    const original = brain._v26Score ?? brain.scoreCandidates.bind(brain);
    if (!brain._v26Score) brain._v26Score = original;
    brain.scoreCandidates = (bb: any) => {
      const base = original(bb) || [];
      return base.map((entry: any) => ({
        ...entry,
        score: (entry.score ?? 0) + (runtime.scoringAdjust![entry.name] ?? 0),
      }));
    };
  }
}

function buildUnitStatsFallback(state: any) {
  const stats: Record<string, { atk: number; def: number; spd: number; rng: number; hp: number; traits?: string[] }> = {};
  for (const unit of state.units ?? []) {
    const s = unit.stats ?? {};
    stats[unit.id] = {
      atk: s.atk ?? 6,
      def: s.def ?? 4,
      spd: s.spd ?? unit.stats?.move ?? 4,
      rng: s.rng ?? unit.range ?? 1,
      hp: s.hp ?? s.maxHp ?? 10,
      traits: unit.traits ?? [],
    };
  }
  return stats;
}
