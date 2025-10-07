export function snapshotV30(brain: any) {
  const lanes = brain?.v30?.lanes ?? [];
  const primary = brain?.v30?.primary;
  const lane = lanes.find((l: any) => l?.id === primary);
  return {
    lane: primary,
    fieldCells: Object.keys(brain?.v30?.field?.grid ?? {}).length,
    goals: lane?.goals ?? [],
  };
}
