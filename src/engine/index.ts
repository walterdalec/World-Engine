/**
 * World Engine - Core Game State Management
 * 
 * Manages the canonical game state including:
 * - World generation and streaming
 * - Party position and movement
 * - Time and weather systems
 * - Discovery and fog of war
 * - Save/load functionality
 */

import { ChunkManager, Tile, WorldGenConfig, CHUNK_SIZE } from '../proc/chunks';
import { SeededRandom, WorldNoise, ValueNoise2D } from '../proc/noise';
import { ChokepointManager, Chokepoint, Fortification, RegionData } from '../proc/chokepoints';

export { ChunkManager, CHUNK_SIZE } from '../proc/chunks';
export { SeededRandom, WorldNoise, ValueNoise2D } from '../proc/noise';
export { ChokepointManager } from '../proc/chokepoints';
export type { Tile, WorldGenConfig } from '../proc/chunks';
export type { Chokepoint, Fortification, RegionData } from '../proc/chokepoints';

export interface Party {
  x: number;
  y: number;
  members: string[]; // Character IDs
  supplies: {
    food: number;
    water: number;
    gold: number;
  };
  equipment: string[];
  speed: number; // Base movement speed
}

export interface GameTime {
  minutes: number;
  day: number;
  season: 'Spring' | 'Summer' | 'Autumn' | 'Winter';
  year: number;
}

export interface Weather {
  type: 'Clear' | 'Rain' | 'Snow' | 'Fog' | 'Wind' | 'Storm';
  intensity: number; // 0-1
  duration: number; // minutes remaining
  visibility: number; // 0-1, affects fog of war
  movementModifier: number; // multiplier for movement speed
}

export interface EncounterClock {
  riskLevel: number; // 0-1, rises with travel, falls with rest
  lastEncounter: number; // time in minutes
  encounterChance: number; // base chance per movement
}

export interface EngineConfig {
  world: WorldGenConfig;
  gameplay: {
    movementCostPerTile: number; // minutes
    encounterBaseChance: number;
    weatherChangeDays: number;
    fogOfWarRadius: number;
    chunkLoadRadius: number;
    chunkUnloadRadius: number;
  };
}

export interface GameState {
  seed: string;
  party: Party;
  time: GameTime;
  weather: Weather;
  encounterClock: EncounterClock;
  discovered: Set<string>; // "x,y" coordinates
  config: EngineConfig;
  version: string;
}

export class WorldEngine {
  private chunkManager: ChunkManager;
  private chokepointManager: ChokepointManager | null = null; // Temporarily nullable for debugging
  private rng: SeededRandom;
  public state: GameState;
  
  constructor(seed?: string, config?: Partial<EngineConfig>) {
    const actualSeed = seed || this.generateSeed();
    this.rng = new SeededRandom(`${actualSeed}_engine`);
    
    const defaultConfig: EngineConfig = {
      world: {
        seaLevel: 0.0, // Almost no ocean, everything should be land
        continentFreq: 1/1024,
        featureFreq: 1/128,
        warpStrength: 700,
        mapWidth: 2048,
        mapHeight: 2048
      },
      gameplay: {
        movementCostPerTile: 15, // 15 minutes per tile
        encounterBaseChance: 0.05,
        weatherChangeDays: 3,
        fogOfWarRadius: 8,
        chunkLoadRadius: 32, // Much smaller radius for performance
        chunkUnloadRadius: 64
      }
    };
    
    const mergedConfig: EngineConfig = {
      world: { ...defaultConfig.world, ...config?.world },
      gameplay: { ...defaultConfig.gameplay, ...config?.gameplay }
    };
    
    this.chunkManager = new ChunkManager(actualSeed, mergedConfig.world);
    
    // Initialize chokepoint manager with error handling
    try {
      console.log('Initializing chokepoint system...');
      this.chokepointManager = new ChokepointManager(
        actualSeed,
        mergedConfig.world.mapWidth,
        mergedConfig.world.mapHeight,
        mergedConfig.world.mapWidth / 2,
        mergedConfig.world.mapHeight / 2
      );
      console.log('Chokepoint system initialized successfully');
    } catch (error) {
      console.error('Failed to initialize chokepoint system:', error);
      this.chokepointManager = null;
    }
    
    // Find a suitable spawn location on land
    const spawnLocation = this.findLandSpawnLocation(mergedConfig.world.mapWidth, mergedConfig.world.mapHeight, mergedConfig.world.seaLevel);
    
    // Double-check spawn tile and force boat if needed
    const spawnTile = this.chunkManager.getTile(spawnLocation.x, spawnLocation.y);
    const actuallyNeedsBoat = !spawnTile || spawnTile.biome === 'Ocean';
    
    console.log('Final spawn location:', spawnLocation.x, spawnLocation.y);
    console.log('Spawn tile biome:', spawnTile?.biome || 'null');
    console.log('Needs boat:', actuallyNeedsBoat || spawnLocation.needsBoat);
    
    this.state = {
      seed: actualSeed,
      party: {
        x: spawnLocation.x,
        y: spawnLocation.y,
        members: [],
        supplies: { food: 100, water: 100, gold: 50 },
        equipment: (actuallyNeedsBoat || spawnLocation.needsBoat) ? ['boat'] : [], // Give boat if spawned in/near water
        speed: 1.0
      },
      time: {
        minutes: 480, // 8 AM
        day: 1,
        season: 'Spring',
        year: 1
      },
      weather: this.generateWeather(spawnLocation.x, spawnLocation.y, actualSeed, 1),
      encounterClock: {
        riskLevel: 0,
        lastEncounter: 0,
        encounterChance: mergedConfig.gameplay.encounterBaseChance
      },
      discovered: new Set(),
      config: mergedConfig,
      version: '1.0.0'
    };
    
    // Discover initial area around party
    this.discoverRadius(this.state.party.x, this.state.party.y, 3);
  }
  
