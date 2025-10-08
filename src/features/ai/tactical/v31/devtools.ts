export function snapshotV31(brain: any) {
  return {
    primary: brain?.v30?.primary,
    blockedEdges: brain?.v31?.siege?.blockedEdges?.size ?? 0,
    blockedCells: brain?.v31?.siege?.blockedCells?.size ?? 0,
    coeffs: brain?.v31?.coeffs,
  };
}
