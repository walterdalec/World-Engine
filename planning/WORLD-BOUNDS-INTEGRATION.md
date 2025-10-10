# World Bounds Integration Plan

## Overview
Integration roadmap for the "Colossal Finite Realm" world bounds system. This replaces the previous infinite world assumption with a huge but deterministic bounded world of ~771 million hexes.

## Status: ✅ Configuration Complete, 🚧 Integration Pending

### Completed (Commit a86aa03)
- ✅ `worldBounds.ts`: Core configuration module (173 lines)
- ✅ `worldBounds.test.ts`: Comprehensive test suite (36 tests, 100% passing)
- ✅ Exported from `src/core/config/index.ts`
- ✅ Default bounds: 501×501 sectors = ~771M hexes
- ✅ Test bounds: 21×21 sectors for CI safety
- ✅ 5 world size presets (tiny/small/medium/large/colossal)
- ✅ Utility functions: `isSectorInBounds`, `clampSectorToBounds`, etc.

---

## Integration Tasks

### Priority 1: Sector Streaming (Critical)
**File:** `src/features/world/streaming/sectorStreaming.ts` (or similar)

**Current Issue:** Infinite sector exploration causes "Map maximum size exceeded"

**Required Changes:**
```typescript
import { isSectorInBounds, clampSectorToBounds, DEFAULT_WORLD_BOUNDS } from '@/core/config';

// In ensureAround() or equivalent:
function ensureAround(sx: number, sy: number, radius: number) {
    // Clamp center to valid bounds first
    const { sx: centerX, sy: centerY } = clampSectorToBounds(sx, sy);
    
    for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
            const targetX = centerX + dx;
            const targetY = centerY + dy;
            
            // CRITICAL: Skip sectors outside bounds
            if (!isSectorInBounds(targetX, targetY)) continue;
            
            // Generate/load sector
            if (!sectors.has(key(targetX, targetY))) {
                sectors.set(key(targetX, targetY), generateSector(targetX, targetY));
            }
        }
    }
}
```

**Expected Outcome:**
- No more infinite exploration
- CI-safe pathfinding tests
- Deterministic world generation

---

### Priority 2: Save/Snapshot System
**File:** `src/store/gameStore.ts` or world state persistence

**Required Changes:**
```typescript
import { WorldBounds, DEFAULT_WORLD_BOUNDS } from '@/core/config';

interface WorldSnapshot {
    seed: number;
    bounds: WorldBounds;  // NEW: Preserve world size
    sectors: SectorData[];
    // ... existing fields
}

function snapshot(state: WorldState): WorldSnapshot {
    return {
        seed: state.seed,
        bounds: state.bounds ?? DEFAULT_WORLD_BOUNDS,  // Default for legacy saves
        sectors: Array.from(state.sectors.values()),
        // ...
    };
}

function restore(snapshot: WorldSnapshot): WorldState {
    return {
        seed: snapshot.seed,
        bounds: snapshot.bounds ?? DEFAULT_WORLD_BOUNDS,  // Migration path
        sectors: new Map(snapshot.sectors.map(s => [key(s.sx, s.sy), s])),
        // ...
    };
}
```

**Migration Strategy:**
- Existing saves without `bounds` → use `DEFAULT_WORLD_BOUNDS`
- Seed-based generation still deterministic within bounds
- Future: Allow players to choose world size at campaign start

---

### Priority 3: World Generation Boundaries
**File:** `src/features/world/generation/` (various generators)

**Required Changes:**
1. **Biome Generator:**
   ```typescript
   function generateBiome(sx: number, sy: number, seed: number, bounds: WorldBounds) {
       // Check bounds before expensive noise calculations
       if (!isSectorInBounds(sx, sy, bounds)) {
           return createBarrierSector(sx, sy);  // Edge of world treatment
       }
       
       // Normal generation...
   }
   ```

2. **Feature Placement:**
   ```typescript
   function placeCities(sectors: Map<string, Sector>, bounds: WorldBounds) {
       const validSectors = Array.from(sectors.values())
           .filter(s => isSectorInBounds(s.sx, s.sy, bounds));
       
       // Only place features within bounds
       // ...
   }
   ```

3. **Barrier Sectors (NEW):**
   ```typescript
   function createBarrierSector(sx: number, sy: number): Sector {
       return {
           sx, sy,
           biome: 'void',  // Special biome
           passable: false,
           features: [{ type: 'world-edge', label: 'Edge of Known World' }],
           // All hexes blocked
       };
   }
   ```

