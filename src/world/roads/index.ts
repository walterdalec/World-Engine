/**
 * Road System Module — Canvas 06
 * Terrain-aware road network linking settlements
 * 
 * Three-stage algorithm:
 * 1. MST: Connect capitals with minimum spanning tree
 * 2. A*: Refine edges into terrain-aware corridors
 * 3. Crossings: Detect rivers/mountains and place bridges/fords/tunnels
 */

// Main API
export {
    buildRoads,
    nearestRoad,
    pathOnRoads,
    createSpatialIndex
} from './api';

// Types
export type {
    RoadGraph,
    Vec2,
    NearestRoadResult,
    BuildRoadsInput,
    CostWeights
} from './api';

// Constants
export { DEFAULT_COST_WEIGHTS } from './types';

// Spatial index class for advanced queries
export { RoadSpatialIndex } from './graph';
