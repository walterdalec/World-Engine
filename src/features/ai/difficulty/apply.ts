import { DIFFICULTY_PRESETS } from './presets';
import type { DifficultyId, DifficultySpec } from './types';
import { applyRails } from '../tactical/v30/rails';

export function setDifficulty(world: any, id: DifficultyId | 'Custom', overrides?: Partial<DifficultySpec>) {
  if (!world) return undefined;
  const base = clonePreset(DIFFICULTY_PRESETS[id]);
  const spec: DifficultySpec = id === 'Custom' && overrides ? mergePreset(base, overrides) : base;

  if (world.battleState) {
    applyRails(world.battleState, {
      dmgMult: spec.rails.dmgMult,
      hpMult: spec.rails.hpMult,
      aiAgg: spec.rails.aiAgg,
      reinforceTurns: spec.rails.reinforceTurns,
    });
  }

  world.ai = world.ai ?? {};
  world.ai.intent = world.ai.intent ?? {};
  const baseRisk = world.ai.intent.riskTolerance ?? 50;
  world.ai.intent.riskTolerance = clamp(baseRisk + spec.commander.riskBias, 0, 100);

  world.ai.bt = world.ai.bt ?? {};
  world.ai.bt.timing = world.ai.bt.timing ?? {};
  world.ai.bt.cooldowns = world.ai.bt.cooldowns ?? {};
  world.ai.bt.deception = world.ai.bt.deception ?? {};
  world.ai.bt.timing.syncWindow = spec.commander.syncWindow;
  world.ai.bt.cooldowns.rallyBias = spec.commander.rallyCdBias;
  world.ai.bt.deception.feintChance = spec.commander.feintChance;

  world.learn = world.learn ?? { planBias: {}, styleEma: {}, updatedAtTurn: world.turn ?? 0, version: 'L1.0' };
  world.learnConfig = spec.learn;
  world.ai.explore = spec.learn.exploration;

  world.aiDifficulty = { current: spec, save: { id: spec.id, learnBlob: world.learn } };
  return spec;
}

function mergePreset(base: DifficultySpec, overrides: Partial<DifficultySpec>): DifficultySpec {
  return {
    ...base,
    ...overrides,
    rails: { ...base.rails, ...(overrides.rails ?? {}) },
    learn: { ...base.learn, ...(overrides.learn ?? {}) },
    commander: { ...base.commander, ...(overrides.commander ?? {}) },
  };
}

function clonePreset(spec: DifficultySpec): DifficultySpec {
  return mergePreset(structuredCloneSafe(spec), {});
}

function structuredCloneSafe<T>(value: T): T {
  if (typeof structuredClone === 'function') return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
