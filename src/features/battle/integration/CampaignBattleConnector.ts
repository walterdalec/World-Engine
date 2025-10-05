/**
 * Campaign-Battle Integration
 * Connects world map encounters to tactical hex battles
 */

import { BattleState, BattleContext } from '../types';
import { generateBattlefieldHex } from '../generate_hex';
import { buildBattle } from '../factory';

export interface CampaignEncounter {
    type: 'skirmish' | 'siege' | 'ambush' | 'patrol' | 'boss';
    faction: string;
    terrain: string;
    difficulty: 'easy' | 'medium' | 'hard' | 'extreme';
    rewards: {
        gold: number;
        experience: number;
        territoryControl?: boolean;
        factionsAffected?: string[];
    };
    specialConditions?: {
        timeLimit?: number; // turns
        objectives?: string[];
        reinforcements?: boolean;
    };
}

export interface CampaignParty {
    hero: any; // Your character from CharacterCreate
    mercenaries: any[];
    reputation: Record<string, number>; // faction standings
    resources: {
        gold: number;
        supplies: number;
        influence: number;
    };
}

/**
 * Convert campaign encounter to tactical battle
 */
export function createBattleFromEncounter(
    encounter: CampaignEncounter,
    party: CampaignParty,
    worldSeed: string
): BattleState {
    // Generate battlefield based on encounter type and terrain
    const context: BattleContext = {
        seed: `${worldSeed}-${encounter.type}-${Date.now()}`,
        biome: encounter.terrain,
        site: encounter.type === 'siege' ? 'settlement' : 'wilds',
        timeOfDay: 'Day' // Could be influenced by campaign time
    };

    // Build tactical battle with campaign context
    const battle = buildBattle(party.hero, party.mercenaries, context);

    // Apply encounter-specific modifications
    if (encounter.type === 'ambush') {
        // Enemy gets first turn, player starts scattered
        battle.phase = 'EnemyTurn';
        scatterPlayerUnits(battle);
    }

    if (encounter.specialConditions?.timeLimit) {
        battle.turnLimit = encounter.specialConditions.timeLimit;
    }

    return battle;
}

/**
 * Process battle results back to campaign
 */
export function processBattleResults(
    battleResult: any,
    encounter: CampaignEncounter,
    party: CampaignParty
): CampaignConsequences {
    const consequences: CampaignConsequences = {
        resourceChanges: {},
        reputationChanges: {},
        territoryChanges: [],
        newOpportunities: []
    };

    if (battleResult.victory) {
        // Victory rewards
        consequences.resourceChanges.gold = encounter.rewards.gold;
        consequences.resourceChanges.experience = encounter.rewards.experience;

        // Faction reputation effects
        if (encounter.rewards.factionsAffected) {
            encounter.rewards.factionsAffected.forEach(faction => {
                consequences.reputationChanges[faction] = encounter.difficulty === 'hard' ? 15 : 10;
            });
        }

        // Territory control (Mount & Blade style)
        if (encounter.rewards.territoryControl) {
            consequences.territoryChanges.push({
                type: 'captured',
                territory: encounter.faction,
                newController: 'Player'
            });
        }
    } else {
        // Defeat consequences
        consequences.resourceChanges.gold = -Math.floor(encounter.rewards.gold * 0.3);
        consequences.reputationChanges[encounter.faction] = -5;
    }

    return consequences;
}

export interface CampaignConsequences {
    resourceChanges: Record<string, number>;
    reputationChanges: Record<string, number>;
    territoryChanges: Array<{
        type: 'captured' | 'lost' | 'contested';
        territory: string;
        newController: string;
    }>;
    newOpportunities: Array<{
        type: 'quest' | 'contract' | 'recruitment';
        description: string;
        faction?: string;
    }>;
}

function scatterPlayerUnits(battle: BattleState) {
    // Implement ambush deployment logic
    battle.units
        .filter(u => u.faction === 'Player')
        .forEach(unit => {
            // Scatter units across deployment zone randomly
            const availableHexes = battle.friendlyDeployment.hexes;
            const randomHex = availableHexes[Math.floor(Math.random() * availableHexes.length)];
            unit.pos = randomHex;
        });
}