**Visual Treatment:**
- Fade to mist/darkness at world edges
- Optional: Mountain ranges or ocean as natural barriers
- Clear indication: "You have reached the edge of the known world"

---

### Priority 4: Remove "Infinite Mode" Toggle
**Files:** UI components, world generation options

**Current State:** Some UI may have "infinite world" toggle

**Required Changes:**
1. **Replace toggle with size preset dropdown:**
   ```tsx
   <select value={worldSize} onChange={e => setWorldSize(e.target.value)}>
       <option value="tiny">Tiny (121 sectors - testing)</option>
       <option value="small">Small (1,681 sectors - focused campaign)</option>
       <option value="medium">Medium (10,201 sectors - standard)</option>
       <option value="large">Large (40,401 sectors - epic)</option>
       <option value="colossal">Colossal (251,001 sectors - exploration beyond reason)</option>
   </select>
   ```

2. **Use `getWorldSizeDescription()` for tooltips:**
   ```tsx
   import { WORLD_SIZE_PRESETS, getWorldSizeDescription } from '@/core/config';
   
   const desc = getWorldSizeDescription(WORLD_SIZE_PRESETS[worldSize]);
   // "Colossal (771,075,072 hexes - exploration beyond reason)"
   ```

---

### Priority 5: Movement & Pathfinding Integration
**File:** `src/features/battle/hex/pathfinding.ts`

**Current State:** Pathfinding already has node limits, but world movement needs bounds

**Required Changes:**
```typescript
import { isSectorInBounds, clampSectorToBounds } from '@/core/config';

function validateMovement(fromHex: Axial, toHex: Axial, worldBounds: WorldBounds): boolean {
    const fromSector = hexToSector(fromHex);
    const toSector = hexToSector(toHex);
    
    // Prevent movement to invalid sectors
    if (!isSectorInBounds(toSector.sx, toSector.sy, worldBounds)) {
        return false;  // Can't move beyond world edge
    }
    
    return true;
}
```

**Note:** Tactical battles are already bounded by deployment zones, so this primarily affects overworld movement.

---

## Testing Strategy

### Unit Tests (Already Complete)
- ✅ 36 tests in `worldBounds.test.ts`
- ✅ Covers all boundary conditions, clamping, size calculations

### Integration Tests (TODO)
```typescript
describe('Sector Streaming with Bounds', () => {
    it('does not generate sectors outside bounds', () => {
        const world = createWorld({ bounds: WORLD_SIZE_PRESETS.tiny });
        ensureAround(999, 999, 5);  // Way outside tiny bounds
        
        const generatedSectors = Array.from(world.sectors.keys());
        expect(generatedSectors.every(key => {
            const [sx, sy] = parseKey(key);
            return isSectorInBounds(sx, sy, WORLD_SIZE_PRESETS.tiny);
        })).toBe(true);
    });
    
    it('clamps player position to bounds', () => {
        const world = createWorld({ bounds: WORLD_SIZE_PRESETS.small });
        const player = { pos: hexAt(10000, 10000) };
        
        updatePlayerPosition(player, world);
        
        const sector = hexToSector(player.pos);
        expect(isSectorInBounds(sector.sx, sector.sy, world.bounds)).toBe(true);
    });
});
```

### Manual Testing Checklist
- [ ] Create new campaign with different world sizes
- [ ] Navigate to world edge - should see barrier
- [ ] Attempt to move beyond edge - should be blocked
- [ ] Save/load campaign - world size preserved
- [ ] Pathfinding doesn't cause "Map maximum size" errors
- [ ] Large worlds feel appropriately vast
- [ ] Small worlds don't feel cramped

---

## Performance Considerations

### Memory Impact
- **Tiny (121 sectors):** ~370K hexes → Minimal memory
- **Medium (10,201 sectors):** ~31M hexes → Moderate memory
- **Colossal (251,001 sectors):** ~771M hexes → Only loaded sectors in RAM

### Lazy Loading Benefits
- Only generate sectors within player's streaming radius
- Typical session: 100-500 sectors loaded (~300K-1.5M hexes)
- Bounds prevent runaway generation in edge cases

### CI Performance
- Use `TEST_WORLD_BOUNDS` (21×21 sectors) for all CI tests
- Prevents timeout on expensive world generation tests
- ~1.3M hex test world is sufficient for validation