  /**
   * Find a suitable land spawn location
   */
  private findLandSpawnLocation(mapWidth: number, mapHeight: number, seaLevel: number): { x: number; y: number; needsBoat: boolean } {
    console.log('Finding suitable spawn location...');
    
    // Use multiple strategic positions that should be inland based on continental generation
    const landCandidates = [
      // Continental centers (should be high elevation)
      { x: Math.floor(mapWidth * 0.25), y: Math.floor(mapHeight * 0.25) },
      { x: Math.floor(mapWidth * 0.75), y: Math.floor(mapHeight * 0.75) },
      { x: Math.floor(mapWidth * 0.25), y: Math.floor(mapHeight * 0.75) },
      { x: Math.floor(mapWidth * 0.75), y: Math.floor(mapHeight * 0.25) },
      
      // Off-center positions
      { x: Math.floor(mapWidth * 0.4), y: Math.floor(mapHeight * 0.3) },
      { x: Math.floor(mapWidth * 0.6), y: Math.floor(mapHeight * 0.7) },
      { x: Math.floor(mapWidth * 0.3), y: Math.floor(mapWidth * 0.6) },
      { x: Math.floor(mapWidth * 0.7), y: Math.floor(mapWidth * 0.4) },
      
      // Fallback positions
      { x: Math.floor(mapWidth * 0.5), y: Math.floor(mapHeight * 0.3) },
      { x: Math.floor(mapWidth * 0.3), y: Math.floor(mapHeight * 0.5) }
    ];
    
    console.log('Trying strategic land candidates with sea level', seaLevel, '...');
    for (const candidate of landCandidates) {
      console.log('Testing candidate:', candidate.x, candidate.y);
      
      // Pre-load area around candidate
      this.chunkManager.ensureRadius(candidate.x, candidate.y, 3);
      
      const tile = this.chunkManager.getTile(candidate.x, candidate.y);
      console.log('Candidate tile details:');
      console.log('  Position:', candidate.x, candidate.y);
      console.log('  Biome:', tile?.biome || 'null');
      console.log('  Elevation:', tile?.elevation || 'null');
      console.log('  Temperature:', tile?.temperature || 'null');
      console.log('  Moisture:', tile?.moisture || 'null');
      console.log('  Sea level config:', seaLevel);
      
      if (tile && tile.biome !== 'Ocean') {
        console.log('✓ Found land spawn at:', candidate.x, candidate.y, 'Biome:', tile.biome);
        return { x: candidate.x, y: candidate.y, needsBoat: false };
      }
    }
    
    // Emergency fallback: spawn at first candidate with boat
    const fallback = landCandidates[0];
    console.log('All land searches failed, spawning with boat at:', fallback.x, fallback.y);
    return { x: fallback.x, y: fallback.y, needsBoat: true };
  }

