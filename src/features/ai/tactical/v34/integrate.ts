import { applyMoraleTraits, tickScars, type MoraleScar } from './morale.traits';
import { moralePulseFromStandards } from './standard';
import { formEscortFormation, tickEscortV2, type EscortFormation } from './escort.v2';
import { assignPriorityTargets, manageHeat, type ShooterState } from './suppression.v2';
import type { Hex } from '../v30/field';

export interface V34Runtime {
  scars: MoraleScar[];
  escorts: EscortFormation[];
  shooters: ShooterState[];
}

export function attachV34(brain: any, world: any | undefined, state: any): void {
  if (!brain) return;
  const scars: MoraleScar[] = (world?.moraleScars ?? []).map((scar: any) => ({ ...scar }));
  const runtime: V34Runtime = {
    scars,
    escorts: [],
    shooters: [],
  };
  for (const unit of state.units ?? []) {
    if (!unit?.aiMorale) continue;
    const traits = (unit.traits ?? []).filter((trait: any) =>
      trait && ['Fear', 'Discipline', 'Inspiration'].includes(trait.kind),
    );
    unit.aiMorale.value = applyMoraleTraits(unit.aiMorale.value ?? 60, traits, runtime.scars);
  }
  brain.v34 = runtime;
}

export function v34Tick(brain: any, world: any | undefined, state: any): void {
  if (!brain?.v34) return;
  const runtime: V34Runtime = brain.v34;
  runtime.scars = tickScars(runtime.scars);
  moralePulseFromStandards(state);

  if (!runtime.escorts.length && brain.v32?.tasks?.length) {
    const pool = (state.units ?? []).map((unit: any) => ({
      id: unit.id,
      role: unit.role ?? inferRole(unit),
      pos: unit.pos ?? { q: 0, r: 0 },
    }));
    for (const task of brain.v32.tasks) {
      const formation = formEscortFormation(task, pool, state.anchorA ?? { q: 0, r: 0 });
      if (formation) runtime.escorts.push(formation);
    }
  }
  runtime.escorts = runtime.escorts.map((formation) =>
    tickEscortV2(formation, { unitById: indexById(state.units ?? []), terrain: state.terrain }),
  );

  const threats = (state.units ?? []).filter((unit: any) => unit.team === 'B' || unit.faction === 'Enemy');
  runtime.shooters = assignPriorityTargets(runtime.shooters, threats);
  manageHeat(runtime.shooters);
}

export function snapshotV34(brain: any) {
  return {
    scars: brain?.v34?.scars?.length ?? 0,
    escorts: brain?.v34?.escorts?.length ?? 0,
    shooters: brain?.v34?.shooters?.length ?? 0,
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
