/**
 * A* Pathfinding for Road Corridors
 * Canvas 06 - Grid-based pathfinding with terrain costs
 */

import type { Vec2, CostAtlas } from './types';
import { getCost, octileDistance } from './cost';

interface AStarNode {
    x: number;
    y: number;
    g: number;      // Cost from start
    h: number;      // Heuristic to goal
    f: number;      // g + h
    parent: AStarNode | null;
}

/**
 * Find optimal path from start to goal using A*
 * Returns path as array of points, or null if no path found
 */
export function findPath(
    start: Vec2,
    goal: Vec2,
    atlas: CostAtlas,
    maxCostMultiplier: number = 3
): Vec2[] | null {
    const startTime = performance.now();

    // Early out if start or goal is invalid
    if (getCost(atlas, start.x, start.y) === Infinity) return null;
    if (getCost(atlas, goal.x, goal.y) === Infinity) return null;

    const openSet = new Map<string, AStarNode>();
    const closedSet = new Set<string>();

    // Straight-line cost estimate for early-out
    const straightLineCost = octileDistance(start.x, start.y, goal.x, goal.y) *
        getCost(atlas, start.x, start.y);
    const maxAllowedCost = straightLineCost * maxCostMultiplier;

    // Initialize start node
    const startNode: AStarNode = {
        x: start.x,
        y: start.y,
        g: 0,
        h: octileDistance(start.x, start.y, goal.x, goal.y),
        f: 0,
        parent: null
    };
    startNode.f = startNode.g + startNode.h;

    openSet.set(key(start.x, start.y), startNode);

    let iterations = 0;
    const maxIterations = 10000; // Prevent infinite loops

    while (openSet.size > 0 && iterations < maxIterations) {
        iterations++;

        // Find node with lowest f score (convert Map to Array for older TypeScript target)
        const openNodes = Array.from(openSet.values());
        if (openNodes.length === 0) break;

        let current = openNodes[0];
        for (let i = 1; i < openNodes.length; i++) {
            if (openNodes[i].f < current.f) {
                current = openNodes[i];
            }
        }

        // Reached goal?
        if (current.x === goal.x && current.y === goal.y) {
            const path = reconstructPath(current);
            const duration = performance.now() - startTime;
            console.log(`🛣️ Path found in ${duration.toFixed(1)}ms (${path.length} points, ${iterations} iterations)`);
            return path;
        }

        // Early out if cost too high
        if (current.g > maxAllowedCost) {
            console.warn(`⚠️ Path cost exceeded ${maxCostMultiplier}× straight-line estimate, aborting`);
            return null;
        }

        // Move current from open to closed
        openSet.delete(key(current.x, current.y));
        closedSet.add(key(current.x, current.y));

        // Check all 8 neighbors
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                if (dx === 0 && dy === 0) continue;

                const nx = current.x + dx;
                const ny = current.y + dy;
                const nKey = key(nx, ny);

                // Skip if already evaluated
                if (closedSet.has(nKey)) continue;

                // Get movement cost
                const tileCost = getCost(atlas, nx, ny);
                if (tileCost === Infinity) continue;

                // Diagonal movement costs more
                const moveCost = (dx !== 0 && dy !== 0) ? 1.414 : 1.0;
                const newG = current.g + moveCost * tileCost;

                // Check if neighbor is in open set
                let neighbor = openSet.get(nKey);

                if (!neighbor) {
                    // New node
                    neighbor = {
                        x: nx,
                        y: ny,
                        g: newG,
                        h: octileDistance(nx, ny, goal.x, goal.y),
                        f: 0,
                        parent: current
                    };
                    neighbor.f = neighbor.g + neighbor.h;
                    openSet.set(nKey, neighbor);
                } else if (newG < neighbor.g) {
                    // Better path to existing node
                    neighbor.g = newG;
                    neighbor.f = neighbor.g + neighbor.h;
                    neighbor.parent = current;
                }
            }
        }
    }

    const duration = performance.now() - startTime;
    console.warn(`❌ No path found after ${iterations} iterations (${duration.toFixed(1)}ms)`);
    return null;
}

/**
 * Reconstruct path from goal node back to start
 */
function reconstructPath(node: AStarNode): Vec2[] {
    const path: Vec2[] = [];
    let current: AStarNode | null = node;

    while (current !== null) {
        path.push({ x: current.x, y: current.y });
        current = current.parent;
    }

    return path.reverse();
}

/**
 * Generate key for node map
 */
function key(x: number, y: number): string {
    return `${x},${y}`;
}

/**
 * Simplify path using Douglas-Peucker algorithm
 * Reduces number of points while preserving shape
 */
export function simplifyPath(path: Vec2[], epsilon: number = 2.0): Vec2[] {
    if (path.length <= 2) return path;

    // Find point with maximum distance from line segment
    let maxDist = 0;
    let maxIndex = 0;
    const end = path.length - 1;

    for (let i = 1; i < end; i++) {
        const dist = perpendicularDistance(path[i], path[0], path[end]);
        if (dist > maxDist) {
            maxDist = dist;
            maxIndex = i;
        }
    }

    // If max distance > epsilon, recursively simplify
    if (maxDist > epsilon) {
        const left = simplifyPath(path.slice(0, maxIndex + 1), epsilon);
        const right = simplifyPath(path.slice(maxIndex), epsilon);

        // Combine results (remove duplicate middle point)
        return [...left.slice(0, -1), ...right];
    }

    // Max distance <= epsilon, return endpoints
    return [path[0], path[end]];
}

/**
 * Calculate perpendicular distance from point to line segment
 */
function perpendicularDistance(point: Vec2, lineStart: Vec2, lineEnd: Vec2): number {
    const dx = lineEnd.x - lineStart.x;
    const dy = lineEnd.y - lineStart.y;
    const lengthSquared = dx * dx + dy * dy;

    if (lengthSquared === 0) {
        // Line start and end are the same point
        const pdx = point.x - lineStart.x;
        const pdy = point.y - lineStart.y;
        return Math.sqrt(pdx * pdx + pdy * pdy);
    }

    // Calculate projection of point onto line
    const t = Math.max(0, Math.min(1,
        ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / lengthSquared
    ));

    const projX = lineStart.x + t * dx;
    const projY = lineStart.y + t * dy;

    const pdx = point.x - projX;
    const pdy = point.y - projY;

    return Math.sqrt(pdx * pdx + pdy * pdy);
}
