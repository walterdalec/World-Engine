/**
 * Morale System Tests - Leader Death Penalty
 * TODO #10 — Morale & Psychology — Deep Spec v2
 */

import { processUnitDeath, getArmyMoraleStats } from '../index';
import { DefaultMorale } from '../model';
import type { BattleState, Unit } from '../../types';

const createMockUnit = (id: string, name: string, faction: 'Player' | 'Enemy', isCommander = false): Unit => ({
    id,
    name,
    faction,
    isCommander,
    kind: isCommander ? 'HeroCommander' : 'Mercenary',
    race: 'Human',
    archetype: 'Fighter',
    level: 1,
    stats: {
        hp: 20,
        maxHp: 20,
        atk: 10,
        def: 8,
        mag: 6,
        res: 6,
        spd: 8,
        rng: 1,
        move: 3
    },
    statuses: [],
    skills: [],
    isDead: false,
    pos: { q: 0, r: 0 }
});

const createMockBattle = (): BattleState => ({
    id: 'test-battle',
    turn: 1,
    phase: 'HeroTurn',
    units: [],
    log: [],
    commander: {
        unitId: 'commander-1',
        aura: { name: 'Leadership', stats: {}, range: 3 },
        abilities: [],
        runtime: {}
    },
    grid: {
        width: 10,
        height: 10,
        tiles: []
    },
    initiative: [],
    context: { seed: '12345', biome: 'Grass' },
    friendlyDeployment: { hexes: [], faction: 'Player' },
    enemyDeployment: { hexes: [], faction: 'Enemy' }
});

describe('Leader Death Penalty', () => {
    test('commander death applies army-wide penalty', () => {
        const battle = createMockBattle();

        // Add commander and regular units
        const commander = createMockUnit('commander-1', 'General Brave', 'Player', true);
        const unit1 = createMockUnit('unit-1', 'Soldier A', 'Player');
        const unit2 = createMockUnit('unit-2', 'Soldier B', 'Player');

        battle.units = [commander, unit1, unit2];

        // Set initial morale
        (unit1 as any).meta = { morale: { ...DefaultMorale, value: 80, ema: 80, state: 'steady' } };
        (unit2 as any).meta = { morale: { ...DefaultMorale, value: 75, ema: 75, state: 'steady' } };

        // Kill the commander
        commander.isDead = true;
        processUnitDeath(battle, commander.id);

        // Check that army morale dropped
        const stats = getArmyMoraleStats(battle, 'Player');
        expect(stats.averageMorale).toBeLessThan(70); // Should be below baseline

        // Check log message
        expect(battle.log.some(msg => msg.includes('Commander General Brave has fallen'))).toBe(true);
    });

    test('regular unit death has localized effect', () => {
        const battle = createMockBattle();

        // Add units at different positions
        const unit1 = createMockUnit('unit-1', 'Soldier A', 'Player');
        const unit2 = createMockUnit('unit-2', 'Soldier B', 'Player');
        const unit3 = createMockUnit('unit-3', 'Soldier C', 'Player');

        unit1.pos = { q: 0, r: 0 };
        unit2.pos = { q: 1, r: 0 }; // Adjacent
        unit3.pos = { q: 5, r: 5 }; // Far away

        battle.units = [unit1, unit2, unit3];

        // Set initial morale
        (unit1 as any).meta = { morale: { ...DefaultMorale, value: 70, ema: 70, state: 'steady' } };
        (unit2 as any).meta = { morale: { ...DefaultMorale, value: 70, ema: 70, state: 'steady' } };
        (unit3 as any).meta = { morale: { ...DefaultMorale, value: 70, ema: 70, state: 'steady' } };

        // Kill unit1
        unit1.isDead = true;
        processUnitDeath(battle, unit1.id);

        // Unit2 (adjacent) should be slightly affected
        const unit2Morale = (unit2 as any).meta?.morale;
        expect(unit2Morale.value).toBeLessThan(70);

        // Unit3 (far away) should be unaffected
        const unit3Morale = (unit3 as any).meta?.morale;
        expect(unit3Morale.value).toBe(70);
    });

    test('majority routing triggers army defeat', () => {
        const battle = createMockBattle();

        // Add 4 units, make 3 routing
        const units = [
            createMockUnit('unit-1', 'Soldier A', 'Player'),
            createMockUnit('unit-2', 'Soldier B', 'Player'),
            createMockUnit('unit-3', 'Soldier C', 'Player'),
            createMockUnit('unit-4', 'Soldier D', 'Player')
        ];

        battle.units = units;

        // Set 3 units to routing state (75% routing)
        for (let i = 0; i < 3; i++) {
            (units[i] as any).meta = {
                morale: { ...DefaultMorale, value: 20, ema: 20, state: 'routing' }
            };
        }

        // Last unit still steady
        (units[3] as any).meta = {
            morale: { ...DefaultMorale, value: 80, ema: 80, state: 'steady' }
        };

        // Process turn end
        const { processTurnEndMorale } = require('../index');
        processTurnEndMorale(battle);

        // Battle should end in defeat
        expect(battle.phase).toBe('Defeat');
        expect(battle.log.some(msg => msg.includes('Player forces have broken'))).toBe(true);
    });
});