# Brigandine-Style Hex Tactical Battle System

## 🎯 Overview

**New Feature**: Professional Brigandine-inspired hex-based tactical combat system fully integrated into World Engine!

**Access**: Main Menu → 🏰 **Brigandine Hex Battle**

## ✨ Features

### Core Mechanics (Brigandine-Inspired)
- **Hex Grid**: Pointy-top axial coordinates with proper hex math
- **Zone of Control (ZOC)**: Classic Brigandine "enter-but-don't-chain" mechanic
  - Units with ZOC project control into adjacent hexes
  - Enemies can enter ZOC hexes but cannot move further without disengaging
  - Prevents chain movement through enemy lines
- **Terrain Effects**:
  - Plains (move 1, def 0) - Open ground
  - Forest (move 2, def +1, blocks LOS) - Cover and concealment
  - Hills (move 2, def +1) - High ground advantage
  - Mountain (impassable, def +2) - Terrain barriers
  - Water (move 3, def -1) - Difficult terrain
  - Ruins (move 1, def +2, blocks LOS) - Defensive structures
- **Roads**: Reduce movement cost by 1 (minimum 1)
- **Elevation**: Simple 4-level elevation system (visual indicators)
- **Initiative System**: Speed-based turn order, recalculated each round
- **Action Points (AP)**: 2 AP per round for movement and attacks

### Combat System (M&M-Inspired)
- **Dice-Based Combat**: d20 attack/defense rolls with modifiers
- **Damage Rolls**: 1d8 + (ATK×0.5) - (DEF×0.25)
- **Terrain Defense**: Bonuses from Forest (+1), Hills (+1), Ruins (+2)
- **Line of Sight (LOS)**:
  - Ranged units (range ≥2) require clear LOS
  - Blocked by units, forests, mountains, ruins
  - Flyers ignore terrain LOS blocking
  - Visual LOS preview lines (green = clear, red = blocked)
- **Movement Range**:
  - BFS pathfinding with terrain costs
  - Visual preview of reachable hexes
  - Path reconstruction from destination to origin

### World Engine Integration
- **Archetypes**: Knight, Ranger, Chanter, Mystic, Guardian, Corsair
- **Species Support**: Ready for Human, Sylvanborn, Nightborn, Stormcaller integration
- **Unit Stats**: HP, AP, Move, Range, ATK, DEF, Speed
- **Special Abilities**: Flyer flag for units (ignores terrain costs/blocks)

## 🎮 How to Play

### Starting a Battle
1. Go to Main Menu
2. Click **🏰 Brigandine Hex Battle**
3. Battle starts with 2v2 skirmish (Blue vs Red teams)

### Controls
**Move Mode** (📍):
- Click a unit to select it
- Click a highlighted hex to move there
- Movement costs AP (1 AP per move action)

**Attack Mode** (⚔️):
- Select your unit
- Click enemy unit to attack
- Must be within range (1 = melee, 3 = ranged)
- Ranged attacks require clear LOS
- Attack costs AP (1 AP per attack)

**End Turn** (⏭️):
- Ends current unit's turn
- Next unit in initiative order activates
- Round advances when all units have acted

### UI Controls
- **Grid**: Toggle hex grid outlines (ON/OFF)
- **LOS**: Toggle line-of-sight preview lines (ON/OFF)
- **Reset**: Generate new 2v2 battle with current settings
- **Hex Size**: Slider to adjust hex display size (20-48)
- **Seed**: Change seed for different terrain layouts
- **Radius**: Adjust map size (4-10 hexes from center)
- **Regenerate Terrain**: Keep units, regenerate map only

## 🧪 Default Units

### Blue Team (Player)
1. **Sir Aldric** (Knight)
   - HP: 32 | Move: 4 | Range: 1 (melee)
   - ATK: 9 | DEF: 6 | Speed: 7
   - **ZOC**: Yes (projects zone of control)
   
2. **Lyra Windshot** (Ranger)
   - HP: 22 | Move: 5 | Range: 3 (ranged)
   - ATK: 6 | DEF: 3 | Speed: 9
   - **ZOC**: No (fast skirmisher)

### Red Team (Enemy)
1. **Grimlok** (Knight)
   - HP: 20 | Move: 4 | Range: 1 (melee)
   - ATK: 7 | DEF: 3 | Speed: 6
   - **ZOC**: Yes
   
2. **Zix Shadowdart** (Corsair)
   - HP: 16 | Move: 6 | Range: 3 (ranged)
   - ATK: 5 | DEF: 2 | Speed: 10
   - **ZOC**: No | **Flyer**: Yes (ignores terrain)

## 🎨 Visual Design

