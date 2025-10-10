/**
 * Line of Sight Benchmarks - World Engine
 * Tests performance of hex LOS calculations
 */

import { Bench } from 'tinybench';
import { setTestRNG } from '../utils/deterministic';

interface HexPosition {
    q: number;
    r: number;
}

interface LOSResult {
    blocked: boolean;
    blockedAt?: HexPosition;
    rayLength: number;
}

// Convert hex to cube coordinates for easier math
function hexToCube(hex: HexPosition): { x: number; y: number; z: number } {
    const x = hex.q;
    const z = hex.r;
    const y = -x - z;
    return { x, y, z };
}

function cubeToHex(cube: { x: number; y: number; z: number }): HexPosition {
    return { q: cube.x, r: cube.z };
}

// Cube linear interpolation
function cubeLinearInterp(a: { x: number; y: number; z: number }, b: { x: number; y: number; z: number }, t: number) {
    return {
        x: a.x + (b.x - a.x) * t,
        y: a.y + (b.y - a.y) * t,
        z: a.z + (b.z - a.z) * t
    };
}

function cubeRound(cube: { x: number; y: number; z: number }): { x: number; y: number; z: number } {
    let rx = Math.round(cube.x);
    let ry = Math.round(cube.y);
    let rz = Math.round(cube.z);

    const xDiff = Math.abs(rx - cube.x);
    const yDiff = Math.abs(ry - cube.y);
    const zDiff = Math.abs(rz - cube.z);

    if (xDiff > yDiff && xDiff > zDiff) {
        rx = -ry - rz;
    } else if (yDiff > zDiff) {
        ry = -rx - rz;
    } else {
        rz = -rx - ry;
    }

    return { x: rx, y: ry, z: rz };
}

// Hex line algorithm
function hexLine(start: HexPosition, end: HexPosition): HexPosition[] {
    const cubeStart = hexToCube(start);
    const cubeEnd = hexToCube(end);

    const distance = Math.max(
        Math.abs(cubeStart.x - cubeEnd.x),
        Math.abs(cubeStart.y - cubeEnd.y),
        Math.abs(cubeStart.z - cubeEnd.z)
    );

    if (distance === 0) return [start];

    const results: HexPosition[] = [];
    for (let i = 0; i <= distance; i++) {
        const t = i / distance;
        const interpolated = cubeLinearInterp(cubeStart, cubeEnd, t);
        const rounded = cubeRound(interpolated);
        results.push(cubeToHex(rounded));
    }

    return results;
}

// LOS calculation with blocking terrain
function calculateLOS(
    start: HexPosition,
    end: HexPosition,
    isBlocked: (_pos: HexPosition) => boolean
): LOSResult {
    const line = hexLine(start, end);

    // Skip start position, check all other positions
    for (let i = 1; i < line.length - 1; i++) {
        if (isBlocked(line[i])) {
            return {
                blocked: true,
                blockedAt: line[i],
                rayLength: i
            };
        }
    }

    return {
        blocked: false,
        rayLength: line.length
    };
}

// Generate blocking terrain for tests
function generateBlockingTerrain(density: number = 0.3): Set<string> {
    setTestRNG(123); // Deterministic terrain
    const blocked = new Set<string>();

    for (let q = -20; q <= 20; q++) {
        for (let r = -20; r <= 20; r++) {
            if (Math.abs(q + r) <= 20 && Math.random() < density) {
                blocked.add(`${q},${r}`);
            }
        }
    }

    return blocked;
}

const blockedTerrain = generateBlockingTerrain(0.25);
const isBlocked = (pos: HexPosition) => blockedTerrain.has(`${pos.q},${pos.r}`);

// LOS test scenarios
const losScenarios = [
    {
        name: 'LOS ray 3 hex',
        start: { q: 0, r: 0 },
        end: { q: 3, r: 0 }
    },
    {
        name: 'LOS ray 6 hex',
        start: { q: 0, r: 0 },
        end: { q: 6, r: 0 }
    },
    {
        name: 'LOS ray 10 hex',
        start: { q: 0, r: 0 },
        end: { q: 10, r: 0 }
    },
    {
        name: 'LOS ray 15 hex',
        start: { q: 0, r: 0 },
        end: { q: 15, r: 0 }
    },
    {
        name: 'LOS diagonal 8 hex',
        start: { q: 0, r: 0 },
        end: { q: 4, r: -4 }
    },
    {
        name: 'LOS diagonal 12 hex',
        start: { q: 0, r: 0 },
        end: { q: 6, r: -6 }
    }
];

const losBench = new Bench({ time: 1000, iterations: 1000 });

// Add LOS benchmarks
for (const scenario of losScenarios) {
    losBench.add(scenario.name, () => {
        calculateLOS(scenario.start, scenario.end, isBlocked);
    });
}

export default losBench;