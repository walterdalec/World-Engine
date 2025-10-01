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
import { PhysicalAbilitiesGenerator, PhysicalAbility, PhysicalAbilitySchool, PhysicalAbilityTier } from '../proc/physicalAbilities';
import { MagicalSpellsGenerator, MagicalSpell, MagicalSchool, SpellTier } from '../proc/magicalSpells';

export { ChunkManager, CHUNK_SIZE } from '../proc/chunks';
export { SeededRandom, WorldNoise, ValueNoise2D } from '../proc/noise';
export { ChokepointManager } from '../proc/chokepoints';
export { PhysicalAbilitiesGenerator } from '../proc/physicalAbilities';
export { MagicalSpellsGenerator } from '../proc/magicalSpells';
export type { Tile, WorldGenConfig } from '../proc/chunks';
export type { Chokepoint, Fortification, RegionData } from '../proc/chokepoints';
export type { PhysicalAbility, PhysicalAbilitySchool, PhysicalAbilityTier } from '../proc/physicalAbilities';
export type { MagicalSpell, MagicalSchool, SpellTier } from '../proc/magicalSpells';

export interface Character {
  id: string;
  name: string;
  gender: string;
  species: string;
  archetype: string;
  background: string;
  level: number;
  experience: number;
  stats: {
    strength: number;
    dexterity: number;
    constitution: number;
    intelligence: number;
    wisdom: number;
    charisma: number;
  };
  traits: string[];
  portraitUrl?: string;
  hitPoints: number;
  maxHitPoints: number;
  stamina: number;
  maxStamina: number;
  ether: number;
  maxEther: number;
  knownAbilities: string[];
  knownSpells: string[];
  knownCantrips: string[];
  equipment: string[];
}

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
  hitPoints: number; // Current HP
  maxHitPoints: number; // Maximum HP
  level: number; // Party level for ability requirements
  experience: number; // Experience points
  knownAbilities: string[]; // Known physical abilities
  knownSpells: string[]; // Known magical spells
  stats: { // Party stats for ability requirements
    strength: number;
    dexterity: number;
    constitution: number;
    intelligence: number;
    wisdom: number;
    charisma: number;
  };
  stamina: number; // Current stamina for physical abilities
  maxStamina: number; // Maximum stamina
  ether: number; // Current ether for magical abilities  
  maxEther: number; // Maximum ether
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

export interface Encounter {
  id: string;
  name: string;
  type: 'combat' | 'event' | 'discovery' | 'trader' | 'quest';
  danger: 'safe' | 'low' | 'medium' | 'high' | 'extreme';
  description: string;
  biome?: string; // If specified, only appears in this biome
  x?: number; // If specified, fixed location encounter
  y?: number;
  isFixed: boolean; // True for set encounters, false for random
  isActive: boolean; // Whether this encounter has been triggered
  rewards?: {
    experience?: number;
    gold?: number;
    items?: string[];
    reputation?: { faction: string; amount: number }[];
  };
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
  characters: Character[]; // Individual character data
  time: GameTime;
  weather: Weather;
  encounterClock: EncounterClock;
  activeEncounter: Encounter | null; // Current encounter if any
  completedEncounters: Set<string>; // IDs of completed encounters
  discovered: Set<string>; // "x,y" coordinates
  config: EngineConfig;
  version: string;
}

export class WorldEngine {
  private chunkManager!: ChunkManager;
  private chokepointManager: ChokepointManager | null = null; // Temporarily nullable for debugging
  private physicalAbilities!: PhysicalAbilitiesGenerator;
  private magicalSpells!: MagicalSpellsGenerator;
  private rng!: SeededRandom;
  public state!: GameState;
  private loadedFromSave: boolean = false; // Track if loaded from localStorage

  constructor(seed?: string, config?: Partial<EngineConfig>) {
    // Try to load existing game from localStorage first
    const existingSave = localStorage.getItem('world-engine-save');
    if (existingSave) {
      try {
        console.log('Found existing save, loading from localStorage...');
        const success = this.loadFromStorage(existingSave);
        if (success) {
          console.log('Successfully loaded existing game!');
          this.loadedFromSave = true;
          return; // Exit early if load was successful
        }
      } catch (error) {
        console.warn('Failed to load existing save, creating new game:', error);
        localStorage.removeItem('world-engine-save'); // Clear corrupted save
      }
    }

    // Create new game if no save exists or load failed
    console.log('Creating new game...');
    this.loadedFromSave = false;
    this.createNewGame(seed, config);
  }

