/**
 * Canvas 14 - Hex Math & Utilities
 * 
 * Cube/axial coordinate system with LoS, range, and pathfinding
 */

// ============================================================================
// COORDINATE TYPES
// ============================================================================

/**
 * Cube coordinates (x+y+z=0 constraint)
 * Primary system for distance and LoS calculations
 */
export interface CubeCoord {
  x: number;
  y: number;
  z: number;
}

/**
 * Axial coordinates (storage format)
 * q = x, r = z
 */
export interface AxialCoord {
  q: number;
  r: number;
}

/**
 * Hex direction (0-5, clockwise from east)
 */
export type HexDirection = 0 | 1 | 2 | 3 | 4 | 5;

// ============================================================================
// COORDINATE CONVERSION
// ============================================================================

/**
 * Convert axial to cube coordinates
 */
export function axialToCube(axial: AxialCoord): CubeCoord {
  const x = axial.q;
  const z = axial.r;
  const y = -x - z;
  return { x, y, z };
}

/**
 * Convert cube to axial coordinates
 */
export function cubeToAxial(cube: CubeCoord): AxialCoord {
  return { q: cube.x, r: cube.z };
}

/**
 * Round fractional cube coordinates to nearest valid hex
 */
export function cubeRound(cube: CubeCoord): CubeCoord {
  let rx = Math.round(cube.x);
  let ry = Math.round(cube.y);
  let rz = Math.round(cube.z);
  
  const xDiff = Math.abs(rx - cube.x);
  const yDiff = Math.abs(ry - cube.y);
  const zDiff = Math.abs(rz - cube.z);
  
  // Restore constraint by adjusting largest diff
  if (xDiff > yDiff && xDiff > zDiff) {
    rx = -ry - rz;
  } else if (yDiff > zDiff) {
    ry = -rx - rz;
  } else {
    rz = -rx - ry;
  }
  
  return { x: rx, y: ry, z: rz };
}

// ============================================================================
// DISTANCE & RANGE
// ============================================================================

/**
 * Manhattan distance between two cube coordinates
 */
export function cubeDistance(a: CubeCoord, b: CubeCoord): number {
  return Math.max(
    Math.abs(a.x - b.x),
    Math.abs(a.y - b.y),
    Math.abs(a.z - b.z)
  );
}

/**
 * Distance between two axial coordinates
 */
export function axialDistance(a: AxialCoord, b: AxialCoord): number {
  return cubeDistance(axialToCube(a), axialToCube(b));
}

/**
 * Check if coordinate is within range
 */
export function inRange(from: AxialCoord, to: AxialCoord, range: number): boolean {
  return axialDistance(from, to) <= range;
}

// ============================================================================
// NEIGHBORS & DIRECTIONS
// ============================================================================

/**
 * Cube direction vectors (6 directions)
 */
const CUBE_DIRECTIONS: CubeCoord[] = [
  { x: 1, y: -1, z: 0 },  // E
  { x: 1, y: 0, z: -1 },  // SE
  { x: 0, y: 1, z: -1 },  // SW
  { x: -1, y: 1, z: 0 },  // W
  { x: -1, y: 0, z: 1 },  // NW
  { x: 0, y: -1, z: 1 }   // NE
];

/**
 * Get cube neighbor in direction
 */
export function cubeNeighbor(cube: CubeCoord, direction: HexDirection): CubeCoord {
  const dir = CUBE_DIRECTIONS[direction];
  return {
    x: cube.x + dir.x,
    y: cube.y + dir.y,
    z: cube.z + dir.z
  };
}

/**
 * Get axial neighbor in direction
 */
export function axialNeighbor(axial: AxialCoord, direction: HexDirection): AxialCoord {
  const cube = axialToCube(axial);
  const neighbor = cubeNeighbor(cube, direction);
  return cubeToAxial(neighbor);
}

/**
 * Get all 6 neighbors
 */
export function getNeighbors(axial: AxialCoord): AxialCoord[] {
  const neighbors: AxialCoord[] = [];
  for (let dir = 0; dir < 6; dir++) {
    neighbors.push(axialNeighbor(axial, dir as HexDirection));
  }
  return neighbors;
}

/**
 * Get direction from one hex to another (approximate)
 */
export function getDirection(from: AxialCoord, to: AxialCoord): HexDirection {
  const fromCube = axialToCube(from);
  const toCube = axialToCube(to);
  
  const dx = toCube.x - fromCube.x;
  const dy = toCube.y - fromCube.y;
  const dz = toCube.z - fromCube.z;
  
  // Find dominant direction
  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);
  const absDz = Math.abs(dz);
  
  if (absDx >= absDy && absDx >= absDz) {
    return dx > 0 ? 0 : 3; // E or W
  } else if (absDy >= absDz) {
    return dy > 0 ? 2 : 5; // SW or NE
  } else {
    return dz > 0 ? 4 : 1; // NW or SE
  }
}

