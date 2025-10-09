export function aiLearnInspect(world: any, key?: string) {
  if (!world?.learn) return {};
  if (!key) return { keys: Object.keys(world.learn.planBias ?? {}) };
  return world.learn.planBias?.[key] ?? {};
}

export function aiLearnReset(world: any) {
  if (!world) return;
  world.learn = { planBias: {}, styleEma: {}, updatedAtTurn: world.turn ?? 0, version: 'L1.1' };
}
