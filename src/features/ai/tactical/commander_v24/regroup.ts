import { createFormation, Formation } from './formations';
import type { DangerMap } from './memory';
import { dangerAt } from './memory';

export function chooseRegroupAnchor(map: DangerMap, candidates: { q: number; r: number }[]): { q: number; r: number } {
  let best = candidates[0];
  let bestDanger = dangerAt(map, best);
  for (const candidate of candidates) {
    const danger = dangerAt(map, candidate);
    if (danger < bestDanger) {
      best = candidate;
      bestDanger = danger;
    }
  }
  return best;
}

export function computeFallbackLine(map: DangerMap, from: { q: number; r: number }, facing: 0 | 1 | 2 | 3 | 4 | 5): Formation {
  const opposite = ((facing + 3) % 6) as 0 | 1 | 2 | 3 | 4 | 5;
  const candidates = [
    { q: from.q - 1, r: from.r },
    { q: from.q - 2, r: from.r },
  ];
  const anchor = chooseRegroupAnchor(map, candidates);
  return createFormation('Line', anchor, opposite);
}
