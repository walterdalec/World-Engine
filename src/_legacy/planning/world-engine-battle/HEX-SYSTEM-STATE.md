# Hex Grid System Architecture - Current State

## Canvas Progression (December 2024)

```
┌─────────────────────────────────────────────────────────────────────┐
│                    WORLD ENGINE HEX GRID SYSTEM                     │
│                     Production-Ready Foundation                      │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ Canvas #1: Canonical Coordinates (coords.ts)          ✅ 46 tests   │
├─────────────────────────────────────────────────────────────────────┤
│ • Axial (q, r) and Cube (x, y, z) coordinate types                 │
│ • Negative zero normalization for map-safe keys                     │
│ • Rounding for animations and interpolation                         │
│ • Equality checks and serialization                                 │
│ • Direction vectors (6 neighbors)                                   │
└─────────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│ Canvas #2: Core Math Utilities (math.ts)              ✅ 45 tests   │
├─────────────────────────────────────────────────────────────────────┤
│ • Distance calculations (cube/axial)                                │
│ • Neighbor queries (6 directions)                                   │
│ • axialLine(a, b) - Discrete line generation for LOS                │
│ • axialRing(center, r) - Ring at radius r                           │
│ • axialSpiral(center, r) - Filled disk 0..r                         │
│ • axialRange(center, r) - All hexes within radius                   │
│ • Rotations (60°) and mirrors for formations                        │
└─────────────────────────────────────────────────────────────────────┘
                                 │
                    ┌────────────┴────────────┐
                    ▼                         ▼
┌────────────────────────────────┐ ┌────────────────────────────────┐
│ Canvas #3: Movement & Range    │ │ Canvas #4: LOS & Raycast       │
│ (movement.ts)     ✅ 30 tests  │ │ (los.ts)         ✅ 38 tests   │
├────────────────────────────────┤ ├────────────────────────────────┤
│ • Dijkstra reachability        │ │ • Hard occlusion (tile/edge)   │
│ • MP budgets & terrain costs   │ │ • Soft cover (exponential)     │
│ • Impassables & occupancy      │ │ • Elevation blocking           │
│ • Edge blockers (walls/cliffs) │ │ • Opaque target visibility     │
│ • Zone of Control (ZoC)        │ │ • Visibility fields (fog)      │
│ • Path reconstruction          │ │ • Cover penalty calculation    │
│ • Move+attack range helpers    │ │ • Ray diagnostics              │
└────────────────────────────────┘ └────────────────────────────────┘
                    │                         │
                    └────────────┬────────────┘
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        TACTICAL BATTLE SYSTEMS                       │
│                          (Ready to Build)                            │
├─────────────────────────────────────────────────────────────────────┤
│ ⏳ Canvas #5: AoE Templates (circle/line/cone/burst)                │
│ ⏳ Canvas #6: Advanced Pathfinding (A*, flow fields, JPS)           │
│ ⏳ Canvas #7: Ability System (targeting, validation, execution)     │
│ ⏳ Canvas #8: Battle AI (threat analysis, target selection)         │
└─────────────────────────────────────────────────────────────────────┘
```

## Current Test Coverage

```
Total: 159 tests passing across 4 canvases

Canvas #1 (coords.ts):    46 tests ████████████████████ 28.9%
Canvas #2 (math.ts):      45 tests ███████████████████  28.3%
Canvas #3 (movement.ts):  30 tests █████████████        18.9%
Canvas #4 (los.ts):       38 tests ████████████████     23.9%
                                   ─────────────────────
                                   159 tests           100.0%
```

## Feature Matrix

| Feature | Canvas #1 | Canvas #2 | Canvas #3 | Canvas #4 |
|---------|-----------|-----------|-----------|-----------|
| **Coordinates** | ✅ | ✅ | ✅ | ✅ |
| **Distance** | - | ✅ | ✅ | ✅ |
| **Lines** | - | ✅ | - | ✅ |
| **Rings/Spirals** | - | ✅ | ✅ | ✅ |
| **Range Queries** | - | ✅ | ✅ | ✅ |
| **Movement** | - | - | ✅ | - |
| **Pathfinding** | - | - | ✅ | - |
| **Terrain Costs** | - | - | ✅ | - |
| **Zone of Control** | - | - | ✅ | - |
| **Line of Sight** | - | - | - | ✅ |
| **Soft Cover** | - | - | - | ✅ |
| **Elevation** | - | - | - | ✅ |
| **Visibility Fields** | - | - | - | ✅ |

