import { ID, Region, WorldState } from './types';

export function neighborsOf(world: WorldState, regionId: ID): Region[] {
  const region = world.regions[regionId];
  if (!region) return [];
  return region.neighbors.map((id) => world.regions[id]).filter(Boolean);
}

export function isBorderRegion(world: WorldState, regionId: ID, factionId: ID) {
  return neighborsOf(world, regionId).some((n) => n.ownerId !== factionId);
}

export function distanceRegions(a: Region, b: Region) {
  const ax = a.center.q;
  const az = -a.center.q - a.center.r;
  const ay = a.center.r;
  const bx = b.center.q;
  const bz = -b.center.q - b.center.r;
  const by = b.center.r;
  return Math.max(Math.abs(ax - bx), Math.abs(ay - by), Math.abs(az - bz));
}

export function shortestPathRegions(
  world: WorldState,
  from: ID,
  to: ID,
  passable?: (regionId: ID) => boolean
): ID[] {
  if (from === to) return [from];
  const visited: Record<ID, ID | null> = { [from]: null };
  const queue: ID[] = [from];

  while (queue.length) {
    const current = queue.shift()!;
    const neighbors = world.regions[current]?.neighbors ?? [];
    for (const neighbor of neighbors) {
      if (passable && !passable(neighbor)) continue;
      if (visited[neighbor] !== undefined) continue;
      visited[neighbor] = current;
      if (neighbor === to) {
        const path: ID[] = [neighbor];
        let prev: ID | null = current;
        while (prev) {
          path.unshift(prev);
          prev = visited[prev] ?? null;
        }
        return path;
      }
      queue.push(neighbor);
    }
  }

  return [];
}
