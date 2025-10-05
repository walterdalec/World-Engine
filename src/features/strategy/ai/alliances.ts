
import { getModifiedRelation } from './memory';
import { Alliance, ID, WorldState } from './types';

export function considerAlliances(world: WorldState) {
  world.alliances ??= {};
  const factions = Object.values(world.factions);
  for (const faction of factions) {
    for (const other of factions) {
      if (faction.id === other.id) continue;
      if (alreadyAllied(world, faction.id, other.id)) continue;
      const relation = getModifiedRelation(faction, other.id);
      if (relation <= 60) continue;
      const personality = faction.personality;
      if (personality.diplomacy > 60 || personality.honor > 65) {
        formAlliance(world, [faction.id, other.id]);
      }
    }
  }
}

function formAlliance(world: WorldState, members: ID[]) {
  const sorted = Array.from(new Set(members)).sort();
  const id = `ally_${sorted.join('_')}`;
  if (world.alliances && world.alliances[id]) return;
  world.alliances ??= {};
  world.alliances[id] = {
    id,
    name: `Pact of ${id.slice(-4)}`,
    members: sorted,
    startTurn: world.turn,
  } satisfies Alliance;
}

function alreadyAllied(world: WorldState, a: ID, b: ID) {
  return Object.values(world.alliances ?? {}).some((alliance) =>
    alliance.members.includes(a) && alliance.members.includes(b)
  );
}
