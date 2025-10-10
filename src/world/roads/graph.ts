/**
 * Road Graph — Topology, nearest road lookup, and constrained path finding
 * 
 * Provides spatial queries and graph traversal for the road network.
 */

import type { Vec2, RoadGraph, RoadNode, RoadEdge } from './types';

export interface NearestRoadResult {
    node: RoadNode;
    edge: RoadEdge | null;
    distance: number;
    pointOnRoad: Vec2;
}

/**
 * Build a spatial index for fast nearest-road queries.
 * For simplicity, using a grid-based spatial hash.
 */
export class RoadSpatialIndex {
    private grid: Map<string, RoadNode[]> = new Map();
    private cellSize: number;

    constructor(graph: RoadGraph, cellSize = 10) {
        this.cellSize = cellSize;
        this.buildIndex(graph);
    }

    private buildIndex(graph: RoadGraph): void {
        // Clear existing index
        this.grid.clear();

        // Index all nodes by grid cell
        for (const node of graph.nodes) {
            const key = this.getCellKey(node.x, node.y);
            const nodes = this.grid.get(key) || [];
            nodes.push(node);
            this.grid.set(key, nodes);
        }
    }

    private getCellKey(x: number, y: number): string {
        const cx = Math.floor(x / this.cellSize);
        const cy = Math.floor(y / this.cellSize);
        return `${cx},${cy}`;
    }

    /**
     * Find nearest road node to a position.
     * 
     * @param pos Query position
     * @param maxRadius Maximum search radius (default: 50 tiles)
     * @returns Nearest node or null if none within radius
     */
    findNearest(pos: Vec2, maxRadius = 50): RoadNode | null {
        let nearest: RoadNode | null = null;
        let nearestDist = maxRadius;

        // Check cells in expanding rings
        const cellRadius = Math.ceil(maxRadius / this.cellSize);
        const centerCellX = Math.floor(pos.x / this.cellSize);
        const centerCellY = Math.floor(pos.y / this.cellSize);

        for (let r = 0; r <= cellRadius; r++) {
            for (let dy = -r; dy <= r; dy++) {
                for (let dx = -r; dx <= r; dx++) {
                    // Only check cells on the ring perimeter
                    if (Math.abs(dx) !== r && Math.abs(dy) !== r) continue;

                    const key = `${centerCellX + dx},${centerCellY + dy}`;
                    const nodes = this.grid.get(key);
                    if (!nodes) continue;

                    for (const node of nodes) {
                        const dist = Math.sqrt(
                            (node.x - pos.x) ** 2 +
                            (node.y - pos.y) ** 2
                        );

                        if (dist < nearestDist) {
                            nearestDist = dist;
                            nearest = node;
                        }
                    }
                }
            }
        }

        return nearest;
    }
}

/**
 * Find nearest road (node or edge point) to a position.
 * 
 * @param pos Query position
 * @param graph Road network
 * @param maxRadius Maximum search distance
 * @returns Nearest road result or null
 */
export function findNearestRoad(
    pos: Vec2,
    graph: RoadGraph,
    maxRadius = 50
): NearestRoadResult | null {
    const index = new RoadSpatialIndex(graph);
    const nearestNode = index.findNearest(pos, maxRadius);

    if (!nearestNode) return null;

    const nodeDist = Math.sqrt(
        (nearestNode.x - pos.x) ** 2 +
        (nearestNode.y - pos.y) ** 2
    );

    // For now, just return the nearest node
    // A full implementation would also check edges
    return {
        node: nearestNode,
        edge: null,
        distance: nodeDist,
        pointOnRoad: { x: nearestNode.x, y: nearestNode.y }
    };
}

/**
 * Find a path along existing roads between two positions.
 * Uses Dijkstra's algorithm on the road graph.
 * 
 * @param start Starting position
 * @param goal Goal position
 * @param graph Road network
 * @param maxSnap Maximum distance to snap start/goal to road (default: 20)
 * @returns Path along roads or null if unreachable
 */
