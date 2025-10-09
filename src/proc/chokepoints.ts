/**
 * Choke Points & Fortifications System
 * 
 * Creates natural progression barriers with fortified dungeons that must be
 * completed to access more dangerous regions. Implements:
 * - Natural chokepoints (bridges, passes, straits)
 * - Fortified dungeons as progression gates
 * - Difficulty scaling based on distance from start
 * - Strategic placement to control world flow
 */

import { WorldNoise, SeededRandom } from './noise';
import { PhysicalAbilitiesGenerator } from './physicalAbilities';
import { MagicalSpellsGenerator } from './magicalSpells';
import type { Tile, BiomeType } from './chunks';

export interface Chokepoint {
  x: number;
  y: number;
  type: ChokepointType;
  width: number; // How many tiles wide the chokepoint spans
  fortified: boolean;
  fortification?: Fortification;
  controlsAccess: string[]; // Regions this chokepoint guards access to
}

export type ChokepointType = 
  | 'bridge'      // River crossing
  | 'pass'        // Mountain pass
  | 'strait'      // Narrow water crossing
  | 'canyon'      // Canyon crossing
  | 'tunnel'      // Underground passage
  | 'gate';       // Artificial barrier

export interface Fortification {
  name: string;
  level: number;           // 1-10 difficulty level
  type: FortificationType;
  garrison: number;        // Enemy strength
  requiredLevel: number;   // Recommended party level
  requiredGear: string[];  // Equipment needed (bridges, climbing gear, etc.)
  rewards: FortificationReward[];
  cleared: boolean;
  description: string;
}

export type FortificationType = 
  | 'keep'        // Stone fortress
  | 'watchtower'  // Tall defensive tower
  | 'wall'        // Fortified wall with gate
  | 'barricade'   // Wooden/stone barrier
  | 'outpost'     // Military outpost
  | 'citadel';    // Massive fortress complex

export interface FortificationReward {
  type: 'gold' | 'equipment' | 'spell' | 'key' | 'passage';
  name: string;
  value: number;
  description: string;
}

export interface RegionData {
  centerX: number;
  centerY: number;
  radius: number;
  difficultyLevel: number;
  biomePreference: BiomeType[];
  name: string;
  description: string;
}

export class ChokepointManager {
  private noise: WorldNoise;
  private rng: SeededRandom;
  private physicalAbilities!: PhysicalAbilitiesGenerator;
  private magicalSpells!: MagicalSpellsGenerator;
  private chokepoints: Map<string, Chokepoint> = new Map();
  private regions: RegionData[] = [];
  private mapWidth: number;
  private mapHeight: number;
  private startX: number;
  private startY: number;

  constructor(
    seed: string,
    mapWidth: number,
    mapHeight: number,
    startX: number,
    startY: number
  ) {
    try {
      console.log('Initializing ChokepointManager with:', { seed, mapWidth, mapHeight, startX, startY });
      
      this.noise = new WorldNoise(seed);
      this.rng = new SeededRandom(`${seed}_chokepoints`);
      this.physicalAbilities = new PhysicalAbilitiesGenerator(`${seed}_abilities`);
      this.magicalSpells = new MagicalSpellsGenerator(`${seed}_spells`);
      this.mapWidth = mapWidth;
      this.mapHeight = mapHeight;
      this.startX = startX;
      this.startY = startY;

      console.log('Generating regions...');
      this.generateRegions();
      
      console.log('Identifying chokepoints...');
      this.identifyChokepoints();
      
      console.log('Placing fortifications...');
      this.placeFortifications();
      
      console.log(`ChokepointManager initialized with ${this.regions.length} regions and ${this.chokepoints.size} chokepoints`);
    } catch (error) {
      console.error('Error in ChokepointManager constructor:', error);
      // Initialize safe defaults
      this.noise = new WorldNoise(seed);
      this.rng = new SeededRandom(`${seed}_chokepoints`);
      this.mapWidth = mapWidth;
      this.mapHeight = mapHeight;
      this.startX = startX;
      this.startY = startY;
      this.regions = [];
      this.chokepoints = new Map();
    }
  }

