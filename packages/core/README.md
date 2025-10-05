# Hex Grid Core Library

Engine-agnostic hexagonal grid mathematics and utilities for World Engine. This library provides comprehensive hex coordinate systems, pathfinding algorithms, and geometric operations optimized for game development.

## Features

### 🧮 **Complete Coordinate Systems**
- **Axial (q,r)**: Primary storage format, memory efficient
- **Cube (x,y,z)**: Mathematical operations, distance calculations  
- **Offset (col,row)**: Array storage, legacy system compatibility
- **Branded Types**: TypeScript compile-time safety with runtime validation

### 📐 **Mathematical Operations**
- Distance calculations (Chebyshev, Manhattan)
- Coordinate arithmetic (add, subtract, scale)
- Neighbor finding with stable direction ordering
- Line drawing with Bresenham-style algorithms
- Line-of-sight and visibility calculations

### 🌀 **Pattern Generation**
- Ring generation at specific radius
- Spiral patterns from center outward
- Flood-fill algorithms with custom predicates
- Range finding (all hexes within distance)
- Filtered pattern generation

### 🗺️ **Grid Management**
- Flexible boundary systems (rectangular, circular, custom)
- Grid bounds checking and validation
- Intersection and containment testing
- Common game grid presets (battle maps, world chunks)

### 💾 **Serialization Support**
- Compact string serialization for save files
- Binary packing for network transport
- Map/Set serialization for complex data structures
- JSON-compatible format conversion

## Quick Start

```typescript
import { axial, HexUtils } from '@world-engine/hex-core';

// Create hex coordinates
const origin = axial(0, 0);
const target = axial(3, -1);

// Calculate distance
const distance = HexUtils.distance(origin, target); // 3

// Get neighbors
const neighbors = HexUtils.neighbors(origin);

// Generate patterns
const ring = HexUtils.ring(origin, 2);     // Ring at radius 2
const area = HexUtils.range(origin, 3);    // All hexes within range 3

// Line operations
const line = HexUtils.line(origin, target);
const hasLOS = HexUtils.lineOfSight(origin, target, hex => isBlocked(hex));
```

## API Reference

### Core Types

```typescript
type Axial = { q: number; r: number };
type Cube = { x: number; y: number; z: number };  // x + y + z = 0
type Offset = { col: number; row: number };
```

### Coordinate Conversions

```typescript
// Convert between coordinate systems
axialToCube(axial) → cube
cubeToAxial(cube) → axial
axialToOffset(axial) → offset
offsetToAxial(offset) → axial

// Pixel coordinate conversion (for rendering)
axialToPixel(axial, size) → {x, y}
pixelToAxial(x, y, size) → {q, r}
```

### Distance & Neighbors

```typescript
// Distance calculations
axialDistance(a, b) → number
cubeDistance(a, b) → number

// Coordinate arithmetic
axialAdd(a, b) → axial
axialSubtract(a, b) → axial
axialScale(axial, factor) → axial

// Neighbor operations
neighbors(axial) → axial[]           // All 6 neighbors
neighbor(axial, direction) → axial   // Single neighbor (0-5)
```

### Pattern Generation

```typescript
// Ring and spiral patterns
hexRing(center, radius) → axial[]
hexSpiral(center, radius) → axial[]
hexRange(center, range) → axial[]

// Flood fill with custom logic
hexFloodFill(start, maxRange, canEnter) → axial[]

// Filtered generation
hexRingFiltered(center, radius, filter) → axial[]
hexSpiralFiltered(center, radius, filter) → axial[]
```

### Line Operations

```typescript
// Line drawing
axialLine(start, end) → axial[]

// Line-of-sight testing
hasLineOfSight(origin, target, isBlocked) → boolean
isLineBlocked(start, end, isBlocked) → boolean
axialLineToBlocked(start, end, isBlocked) → axial[]
```

### Grid Bounds

```typescript
// Boundary types
type HexRect = { minQ, maxQ, minR, maxR };
type HexCircle = { center: axial, radius: number };
type HexCustom = { contains: (hex) => boolean };

// Boundary operations
hexInBounds(hex, bounds) → boolean
createHexRect(minQ, maxQ, minR, maxR) → HexRect
createHexCircle(center, radius) → HexCircle

// Common presets
CommonBounds.BATTLE_SMALL    // 15x15 tactical grid
CommonBounds.BATTLE_LARGE    // 21x21 tactical grid
CommonBounds.REGION_CHUNK    // 32x32 region map
CommonBounds.WORLD_SECTOR    // 64x64 world map
```

