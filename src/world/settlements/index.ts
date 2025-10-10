/**
 * Settlements Module — Canvas 07
 * Settlements, POIs, and Region Ownership
 */

// Main API
export {
    generateSettlementsAndRegions,
    DEFAULT_PLACEMENT_KNOBS
} from './api';

// Types
export type {
    Settlement,
    Region,
    POI,
    PlacementInput,
    PlacementOutput,
    PlacementKnobs
} from './types';

// Utility functions
export { calculateSuitability } from './suitability';
