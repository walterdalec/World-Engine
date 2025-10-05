import type {
    BattleState,
    BattleContext,
    Unit,
    Commander,
    UnitStats,
    HexPosition
} from "./types";
import { rng } from "../../core/services/random";
import { generateTacticalBattlefield } from "./generate";
import { getSkillsForArchetype, getCommanderAbilities } from "./abilities";

// Convert our character system to battle unit stats
export function characterToBattleStats(character: any): UnitStats {
    const level = character.level || 1;
    const baseHp = 20 + (level * 3);

    // Use our character stats or provide defaults
    const stats = character.stats || {};

    return {
        hp: baseHp,
        maxHp: baseHp,
        atk: 6 + (stats.str || 2),
        def: 4 + (stats.con || 2),
        mag: 6 + (stats.int || 2),
        res: 4 + (stats.wis || 2),
        spd: 6 + (stats.dex || 2),
        rng: character.archetype?.toLowerCase().includes("ranger") ? 5 : 1,
        move: 4
    };
}

export function characterToUnit(
    character: any,
    faction: "Player" | "Enemy" = "Player",
    isCommander: boolean = false
): Unit {
    const stats = characterToBattleStats(character);
    const skills = getSkillsForArchetype(character.archetype || "warrior");

    return {
        id: character.id || `unit_${Date.now()}_${rng.next()}`,
        name: character.name || "Unknown",
        kind: isCommander ? "HeroCommander" : "Mercenary",
        faction,
        race: character.race || "Human",
        archetype: character.archetype || "Warrior",
        level: character.level || 1,
        stats,
        statuses: [],
        skills: isCommander ? [] : skills, // Commanders use abilities, not skills
        isCommander,
        isDead: false, // Initialize as alive
        gear: {
            gearScore: character.gearScore || 0
        }
    };
}

export function createCommander(heroCharacter: any): Commander {
    const unit = characterToUnit(heroCharacter, "Player", true);

    return {
        unitId: unit.id,
        aura: {
            name: "Heroic Presence",
            stats: {
                spd: 1,
                def: 1,
                atk: 1
            }
        },
        abilities: [
            {
                id: "rally",
                name: "Rally",
                type: "command",
                apCost: 0,
                range: 0,
                shape: "ally",
                cooldown: 3,
                description: "Inspire all allies"
            },
            {
                id: "meteor_strike",
                name: "Meteor Strike",
                type: "command",
                apCost: 0,
                range: 8,
                shape: "blast2",
                aoeRadius: 2,
                cooldown: 5,
                damage: { amount: 20, type: "fire" },
                description: "Call down a devastating meteor"
            },
            {
                id: "tactical_advance",
                name: "Tactical Advance",
                type: "command",
                apCost: 0,
                range: 0,
                shape: "ally",
                cooldown: 4,
                description: "Grant allies extra movement"
            }
        ],
        runtime: {
            cooldowns: {},
            actionPoints: 3 // Commander gets multiple actions per turn
        }
    };
}

// Create enemy units based on player party strength
export function generateEnemies(
    playerPartyLevel: number,
    playerPartySize: number,
    biome: string,
    rngFn: () => number = () => rng.next()
): any[] {
    const enemies: any[] = [];
    const enemyCount = Math.max(2, playerPartySize - 1 + Math.floor(rngFn() * 3));

    const enemyTypes = getEnemyTypesForBiome(biome);

    for (let i = 0; i < enemyCount; i++) {
        const enemyType = enemyTypes[Math.floor(rngFn() * enemyTypes.length)];
        const levelVariance = Math.floor(rngFn() * 3) - 1; // -1 to +1
        const level = Math.max(1, playerPartyLevel + levelVariance);

        enemies.push({
            id: `enemy_${i}`,
            name: `${enemyType.name} ${i + 1}`,
            race: enemyType.race,
            archetype: enemyType.archetype,
            level,
            stats: generateEnemyStats(level, enemyType.statBonus)
        });
    }

    return enemies;
}

function getEnemyTypesForBiome(biome: string) {
    const enemyTypes: Record<string, any[]> = {
        "Grass": [
            { name: "Bandit", race: "Human", archetype: "warrior", statBonus: { atk: 1 } },
            { name: "Wolf", race: "Beast", archetype: "ranger", statBonus: { spd: 2 } },
            { name: "Orc Raider", race: "Orc", archetype: "warrior", statBonus: { atk: 2, def: 1 } }
        ],
        "Forest": [
            { name: "Forest Spider", race: "Beast", archetype: "rogue", statBonus: { spd: 1 } },
            { name: "Dryad", race: "Fey", archetype: "mage", statBonus: { mag: 2 } },
            { name: "Owlbear", race: "Beast", archetype: "warrior", statBonus: { atk: 2, def: 2 } }
        ],
        "Desert": [
            { name: "Desert Nomad", race: "Human", archetype: "ranger", statBonus: { spd: 1 } },
            { name: "Sand Viper", race: "Beast", archetype: "rogue", statBonus: { spd: 2, atk: 1 } },
            { name: "Fire Elemental", race: "Elemental", archetype: "mage", statBonus: { mag: 3 } }
        ],
        "Mountain": [
            { name: "Stone Giant", race: "Giant", archetype: "warrior", statBonus: { def: 3, atk: 1 } },
            { name: "Dwarf Outcast", race: "Dwarf", archetype: "warrior", statBonus: { def: 2 } },
            { name: "Mountain Lion", race: "Beast", archetype: "ranger", statBonus: { spd: 2, atk: 1 } }
        ],
        "Swamp": [
            { name: "Lizardfolk", race: "Reptilian", archetype: "warrior", statBonus: { def: 1 } },
            { name: "Bog Witch", race: "Human", archetype: "mage", statBonus: { mag: 2 } },
            { name: "Giant Frog", race: "Beast", archetype: "warrior", statBonus: { atk: 1 } }
        ],
        "Settlement": [
            { name: "Town Guard", race: "Human", archetype: "warrior", statBonus: { def: 1 } },
            { name: "Corrupt Official", race: "Human", archetype: "mage", statBonus: { mag: 1 } },
            { name: "Hired Thug", race: "Human", archetype: "rogue", statBonus: { atk: 1 } }
        ]
    };

    return enemyTypes[biome] || enemyTypes["Grass"];
}

