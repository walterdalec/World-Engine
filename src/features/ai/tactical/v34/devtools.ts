export function snapshotV34(brain: any) {
  return {
    scars: brain?.v34?.scars ?? [],
    escorts: brain?.v34?.escorts ?? [],
    shooters: brain?.v34?.shooters ?? [],
  };
}
