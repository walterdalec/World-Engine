
import { updateFactionMemory } from './memory';
import { recomputeDepotRadius, applySupplyAttrition } from './logistics';
import { rollWeatherGrid, applyWeatherModifiers } from './weather';
import { maybeStartPeaceConference, runPeaceConferences } from './peace.conference';
import { evolvePersonalities } from './personality';
import { updateReputation } from './reputation';
import { considerAlliances } from './alliances';
import { emotionalEvents } from './events.adaptive';
import { WorldState } from './types';

const envFlag =
  typeof process !== 'undefined' &&
  typeof process.env !== 'undefined' &&
  process.env.LIVING_WORLD_ENABLED === 'true';

export const LIVING_WORLD_ENABLED = envFlag;

export function livingWorldActive(world: WorldState) {
  return world.livingWorldEnabled ?? LIVING_WORLD_ENABLED;
}

export function simulateLivingTick(world: WorldState) {
  updateFactionMemory(world);
  recomputeDepotRadius(world);
  applySupplyAttrition(world);
  rollWeatherGrid(world);
  applyWeatherModifiers(world);
  maybeStartPeaceConference(world);
  runPeaceConferences(world);
  simulateAdaptiveTick(world);
}

export function simulateAdaptiveTick(world: WorldState) {
  evolvePersonalities(world);
  updateReputation(world);
  considerAlliances(world);
  emotionalEvents(world);
}