  /**
   * Create a completely new game
   */
  private createNewGame(seed?: string, config?: Partial<EngineConfig>) {
    const actualSeed = seed || this.generateSeed();
    this.rng = new SeededRandom(`${actualSeed}_engine`);

    const defaultConfig: EngineConfig = {
      world: {
        seaLevel: 0.0, // Almost no ocean, everything should be land
        continentFreq: 1 / 1024,
        featureFreq: 1 / 128,
        warpStrength: 700,
        mapWidth: 2048,
        mapHeight: 2048
      },
      gameplay: {
        movementCostPerTile: 15, // 15 minutes per tile
        encounterBaseChance: 0.15, // Increased from 0.05 to 0.15 for better scaling
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

    // Initialize physical abilities generator
    this.physicalAbilities = new PhysicalAbilitiesGenerator(actualSeed);

    // Initialize magical spells generator
    this.magicalSpells = new MagicalSpellsGenerator(actualSeed);

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
        speed: 1.0,
        hitPoints: 100, // Start at full health
        maxHitPoints: 100,
        level: 1, // Starting level
        experience: 0,
        knownAbilities: [], // No abilities at start
        knownSpells: [], // No spells at start
        stats: { // Starting stats
          strength: 12,
          dexterity: 12,
          constitution: 12,
          intelligence: 12,
          wisdom: 12,
          charisma: 12
        },
        stamina: 20, // Starting stamina
        maxStamina: 20,
        ether: 15, // Starting ether for magic
        maxEther: 15
      },
      characters: [], // Individual character data - initially empty
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
      activeEncounter: null,
      completedEncounters: new Set(),
      discovered: new Set(),
      config: mergedConfig,
      version: '1.0.0'
    };

    // Discover initial area around party
    this.discoverRadius(this.state.party.x, this.state.party.y, 3);

    // Create a main city at spawn point
    this.createMainCity(this.state.party.x, this.state.party.y);

    // Auto-save the new game
    this.autoSave();
  }

  /**
   * Load game state from localStorage
   */
  private loadFromStorage(saveData: string): boolean {
    try {
      const data = JSON.parse(saveData);

      // Recreate chunk manager and chokepoint manager with loaded seed
      this.chunkManager = new ChunkManager(data.seed, data.config.world);

      // Initialize physical abilities generator
      this.physicalAbilities = new PhysicalAbilitiesGenerator(data.seed);

      // Initialize magical spells generator
      this.magicalSpells = new MagicalSpellsGenerator(data.seed);

      // Initialize RNG
      this.rng = new SeededRandom(`${data.seed}_engine`);

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

      // Restore game state
      this.state = {
        ...data,
        discovered: new Set(data.discovered) // Convert Array back to Set
      };

      console.log(`Game loaded successfully! Seed: ${this.state.seed}, Characters: ${this.state.characters.length}`);
      return true;
    } catch (error) {
      console.error('Failed to load game state:', error);
      return false;
    }
  }

  /**
   * Auto-save to localStorage
   */
  private autoSave(): void {
    try {
      const saveData = this.save();
      localStorage.setItem('world-engine-save', saveData);
      console.log('Game auto-saved to localStorage');
    } catch (error) {
      console.error('Failed to auto-save game:', error);
    }
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

    // Check for encounters after movement
    this.checkForEncounter(tile);

    // Update weather
    this.updateWeather();

    // Auto-save after movement
    this.autoSave();

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
    const baseRiskIncrease = 0.02 * (timeCost / 60); // Risk per hour of travel (reduced from 0.1 to 0.02)

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

    // Heal HP over time (10 HP per hour of rest, up to max)
    const healingPerHour = 10;
    const totalHealing = hours * healingPerHour;
    this.state.party.hitPoints = Math.min(
      this.state.party.maxHitPoints,
      this.state.party.hitPoints + totalHealing
    );

    // Restore stamina over time (5 stamina per hour of rest)
    const staminaPerHour = 5;
    const totalStaminaRestored = hours * staminaPerHour;
    this.state.party.stamina = Math.min(
      this.state.party.maxStamina,
      this.state.party.stamina + totalStaminaRestored
    );

    // Restore ether over time (3 ether per hour of rest)
    const etherPerHour = 3;
    const totalEtherRestored = hours * etherPerHour;
    this.state.party.ether = Math.min(
      this.state.party.maxEther,
      this.state.party.ether + totalEtherRestored
    );

    // Update weather during rest
    for (let i = 0; i < hours; i++) {
      this.updateWeather();
    }
  }

