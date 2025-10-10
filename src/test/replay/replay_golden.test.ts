/**
 * Replay Golden Tests - World Engine
 * Tests that ensure deterministic behavior across game systems
 * @vitest-environment node
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { setTestRNG, setTestTime } from '../utils/deterministic';

// Import fixtures
import basicCombat from './fixtures/basic_combat.json';
import strategicCycle from './fixtures/strategic_cycle.json';

interface ReplayFixture {
    name: string;
    description: string;
    seed: number;
    baseState: any;
    actions: Array<{
        type: string;
        timestamp: number;
        [key: string]: any;
    }>;
}

interface ReplayResult {
    steps: any[];
    finalState: any;
    log: string[];
    metadata: {
        seed: number;
        timestamp: number;
        version: string;
    };
}

const fixtures: ReplayFixture[] = [
    basicCombat as ReplayFixture,
    strategicCycle as ReplayFixture
];

/**
 * Mock resolver for testing (replace with actual game resolver)
 */
function mockResolveActions(baseState: any, actions: any[]): ReplayResult {
    // Set deterministic environment
    setTestRNG(baseState.seed || 12345);
    setTestTime(1000);

    const steps: any[] = [];
    const log: string[] = [];
    let currentState = JSON.parse(JSON.stringify(baseState)); // Deep clone

    for (const action of actions) {
        // Mock action resolution based on type
        const step = {
            action,
            stateDelta: {},
            timestamp: action.timestamp,
            rngState: baseState.seed || 12345 // In real implementation, capture RNG state
        };

        switch (action.type) {
            case 'attack':
                // Mock combat resolution
                step.stateDelta = {
                    damage: 15,
                    target: action.targetId,
                    attacker: action.actorId
                };
                log.push(`${action.actorId} attacks ${action.targetId} for 15 damage`);
                break;

            case 'command':
                // Mock command resolution
                step.stateDelta = {
                    command: action.abilityId,
                    caster: action.actorId
                };
                log.push(`${action.actorId} uses ${action.abilityId}`);
                break;

            case 'season_start':
                step.stateDelta = { phase: 'income' };
                log.push('Season begins - collecting income');
                break;

            case 'collect_income':
                step.stateDelta = { goldGained: 100 };
                log.push('Income collected: 100 gold');
                break;

            case 'pay_upkeep':
                step.stateDelta = { goldSpent: 50 };
                log.push('Upkeep paid: 50 gold');
                break;

            case 'season_end':
                step.stateDelta = { phase: 'end' };
                log.push('Season ends');
                break;

            case 'advance_season':
                step.stateDelta = { season: 'Summer', turn: 1 };
                log.push('Advanced to Summer');
                break;

            default:
                step.stateDelta = { unknown: action.type };
                log.push(`Unknown action: ${action.type}`);
        }

        steps.push(step);
    }

    return {
        steps,
        finalState: currentState,
        log,
        metadata: {
            seed: baseState.seed || 12345,
            timestamp: Date.now(),
            version: '1.0.0'
        }
    };
}

function getGoldenPath(fixtureName: string): string {
    return join(__dirname, 'golden', `${fixtureName}.json`);
}

function getDiffPath(fixtureName: string): string {
    const diffDir = join(__dirname, 'diffs');
    if (!existsSync(diffDir)) {
        mkdirSync(diffDir, { recursive: true });
    }
    return join(diffDir, `${fixtureName}.diff.json`);
}

function loadGolden(fixtureName: string): any | null {
    const goldenPath = getGoldenPath(fixtureName);
    if (!existsSync(goldenPath)) {
        return null;
    }
    try {
        return JSON.parse(readFileSync(goldenPath, 'utf-8'));
    } catch (error) {
        console.warn(`Failed to load golden file for ${fixtureName}:`, error);
        return null;
    }
}

function saveGolden(fixtureName: string, result: ReplayResult): void {
    const goldenPath = getGoldenPath(fixtureName);
    const goldenDir = join(__dirname, 'golden');
    if (!existsSync(goldenDir)) {
        mkdirSync(goldenDir, { recursive: true });
    }
    writeFileSync(goldenPath, JSON.stringify(result, null, 2));
}

function saveDiff(fixtureName: string, expected: any, actual: any): void {
    const diffPath = getDiffPath(fixtureName);
    const diff = {
        fixture: fixtureName,
        timestamp: new Date().toISOString(),
        expected,
        actual,
        summary: {
            stepCountMismatch: expected.steps?.length !== actual.steps?.length,
            logCountMismatch: expected.log?.length !== actual.log?.length,
            seedMismatch: expected.metadata?.seed !== actual.metadata?.seed
        }
    };
    writeFileSync(diffPath, JSON.stringify(diff, null, 2));
}

describe('Replay Golden Tests', () => {
    beforeEach(() => {
        // Ensure clean state for each test
        setTestTime(1000);
    });

    describe('Combat System Replays', () => {
        it('should reproduce basic combat sequence deterministically', () => {
            const fixture = fixtures.find(f => f.name === 'basic_combat_sequence')!;
            const result = mockResolveActions(fixture.baseState, fixture.actions);

            // Check if golden file exists
            const golden = loadGolden(fixture.name);

            if (!golden) {
                // First run - create golden file
                saveGolden(fixture.name, result);
                console.log(`Created golden file for ${fixture.name}`);
                return;
            }

            try {
                // Compare steps
                expect(result.steps).toEqual(golden.steps);
                expect(result.log).toEqual(golden.log);
                expect(result.metadata.seed).toBe(golden.metadata.seed);
            } catch (error) {
                // Save diff for analysis
                saveDiff(fixture.name, golden, result);
                throw error;
            }
        });
    });

    describe('Strategic System Replays', () => {
        it('should reproduce strategic season cycle deterministically', () => {
            const fixture = fixtures.find(f => f.name === 'strategic_season_cycle')!;
            const result = mockResolveActions(fixture.baseState, fixture.actions);

            const golden = loadGolden(fixture.name);

            if (!golden) {
                saveGolden(fixture.name, result);
                console.log(`Created golden file for ${fixture.name}`);
                return;
            }

            try {
                expect(result.steps).toEqual(golden.steps);
                expect(result.log).toEqual(golden.log);
                expect(result.metadata.seed).toBe(golden.metadata.seed);
            } catch (error) {
                saveDiff(fixture.name, golden, result);
                throw error;
            }
        });
    });

    describe('Golden File Management', () => {
        it('should be able to update golden files when needed', () => {
            // This test documents the update process
            const updateMode = process.env.UPDATE_GOLDENS === 'true';

            if (updateMode) {
                for (const fixture of fixtures) {
                    const result = mockResolveActions(fixture.baseState, fixture.actions);
                    saveGolden(fixture.name, result);
                }
                console.log('Updated all golden files');
            }

            expect(true).toBe(true); // Always pass, this is just documentation
        });
    });
});