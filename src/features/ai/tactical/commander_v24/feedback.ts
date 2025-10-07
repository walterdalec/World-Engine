
export interface FeedbackWeights {
  focus: number;
  advance: number;
  hold: number;
  flank: number;
  fallback: number;
  rally: number;
}

export function createFeedback(): FeedbackWeights {
  return { focus: 0, advance: 0, hold: 0, flank: 0, fallback: 0, rally: 0 };
}

export function clampWeights(weights: FeedbackWeights) {
  const clamp = (value: number) => Math.max(-20, Math.min(20, value));
  weights.focus = clamp(weights.focus);
  weights.advance = clamp(weights.advance);
  weights.hold = clamp(weights.hold);
  weights.flank = clamp(weights.flank);
  weights.fallback = clamp(weights.fallback);
  weights.rally = clamp(weights.rally);
}

export function applyOutcomeFeedback(weights: FeedbackWeights, delta: { dmgFor: number; dmgAgainst: number; objProgress: number }) {
  const swing = delta.dmgFor - delta.dmgAgainst + delta.objProgress * 5;
  if (swing > 0) {
    weights.focus += 0.5;
    weights.advance += 0.4;
    weights.flank += 0.3;
  } else if (swing < 0) {
    weights.fallback += 0.6;
    weights.hold += 0.3;
    weights.rally += 0.4;
  }
  clampWeights(weights);
}

export function weightScore(name: string, base: number, weights: FeedbackWeights) {
  const map: Record<string, number> = {
    FocusFire: weights.focus,
    AdvanceLine: weights.advance,
    Hold: weights.hold,
    Flank: weights.flank,
    Fallback: weights.fallback,
    Rally: weights.rally,
  };
  return base + (map[name] ?? 0);
}
