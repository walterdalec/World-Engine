# World/Overworld Cleanup Plan

## REVISED ANALYSIS - FactionAI is NOT Legacy!

### Important Clarification
After review, **FactionAI.ts and SeasonalCampaign.ts are NOT legacy code**. They are:
- ✅ **Planned features** for Mount & Blade-style dynamic warfare
- ✅ **Core game vision** from copilot-instructions.md
- ✅ **Future integration** points for living world simulation
- ✅ **Complementary** to strategy layer (different purposes)

## Two Different AI Systems (Both Valid)

### 1. Living World AI (`src/features/world/FactionAI.ts`)
**Purpose**: Mount & Blade-style background simulation
- Factions wage war **independently** of player
- AI-driven territorial expansion/contraction
- Emergent politics and shifting alliances
- Player observes and can intervene as mercenary
- **Real-time or continuous** simulation

**Status**: Not yet integrated, but **planned core feature**

### 2. Strategic Campaign AI (`src/features/strategy/ai/`)
**Purpose**: Brigandine-style player campaign layer
- Player-driven turn-based strategic decisions
- Faction actions respond to **player moves**
- Seasonal progression and objectives
- Territory control and castle management
- **Turn-based** strategic gameplay

**Status**: Active development with tests

## Correct Cleanup Approach

### NO FILES TO ARCHIVE
All world files are either:
1. **Actively used** (WorldMapEngine, SimpleWorldMap, etc.)
2. **Planned features** (FactionAI, SeasonalCampaign)
3. **Active development** (encounters/, procedural/)

### Already Archived (Correct)
- ✅ `ExplorationMode.tsx` - Used old BattleSystem, correctly moved to _legacy

## World Feature Status

### Active & Integrated ✅
- **WorldMapEngine.tsx** - Primary exploration system (used in App.tsx)
- **WorldRenderer.tsx** - World display component
- **SimpleWorldMap.tsx** - Verdance campaign map
- **EnhancedWorldMap.tsx** - Strategic map view
- **WorldSetupScreen.tsx** - World gen UI
- **encounters/** - Encounter generation (EncountersTestPage in menu)
- **procedural/** - Procedural gen (ProceduralDevTools in menu)

### Planned Features (Do Not Archive) 🚧
- **FactionAI.ts** - Living World simulation (TODO: integration)
- **SeasonalCampaign.ts** - Seasonal campaign manager (TODO: integration)

## Future Integration Tasks

### FactionAI Integration
**TODO items**:
1. Hook into WorldMapEngine for background faction warfare
2. Connect with player reputation system
3. Add faction event notifications to UI
4. Implement mercenary contract system
5. Add diplomatic options for player interaction

### SeasonalCampaign Integration  
**TODO items**:
1. Connect with strategy layer for unified seasonal progression
2. Integrate objectives with actual gameplay goals
3. Add seasonal modifiers to battle system
4. Create UI for campaign objectives display
5. Implement reward/penalty system

## Conclusion

**NO CLEANUP NEEDED** for FactionAI or SeasonalCampaign.

These are **unimplemented features**, not legacy code. They represent core game vision elements that should be integrated, not archived.

The only world file correctly archived is **ExplorationMode.tsx** (used old battle system).