  /**
   * Generate a random seed
   */
  private generateSeed(): string {
    return Math.random().toString(36).substring(2, 15);
  }
  
  /**
   * Move party by relative distance
   * Returns false if movement is blocked
   */
  tickTravel(dx: number, dy: number): boolean {
    const newX = Math.round(this.state.party.x + dx);
    const newY = Math.round(this.state.party.y + dy);
    
    // Check bounds
    if (newX < 0 || newX >= this.state.config.world.mapWidth || 
        newY < 0 || newY >= this.state.config.world.mapHeight) {
      return false;
    }
    
    // Get destination tile
    const tile = this.chunkManager.getTile(newX, newY);
    if (!tile) {
      return false;
    }
    
    // Check if movement is possible
    if (tile.biome === 'Ocean' && !this.hasBoat()) {
      return false;
    }
    
    // Calculate movement cost
    const baseCost = this.state.config.gameplay.movementCostPerTile;
    const terrainModifier = this.getTerrainMovementModifier(tile);
    const weatherModifier = this.state.weather.movementModifier;
    const actualCost = Math.round(baseCost * terrainModifier * weatherModifier / this.state.party.speed);
    
    // Move party
    this.state.party.x = newX;
    this.state.party.y = newY;
    
    // Advance time
    this.advanceTime(actualCost);
    
    // Discover new area
    this.discoverRadius(newX, newY, this.state.config.gameplay.fogOfWarRadius);
    
    // Ensure chunks are loaded
    this.ensureRadius(this.state.config.gameplay.chunkLoadRadius);
    
    // Update encounter risk
    this.updateEncounterRisk(tile, actualCost);
    
    // Update weather
    this.updateWeather();
    
    return true;
  }
  
  /**
   * Check if party has water transportation
   */
  private hasBoat(): boolean {
    return this.state.party.equipment.includes('boat') || 
           this.state.party.equipment.includes('ship');
  }
  
  /**
   * Get movement speed modifier for terrain
   */
  private getTerrainMovementModifier(tile: Tile): number {
    const modifiers: Record<string, number> = {
      'Ocean': 0.3, // Very slow without proper ship
      'Coast': 0.8,
      'Grass': 1.0,
      'Forest': 0.7,
      'Jungle': 0.5,
      'Savanna': 1.1,
      'Desert': 0.6,
      'Taiga': 0.8,
      'Tundra': 0.7,
      'Swamp': 0.4,
      'Mountain': 0.3,
      'Snow': 0.5
    };
    
    let modifier = modifiers[tile.biome] || 1.0;
    
    // Roads speed up travel
    if (tile.road) modifier *= 1.5;
    
    // Rivers slow down travel unless there's a bridge/ford
    if (tile.river && !tile.road) modifier *= 0.8;
    
    return modifier;
  }
  
  /**
   * Advance game time
   */
  advanceTime(minutes: number): void {
    this.state.time.minutes += minutes;
    
    // Handle day rollover
    while (this.state.time.minutes >= 1440) { // 24 hours
      this.state.time.minutes -= 1440;
      this.state.time.day++;
      
      // Handle season change (90 days per season)
      if (this.state.time.day > 90) {
        this.state.time.day = 1;
        const seasons: Array<'Spring' | 'Summer' | 'Autumn' | 'Winter'> = ['Spring', 'Summer', 'Autumn', 'Winter'];
        const currentIndex = seasons.indexOf(this.state.time.season);
        if (currentIndex === 3) {
          this.state.time.season = 'Spring';
          this.state.time.year++;
        } else {
          this.state.time.season = seasons[currentIndex + 1];
        }
      }
    }
  }
  
