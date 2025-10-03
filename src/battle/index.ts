// Battle System Exports
// Complete hex-based tactical combat system

// Core types and interfaces
export type {
    BattleState,
    Unit,
    Commander,
    Ability,
    BattleContext,
    HexPosition,
    BattlePhase,
    UnitStats,
    StatusEffect,
    BattleGrid,
    HexTile,
    DeploymentZone,
    BattleResult
} from './types';

// Battle engine functions
export {
    startBattle,
    nextPhase,
    executeAbility,
    moveUnit,
    checkVictoryConditions,
    getValidMoves,
    hexDistance,
    lineOfSight,
    findPath
} from './engine';

// Battlefield generation
export {
    generateBattlefield,
    generateTacticalBattlefield,
    BIOME_CONFIGS,
    SeededRNG
} from './generate';

// Battle factory and utilities
export {
    buildBattle,
    characterToUnit,
    createCommander,
    generateEnemies,
    createTestBattle,
    calculateRevivalCost,
    getCasualties
} from './factory';

// Abilities and skills
export {
    ABILITIES,
    ARCHETYPE_SKILLS,
    COMMANDER_ABILITIES,
    getSkillsForArchetype,
    getCommanderAbilities
} from './abilities';

// AI system
export {
    calculateAIAction,
    calculateAdvancedAIAction,
    executeAITurn
} from './ai';

// Economy and rewards
export {
    calculateBattleRewards,
    calculateRevivalCost as economyCalculateRevivalCost,
    getAvailableServices,
    calculatePartyWealth
} from './economy';

// React components
export { BattleScreen } from './components/BattleScreen';
export { BattleSetupScreen } from './components/BattleSetupScreen';
export { BattleCanvas } from './components/renderer2d';

// Hex utilities (re-export from existing)
export {
    cubeDistance,
    axialToCube,
    hexNeighbor,
    hexRing,
    hexSpiral
} from './generate_hex';

// Development utilities
export const BattleDevTools = {
    createTestBattle: () => {
        const { createTestBattle } = require('./factory');
        return createTestBattle();
    },

    generateQuickBattle: (heroLevel: number = 3, partySize: number = 2) => {
        const { buildBattle } = require('./factory');

        const testHero = {
            id: 'dev_hero',
            name: 'Dev Hero',
            race: 'Human',
            archetype: 'Greenwarden',
            level: heroLevel,
            stats: { str: 4, con: 3, int: 3, wis: 4, dex: 3 }
        };

        const testParty = Array.from({ length: partySize }, (_, i) => ({
            id: `dev_unit_${i}`,
            name: `Unit ${i + 1}`,
            race: 'Human',
            archetype: i % 2 === 0 ? 'Thorn Knight' : 'Sylvan Archer',
            level: heroLevel - 1,
            stats: { str: 3, con: 3, int: 2, wis: 2, dex: 3 }
        }));

        const context = {
            seed: `dev_battle_${Date.now()}`,
            biome: 'Forest',
            site: 'wilds' as const
        };

        return buildBattle(testHero, testParty, context);
    },

    logBattleState: (state: any) => {
        console.log('🎮 Battle State:', {
            turn: state.turn,
            phase: state.phase,
            playerUnits: state.units.filter((u: any) => u.faction === 'Player').length,
            enemyUnits: state.units.filter((u: any) => u.faction === 'Enemy').length,
            gridSize: `${state.grid.width}x${state.grid.height}`,
            biome: state.context.biome
        });
    }
};