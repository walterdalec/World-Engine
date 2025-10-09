
import { Faction, ID, _Memory, WorldState } from './types';

const TICKS_PER_SEASON = 12;

function ensureMemory(faction: Faction) {
  if (!faction.memory) {
    faction.memory = { grievances: {}, gratitude: {}, decayRate: 0.15 };
  }
  return faction.memory;
}

export function updateFactionMemory(world: WorldState) {
  for (const faction of Object.values(world.factions)) {
    const memory = ensureMemory(faction);
    const decay = memory.decayRate / TICKS_PER_SEASON;
    for (const key of Object.keys(memory.grievances)) {
      const next = Math.max(0, Math.floor(memory.grievances[key]! * (1 - decay)));
      if (next === 0) delete memory.grievances[key];
      else memory.grievances[key] = next;
    }
    for (const key of Object.keys(memory.gratitude)) {
      const next = Math.max(0, Math.floor(memory.gratitude[key]! * (1 - decay)));
      if (next === 0) delete memory.gratitude[key];
      else memory.gratitude[key] = next;
    }
  }
}

export function recordEvent(world: WorldState, actorId: ID, targetId: ID, kind: 'attack' | 'trade' | 'aid') {
  const faction = world.factions[actorId];
  if (!faction) return;
  const memory = ensureMemory(faction);
  switch (kind) {
    case 'attack':
      memory.grievances[targetId] = (memory.grievances[targetId] ?? 0) + 10;
      break;
    case 'trade':
    case 'aid':
      memory.gratitude[targetId] = (memory.gratitude[targetId] ?? 0) + 5;
      break;
    default:
      break;
  }
}

export function getModifiedRelation(faction: Faction, otherId: ID): number {
  const base = faction.relations[otherId] ?? 0;
  const memory = faction.memory;
  if (!memory) return base;
  const bonus = (memory.gratitude[otherId] ?? 0) - (memory.grievances[otherId] ?? 0);
  return base + bonus;
}
