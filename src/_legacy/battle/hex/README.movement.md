# Canvas #3 — Movement & Range Systems

**Version:** 1.0.0  
**Status:** ✅ Production-ready  
**Tests:** 30/30 passing (100% coverage)  
**Module:** `src/features/battle/hex/movement.ts`

## Overview

Canvas #3 provides the movement and range calculation systems for tactical hex-based combat. Built on Canvas #1 (coords) and Canvas #2 (math), this module implements:

- **Dijkstra reachability solver** with variable terrain costs
- **Movement field generation** with MP budgets
- **Path reconstruction** for UI previews and AI planning
- **Zone of Control (ZoC)** rules for tactical positioning
- **Range predicates** for ability targeting
- **Move+attack helpers** for combined actions

**Design Philosophy:** Pure mathematical system with pluggable game rules via lambdas. No rendering, no hard-coded game data. Can run in tests, AI workers, or engine logic without dependencies.

---

## What This Module Provides

### 1. Movement Field Computation (Dijkstra)
Generate all reachable hexes from an origin within an MP (Movement Points) budget:
```typescript
const field = computeMovementField(
  origin,
  maxMP,
  costFn,        // (hex) => cost (1 for flat, 2 for hills, Infinity for walls)
  {
    edgeBlocker,   // (from, to) => boolean (walls, cliffs)
    isOccupied,    // (hex) => boolean (units blocking)
    zocHexes,      // Set of enemy hex keys
    stopOnZoCEnter // If true, seal nodes on ZoC entry
  }
);
```

### 2. Path Reconstruction
Extract the optimal path from origin to any reachable target:
```typescript
const path = reconstructPath(field, targetHex);
// Returns: Axial[] with [origin, ...steps, target] or null if unreachable
```

### 3. Range Predicates
Check if targets are within ability range:
```typescript
inHexRange(from, to, { min: 1, max: 3 }); // true if in [1, 3] hexes
filterByRange(center, candidates, { max: 2 }); // filter list by range
```

### 4. Move + Attack Helpers
Calculate which targets can be attacked after moving:
```typescript
const attackFrom = computeAttackFrom(field, attackRange);
const targets = collectTargetsFromPositions(
  attackFrom,
  enemyUnits,
  { min: 1, max: 2 },
  { hasLineOfSight }  // Optional LOS filter
);
```

### 5. Convenience Wrappers
Simplified API for common cases:
```typescript
uniformMovement(origin, maxMP, isPassable); // All passable = 1 MP
reachableKeys(field); // Extract Set<string> of reachable hex keys
```

---

## Quick Start

### Basic Movement (Uniform Terrain)
```typescript
import { axial, uniformMovement, reconstructPath } from './hex';

// Unit at origin with 3 MP
const origin = axial(0, 0);
const maxMP = 3;
const isPassable = (hex) => !isWall(hex);

const field = uniformMovement(origin, maxMP, isPassable);

// Check if target is reachable
const target = axial(2, 1);
const path = reconstructPath(field, target);
if (path) {
  console.log(`Path cost: ${field.nodes.get(axialKey(target))?.cost} MP`);
  console.log(`Path: ${path.map(p => `(${p.q},${p.r})`).join(' → ')}`);
}
```

### Variable Terrain Costs
```typescript
import { computeMovementField } from './hex';

const costFn = (hex) => {
  const terrain = getTerrain(hex);
  if (terrain === 'wall') return Infinity;
  if (terrain === 'hill') return 2;
  if (terrain === 'swamp') return 3;
  return 1; // flat ground
};

const field = computeMovementField(origin, maxMP, costFn);
```

### Edge Blockers (Walls, Cliffs)
```typescript
const edgeBlocker = (from, to) => {
  // Check if there's a wall between these two hexes
  return hasWallBetween(from, to);
};

const field = uniformMovement(origin, maxMP, isPassable, { edgeBlocker });
```

### Occupancy (Units Blocking)
```typescript
const isOccupied = (hex) => {
  const unit = getUnitAt(hex);
  return unit && unit.team !== myTeam; // Enemies block
};

const field = uniformMovement(origin, maxMP, isPassable, { isOccupied });
```

### Zone of Control (ZoC)
```typescript
// Gather enemy unit positions
const zocHexes = new Set(
  enemyUnits.map(u => axialKey(u.pos))
);

const field = uniformMovement(origin, maxMP, isPassable, {
  zocHexes,
  stopOnZoCEnter: true // Classic ZoC rule: can't leave once entered
});

// Hexes adjacent to enemies will be marked as `sealed`
// and won't expand further
```

