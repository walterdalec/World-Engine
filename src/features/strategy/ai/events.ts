import { WorldState } from './types';

export function seasonalUnrestDecay(world: WorldState) {
  for (const region of Object.values(world.regions)) {
    if (region.unrest > 0) {
      region.unrest = Math.max(0, region.unrest - 5);
    }
  }
}
