
import type { DangerMap } from '../commander_v24/memory';

export function pruneDanger(map: DangerMap, threshold = 0.1) {
  for (const key of Object.keys(map.heat)) {
    if (map.heat[key] < threshold) delete map.heat[key];
  }
}

export function shouldRecluster(nowMs: number, lastMs: number, intervalMs = 800) {
  return nowMs - lastMs >= intervalMs;
}
