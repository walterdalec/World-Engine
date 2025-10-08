export type Plan =
  | 'HoldLine'
  | 'AdvancePrimary'
  | 'AdvanceSecondary'
  | 'Flank'
  | 'FocusFire'
  | 'Rotate'
  | 'RefuseHot'
  | 'Fallback'
  | 'Rally'
  | 'Breach';

export interface ScoreInputs {
  stance: 'Aggressive' | 'Defensive' | 'Opportunistic';
  risk: number;
  moraleAvg: number;
  dangerLeft: number;
  dangerCenter: number;
  dangerRight: number;
  advantage: number;
  playbook?: any;
  psyche?: any;
  counters?: any;
  scenario?: any;
}

export function scorePlans(inputs: ScoreInputs): Record<Plan, number> {
  const scores: Record<Plan, number> = {
    HoldLine: 10,
    AdvancePrimary: 0,
    AdvanceSecondary: 0,
    Flank: 0,
    FocusFire: 5,
    Rotate: 3,
    RefuseHot: 3,
    Fallback: 0,
    Rally: 0,
    Breach: 0,
  };

  const hottest = Math.max(inputs.dangerLeft, inputs.dangerCenter, inputs.dangerRight);

  scores.AdvancePrimary += (inputs.stance === 'Aggressive' ? 6 : inputs.stance === 'Opportunistic' ? 4 : 2) + inputs.risk * 0.05;
  scores.Flank += (inputs.stance !== 'Defensive' ? 4 : 1) + Math.max(0, 6 - hottest);
  scores.Fallback += (inputs.stance === 'Defensive' ? 5 : 2) + Math.max(0, hottest - 6) * 2 - inputs.risk * 0.05;
  scores.Rotate += Math.max(0, hottest - 5) * 1.5;
  scores.RefuseHot += Math.max(0, hottest - 5) * 1.2;
  scores.Rally += inputs.moraleAvg < 40 ? 8 : inputs.moraleAvg < 55 ? 3 : 0;
  scores.Breach += (inputs.scenario?.Siege ? 6 : 0) + Math.max(0, inputs.advantage) * 2;

  const playbookWeights = inputs.playbook?.orderWeights ?? {};
  for (const key of Object.keys(playbookWeights)) {
    if (scores[key as Plan] != null) scores[key as Plan] += playbookWeights[key];
  }

  const counterOrders = inputs.counters?.orders ?? {};
  for (const key of Object.keys(counterOrders)) {
    if (scores[key as Plan] != null) scores[key as Plan] += counterOrders[key];
  }

  if (inputs.psyche) {
    const psyche = inputs.psyche;
    if (psyche.riskBias != null) scores.AdvancePrimary *= psyche.riskBias;
    if (psyche.fallbackBias != null) scores.Fallback *= psyche.fallbackBias;
    if (psyche.flankBias != null) scores.Flank *= psyche.flankBias;
    if (psyche.holdBias != null) scores.HoldLine *= psyche.holdBias;
  }

  return scores;
}
