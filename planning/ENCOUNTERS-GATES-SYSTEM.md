# Encounters & Gates System Integration

## Status: 🚧 Phase 1 Complete - Core Types & Generation

### ✅ Completed (Current Session)

**Files Created:**
1. ✅ `src/features/world/encounters/types.ts` - Core type definitions
2. ✅ `src/features/world/encounters/tables.ts` - Encounter roll tables with biome weights
3. ✅ `src/features/world/encounters/generator.ts` - Encounter generation with AI integration

**Key Features Implemented:**
- Encounter biome system (10 biome types)
- 9 encounter types (RAID_PARTY, SCOUT_PATROL, WANDERER, etc.)
- Weighted encounter tables per biome
- Difficulty and XP scaling based on:
  - Region tier (1-5)
  - Party level
  - Region control (0-100%)
  - Conflict level (0-100%)
- World bounds integration (filters encounters beyond colossal bounds)
- Biome mapping from game biomes to encounter categories

---

## 📋 Remaining Implementation Tasks

### Phase 2: Gates System
**Files to Create:**
- `src/features/world/encounters/gates.ts` - Gate generation and placement
- `src/features/world/encounters/gateState.ts` - Gate persistence and unlock logic

**Functions Needed:**
```typescript
// gates.ts
export function placeSafeGates(
    sectorWidth: number,
    sectorHeight: number,
    rng: SeededRng,
    tier: number,
): Gate[];

export function validateGatePosition(
    q: number,
    r: number,
    sectorWidth: number,
    sectorHeight: number,
): boolean;

// gateState.ts
export function persistGateState(gameState: GameState, gates: Gate[]): void;
export function unlockGate(gameState: GameState, gate: Gate, faction: string): void;
export function isGateUnlocked(gameState: GameState, gate: Gate): boolean;
```

---

### Phase 3: Save/Load Integration
**File to Update:**
- `src/store/gameStore.ts` - Add encounters and gates to state

**State Extensions:**
```typescript
interface GameState {
    // ... existing fields
    encounters: Map<string, Encounter>;
    encounterLog: EncounterLogEntry[];
    gates: Map<string, GateState>;
}
```

---

### Phase 4: AI Integration Hooks
**File to Create:**
- `src/features/world/encounters/aiHooks.ts` - AI feedback system

**Functions Needed:**
```typescript
export function reportEncounterToAI(
    ai: FactionAI,
    encounter: Encounter,
    outcome: 'VICTORY' | 'DEFEAT' | 'FLED' | 'AVOIDED',
): void;

export function updateFactionAggression(
    faction: Faction,
    encounterType: EncounterType,
): void;
```

---

### Phase 5: World Manager Integration
**File to Update:**
- `src/features/world/procedural/manager.ts`

**Integration Points:**
```typescript
// In WorldManager class:
public generateEncountersForSector(
    sectorX: number,
    sectorY: number,
): Encounter[] {
    const regionOwner = this.getRegionOwner(sectorX, sectorY);
    const biome = this.getBiomeForSector(sectorX, sectorY);
    const tiles = this.getTilesInSector(sectorX, sectorY);
    
    return syncEncounterTableWithAI(
        regionOwner.id,
        regionOwner,
        biome,
        tiles,
        this.config.globalSeed,
        this.getPartyLevel(),
    );
}
```

---

### Phase 6: UI Components
**Files to Create:**
- `src/features/world/encounters/EncounterDisplay.tsx` - Show encounter info
- `src/features/world/encounters/GateDisplay.tsx` - Show gate requirements
- `src/features/world/encounters/EncounterLog.tsx` - History of encounters

---

### Phase 7: Testing
**Test Files to Create:**
- `src/features/world/encounters/__tests__/generator.test.ts`
- `src/features/world/encounters/__tests__/tables.test.ts`
- `src/features/world/encounters/__tests__/gates.test.ts`

**Test Coverage:**
- Encounter generation is deterministic (same seed = same encounters)
- Difficulty scaling works correctly
- XP scaling based on region control
- World bounds filtering prevents edge spawns
- Gate placement respects margins
- Gate unlock state persists across saves

---

## 🎯 Integration with Existing Systems

### Colossal World Bounds
**Status: ✅ Integrated**
```typescript
// Uses DEFAULT_WORLD_BOUNDS from worldBounds.ts
// Encounters filtered for sectors outside bounds
// Gates cannot spawn on world edge
```

### Faction AI
**Status: 🚧 Pending**
```typescript
// Hooks prepared for:
// - reportEncounterToAI()
// - Faction aggression updates
// - Region conflict tracking
```

### Sector Streaming
**Status: 🚧 Pending**
```typescript
// Needs integration in manager.ts:
// - generateEncountersForSector()
// - cacheEncounters()
// - streamEncountersAround()
```

### Save System
**Status: 🚧 Pending**
```typescript
// State extensions needed in gameStore.ts:
// - encounters: Map<string, Encounter>
// - encounterLog: EncounterLogEntry[]
// - gates: Map<string, GateState>
```

---

## 📊 Encounter System Stats

### Biome Coverage
- ✅ 10 biome types defined
- ✅ Unique encounter weights per biome
- ✅ Settlement biomes favor merchants/quests
- ✅ Wilderness biomes favor monsters/ambushes