  /**
   * Deal damage to the party
   */
  takeDamage(damage: number): boolean {
    this.state.party.hitPoints = Math.max(0, this.state.party.hitPoints - damage);
    return this.state.party.hitPoints > 0; // Return true if party is still alive
  }

  /**
   * Heal the party
   */
  heal(amount: number): void {
    this.state.party.hitPoints = Math.min(
      this.state.party.maxHitPoints,
      this.state.party.hitPoints + amount
    );
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
   * Check if the engine was loaded from a saved game
   */
  wasLoadedFromSave(): boolean {
    return this.loadedFromSave;
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

      // Set flag to indicate this was loaded from a save
      this.loadedFromSave = true;

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

  /**
   * Create a main city at spawn point
   */
  private createMainCity(x: number, y: number): void {
    // Force the spawn tile to be grassland with a city
    const tile = this.chunkManager.getTile(x, y);
    if (tile) {
      tile.settlement = {
        name: this.generateCityName(),
        population: this.rng.nextInt(5000, 15000),
        size: 'city',
        faction: 'Capital'
      };

      // Ensure surrounding area is good for a city
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          const surroundTile = this.chunkManager.getTile(x + dx, y + dy);
          if (surroundTile && surroundTile.biome === 'Ocean') {
            surroundTile.biome = 'Coast';
          }
        }
      }
    }
  }

  /**
   * Generate a random city name
   */
  private generateCityName(): string {
    const prefixes = ['Haven', 'Storm', 'River', 'Gold', 'Stone', 'Iron', 'Silver', 'White', 'Black', 'Red'];
    const suffixes = ['port', 'hold', 'burg', 'haven', 'ford', 'gate', 'fall', 'ridge', 'vale', 'watch'];

    const prefix = prefixes[this.rng.nextInt(0, prefixes.length - 1)];
    const suffix = suffixes[this.rng.nextInt(0, suffixes.length - 1)];

    return `${prefix}${suffix}`;
  }

  /**
   * Check for encounters after movement
   */
  private checkForEncounter(tile: Tile): void {
    // Don't trigger encounters in cities
    if (tile.settlement?.size === 'city') {
      return;
    }

    // Check for fixed encounters at this location first
    const fixedEncounter = this.getFixedEncounterAt(this.state.party.x, this.state.party.y);
    if (fixedEncounter && !this.state.completedEncounters.has(fixedEncounter.id)) {
      this.state.activeEncounter = fixedEncounter;
      return;
    }

    // Check for random encounters based on risk level
    const encounterRoll = this.rng.nextFloat();
    const encounterThreshold = this.state.encounterClock.riskLevel * this.state.encounterClock.encounterChance;

    if (encounterRoll <= encounterThreshold) {
      // Generate random encounter
      const randomEncounter = this.generateRandomEncounter(tile);
      if (randomEncounter) {
        this.state.activeEncounter = randomEncounter;
        // Reset encounter risk after triggering
        this.state.encounterClock.riskLevel = Math.max(0, this.state.encounterClock.riskLevel - 0.5);
        this.state.encounterClock.lastEncounter = this.state.time.minutes;
      }
    }
  }

