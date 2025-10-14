/**
 * River Generation System
 * 
 * Generates realistic rivers that:
 * - Start at mountain peaks (high elevation)
 * - Flow downhill following terrain gradient
 * - End at lakes or map edges
 * - Create connected paths, not random pixels
 */

export interface RiverSegment {
    x: number;
    y: number;
}

export interface River {
    segments: RiverSegment[];
    sourceElevation: number;
}

interface ElevationSampler {
    (_x: number, _y: number): number;
}

interface ElevationMap {
    get: (_x: number, _y: number) => number;
    set: (_x: number, _y: number, _elevation: number) => void;
}

/**
 * Generate rivers by tracing downhill from high-elevation sources
 */
export class RiverGenerator {
    private rivers: River[] = [];
    private riverMap: Set<string> = new Set();
    private elevationMap: Map<string, number> = new Map(); // Cache for eroded elevations

    /**
     * Generate rivers across the terrain
     * 
     * @param width - Map width in pixels
     * @param height - Map height in pixels
     * @param sampleElevation - Function to sample elevation at (x,y)
     * @param seed - Random seed for source point selection
     * @param numRivers - Number of river sources to generate
     */
    generateRivers(
        width: number,
        height: number,
        sampleElevation: ElevationSampler,
        seed: number,
        numRivers: number = 50
    ): void {
        console.log('🌊 Generating rivers with terrain erosion...');
        this.rivers = [];
        this.riverMap.clear();
        this.elevationMap.clear();

        // Create elevation map interface with erosion support
        const elevationMapInterface: ElevationMap = {
            get: (x: number, y: number) => {
                const key = `${x},${y}`;
                // Return eroded elevation if available, otherwise sample original
                return this.elevationMap.has(key) ? this.elevationMap.get(key)! : sampleElevation(x, y);
            },
            set: (x: number, y: number, elevation: number) => {
                this.elevationMap.set(`${x},${y}`, elevation);
            }
        };

        // Find high-elevation source points
        const sources = this.findRiverSources(width, height, sampleElevation, seed, numRivers);
        console.log(`   Found ${sources.length} river sources`);

        // Trace each river downhill with erosion
        let totalSegments = 0;
        let totalErosions = 0;
        for (const source of sources) {
            const result = this.traceRiverPath(source.x, source.y, width, height, elevationMapInterface);
            if (result.river.segments.length > 3) { // Keep even short rivers (was 5)
                this.rivers.push(result.river);
                totalSegments += result.river.segments.length;
                totalErosions += result.erosionCount;
                // Mark river cells AND neighbors (to make rivers wider/more visible)
                for (const seg of result.river.segments) {
                    // Mark the river pixel
                    this.riverMap.add(`${seg.x},${seg.y}`);
                    // Mark immediate neighbors to make river 3 pixels wide
                    for (let dx = -1; dx <= 1; dx++) {
                        for (let dy = -1; dy <= 1; dy++) {
                            this.riverMap.add(`${seg.x + dx},${seg.y + dy}`);
                        }
                    }
                }
            }
        }

        console.log(`   Generated ${this.rivers.length} rivers with ${totalSegments} total segments (${totalErosions} erosions)`);
        console.log(`   Average: ${(totalSegments / this.rivers.length).toFixed(1)} segments per river, ${(totalErosions / this.rivers.length).toFixed(1)} erosions per river`);
    }

    /**
     * Check if a pixel is part of a river
     */
    isRiver(x: number, y: number): boolean {
        return this.riverMap.has(`${x},${y}`);
    }

    /**
     * Get eroded elevation at a point (returns original if not eroded)
     */
    getElevation(x: number, y: number, originalSampler: ElevationSampler): number {
        const key = `${x},${y}`;
        return this.elevationMap.has(key) ? this.elevationMap.get(key)! : originalSampler(x, y);
    }

    /**
     * Get all rivers
     */
    getRivers(): River[] {
        return this.rivers;
    }

    /**
     * Find high-elevation points to use as river sources
     */
    private findRiverSources(
        width: number,
        height: number,
        sampleElevation: ElevationSampler,
        seed: number,
        numRivers: number
    ): RiverSegment[] {
        const sources: RiverSegment[] = [];
        const minElevation = 0.15; // Lower threshold - start at hills/low mountains
        const spacing = 40; // Closer spacing for more rivers

        // Use seed for deterministic random placement
        let rng = seed;
        const random = () => {
            rng = (rng * 1664525 + 1013904223) | 0;
            return Math.abs(rng) / 2147483648;
        };

        // Try to place river sources
        let attempts = 0;
        const maxAttempts = numRivers * 10;

        while (sources.length < numRivers && attempts < maxAttempts) {
            attempts++;

            const x = Math.floor(random() * width);
            const y = Math.floor(random() * height);
            const elev = sampleElevation(x, y);

            // Must be high elevation
            if (elev < minElevation) continue;

            // Check spacing from other sources
            let tooClose = false;
            for (const other of sources) {
                const dx = x - other.x;
                const dy = y - other.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < spacing) {
                    tooClose = true;
                    break;
                }
            }

            if (!tooClose) {
                sources.push({ x, y });
            }
        }

