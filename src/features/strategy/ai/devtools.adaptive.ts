
import { getFactionDescriptor } from './reputation';
import { WorldState } from './types';

export function snapshotAdaptive(world: WorldState) {
  const personalities = Object.values(world.factions).map((faction) => faction.personality);
  const alliances = Object.keys(world.alliances ?? {}).length;
  const descriptors = Object.values(world.factions).map((faction) => getFactionDescriptor(faction));
  const avgAggression = average(personalities.map((p) => p.aggression));
  return {
    avgAggression,
    alliances,
    topReputation: descriptors,
    newsCount: world.news?.length ?? 0,
  };
}

function average(values: number[]) {
  if (!values.length) return 0;
  const sum = values.reduce((acc, value) => acc + value, 0);
  return Math.round(sum / values.length);
}