  /**
   * Generate a random encounter based on current tile
   */
  private generateRandomEncounter(tile: Tile): Encounter | null {
    const encounters: Omit<Encounter, 'id' | 'x' | 'y' | 'isFixed' | 'isActive'>[] = [];

    // Biome-specific encounters
    switch (tile.biome) {
      case 'Forest':
        encounters.push(
          {
            name: 'Forest Bandits',
            type: 'combat',
            danger: 'medium',
            description: 'A group of bandits emerges from the trees, demanding your coin.',
            biome: 'Forest',
            rewards: { gold: 50, experience: 75 }
          },
          {
            name: 'Lost Traveler',
            type: 'event',
            danger: 'safe',
            description: 'A confused traveler asks for directions to the nearest town.',
            biome: 'Forest',
            rewards: { experience: 25 }
          },
          {
            name: 'Ancient Grove',
            type: 'discovery',
            danger: 'safe',
            description: 'You discover an ancient grove with mystical properties.',
            biome: 'Forest',
            rewards: { experience: 100 }
          }
        );
        break;

      case 'Grass':
        encounters.push(
          {
            name: 'Wild Wolves',
            type: 'combat',
            danger: 'low',
            description: 'A pack of hungry wolves blocks your path.',
            biome: 'Grass',
            rewards: { experience: 50 }
          },
          {
            name: 'Merchant Caravan',
            type: 'trader',
            danger: 'safe',
            description: 'A friendly merchant offers to trade goods.',
            biome: 'Grass',
            rewards: { experience: 25 }
          }
        );
        break;

      case 'Mountain':
        encounters.push(
          {
            name: 'Mountain Trolls',
            type: 'combat',
            danger: 'high',
            description: 'Massive trolls emerge from rocky caves, brandishing crude weapons.',
            biome: 'Mountain',
            rewards: { gold: 100, experience: 150 }
          },
          {
            name: 'Hidden Cave',
            type: 'discovery',
            danger: 'medium',
            description: 'You discover a cave that might contain treasure... or danger.',
            biome: 'Mountain',
            rewards: { gold: 75, experience: 100 }
          }
        );
        break;

      case 'Desert':
        encounters.push(
          {
            name: 'Desert Nomads',
            type: 'event',
            danger: 'safe',
            description: 'Desert nomads offer to share their water and knowledge.',
            biome: 'Desert',
            rewards: { experience: 50 }
          },
          {
            name: 'Sandstorm Mirage',
            type: 'discovery',
            danger: 'low',
            description: 'A mirage reveals the location of an oasis.',
            biome: 'Desert',
            rewards: { experience: 75 }
          }
        );
        break;

      case 'Swamp':
        encounters.push(
          {
            name: 'Swamp Wraiths',
            type: 'combat',
            danger: 'high',
            description: 'Ghostly figures rise from the murky waters.',
            biome: 'Swamp',
            rewards: { experience: 125, items: ['Spirit Essence'] }
          }
        );
        break;

      default:
        // Generic encounters for other biomes
        encounters.push(
          {
            name: 'Strange Weather',
            type: 'event',
            danger: 'safe',
            description: 'Unusual weather patterns create an interesting phenomenon.',
            rewards: { experience: 30 }
          }
        );
    }

    if (encounters.length === 0) return null;

    const selectedEncounter = encounters[this.rng.nextInt(0, encounters.length - 1)];

    return {
      id: `random_${this.state.party.x}_${this.state.party.y}_${this.state.time.day}_${Date.now()}`,
      x: this.state.party.x,
      y: this.state.party.y,
      isFixed: false,
      isActive: true,
      ...selectedEncounter
    };
  }

  /**
   * Get fixed encounter at specific location
   */
  private getFixedEncounterAt(x: number, y: number): Encounter | null {
    // This could be expanded to load from a data file or generate based on world features
    const fixedEncounters: Encounter[] = [
      // Example fixed encounters - these would be loaded from world data
      {
        id: 'dragon_lair_1000_1000',
        name: 'Ancient Dragon Lair',
        type: 'combat',
        danger: 'extreme',
        description: 'An ancient red dragon guards a massive hoard in this mountain cave.',
        x: 1000,
        y: 1000,
        isFixed: true,
        isActive: true,
        rewards: {
          gold: 5000,
          experience: 1000,
          items: ['Dragon Scale Armor', 'Flame Sword'],
          reputation: [{ faction: 'Dragon Slayers', amount: 100 }]
        }
      }
      // Add more fixed encounters here
    ];

    return fixedEncounters.find(enc => enc.x === x && enc.y === y) || null;
  }