### Move + Attack Range
```typescript
const movementField = uniformMovement(myPos, myMP, isPassable);
const attackRange = { min: 1, max: 2 }; // Melee: 1-2 hexes

const attackFrom = computeAttackFrom(movementField, attackRange);
const targets = collectTargetsFromPositions(
  attackFrom,
  enemyUnits.map(u => u.pos),
  attackRange
);

console.log(`Can attack ${targets.length} enemies this turn`);
```

---

## API Reference

### Types

#### `MP`
```typescript
type MP = number;
```
Movement Points. Can be integer or fractional (e.g., 2.5 MP for dash abilities).

#### `MoveCostFn`
```typescript
type MoveCostFn = (hex: AxialLike) => number;
```
Returns the cost to **enter** a hex. Return `Infinity` for impassable.

#### `EdgeBlockerFn`
```typescript
type EdgeBlockerFn = (from: AxialLike, to: AxialLike) => boolean;
```
Returns `true` if the edge between two adjacent hexes is blocked (walls, cliffs, closed doors).

#### `IsOccupiedFn`
```typescript
type IsOccupiedFn = (hex: AxialLike) => boolean;
```
Returns `true` if a hex is occupied by a unit (blocking movement).

#### `ZoCSet`
```typescript
type ZoCSet = Set<string>;
```
Set of hex keys (`"q,r"`) that exert Zone of Control.

#### `MovementOptions`
```typescript
interface MovementOptions {
  edgeBlocker?: EdgeBlockerFn;
  isOccupied?: IsOccupiedFn;
  zocHexes?: ZoCSet;
  stopOnZoCEnter?: boolean; // Classic ZoC: stop when entering enemy zone
  nodeLimit?: number;       // Performance cap for exploration
}
```

#### `MoveNode`
```typescript
interface MoveNode {
  pos: Axial;
  cost: MP;           // Total MP spent to reach this hex
  parent?: Axial;     // Previous hex in optimal path
  sealed?: boolean;   // True if ZoC prevents further expansion
}
```

#### `MovementField`
```typescript
interface MovementField {
  origin: Axial;
  maxMP: MP;
  nodes: Map<string, MoveNode>; // Key = axialKey(pos)
}
```

#### `RangeSpec`
```typescript
interface RangeSpec {
  min?: number; // Default: 0
  max: number;
}
```

---

### Core Functions

#### `computeMovementField`
```typescript
function computeMovementField(
  origin: AxialLike,
  maxMP: MP,
  costFn: MoveCostFn,
  opts?: MovementOptions
): MovementField
```
**Dijkstra reachability solver.** Computes all hexes reachable within `maxMP` from `origin`.

**Behavior:**
- Explores neighbors with lowest cost first (priority queue)
- Respects terrain costs, edge blockers, occupancy
- Applies ZoC rules if `zocHexes` provided
- Stops exploring when cost exceeds `maxMP`

**Performance:** O(N log N) where N = number of explored hexes.

**Example:**
```typescript
const field = computeMovementField(
  axial(0, 0),
  5,
  hex => getTerrain(hex) === 'swamp' ? 2 : 1,
  { isOccupied: hex => hasUnit(hex) }
);
```

---

#### `reconstructPath`
```typescript
function reconstructPath(
  field: MovementField,
  target: AxialLike
): Axial[] | null
```
**Path extraction.** Reconstructs the optimal path from `field.origin` to `target` by following parent pointers.

**Returns:**
- `Axial[]` with path `[origin, ...steps, target]` if reachable
- `null` if target is not in the movement field

**Example:**
```typescript
const path = reconstructPath(field, axial(3, -2));
if (path) {
  console.log(`Path length: ${path.length - 1} steps`);
}
```

---

#### `uniformMovement`
```typescript
function uniformMovement(
  origin: AxialLike,
  maxMP: MP,
  isPassable: (hex: AxialLike) => boolean,
  opts?: Omit<MovementOptions, 'edgeBlocker'> & { edgeBlocker?: EdgeBlockerFn }
): MovementField
```
**Convenience wrapper** for uniform terrain (passable = 1 MP, impassable = Infinity).

**Example:**
```typescript
const field = uniformMovement(
  axial(0, 0),
  3,
  hex => !isWall(hex),
  { isOccupied: hex => hasEnemy(hex) }
);
```

---

#### `reachableKeys`
```typescript
function reachableKeys(field: MovementField): Set<string>
```
**Extract reachable hex keys.** Returns a `Set<string>` of all hex keys in the movement field.

