import { ID, WorldState } from './types';

export function computeFactionScores(world: WorldState, factionId: ID) {
  const faction = world.factions[factionId];
  if (!faction) return { power: 0, econ: 0, frontage: 0 };

  let power = 0;
  let econ = 0;
  let frontage = 0;

  for (const armyId of faction.armies) {
    const army = world.armies[armyId];
    if (army) power += army.strength;
  }

  for (const regionId of faction.regions) {
    const region = world.regions[regionId];
    if (!region) continue;
    econ += region.wealth;
    if (region.neighbors.some((id) => world.regions[id]?.ownerId !== faction.id)) {
      frontage += 1;
    }
  }

  return { power, econ, frontage };
}