  /**
   * Get current active encounter
   */
  getActiveEncounter(): Encounter | null {
    return this.state.activeEncounter;
  }

  /**
   * Complete the current encounter
   */
  completeEncounter(success: boolean, rewards?: any): void {
    if (!this.state.activeEncounter) return;

    const encounter = this.state.activeEncounter;

    // Handle combat encounters - deal damage based on success/failure
    if (encounter.type === 'combat') {
      if (!success) {
        // Failed combat - take significant damage based on danger level
        let damage = 0;
        switch (encounter.danger) {
          case 'low': damage = 10 + Math.floor(Math.random() * 10); break;    // 10-20 damage
          case 'medium': damage = 20 + Math.floor(Math.random() * 15); break; // 20-35 damage  
          case 'high': damage = 30 + Math.floor(Math.random() * 20); break;   // 30-50 damage
          default: damage = 15 + Math.floor(Math.random() * 10); break;       // 15-25 damage
        }
        this.takeDamage(damage);
        console.log(`Combat failed! Party takes ${damage} damage. HP: ${this.state.party.hitPoints}/${this.state.party.maxHitPoints}`);
      } else {
        // Successful combat - minimal damage
        const damage = Math.floor(Math.random() * 5); // 0-5 damage
        if (damage > 0) {
          this.takeDamage(damage);
          console.log(`Combat won with minor injuries: ${damage} damage taken.`);
        }
      }
    }

    if (success) {
      // Mark as completed
      this.state.completedEncounters.add(encounter.id);

      // Apply rewards
      if (encounter.rewards) {
        const reward = encounter.rewards;
        if (reward.gold) {
          this.state.party.supplies.gold += reward.gold;
        }
        if (reward.items) {
          this.state.party.equipment.push(...reward.items);
        }
        if (reward.experience) {
          const leveledUp = this.gainExperience(reward.experience);
          if (leveledUp) {
            console.log(`Party gained ${reward.experience} XP and leveled up! Now level ${this.state.party.level}`);
          } else {
            console.log(`Party gained ${reward.experience} XP`);
          }
        }
      }
    }

    // Clear active encounter
    this.state.activeEncounter = null;
  }

  /**
   * Dismiss current encounter without completing
   */
  dismissEncounter(): void {
    this.state.activeEncounter = null;
  }

  /**
   * Get available magical spells for the party
   */
  getAvailableMagicalSpells(): MagicalSpell[] {
    return this.magicalSpells.getAvailableSpells(
      this.state.party.level,
      this.state.party.stats,
      this.state.party.equipment, // Using equipment as components for now
      this.state.party.knownSpells
    );
  }

  /**
   * Learn a new magical spell
   */
  learnMagicalSpell(spellName: string): boolean {
    const available = this.getAvailableMagicalSpells();
    const spell = available.find(s => s.name === spellName);

    if (spell && !this.state.party.knownSpells.includes(spellName)) {
      this.state.party.knownSpells.push(spellName);
      return true;
    }
    return false;
  }

  /**
   * Cast a magical spell (if known and have ether)
   */
  castMagicalSpell(spellName: string): { success: boolean; message: string } {
    if (!this.state.party.knownSpells.includes(spellName)) {
      return { success: false, message: 'Spell not known' };
    }

    const available = this.getAvailableMagicalSpells();
    const spell = available.find(s => s.name === spellName);

    if (!spell) {
      return { success: false, message: 'Spell no longer available (requirements not met)' };
    }

    if (this.state.party.ether < spell.etherCost) {
      return { success: false, message: 'Not enough ether' };
    }

    // Cast the spell
    this.state.party.ether -= spell.etherCost;

    // Apply effects (basic implementation)
    let message = `Cast ${spellName}!`;

    if (spell.effects.healing) {
      const healing = Math.floor(Math.random() * (spell.effects.healing.max - spell.effects.healing.min + 1)) + spell.effects.healing.min;
      this.heal(healing);
      message += ` Healed ${healing} HP.`;
    }

    if (spell.effects.damage) {
      const damage = Math.floor(Math.random() * (spell.effects.damage.max - spell.effects.damage.min + 1)) + spell.effects.damage.min;
      message += ` Dealt ${damage} ${spell.effects.damage.type || 'magical'} damage.`;
    }

    return { success: true, message };
  }
  getAvailablePhysicalAbilities(): PhysicalAbility[] {
    return this.physicalAbilities.getAvailableAbilities(
      this.state.party.level,
      this.state.party.stats,
      this.state.party.equipment,
      this.state.party.knownAbilities
    );
  }