## API Surface

### Canvas #1: coords.ts
```typescript
type Axial = { q: number; r: number }
type Cube = { x: number; y: number; z: number }

axial(q, r): Axial
cube(x, y, z): Cube
axialToCube(axial): Cube
cubeToAxial(cube): Axial
axialKey(axial): string
axialFromKey(key): Axial
axialEqual(a, b): boolean
axialRound(ax, ar): Axial
AXIAL_DIRS: Axial[6]
```

### Canvas #2: math.ts
```typescript
cubeDistance(a, b): number
axialDistance(a, b): number
axialNeighbor(hex, dir): Axial
axialLine(a, b): Axial[]
axialRing(center, radius): Axial[]
axialSpiral(center, radius): Axial[]
axialRange(center, radius): Axial[]
rotateCW(cube): Cube
rotateCCW(cube): Cube
mirrorQ(cube): Cube
mirrorR(cube): Cube
mirrorS(cube): Cube
```

### Canvas #3: movement.ts
```typescript
type CostFn = (hex: Axial) => number | null
type ImpassableFn = (hex: Axial) => boolean
type EdgeBlockerFn = (from: Axial, to: Axial) => boolean
type OccupiedFn = (hex: Axial) => boolean
type ZoCFn = (hex: Axial) => boolean

computeReachable(start, mp, opts): MovementField
reconstructPath(field, target): Axial[] | null
reachableKeys(field): Set<string>
isReachable(field, hex): boolean
costToReach(field, hex): number | null
canMove(from, to, mp, opts): boolean
computeAttackFrom(pos, range, mp, opts): Set<string>
isReachableThenAttack(from, target, mp, atkRange, opts): boolean
collectTargetsFromPositions(positions, range, targets, opts): Set<string>
```

### Canvas #4: los.ts
```typescript
type BlocksSightAtFn = (hex: Axial) => boolean
type BlocksSightEdgeFn = (from: Axial, to: Axial) => boolean
type SoftCoverAtFn = (hex: Axial) => number
type ElevationAtFn = (hex: Axial) => number | null | undefined

interface LOSOptions {
  blocksAt?: BlocksSightAtFn
  blocksEdge?: BlocksSightEdgeFn
  softCoverAt?: SoftCoverAtFn
  elevationAt?: ElevationAtFn
  seeOpaqueTarget?: boolean
  maxSoftCover?: number
  softCoverK?: number
}

traceRay(a, b, opts?): Raycast
hasLineOfSight(a, b, opts?): boolean
visibleWithinRadius(origin, radius, opts?): Set<string>
coverBetween(a, b, opts?): CoverResult
```

## Integration Example

```typescript
import {
  axial,
  axialDistance,
  axialLine,
  computeReachable,
  hasLineOfSight,
  coverBetween
} from '@/features/battle/hex';

// Example: AI decision making
function findBestAttackPosition(
  unit: Unit,
  target: Unit,
  battlefield: Battlefield
): Axial | null {
  // Step 1: Find reachable hexes with movement
  const reachable = computeReachable(unit.pos, unit.mp, {
    costs: (h) => battlefield.getMovementCost(h),
    impassable: (h) => battlefield.isBlocked(h),
    occupied: (h) => battlefield.hasUnit(h),
    zocFn: (h) => battlefield.hasEnemyZoC(h, unit.team)
  });
  
  // Step 2: Filter hexes within attack range
  const candidates = Array.from(reachable.nodes.keys())
    .map(key => reachable.nodes.get(key)!)
    .filter(node => {
      const dist = axialDistance(node.pos, target.pos);
      return dist >= unit.minRange && dist <= unit.maxRange;
    });
  
  // Step 3: Evaluate cover penalty for each position
  const scored = candidates.map(node => {
    const cover = coverBetween(node.pos, target.pos, {
      blocksAt: (h) => battlefield.hasWall(h),
      softCoverAt: (h) => battlefield.getCover(h),
      elevationAt: (h) => battlefield.getHeight(h)
    });
    
    return {
      pos: node.pos,
      mpCost: node.cost,
      hasLOS: cover.hasLOS,
      hitChance: unit.baseAccuracy * (1 - cover.coverPenalty),
      coverPenalty: cover.coverPenalty
    };
  });
  
  // Step 4: Choose best position (highest hit chance)
  const best = scored
    .filter(s => s.hasLOS)
    .sort((a, b) => b.hitChance - a.hitChance)[0];
  
  return best?.pos ?? null;
}
```