  /**
   * Generate difficulty regions based on distance from start
   */
  private generateRegions(): void {
    try {
      const _numRegions = this.rng.nextInt(6, 12);
      const centerDistance = Math.min(this.mapWidth, this.mapHeight) / 4;

      // Always create a safe starting region
      this.regions.push({
        centerX: this.startX,
        centerY: this.startY,
        radius: centerDistance * 0.6,
        difficultyLevel: 1,
        biomePreference: ['Grass', 'Forest', 'Coast'],
        name: 'The Heartlands',
        description: 'Peaceful starting region with friendly settlements and basic resources.'
      });

      // Create rings of increasing difficulty
      const difficultyRings = [
        { distance: centerDistance * 1.2, level: 2, count: 3 },
        { distance: centerDistance * 1.8, level: 4, count: 4 },
        { distance: centerDistance * 2.5, level: 6, count: 3 },
        { distance: centerDistance * 3.2, level: 8, count: 2 },
      ];

      for (const ring of difficultyRings) {
        for (let i = 0; i < ring.count; i++) {
          try {
            const angle = (Math.PI * 2 * i) / ring.count + this.rng.nextFloat(-0.3, 0.3);
            const distance = ring.distance * this.rng.nextFloat(0.8, 1.2);
            
            const centerX = this.startX + Math.cos(angle) * distance;
            const centerY = this.startY + Math.sin(angle) * distance;

            // Keep within map bounds with safety margin
            const margin = 100;
            const clampedX = Math.max(margin, Math.min(this.mapWidth - margin, centerX));
            const clampedY = Math.max(margin, Math.min(this.mapHeight - margin, centerY));

            this.regions.push({
              centerX: clampedX,
              centerY: clampedY,
              radius: centerDistance * 0.4,
              difficultyLevel: ring.level,
              biomePreference: this.getBiomesForDifficulty(ring.level),
              name: this.generateRegionName(ring.level),
              description: this.generateRegionDescription(ring.level)
            });
          } catch (error) {
            console.warn('Error generating region in ring:', ring, error);
          }
        }
      }
      
      console.log(`Generated ${this.regions.length} regions`);
    } catch (error) {
      console.error('Error in generateRegions:', error);
      // Ensure at least one region exists
      if (this.regions.length === 0) {
        this.regions.push({
          centerX: this.startX,
          centerY: this.startY,
          radius: 500,
          difficultyLevel: 1,
          biomePreference: ['Grass', 'Forest'],
          name: 'The Starting Lands',
          description: 'A safe region for new adventurers.'
        });
      }
    }
  }

  /**
   * Get appropriate biomes for difficulty level
   */
  private getBiomesForDifficulty(level: number): BiomeType[] {
    if (level <= 2) return ['Grass', 'Forest', 'Coast', 'Savanna'];
    if (level <= 4) return ['Forest', 'Taiga', 'Swamp', 'Mountain'];
    if (level <= 6) return ['Mountain', 'Desert', 'Tundra', 'Jungle'];
    return ['Mountain', 'Snow', 'Desert', 'Tundra'];
  }

  /**
   * Generate region names based on difficulty
   */
  private generateRegionName(level: number): string {
    const names = {
      2: ['The Borderlands', 'Merchant\'s Rest', 'The Greenwood', 'Pilgrim\'s Path'],
      4: ['The Wildlands', 'Thornmarch', 'The Disputed Lands', 'Ravenwood'],
      6: ['The Bleaklands', 'Dragonspine Mountains', 'The Cursed Marsh', 'Doomheath'],
      8: ['The Shattered Realms', 'The Bone Wastes', 'Hellfire Peaks', 'The Dread Expanse'],
      10: ['The Void Touched', 'World\'s End', 'The Final Dark', 'Apocalypse Gate']
    };
    
    const levelNames = names[level as keyof typeof names] || names[8];
    return this.rng.pick(levelNames);
  }

  /**
   * Generate region descriptions
   */
  private generateRegionDescription(level: number): string {
    const descriptions = {
      2: 'A frontier region with scattered settlements and minor dangers.',
      4: 'Dangerous wilderness requiring caution and proper preparation.',
      6: 'Hostile territory where only experienced adventurers survive.',
      8: 'A realm of nightmares where death lurks behind every shadow.',
      10: 'The ultimate challenge - where legends are born or die.'
    };
    
    return descriptions[level as keyof typeof descriptions] || descriptions[8];
  }

