
import { WorldState } from './types';

function clamp(value: number) {
  return Math.min(100, Math.max(0, value));
}

export function evolvePersonalities(world: WorldState) {
  for (const faction of Object.values(world.factions)) {
    const memory = faction.memory;
    if (!memory) continue;
    const personality = faction.personality;
    if (!personality) continue;

    const totalGrievances = Object.values(memory.grievances).reduce((sum, value) => sum + value, 0);
    const totalGratitude = Object.values(memory.gratitude).reduce((sum, value) => sum + value, 0);

    if (totalGrievances > totalGratitude + 30) {
      personality.aggression = clamp(personality.aggression + 2);
    }
    if (totalGrievances > 100) {
      personality.zeal = clamp(personality.zeal + 1);
    }
    if (totalGratitude > totalGrievances + 30) {
      personality.diplomacy = clamp(personality.diplomacy + 2);
    }
    if (totalGratitude > 100) {
      personality.honor = clamp(personality.honor + 1);
    }

    const keys: Array<keyof typeof personality> = ['aggression', 'caution', 'diplomacy', 'greed', 'honor', 'zeal'];
    for (const key of keys) {
      const value = personality[key];
      if (value > 50) {
        personality[key] = clamp(value - 0.1);
      } else if (value < 50) {
        personality[key] = clamp(value + 0.1);
      }
    }
  }
}