### Theme
- **Dark Parchment**: Authentic medieval strategy game aesthetic
- **Serif Fonts**: Georgia for readable fantasy feel
- **Color-Coded Terrain**: Each terrain type has distinct color
- **Team Colors**: Blue (#60a5fa) vs Red (#f87171)
- **Selection Indicators**:
  - Purple ring: Selected unit
  - Yellow dashed ring: Active unit (current turn)
  - Hex highlight: Selected tile

### UI Layout
- **Left Panel (Main)**: SVG hex battle map (72vh height)
- **Right Panel (380px)**: Controls, unit info, combat log
  - Battle Controls card
  - Selected Unit stats card
  - Combat Log card (scrollable)
  - Feature info card

## 🔧 Technical Details

### Hex Coordinate System
- **Type**: Axial (q, r) coordinates
- **Layout**: Pointy-top hexes
- **Math**: Cube coordinates (x, y, z where x+y+z=0) for distance calculations
- **Distance**: `(|dq| + |dr| + |ds|) / 2`

### Pathfinding Algorithm
- **Algorithm**: Breadth-First Search (BFS) with terrain costs
- **Cost Calculation**: Base terrain cost - road bonus
- **ZOC Handling**: Units can enter enemy ZOC but cannot expand search further
- **Occupancy**: Cannot enter tiles with other units (except starting position)

### Procedural Map Generation
- **Algorithm**: Seeded noise-based terrain generation
- **Seed**: String hashed to 32-bit integer (mulberry32 RNG)
- **Biomes**: Noise thresholds determine terrain types
- **Elevation**: Secondary noise layer for elevation bands
- **Roads**: Generated via noise + terrain compatibility checks

### Combat Resolution
```typescript
Attack Roll: 1d20 + attacker.atk
Defense Roll: 1d20 + defender.def + terrain.defense
Hit: Attack Roll ≥ Defense Roll
Damage: 1d8 + (atk × 0.5) - (def × 0.25), minimum 1
```

## 🚀 Future Enhancements

### Phase 1 (Integration)
- [ ] Connect to strategic layer (territories → battles)
- [ ] Use actual player characters/party
- [ ] Load enemies from encounter system
- [ ] Battle rewards and loot system
- [ ] Unit permadeath and revival costs

### Phase 2 (Depth)
- [ ] Commander abilities (Rally, Meteor Strike, etc.)
- [ ] Status effects (Stun, Poison, Burn, etc.)
- [ ] Morale system integration (TODO #10)
- [ ] Weather effects (Rain, Snow, Fog)
- [ ] True elevation system (height-based combat modifiers)

### Phase 3 (Polish)
- [ ] Unit portraits from character system
- [ ] Combat animations
- [ ] Sound effects
- [ ] Victory/defeat screens with aftermath
- [ ] Battle replay system

### Phase 4 (Advanced)
- [ ] Multi-tile AOE (cones, lines, blasts)
- [ ] Formation bonuses
- [ ] Cavalry charges
- [ ] Siege weapons
- [ ] Dynamic objectives (escort, defend, capture)

## 📝 Development Notes

### Code Architecture
- **Single File**: `BrigandineHexBattle.tsx` (self-contained)
- **No External Dependencies**: Uses inline styling, no shadcn/ui needed
- **Pure React**: useState, useMemo, useCallback, useRef
- **TypeScript**: Fully typed with strict mode
- **SVG Rendering**: Crisp hex outlines and unit graphics

### Performance
- **Memoization**: Heavy use of useMemo for expensive calculations
- **Cached Hex Points**: Polygon points pre-calculated
- **Efficient Pathfinding**: Early termination when max movement reached
- **Minimal Re-renders**: Strategic state updates

### Integration Points
```typescript
// Export from battle feature
export { default as BrigandineHexBattle } from './BrigandineHexBattle';

// Import in app
import { BrigandineHexBattle } from "../features/battle";

// Route in App.tsx
{step === "brigandineHex" && (
  <BrigandineHexBattle onBack={() => setStep("menu")} />
)}
```

## 🎯 Design Goals Achieved

✅ **Brigandine Feel**: ZOC, terrain defense, initiative order  
✅ **M&M Inspiration**: Dice-based combat, paneled UI, grid toggles  
✅ **World Engine Integration**: Archetypes, species-ready, clean API  
✅ **Professional Polish**: Dark parchment theme, readable fonts, smooth UX  
✅ **Prototype Speed**: Single-file, no external dependencies, instant preview  

## 📚 Resources

- **File**: `src/features/battle/BrigandineHexBattle.tsx`
- **Commit**: `e0889b6` - feat: add Brigandine-style hex tactical battle system
- **Branch**: `copilot/fix-battle-hex-tests`
- **Documentation**: This file (BRIGANDINE-HEX-BATTLE.md)

## 🐛 Known Issues

None currently! The system is fully functional and ready for testing.

## 💡 Tips for Testing

1. **Test ZOC**: Move adjacent to enemy knight, try to chain movement
2. **Test Terrain**: Attack from forest/ruins for defense bonus
3. **Test LOS**: Position units behind forests, check LOS preview
4. **Test Pathfinding**: Move around mountains, through roads
5. **Test Flyers**: Use Zix Shadowdart to ignore terrain
6. **Test Initiative**: Note speed-based turn order
7. **Regenerate Maps**: Try different seeds and radii

---

**Enjoy the tactical battles!** 🎮⚔️🏰
