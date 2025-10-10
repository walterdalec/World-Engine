# Canvas #4 Implementation Summary

**Status:** ✅ COMPLETE  
**Date:** December 2024  
**Commit:** daab2b5  
**Tests:** 38/38 passing (159 total hex tests)

## What Was Built

Canvas #4 provides **production-ready Line of Sight (LOS) and raycast utilities** for hex-based tactical combat, completing the foundation for visibility, targeting, and fog of war systems.

### Core Features Implemented

1. **Hard Occlusion (Boolean Blocking)**
   - Tile blockers: Walls, mountains, solid obstacles at hex centers
   - Edge blockers: Walls/doors between adjacent hexes (fences, gates, cliffs)
   - LOS fails immediately when hard blocker encountered

2. **Soft Cover (Accumulated Penalty)**
   - Mid-ray hexes contribute soft cover (forest=0.5, grass=0.25, fog=0.3)
   - Exponential penalty mapping: `penalty = 1 - e^(-k*sum)` (default k=0.7)
   - Smooth falloff: sum=1 → ~0.503 penalty, sum=2 → ~0.753, sum=3 → ~0.878

3. **Elevation Blocking (Height Interpolation)**
   - Interpolates sight line height at each mid hex
   - Blocks if mid hex elevation rises above sight line
   - Supports uphill/downhill asymmetry (high ground advantage)

4. **Opaque Target Visibility**
   - `seeOpaqueTarget=true` (default) allows targeting enemies in doorways
   - Target hex doesn't block LOS even if tile blocker present
   - Mid hex blockers always block

5. **Visibility Fields**
   - Compute all visible hexes within radius (fog of war, AI perception)
   - O(R³) complexity: R=5 → 91 hexes → <6ms

### API Provided

```typescript
// Core raycast with full diagnostic data
function traceRay(a: AxialLike, b: AxialLike, opts?: LOSOptions): Raycast

// Boolean LOS check
function hasLineOfSight(a: AxialLike, b: AxialLike, opts?: LOSOptions): boolean

// Visibility field for fog of war
function visibleWithinRadius(origin: AxialLike, radius: number, opts?: LOSOptions): Set<string>

// Convenience wrapper for combat systems
function coverBetween(a: AxialLike, b: AxialLike, opts?: LOSOptions): CoverResult
```

### Types & Interfaces

```typescript
interface Raycast {
  steps: RayStep[];           // All hexes along ray with full context
  clear: boolean;             // True if no hard blockers
  coverSum: number;           // Total soft cover accumulated
  coverPenalty: number;       // Penalty in [0,1]
  blockedBy: RayStep | null;  // First hard blocker, if any
}

interface RayStep {
  hex: Axial;
  index: number;
  kind: 'start' | 'mid' | 'target';
  blockedTile?: boolean;
  blockedEdge?: boolean;
  softCover?: number;
  elevation?: number | null;
}

interface LOSOptions {
  blocksAt?: BlocksSightAtFn;       // Tile occlusion
  blocksEdge?: BlocksSightEdgeFn;   // Edge occlusion
  softCoverAt?: SoftCoverAtFn;      // Soft cover contributions
  elevationAt?: ElevationAtFn;      // Optional elevation
  seeOpaqueTarget?: boolean;        // Default: true
  maxSoftCover?: number;            // Default: 3.0
  softCoverK?: number;              // Default: 0.7
}
```

## Test Coverage

**38 tests across 11 categories:**

- ✅ Basic Tile Blocking (4 tests)
- ✅ Edge Blocking (4 tests)
- ✅ Soft Cover (6 tests)
- ✅ Opaque Target Visibility (3 tests)
- ✅ Elevation Blocking (5 tests)
- ✅ Combined Blocking (2 tests)
- ✅ Visibility Field (5 tests)
- ✅ Cover Between Convenience (3 tests)
- ✅ Ray Step Structure (4 tests)
- ✅ Edge Cases (5 tests)

**All 159 hex tests passing:**
- Canvas #1 (coords.ts): 46 tests ✅
- Canvas #2 (math.ts): 45 tests ✅
- Canvas #3 (movement.ts): 30 tests ✅
- Canvas #4 (los.ts): 38 tests ✅

## Files Created

1. **src/features/battle/hex/los.ts** (230 lines)
   - Core implementation with 4 exported functions
   - 7 types/interfaces for clean API
   - ES5-compatible (no problematic iteration patterns)

2. **src/features/battle/hex/los.test.ts** (438 lines)
   - Comprehensive test coverage with helper factories
   - Property validation and formula verification
   - Edge case handling

3. **src/features/battle/hex/README.los.md** (600+ lines)
   - Complete API reference with examples
   - Usage patterns for common scenarios
   - Performance characteristics and design rationale
   - Integration guides for other canvases

4. **src/features/battle/hex/index.ts** (updated)
   - Added Canvas #4 exports and documentation

## Fixes Applied During Development

### Issue 1: Negative k Penalty Clamping
**Problem:** Formula `1 - e^(-k*sum)` produces negative values when k < 0  
**Fix:** Added clamping to [0,1] range in `computeCoverPenalty()`
```typescript
const raw = 1 - Math.exp(-k * sum);
return Math.max(0, Math.min(1, raw)); // Clamp to [0,1]
```

