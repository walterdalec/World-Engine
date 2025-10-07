
import type { PsycheMultipliers } from './psyche';

export interface Thresholds {
  fallback: number;
  rally: number;
  advance: number;
  rotate: number;
}

export function makeThresholds(base: Thresholds, psyche: PsycheMultipliers): Thresholds {
  return {
    fallback: Math.round(base.fallback * psyche.fallbackBias),
    rally: Math.round(base.rally * (2 - psyche.riskBias)),
    advance: Math.round(base.advance * (2 - psyche.holdBias)),
    rotate: Math.round(base.rotate * psyche.flankBias),
  };
}
