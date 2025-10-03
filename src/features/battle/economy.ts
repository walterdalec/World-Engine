import type { Unit } from "./types";
import { rng } from "../../core/services/random";

export interface RevivalCost {
    gold: number;
    requirements?: {
        shrine?: boolean;
        temple?: boolean;
        specialItem?: string;
    };
    timeRequired?: number; // in game days
}

export interface LootDrop {
    id: string;
    name: string;
    type: "gold" | "item" | "equipment" | "consumable";
    value: number;
    rarity: "common" | "uncommon" | "rare" | "epic" | "legendary";
    description?: string;
}

export interface BattleRewards {
    experience: number;
    gold: number;
    loot: LootDrop[];
}

// Calculate revival cost based on unit level and gear
export function calculateRevivalCost(unit: Unit): RevivalCost {
    const baseCost = 50;
    const levelMultiplier = unit.level * 25;
    const gearValue = (unit.gear?.gearScore || 0) * 10;

    const totalCost = baseCost + levelMultiplier + gearValue;

    // Higher level units might require special locations
    const requirements: RevivalCost["requirements"] = {};

    if (unit.level >= 5) {
        requirements.shrine = true;
    }

    if (unit.level >= 10) {
        requirements.temple = true;
    }

    if (unit.level >= 15) {
        requirements.specialItem = "Resurrection Crystal";
    }

    return {
        gold: totalCost,
        requirements: Object.keys(requirements).length > 0 ? requirements : undefined,
        timeRequired: Math.ceil(unit.level / 3) // Days to recover
    };
}

// Calculate battle rewards based on enemies defeated
export function calculateBattleRewards(
    defeatedEnemies: Unit[],
    playerPartyLevel: number,
    victory: boolean
): BattleRewards {
    let experience = 0;
    let gold = 0;
    const loot: LootDrop[] = [];

    // Base rewards for participation
    if (victory) {
        experience += 100;
        gold += 50;
    } else {
        experience += 25; // Partial experience for defeat
        gold += 10;
    }

    // Rewards per enemy defeated
    for (const enemy of defeatedEnemies) {
        const enemyValue = calculateEnemyValue(enemy);
        experience += enemyValue.experience;
        gold += enemyValue.gold;

        // Chance for loot drops
        const lootRoll = rng.next();
        if (lootRoll < enemyValue.lootChance) {
            const drop = generateLootDrop(enemy, playerPartyLevel);
            if (drop) {
                loot.push(drop);
            }
        }
    }

    // Bonus experience for challenging encounters
    const averageEnemyLevel = defeatedEnemies.reduce((sum, e) => sum + e.level, 0) / defeatedEnemies.length;
    if (averageEnemyLevel > playerPartyLevel) {
        const bonus = Math.floor((averageEnemyLevel - playerPartyLevel) * 25);
        experience += bonus;
        gold += Math.floor(bonus / 2);
    }

    return { experience, gold, loot };
}

function calculateEnemyValue(enemy: Unit) {
    const baseExp = 25 * enemy.level;
    const baseGold = 15 * enemy.level;
    let lootChance = 0.2;

    // Boss units are more valuable
    if (enemy.kind === "Boss") {
        return {
            experience: baseExp * 3,
            gold: baseGold * 2,
            lootChance: 0.8
        };
    }

    // Regular monsters
    return {
        experience: baseExp,
        gold: baseGold,
        lootChance
    };
}

function generateLootDrop(enemy: Unit, playerLevel: number): LootDrop | null {
    const dropTables = getLootTableForEnemy(enemy);
    const roll = rng.next();
    let cumulativeChance = 0;

    for (const item of dropTables) {
        cumulativeChance += item.chance;
        if (roll <= cumulativeChance) {
            return {
                id: `loot_${Date.now()}_${rng.next()}`,
                name: item.name,
                type: item.type,
                value: item.baseValue + Math.floor(playerLevel * item.scaling),
                rarity: item.rarity,
                description: item.description
            };
        }
    }

    return null;
}

interface LootTableEntry {
    name: string;
    type: "gold" | "item" | "equipment" | "consumable";
    baseValue: number;
    scaling: number;
    rarity: "common" | "uncommon" | "rare" | "epic" | "legendary";
    chance: number;
    description?: string;
}

