// Seeded random generation utilities for consistent world generation
export class SeededRandom {
  private seed: number;

  constructor(seed: string) {
    this.seed = this.hashString(seed);
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  // Generate seeded random number between 0 and 1
  next(): number {
    this.seed = (this.seed * 1664525 + 1013904223) % 4294967296;
    return this.seed / 4294967296;
  }

  // Generate random integer between min (inclusive) and max (exclusive)
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min)) + min;
  }

  // Pick random element from array
  pick<T>(array: T[]): T {
    return array[this.nextInt(0, array.length)];
  }

  // Shuffle array using Fisher-Yates algorithm
  shuffle<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = this.nextInt(0, i + 1);
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  // Generate random boolean with given probability (0-1)
  chance(probability: number): boolean {
    return this.next() < probability;
  }
}

// Quest generation data
export const QUEST_DATA = {
  types: ['delivery', 'rescue', 'elimination', 'exploration', 'escort', 'collection', 'investigation', 'diplomatic'],
  objectives: {
    delivery: ['Deliver a package', 'Transport goods', 'Carry a message', 'Bring supplies'],
    rescue: ['Save the prisoner', 'Rescue the merchant', 'Find the missing child', 'Free the captives'],
    elimination: ['Eliminate the threat', 'Clear the monsters', 'Defeat the bandit leader', 'Stop the cult'],
    exploration: ['Map the area', 'Find the ancient ruins', 'Discover the secret', 'Explore the dungeon'],
    escort: ['Protect the caravan', 'Guard the diplomat', 'Escort the noble', 'Safeguard the witness'],
    collection: ['Gather rare herbs', 'Collect magical components', 'Retrieve stolen items', 'Find the artifacts'],
    investigation: ['Solve the mystery', 'Uncover the truth', 'Find the culprit', 'Investigate the disappearance'],
    diplomatic: ['Negotiate peace', 'Establish trade', 'Arrange alliance', 'Mediate dispute']
  },
  locations: ['ancient ruins', 'dark forest', 'abandoned mine', 'mountain pass', 'haunted mansion', 'bandit camp', 'mystical grove', 'underground cavern'],
  rewards: ['gold coins', 'magical item', 'rare weapon', 'ancient scroll', 'precious gems', 'land deed', 'noble title', 'magical knowledge'],
  complications: ['time limit', 'rival party', 'dangerous weather', 'political intrigue', 'cursed location', 'false information', 'hostile locals', 'ancient guardian']
};

// NPC generation data
export const NPC_DATA = {
  personalities: ['friendly', 'suspicious', 'helpful', 'greedy', 'wise', 'eccentric', 'stern', 'cheerful', 'mysterious', 'ambitious'],
  occupations: ['merchant', 'guard', 'scholar', 'priest', 'blacksmith', 'innkeeper', 'farmer', 'noble', 'thief', 'hunter'],
  motivations: ['wealth', 'power', 'knowledge', 'family', 'revenge', 'justice', 'survival', 'fame', 'peace', 'adventure'],
  secrets: ['has hidden wealth', 'knows ancient lore', 'is secretly noble', 'has criminal past', 'possesses magic item', 'owes large debt', 'is hiding identity', 'has powerful enemy'],
  quirks: ['always hungry', 'speaks in riddles', 'collects trinkets', 'afraid of magic', 'never removes hat', 'hums constantly', 'counts everything', 'talks to animals']
};

// Treasure generation data
export const TREASURE_DATA = {
  types: ['weapon', 'armor', 'accessory', 'consumable', 'artifact', 'coin'],
  rarities: ['common', 'uncommon', 'rare', 'epic', 'legendary'],
  materials: ['iron', 'steel', 'silver', 'gold', 'mithril', 'adamantine', 'dragonscale', 'crystal'],
  enchantments: ['sharpness', 'protection', 'speed', 'strength', 'wisdom', 'luck', 'healing', 'fire', 'ice', 'lightning'],
  prefixes: ['Ancient', 'Blessed', 'Cursed', 'Enchanted', 'Flaming', 'Frozen', 'Glowing', 'Hidden', 'Mystical', 'Sacred'],
  suffixes: ['of Power', 'of Wisdom', 'of Speed', 'of Protection', 'of Flames', 'of Frost', 'of Lightning', 'of Healing', 'of Shadows', 'of Light']
};

