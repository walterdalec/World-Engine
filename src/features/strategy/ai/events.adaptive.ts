
import { rngBool } from './rng';
import { WorldState } from './types';

export function emotionalEvents(world: WorldState) {
  const rand = world._adaptiveRand ?? Math.random;
  for (const faction of Object.values(world.factions)) {
    const personality = faction.personality;
    if (!personality) continue;
    if (personality.aggression > 80 && rngBool(rand, 0.05)) {
      announce(world, `${faction.name} declares a crusade!`);
    }
    if (personality.diplomacy > 80 && rngBool(rand, 0.05)) {
      announce(world, `${faction.name} calls for a global peace conference.`);
    }
  }
}

function announce(world: WorldState, text: string) {
  world.news ??= [];
  world.news.push({ turn: world.turn, text });
}