/**
 * Calculate angle difference between two directions (0-3)
 * 0 = same, 1 = adjacent, 2 = opposite sides, 3 = rear
 */
export function directionDifference(facing: HexDirection, attack: HexDirection): number {
  const diff = Math.abs(facing - attack);
  return Math.min(diff, 6 - diff);
}

// ============================================================================
// LINE OF SIGHT (LoS)
// ============================================================================

/**
 * Get all hexes along line from start to end (Bresenham)
 */
export function hexLine(start: AxialCoord, end: AxialCoord): AxialCoord[] {
  const startCube = axialToCube(start);
  const endCube = axialToCube(end);
  
  const distance = cubeDistance(startCube, endCube);
  if (distance === 0) return [start];
  
  const line: AxialCoord[] = [];
  
  for (let i = 0; i <= distance; i++) {
    const t = i / distance;
    const cube: CubeCoord = {
      x: startCube.x + (endCube.x - startCube.x) * t,
      y: startCube.y + (endCube.y - startCube.y) * t,
      z: startCube.z + (endCube.z - startCube.z) * t
    };
    
    const rounded = cubeRound(cube);
    line.push(cubeToAxial(rounded));
  }
  
  return line;
}

/**
 * Check if there's line of sight between two hexes
 * 
 * @param blockerCheck Function to check if hex blocks LoS
 */
export function hasLineOfSight(
  start: AxialCoord,
  end: AxialCoord,
  blockerCheck: (_hex: AxialCoord) => boolean
): boolean {
  const line = hexLine(start, end);
  
  // Check all hexes except start and end
  for (let i = 1; i < line.length - 1; i++) {
    if (blockerCheck(line[i])) {
      return false;
    }
  }
  
  return true;
}

// ============================================================================
// AREA OF EFFECT (AoE) SHAPES
// ============================================================================

/**
 * Get all hexes within radius (blast)
 */
export function getBlastArea(center: AxialCoord, radius: number): AxialCoord[] {
  const hexes: AxialCoord[] = [];
  const centerCube = axialToCube(center);
  
  for (let x = -radius; x <= radius; x++) {
    for (let y = Math.max(-radius, -x - radius); y <= Math.min(radius, -x + radius); y++) {
      const z = -x - y;
      const cube: CubeCoord = {
        x: centerCube.x + x,
        y: centerCube.y + y,
        z: centerCube.z + z
      };
      
      if (cubeDistance(centerCube, cube) <= radius) {
        hexes.push(cubeToAxial(cube));
      }
    }
  }
  
  return hexes;
}

/**
 * Get hexes in a cone
 * 
 * @param origin Starting hex
 * @param direction Cone direction
 * @param range Maximum range
 * @param width Cone width in hexes at max range
 */
export function getConeArea(
  origin: AxialCoord,
  direction: HexDirection,
  range: number,
  width: number = 3
): AxialCoord[] {
  const hexes: AxialCoord[] = [];
  const originCube = axialToCube(origin);
  const dirVector = CUBE_DIRECTIONS[direction];
  
  // Check all hexes in blast radius
  const candidates = getBlastArea(origin, range);
  
  for (const hex of candidates) {
    const hexCube = axialToCube(hex);
    const dx = hexCube.x - originCube.x;
    const dy = hexCube.y - originCube.y;
    const dz = hexCube.z - originCube.z;
    
    // Dot product to check if in cone direction
    const dot = dx * dirVector.x + dy * dirVector.y + dz * dirVector.z;
    const dist = cubeDistance(originCube, hexCube);
    
    if (dot > 0 && dist <= range) {
      // Check if within cone width
      const perpDist = Math.sqrt(
        Math.pow(dx - dirVector.x * dot, 2) +
        Math.pow(dy - dirVector.y * dot, 2) +
        Math.pow(dz - dirVector.z * dot, 2)
      );
      
      const maxWidth = width * (dist / range);
      if (perpDist <= maxWidth) {
        hexes.push(hex);
      }
    }
  }
  
  return hexes;
}

/**
 * Get hexes in a ring (donut shape)
 */
export function getRingArea(center: AxialCoord, radius: number): AxialCoord[] {
  const hexes: AxialCoord[] = [];
  const centerCube = axialToCube(center);
  
  for (let x = -radius; x <= radius; x++) {
    for (let y = Math.max(-radius, -x - radius); y <= Math.min(radius, -x + radius); y++) {
      const z = -x - y;
      const cube: CubeCoord = {
        x: centerCube.x + x,
        y: centerCube.y + y,
        z: centerCube.z + z
      };
      
      const dist = cubeDistance(centerCube, cube);
      if (dist === radius) {
        hexes.push(cubeToAxial(cube));
      }
    }
  }
  
  return hexes;
}