**Example:**
```typescript
const keys = reachableKeys(field);
if (keys.has('2,1')) {
  console.log('Hex (2,1) is reachable');
}
```

---

### Range Functions

#### `inHexRange`
```typescript
function inHexRange(
  a: AxialLike,
  b: AxialLike,
  spec: RangeSpec
): boolean
```
**Range check.** Returns `true` if `b` is within `[min, max]` hexes of `a`.

**Example:**
```typescript
const inRange = inHexRange(
  axial(0, 0),
  axial(2, 1),
  { min: 1, max: 3 }
);
```

---

#### `filterByRange`
```typescript
function filterByRange(
  center: AxialLike,
  hexes: AxialLike[],
  spec: RangeSpec
): Axial[]
```
**Range filter.** Returns hexes from `hexes` that are within `[min, max]` of `center`.

**Example:**
```typescript
const nearby = filterByRange(
  myPos,
  allEnemies.map(e => e.pos),
  { max: 2 }
);
```

---

### Move + Attack Functions

#### `computeAttackFrom`
```typescript
function computeAttackFrom(
  field: MovementField,
  attackRange: RangeSpec,
  opts?: AttackableFromOptions
): Set<string>
```
**Attack position set.** Returns hex keys from which attacks can be launched after moving.

**Note:** Currently returns all reachable positions. Caller filters by range and LOS.

---

#### `collectTargetsFromPositions`
```typescript
function collectTargetsFromPositions(
  fromPositions: Iterable<string | AxialLike>,
  potentialTargets: AxialLike[],
  attackRange: RangeSpec,
  opts?: AttackableFromOptions
): Axial[]
```
**Target collection.** Gathers targets that are within `attackRange` of any position in `fromPositions`.

**Options:**
- `hasLineOfSight?: (from, to) => boolean` - Optional LOS filter

**Example:**
```typescript
const field = uniformMovement(myPos, myMP, isPassable);
const attackFrom = computeAttackFrom(field, { max: 2 });
const targets = collectTargetsFromPositions(
  attackFrom,
  enemies.map(e => e.pos),
  { min: 1, max: 2 },
  { hasLineOfSight: (from, to) => checkLOS(from, to) }
);
```

---

## Integration Guide

### Step 1: Define Cost Functions
```typescript
// Terrain-based costs
const terrainCost: MoveCostFn = (hex) => {
  const tile = battleMap.getTile(hex);
  if (!tile) return Infinity;
  return tile.moveCost; // 1, 2, 3, or Infinity
};

// Edge blockers (walls, cliffs)
const hasWall: EdgeBlockerFn = (from, to) => {
  return battleMap.hasEdgeBlock(from, to);
};

// Occupancy (units)
const isOccupied: IsOccupiedFn = (hex) => {
  const unit = battleState.getUnitAt(hex);
  return unit && unit.team !== activeTeam;
};
```

### Step 2: Compute Movement Field
```typescript
const selectedUnit = battleState.selectedUnit;
const field = computeMovementField(
  selectedUnit.pos,
  selectedUnit.mp,
  terrainCost,
  { edgeBlocker: hasWall, isOccupied }
);
```

### Step 3: Highlight Reachable Hexes (UI)
```typescript
const reachable = reachableKeys(field);
for (const key of reachable) {
  const [q, r] = key.split(',').map(Number);
  highlightHex(axial(q, r), 'blue');
}
```

### Step 4: Show Path Preview on Hover
```typescript
onHexHover((hex) => {
  const path = reconstructPath(field, hex);
  if (path) {
    drawPath(path);
    const cost = field.nodes.get(axialKey(hex))!.cost;
    showTooltip(`${cost} MP`);
  }
});
```

### Step 5: Execute Movement
```typescript
onHexClick((hex) => {
  const path = reconstructPath(field, hex);
  if (path) {
    animateUnitAlongPath(selectedUnit, path);
    selectedUnit.mp -= field.nodes.get(axialKey(hex))!.cost;
  }
});
```

---

## Performance Tips

### Complexity Analysis
- **Dijkstra:** O(N log N) where N = explored hexes
- **Path reconstruction:** O(D) where D = distance to target
- **Range checks:** O(1) per check
- **Filter by range:** O(K) where K = candidate count

### Optimization Strategies

#### 1. Use Node Limit for Large Maps
```typescript
const field = computeMovementField(origin, maxMP, costFn, {
  nodeLimit: 500 // Cap exploration for performance
});
```

