
import { Frontline, ID, WorldState } from './types';

export function computeFrontlines(world: WorldState) {
  const seen = new Set<string>();
  const lines: Frontline[] = [];

  for (const region of Object.values(world.regions)) {
    if (!region.ownerId) continue;

    for (const neighborId of region.neighbors) {
      const neighbor = world.regions[neighborId];
      if (!neighbor || !neighbor.ownerId) continue;
      if (neighbor.ownerId === region.ownerId) continue;

      const pairKey = [region.ownerId, neighbor.ownerId].sort().join('|');
      const edgeKey = `${pairKey}:${[region.id, neighbor.id].sort().join('-')}`;
      if (seen.has(edgeKey)) continue;
      seen.add(edgeKey);

      const belt = growBelt(world, region.id, neighbor.id, region.ownerId, neighbor.ownerId);
      if (!belt.length) continue;

      const pressure = belt.reduce((sum, rid) => {
        const r = world.regions[rid];
        return sum + (r.wealth + r.fort * 10);
      }, 0);
      const avgPressure = pressure / belt.length || 0;

      lines.push({
        id: `fl_${lines.length}`,
        regions: belt,
        a: region.ownerId,
        b: neighbor.ownerId,
        pressureA: avgPressure,
        pressureB: avgPressure,
      });
    }
  }

  world.frontlines = mergeFrontlines(lines);
}

function growBelt(world: WorldState, regionA: ID, regionB: ID, ownerA: ID, ownerB: ID) {
  const belt = new Set<ID>();
  const queue: ID[] = [regionA, regionB];

  while (queue.length) {
    const current = queue.shift()!;
    if (belt.has(current)) continue;
    belt.add(current);

    for (const neighborId of world.regions[current].neighbors) {
      const neighbor = world.regions[neighborId];
      if (!neighbor || !neighbor.ownerId) continue;
      if (neighbor.ownerId === ownerA || neighbor.ownerId === ownerB) {
        if (!belt.has(neighborId)) {
          queue.push(neighborId);
        }
      }
    }
  }

  return Array.from(belt);
}

function mergeFrontlines(lines: Frontline[]): Frontline[] {
  const map = new Map<string, Frontline>();

  for (const line of lines) {
    const key = [line.a, line.b].sort().join('|');
    const existing = map.get(key);
    if (!existing) {
      map.set(key, { ...line });
    } else {
      existing.regions = Array.from(new Set([...existing.regions, ...line.regions]));
      existing.pressureA = Math.max(existing.pressureA, line.pressureA);
      existing.pressureB = Math.max(existing.pressureB, line.pressureB);
    }
  }

  return Array.from(map.values());
}
