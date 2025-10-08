export function snapshotV35(brain: any) {
  return {
    phase: brain?.v35?.blackboard?.phase,
    primary: brain?.v35?.blackboard?.primaryLane,
    secondary: brain?.v35?.blackboard?.secondaryLane,
    lastPick: brain?.v35?.blackboard?.lastPick,
  };
}