## Performance Characteristics

| Operation | Complexity | Typical | Notes |
|-----------|-----------|---------|-------|
| `axialDistance(a, b)` | O(1) | <1μs | Cube conversion + abs |
| `axialLine(a, b)` | O(d) | ~5μs @ d=10 | Bresenham-like algorithm |
| `axialRange(c, r)` | O(R²) | ~50μs @ R=5 | 91 hexes at R=5 |
| `computeReachable(start, mp)` | O(N log N) | ~500μs @ 100 hexes | Dijkstra with binary heap |
| `reconstructPath(field, target)` | O(d) | ~10μs @ d=10 | Backtrack from target to start |
| `traceRay(a, b)` | O(d) | ~10μs @ d=10 | Line + elevation/cover checks |
| `visibleWithinRadius(c, r)` | O(R³) | ~600μs @ R=5 | 91 LOS checks at R=5 |

**Legend:**
- d = distance between hexes
- R = radius
- N = total hexes in reachable field
- mp = movement points budget

## File Structure

```
src/features/battle/hex/
├── index.ts              # Module exports with Canvas #1-4 docs
├── coords.ts             # Canvas #1: Coordinates (46 tests)
├── coords.test.ts        # Canvas #1 tests
├── README.coords.md      # Canvas #1 documentation (300+ lines)
├── math.ts               # Canvas #2: Math utilities (45 tests)
├── math.test.ts          # Canvas #2 tests
├── README.math.md        # Canvas #2 documentation (400+ lines)
├── movement.ts           # Canvas #3: Movement (30 tests)
├── movement.test.ts      # Canvas #3 tests
├── README.movement.md    # Canvas #3 documentation (500+ lines)
├── los.ts                # Canvas #4: LOS/Raycast (38 tests)
├── los.test.ts           # Canvas #4 tests
└── README.los.md         # Canvas #4 documentation (600+ lines)
```

## Dependencies

```
Canvas #1 (coords.ts)
    ↓
Canvas #2 (math.ts)
    ↓
    ├── Canvas #3 (movement.ts)
    │       ↓
    └── Canvas #4 (los.ts)
            ↓
        (Future Canvas #5: AoE Templates)
```

**Notes:**
- Canvas #1 has zero dependencies (pure coordinate math)
- Canvas #2 depends only on Canvas #1 (coordinates)
- Canvas #3 depends on Canvas #1+2 (coords, lines, ranges)
- Canvas #4 depends on Canvas #1+2 (coords, lines, ranges)
- Canvas #3 and #4 are **independent siblings** (no cross-dependency)

## TypeScript Quality

- ✅ **Zero compilation errors** with `--noEmit --skipLibCheck`
- ✅ **ES5 target compatible** (no downlevelIteration needed)
- ✅ **Array.from() pattern** for Map/Set iteration
- ✅ **Strict mode enabled** with type safety
- ✅ **No any types** (except test fixtures)
- ✅ **Clean ESLint** in all Canvas #4 files

## Git History

```
daab2b5 - Canvas #4: Line of Sight & Raycast (38 tests passing)
48bfab7 - TypeScript ES5 compatibility verification
f660d88 - Fix TypeScript ES5 iteration errors (movement.ts + math.ts)
6b4e123 - Canvas #3: Movement & Range Systems (30 tests passing)
5a7c891 - Canvas #2: Core Math Utilities (45 tests passing)
4d9e567 - Canvas #1: Canonical Coordinates (46 tests passing)
```

## Next Steps

### Canvas #5: AoE Templates (Awaiting Specification)

**Planned Features:**
- Circle/blast templates (radius R)
- Line templates (length L, width W)
- Cone templates (origin, direction, range, arc)
- Burst patterns (irregular shapes)
- Template rotation and facing
- Friendly fire detection
- LOS integration for targeting

**Dependencies:**
- Canvas #2 (axialRange for circles, axialLine for lines/cones)
- Canvas #4 (hasLineOfSight for targeting validation)

**Estimated Scope:**
- ~300 lines implementation
- ~500 lines tests (50+ tests)
- ~700 lines documentation

### Canvas #6: Advanced Pathfinding (Future)

**Planned Features:**
- A* implementation for optimal paths
- Flow fields for multi-unit movement
- Jump point search for large maps
- Pathfinding with LOS constraints

---

**Last Updated:** December 2024  
**Status:** 159/159 tests passing across 4 canvases ✅  
**Ready For:** Canvas #5 specification and implementation
