export function snapshotV24(brain: any) {
  return {
    feedback: brain.v24?.feedback,
    formation: brain.v24?.formation?.kind,
    dangerCells: Object.keys(brain.v24?.danger?.heat ?? {}).length,
  };
}
