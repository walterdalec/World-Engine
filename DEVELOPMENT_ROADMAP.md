# World Engine Development Roadmap
## Post-TODO #11 Strategic Implementation Plan

Based on the comprehensive specification in `TODO_StrategyLayer_to_OSRI_FULL.md`, here's our development roadmap for the next major phase:

## ✅ **COMPLETED FOUNDATIONS**
- **TODO #11**: Procedural generation (64×64 chunks, performance tiers, v32 tactical AI integration)
- **Battle System**: Hex-based tactical combat with v30/v31/v32 AI systems
- **Portrait System**: PNG layering with fallbacks
- **Core Engine**: Character management, world state, modular architecture

## 🎯 **PHASE 1: Core Systems Foundation (Weeks 1-3)**

### **TODO #14 - Save/Load & Replays (Schema v3)** [PRIORITY 1]
**Goal**: Versioned, hash-verified saves with deterministic replays

**Implementation Order:**
1. Schema v3 design and TypeScript interfaces
2. Migration system (v2 → v3)
3. SHA-256 hashing for save integrity  
4. Replay event system integration
5. OPFS backend for PWA persistence
6. Backward compatibility validation

**Key Deliverables:**
- `src/core/saves/schema-v3.ts` - New save format
- `src/core/saves/migration.ts` - Version migration system
- `src/core/saves/backends/` - OPFS and localStorage backends
- `src/core/saves/replay/` - Event replay system
- Hash verification for save integrity

### **TODO #16 - Character Creator Integration** [PRIORITY 2]  
**Goal**: Single-hero character creation with tactical combat integration

**Implementation Order:**
1. Hero data model and derived stat calculator
2. Title and archetype system
3. Spell access and ability slot validation
4. Loadout generator with weight calculations
5. Hero→Unit transformation for battles
6. Save/load integration with schema v3

**Key Deliverables:**
- `src/features/characters/hero/` - Hero-specific character system
- `src/features/characters/creator/` - Creation UI and validation
- `src/features/characters/derivation.ts` - Stat calculation engine
- Integration with battle system and save format

## 🎯 **PHASE 2: Strategic Layer (Weeks 4-7)**

### **TODO #12 - Strategic Layer (Economy, Supply, Conquest)** [PRIORITY 3]
**Goal**: Seasonal strategy layer with faction AI and supply chains

**Implementation Order:**
1. Region and faction data models
2. Economic tick system (weekly processing)
3. Supply line pathfinding and resolution
4. AI faction decision-making
5. Integration with procedural world (#11)
6. Battle transition system

**Key Deliverables:**
- `src/features/strategy/` - Complete strategic layer
- `src/features/strategy/economy/` - Resource and supply management
- `src/features/strategy/ai/` - Faction AI decision systems
- Integration with world manager and battle system

### **TODO #13 - Combat UI/HUD & Input** [PRIORITY 4]
**Goal**: Professional tactical combat interface

**Implementation Order:**
1. Selection and command systems
2. Overlay rendering (LOS, range, formations)
3. HUD components and squad cards
4. Context menu and action builder
5. Combat log integration
6. Replay controls

**Key Deliverables:**
- `src/features/battle/ui/` - Complete combat UI system
- Professional HUD with squad management
- Overlay system for tactical information

## 🎯 **PHASE 3: Advanced Systems (Weeks 8-12)**

### **TODO #18 - Named Recruit Registry** [PRIORITY 5]
**Goal**: Deterministic recruit discovery and hiring system

### **TODO #15 - Tests, Benchmarks & CI** [PRIORITY 6]  
**Goal**: Quality gates and performance monitoring

### **TODO #17 - Voice Asset Registry** [PRIORITY 7]
**Goal**: AI TTS integration for PWA deployment

## 📋 **Development Principles**

### **OSRI (Open Source Research & Integration)**
- **License Preference**: MIT/Apache-2.0 > MPL-2.0/LGPL > Avoid GPL/AGPL
- **Attribution**: Maintain CREDITS.md and THIRD-PARTY-LICENSES.txt
- **Integration**: Wrap external code behind clean interfaces
- **Security**: Audit dependencies and pin versions

### **Quality Standards**
- **TypeScript Strict Mode**: Full type safety across all systems
- **Deterministic Systems**: Seeded RNG for replays and AI parity
- **Performance Targets**: <0.05ms for derived stats, <200ms for TTS
- **Test Coverage**: Unit tests for all core systems
- **Save Compatibility**: Backward migration support

### **Architecture Patterns**
- **Modular Features**: Each system in `src/features/` with clean exports
- **Event-Driven**: Central event bus for system communication  
- **State Management**: Zustand with feature-specific hooks
- **Asset Management**: Lazy loading with fallback systems

## 🚀 **Getting Started**

**Next Immediate Action**: Begin TODO #14 implementation
1. Design schema v3 interfaces in `src/core/saves/`
2. Implement migration system for existing saves
3. Add hash verification for save integrity
4. Create OPFS backend for PWA persistence

**Success Metrics**:
- All existing saves migrate successfully to v3
- Hash verification prevents corrupted saves
- Replay system maintains deterministic behavior
- Foundation ready for character creator integration

This roadmap builds systematically from persistence foundations through strategic gameplay, ensuring each system has proper data integrity and integration points for the complete hybrid strategy RPG vision.