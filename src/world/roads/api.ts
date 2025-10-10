/**
 * Road System Public API
 * Canvas 06 - Main entry point for road network generation
 * 
 * Exports:
 * - buildRoads(): Complete road network from settlements
 * - nearestRoad(): Spatial query for closest road
 * - pathOnRoads(): Constrained pathfinding along existing roads
 */

import type { Vec2, RoadGraph, BuildRoadsInput, CostWeights } from './types';
import { DEFAULT_COST_WEIGHTS } from './types';
import { buildCostAtlas } from './cost';
import { buildCapitalMST } from './mst';
import { findPath, simplifyPath } from './astar';
import { detectCrossings } from './crossings';
import { findNearestRoad, findPathOnRoads, RoadSpatialIndex } from './graph';
import type { NearestRoadResult } from './graph';

export type { RoadGraph, Vec2, NearestRoadResult };

interface ExtendedBuildRoadsInput extends BuildRoadsInput {
    costWeights?: CostWeights;
}

/**
 * Build a complete road network linking settlements.
 * 
 * This is the main API function that orchestrates the three-stage algorithm:
 * 1. MST: Connect capitals with minimum spanning tree
 * 2. A*: Refine each MST edge into terrain-aware corridors
 * 3. Crossings: Detect rivers/mountains and place bridges/fords/tunnels
 * 
 * @param input Settlements, world size, tile access, and cost weights
 * @returns Complete road graph with nodes and edges
 */
export function buildRoads(input: ExtendedBuildRoadsInput): RoadGraph {
    const startTime = performance.now();
    console.log('🛣️ Building road network...', {
        capitals: input.capitals.length,
        worldSize: `${input.worldWidth}×${input.worldHeight}`,
        weights: input.costWeights
    });
    
    // Stage 1: Build cost atlas
    console.log('📊 Stage 1: Building cost atlas...');
    const costAtlas = buildCostAtlas(input, input.costWeights || DEFAULT_COST_WEIGHTS);
    
    // Stage 2: MST backbone
    console.log('🌳 Stage 2: Building MST backbone...');
    const mstEdges = buildCapitalMST(input.capitals, costAtlas);
    
    console.log(`✅ MST complete: ${mstEdges.length} edges`);
    
    // Stage 3: Refine with A*
    console.log('🎯 Stage 3: Refining corridors with A*...');
    const refinedPaths: Array<{ a: Vec2; b: Vec2; path: Vec2[] }> = [];
    
    for (let i = 0; i < mstEdges.length; i++) {
        const edge = mstEdges[i];
        const from = input.capitals[edge.from];
        const to = input.capitals[edge.to];
        
        const path = findPath(from, to, costAtlas);
        
        if (path) {
            const simplified = simplifyPath(path, 2.0); // Simplify to reduce points
            refinedPaths.push({
                a: from,
                b: to,
                path: simplified
            });
            
            if ((i + 1) % 10 === 0) {
                console.log(`  ... ${i + 1}/${mstEdges.length} corridors refined`);
            }
        } else {
            console.warn(`⚠️ Failed to find path for edge ${i}: no valid corridor`);
        }
    }
    
    console.log(`✅ A* refinement complete: ${refinedPaths.length} corridors`);
    
    // Stage 4: Detect crossings
    console.log('🌉 Stage 4: Detecting crossings...');
    const allCrossings: Array<{ path: Vec2[]; crossings: ReturnType<typeof detectCrossings> }> = [];
    
    for (const refined of refinedPaths) {
        const crossings = detectCrossings({
            path: refined.path,
            getTile: input.getTile
        });
        
        if (crossings.length > 0) {
            allCrossings.push({ path: refined.path, crossings });
        }
    }
    
    const totalCrossings = allCrossings.reduce((sum, c) => sum + c.crossings.length, 0);
    console.log(`✅ Crossings detected: ${totalCrossings} total`);
    
    // Stage 5: Build final graph
    console.log('🗺️ Stage 5: Building final graph...');
    const graph: RoadGraph = {
        nodes: [],
        edges: [],
        version: 1
    };
    
    // Add settlement nodes
    for (const capital of input.capitals) {
        graph.nodes.push({
            id: `settlement_${capital.x}_${capital.y}`,
            x: capital.x,
            y: capital.y,
            kind: 'settlement'
        });
    }
    
    // Add crossing nodes and junction nodes
    let crossingId = 0;
    let junctionId = 0;
    
    for (const { path, crossings } of allCrossings) {
        for (const crossing of crossings) {
            graph.nodes.push({
                id: `${crossing.type}_${crossingId++}`,
                x: crossing.position.x,
                y: crossing.position.y,
                kind: crossing.type
            });
        }
        
        // Add junction nodes at path waypoints (simplified)
        for (const point of path) {
            // Check if node already exists at this position
            const exists = graph.nodes.some(n => n.x === point.x && n.y === point.y);
            if (!exists) {
                graph.nodes.push({
                    id: `junction_${junctionId++}`,
                    x: point.x,
                    y: point.y,
                    kind: 'junction'
                });
            }
        }
    }
    
    // Add edges
    let edgeId = 0;
    for (const refined of refinedPaths) {
        const length = refined.path.length;
        
        graph.edges.push({
            id: `edge_${edgeId++}`,
            a: `settlement_${refined.a.x}_${refined.a.y}`,
            b: `settlement_${refined.b.x}_${refined.b.y}`,
            tier: 2, // Default to arterial roads (tier 2)
            length,
            flags: 0,
            path: refined.path
        });
    }
    
    const duration = performance.now() - startTime;
    console.log(`✅ Road network complete in ${(duration / 1000).toFixed(2)}s`, {
        nodes: graph.nodes.length,
        edges: graph.edges.length,
        crossings: totalCrossings
    });
    
    return graph;
}

/**
 * Find the nearest road to a position.
 * Useful for snapping entities to roads or finding nearby travel routes.
 * 
 * @param pos Query position
 * @param graph Road network
 * @param maxRadius Maximum search distance (default: 50 tiles)
 * @returns Nearest road or null if none within radius
 */
export function nearestRoad(
    pos: Vec2,
    graph: RoadGraph,
    maxRadius = 50
): NearestRoadResult | null {
    return findNearestRoad(pos, graph, maxRadius);
}

/**
 * Find a path along existing roads from start to goal.
 * Constrains pathfinding to the road network instead of open terrain.
 * 
 * @param start Starting position
 * @param goal Goal position
 * @param graph Road network
 * @param maxSnap Maximum distance to snap to roads (default: 20 tiles)
 * @returns Path along roads or null if unreachable
 */
export function pathOnRoads(
    start: Vec2,
    goal: Vec2,
    graph: RoadGraph,
    maxSnap = 20
): Vec2[] | null {
    return findPathOnRoads(start, goal, graph, maxSnap);
}

/**
 * Export the spatial index for advanced queries.
 * @param graph Road network
 * @param cellSize Grid cell size for spatial partitioning (default: 10)
 * @returns Spatial index for efficient queries
 */
export function createSpatialIndex(graph: RoadGraph, cellSize = 10): RoadSpatialIndex {
    return new RoadSpatialIndex(graph, cellSize);
}

// Re-export key types
export type { BuildRoadsInput, CostWeights };
export { DEFAULT_COST_WEIGHTS } from './types';
