
export function snapshotV25(brain: any) {
  return {
    formation: brain.v24?.formation?.kind,
    anchor: brain.v24?.formation?.anchor,
    facing: brain.v24?.formation?.facing,
    hotCells: Object.keys(brain.v24?.danger?.heat ?? {}).length,
  };
}
