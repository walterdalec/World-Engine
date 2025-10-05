import { AIContext, Faction, Region } from './types';
import { distanceRegions, neighborsOf } from './world';

export function chooseConquestTarget(
  ctx: AIContext,
  faction: Faction,
  fromRegionId: string
): Region | null {
  const { world } = ctx;
  const border: Region[] = [];

  for (const regionId of faction.regions) {
    for (const neighbor of neighborsOf(world, regionId)) {
      if (neighbor.ownerId && neighbor.ownerId !== faction.id) {
        border.push(neighbor);
      }
    }
  }

  if (!border.length) return null;

  let best: { region: Region; score: number } | null = null;
  const fromRegion = world.regions[fromRegionId];
  if (!fromRegion) return border[0] ?? null;

  for (const region of border) {
    const distance = distanceRegions(fromRegion, region) || 1;
    const score =
      region.wealth * 2 -
      region.fort * 10 +
      region.unrest * 0.5 -
      distance * 3;
    if (!best || score > best.score) {
      best = { region, score };
    }
  }

  return best?.region ?? null;
}
