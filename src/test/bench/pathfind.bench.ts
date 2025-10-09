/**
 * Pathfinding Benchmarks - World Engine
 * Tests performance of hex pathfinding algorithms
 */

import { Bench } from 'tinybench';
import { setTestRNG } from '../utils/deterministic';

// Mock hex pathfinding (replace with actual implementation)
interface HexPosition {
    q: number;
    r: number;
}

interface TerrainCell {
    q: number;
    r: number;
    passable: boolean;
    cost: number;
}

// Simple A* pathfinding implementation for benchmarking
function hexDistance(a: HexPosition, b: HexPosition): number {
    return (Math.abs(a.q - b.q) + Math.abs(a.q + a.r - b.q - b.r) + Math.abs(a.r - b.r)) / 2;
}

function getNeighbors(pos: HexPosition): HexPosition[] {
    const directions = [
        { q: 1, r: 0 }, { q: 1, r: -1 }, { q: 0, r: -1 },
        { q: -1, r: 0 }, { q: -1, r: 1 }, { q: 0, r: 1 }
    ];
    return directions.map(dir => ({ q: pos.q + dir.q, r: pos.r + dir.r }));
}

function findPath(
    start: HexPosition,
    goal: HexPosition,
    terrain: TerrainCell[],
    passableCheck: (pos: HexPosition) => boolean
): HexPosition[] {
    const terrainMap = new Map<string, TerrainCell>();
    terrain.forEach(cell => terrainMap.set(`${cell.q},${cell.r}`, cell));

    const openSet = [start];
    const cameFrom = new Map<string, HexPosition>();
    const gScore = new Map<string, number>();
    const fScore = new Map<string, number>();

    const getKey = (pos: HexPosition) => `${pos.q},${pos.r}`;

    gScore.set(getKey(start), 0);
    fScore.set(getKey(start), hexDistance(start, goal));

    while (openSet.length > 0) {
        // Find node with lowest fScore
        let current = openSet[0];
        let currentIndex = 0;
        for (let i = 1; i < openSet.length; i++) {
            if ((fScore.get(getKey(openSet[i])) || Infinity) < (fScore.get(getKey(current)) || Infinity)) {
                current = openSet[i];
                currentIndex = i;
            }
        }

        // If reached goal
        if (current.q === goal.q && current.r === goal.r) {
            const path: HexPosition[] = [];
            let temp = current;
            while (temp) {
                path.unshift(temp);
                temp = cameFrom.get(getKey(temp))!;
            }
            return path;
        }

        // Remove current from openSet
        openSet.splice(currentIndex, 1);

        // Check neighbors
        for (const neighbor of getNeighbors(current)) {
            if (!passableCheck(neighbor)) continue;

            const neighborKey = getKey(neighbor);
            const terrain = terrainMap.get(neighborKey);
            const moveCost = terrain?.cost || 1;
            const tentativeGScore = (gScore.get(getKey(current)) || 0) + moveCost;

            if (tentativeGScore < (gScore.get(neighborKey) || Infinity)) {
                cameFrom.set(neighborKey, current);
                gScore.set(neighborKey, tentativeGScore);
                fScore.set(neighborKey, tentativeGScore + hexDistance(neighbor, goal));

                if (!openSet.some(pos => pos.q === neighbor.q && pos.r === neighbor.r)) {
                    openSet.push(neighbor);
                }
            }
        }
    }

    return []; // No path found
}

// Generate test terrain
function generateTerrain(size: number = 20): TerrainCell[] {
    setTestRNG(42); // Deterministic terrain
    const terrain: TerrainCell[] = [];

    for (let q = -size; q <= size; q++) {
        for (let r = -size; r <= size; r++) {
            if (Math.abs(q + r) <= size) {
                terrain.push({
                    q,
                    r,
                    passable: Math.random() > 0.2, // 80% passable
                    cost: Math.random() > 0.5 ? 1 : 2 // Variable movement cost
                });
            }
        }
    }

    return terrain;
}

// Test scenarios
const testTerrain = generateTerrain(15);
const passableCheck = (pos: HexPosition) => {
    const cell = testTerrain.find(c => c.q === pos.q && c.r === pos.r);
    return cell ? cell.passable : false;
};

const scenarios = [
    {
        name: 'path 4 steps',
        start: { q: 0, r: 0 },
        goal: { q: 2, r: -2 }
    },
    {
        name: 'path 8 steps',
        start: { q: 0, r: 0 },
        goal: { q: 4, r: -4 }
    },
    {
        name: 'path 12 steps',
        start: { q: 0, r: 0 },
        goal: { q: 6, r: -6 }
    },
    {
        name: 'path 16 steps',
        start: { q: 0, r: 0 },
        goal: { q: 8, r: -8 }
    }
];

const bench = new Bench({ time: 1000, iterations: 1000 });

// Add benchmarks for each scenario
for (const scenario of scenarios) {
    bench.add(scenario.name, () => {
        findPath(scenario.start, scenario.goal, testTerrain, passableCheck);
    });
}

export default bench;