
import type { Personality } from '../../../strategy/ai/types';

export interface PsycheMultipliers {
  riskBias: number;
  fallbackBias: number;
  focusBias: number;
  flankBias: number;
  holdBias: number;
}

const clamp = (value: number) => Math.max(0.8, Math.min(1.2, value));
const norm = (value: number) => (value - 50) / 50;

export function derivePsyche(personality?: Personality): PsycheMultipliers {
  const p: Personality = personality ?? {
    aggression: 50,
    caution: 50,
    diplomacy: 50,
    greed: 50,
    honor: 50,
    zeal: 50,
  };
  return {
    riskBias: clamp(1 + 0.2 * norm(p.aggression) - 0.1 * norm(p.caution)),
    fallbackBias: clamp(1 - 0.1 * norm(p.honor) + 0.15 * norm(p.caution)),
    focusBias: clamp(1 + 0.15 * norm(p.zeal) + 0.1 * norm(p.greed)),
    flankBias: clamp(1 + 0.15 * norm(p.aggression) + 0.1 * norm(p.diplomacy)),
    holdBias: clamp(1 + 0.15 * norm(p.honor) - 0.1 * norm(p.aggression)),
  };
}
