
export function snapshotV27(brain: any) {
  return {
    psyche: brain.v27?.psyche,
    thresholds: brain.v27?.thresholds,
    scenario: brain.v26?.scenario ?? 'None',
  };
}
