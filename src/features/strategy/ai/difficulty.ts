import { Difficulty, WorldState } from './types';

const NORMAL_DIFFICULTY: Difficulty = {
  aiIncomeMult: 1,
  aiAggressionBias: 0,
  aiAttritionMitigation: 0,
};

export function getDifficulty(world: WorldState): Difficulty {
  return world.difficulty ?? NORMAL_DIFFICULTY;
}
