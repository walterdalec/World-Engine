/**
 * Crossings — Detect river/obstacle intersections and place bridges/fords/tunnels
 * 
 * Scans refined road paths for water crossings and steep terrain, inserting
 * appropriate crossing nodes based on river width and slope.
 */

import type { Vec2, TileData } from './types';

export interface CrossingResult {
    position: Vec2;
    type: 'bridge' | 'ford' | 'tunnel';
    width?: number;  // For rivers
    depth?: number;  // For tunnels
}

interface DetectCrossingsInput {
    path: Vec2[];
    getTile: (_x: number, _y: number) => TileData | undefined;
    riverWidthThreshold?: number;  // Default: 3 tiles = ford, >3 = bridge
    slopeThreshold?: number;       // Default: 0.4 elevation change for tunnel consideration
}

/**
 * Scan a path for crossings and return appropriate crossing types.
 * 
 * Rules:
 * - River width ≤3: ford (can wade through)
 * - River width >3: bridge (need structure)
 * - Steep slope >0.4: tunnel (cut through mountain) if elevation is high
 * 
 * @param input Path and tile access functions
 * @returns Array of crossings to place
 */
export function detectCrossings(input: DetectCrossingsInput): CrossingResult[] {
    const { path, getTile, riverWidthThreshold = 3, slopeThreshold = 0.4 } = input;
    const crossings: CrossingResult[] = [];
    
    if (path.length < 2) return crossings;
    
    // Track water segments
    let inWater = false;
    let waterStart: Vec2 | null = null;
    let waterEnd: Vec2 | null = null;
    let maxWaterWidth = 0;
    
    for (let i = 0; i < path.length; i++) {
        const p = path[i];
        const tile = getTile(p.x, p.y);
        if (!tile) continue;
        
        const isWater = tile.biomeId === 'ocean' || tile.biomeId === 'swamp';
        const waterWidth = isWater ? (tile.moisture || 0) * 10 : 0; // Estimate width from moisture
        
        if (isWater && !inWater) {
            // Entering water
            inWater = true;
            waterStart = p;
            waterEnd = p;
            maxWaterWidth = waterWidth;
        } else if (isWater && inWater) {
            // Still in water
            waterEnd = p;
            maxWaterWidth = Math.max(maxWaterWidth, waterWidth);
        } else if (!isWater && inWater) {
            // Exiting water - place crossing at midpoint
            inWater = false;
            if (waterStart && waterEnd) {
                const midX = Math.floor((waterStart.x + waterEnd.x) / 2);
                const midY = Math.floor((waterStart.y + waterEnd.y) / 2);
                
                const crossingType = maxWaterWidth <= riverWidthThreshold ? 'ford' : 'bridge';
                crossings.push({
                    position: { x: midX, y: midY },
                    type: crossingType,
                    width: maxWaterWidth
                });
            }
            waterStart = null;
            waterEnd = null;
            maxWaterWidth = 0;
        }
        
        // Check for tunnel opportunities (steep mountains)
        if (i > 0 && i < path.length - 1) {
            const prev = path[i - 1];
            const next = path[i + 1];
            const prevTile = getTile(prev.x, prev.y);
            const nextTile = getTile(next.x, next.y);
            
            if (tile && prevTile && nextTile) {
                const elevPrev = prevTile.elevation || 0;
                const elevCurr = tile.elevation || 0;
                const elevNext = nextTile.elevation || 0;
                
                // Check if we're climbing/descending steeply through high elevation
                const slopeBefore = Math.abs(elevCurr - elevPrev);
                const slopeAfter = Math.abs(elevNext - elevCurr);
                
                const avgSlope = (slopeBefore + slopeAfter) / 2;
                const isMountain = tile.biomeId === 'mountain' || elevCurr > 0.7;
                
                if (avgSlope > slopeThreshold && isMountain) {
                    // Tunnel opportunity - cut through mountain instead of going over
                    crossings.push({
                        position: { x: p.x, y: p.y },
                        type: 'tunnel',
                        depth: avgSlope
                    });
                }
            }
        }
    }
    
    // Handle case where path ends in water
    if (inWater && waterStart && waterEnd) {
        const midX = Math.floor((waterStart.x + waterEnd.x) / 2);
        const midY = Math.floor((waterStart.y + waterEnd.y) / 2);
        
        const crossingType = maxWaterWidth <= riverWidthThreshold ? 'ford' : 'bridge';
        crossings.push({
            position: { x: midX, y: midY },
            type: crossingType,
            width: maxWaterWidth
        });
    }
    
    return crossings;
}

/**
 * Apply crossings to a road path, inserting special crossing nodes.
 * 
 * @param path Original path points
 * @param crossings Detected crossings
 * @returns Path with crossing markers inserted
 */
export function applyCrossings(path: Vec2[], crossings: CrossingResult[]): Vec2[] {
    if (crossings.length === 0) return path;
    
    // For now, just return the original path
    // In a full implementation, you would insert crossing metadata
    // or modify the path to route through crossing points
    
    // Simple approach: ensure crossing positions are in the path
    const result = [...path];
    
    for (const crossing of crossings) {
        const existsInPath = result.some(p => p.x === crossing.position.x && p.y === crossing.position.y);
        if (!existsInPath) {
            // Find closest point in path and insert crossing nearby
            let closestIdx = 0;
            let closestDist = Infinity;
            
            for (let i = 0; i < result.length; i++) {
                const dx = result[i].x - crossing.position.x;
                const dy = result[i].y - crossing.position.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist < closestDist) {
                    closestDist = dist;
                    closestIdx = i;
                }
            }
            
            // Insert crossing after closest point
            result.splice(closestIdx + 1, 0, crossing.position);
        }
    }
    
    return result;
}

/**
 * Get crossing cost modifier for pathfinding.
 * Crossings add extra cost to discourage unnecessary bridges/tunnels.
 * 
 * @param type Crossing type
 * @returns Cost multiplier
 */
export function getCrossingCost(type: 'bridge' | 'ford' | 'tunnel'): number {
    switch (type) {
        case 'ford': return 1.2;      // Slight detour acceptable
        case 'bridge': return 2.0;    // Expensive, avoid if possible
        case 'tunnel': return 3.0;    // Very expensive, only for major routes
        default: return 1.0;
    }
}
