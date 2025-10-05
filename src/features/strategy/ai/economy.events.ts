
import { WorldState } from './types';
import { rngInt, seedRng } from './rng';

export type EconomyEvent = 'Festival' | 'Famine' | 'Storms';

export function rollSeasonalEconomyEvents(world: WorldState) {
  const rand = seedRng(world.rngSeed + world.turn * 97);

  for (const region of Object.values(world.regions)) {
    const roll = rngInt(rand, 1, 100);
    if (roll <= 6) {
      applyFestival(region);
    } else if (roll <= 10) {
      applyFamine(region);
    } else if (roll <= 12) {
      applyStorms(region);
    }
  }
}

function applyFestival(region: any) {
  region.unrest = Math.max(0, region.unrest - 10);
  region.wealth = Math.min(100, region.wealth + 3);
}

function applyFamine(region: any) {
  region.unrest = Math.min(100, region.unrest + 8);
  region.wealth = Math.max(0, region.wealth - 5);
}

function applyStorms(region: any) {
  region.unrest = Math.min(100, region.unrest + 3);
}
