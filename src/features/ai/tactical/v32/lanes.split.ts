import type { Lane } from '../v30/lanes';
import { scoreHex } from '../v30/field';
import { seedRng } from '../util/seed';

export interface SplitPlan {
  primary: Lane['id'];
  secondary?: Lane['id'];
  ratio: number;
  regroupAt: number;
}

export function computeSplitPlan(
  seed: number,
  lanes: Lane[],
  field: any,
  commanderRisk: number,
): SplitPlan {
  const rng = seedRng(seed);
  const scored = lanes.map((lane) => ({
    id: lane.id,
    score: laneScore(field, lane),
  }));
  scored.sort((a, b) => b.score - a.score);

  const primary = scored[0]?.id ?? 'Center';
  const second = scored[1];

  const secondViable =
    Boolean(second) && second.score >= (scored[0]?.score ?? 0) - 1.5;
  const allowSplit = commanderRisk > 60 && secondViable && rng() < 0.4;
  const secondary = allowSplit ? second?.id : undefined;

  const ratio = secondary ? (rng() < 0.5 ? 0.7 : 0.6) : 1.0;
  const regroupAt = Math.round(6 + (80 - commanderRisk) / 10 + rng() * 2);

  return { primary, secondary, ratio, regroupAt };
}

function laneScore(field: any, lane: Lane): number {
  const last = lane.goals.at(-1) ?? lane.goals.at(0);
  if (!last) return 0;
  const { danger, pull } = scoreHex(field, last);
  return pull - danger;
}
