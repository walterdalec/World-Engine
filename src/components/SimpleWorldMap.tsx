import React, { useEffect, useState } from "react";
import { SettlementGenerator, QuestGenerator, TreasureGenerator, SeededRandom } from "../seededGenerators";
import ExplorationMode from "./ExplorationMode";

interface Settlement {
  type: 'city' | 'town' | 'village' | 'hut' | 'shrine' | 'outpost' | 'trading_post';
  name: string;
  population: number;
  faction?: string;
  description: string;
  emoji: string;
  services?: string[];
  npcs?: Array<{name: string, occupation: string, personality: string, secret?: string}>;
}

interface Encounter {
  type: 'creature' | 'treasure' | 'event' | 'faction' | 'mystery' | 'quest';
  name: string;
  description: string;
  emoji: string;
  danger: 'safe' | 'low' | 'medium' | 'high' | 'extreme';
  quest?: any;
  treasure?: any;
}

interface SimpleWorldMapProps {
  seedStr?: string;
  onBack?: () => void;
}

export default function SimpleWorldMap({ seedStr = "verdance-seed-001", onBack }: SimpleWorldMapProps) {
  const [playerPos, setPlayerPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [selected, setSelected] = useState<{ x: number; y: number } | null>(null);
  const [viewportOffset, setViewportOffset] = useState<{ x: number; y: number }>({ 
    x: -7, // Center on player (0,0) with 15x15 viewport 
    y: -7 
  });
  const [activeEncounter, setActiveEncounter] = useState<Encounter | null>(null);
  const [activeSettlement, setActiveSettlement] = useState<Settlement | null>(null);
  const [inExploration, setInExploration] = useState<boolean>(false);
  const [playerCharacters, setPlayerCharacters] = useState<any[]>([]);

  // Load player characters from localStorage on component mount
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('world-engine-saved-characters') || '[]');
      setPlayerCharacters(saved.slice(0, 4)); // Maximum of 4 characters for party
    } catch (error) {
      console.error('Error loading saved characters:', error);
      // Create default character if none exist
      setPlayerCharacters([{
        name: "Adventurer",
        class: "Fighter",
        baseStats: { strength: 15, constitution: 14, wisdom: 12, intelligence: 10, dexterity: 13, charisma: 11 },
        finalStats: { strength: 15, constitution: 14, wisdom: 12, intelligence: 10, dexterity: 13, charisma: 11 },
        hitPoints: 20,
        level: 1,
        knownSpells: [],
        knownCantrips: []
      }]);
    }
  }, []);

  const viewportSize = 15;

  const seededRandom = (x: number, y: number, seed: string) => {
    const str = `${seed}-${x}-${y}`;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash) / 2147483647;
  };

  const getBiome = (x: number, y: number) => {
    const biomes = [
      { name: "Ocean", color: "#0ea5e9", emoji: "🌊" },
      { name: "Coast", color: "#38bdf8", emoji: "🏖️" },
      { name: "Desert", color: "#eab308", emoji: "🏜️" },
      { name: "Grass", color: "#84cc16", emoji: "🌱" },
      { name: "Forest", color: "#16a34a", emoji: "🌲" },
      { name: "Mountain", color: "#64748b", emoji: "⛰️" },
      { name: "Swamp", color: "#10b981", emoji: "🪵" },
      { name: "Jungle", color: "#065f46", emoji: "🌴" },
      { name: "Taiga", color: "#0e7490", emoji: "🌲" },
      { name: "Tundra", color: "#94a3b8", emoji: "🧊" },
      { name: "Savanna", color: "#f59e0b", emoji: "🌾" },
      { name: "Snow", color: "#e2e8f0", emoji: "❄️" },
    ];

    const noise1 = seededRandom(x, y, seedStr + "n1") * 2 - 1;
    const noise2 = seededRandom(Math.floor(x * 0.5), Math.floor(y * 0.5), seedStr + "n2") * 2 - 1;
    const combinedNoise = (noise1 + noise2 * 0.5) * 1.5;
    
    const distFromOrigin = Math.sqrt(x * x + y * y) + combinedNoise;
    const latitude = y + combinedNoise * 2;
    
    if (distFromOrigin > 25) return biomes[0];
    if (distFromOrigin > 22) return biomes[1];
    if (latitude < -15) return distFromOrigin > 12 ? biomes[9] : biomes[11];
    if (latitude > 15) return Math.abs(x + noise1 * 3) > 8 ? biomes[2] : biomes[7];
    
    const mountainNoise = seededRandom(Math.floor(x * 0.3), Math.floor(y * 0.3), seedStr + "mtn");
    if (mountainNoise > 0.7 || Math.abs(x + noise2 * 2) > 18) return biomes[5];
    
    if (Math.abs(latitude) < 5) {
      if (Math.abs(x + noise1) < 3) return biomes[3];
      if (Math.abs(x) < 12) return biomes[4];
    }
    
    if (latitude > 5 && latitude < 15) return x + noise2 * 2 > 0 ? biomes[10] : biomes[6];
    if (latitude < -5 && latitude > -15) return biomes[8];
    
    return biomes[3];
  };

  // Verdance factions and their territories
  const factions = [
    { name: "Hollowshade Clan", color: "#065f46", territory: "Forest,Swamp,Jungle" },
    { name: "Valebright Court", color: "#16a34a", territory: "Grass,Forest" },
    { name: "Thornweave Syndicate", color: "#374151", territory: "Forest,Mountain,Taiga" },
    { name: "The Rootspeakers", color: "#84cc16", territory: "Any" }
  ];

  // Fixed Verdance Campaign Locations
  const verdanceCampaignLocations = {
    // Road network connecting major settlements (straight lines only)
    roads: [
      // Main roads from Rootspire (capital) - horizontal and vertical only
      { from: { x: 0, y: 0 }, to: { x: -5, y: 0 }, name: "West Road" }, // Rootspire west
      { from: { x: -5, y: 0 }, to: { x: -5, y: 3 }, name: "Shadow Road" }, // Turn north to Shadowvale
      
      { from: { x: 0, y: 0 }, to: { x: 4, y: 0 }, name: "East Road" }, // Rootspire east  
      { from: { x: 4, y: 0 }, to: { x: 4, y: -2 }, name: "Bright Way" }, // Turn south to Brightmeadow
      
      { from: { x: 0, y: 0 }, to: { x: 0, y: -6 }, name: "South Road" }, // Rootspire south
      { from: { x: 0, y: -6 }, to: { x: -2, y: -6 }, name: "Thorn Path" }, // Turn west to Thornwall
      
      // Secondary roads - all straight lines
      { from: { x: -5, y: 3 }, to: { x: -8, y: 3 }, name: "Umbral Trail" }, // West to Umbral Watch (moved to y: 3)
      { from: { x: -8, y: 3 }, to: { x: -8, y: -1 }, name: "Umbral Trail" }, // South to Umbral Watch
      
      { from: { x: 4, y: -2 }, to: { x: 6, y: -2 }, name: "Brook Trail" }, // East from Brightmeadow
      { from: { x: 6, y: -2 }, to: { x: 6, y: 5 }, name: "Brook Trail" }, // North to Mistbrook
      
      { from: { x: 0, y: 0 }, to: { x: 0, y: 7 }, name: "Pilgrimage Path" }, // North to Grove (extended)
      { from: { x: 0, y: 7 }, to: { x: 3, y: 7 }, name: "Pilgrimage Path" }, // East to Grove
      
      // Trade route - straight segments
      { from: { x: -2, y: -6 }, to: { x: 4, y: -6 }, name: "Merchant's Route" }, // Horizontal connection
      { from: { x: 4, y: -6 }, to: { x: 4, y: -2 }, name: "Merchant's Route" }, // Vertical to Brightmeadow
    ],
    
    // Major Settlements
    settlements: [
      { x: 0, y: 0, type: 'city', name: 'Rootspire', population: 12000, faction: 'The Rootspeakers', 
        description: 'The great tree-city where ancient roots form living architecture. Center of Verdance civilization.', 
        emoji: '🏰', services: ['Market', 'Inn', 'Temple', 'Guild Hall', 'Library'] },
      
      { x: -5, y: 3, type: 'town', name: 'Shadowvale', population: 2500, faction: 'Hollowshade Clan', 
        description: 'A town built within the hollow of a massive dead tree, shrouded in perpetual twilight.', 
        emoji: '🏘️', services: ['Market', 'Inn', 'Shadow Temple'] },
      
      { x: 4, y: -2, type: 'town', name: 'Brightmeadow', population: 3200, faction: 'Valebright Court', 
        description: 'A gleaming settlement of crystal greenhouses and manicured gardens.', 
        emoji: '🏘️', services: ['Market', 'Inn', 'Temple', 'Botanical Gardens'] },
      
      { x: -2, y: -6, type: 'village', name: 'Thornwall', population: 450, faction: 'Thornweave Syndicate', 
        description: 'A fortified trading post surrounded by massive thorn barriers.', 
        emoji: '🏡', services: ['Trading Post', 'Armory'] },
      
      { x: 6, y: 5, type: 'village', name: 'Mistbrook', population: 280, faction: 'The Rootspeakers', 
        description: 'A peaceful fishing village by a spirit-touched stream.', 
        emoji: '🏡', services: ['Inn', 'Shrine'] },
      
      { x: -8, y: -1, type: 'outpost', name: 'Umbral Watch', population: 45, faction: 'Hollowshade Clan', 
        description: 'A remote watchtower monitoring the deep shadow forests.', 
        emoji: '⚔️', services: ['Armory', 'Supplies'] },
      
      { x: 3, y: 7, type: 'shrine', name: 'Grove of First Growth', population: 12, faction: 'The Rootspeakers', 
        description: 'The sacred site where the first spirit plant bloomed.', 
        emoji: '🌳', services: ['Sacred Grove', 'Pilgrimage'] }
    ],
    
    // Safe road encounters (scripted, story-driven)
    roadEncounters: [
      { x: -2, y: 1, type: 'faction', name: 'Rootspeaker Patrol', 
        description: 'Friendly guards ensuring safe passage along the main roads.', 
        emoji: '🛡️', danger: 'safe' },
      
      { x: 2, y: -1, type: 'faction', name: 'Traveling Merchants', 
        description: 'A caravan of traders with goods from distant settlements.', 
        emoji: '🎒', danger: 'safe' },
      
      { x: -3, y: 2, type: 'event', name: 'Road Shrine', 
        description: 'A small wayside shrine where travelers leave offerings.', 
        emoji: '⛩️', danger: 'safe' },
      
      { x: 1, y: -3, type: 'faction', name: 'Courier Station', 
        description: 'A rest stop where messages are exchanged between settlements.', 
        emoji: '📫', danger: 'safe' }
    ],
    
    // Dangerous wilderness encounters (off the beaten path)
    wildernessEncounters: [
      { x: 1, y: 2, type: 'mystery', name: 'The Whispering Oak', 
        description: 'An ancient oak that speaks in riddles about the old times. Its advice is cryptic but valuable.', 
        emoji: '🌲', danger: 'medium' },
      
      { x: 2, y: -4, type: 'creature', name: 'Luminous Stag', 
        description: 'A magnificent deer whose antlers glow with spirit energy. A good omen if encountered.', 
        emoji: '🦌', danger: 'safe' },
      
      { x: -6, y: 1, type: 'mystery', name: 'Shadow Hollow', 
        description: 'A clearing where shadows move independently. Hollowshade Clan secrets lie hidden here.', 
        emoji: '🕳️', danger: 'high' },
      
      { x: 5, y: 0, type: 'treasure', name: 'Blooming Crystal', 
        description: 'A rare crystal formation that enhances plant growth. Valuable to all factions.', 
        emoji: '💎', danger: 'medium' },
      
      { x: 0, y: -5, type: 'creature', name: 'Thornbeast Pack', 
        description: 'Predators covered in living vines. They guard ancient Syndicate territories.', 
        emoji: '🐺', danger: 'extreme' },
      
      { x: -4, y: 4, type: 'event', name: 'Spirit Plant Grove', 
        description: 'A grove where spirit plants pulse in harmony. Their light reveals hidden truths.', 
        emoji: '✨', danger: 'low' },
      
      { x: 7, y: -3, type: 'mystery', name: 'Abandoned Greenhouse', 
        description: 'A ruined Valebright facility overgrown with wild plants. What experiments happened here?', 
        emoji: '🏚️', danger: 'high' },
      
      { x: -1, y: 6, type: 'creature', name: 'Ancient Treant', 
        description: 'An old tree-guardian that has awakened from its slumber. Unpredictable.', 
        emoji: '🌳', danger: 'extreme' },
      
      { x: 4, y: 4, type: 'creature', name: 'Will-o-Wisp Cluster', 
        description: 'Dancing lights that lead travelers astray... or to hidden treasures.', 
        emoji: '💡', danger: 'medium' },
      
      { x: -7, y: -3, type: 'creature', name: 'Corrupted Dryad', 
        description: 'A nature spirit twisted by dark magic. Extremely hostile to all travelers.', 
        emoji: '🧚‍♀️', danger: 'extreme' }
    ]
  };

  // Helper function to check if a tile is on a road (straight lines only)
  const isOnRoad = (x: number, y: number): boolean => {
    return verdanceCampaignLocations.roads.some(road => {
      const { from, to } = road;
      
      // Only horizontal or vertical lines
      if (from.x === to.x) {
        // Vertical line
        const minY = Math.min(from.y, to.y);
        const maxY = Math.max(from.y, to.y);
        return x === from.x && y >= minY && y <= maxY;
      } else if (from.y === to.y) {
        // Horizontal line
        const minX = Math.min(from.x, to.x);
        const maxX = Math.max(from.x, to.x);
        return y === from.y && x >= minX && x <= maxX;
      }
      
      return false; // No diagonal roads
    });
  };

  // Get road name for display
  const getRoadName = (x: number, y: number): string | null => {
    const road = verdanceCampaignLocations.roads.find(road => {
      const { from, to } = road;
      
      if (from.x === to.x) {
        // Vertical line
        const minY = Math.min(from.y, to.y);
        const maxY = Math.max(from.y, to.y);
        return x === from.x && y >= minY && y <= maxY;
      } else if (from.y === to.y) {
        // Horizontal line
        const minX = Math.min(from.x, to.x);
        const maxX = Math.max(from.x, to.x);
        return y === from.y && x >= minX && x <= maxX;
      }
      
      return false;
    });
    return road ? road.name : null;
  };

  // Seeded Settlement Generation
  const getSettlement = (x: number, y: number): Settlement | null => {
    // Check biome - no settlements in ocean
    const biome = getBiome(x, y);
    if (biome.name === "Ocean") return null;
    
    // Use seeded random to determine if settlement exists
    const rng = new SeededRandom(`${seedStr}-settlement-check-${x}-${y}-${Math.abs(x*y)}`);
    
    // Very low chance for settlements to spawn
    if (!rng.chance(0.03)) return null;
    
    // Generate settlement using seeded generator
    const generator = new SettlementGenerator(seedStr, x, y);
    const generated = generator.generate();
    
    // Map to our Settlement interface
    const typeEmojis = {
      city: '🏰',
      town: '🏘️',
      village: '🏡',
      outpost: '⛺',
      trading_post: '🏪'
    };
    
    return {
      type: generated.type as Settlement['type'],
      name: generated.name,
      population: generated.population,
      description: generated.description,
      emoji: typeEmojis[generated.type as keyof typeof typeEmojis] || '🏘️',
      services: generated.services,
      npcs: generated.npcs
    };
  };

  // Seeded Encounter Generation - chooses based on road vs wilderness
  const getEncounter = (x: number, y: number): Encounter | null => {
    const settlement = getSettlement(x, y);
    if (settlement) return null; // No encounters where settlements exist
    
    // Check biome - ocean should be almost completely empty
    const biome = getBiome(x, y);
    if (biome.name === "Ocean") {
      // Extremely rare maritime encounters in ocean
      const rng = new SeededRandom(`${seedStr}-ocean-encounter-${x}-${y}-${Math.abs(x+y*3)}`);
      if (!rng.chance(0.002)) return null; // 0.2% chance for very rare maritime events
      
      return generateMaritimeEncounter(x, y);
    }
    
    const rng = new SeededRandom(`${seedStr}-encounter-check-${x}-${y}-${Math.abs(x+y*3)}`);
    
    // Check if on a road - safer, less frequent encounters
    if (isOnRoad(x, y)) {
      if (!rng.chance(0.015)) return null; // 1.5% chance on roads
      
      return generateRoadEncounter(x, y);
    } else {
      // Wilderness - more frequent, varied encounters
      if (!rng.chance(0.03)) return null; // 3% chance in wilderness
      
      return generateWildernessEncounter(x, y);
    }
  };

  const generateRoadEncounter = (x: number, y: number): Encounter => {
    const rng = new SeededRandom(`${seedStr}-road-encounter-${x}-${y}`);
    const encounterTypes = ['quest', 'mystery', 'creature', 'event'];
    const type = rng.pick(encounterTypes);
    
    if (type === 'quest') {
      const questGen = new QuestGenerator(seedStr, x, y);
      const quest = questGen.generate();
      
      return {
        type: 'quest',
        name: quest.title,
        description: quest.description,
        emoji: '📜',
        danger: 'safe',
        quest
      };
    } else if (type === 'mystery') {
      // Challenge-based treasures - riddles, puzzles, map fragments
      const challenges = [
        'Ancient Riddle Stone',
        'Cryptic Map Fragment', 
        'Puzzle Box',
        'Mysterious Inscription',
        'Locked Chest with Riddle',
        'Weathered Treasure Map'
      ];
      const challenge = rng.pick(challenges);
      
      return {
        type: 'mystery',
        name: challenge,
        description: `You find a ${challenge.toLowerCase()}. It seems to hold secrets, but requires wit to unlock.`,
        emoji: '�️',
        danger: 'safe'
      };
    } else if (type === 'creature') {
      const creatures = ['Traveling Merchant', 'Lost Pilgrim', 'Wandering Minstrel', 'Road Patrol'];
      const dangers = ['safe', 'safe', 'safe', 'low'] as const;
      const idx = rng.nextInt(0, creatures.length);
      
      return {
        type: 'creature',
        name: creatures[idx],
        description: `You encounter a ${creatures[idx].toLowerCase()} on the road.`,
        emoji: '👤',
        danger: dangers[idx]
      };
    } else {
      // Event encounters
      const events = ['Bridge Out', 'Caravan Rest', 'Crossroads Marker', 'Old Shrine'];
      const event = rng.pick(events);
      
      return {
        type: 'event',
        name: event,
        description: `You come across: ${event}`,
        emoji: '🛤️',
        danger: 'safe'
      };
    }
  };

  const generateWildernessEncounter = (x: number, y: number): Encounter => {
    const rng = new SeededRandom(`${seedStr}-wild-encounter-${x}-${y}`);
    const encounterTypes = ['creature', 'mystery', 'quest'];
    const type = rng.pick(encounterTypes);
    
    if (type === 'quest') {
      const questGen = new QuestGenerator(seedStr, x, y);
      const quest = questGen.generate();
      
      return {
        type: 'quest',
        name: quest.title,
        description: quest.description,
        emoji: '⚔️',
        danger: rng.pick(['medium', 'high', 'extreme']),
        quest
      };
    } else if (type === 'creature') {
      const creatures = ['Wild Beasts', 'Bandits', 'Mysterious Figure', 'Ancient Guardian', 'Lost Spirits'];
      const dangers = ['medium', 'high', 'medium', 'extreme', 'high'] as const;
      const idx = rng.nextInt(0, creatures.length);
      
      return {
        type: 'creature',
        name: creatures[idx],
        description: `Dangerous encounter: ${creatures[idx]}`,
        emoji: '🐺',
        danger: dangers[idx]
      };
    } else {
      // Challenge-based mysteries - ruins, temples, guardians that require problem solving
      const challenges = [
        'Ancient Temple with Sealed Door',
        'Ruined Observatory with Star Puzzle',
        'Forgotten Shrine with Symbol Lock',
        'Crystal Cave with Harmonic Puzzle',
        'Stone Circle with Elemental Trial',
        'Buried Vault with Riddle Guardian'
      ];
      const challenge = rng.pick(challenges);
      
      return {
        type: 'mystery',
        name: challenge,
        description: `You discover a ${challenge.toLowerCase()}. Ancient magic protects its secrets - only the clever may claim its treasures.`,
        emoji: '🏛️',
        danger: rng.pick(['medium', 'high'])
      };
    }
  };

  const generateMaritimeEncounter = (x: number, y: number): Encounter => {
    const rng = new SeededRandom(`${seedStr}-maritime-encounter-${x}-${y}`);
    const encounterTypes = ['creature', 'mystery', 'event'];
    const type = rng.pick(encounterTypes);
    
    if (type === 'creature') {
      const creatures = ['Sea Serpent', 'Merchant Ship', 'Pirate Vessel', 'Whale Pod', 'Mysterious Fog'];
      const dangers = ['extreme', 'safe', 'high', 'safe', 'medium'] as const;
      const idx = rng.nextInt(0, creatures.length);
      
      return {
        type: 'creature',
        name: creatures[idx],
        description: `Maritime encounter: ${creatures[idx]}`,
        emoji: '🚢',
        danger: dangers[idx]
      };
    } else if (type === 'mystery') {
      // Very rare ocean mysteries - mostly legends and map fragments
      const mysteries = [
        'Siren\'s Song Echo',
        'Ancient Sea Chart Fragment', 
        'Mysterious Island Mirage',
        'Floating Witch\'s Bottle',
        'Ghostly Ship Sighting'
      ];
      const mystery = rng.pick(mysteries);
      
      return {
        type: 'mystery',
        name: mystery,
        description: `A rare oceanic phenomenon: ${mystery}. The sea holds its secrets well.`,
        emoji: '🔱',
        danger: rng.pick(['safe', 'low'])
      };
    } else {
      // Ocean events
      const events = ['Storm Clouds', 'Calm Waters', 'Dolphin Pod', 'Seabird Flock', 'Coral Reef'];
      const event = rng.pick(events);
      
      return {
        type: 'event',
        name: event,
        description: `The ocean shows: ${event}`,
        emoji: '🌊',
        danger: 'safe'
      };
    }
  };

  const handleTileClick = (x: number, y: number) => {
    setSelected({ x, y });
    const settlement = getSettlement(x, y);
    const encounter = settlement ? null : getEncounter(x, y);
    
    if (settlement) {
      setActiveSettlement(settlement);
      setActiveEncounter(null);
    } else if (encounter) {
      setActiveEncounter(encounter);
      setActiveSettlement(null);
    } else {
      setActiveSettlement(null);
      setActiveEncounter(null);
    }
  };

  const handleEncounterStart = (encounter: Encounter) => {
    setActiveEncounter(encounter);
    setInExploration(true);
  };

  const handleEncounterEnd = (result: 'completed' | 'fled' | 'failed', rewards?: any) => {
    setInExploration(false);
    setActiveEncounter(null);
    
    if (result === 'completed' && rewards) {
      let message = '✅ Encounter completed successfully!\n\n';
      if (rewards.experience) message += `Experience gained: ${rewards.experience} XP\n`;
      if (rewards.gold) message += `Gold found: ${rewards.gold} coins\n`;
      if (rewards.items) message += `Items found: ${rewards.items.join(', ')}\n`;
      if (rewards.special) message += `Special reward: ${rewards.special}\n`;
      if (rewards.buff) message += `Temporary effect: ${rewards.buff}\n`;
      if (rewards.questProgress) message += `Quest progress: ${rewards.questProgress}\n`;
      
      alert(message);
    } else if (result === 'fled') {
      alert('🏃 Your party fled from the encounter safely.');
    } else if (result === 'failed') {
      alert('💀 The encounter ended badly for your party...');
    }
  };

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      let newX = playerPos.x;
      let newY = playerPos.y;
      
      switch (e.key.toLowerCase()) {
        case 'w':
        case 'arrowup':
          newY -= 1;
          break;
        case 's':
        case 'arrowdown':
          newY += 1;
          break;
        case 'a':
        case 'arrowleft':
          newX -= 1;
          break;
        case 'd':
        case 'arrowright':
          newX += 1;
          break;
        default:
          return;
      }
      
      e.preventDefault();
      setPlayerPos({ x: newX, y: newY });
      
      // Keep map centered on player
      const viewRadius = Math.floor(viewportSize / 2);
      setViewportOffset({
        x: newX - viewRadius,
        y: newY - viewRadius
      });
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [playerPos, viewportSize]);

  const generateGrid = () => {
    const grid = [];
    for (let y = 0; y < viewportSize; y++) {
      const row = [];
      for (let x = 0; x < viewportSize; x++) {
        const worldX = viewportOffset.x + x;
        const worldY = viewportOffset.y + y;
        const isPlayer = worldX === playerPos.x && worldY === playerPos.y;
        const biome = getBiome(worldX, worldY);
        const settlement = getSettlement(worldX, worldY);
        const encounter = settlement ? null : getEncounter(worldX, worldY);
        
        row.push({ 
          x: worldX, 
          y: worldY, 
          biome,
          settlement,
          encounter,
          isPlayer 
        });
      }
      grid.push(row);
    }
    return grid;
  };

  const grid = generateGrid();

  const getDangerColor = (danger: string) => {
    switch (danger) {
      case 'safe': return '#10b981';
      case 'low': return '#f59e0b';
      case 'medium': return '#f97316';
      case 'high': return '#ef4444';
      case 'extreme': return '#991b1b';
      default: return '#6b7280';
    }
  };

  // If in exploration mode, render ExplorationMode component
  if (inExploration && activeEncounter && playerCharacters.length > 0) {
    return (
      <ExplorationMode
        encounter={activeEncounter}
        playerCharacters={playerCharacters}
        onEncounterEnd={handleEncounterEnd}
        onBack={() => setInExploration(false)}
      />
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0f172a", color: "#f1f5f9", padding: "20px" }}>
      <div style={{ textAlign: "center", marginBottom: "20px" }}>
        <h1>The Verdance — Campaign Map</h1>
        <p>Position: {playerPos.x}, {playerPos.y} | Current: {getBiome(playerPos.x, playerPos.y).name}</p>
        <p style={{ fontSize: "14px", color: "#94a3b8" }}>Use WASD or arrow keys to explore • Click tiles for encounters</p>
        <button 
          onClick={() => setPlayerPos({ x: 0, y: 0 })}
          style={{ 
            padding: "6px 12px", 
            background: "#1e40af", 
            color: "#f9fafb", 
            border: "none", 
            borderRadius: "4px", 
            cursor: "pointer",
            marginTop: "8px",
            marginRight: "10px",
            fontSize: "12px"
          }}
        >
          📍 Return to Origin (0,0)
        </button>
        {onBack && (
          <button 
            onClick={onBack}
            style={{ 
              padding: "8px 16px", 
              background: "#059669", 
              color: "#f9fafb", 
              border: "none", 
              borderRadius: "6px", 
              cursor: "pointer",
              marginTop: "10px"
            }}
          >
            ← Back to Menu
          </button>
        )}
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: `repeat(${viewportSize}, 24px)`,
        gap: "1px",
        padding: "16px",
        background: "#1e293b",
        borderRadius: "12px",
        margin: "0 auto",
        width: "fit-content"
      }}>
        {grid.flat().map(({ x, y, biome, settlement, encounter, isPlayer }) => {
          const isSelected = selected?.x === x && selected?.y === y;
          const hasContent = settlement || encounter;
          const onRoad = isOnRoad(x, y);
          
          return (
            <div
              key={`${x},${y}`}
              onClick={() => handleTileClick(x, y)}
              title={`${biome.name} (${x}, ${y})${isPlayer ? ' - You are here!' : ''}${onRoad ? ` - On ${getRoadName(x, y)}` : ''}${settlement ? ` - ${settlement.name}` : ''}${encounter ? ` - ${encounter.name}` : ''}`}
              style={{
                width: "24px",
                height: "24px",
                background: biome.color, // Show biome color, roads will be subtle
                border: isSelected ? "2px solid #fff" : 
                       isPlayer ? "2px solid #ffd93d" : 
                       settlement ? "2px solid #8b5cf6" : // Purple border for settlements
                       encounter ? `2px solid ${getDangerColor(encounter.danger)}` : // Danger color border for encounters
                       onRoad ? "2px solid #D2691E" : // Subtle orange border for roads
                       "1px solid rgba(0,0,0,0.2)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "10px",
                borderRadius: "2px",
                position: "relative",
                // Add overlay effects - subtle road indication
                boxShadow: isPlayer ? 'inset 0 0 12px rgba(255, 107, 107, 0.4)' :
                          settlement ? 'inset 0 0 8px rgba(139, 92, 246, 0.3)' :
                          encounter ? `inset 0 0 8px ${getDangerColor(encounter.danger)}40` :
                          onRoad ? 'inset 0 0 6px rgba(210, 105, 30, 0.3)' : // Subtle road glow
                          'none'
              }}
            >
              {isPlayer ? '👤' : 
               settlement ? settlement.emoji : 
               encounter ? encounter.emoji :
               biome.emoji} {/* No special road emoji, keep it clean */}
            </div>
          );
        })}
      </div>

      {/* Settlement Details */}
      {activeSettlement && (
        <div style={{ 
          textAlign: "center", 
          marginTop: "20px", 
          padding: "16px", 
          background: "#1e293b", 
          borderRadius: "12px",
          maxWidth: "500px",
          margin: "20px auto"
        }}>
          <h3 style={{ margin: "0 0 10px 0", color: "#8b5cf6" }}>
            {activeSettlement.emoji} {activeSettlement.name}
          </h3>
          <p style={{ margin: "5px 0", fontSize: "14px", color: "#94a3b8" }}>
            {activeSettlement.type.charAt(0).toUpperCase() + activeSettlement.type.slice(1)} • Population: {activeSettlement.population.toLocaleString()}
          </p>
          <p style={{ margin: "10px 0", color: "#d1d5db" }}>{activeSettlement.description}</p>
          <p style={{ margin: "5px 0", fontSize: "14px" }}>
            <strong>Controlled by:</strong> {activeSettlement.faction}
          </p>
          {activeSettlement.services && activeSettlement.services.length > 0 && (
            <div style={{ marginTop: "10px" }}>
              <p style={{ fontSize: "14px", margin: "5px 0" }}><strong>Services:</strong></p>
              <div style={{ display: "flex", justifyContent: "center", gap: "8px", flexWrap: "wrap" }}>
                {activeSettlement.services.map(service => (
                  <span key={service} style={{ 
                    background: "#374151", 
                    padding: "2px 8px", 
                    borderRadius: "4px", 
                    fontSize: "12px" 
                  }}>
                    {service}
                  </span>
                ))}
              </div>
            </div>
          )}
          <div style={{ marginTop: "15px", display: "flex", gap: "10px", justifyContent: "center" }}>
            <button 
              onClick={() => alert(`Entering ${activeSettlement.name}... (Campaign features coming soon!)`)}
              style={{ 
                padding: "8px 16px", 
                background: "#8b5cf6", 
                color: "#f9fafb", 
                border: "none", 
                borderRadius: "6px", 
                cursor: "pointer" 
              }}
            >
              Enter Settlement
            </button>
            <button 
              onClick={() => {
                setPlayerPos({ x: selected!.x, y: selected!.y });
                const viewRadius = Math.floor(viewportSize / 2);
                setViewportOffset({ x: selected!.x - viewRadius, y: selected!.y - viewRadius });
              }}
              style={{ 
                padding: "6px 12px", 
                background: "#374151", 
                color: "#9ca3af", 
                border: "1px solid #6b7280", 
                borderRadius: "4px", 
                cursor: "pointer",
                fontSize: "12px"
              }}
              title="Developer tool - breaks immersion"
            >
              [DEV] Fast Travel
            </button>
          </div>
        </div>
      )}

      {/* Encounter Details */}
      {activeEncounter && (
        <div style={{ 
          textAlign: "center", 
          marginTop: "20px", 
          padding: "16px", 
          background: "#1e293b", 
          borderRadius: "12px",
          maxWidth: "500px",
          margin: "20px auto",
          border: `2px solid ${getDangerColor(activeEncounter.danger)}`
        }}>
          <h3 style={{ margin: "0 0 10px 0", color: getDangerColor(activeEncounter.danger) }}>
            {activeEncounter.emoji} {activeEncounter.name}
          </h3>
          <p style={{ margin: "5px 0", fontSize: "14px", color: "#94a3b8" }}>
            {activeEncounter.type.charAt(0).toUpperCase() + activeEncounter.type.slice(1)} • 
            Danger: <span style={{ color: getDangerColor(activeEncounter.danger) }}>
              {activeEncounter.danger.charAt(0).toUpperCase() + activeEncounter.danger.slice(1)}
            </span>
          </p>
          <p style={{ margin: "10px 0", color: "#d1d5db" }}>{activeEncounter.description}</p>
          <div style={{ marginTop: "15px", display: "flex", gap: "10px", justifyContent: "center" }}>
            <button 
              onClick={() => handleEncounterStart(activeEncounter)}
              style={{ 
                padding: "8px 16px", 
                background: getDangerColor(activeEncounter.danger), 
                color: "#f9fafb", 
                border: "none", 
                borderRadius: "6px", 
                cursor: "pointer" 
              }}
            >
              Investigate
            </button>
            <button 
              onClick={() => {
                setPlayerPos({ x: selected!.x, y: selected!.y });
                const viewRadius = Math.floor(viewportSize / 2);
                setViewportOffset({ x: selected!.x - viewRadius, y: selected!.y - viewRadius });
              }}
              style={{ 
                padding: "6px 12px", 
                background: "#374151", 
                color: "#9ca3af", 
                border: "1px solid #6b7280", 
                borderRadius: "4px", 
                cursor: "pointer",
                fontSize: "12px"
              }}
              title="Developer tool - breaks immersion"
            >
              [DEV] Fast Travel
            </button>
          </div>
        </div>
      )}

      {/* Basic Location Info */}
      {selected && !activeSettlement && !activeEncounter && (
        <div style={{ 
          textAlign: "center", 
          marginTop: "20px", 
          padding: "16px", 
          background: "#1e293b", 
          borderRadius: "12px",
          maxWidth: "400px",
          margin: "20px auto"
        }}>
          <h3 style={{ margin: "0 0 10px 0" }}>Selected Location</h3>
          <p>Biome: {getBiome(selected.x, selected.y).name} {getBiome(selected.x, selected.y).emoji}</p>
          <p>Coordinates: {selected.x}, {selected.y}</p>
          <button 
            onClick={() => {
              setPlayerPos(selected);
              const viewRadius = Math.floor(viewportSize / 2);
              setViewportOffset({ x: selected.x - viewRadius, y: selected.y - viewRadius });
            }}
            style={{ 
              padding: "6px 12px", 
              background: "#374151", 
              color: "#9ca3af", 
              border: "1px solid #6b7280", 
              borderRadius: "4px", 
              cursor: "pointer",
              fontSize: "12px"
            }}
            title="Developer tool - use WASD to explore naturally"
          >
            [DEV] Fast Travel Here
          </button>
        </div>
      )}

      <div style={{ 
        textAlign: "center", 
        marginTop: "30px", 
        fontSize: "14px", 
        color: "#94a3b8" 
      }}>
        <p>🏰 Purple borders = Settlements • 🎲 Colored borders = Encounters • � Orange borders = Roads</p>
        <p>🛡️ <strong>Stay on roads for safety</strong> - scripted encounters, friendly patrols</p>
        <p>⚔️ <strong>Venture into wilderness</strong> - dangerous creatures, valuable treasures</p>
        <p>The spirit plants of Verdance pulse with life across this realm. Choose your path wisely.</p>
        <p style={{ fontSize: "12px", marginTop: "10px" }}>Seed: {seedStr}</p>
      </div>
    </div>
  );
}