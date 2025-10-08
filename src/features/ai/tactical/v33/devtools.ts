export function snapshotV33(brain: any) {
  const units = brain?.state?.units ?? [];
  const morale = units
    .filter((unit: any) => unit.team === 'A' || unit.faction === 'Player')
    .slice(0, 6)
    .map((unit: any) => ({ id: unit.id, value: unit.aiMorale?.value, status: unit.aiMorale?.status }));

  return {
    rallyLast: brain?.v33?.lastRally,
    escorts: brain?.v33?.escorts?.length ?? 0,
    morale,
  };
}
