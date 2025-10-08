export interface PairKey {
  a: string;
  b: string;
}

export interface Coeffs {
  kAtk: number;
  kDef: number;
  kRange: number;
  kFocus: number;
  rounds: number;
}

export interface Bucket {
  coeffs: Coeffs;
  ema: number;
  alpha: number;
}

export function pairKey(a: string, b: string): string {
  return [a ?? 'unknown', b ?? 'unknown'].sort().join('|');
}

export function initBucket(alpha = 0.08): Bucket {
  return {
    coeffs: { kAtk: 1, kDef: 1, kRange: 0.1, kFocus: 0.05, rounds: 8 },
    ema: 0,
    alpha,
  };
}

export function updateBucket(bucket: Bucket, tactical: { dmgA: number; dmgB: number; rounds: number }): Bucket {
  const pace = Math.min(12, Math.max(6, tactical.rounds || bucket.coeffs.rounds));
  bucket.coeffs.rounds = Math.round(bucket.coeffs.rounds * (1 - bucket.alpha) + pace * bucket.alpha);
  const ratio = (tactical.dmgA + 1) / (tactical.dmgB + 1);
  const tilt = Math.max(0.8, Math.min(1.25, ratio));
  const adjust = Math.pow(tilt, 0.25);
  bucket.coeffs.kAtk *= adjust;
  bucket.coeffs.kDef /= adjust;
  bucket.ema = bucket.ema * (1 - bucket.alpha) + ratio * bucket.alpha;
  return bucket;
}
