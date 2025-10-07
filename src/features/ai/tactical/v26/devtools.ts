
export function snapshotV26(brain: any) {
  return {
    scenario: brain.v26?.scenario ?? 'None',
    cells: Object.keys(brain.v26?.d2?.heat ?? {}).length,
  };
}