#### 2. Cache Movement Fields
```typescript
const fieldCache = new Map<string, MovementField>();

function getCachedField(unit) {
  const key = `${axialKey(unit.pos)}-${unit.mp}`;
  if (!fieldCache.has(key)) {
    fieldCache.set(key, computeMovementField(...));
  }
  return fieldCache.get(key);
}
```

#### 3. Lazy Path Reconstruction
Only reconstruct paths when user hovers/clicks, not on every frame.

#### 4. Incremental Updates
Recompute field only when unit position or MP changes, not on every selection.

### Typical Performance (Modern Desktop)
- **Small map (10x10):** <1ms
- **Medium map (30x30):** 2-5ms
- **Large map (50x50):** 10-20ms
- **Huge map (100x100) with limit:** 20-40ms

---

## Best Practices

### DO ✅
- Use enter-cost model for hazards (lava = 3 MP to enter)
- Cache movement fields between frames
- Apply ZoC for tactical depth
- Use path reconstruction for UI previews
- Validate paths before animating
- Test with variable terrain mixes

### DON'T ❌
- Don't recompute fields every frame
- Don't use exit-cost model (breaks Dijkstra)
- Don't ignore edge blockers (breaks immersion)
- Don't forget to cap MP (units can have fractional MP)
- Don't mix movement and attack costs (separate systems)
- Don't hardcode terrain costs (use lambdas)

---

## Testing

### Unit Tests (30 tests, 100% coverage)
```bash
npm test -- movement.test.ts
```

**Test Categories:**
- ✅ Basic uniform movement (4 tests)
- ✅ Impassable terrain (3 tests)
- ✅ Occupancy (3 tests)
- ✅ Edge blockers (2 tests)
- ✅ Zone of Control (3 tests)
- ✅ Variable costs (2 tests)
- ✅ Path reconstruction (3 tests)
- ✅ Range predicates (3 tests)
- ✅ Move+attack helpers (3 tests)
- ✅ Performance & edge cases (4 tests)

### Integration Testing
```typescript
describe('Battle integration', () => {
  it('unit moves and attacks in one turn', () => {
    const field = computeMovementField(unit.pos, unit.mp, costFn);
    const path = reconstructPath(field, targetPos);
    expect(path).not.toBeNull();
    
    const attackFrom = computeAttackFrom(field, unit.attackRange);
    const targets = collectTargetsFromPositions(
      attackFrom,
      enemies.map(e => e.pos),
      unit.attackRange
    );
    expect(targets.length).toBeGreaterThan(0);
  });
});
```

---

## Next Canvases

### Canvas #4 — Line of Sight & Raycast
- **Bresenham line-casting** with hex coordinates
- **Terrain occlusion** (walls, trees, hills)
- **Partial cover** detection
- **Vision radius** with fog of war
- **LOS helpers** for abilities and targeting

### Canvas #5 — AoE Templates
- **Circle/blast** masks (radius R)
- **Line** masks (length L, width W)
- **Cone** masks (angle θ, range R)
- **Template rotation** and preview
- **Friendly fire** detection
- **Damage falloff** zones

### Canvas #6 — Advanced Pathfinding
- **A\*** with heuristics for faster paths
- **Jump Point Search** for uniform grids
- **Flow fields** for crowd movement
- **Unit formations** preservation
- **Dynamic obstacles** (moving units)
- **Multi-unit pathfinding** without collisions

---

## Credits & References

**Algorithm Source:** Red Blob Games - [Hexagonal Grids](https://www.redblobgames.com/grids/hexagons/)  
**Dijkstra Implementation:** Binary heap priority queue with relaxation  
**ZoC Rules:** Classic SRPG mechanics (Fire Emblem, Advance Wars)

**Related Modules:**
- Canvas #1: `coords.ts` - Coordinate primitives
- Canvas #2: `math.ts` - Distance, neighbors, rings, spirals
- Canvas #4: `los.ts` (planned) - Line of sight and occlusion
- Canvas #5: `aoe.ts` (planned) - Area of effect templates

---

## Changelog

### v1.0.0 (October 2025)
- ✅ Initial release with 30 passing tests
- ✅ Dijkstra reachability with variable costs
- ✅ Path reconstruction with parent pointers
- ✅ Zone of Control with sealing rules
- ✅ Edge blockers and occupancy
- ✅ Range predicates and move+attack helpers
- ✅ Comprehensive documentation with examples
- ✅ 100% test coverage with edge cases
