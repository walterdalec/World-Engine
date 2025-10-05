
import { WorldState } from './types';

export function frontlineRecruitmentBias(world: WorldState) {
  if (!world.frontlines) return;
  for (const frontline of world.frontlines) {
    for (const regionId of frontline.regions) {
      const region = world.regions[regionId];
      if (!region || region.biome !== 'Settlement') continue;
      if (!region.ownerId) continue;
      if (!region.garrison) continue;
      region.garrison.strength = Math.round(region.garrison.strength * 1.05);
    }
  }
}

export function applyFortUpkeep(world: WorldState) {
  for (const faction of Object.values(world.factions)) {
    let fortCost = 0;
    for (const regionId of faction.regions) {
      const region = world.regions[regionId];
      if (!region) continue;
      fortCost += region.fort * 8;
    }
    faction.treasury -= fortCost;
  }
}
