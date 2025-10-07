
import type { Personality } from '../../../strategy/ai/types';

export interface BattleSummary {
  winnerFactionId: string;
  loserFactionId: string;
  killsByFaction: Record<string, number>;
  lossesByFaction: Record<string, number>;
  objectivesHeldByFaction: Record<string, number>;
  routs: string[];
  weather: { temperature: number; precipitation: number };
}

export interface CarryoverConfig {
  kAggression: number;
  kCaution: number;
  kHonor: number;
  kZeal: number;
  clampMin: number;
  clampMax: number;
  seasonalDecay: number;
}

export const DefaultCarry: CarryoverConfig = {
  kAggression: 0.8,
  kCaution: 0.6,
  kHonor: 0.4,
  kZeal: 0.3,
  clampMin: -3,
  clampMax: 3,
  seasonalDecay: 0.98,
};

function clampDelta(value: number, cfg: CarryoverConfig) {
  return Math.max(cfg.clampMin, Math.min(cfg.clampMax, value));
}

function computeAdvantage(summary: BattleSummary, factionId: string) {
  const kills = summary.killsByFaction[factionId] ?? 0;
  const losses = summary.lossesByFaction[factionId] ?? 0;
  const objs = summary.objectivesHeldByFaction[factionId] ?? 0;
  return (kills - losses) * 0.5 + objs * 2;
}

export function carryoverPersonality(personality: Personality, summary: BattleSummary, factionId: string, cfg: CarryoverConfig = DefaultCarry): Personality {
  const next: Personality = { ...personality };
  const adv = computeAdvantage(summary, factionId);
  const routed = summary.routs.includes(factionId);

  const dAgg = clampDelta((adv > 0 ? 1 : -0.5) * cfg.kAggression, cfg);
  const dCau = clampDelta((routed ? 2 : adv < 0 ? 1 : -0.5) * cfg.kCaution, cfg);
  const dHon = clampDelta((adv > 0 ? 0.5 : 0) * cfg.kHonor, cfg);
  const dZeal = clampDelta((summary.weather.precipitation > 70 ? 0.2 : 0) * cfg.kZeal, cfg);

  const bump = (key: keyof Personality, delta: number) => {
    const value = typeof next[key] === 'number' ? (next[key] as number) : 50;
    next[key] = Math.max(0, Math.min(100, value + delta));
  };

  bump('aggression', dAgg);
  bump('caution', dCau);
  bump('honor', dHon);
  bump('zeal', dZeal);
  return next;
}
