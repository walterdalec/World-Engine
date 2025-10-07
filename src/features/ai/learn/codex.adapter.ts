
import type { BattleSampleV1 } from './schema.v1';

export function toCodexRows(samples: BattleSampleV1[]) {
  return samples.map((sample) => ({
    turn: sample.turn,
    op: sample.opId ?? 'none',
    dec_used: Number(sample.deception?.used ?? false),
    dec_kind: sample.deception?.kind ?? 'none',
    delta_hp: (sample.deltas?.hpA ?? 0) - (sample.deltas?.hpB ?? 0),
    outcome: sample.outcome ?? 'n/a',
  }));
}