  /**
   * Learn a new physical ability
   */
  learnPhysicalAbility(abilityName: string): boolean {
    const available = this.getAvailablePhysicalAbilities();
    const ability = available.find(a => a.name === abilityName);

    if (ability && !this.state.party.knownAbilities.includes(abilityName)) {
      this.state.party.knownAbilities.push(abilityName);
      return true;
    }
    return false;
  }

  /**
   * Use a physical ability (if known and have stamina)
   */
  usePhysicalAbility(abilityName: string): { success: boolean; message: string } {
    if (!this.state.party.knownAbilities.includes(abilityName)) {
      return { success: false, message: 'Ability not known' };
    }

    const available = this.getAvailablePhysicalAbilities();
    const ability = available.find(a => a.name === abilityName);

    if (!ability) {
      return { success: false, message: 'Ability no longer available (requirements not met)' };
    }

    if (this.state.party.stamina < ability.staminaCost) {
      return { success: false, message: 'Not enough stamina' };
    }

    // Use the ability
    this.state.party.stamina -= ability.staminaCost;

    // Apply effects (basic implementation)
    let message = `Used ${abilityName}!`;

    if (ability.effects.healing) {
      const healing = Math.floor(Math.random() * (ability.effects.healing.max - ability.effects.healing.min + 1)) + ability.effects.healing.min;
      this.heal(healing);
      message += ` Healed ${healing} HP.`;
    }

    if (ability.effects.damage) {
      const damage = Math.floor(Math.random() * (ability.effects.damage.max - ability.effects.damage.min + 1)) + ability.effects.damage.min;
      message += ` Dealt ${damage} ${ability.effects.damage.type || 'damage'}.`;
    }

    return { success: true, message };
  }

  /**
   * Rest to recover stamina
   */
  restoreStamina(amount: number): void {
    this.state.party.stamina = Math.min(this.state.party.maxStamina, this.state.party.stamina + amount);
  }

  /**
   * Rest to recover ether
   */
  restoreEther(amount: number): void {
    this.state.party.ether = Math.min(this.state.party.maxEther, this.state.party.ether + amount);
  }

  /**
   * Use ether for magical abilities
   */
  useEther(amount: number): boolean {
    if (this.state.party.ether >= amount) {
      this.state.party.ether -= amount;
      return true;
    }
    return false;
  }

  /**
   * Gain experience and potentially level up
   */
  gainExperience(amount: number): boolean {
    this.state.party.experience += amount;

    // Simple leveling: 100 XP per level
    const requiredXP = this.state.party.level * 100;
    if (this.state.party.experience >= requiredXP) {
      this.state.party.level++;
      this.state.party.experience -= requiredXP;

      // Increase stats slightly on level up
      const statKeys = Object.keys(this.state.party.stats) as (keyof typeof this.state.party.stats)[];
      const randomStat = this.rng.pick(statKeys);
      this.state.party.stats[randomStat]++;

      // Increase stamina and ether
      this.state.party.maxStamina += 2;
      this.state.party.stamina = this.state.party.maxStamina;
      this.state.party.maxEther += 1;
      this.state.party.ether = this.state.party.maxEther;

      return true; // Leveled up
    }

    return false; // No level up
  }

  /**
   * Character Management Methods
   */

