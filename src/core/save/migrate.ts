/**
 * TODO #14 — Schema Migration System
 * 
 * Handles version upgrades and schema evolution for save files.
 * Ensures backward compatibility and safe data transformation.
 */

import { CombatStateV3, validateCombatState } from './schema_combat';
import { CampaignStateV3, validateCampaignState } from './schema_campaign';

export interface MigrationResult {
    success: boolean;
    fromVersion: number;
    toVersion: number;
    warnings: string[];
    errors: string[];
    data?: CombatStateV3 | CampaignStateV3;
}

export interface LegacySaveData {
    schemaVersion?: number;
    [key: string]: any;
}

/**
 * Registry of migration functions
 */
const MIGRATION_FUNCTIONS = new Map<string, (data: any) => any>();

/**
 * Register a migration function
 */
export function registerMigration(
    fromVersion: number,
    toVersion: number,
    migrationFn: (data: any) => any
): void {
    const key = `${fromVersion}->${toVersion}`;
    MIGRATION_FUNCTIONS.set(key, migrationFn);
}

/**
 * Main migration entry point
 */
export async function migrateSave(data: LegacySaveData): Promise<MigrationResult> {
    const warnings: string[] = [];
    const errors: string[] = [];

    try {
        // Determine current version
        const currentVersion = data.schemaVersion || 1;
        const targetVersion = 3;

        if (currentVersion === targetVersion) {
            // No migration needed, just validate
            const isValid = validateCurrentSchema(data);
            return {
                success: isValid,
                fromVersion: currentVersion,
                toVersion: targetVersion,
                warnings,
                errors: isValid ? [] : ['Data failed validation'],
                data: isValid ? data as (CombatStateV3 | CampaignStateV3) : undefined
            };
        }

        if (currentVersion > targetVersion) {
            errors.push(`Cannot downgrade from version ${currentVersion} to ${targetVersion}`);
            return {
                success: false,
                fromVersion: currentVersion,
                toVersion: targetVersion,
                warnings,
                errors
            };
        }

        // Perform step-by-step migration
        let workingData = { ...data };
        let workingVersion = currentVersion;

        while (workingVersion < targetVersion) {
            const nextVersion = workingVersion + 1;
            const migrationKey = `${workingVersion}->${nextVersion}`;
            const migrationFn = MIGRATION_FUNCTIONS.get(migrationKey);

            if (!migrationFn) {
                errors.push(`No migration path from version ${workingVersion} to ${nextVersion}`);
                return {
                    success: false,
                    fromVersion: currentVersion,
                    toVersion: targetVersion,
                    warnings,
                    errors
                };
            }

            try {
                workingData = migrationFn(workingData);
                workingData.schemaVersion = nextVersion;
                workingVersion = nextVersion;

                warnings.push(`Migrated from version ${workingVersion - 1} to ${workingVersion}`);

            } catch (error) {
                errors.push(`Migration from ${workingVersion} to ${nextVersion} failed: ${error instanceof Error ? error.message : 'Unknown error'
                    }`);
                return {
                    success: false,
                    fromVersion: currentVersion,
                    toVersion: targetVersion,
                    warnings,
                    errors
                };
            }
        }

        // Final validation
        const isValid = validateCurrentSchema(workingData);
        if (!isValid) {
            errors.push('Migrated data failed final validation');
        }

        return {
            success: isValid,
            fromVersion: currentVersion,
            toVersion: targetVersion,
            warnings,
            errors,
            data: isValid ? workingData as (CombatStateV3 | CampaignStateV3) : undefined
        };

    } catch (error) {
        errors.push(`Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        return {
            success: false,
            fromVersion: data.schemaVersion || 1,
            toVersion: 3,
            warnings,
            errors
        };
    }
}

/**
 * Validate data against current schema
 */
function validateCurrentSchema(data: any): boolean {
    if (!data || typeof data !== 'object') return false;

    // Check if it's combat or campaign data
    if ('units' in data && 'terrain' in data) {
        return validateCombatState(data);
    } else if ('regions' in data && 'factions' in data) {
        return validateCampaignState(data);
    }

    return false;
}

// =============================================================================
// Migration Functions
// =============================================================================

/**
 * Migration: v1 -> v2
 * Adds basic versioning and metadata
 */
registerMigration(1, 2, (data: any) => {
    // Validate that input has at least some valid structure
    // V1 saves must have either units/terrain (combat) or regions/factions (campaign)
    const hasValidStructure = 
        (data.units || data.terrain) || 
        (data.regions || data.factions);
    
    if (!hasValidStructure) {
        throw new Error('Invalid v1 save data: missing required fields');
    }

    const migrated = { ...data };

    // Add version info
    migrated.schemaVersion = 2;
    migrated.buildCommit = 'legacy';
    migrated.saveTimestamp = Date.now();

    // Ensure required fields exist
    if (!migrated.seed) {
        migrated.seed = `legacy_${Math.random().toString(36).substr(2, 9)}`;
    }

    if (!migrated.rngState) {
        migrated.rngState = '0';
    }

    // Normalize faction data if present
    if (migrated.factions && Array.isArray(migrated.factions)) {
        migrated.factions = migrated.factions.map((faction: any) => ({
            ...faction,
            isPlayer: faction.isPlayer || false,
            isAI: faction.isAI !== false // default to true
        }));
    }

    return migrated;
});

/**
 * Migration: v2 -> v3
 * Major schema update with new structure
 */
registerMigration(2, 3, (data: any) => {
    const migrated = { ...data };

    // Update version
    migrated.schemaVersion = 3;

    // Determine if this is combat or campaign data
    const isCombat = 'units' in data && 'terrain' in data;

    if (isCombat) {
        // Migrate combat data
        migrated.battleId = migrated.battleId || `battle_${Date.now()}`;
        migrated.battleType = migrated.battleType || 'skirmish';

        // Ensure turn queue structure
        if (!migrated.turnQueue || typeof migrated.turnQueue !== 'object') {
            migrated.turnQueue = {
                currentTurn: 1,
                currentPhase: 'hero',
                actionQueue: [],
                turnHistory: []
            };
        }

        // Migrate units to new format
        if (migrated.units && Array.isArray(migrated.units)) {
            migrated.units = migrated.units.map((unit: any) => ({
                ...unit,
                stats: unit.stats || {
                    hp: unit.hp || 100,
                    maxHp: unit.maxHp || 100,
                    ap: unit.ap || 6,
                    maxAp: unit.maxAp || 6,
                    initiative: unit.initiative || 10,
                    morale: unit.morale || 0,
                    cohesion: unit.cohesion || 0
                },
                abilities: unit.abilities || [],
                spells: unit.spells || [],
                activeAbilities: unit.activeAbilities || {},
                statuses: unit.statuses || [],
                equipment: unit.equipment || [],
                modifiers: unit.modifiers || {},
                isDead: unit.isDead || false,
                isRouted: unit.isRouted || false,
                hasActed: unit.hasActed || false,
                hasMovedThisTurn: unit.hasMovedThisTurn || false
            }));
        }

        // Ensure terrain format
        if (migrated.terrain && Array.isArray(migrated.terrain)) {
            migrated.terrain = migrated.terrain.map((tile: any) => ({
                q: tile.q || 0,
                r: tile.r || 0,
                type: tile.type || 'grass',
                elevation: tile.elevation || 0,
                passable: tile.passable !== false,
                movementCost: tile.movementCost || 1,
                cover: tile.cover || 0,
                features: tile.features || [],
                occupiedBy: tile.occupiedBy
            }));
        }

        // Add missing fields
        migrated.width = migrated.width || 20;
        migrated.height = migrated.height || 20;
        migrated.mapId = migrated.mapId || 'legacy_map';
        migrated.objectives = migrated.objectives || [];
        migrated.spellsInFlight = migrated.spellsInFlight || [];
        migrated.auraEffects = migrated.auraEffects || [];

        if (!migrated.weather) {
            migrated.weather = {
                type: 'clear',
                intensity: 0,
                turnsRemaining: 0,
                effects: {}
            };
        }

        migrated.isActive = migrated.isActive !== false;
        migrated.isPaused = migrated.isPaused || false;

        if (!migrated.metrics) {
            migrated.metrics = {
                startTime: migrated.saveTimestamp || Date.now(),
                elapsedTurns: migrated.turnQueue?.currentTurn || 1,
                totalDamageDealt: {},
                unitsLost: {},
                spellsCast: 0,
                criticalHits: 0
            };
        }

    } else {
        // Migrate campaign data
        migrated.campaignId = migrated.campaignId || `campaign_${Date.now()}`;
        migrated.campaignName = migrated.campaignName || 'Legacy Campaign';
        migrated.difficulty = migrated.difficulty || 'normal';

        // Ensure world clock
        if (!migrated.worldClock) {
            migrated.worldClock = {
                year: 1,
                season: 'spring',
                week: 1,
                day: 1,
                totalDays: 1
            };
        }

        // Ensure arrays exist
        migrated.regions = migrated.regions || [];
        migrated.roads = migrated.roads || [];
        migrated.factions = migrated.factions || [];
        migrated.heroes = migrated.heroes || [];
        migrated.armies = migrated.armies || [];
        migrated.tradeRoutes = migrated.tradeRoutes || [];
        migrated.globalPrices = migrated.globalPrices || {};
        migrated.activeEvents = migrated.activeEvents || [];
        migrated.eventHistory = migrated.eventHistory || [];
        migrated.activeBattles = migrated.activeBattles || [];
        migrated.objectives = migrated.objectives || [];

        // Player state
        migrated.playerFactionId = migrated.playerFactionId || '';
        migrated.playerHeroId = migrated.playerHeroId || '';
        migrated.playerGold = migrated.playerGold || 1000;
        migrated.playerReputation = migrated.playerReputation || {};

        // Save metadata
        migrated.playTime = migrated.playTime || 0;
        migrated.saveSlot = migrated.saveSlot || 'slot_1';
        migrated.manualSave = migrated.manualSave !== false;
    }

    // Common fields
    migrated.checksum = migrated.checksum || '';

    return migrated;
});

/**
 * Check if save data needs migration
 */
export function needsMigration(data: LegacySaveData): boolean {
    const currentVersion = data.schemaVersion || 1;
    const targetVersion = 3;
    return currentVersion < targetVersion;
}

/**
 * Get migration path description
 */
export function getMigrationPath(fromVersion: number, toVersion: number): string[] {
    const path: string[] = [];
    let current = fromVersion;

    while (current < toVersion) {
        const next = current + 1;
        const key = `${current}->${next}`;
        if (MIGRATION_FUNCTIONS.has(key)) {
            path.push(`v${current} → v${next}`);
        } else {
            path.push(`v${current} → v${next} (MISSING)`);
            break;
        }
        current = next;
    }

    return path;
}

/**
 * Create a backup of data before migration
 */
export function createMigrationBackup(
    data: LegacySaveData,
    slot: string
): { backupSlot: string; timestamp: number } {
    const timestamp = Date.now();
    const backupSlot = `${slot}_backup_v${data.schemaVersion || 1}_${timestamp}`;

    // In a real implementation, you'd save this to storage
    console.log(`Created migration backup: ${backupSlot}`);

    return { backupSlot, timestamp };
}