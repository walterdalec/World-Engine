
import { Army, ID, WorldState } from './types';
import { shortestPathRegions } from './world';

export function recomputeDepotRadius(world: WorldState) {
  for (const faction of Object.values(world.factions)) {
    faction.supplyRadius = 3;
  }
  if (!world.depots) return;
  for (const depot of Object.values(world.depots)) {
    const owner = world.factions[depot.factionId];
    if (!owner) continue;
    const bonus = 3 + Math.floor(depot.capacity / 50);
    owner.supplyRadius = Math.max(owner.supplyRadius ?? 3, bonus);
  }
}

export function applySupplyAttrition(world: WorldState) {
  if (!world.depots || Object.keys(world.depots).length === 0) return;
  for (const army of Object.values(world.armies)) {
    const faction = world.factions[army.factionId];
    if (!faction) continue;
    const radius = faction.supplyRadius ?? 3;
    if (!withinDepotRange(world, army, radius)) {
      army.supplies = Math.max(0, army.supplies - 5);
    }
  }
}

function withinDepotRange(world: WorldState, army: Army, radius: number) {
  if (!world.depots) return false;
  for (const depot of Object.values(world.depots)) {
    if (depot.factionId !== army.factionId) continue;
    const path = shortestPathRegions(world, depot.regionId, army.locationRegionId);
    if (path.length && path.length - 1 <= radius) {
      return true;
    }
  }
  return false;
}
