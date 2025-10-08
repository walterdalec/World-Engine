export function snapshotV32(brain: any) {
  return {
    split: brain?.v32?.split,
    tasks: brain?.v32?.tasks?.map((t: any) => t.kind) ?? [],
    assignments: Object.keys(brain?.v32?.taskAssign ?? {}).length,
    buckets: Object.keys(brain?.v32?.buckets ?? {}).length,
  };
}