/**
 * Get hexes in a line (wall/beam)
 */
export function getLineArea(
  start: AxialCoord,
  direction: HexDirection,
  length: number
): AxialCoord[] {
  const hexes: AxialCoord[] = [];
  let current = start;
  
  for (let i = 0; i < length; i++) {
    hexes.push(current);
    current = axialNeighbor(current, direction);
  }
  
  return hexes;
}

// ============================================================================
// PATHFINDING (A*)
// ============================================================================

/**
 * Find shortest path between two hexes
 * 
 * @param costFunc Function to get movement cost for hex
 * @returns Array of hexes from start to goal (inclusive)
 */
export function findPath(
  start: AxialCoord,
  goal: AxialCoord,
  costFunc: (_hex: AxialCoord) => number | null,
  maxCost: number = 999
): AxialCoord[] | null {
  const openSet = new Set<string>([coordKey(start)]);
  const cameFrom = new Map<string, AxialCoord>();
  const gScore = new Map<string, number>();
  const fScore = new Map<string, number>();
  
  gScore.set(coordKey(start), 0);
  fScore.set(coordKey(start), axialDistance(start, goal));
  
  while (openSet.size > 0) {
    // Find node with lowest fScore
    let current: AxialCoord | null = null;
    let lowestF = Infinity;
    
    const openArray = Array.from(openSet);
    for (const key of openArray) {
      const f = fScore.get(key) ?? Infinity;
      if (f < lowestF) {
        lowestF = f;
        current = keyToCoord(key);
      }
    }
    
    if (!current) break;
    
    const currentKey = coordKey(current);
    
    // Goal reached
    if (current.q === goal.q && current.r === goal.r) {
      return reconstructPath(cameFrom, current);
    }
    
    openSet.delete(currentKey);
    
    const currentG = gScore.get(currentKey) ?? Infinity;
    
    // Check neighbors
    for (const neighbor of getNeighbors(current)) {
      const cost = costFunc(neighbor);
      if (cost === null) continue; // Impassable
      
      const tentativeG = currentG + cost;
      
      if (tentativeG > maxCost) continue; // Too expensive
      
      const neighborKey = coordKey(neighbor);
      const neighborG = gScore.get(neighborKey) ?? Infinity;
      
      if (tentativeG < neighborG) {
        cameFrom.set(neighborKey, current);
        gScore.set(neighborKey, tentativeG);
        fScore.set(neighborKey, tentativeG + axialDistance(neighbor, goal));
        openSet.add(neighborKey);
      }
    }
  }
  
  return null; // No path found
}

/**
 * Reconstruct path from cameFrom map
 */
function reconstructPath(
  cameFrom: Map<string, AxialCoord>,
  current: AxialCoord
): AxialCoord[] {
  const path: AxialCoord[] = [current];
  let key = coordKey(current);
  
  while (cameFrom.has(key)) {
    current = cameFrom.get(key)!;
    path.unshift(current);
    key = coordKey(current);
  }
  
  return path;
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Convert coordinate to string key for maps/sets
 */
export function coordKey(coord: AxialCoord): string {
  return `${coord.q},${coord.r}`;
}

/**
 * Convert string key back to coordinate
 */
export function keyToCoord(key: string): AxialCoord {
  const [q, r] = key.split(',').map(Number);
  return { q, r };
}

/**
 * Check if two coordinates are equal
 */
export function coordEquals(a: AxialCoord, b: AxialCoord): boolean {
  return a.q === b.q && a.r === b.r;
}

/**
 * Get all hexes within movement range (flood fill)
 */
export function getReachableHexes(
  start: AxialCoord,
  maxCost: number,
  costFunc: (_hex: AxialCoord) => number | null
): Map<string, number> {
  const reachable = new Map<string, number>();
  const frontier: Array<{ hex: AxialCoord; cost: number }> = [{ hex: start, cost: 0 }];
  
  reachable.set(coordKey(start), 0);
  
  while (frontier.length > 0) {
    const { hex, cost } = frontier.shift()!;
    
    for (const neighbor of getNeighbors(hex)) {
      const moveCost = costFunc(neighbor);
      if (moveCost === null) continue;
      
      const newCost = cost + moveCost;
      if (newCost > maxCost) continue;
      
      const neighborKey = coordKey(neighbor);
      const existingCost = reachable.get(neighborKey);
      
      if (existingCost === undefined || newCost < existingCost) {
        reachable.set(neighborKey, newCost);
        frontier.push({ hex: neighbor, cost: newCost });
      }
    }
  }
  
  return reachable;
}
