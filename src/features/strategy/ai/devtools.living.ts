
import { WorldState } from './types';

export function snapshotLivingWorld(world: WorldState) {
  const grievanceTotals = Object.values(world.factions).map((faction) => {
    const memory = faction.memory;
    if (!memory) return 0;
    return Object.values(memory.grievances).reduce((sum, value) => sum + value, 0);
  });

  const temperatures = world.weatherGrid ? Object.values(world.weatherGrid).map((cell) => cell.temperature) : [];

  return {
    avgGrievance: average(grievanceTotals),
    depots: Object.keys(world.depots ?? {}).length,
    activeConferences: Object.keys(world.conferences ?? {}).length,
    avgTemp: average(temperatures),
  };
}

function average(values: number[]) {
  if (!values.length) return 0;
  const total = values.reduce((sum, value) => sum + value, 0);
  return Math.round(total / values.length);
}