export function findPathOnRoads(
    start: Vec2,
    goal: Vec2,
    graph: RoadGraph,
    maxSnap = 20
): Vec2[] | null {
    // Find nearest road nodes for start and goal
    const startNearest = findNearestRoad(start, graph, maxSnap);
    const goalNearest = findNearestRoad(goal, graph, maxSnap);

    if (!startNearest || !goalNearest) {
        console.warn('⚠️ Cannot snap start/goal to road network');
        return null;
    }

    // Build adjacency map
    const adjacency = new Map<string, Array<{ node: RoadNode; cost: number }>>();

    for (const edge of graph.edges) {
        const nodeA = graph.nodes.find(n => n.id === edge.a);
        const nodeB = graph.nodes.find(n => n.id === edge.b);

        if (!nodeA || !nodeB) continue;

        const cost = edge.length;

        // Bidirectional edges
        const neighborsA = adjacency.get(edge.a) || [];
        neighborsA.push({ node: nodeB, cost });
        adjacency.set(edge.a, neighborsA);

        const neighborsB = adjacency.get(edge.b) || [];
        neighborsB.push({ node: nodeA, cost });
        adjacency.set(edge.b, neighborsB);
    }

    // Dijkstra's algorithm
    const dist = new Map<string, number>();
    const prev = new Map<string, RoadNode | null>();
    const unvisited = new Set<string>();

    for (const node of graph.nodes) {
        dist.set(node.id, Infinity);
        prev.set(node.id, null);
        unvisited.add(node.id);
    }

    dist.set(startNearest.node.id, 0);

    while (unvisited.size > 0) {
        // Find unvisited node with smallest distance (convert to Array for TypeScript)
        const unvisitedArray = Array.from(unvisited);
        if (unvisitedArray.length === 0) break;

        let current: RoadNode | null = null;
        let currentDist = Infinity;

        for (const id of unvisitedArray) {
            const d = dist.get(id) || Infinity;
            if (d < currentDist) {
                currentDist = d;
                current = graph.nodes.find(n => n.id === id) || null;
            }
        }

        if (!current || currentDist === Infinity) break;

        unvisited.delete(current.id);

        // Check if we reached the goal
        if (current.id === goalNearest.node.id) {
            break;
        }

        // Update neighbors
        const neighbors = adjacency.get(current.id) || [];
        for (const { node: neighbor, cost } of neighbors) {
            if (!unvisited.has(neighbor.id)) continue;

            const alt = currentDist + cost;
            const neighborDist = dist.get(neighbor.id) || Infinity;

            if (alt < neighborDist) {
                dist.set(neighbor.id, alt);
                prev.set(neighbor.id, current);
            }
        }
    }

    // Reconstruct path
    const path: Vec2[] = [];
    let current: RoadNode | null = goalNearest.node;

    while (current) {
        path.unshift({ x: current.x, y: current.y });
        current = prev.get(current.id) || null;
    }

    // Add actual start/goal positions
    if (path.length > 0) {
        path.unshift(start);
        path.push(goal);
    }

    return path.length > 1 ? path : null;
}

/**
 * Get all nodes within a radius of a position.
 * Useful for local queries like "what roads are nearby?"
 * 
 * @param pos Center position
 * @param graph Road network
 * @param radius Search radius
 * @returns Nodes within radius
 */
export function getNodesInRadius(
    pos: Vec2,
    graph: RoadGraph,
    radius: number
): RoadNode[] {
    const results: RoadNode[] = [];
    const radiusSquared = radius * radius;

    for (const node of graph.nodes) {
        const dx = node.x - pos.x;
        const dy = node.y - pos.y;
        const distSq = dx * dx + dy * dy;

        if (distSq <= radiusSquared) {
            results.push(node);
        }
    }

    return results;
}