// Settlement generation functions
export class SettlementGenerator {
  private rng: SeededRandom;

  constructor(seed: string, x: number, y: number) {
    this.rng = new SeededRandom(`${seed}-settlement-${x}-${y}`);
  }

  generate() {
    const types = ['city', 'town', 'village', 'outpost', 'trading_post'];
    const type = this.rng.pick(types);
    
    const nameComponents = {
      prefixes: ['Iron', 'Gold', 'Silver', 'Stone', 'Wood', 'River', 'Hill', 'Vale', 'North', 'South', 'East', 'West'],
      suffixes: ['hold', 'haven', 'ford', 'bury', 'ton', 'ham', 'stead', 'bridge', 'gate', 'peak', 'dale', 'brook']
    };
    
    const name = this.rng.pick(nameComponents.prefixes) + this.rng.pick(nameComponents.suffixes);
    
    const services = this.generateServices(type);
    const npcs = this.generateNPCs(type);
    
    return {
      name,
      type,
      population: this.getPopulation(type),
      services,
      npcs,
      description: this.generateDescription(name, type)
    };
  }

  private getPopulation(type: string): number {
    const ranges = {
      city: [5000, 20000],
      town: [1000, 5000],
      village: [100, 1000],
      outpost: [20, 100],
      trading_post: [50, 200]
    };
    const range = ranges[type as keyof typeof ranges] || [100, 1000];
    return this.rng.nextInt(range[0], range[1]);
  }

  private generateServices(type: string): string[] {
    const allServices = ['inn', 'blacksmith', 'general_store', 'temple', 'market', 'barracks', 'library', 'alchemist', 'stable', 'bank'];
    const serviceCount = type === 'city' ? 8 : type === 'town' ? 6 : type === 'village' ? 4 : 2;
    return this.rng.shuffle(allServices).slice(0, serviceCount);
  }

  private generateNPCs(type: string): Array<{name: string, occupation: string, personality: string, secret?: string}> {
    const npcCount = type === 'city' ? 5 : type === 'town' ? 3 : 2;
    const npcs = [];
    
    for (let i = 0; i < npcCount; i++) {
      npcs.push({
        name: this.generateNPCName(),
        occupation: this.rng.pick(NPC_DATA.occupations),
        personality: this.rng.pick(NPC_DATA.personalities),
        secret: this.rng.chance(0.3) ? this.rng.pick(NPC_DATA.secrets) : undefined
      });
    }
    
    return npcs;
  }

  private generateNPCName(): string {
    const firstNames = ['Gareth', 'Elena', 'Marcus', 'Aria', 'Thane', 'Vera', 'Aldric', 'Kira', 'Owen', 'Luna'];
    const lastNames = ['Blackwood', 'Silverstone', 'Ironforge', 'Goldleaf', 'Stormwind', 'Ravencrest', 'Thornfield', 'Ashworth'];
    return this.rng.pick(firstNames) + ' ' + this.rng.pick(lastNames);
  }

  private generateDescription(name: string, type: string): string {
    const descriptions = {
      city: `${name} is a bustling metropolis with towering walls and busy markets.`,
      town: `${name} is a prosperous town known for its skilled craftsmen and trade.`,
      village: `${name} is a quiet village where everyone knows each other.`,
      outpost: `${name} is a frontier outpost guarding the wilderness.`,
      trading_post: `${name} is a vital trading post connecting distant regions.`
    };
    return descriptions[type as keyof typeof descriptions] || `${name} is a settlement of some renown.`;
  }
}

// Quest generator
export class QuestGenerator {
  private rng: SeededRandom;

  constructor(seed: string, x: number, y: number) {
    this.rng = new SeededRandom(`${seed}-quest-${x}-${y}`);
  }

