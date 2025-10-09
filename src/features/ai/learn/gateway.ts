import { makeScenarioKey, extractScenario } from './scenario';
import { updateLearningControlled } from './update';
import { softmaxPick } from './bandit';

export function scenarioKeyFromState(state: any): string {
  return makeScenarioKey(extractScenario(state));
}

export function choosePlanWithBandit(scores: Record<string, number>, ctx: any): string {
  const arms = Object.keys(scores).map(name => ({ name, base: scores[name] }));
  if (!arms.length) return '';
  const cfg = ctx.world?.learnConfig ?? {};
  const seed = ((ctx.seed ?? 0) ^ (ctx.time ?? 0)) >>> 0;
  const tau = Math.max(0.4, (cfg.tau ?? 1.0) || 1.0);
  return softmaxPick(arms, seed, { tau, explore: cfg.exploration ?? 0 });
}

export function learnFromTelemetry(world: any, state: any, telemetry: any) {
  if (!world || !telemetry) return;
  const key = telemetry.key ?? scenarioKeyFromState(state);
  const midpoint = telemetry.plans?.[Math.floor((telemetry.plans.length || 1) / 2)] ?? {};
  updateLearningControlled(world, key, {
    chosenPlan: midpoint.plan ?? 'HoldLine',
    advAt8: midpoint.advantage ?? 0,
    style: telemetry.style ?? { flank: 0, volley: 0, push: 0, collapse: 0 },
  });
}