function getLootTableForEnemy(enemy: Unit): LootTableEntry[] {
    const raceBasedLoot: Record<string, LootTableEntry[]> = {
        "Human": [
            { name: "Worn Sword", type: "equipment", baseValue: 25, scaling: 5, rarity: "common", chance: 0.3 },
            { name: "Leather Armor", type: "equipment", baseValue: 30, scaling: 3, rarity: "common", chance: 0.25 },
            { name: "Health Potion", type: "consumable", baseValue: 15, scaling: 2, rarity: "common", chance: 0.4 },
            { name: "Silver Coins", type: "gold", baseValue: 20, scaling: 5, rarity: "common", chance: 0.5 }
        ],

        "Beast": [
            { name: "Beast Fang", type: "item", baseValue: 15, scaling: 3, rarity: "common", chance: 0.6 },
            { name: "Thick Hide", type: "item", baseValue: 20, scaling: 4, rarity: "common", chance: 0.4 },
            { name: "Beast Essence", type: "item", baseValue: 50, scaling: 10, rarity: "uncommon", chance: 0.15 }
        ],

        "Elemental": [
            { name: "Elemental Core", type: "item", baseValue: 75, scaling: 15, rarity: "rare", chance: 0.3 },
            { name: "Mana Crystal", type: "consumable", baseValue: 40, scaling: 8, rarity: "uncommon", chance: 0.5 },
            { name: "Essence of Power", type: "item", baseValue: 100, scaling: 20, rarity: "epic", chance: 0.1 }
        ],

        "Orc": [
            { name: "Crude Axe", type: "equipment", baseValue: 35, scaling: 7, rarity: "common", chance: 0.4 },
            { name: "Iron Spearhead", type: "item", baseValue: 25, scaling: 5, rarity: "common", chance: 0.35 },
            { name: "Orcish Brew", type: "consumable", baseValue: 20, scaling: 3, rarity: "common", chance: 0.3 }
        ]
    };

    return raceBasedLoot[enemy.race] || raceBasedLoot["Human"];
}

// Shop prices and services
export interface ShopService {
    id: string;
    name: string;
    description: string;
    cost: number;
    type: "revival" | "healing" | "equipment" | "consumable";
    requirements?: string[];
}

export function getAvailableServices(location: "village" | "town" | "city" | "shrine"): ShopService[] {
    const services: Record<string, ShopService[]> = {
        "village": [
            {
                id: "basic_healing",
                name: "Basic Healing",
                description: "Restore HP to all party members",
                cost: 25,
                type: "healing"
            },
            {
                id: "health_potion",
                name: "Health Potion",
                description: "Restores 50 HP when used",
                cost: 20,
                type: "consumable"
            }
        ],

        "town": [
            {
                id: "full_healing",
                name: "Full Healing",
                description: "Restore HP and remove status effects",
                cost: 50,
                type: "healing"
            },
            {
                id: "basic_revival",
                name: "Basic Revival",
                description: "Revive fallen party members (levels 1-3)",
                cost: 100,
                type: "revival",
                requirements: ["level <= 3"]
            },
            {
                id: "mana_potion",
                name: "Mana Potion",
                description: "Restores spell uses",
                cost: 30,
                type: "consumable"
            }
        ],

        "city": [
            {
                id: "advanced_revival",
                name: "Advanced Revival",
                description: "Revive fallen party members (levels 1-8)",
                cost: 250,
                type: "revival",
                requirements: ["level <= 8"]
            },
            {
                id: "status_cleansing",
                name: "Status Cleansing",
                description: "Remove all negative status effects",
                cost: 75,
                type: "healing"
            }
        ],

        "shrine": [
            {
                id: "divine_revival",
                name: "Divine Revival",
                description: "Revive any fallen party member",
                cost: 500,
                type: "revival"
            },
            {
                id: "blessing",
                name: "Divine Blessing",
                description: "Temporary stat bonuses for next battle",
                cost: 100,
                type: "consumable"
            }
        ]
    };

    return services[location] || [];
}

// Calculate total party wealth
export function calculatePartyWealth(party: Unit[]): number {
    // This would integrate with the larger game economy
    // For now, return a placeholder based on party level
    const averageLevel = party.reduce((sum, unit) => sum + unit.level, 0) / party.length;
    return Math.floor(averageLevel * 100 + rng.next() * 200);
}

// Determine if player can afford a service
export function canAffordService(playerGold: number, service: ShopService): boolean {
    return playerGold >= service.cost;
}

// Get recommended loot for selling
export function getRecommendedSales(inventory: LootDrop[]): LootDrop[] {
    return inventory.filter(item =>
        item.rarity === "common" && item.type !== "consumable"
    );
}