  /**
   * Identify natural chokepoints between regions
   */
  private identifyChokepoints(): void {
    try {
      console.log('Starting chokepoint identification...');
      let chokepointsFound = 0;
      
      // For each region pair, find potential chokepoints
      for (let i = 0; i < this.regions.length; i++) {
        for (let j = i + 1; j < this.regions.length; j++) {
          try {
            const regionA = this.regions[i];
            const regionB = this.regions[j];
            
            // Only create chokepoints between adjacent difficulty levels
            const levelDiff = Math.abs(regionA.difficultyLevel - regionB.difficultyLevel);
            if (levelDiff <= 1 && levelDiff > 0) {
              const found = this.findChokepointsBetweenRegions(regionA, regionB);
              chokepointsFound += found;
            }
          } catch (error) {
            console.warn('Error finding chokepoints between regions:', i, j, error);
          }
        }
      }
      
      console.log(`Found ${chokepointsFound} chokepoints between ${this.regions.length} regions`);
    } catch (error) {
      console.error('Error in identifyChokepoints:', error);
    }
  }

  /**
   * Find natural chokepoints between two regions
   */
  private findChokepointsBetweenRegions(regionA: RegionData, regionB: RegionData): number {
    try {
      const dx = regionB.centerX - regionA.centerX;
      const dy = regionB.centerY - regionA.centerY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Sample points along the line between regions
      const samples = Math.max(5, Math.min(20, Math.floor(distance / 20))); // Limit samples
      let chokepointsFound = 0;
      
      for (let i = 1; i < samples; i++) {
        try {
          const t = i / samples;
          const x = Math.floor(regionA.centerX + dx * t);
          const y = Math.floor(regionA.centerY + dy * t);
          
          // Bounds check
          if (x >= 0 && x < this.mapWidth && y >= 0 && y < this.mapHeight) {
            if (this.isNaturalChokepoint(x, y)) {
              const type = this.determineChokepointType(x, y);
              const width = this.calculateChokepointWidth(x, y, type);
              
              const chokepoint: Chokepoint = {
                x,
                y,
                type,
                width,
                fortified: false,
                controlsAccess: [regionB.name],
                fortification: undefined
              };
              
              this.chokepoints.set(`${x},${y}`, chokepoint);
              chokepointsFound++;
            }
          }
        } catch (error) {
          console.warn('Error processing chokepoint sample:', i, error);
        }
      }
      
      return chokepointsFound;
    } catch (error) {
      console.error('Error in findChokepointsBetweenRegions:', error);
      return 0;
    }
  }