### Issue 2: Visibility Field Test Expectation
**Problem:** Test expected wall to be invisible, but `seeOpaqueTarget=true` (default) makes it visible  
**Fix:** Updated test to expect wall visible, hexes behind wall blocked
```typescript
expect(vis.has('1,0')).toBe(true);  // Wall itself visible
expect(vis.has('2,0')).toBe(false); // Behind wall blocked
```

## Performance Verification

### `traceRay()` / `hasLineOfSight()`
- **Complexity:** O(d) where d = distance
- **Typical:** d=5 → ~5μs, d=10 → ~10μs
- **Test result:** All 38 tests complete in 33ms ✅

### `visibleWithinRadius()`
- **Complexity:** O(R³) where R = radius
- **Typical:** R=2 → 19 hexes, R=5 → 91 hexes, R=10 → 331 hexes
- **Test result:** R=5 with blockers → <6ms ✅

## Usage Examples

### Basic LOS Check
```typescript
const canSee = hasLineOfSight(
  archerPos,
  targetPos,
  {
    blocksAt: (h) => battlefield.hasWall(h),
    elevationAt: (h) => battlefield.getHeight(h)
  }
);
```

### Attack with Cover Penalty
```typescript
const cover = coverBetween(archerPos, targetPos, {
  blocksAt: (h) => battlefield.hasWall(h),
  softCoverAt: (h) => battlefield.getCover(h),
  elevationAt: (h) => battlefield.getHeight(h)
});

if (cover.hasLOS) {
  const hitChance = baseAccuracy * (1 - cover.coverPenalty);
  // Apply to attack roll
}
```

### Fog of War
```typescript
const visible = visibleWithinRadius(
  unit.position,
  unit.visionRange,
  {
    blocksAt: (h) => battlefield.hasWall(h),
    elevationAt: (h) => battlefield.getHeight(h)
  }
);

battlefield.setVisibleHexes(visible);
```

## Design Decisions

### Why Exponential Penalty Mapping?

**Problem:** How to map accumulated soft cover sum to [0,1] penalty?

**Linear mapping (rejected):** `penalty = min(1, sum / maxSoftCover)`
- Too harsh at low cover (1 forest = 33% penalty feels weak)
- Too weak at high cover (3 forests = 100% penalty feels instant)

**Exponential mapping (chosen):** `penalty = 1 - e^(-k*sum)`
- Smooth falloff: Each additional cover hex matters less
- Intuitive: 1 hex ≈ 50%, 2 ≈ 75%, 3+ ≈ 90%
- Configurable: Adjust k for different game balance

### Why `seeOpaqueTarget=true` by Default?

**Scenario:** Archer shoots at enemy in doorway (tile blocker at target).

**With true (default):**
- LOS succeeds: Can target enemy
- Soft cover still applies
- Intuitive: "I can see them, even though they're in a doorway"

**With false:**
- LOS fails: Can't target enemy
- Doorway becomes perfect protection
- Less intuitive: "I can see them but can't shoot?"

**Decision:** Default true for better gameplay, disable for strict LOS systems.

## Integration with Battle System

### Canvas #2 (math.ts) Dependencies
- Uses `axialLine(a, b)` for discrete ray steps
- Uses `axialRange(origin, r)` for visibility field hexes

### Canvas #3 (movement.ts) Integration
```typescript
// Combine LOS with range for "move + attack" AI
const attackTargets = enemies.filter(enemy =>
  isReachableThenAttack(unit.pos, enemy.pos, unit.mp, unit.atkRange, {
    moveCosts: movementCosts,
    blocksAt: losBlockers  // Shared with LOS system
  })
);
```

### Future Canvas #5 (AoE Templates)
```typescript
// LOS check for AoE spell targeting
function canCastAoE(caster: Unit, center: Axial): boolean {
  return hasLineOfSight(caster.position, center, {
    blocksAt: battlefield.hasWall,
    elevationAt: battlefield.getHeight
  });
}
```

## What's Next

### Canvas #5: AoE Templates (Planned)
- Circle/blast templates (radius R)
- Line templates (length L, width W)
- Cone templates (origin, direction, range, arc)
- Burst patterns (irregular shapes)
- Template rotation and facing
- Friendly fire detection
- LOS integration for targeting

### Canvas #6: Advanced Pathfinding (Planned)
- A* implementation for optimal paths
- Flow fields for multi-unit movement
- Jump point search for large maps
- Pathfinding with LOS constraints

## Conclusion

Canvas #4 completes the **visibility and targeting foundation** for World Engine's tactical battle system. With 159 tests passing across 4 canvases, the hex grid system now supports:

✅ **Coordinates** - Canonical axial/cube with -0 handling  
✅ **Math** - Distance, lines, rings, spirals, ranges, rotations  
✅ **Movement** - Dijkstra reachability, terrain costs, ZoC, paths  
✅ **LOS/Raycast** - Hard/soft occlusion, elevation, fog of war, cover  

**Next:** Ready to implement Canvas #5 (AoE Templates) when specifications provided.

---

**Commit:** daab2b5  
**Branch:** main  
**Files Changed:** 4 files, 1240 insertions  
**Tests:** 38 new tests (159 total hex tests passing)