### Encounter Types (9 Total)
| Type | Base Diff | Base XP | Common In |
|------|-----------|---------|-----------|
| RAID_PARTY | 6 | 150 | Desert, Grass |
| SCOUT_PATROL | 4 | 80 | Forest, Taiga |
| WANDERER | 2 | 30 | Settlement, Grass |
| MONSTER | 5 | 100 | Swamp, Snow |
| BANDIT | 4 | 70 | Desert |
| MERCHANT | 1 | 20 | Settlement |
| QUEST_GIVER | 1 | 10 | Settlement |
| TREASURE | 3 | 50 | Mountain |
| AMBUSH | 7 | 120 | Swamp, Forest |

### Scaling System
- **Region Tier** (1-5): +1 difficulty, +20% XP per tier
- **Party Level**: +0.25 difficulty per level above 1
- **Region Control** (0-100%): +10% XP at full control
- **Conflict Level**:
  - HIGH (>70%): 25% spawn chance
  - MEDIUM (30-70%): 10% spawn chance
  - LOW (<30%): 3% spawn chance

---

## 🔄 Data Flow

### Encounter Generation
```
WorldManager.generateEncountersForSector()
  ↓
syncEncounterTableWithAI()
  ↓
generateEncounter()
  ↓
rollEncounter() [uses biome tables]
  ↓
filterEncountersForBounds()
  ↓
Store in gameState.encounters
```

### Encounter Resolution
```
Player enters hex with encounter
  ↓
Display EncounterDisplay UI
  ↓
Player fights/flees/avoids
  ↓
reportEncounterToAI()
  ↓
Update faction stats
  ↓
Log to encounterLog
  ↓
Save state
```

### Gate Interaction
```
Player approaches gate
  ↓
Check isGateUnlocked()
  ↓
If locked: Display GateDisplay with requirements
  ↓
Player meets requirements
  ↓
unlockGate(gameState, gate, faction)
  ↓
Persist to gameState.gates
  ↓
Save state
```

---

## 🎨 UI Mockups

### Encounter Display
```
┌─────────────────────────────────┐
│ 🗡️ RAID PARTY ENCOUNTER         │
├─────────────────────────────────┤
│ Faction: Iron Legion            │
│ Difficulty: 8 (Hard)            │
│ XP Reward: 180                  │
│                                 │
│ A group of Iron Legion raiders  │
│ patrols this area aggressively. │
│                                 │
│ [⚔️ Fight] [🏃 Flee] [👁️ Avoid] │
└─────────────────────────────────┘
```

### Gate Display
```
┌─────────────────────────────────┐
│ 🚪 ANCIENT GATE (T3)            │
├─────────────────────────────────┤
│ Status: 🔒 LOCKED               │
│                                 │
│ Requirements:                   │
│ ✓ Level 6+ (You: 8)            │
│ ✓ Iron Legion Key               │
│                                 │
│ This gate leads to the Northern │
│ Wastes, a treacherous region.   │
│                                 │
│ [🔓 Unlock] [↩️ Back]            │
└─────────────────────────────────┘
```

---

## 📝 Next Steps for Implementation

### Immediate (Phase 2):
1. Create `gates.ts` with gate placement logic
2. Create `gateState.ts` with persistence functions
3. Add tests for gate generation

### Short-term (Phase 3-4):
4. Extend `gameStore.ts` with encounter/gate state
5. Create `aiHooks.ts` for faction feedback
6. Wire up save/load for new state

### Medium-term (Phase 5-6):
7. Integrate encounters into `WorldManager`
8. Create UI components for encounters/gates
9. Add encounter log viewer

### Long-term (Phase 7):
10. Comprehensive testing suite
11. Balance tuning based on playtesting
12. Performance optimization for large worlds

---

## 🔗 Dependencies

**Required Modules:**
- ✅ `worldBounds.ts` - For boundary checks
- ✅ `rng.ts` - For deterministic generation
- 🚧 `FactionAI.ts` - For AI integration
- 🚧 `gameStore.ts` - For state management

**Optional Integrations:**
- Faction reputation system
- Quest system (for QUEST_GIVER encounters)
- Inventory system (for TREASURE, MERCHANT)
- Combat system (for battle resolution)

---

## 📈 Future Enhancements

### Dynamic Encounters
- Encounters that move between hexes
- Patrol routes for SCOUT_PATROL
- Merchant caravans with schedules

### Advanced Gates
- Multi-stage unlock requirements
- Faction-specific gates
- Timed gates (open during specific seasons)
- Puzzle gates requiring exploration

### AI-Driven Spawning
- Faction expansion creates more RAID_PARTY encounters
- Defensive factions spawn more SCOUT_PATROL
- Economic factions spawn more MERCHANT encounters

### Meta-Progression
- Encounter difficulty increases over time
- Gate keys found through exploration
- Faction relationships affect encounter hostility

---

**Status Summary:**
- ✅ Core types defined
- ✅ Encounter tables implemented
- ✅ Generation logic complete
- 🚧 Gates system pending
- 🚧 AI hooks pending
- 🚧 Save integration pending
- 🚧 UI components pending
- 🚧 Testing pending

**Estimated Completion:** 3-4 additional coding sessions for full integration