  /**
   * Add a character to the party
   */
  addCharacter(characterData: Omit<Character, 'id' | 'hitPoints' | 'maxHitPoints' | 'stamina' | 'maxStamina' | 'ether' | 'maxEther' | 'knownAbilities' | 'knownSpells' | 'knownCantrips' | 'equipment'>): Character {
    const character: Character = {
      ...characterData,
      id: `char_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      hitPoints: this.calculateMaxHitPoints(characterData.stats.constitution, characterData.level),
      maxHitPoints: this.calculateMaxHitPoints(characterData.stats.constitution, characterData.level),
      stamina: this.calculateMaxStamina(characterData.stats.constitution, characterData.level),
      maxStamina: this.calculateMaxStamina(characterData.stats.constitution, characterData.level),
      ether: this.calculateMaxEther(characterData.stats.intelligence, characterData.stats.wisdom, characterData.level),
      maxEther: this.calculateMaxEther(characterData.stats.intelligence, characterData.stats.wisdom, characterData.level),
      knownAbilities: [],
      knownSpells: [],
      knownCantrips: [],
      equipment: []
    };

    this.state.characters.push(character);
    this.state.party.members.push(character.id);

    // Auto-save after creating character
    this.autoSave();

    return character;
  }

  /**
   * Get a character by ID
   */
  getCharacter(id: string): Character | undefined {
    return this.state.characters.find(char => char.id === id);
  }

  /**
   * Get all party member characters
   */
  getPartyCharacters(): Character[] {
    return this.state.party.members
      .map(id => this.getCharacter(id))
      .filter((char): char is Character => char !== undefined);
  }

  /**
   * Learn a physical ability for a specific character
   */
  learnPhysicalAbilityForCharacter(characterId: string, abilityName: string): boolean {
    const character = this.getCharacter(characterId);
    if (!character) return false;

    const available = this.getAvailablePhysicalAbilitiesForCharacter(characterId);
    const ability = available.find(a => a.name === abilityName);

    if (ability && !character.knownAbilities.includes(abilityName)) {
      character.knownAbilities.push(abilityName);
      // Auto-save after learning ability
      this.autoSave();
      return true;
    }
    return false;
  }

  /**
   * Learn a magical spell for a specific character
   */
  learnMagicalSpellForCharacter(characterId: string, spellName: string): boolean {
    const character = this.getCharacter(characterId);
    if (!character) return false;

    const available = this.getAvailableMagicalSpellsForCharacter(characterId);
    const spell = available.find(s => s.name === spellName);

    if (spell && !character.knownSpells.includes(spellName)) {
      character.knownSpells.push(spellName);
      // Auto-save after learning spell
      this.autoSave();
      return true;
    }
    return false;
  }

  /**
   * Get available physical abilities for a specific character
   */
  getAvailablePhysicalAbilitiesForCharacter(characterId: string): PhysicalAbility[] {
    const character = this.getCharacter(characterId);
    if (!character) return [];

    return this.physicalAbilities.getAvailableAbilities(
      character.level,
      character.stats,
      character.equipment,
      character.knownAbilities
    );
  }

  /**
   * Get available magical spells for a specific character
   */
  getAvailableMagicalSpellsForCharacter(characterId: string): MagicalSpell[] {
    const character = this.getCharacter(characterId);
    if (!character) return [];

    return this.magicalSpells.getAvailableSpells(
      character.level,
      character.stats,
      character.equipment,
      character.knownSpells
    );
  }

  /**
   * Helper methods for calculating character resources
   */
  private calculateMaxHitPoints(constitution: number, level: number): number {
    const baseHP = 20;
    const conBonus = Math.floor((constitution - 10) / 2);
    const levelBonus = (level - 1) * 5;
    return Math.max(1, baseHP + conBonus + levelBonus);
  }

  private calculateMaxStamina(constitution: number, level: number): number {
    const baseStamina = 10;
    const conBonus = Math.floor((constitution - 10) / 2);
    const levelBonus = (level - 1) * 3;
    return Math.max(1, baseStamina + conBonus + levelBonus);
  }

  private calculateMaxEther(intelligence: number, wisdom: number, level: number): number {
    const baseEther = 5;
    const intBonus = Math.floor((intelligence - 10) / 2);
    const wisBonus = Math.floor((wisdom - 10) / 2);
    const levelBonus = (level - 1) * 2;
    return Math.max(0, baseEther + intBonus + wisBonus + levelBonus);
  }
}