  /**
   * Check if a location is a natural chokepoint
   */
  private isNaturalChokepoint(x: number, y: number): boolean {
    try {
      const elevation = this.noise.getElevation(x, y);
      const moisture = this.noise.getMoisture(x, y, elevation);
      
      // Basic validation
      if (isNaN(elevation) || isNaN(moisture)) {
        return false;
      }
      
      // Check for narrow land bridges (elevation drops on both sides)
      const surroundingElevations = [];
      for (let dx = -3; dx <= 3; dx++) {
        for (let dy = -3; dy <= 3; dy++) {
          if (dx === 0 && dy === 0) continue;
          
          const checkX = x + dx;
          const checkY = y + dy;
          
          // Bounds check
          if (checkX >= 0 && checkX < this.mapWidth && checkY >= 0 && checkY < this.mapHeight) {
            const checkElevation = this.noise.getElevation(checkX, checkY);
            if (!isNaN(checkElevation)) {
              surroundingElevations.push(checkElevation);
            }
          }
        }
      }
      
      if (surroundingElevations.length === 0) {
        return false;
      }
      
      const avgSurrounding = surroundingElevations.reduce((a, b) => a + b, 0) / surroundingElevations.length;
      
      // Mountain passes (high elevation with lower surroundings)
      if (elevation > 0.6 && avgSurrounding < elevation - 0.2) {
        return true;
      }
      
      // River crossings (specific moisture/elevation patterns)
      if (elevation > 0.35 && elevation < 0.5 && moisture > 0.7) {
        // Check if this looks like a river valley
        const eastWestDiff = Math.abs(
          this.getElevationSafe(x - 2, y) - this.getElevationSafe(x + 2, y)
        );
        const northSouthDiff = Math.abs(
          this.getElevationSafe(x, y - 2) - this.getElevationSafe(x, y + 2)
        );
        
        if (Math.max(eastWestDiff, northSouthDiff) > 0.1) {
          return true;
        }
      }
      
      // Narrow straits (almost sea level with water nearby)
      if (elevation > 0.32 && elevation < 0.42) {
        let nearbyWater = 0;
        for (let dx = -2; dx <= 2; dx++) {
          for (let dy = -2; dy <= 2; dy++) {
            if (this.getElevationSafe(x + dx, y + dy) < 0.35) {
              nearbyWater++;
            }
          }
        }
        
        if (nearbyWater > 15) { // Surrounded by water
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.warn('Error checking natural chokepoint at', x, y, ':', error);
      return false;
    }
  }
  
  /**
   * Safe elevation getter with bounds checking
   */
  private getElevationSafe(x: number, y: number): number {
    if (x < 0 || x >= this.mapWidth || y < 0 || y >= this.mapHeight) {
      return 0.5; // Default elevation for out-of-bounds
    }
    try {
      return this.noise.getElevation(x, y);
    } catch (error) {
      return 0.5;
    }
  }

  /**
   * Determine what type of chokepoint this is
   */
  private determineChokepointType(x: number, y: number): ChokepointType {
    const elevation = this.noise.getElevation(x, y);
    const moisture = this.noise.getMoisture(x, y, elevation);
    
    if (elevation > 0.6) return 'pass';
    if (elevation < 0.4 && moisture > 0.7) return 'bridge';
    if (elevation < 0.42) return 'strait';
    if (elevation > 0.5 && moisture < 0.3) return 'canyon';
    
    return this.rng.pick(['bridge', 'pass', 'canyon'] as const);
  }

  /**
   * Calculate how wide the chokepoint is
   */
  private calculateChokepointWidth(x: number, y: number, type: ChokepointType): number {
    const baseWidths = {
      bridge: 2,
      pass: 4,
      strait: 3,
      canyon: 3,
      tunnel: 2,
      gate: 5
    };
    
    const baseWidth = baseWidths[type];
    return baseWidth + this.rng.nextInt(-1, 2);
  }

  /**
   * Place fortifications at strategic chokepoints
   */
  private placeFortifications(): void {
    try {
      console.log('Starting fortification placement...');
      
      const sortedChokepoints = Array.from(this.chokepoints.values())
        .sort((a, b) => {
          const distA = this.getDistanceFromStart(a.x, a.y);
          const distB = this.getDistanceFromStart(b.x, b.y);
          return distA - distB;
        });

      // Fortify key chokepoints based on distance and strategic value
      let fortificationCount = 0;
      const maxFortifications = Math.min(8, sortedChokepoints.length);

      for (const chokepoint of sortedChokepoints) {
        if (fortificationCount >= maxFortifications) break;
        
        try {
          const distance = this.getDistanceFromStart(chokepoint.x, chokepoint.y);
          const shouldFortify = this.shouldPlaceFortification(chokepoint, distance);
          
          if (shouldFortify) {
            const difficulty = this.calculateFortificationDifficulty(distance);
            chokepoint.fortified = true;
            chokepoint.fortification = this.createFortification(chokepoint, difficulty);
            fortificationCount++;
          }
        } catch (error) {
          console.warn('Error placing fortification at chokepoint:', chokepoint, error);
        }
      }
      
      console.log(`Placed ${fortificationCount} fortifications out of ${sortedChokepoints.length} chokepoints`);
    } catch (error) {
      console.error('Error in placeFortifications:', error);
    }
  }

  /**
   * Calculate distance from starting position
   */
  private getDistanceFromStart(x: number, y: number): number {
    const dx = x - this.startX;
    const dy = y - this.startY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Determine if a chokepoint should have a fortification
   */
  private shouldPlaceFortification(chokepoint: Chokepoint, distance: number): boolean {
    // Always fortify chokepoints that are key progression gates
    const minDistance = Math.min(this.mapWidth, this.mapHeight) / 8;
    
    if (distance < minDistance) return false; // Too close to start
    
    // Prioritize narrow chokepoints
    if (chokepoint.width <= 2) return true;
    
    // Fortify based on strategic importance
    const strategicValue = this.calculateStrategicValue(chokepoint);
    const roll = this.rng.nextFloat();
    
    return roll < strategicValue;
  }

  /**
   * Calculate strategic value of a chokepoint
   */
  private calculateStrategicValue(chokepoint: Chokepoint): number {
    let value = 0.3; // Base value
    
    // Narrow passages are more strategic
    value += (5 - chokepoint.width) * 0.1;
    
    // Mountain passes and bridges are highly strategic
    if (chokepoint.type === 'pass' || chokepoint.type === 'bridge') {
      value += 0.3;
    }
    
    // Bonus for controlling access to multiple regions
    value += chokepoint.controlsAccess.length * 0.2;
    
    return Math.min(0.9, value);
  }

  /**
   * Calculate fortification difficulty based on distance
   */
  private calculateFortificationDifficulty(distance: number): number {
    const maxDistance = Math.sqrt(this.mapWidth * this.mapWidth + this.mapHeight * this.mapHeight) / 2;
    const normalized = distance / maxDistance;
    
    return Math.max(1, Math.min(10, Math.floor(normalized * 8) + 1));
  }

  /**
   * Create a fortification for a chokepoint
   */
  private createFortification(chokepoint: Chokepoint, difficulty: number): Fortification {
    const _types: FortificationType[] = ['keep', 'watchtower', 'wall', 'barricade', 'outpost', 'citadel'];
    const type = difficulty >= 8 ? 'citadel' : 
                 difficulty >= 6 ? 'keep' :
                 difficulty >= 4 ? 'wall' :
                 difficulty >= 2 ? 'watchtower' : 'barricade';

    const names = this.generateFortificationNames(type, difficulty);
    const name = this.rng.pick(names);
    
    return {
      name,
      level: difficulty,
      type,
      garrison: difficulty * 10 + this.rng.nextInt(5, 15),
      requiredLevel: Math.max(1, difficulty - 1),
      requiredGear: this.getRequiredGear(chokepoint, difficulty),
      rewards: this.generateRewards(difficulty),
      cleared: false,
      description: this.generateFortificationDescription(name, type, chokepoint)
    };
  }

  /**
   * Generate fortification names
   */
  private generateFortificationNames(type: FortificationType, difficulty: number): string[] {
    const prefixes = difficulty >= 6 ? 
      ['Dread', 'Death', 'Shadow', 'Doom', 'Blood', 'Iron', 'Dark'] :
      ['Stone', 'Iron', 'Grey', 'Old', 'High', 'White', 'Red'];
    
    const suffixes = {
      keep: ['Keep', 'Hold', 'Fort', 'Stronghold'],
      watchtower: ['Tower', 'Spire', 'Watch', 'Beacon'],
      wall: ['Wall', 'Gate', 'Barrier', 'Passage'],
      barricade: ['Barricade', 'Block', 'Obstruction'],
      outpost: ['Outpost', 'Station', 'Checkpoint'],
      citadel: ['Citadel', 'Fortress', 'Bastion', 'Stronghold']
    };
    
    const typeNames = suffixes[type];
    const names = [];
    
    for (const prefix of prefixes.slice(0, 3)) {
      for (const suffix of typeNames) {
        names.push(`${prefix} ${suffix}`);
      }
    }
    
    return names;
  }

  /**
   * Get required gear for a fortification
   */
  private getRequiredGear(chokepoint: Chokepoint, difficulty: number): string[] {
    const gear = [];
    
    if (chokepoint.type === 'bridge' || chokepoint.type === 'strait') {
      if (difficulty >= 3) gear.push('rope');
      if (difficulty >= 5) gear.push('boat');
    }
    
    if (chokepoint.type === 'pass' || chokepoint.type === 'canyon') {
      if (difficulty >= 2) gear.push('climbing_gear');
      if (difficulty >= 6) gear.push('cold_weather_gear');
    }
    
    if (difficulty >= 4) gear.push('siege_equipment');
    if (difficulty >= 7) gear.push('magical_weapons');
    
    return gear;
  }

  /**
   * Generate rewards for clearing a fortification
   */
  private generateRewards(difficulty: number): FortificationReward[] {
    const rewards = [];
    
    // Gold reward scales with difficulty
    rewards.push({
      type: 'gold' as const,
      name: 'Garrison Treasury',
      value: difficulty * 100 + this.rng.nextInt(50, 150),
      description: 'Gold looted from the defeated garrison.'
    });
    
    // Equipment rewards
    if (difficulty >= 3) {
      rewards.push({
        type: 'equipment' as const,
        name: this.generateEquipmentName(difficulty),
        value: difficulty,
        description: 'High-quality equipment from the fortress armory.'
      });
    }
    
    // Spell scrolls for higher difficulty
    if (difficulty >= 5) {
      const spellScroll = this.magicalSpells.generateSpellScroll(difficulty);
      rewards.push({
        type: 'spell' as const,
        name: spellScroll.name,
        value: difficulty,
        description: spellScroll.description
      });
    }
    
    // Physical ability manuals for mid-to-high difficulty
    if (difficulty >= 4) {
      const abilityScroll = this.physicalAbilities.generateAbilityScroll(difficulty);
      rewards.push({
        type: 'spell' as const, // Using spell type for now, could create 'ability' type later
        name: abilityScroll.name,
        value: difficulty,
        description: abilityScroll.description
      });
    }
    
    // Key items for progression
    if (difficulty >= 4) {
      rewards.push({
        type: 'key' as const,
        name: `Key to the ${this.rng.pick(['Eastern', 'Northern', 'Western', 'Southern'])} Passage`,
        value: 1,
        description: 'Opens access to previously blocked routes.'
      });
    }
    
    return rewards;
  }

  /**
   * Generate equipment names
   */
  private generateEquipmentName(difficulty: number): string {
    const prefixes = difficulty >= 6 ? 
      ['Legendary', 'Mythic', 'Divine', 'Runic'] :
      ['Fine', 'Masterwork', 'Enchanted', 'Superior'];
    
    const items = ['Sword', 'Shield', 'Armor', 'Bow', 'Staff', 'Hammer', 'Axe'];
    
    return `${this.rng.pick(prefixes)} ${this.rng.pick(items)}`;
  }

  /**
   * Generate spell names
   */
  private generateSpellName(difficulty: number): string {
    const power = difficulty >= 8 ? 'Greater' : difficulty >= 6 ? 'Major' : 'Lesser';
    const effects = ['Fireball', 'Lightning Bolt', 'Ice Storm', 'Healing', 'Barrier', 'Teleport'];
    
    return `${power} ${this.rng.pick(effects)}`;
  }

  /**
   * Generate fortification descriptions
   */
  private generateFortificationDescription(name: string, type: FortificationType, chokepoint: Chokepoint): string {
    const typeDescriptions = {
      keep: 'A massive stone fortress',
      watchtower: 'A tall defensive tower',
      wall: 'A fortified wall with iron gates',
      barricade: 'A sturdy wooden barrier',
      outpost: 'A military checkpoint',
      citadel: 'An impregnable fortress complex'
    };
    
    const locationDescriptions = {
      bridge: 'guarding the only safe river crossing',
      pass: 'controlling the mountain pass',
      strait: 'watching over the narrow strait',
      canyon: 'blocking the canyon passage',
      tunnel: 'sealing the underground route',
      gate: 'barring the ancient gateway'
    };
    
    return `${typeDescriptions[type]} ${locationDescriptions[chokepoint.type]}. The ${name} has stood for centuries, its garrison ensuring that only the worthy may pass.`;
  }

  /**
   * Get all chokepoints
   */
  getChokepoints(): Chokepoint[] {
    return Array.from(this.chokepoints.values());
  }

  /**
   * Get chokepoint at specific location
   */
  getChokepointAt(x: number, y: number): Chokepoint | undefined {
    return this.chokepoints.get(`${x},${y}`);
  }

  /**
   * Get all regions
   */
  getRegions(): RegionData[] {
    return this.regions;
  }

  /**
   * Get region containing a point
   */
  getRegionAt(x: number, y: number): RegionData | undefined {
    for (const region of this.regions) {
      const dx = x - region.centerX;
      const dy = y - region.centerY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance <= region.radius) {
        return region;
      }
    }
    
    return undefined;
  }

  /**
   * Check if a route between two points is blocked by fortifications
   */
  isRouteBlocked(fromX: number, fromY: number, toX: number, toY: number): Chokepoint[] {
    const blockedBy = [];
    const dx = toX - fromX;
    const dy = toY - fromY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const steps = Math.floor(distance);
    
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = Math.floor(fromX + dx * t);
      const y = Math.floor(fromY + dy * t);
      
      const chokepoint = this.getChokepointAt(x, y);
      if (chokepoint?.fortified && !chokepoint.fortification?.cleared) {
        blockedBy.push(chokepoint);
      }
    }
    
    return blockedBy;
  }

  /**
   * Clear a fortification (mark as completed)
   */
  clearFortification(x: number, y: number): boolean {
    const chokepoint = this.getChokepointAt(x, y);
    if (chokepoint?.fortification && !chokepoint.fortification.cleared) {
      chokepoint.fortification.cleared = true;
      return true;
    }
    return false;
  }
}