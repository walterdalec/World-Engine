export interface AutoCoeffs {
  kAtk: number;
  kDef: number;
  kRange: number;
  kFocus: number;
  rounds: number;
}

export interface TacticalOutcomeSnapshot {
  dmgA: number;
  dmgB: number;
  rounds: number;
}

export function calibrateCoeffs(prev: AutoCoeffs, outcome: TacticalOutcomeSnapshot): AutoCoeffs {
  const targetRounds = Math.min(12, Math.max(6, outcome.rounds || prev.rounds));
  const paceAdj = targetRounds / Math.max(1, prev.rounds);
  return {
    ...prev,
    rounds: Math.round(prev.rounds * 0.9 + targetRounds * 0.1),
    kAtk: prev.kAtk * paceAdj,
    kDef: prev.kDef / paceAdj,
  };
}

export interface EMA {
  value: number;
  alpha: number;
}

export function ema(prev: EMA, sample: number): EMA {
  return {
    value: prev.value + prev.alpha * (sample - prev.value),
    alpha: prev.alpha,
  };
}
