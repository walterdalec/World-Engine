/**
 * Battle Board Generator - Smooth → Hex Conversion
 * 
 * Samples smooth overworld terrain and discretizes it into a hex battle grid.
 * Determines spawn positions, blocked tiles, and features based on terrain.
 */

import type { WorldPos, OverworldSample, EngagementContext } from '../../../core/types';
import {
    Axial,
    HexTile,
    HEX_SIZE,
    axialToWorld,
    worldToAxial
} from './coordinates';

/**
 * Options for generating a battle board from overworld terrain
 */
export interface GenerateHexOpts {
    radiusWorld: number;   // Meters around center to include in battle
    hexSize?: number;      // Override default HEX_SIZE
    maxSlope?: number;     // Block tiles if local slope > threshold (default: 0.75)
}

/**
 * Function to sample terrain at any world position
 */
export type TerrainSampler = (_p: WorldPos) => OverworldSample;

/**
 * Generated battle board with tiles and spawn positions
 */
export interface BattleBoard {
    tiles: HexTile[];      // All hex tiles on the battlefield
    spawnA: Axial[];       // Spawn positions for attackers
    spawnB: Axial[];       // Spawn positions for defenders
    seed: string;          // RNG seed for deterministic generation
}

/**
 * Generate a hex battle board from smooth overworld terrain
 * 
 * @param ctx - Engagement context with position, approach vector, conditions
 * @param sample - Function to sample terrain at any world position
 * @param opts - Generation options (radius, hex size, slope threshold)
 * @returns Battle board with tiles and spawn positions
 */
export function generateBattleBoard(
    ctx: EngagementContext,
    sample: TerrainSampler,
    opts: GenerateHexOpts
): BattleBoard {
    const size = opts.hexSize ?? HEX_SIZE;
    const r = opts.radiusWorld;
    const tiles: HexTile[] = [];

    console.log('🎲 Generating battle board at', ctx.center, 'radius:', r);

    // Convert center position to hex coordinates
    const centerAx = worldToAxial(ctx.center, size);

    // Calculate hex ring radius to cover the world radius
    const hexRadius = Math.ceil(r / (size * 1.5));

    // Generate hex tiles by iterating over all hexes within radius
    for (let dq = -hexRadius; dq <= hexRadius; dq++) {
        for (let dr = Math.max(-hexRadius, -dq - hexRadius); dr <= Math.min(hexRadius, -dq + hexRadius); dr++) {
            const axial: Axial = { q: centerAx.q + dq, r: centerAx.r + dr };
            const worldPos = axialToWorld(axial, size);

            // Check if this hex is within the circular world radius
            if (distance(worldPos, ctx.center) <= r) {
                const terrainSample = sample(worldPos);
                const blocked = !!terrainSample.blocked ||
                    isLocalSlopeTooHigh(sample, worldPos, size, opts.maxSlope ?? 0.75);

                tiles.push({
                    axial,
                    height: terrainSample.height,
                    biome: terrainSample.biome,
                    blocked,
                    features: deriveFeatures(terrainSample)
                });
            }
        }
    }

    console.log('🎲 Generated', tiles.length, 'hex tiles');

    // Determine spawn positions based on approach vector
    const { spawnA, spawnB } = calculateSpawnPositions(
        tiles,
        ctx.center,
        size,
        ctx.approachVec
    );

    console.log('🎲 Spawn A:', spawnA.length, 'hexes | Spawn B:', spawnB.length, 'hexes');

    return {
        tiles,
        spawnA,
        spawnB,
        seed: ctx.seed
    };
}

/**
 * Check if local terrain slope is too steep for passable terrain
 */