  generate() {
    const type = this.rng.pick(QUEST_DATA.types);
    const objective = this.rng.pick(QUEST_DATA.objectives[type as keyof typeof QUEST_DATA.objectives]);
    const location = this.rng.pick(QUEST_DATA.locations);
    const reward = this.rng.pick(QUEST_DATA.rewards);
    const complication = this.rng.chance(0.4) ? this.rng.pick(QUEST_DATA.complications) : null;
    
    return {
      title: this.generateTitle(objective, location),
      type,
      objective,
      location,
      reward,
      complication,
      description: this.generateDescription(objective, location, reward, complication),
      difficulty: this.rng.pick(['easy', 'medium', 'hard', 'epic'])
    };
  }

  private generateTitle(objective: string, location: string): string {
    const templates = [
      `The ${location} ${objective.split(' ').slice(-1)[0]}`,
      `${objective} at the ${location}`,
      `Quest for the ${location}`,
      `The ${location} Mystery`
    ];
    return this.rng.pick(templates);
  }

  private generateDescription(objective: string, location: string, reward: string, complication: string | null): string {
    let desc = `${objective} in the ${location}. `;
    desc += `Success will be rewarded with ${reward}. `;
    if (complication) {
      desc += `However, beware of ${complication}.`;
    }
    return desc;
  }
}

// Treasure generator
export class TreasureGenerator {
  private rng: SeededRandom;

  constructor(seed: string, x: number, y: number) {
    this.rng = new SeededRandom(`${seed}-treasure-${x}-${y}`);
  }

  generate() {
    const type = this.rng.pick(TREASURE_DATA.types);
    const rarity = this.rng.pick(TREASURE_DATA.rarities);
    
    if (type === 'coin') {
      return this.generateCoin(rarity);
    } else {
      return this.generateItem(type, rarity);
    }
  }

  private generateCoin(rarity: string) {
    const amounts = {
      common: [10, 50],
      uncommon: [50, 200],
      rare: [200, 1000],
      epic: [1000, 5000],
      legendary: [5000, 20000]
    };
    const range = amounts[rarity as keyof typeof amounts];
    const amount = this.rng.nextInt(range[0], range[1]);
    
    return {
      name: `${amount} Gold Coins`,
      type: 'coin',
      rarity,
      value: amount,
      description: `A pouch containing ${amount} gleaming gold coins.`
    };
  }

  private generateItem(type: string, rarity: string) {
    const material = this.rng.pick(TREASURE_DATA.materials);
    const prefix = this.rng.chance(0.6) ? this.rng.pick(TREASURE_DATA.prefixes) : '';
    const suffix = this.rng.chance(0.4) ? this.rng.pick(TREASURE_DATA.suffixes) : '';
    
    let baseName = `${material} ${type}`;
    if (prefix) baseName = `${prefix} ${baseName}`;
    if (suffix) baseName = `${baseName} ${suffix}`;
    
    return {
      name: baseName,
      type,
      rarity,
      material,
      enchantments: this.generateEnchantments(rarity),
      description: this.generateItemDescription(baseName, type, material, rarity)
    };
  }

  private generateEnchantments(rarity: string): string[] {
    const enchantmentCounts = {
      common: 0,
      uncommon: 1,
      rare: 2,
      epic: 3,
      legendary: 4
    };
    
    const count = enchantmentCounts[rarity as keyof typeof enchantmentCounts];
    if (count === 0) return [];
    
    return this.rng.shuffle(TREASURE_DATA.enchantments).slice(0, count);
  }

  private generateItemDescription(name: string, type: string, material: string, rarity: string): string {
    const descriptions = {
      common: `A simple ${material} ${type}.`,
      uncommon: `A well-crafted ${material} ${type} with minor magical properties.`,
      rare: `An expertly forged ${material} ${type} imbued with significant magic.`,
      epic: `A masterwork ${material} ${type} radiating powerful enchantments.`,
      legendary: `A legendary ${material} ${type} of incredible power and beauty.`
    };
    
    return descriptions[rarity as keyof typeof descriptions] || `A ${material} ${type}.`;
  }
}