        return sources;
    }

    /**
     * Trace a river path downhill from a source point with terrain erosion
     */
    private traceRiverPath(
        startX: number,
        startY: number,
        width: number,
        height: number,
        elevationMap: ElevationMap
    ): { river: River; erosionCount: number } {
        const segments: RiverSegment[] = [];
        const visited = new Set<string>();
        const maxLength = 1200; // Much longer max length
        const minElevationDrop = -0.2; // Stop slightly above lake level
        const erosionAmount = 0.12; // More aggressive erosion
        let erosionCount = 0;

        let x = startX;
        let y = startY;
        let currentElev = elevationMap.get(x, y);
        const sourceElevation = currentElev;

        segments.push({ x, y });
        visited.add(`${x},${y}`);

        let consecutiveStuckCount = 0;
        const maxConsecutiveStuck = 50; // Allow many more erosions before giving up

        // Trace downhill until we reach a lake or map edge
        while (segments.length < maxLength) {
            // Check if we've reached very low elevation (lake/ocean)
            if (currentElev < minElevationDrop) {
                break; // Successfully reached water
            }

            // Find steepest downhill neighbor
            let bestX = x;
            let bestY = y;
            let bestElev = currentElev;
            let foundDownhill = false;

            // Check 8 neighbors
            for (let dx = -1; dx <= 1; dx++) {
                for (let dy = -1; dy <= 1; dy++) {
                    if (dx === 0 && dy === 0) continue;

                    const nx = x + dx;
                    const ny = y + dy;
                    const key = `${nx},${ny}`;

                    // Bounds check
                    if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;

                    // Don't revisit
                    if (visited.has(key)) continue;

                    const elev = elevationMap.get(nx, ny);

                    // Find lowest neighbor
                    if (elev < bestElev) {
                        bestX = nx;
                        bestY = ny;
                        bestElev = elev;
                        foundDownhill = true;
                    }
                }
            }

            // EROSION: If no downhill path found, carve through terrain!
            if (!foundDownhill) {
                consecutiveStuckCount++;

                if (consecutiveStuckCount > maxConsecutiveStuck) {
                    // Truly stuck after many erosion attempts - this is rare
                    break;
                }

                // Find the neighbor with lowest elevation (even if uphill)
                // Just pick the lowest neighbor - simple and effective
                let lowestX = x;
                let lowestY = y;
                let lowestElev = Infinity;

                for (let dx = -1; dx <= 1; dx++) {
                    for (let dy = -1; dy <= 1; dy++) {
                        if (dx === 0 && dy === 0) continue;
                        const nx = x + dx;
                        const ny = y + dy;
                        const key = `${nx},${ny}`;

                        if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
                        if (visited.has(key)) continue;

                        const elev = elevationMap.get(nx, ny);

                        // Find the absolute lowest neighbor
                        if (elev < lowestElev) {
                            lowestX = nx;
                            lowestY = ny;
                            lowestElev = elev;
                        }
                    }
                }

                // Erode that neighbor aggressively to create a clear downhill path
                if (lowestX !== x || lowestY !== y) {
                    // Very aggressive erosion - cut much deeper to ensure flow continues
                    const targetElev = currentElev - erosionAmount * 1.5; // 50% deeper cuts
                    elevationMap.set(lowestX, lowestY, targetElev);
                    erosionCount++;

                    bestX = lowestX;
                    bestY = lowestY;
                    bestElev = targetElev;
                } else {
                    break; // Truly stuck (no unvisited neighbors)
                }
            } else {
                consecutiveStuckCount = 0; // Reset stuck counter when moving naturally downhill
            }

            // Stop if we reached a lake
            if (bestElev < minElevationDrop) {
                segments.push({ x: bestX, y: bestY }); // Add final lake segment
                break;
            }

            // Move to the best neighbor
            x = bestX;
            y = bestY;
            currentElev = bestElev;
            segments.push({ x, y });
            visited.add(`${x},${y}`);
        }

        return {
            river: { segments, sourceElevation },
            erosionCount
        };
    }
}
