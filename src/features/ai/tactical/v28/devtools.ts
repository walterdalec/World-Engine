
export function snapshotV28(brain: any) {
  return {
    culture: brain.v28?.culture ?? 'unknown',
    playbook: brain.v28?.playbook?.name ?? 'none',
  };
}
