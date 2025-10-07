export function snapshotV29(brain: any) {
  if (!brain?.v29) return { learned: false, obs: undefined };
  return {
    learned: Boolean(brain.v29.counters),
    obs: brain.v29.obs,
  };
}