### Serialization

```typescript
// String serialization
serializeAxial(hex) → "q,r"
deserializeAxial(str) → axial
serializeAxialArray(hexes) → "q1,r1;q2,r2"

// Map key utilities
axialToKey(hex) → string
keyToAxial(key) → axial
serializeAxialMap(map) → object
deserializeAxialMap(obj) → Map<axial, T>

// Binary packing (for large datasets)
serializeAxialBinary(hexes) → Uint8Array
deserializeAxialBinary(data) → axial[]
```

## Direction System

Directions use a consistent 0-5 numbering system:
- **0**: East (q+1, r+0)
- **1**: Northeast (q+1, r-1)  
- **2**: Northwest (q+0, r-1)
- **3**: West (q-1, r+0)
- **4**: Southwest (q-1, r+1)
- **5**: Southeast (q+0, r+1)

```typescript
import { AXIAL_DIRS, DIRECTION_NAMES } from '@world-engine/hex-core';

// Direction vectors
AXIAL_DIRS[0]  // { q: 1, r: 0 } - East
AXIAL_DIRS[3]  // { q: -1, r: 0 } - West

// Human-readable names
DIRECTION_NAMES[1]  // "Northeast"
```

## Integration Examples

### Pathfinding Integration

```typescript
function findPath(start: Axial, goal: Axial, isBlocked: (hex: Axial) => boolean): Axial[] {
  // Use A* with hex distance heuristic
  const heuristic = (hex: Axial) => axialDistance(hex, goal);
  
  // Get neighbors for pathfinding
  const getNeighbors = (hex: Axial) => 
    neighbors(hex).filter(n => !isBlocked(n));
    
  // Implementation details...
}
```

### Battle System Integration

```typescript
// Define deployment zones
const friendlyZone = createHexCircle(axial(-5, 0), 3);
const enemyZone = createHexCircle(axial(5, 0), 3);

// Check unit placement
function canDeployAt(hex: Axial, isPlayer: boolean): boolean {
  const zone = isPlayer ? friendlyZone : enemyZone;
  return hexInBounds(hex, zone) && !isOccupied(hex);
}

// Calculate spell area of effect
function getSpellTargets(caster: Axial, target: Axial, spellType: string): Axial[] {
  switch (spellType) {
    case 'fireball':
      return hexSpiral(target, 2);  // 2-hex radius blast
    case 'lightning':
      return axialLine(caster, target);  // Line effect
    case 'heal':
      return hexRing(caster, 1);  // Adjacent allies only
  }
}
```

### World Map Integration

```typescript
// Chunk-based world generation
const CHUNK_SIZE = 32;

function getChunkBounds(chunkX: number, chunkY: number): HexRect {
  const minQ = chunkX * CHUNK_SIZE;
  const maxQ = minQ + CHUNK_SIZE - 1;
  const minR = chunkY * CHUNK_SIZE;
  const maxR = minR + CHUNK_SIZE - 1;
  
  return createHexRect(minQ, maxQ, minR, maxR);
}

// Generate visible area around player
function getVisibleHexes(playerPos: Axial, viewDistance: number): Axial[] {
  return hexSpiral(playerPos, viewDistance)
    .filter(hex => hasLineOfSight(playerPos, hex, isOpaque));
}
```

## Performance Notes

- **Memory**: Axial coordinates use ~60% less memory than cube coordinates
- **CPU**: Cube coordinates are fastest for distance/math operations  
- **Serialization**: Binary format is ~8x more compact than JSON for large datasets
- **Pathfinding**: Use cube distance for A* heuristic (no conversion overhead)

## Testing

The library includes comprehensive test coverage:

```bash
npm test              # Run all tests
npm run test:watch    # Watch mode for development
npm run test:coverage # Generate coverage report
```

## License

MIT License - see LICENSE file for details.

## Contributing

This library follows the World Engine development guidelines:
- Branded types for compile-time safety
- Comprehensive test coverage
- Performance-optimized algorithms
- Engine-agnostic design

See the main project repository for contribution guidelines.