function isLocalSlopeTooHigh(
    sample: TerrainSampler,
    p: WorldPos,
    step: number,
    maxSlope: number
): boolean {
    const centerHeight = sample(p).height;
    const eastHeight = sample({ x: p.x + step, y: p.y }).height;
    const southHeight = sample({ x: p.x, y: p.y + step }).height;

    const slopeX = Math.abs(centerHeight - eastHeight);
    const slopeY = Math.abs(centerHeight - southHeight);

    return Math.max(slopeX, slopeY) > maxSlope;
}

/**
 * Derive terrain features from overworld sample
 */
function deriveFeatures(s: OverworldSample): string[] {
    const features: string[] = [];

    // Add features based on biome and conditions
    if (s.biome === 'forest' && s.moisture > 0.5) {
        features.push('trees');
    }
    if (s.biome === 'hills' && s.height > 0.6) {
        features.push('rocks');
    }
    if (s.biome === 'swamp' && s.moisture > 0.7) {
        features.push('bog');
    }
    if (s.biome === 'mountains' && s.height > 0.8) {
        features.push('cliff');
    }
    if (s.biome === 'desert' && s.moisture < 0.2) {
        features.push('dunes');
    }
    if (s.height > 0.3 && s.height < 0.5) {
        features.push('cover'); // Moderate elevation provides cover
    }

    return features;
}

/**
 * Calculate spawn positions for both sides based on approach vector
 */
function calculateSpawnPositions(
    tiles: HexTile[],
    center: WorldPos,
    hexSize: number,
    approachVec: { x: number; y: number }
): { spawnA: Axial[]; spawnB: Axial[] } {
    // Normalize approach vector
    const dir = normalize(approachVec);

    // Find front and back edges relative to approach direction
    const edges = findFrontBackEdges(tiles, center, hexSize, dir);

    // Spread spawn positions along the edges
    const spawnA = spreadAlongEdge(edges.front, 8); // Up to 8 spawn positions
    const spawnB = spreadAlongEdge(edges.back, 8);

    return { spawnA, spawnB };
}

/**
 * Find front and back edges of battlefield relative to approach direction
 */
function findFrontBackEdges(
    tiles: HexTile[],
    center: WorldPos,
    hexSize: number,
    direction: { x: number; y: number }
): { front: Axial[]; back: Axial[] } {
    const front: { axial: Axial; projection: number }[] = [];
    const back: { axial: Axial; projection: number }[] = [];

    for (const tile of tiles) {
        if (tile.blocked) continue; // Skip impassable tiles

        const worldPos = axialToWorld(tile.axial, hexSize);
        const relative = { x: worldPos.x - center.x, y: worldPos.y - center.y };

        // Project onto approach vector
        const dot = relative.x * direction.x + relative.y * direction.y;

        if (dot >= 0) {
            front.push({ axial: tile.axial, projection: dot });
        } else {
            back.push({ axial: tile.axial, projection: dot });
        }
    }

    // Sort by projection distance
    front.sort((a, b) => b.projection - a.projection);
    back.sort((a, b) => a.projection - b.projection);

    // Take the edge hexes (furthest in each direction)
    return {
        front: front.slice(0, 12).map(e => e.axial),
        back: back.slice(0, 12).map(e => e.axial)
    };
}

/**
 * Spread spawn positions evenly along an edge
 */
function spreadAlongEdge(edge: Axial[], maxSpawns: number): Axial[] {
    if (edge.length <= maxSpawns) return edge;

    // Sample evenly across the edge
    const step = edge.length / maxSpawns;
    const spawns: Axial[] = [];

    for (let i = 0; i < maxSpawns; i++) {
        const index = Math.floor(i * step);
        spawns.push(edge[index]);
    }

    return spawns;
}

/**
 * Utility: Calculate distance between two world positions
 */
function distance(a: WorldPos, b: WorldPos): number {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.hypot(dx, dy);
}

/**
 * Utility: Normalize a vector
 */
function normalize(v: { x: number; y: number }): { x: number; y: number } {
    const len = Math.hypot(v.x, v.y) || 1;
    return { x: v.x / len, y: v.y / len };
}
