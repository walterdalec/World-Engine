// ──────────────────────────────────────────────────────────────────────────────
// File: src/features/world/encounters/index.ts
// Purpose: Export encounters and gates system
// ──────────────────────────────────────────────────────────────────────────────

export * from './types';
export { 
    rollEncounter, 
    getEncounterDensity, 
    getSpawnChance 
} from './tables';
export * from './generator';