  /**
   * Discover tiles within radius
   */
  discoverRadius(centerX: number, centerY: number, radius: number): void {
    const weatherVisibility = this.state.weather.visibility;
    const actualRadius = Math.floor(radius * weatherVisibility);
    
    for (let dx = -actualRadius; dx <= actualRadius; dx++) {
      for (let dy = -actualRadius; dy <= actualRadius; dy++) {
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance <= actualRadius) {
          const x = centerX + dx;
          const y = centerY + dy;
          if (x >= 0 && x < this.state.config.world.mapWidth && 
              y >= 0 && y < this.state.config.world.mapHeight) {
            this.state.discovered.add(`${x},${y}`);
          }
        }
      }
    }
  }
  
  /**
   * Ensure chunks are loaded within radius
   */
  ensureRadius(radius: number): void {
    this.chunkManager.ensureRadius(
      this.state.party.x, 
      this.state.party.y, 
      radius
    );
    
    // Unload distant chunks to save memory
    this.chunkManager.unloadBeyond(
      this.state.party.x,
      this.state.party.y,
      this.state.config.gameplay.chunkUnloadRadius
    );
  }
  
  /**
   * Update encounter risk based on movement
   */
  updateEncounterRisk(tile: Tile, timeCost: number): void {
    const baseRiskIncrease = 0.1 * (timeCost / 60); // Risk per hour of travel
    
    // Terrain modifiers
    const terrainRiskModifiers: Record<string, number> = {
      'Ocean': 0.2,
      'Coast': 0.5,
      'Grass': 1.0,
      'Forest': 1.3,
      'Jungle': 1.5,
      'Savanna': 1.1,
      'Desert': 0.8,
      'Taiga': 1.2,
      'Tundra': 0.7,
      'Swamp': 1.4,
      'Mountain': 1.6,
      'Snow': 0.6
    };
    
    let riskIncrease = baseRiskIncrease * (terrainRiskModifiers[tile.biome] || 1.0);
    
    // Roads are safer
    if (tile.road) riskIncrease *= 0.5;
    
    // Settlements are safe
    if (tile.settlement) riskIncrease = 0;
    
    this.state.encounterClock.riskLevel = Math.min(1, this.state.encounterClock.riskLevel + riskIncrease);
  }
  
  /**
   * Generate weather for current conditions
   */
  generateWeather(partyX?: number, partyY?: number, seed?: string, day?: number): Weather {
    // Use provided parameters or fall back to current state
    const x = partyX ?? this.state?.party?.x ?? 1024;
    const y = partyY ?? this.state?.party?.y ?? 1024;
    const currentSeed = seed ?? this.state?.seed ?? 'default';
    const currentDay = day ?? this.state?.time?.day ?? 1;
    
    const tile = this.chunkManager.getTile(x, y);
    if (!tile) {
      return {
        type: 'Clear',
        intensity: 0,
        duration: 480, // 8 hours
        visibility: 1.0,
        movementModifier: 1.0
      };
    }
    
    const weatherRng = new SeededRandom(`${currentSeed}_weather_${currentDay}`);
    const biomeWeatherChances = this.getBiomeWeatherChances(tile.biome);
    
    const roll = weatherRng.nextFloat();
    let weatherType: Weather['type'] = 'Clear';
    let cumulative = 0;
    
    for (const [type, chance] of Object.entries(biomeWeatherChances)) {
      cumulative += chance;
      if (roll <= cumulative) {
        weatherType = type as Weather['type'];
        break;
      }
    }
    
    const intensity = weatherRng.nextFloat(0.3, 1.0);
    const duration = weatherRng.nextInt(240, 720); // 4-12 hours
    
    return {
      type: weatherType,
      intensity,
      duration,
      ...this.getWeatherEffects(weatherType, intensity)
    };
  }
  
  /**
   * Get weather chances for different biomes
   */
  getBiomeWeatherChances(biome: string): Record<string, number> {
    const baseChances: Record<string, Record<string, number>> = {
      Ocean: { Clear: 0.5, Rain: 0.3, Storm: 0.1, Wind: 0.1 },
      Coast: { Clear: 0.6, Rain: 0.25, Wind: 0.1, Fog: 0.05 },
      Grass: { Clear: 0.7, Rain: 0.2, Wind: 0.1 },
      Forest: { Clear: 0.6, Rain: 0.3, Fog: 0.1 },
      Jungle: { Clear: 0.4, Rain: 0.5, Storm: 0.1 },
      Desert: { Clear: 0.8, Wind: 0.15, Storm: 0.05 },
      Mountain: { Clear: 0.5, Snow: 0.2, Wind: 0.2, Storm: 0.1 },
      Snow: { Clear: 0.4, Snow: 0.4, Wind: 0.2 },
      Tundra: { Clear: 0.5, Snow: 0.3, Wind: 0.2 },
      Taiga: { Clear: 0.6, Snow: 0.2, Rain: 0.1, Wind: 0.1 },
      Swamp: { Clear: 0.4, Rain: 0.3, Fog: 0.3 },
      Savanna: { Clear: 0.7, Rain: 0.2, Wind: 0.1 }
    };
    
    return baseChances[biome] || baseChances.Grass;
  }
  
  /**
   * Get weather effects on gameplay
   */
  getWeatherEffects(type: Weather['type'], intensity: number): { visibility: number; movementModifier: number } {
    const effects: Record<Weather['type'], { visibility: number; movementModifier: number }> = {
      Clear: { visibility: 1.0, movementModifier: 1.0 },
      Rain: { visibility: 0.8, movementModifier: 0.8 },
      Snow: { visibility: 0.6, movementModifier: 0.6 },
      Fog: { visibility: 0.3, movementModifier: 0.9 },
      Wind: { visibility: 1.0, movementModifier: 0.9 },
      Storm: { visibility: 0.4, movementModifier: 0.5 }
    };
    
    const base = effects[type];
    return {
      visibility: Math.max(0.1, base.visibility - (1 - intensity) * 0.2),
      movementModifier: Math.max(0.3, base.movementModifier - (intensity - 0.5) * 0.2)
    };
  }
  
  /**
   * Update weather over time
   */
  updateWeather(): void {
    this.state.weather.duration--;
    
    if (this.state.weather.duration <= 0) {
      this.state.weather = this.generateWeather();
    }
  }
  
  /**
   * Rest at current location
   */
  rest(hours: number): void {
    this.advanceTime(hours * 60);
    
    // Resting reduces encounter risk
    this.state.encounterClock.riskLevel = Math.max(0, this.state.encounterClock.riskLevel - 0.3);
    
    // Update weather during rest
    for (let i = 0; i < hours; i++) {
      this.updateWeather();
    }
  }
  
  /**
   * Get tile at position (generates if needed)
   */
  getTile(x: number, y: number): Tile | undefined {
    return this.chunkManager.getTile(x, y);
  }
  
  /**
   * Check if position is discovered
   */
  isDiscovered(x: number, y: number): boolean {
    return this.state.discovered.has(`${x},${y}`);
  }
  
  /**
   * Get current time of day (0-1, 0=midnight, 0.5=noon)
   */
  getTimeOfDay(): number {
    return (this.state.time.minutes % 1440) / 1440;
  }
  
  /**
   * Get memory and performance statistics
   */
  getStats(): {
    chunks: ReturnType<ChunkManager['getStats']>;
    discovered: number;
    timeOfDay: number;
    gameTime: string;
  } {
    const hours = Math.floor(this.state.time.minutes / 60) % 24;
    const minutes = this.state.time.minutes % 60;
    
    return {
      chunks: this.chunkManager.getStats(),
      discovered: this.state.discovered.size,
      timeOfDay: this.getTimeOfDay(),
      gameTime: `Day ${this.state.time.day}, ${this.state.time.season} Year ${this.state.time.year} - ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
    };
  }
  
  /**
   * Save game state to JSON
   */
  save(): string {
    const saveData = {
      ...this.state,
      discovered: Array.from(this.state.discovered) // Convert Set to Array for JSON
    };
    return JSON.stringify(saveData, null, 2);
  }
  
  /**
   * Load game state from JSON
   */
  load(saveData: string): boolean {
    try {
      const data = JSON.parse(saveData);
      
      // Recreate chunk manager and chokepoint manager with loaded seed
      this.chunkManager = new ChunkManager(data.seed, data.config.world);
      
      try {
        this.chokepointManager = new ChokepointManager(
          data.seed,
          data.config.world.mapWidth,
          data.config.world.mapHeight,
          data.config.world.mapWidth / 2,
          data.config.world.mapHeight / 2
        );
      } catch (error) {
        console.error('Failed to recreate chokepoint manager during load:', error);
        this.chokepointManager = null;
      }
      
      this.rng = new SeededRandom(`${data.seed}_engine`);
      
      // Restore state
      this.state = {
        ...data,
        discovered: new Set(data.discovered) // Convert Array back to Set
      };
      
      // Ensure current area is loaded
      this.ensureRadius(this.state.config.gameplay.chunkLoadRadius);
      
      return true;
    } catch (error) {
      console.error('Failed to load save data:', error);
      return false;
    }
  }
  
  /**
   * Update world generation config and regenerate world
   */
  updateWorldConfig(newConfig: Partial<WorldGenConfig>): void {
    this.state.config.world = { ...this.state.config.world, ...newConfig };
    this.chunkManager.updateConfig(this.state.config.world);
    this.chunkManager.invalidateAll();
    
    // Recreate chokepoint manager with new config
    try {
      this.chokepointManager = new ChokepointManager(
        this.state.seed,
        this.state.config.world.mapWidth,
        this.state.config.world.mapHeight,
        this.state.config.world.mapWidth / 2,
        this.state.config.world.mapHeight / 2
      );
    } catch (error) {
      console.error('Failed to recreate chokepoint manager:', error);
      this.chokepointManager = null;
    }
    
    // Clear discoveries since world changed
    this.state.discovered.clear();
    this.discoverRadius(this.state.party.x, this.state.party.y, this.state.config.gameplay.fogOfWarRadius);
  }
  
  // ===== CHOKEPOINT & REGION METHODS =====
  
  /**
   * Get all chokepoints in the world
   */
  getChokepoints(): Chokepoint[] {
    return this.chokepointManager?.getChokepoints() || [];
  }
  
  /**
   * Get chokepoint at specific location
   */
  getChokepointAt(x: number, y: number): Chokepoint | undefined {
    return this.chokepointManager?.getChokepointAt(x, y);
  }
  
  /**
   * Get all regions in the world
   */
  getRegions(): RegionData[] {
    return this.chokepointManager?.getRegions() || [];
  }
  
  /**
   * Get region containing a point
   */
  getRegionAt(x: number, y: number): RegionData | undefined {
    return this.chokepointManager?.getRegionAt(x, y);
  }
  
  /**
   * Check if travel to a location is blocked by fortifications
   */
  checkTravelBlockage(toX: number, toY: number): Chokepoint[] {
    return this.chokepointManager?.isRouteBlocked(
      this.state.party.x,
      this.state.party.y,
      toX,
      toY
    ) || [];
  }
  
  /**
   * Attempt to clear a fortification
   * Returns true if successful, false if failed or not present
   */
  attemptFortificationClear(x: number, y: number): {
    success: boolean;
    fortification?: Fortification;
    rewards?: any[];
  } {
    const chokepoint = this.getChokepointAt(x, y);
    
    if (!chokepoint?.fortification || chokepoint.fortification.cleared) {
      return { success: false };
    }
    
    const fort = chokepoint.fortification;
    
    // Simple success check (can be expanded with party stats)
    const partyLevel = Math.max(1, Math.floor(this.state.time.day / 30)); // Rough level estimate
    const hasRequiredGear = fort.requiredGear.every(gear => 
      this.state.party.equipment.includes(gear)
    );
    
    if (partyLevel >= fort.requiredLevel && hasRequiredGear) {
      const success = this.chokepointManager?.clearFortification(x, y);
      
      if (success) {
        // Apply rewards
        for (const reward of fort.rewards) {
          if (reward.type === 'gold') {
            this.state.party.supplies.gold += reward.value;
          } else if (reward.type === 'equipment') {
            this.state.party.equipment.push(reward.name);
          }
          // TODO: Handle spell and key rewards
        }
        
        return {
          success: true,
          fortification: fort,
          rewards: fort.rewards
        };
      }
    }
    
    return { success: false, fortification: fort };
  }
  
  /**
   * Get current region info for the party
   */
  getCurrentRegion(): RegionData | undefined {
    return this.getRegionAt(this.state.party.x, this.state.party.y);
  }
  
  /**
   * Check if party can travel to a specific location
   */
  canTravelTo(x: number, y: number): {
    canTravel: boolean;
    blockedBy: Chokepoint[];
    reason?: string;
  } {
    const blockedBy = this.checkTravelBlockage(x, y);
    
    if (blockedBy.length === 0) {
      return { canTravel: true, blockedBy: [] };
    }
    
    const unclearedForts = blockedBy.filter(cp => 
      cp.fortified && cp.fortification && !cp.fortification.cleared
    );
    
    if (unclearedForts.length > 0) {
      const fortNames = unclearedForts
        .map(cp => cp.fortification?.name)
        .filter(Boolean)
        .join(', ');
      
      return {
        canTravel: false,
        blockedBy: unclearedForts,
        reason: `Path blocked by fortification(s): ${fortNames}`
      };
    }
    
    return { canTravel: true, blockedBy: [] };
  }
}