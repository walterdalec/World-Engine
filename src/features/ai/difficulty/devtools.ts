export function aidiff(world: any) {
  return {
    id: world?.aiDifficulty?.current?.id,
    rails: world?.aiDifficulty?.current?.rails,
    learn: world?.learnConfig,
    learnedKeys: Object.keys(world?.learn?.planBias ?? {}),
  };
}

export function resetLearning(world: any) {
  if (!world) return;
  world.learn = { planBias: {}, styleEma: {}, updatedAtTurn: world.turn ?? 0, version: 'L1.0' };
}
