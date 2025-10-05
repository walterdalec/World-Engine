
import { rngInt, seedRng } from './rng';
import { Army, WeatherCell, WorldState } from './types';

export function rollWeatherGrid(world: WorldState) {
  const rand = seedRng(world.rngSeed + world.turn * 31);
  const grid: Record<string, WeatherCell> = {};
  for (const region of Object.values(world.regions)) {
    const temperature = rngInt(rand, -10, 35);
    const precipitation = rngInt(rand, 0, 100);
    const wind = rngInt(rand, 0, 50);
    grid[region.id] = { temperature, precipitation, wind };
  }
  world.weatherGrid = grid;
}

export function applyWeatherModifiers(world: WorldState) {
  if (!world.weatherGrid) return;
  for (const army of Object.values(world.armies)) {
    const weather = world.weatherGrid[army.locationRegionId];
    if (!weather) continue;
    adjustMarchSpeed(army, weather);
    if (weather.temperature < 0) {
      army.supplies = Math.max(0, army.supplies - 2);
    }
    if (weather.temperature > 30) {
      army.morale = Math.max(0, army.morale - 2);
    }
  }
}

function adjustMarchSpeed(army: Army, weather: WeatherCell) {
  const currentSpeed = army.marchSpeed ?? 0;
  if (currentSpeed <= 0) return;
  let speed = currentSpeed;
  if (weather.precipitation > 70) {
    speed = Math.max(1, Math.round(speed * 0.8));
  }
  if (weather.wind > 40) {
    speed = Math.max(1, speed - 1);
  }
  army.marchSpeed = speed;
}
