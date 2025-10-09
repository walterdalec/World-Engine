
import { Faction, ID as _ID, ReputationTag, WorldState } from './types';

export function updateReputation(world: WorldState) {
  for (const faction of Object.values(world.factions)) {
    faction.reputation = (faction.reputation ?? []).filter((tag) => tag.decay > 0);
    for (const tag of faction.reputation) {
      tag.decay -= 1;
    }

    const personality = faction.personality;
    if (!personality) continue;

    if (personality.aggression > 75) addTag(faction, 'Warmonger');
    if (personality.diplomacy > 75) addTag(faction, 'Peacemaker');
    if (personality.greed > 70) addTag(faction, 'Merchant');
    if (personality.honor > 70) addTag(faction, 'Protector');
    if (personality.zeal > 80) addTag(faction, 'Zealot');
  }
}

function addTag(faction: Faction, kind: ReputationTag['kind']) {
  faction.reputation ??= [];
  const existing = faction.reputation.find((tag) => tag.kind === kind);
  if (existing) {
    existing.stacks = Math.min(existing.stacks + 1, 5);
    existing.decay = Math.max(existing.decay, 12);
  } else {
    faction.reputation.push({
      id: `tag_${kind}_${Date.now()}`,
      kind,
      stacks: 1,
      decay: 12,
    });
  }
}

export function getFactionDescriptor(faction: Faction): string {
  if (!faction.reputation || faction.reputation.length === 0) return 'Neutral';
  const sorted = [...faction.reputation].sort((a, b) => b.stacks - a.stacks);
  return sorted[0]?.kind ?? 'Neutral';
}