function generateEnemyStats(level: number, bonuses: any = {}) {
    const base = {
        str: 2 + Math.floor(level / 2),
        con: 2 + Math.floor(level / 2),
        int: 2 + Math.floor(level / 3),
        wis: 2 + Math.floor(level / 3),
        dex: 2 + Math.floor(level / 2)
    };

    // Apply bonuses
    for (const [stat, bonus] of Object.entries(bonuses)) {
        if (base.hasOwnProperty(stat)) {
            (base as any)[stat] += bonus;
        }
    }

    return base;
}

// Main factory function to build a complete battle
export function buildBattle(
    heroCharacter: any,
    partyMembers: any[],
    context: BattleContext,
    enemies?: any[]
): BattleState {
    // Generate battlefield
    const playerPartySize = partyMembers.length;
    const averageLevel = partyMembers.reduce((sum, p) => sum + (p.level || 1), 0) / playerPartySize || 1;

    // Generate enemies if not provided
    if (!enemies) {
        enemies = generateEnemies(averageLevel, playerPartySize, context.biome);
    }

    const battlefield = generateTacticalBattlefield(context, playerPartySize, enemies.length);

    // Create commander unit (off-field)
    const commanderUnit = characterToUnit(heroCharacter, "Player", true);
    const commander = createCommander(heroCharacter);
    commanderUnit.id = commander.unitId; // Ensure IDs match

    // Create player units
    const playerUnits = partyMembers.map(member => characterToUnit(member, "Player", false));

    // Create enemy units
    const enemyUnits = enemies.map(enemy => characterToUnit(enemy, "Enemy", false));

    // Position units in deployment zones (initial placement)
    playerUnits.forEach((unit, index) => {
        if (index < battlefield.friendlyDeployment.hexes.length) {
            unit.pos = battlefield.friendlyDeployment.hexes[index];
        }
    });

    enemyUnits.forEach((unit, index) => {
        if (index < battlefield.enemyDeployment.hexes.length) {
            unit.pos = battlefield.enemyDeployment.hexes[index];
        }
    });

    // Build complete battle state
    const battleState: BattleState = {
        id: `battle_${Date.now()}`,
        turn: 0,
        phase: "Setup",
        grid: battlefield.grid,
        context,
        commander,
        units: [commanderUnit, ...playerUnits, ...enemyUnits],
        initiative: [],
        friendlyDeployment: battlefield.friendlyDeployment,
        enemyDeployment: battlefield.enemyDeployment,
        log: ["Battle preparations complete. Deploy your forces!"],
        turnLimit: undefined // Will be set by campaign system if needed
    };

    return battleState;
}

// Helper to calculate revival costs for aftermath
export function calculateRevivalCost(unit: Unit): number {
    const baseCost = 50;
    const levelMultiplier = unit.level * 25;
    const gearMultiplier = (unit.gear?.gearScore || 0) * 10;

    return baseCost + levelMultiplier + gearMultiplier;
}

// Helper to get casualties after battle
export function getCasualties(battleState: BattleState): Unit[] {
    return battleState.units.filter(unit =>
        unit.isDead && unit.faction === "Player" && !unit.isCommander
    );
}

// Create a quick battle for testing
export function createTestBattle(): BattleState {
    const testHero = {
        id: "test_hero",
        name: "Test Hero",
        race: "Human",
        archetype: "Greenwarden",
        level: 3,
        stats: { str: 4, con: 3, int: 3, wis: 4, dex: 3 }
    };

    const testParty = [
        {
            id: "merc1",
            name: "Warrior",
            race: "Human",
            archetype: "Thorn Knight",
            level: 2,
            stats: { str: 4, con: 4, int: 2, wis: 2, dex: 2 }
        },
        {
            id: "merc2",
            name: "Archer",
            race: "Sylvanborn",
            archetype: "Sylvan Archer",
            level: 2,
            stats: { str: 2, con: 2, int: 2, wis: 3, dex: 4 }
        }
    ];

    const context: BattleContext = {
        seed: "test_battle_123",
        biome: "Forest",
        site: "wilds"
    };

    return buildBattle(testHero, testParty, context);
}