---

## Migration Path for Existing Saves

### Version Detection
```typescript
interface SaveFile {
    version: number;
    world: WorldSnapshot;
}

function loadSave(saveData: SaveFile): WorldState {
    if (saveData.version < 2) {
        // Legacy save without bounds
        return {
            ...saveData.world,
            bounds: DEFAULT_WORLD_BOUNDS,  // Apply default
            // Existing sectors remain valid
        };
    }
    
    return saveData.world;
}
```

### Backward Compatibility
- Old saves work with default bounds (colossal)
- Seed determinism preserved - same sectors generate identically
- No data loss - only adds boundary constraints

---

## Future Enhancements (Post-Integration)

### 1. Dynamic World Expansion (Optional)
- Start with small bounds, expand based on exploration
- "Discover new lands beyond the frontier"
- Procedurally expand bounds when player reaches edge

### 2. Multiple Worlds/Planes
- Different bounds per plane/dimension
- "Pocket dimensions" with tiny bounds
- "Astral plane" with colossal bounds

### 3. World Shape Variants
- Circular bounds instead of square
- Irregular shapes (continents, islands)
- Toroidal wrapping for specific world types

### 4. Procedural Barriers
- Mountain ranges at edges (high elevation sectors)
- Ocean barriers for island worlds
- Magical wards or "void storms"

---

## Implementation Order

1. **Week 1:** Sector streaming integration (Priority 1)
   - Update `ensureAround()` with bounds checks
   - Add barrier sector generation
   - Test with `TEST_WORLD_BOUNDS`

2. **Week 2:** Save system integration (Priority 2)
   - Add `bounds` field to world snapshots
   - Implement migration for legacy saves
   - Test save/load with different sizes

3. **Week 3:** World generation updates (Priority 3)
   - Update all generators to respect bounds
   - Implement edge treatment (barriers/void)
   - Add visual cues for world edges

4. **Week 4:** UI/UX polish (Priority 4 & 5)
   - Replace infinite toggle with size presets
   - Add world size descriptions
   - Prevent player movement beyond edges
   - Polish visual treatment

5. **Week 5:** Testing & refinement
   - Integration tests for all systems
   - Performance profiling
   - Manual testing across all world sizes
   - Bug fixes and edge case handling

---

## Success Criteria

✅ **Functional Requirements:**
- [ ] No "Map maximum size exceeded" errors in any system
- [ ] All spatial systems respect bounds (pathfinding, movement, generation)
- [ ] Saves preserve world size correctly
- [ ] Players cannot move/see beyond world edges
- [ ] CI tests complete successfully with bounded regions

✅ **Performance Requirements:**
- [ ] World generation completes in <5s for typical starting area
- [ ] No memory leaks from unbounded exploration
- [ ] 60fps maintained during world map navigation
- [ ] CI tests complete in <60s

✅ **UX Requirements:**
- [ ] Clear visual indication of world edges
- [ ] Intuitive world size selection at campaign start
- [ ] No confusing behavior at boundaries
- [ ] World feels appropriately sized for chosen preset

---

## Notes & Rationale

### Why Bounded Worlds?
1. **Deterministic Behavior:** Finite bounds prevent edge cases in spatial algorithms
2. **CI Safety:** Tests can exhaustively cover bounded regions
3. **Memory Safety:** No runaway generation consuming RAM
4. **Performance:** Clear limits enable optimization
5. **UX Clarity:** Players understand world scope

### Why "Colossal Finite Realm"?
- **~771 million hexes** is effectively infinite for gameplay
- At 1 hex/second exploration, would take **24+ years** to visit every hex
- Large enough to feel limitless, small enough to be deterministic
- Supports all intended gameplay without artificial constraints

### Why Multiple Size Presets?
- **Tiny/Small:** Perfect for focused campaigns, quick testing
- **Medium:** Standard epic fantasy campaign scale
- **Large/Colossal:** For players who want true exploration depth
- **Flexibility:** Different campaign styles benefit from different scales

---

## Contact & Questions

For questions about world bounds integration:
- Check `src/core/config/worldBounds.ts` for implementation details
- Review `worldBounds.test.ts` for usage examples
- See commit a86aa03 for initial implementation context
- Refer to pathfinding fixes (commit 4285185) for bounded region patterns
