import type { LearningToggles } from '../difficulty/types';

export function updateLearningControlled(world: any, key: string, observed: { chosenPlan: string; advAt8: number; style: any }) {
  const config = world?.learnConfig as LearningToggles | undefined;
  if (!config?.enabled) return world?.learn;
  const learn = world.learn ?? { planBias: {}, styleEma: {}, updatedAtTurn: world.turn ?? 0, version: 'L1.0' };
  world.learn = learn;
  const alpha = config.alpha ?? 0.1;
  const style = learn.styleEma[key] ?? { flank: 0, volley: 0, push: 0, collapse: 0 };
  const obsStyle = observed?.style ?? { flank: 0, volley: 0, push: 0, collapse: 0 };
  learn.styleEma[key] = {
    flank: blend(style.flank, obsStyle.flank, alpha),
    volley: blend(style.volley, obsStyle.volley, alpha),
    push: blend(style.push, obsStyle.push, alpha),
    collapse: blend(style.collapse, obsStyle.collapse, alpha),
  };

  const change = clamp((observed.advAt8 ?? 0) * 3, -config.perBattleClamp, config.perBattleClamp);
  const bias = (learn.planBias[key] ??= {});
  const prev = bias[observed.chosenPlan] ?? 0;
  bias[observed.chosenPlan] = clamp(prev + change, -config.perSeasonClamp, config.perSeasonClamp);

  learn.updatedAtTurn = world.turn ?? 0;
  return learn;
}

function blend(base: number, sample: number, alpha: number) {
  return base * (1 - alpha) + (sample ?? 0) * alpha;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}
