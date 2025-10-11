# Tactical Battle System - User Guide

## How to Play

### Starting a Battle
1. Go to Main Menu → **⚔️ Pixi Hex Battle**
2. You'll see a 3v3 battle: Knight, Archer, Mage (blue) vs Orc, Goblin, Shaman (red)

### Basic Controls

#### Selecting Units
- **Click any hex** with a unit to select it
- **Selected unit** shows detailed stats in the right panel
- **Only player units** (blue) can be controlled

#### Moving Units
1. **Select a player unit** during UnitsTurn phase
2. **Click "🚶 Move" button** in the side panel
3. **Green hexes** appear showing where you can move
4. **Click any green hex** to move there
5. Unit is marked as "✓ Moved" and Move button disables

#### Attacking Enemies
1. **Select a player unit** during UnitsTurn phase
2. **Click "⚔️ Attack" button** in the side panel
3. **Orange hexes** appear on enemies within range
4. **Click any orange hex** to attack that enemy
5. Damage is dealt, combat log updates
6. Unit is marked as "✓ Acted" and Attack button disables

#### Canceling Actions
- If you're in Move or Attack mode and change your mind:
  - **Click "✕ Cancel" button** to return to select mode
  - No action is taken, you can choose something else

#### Ending Unit Turn
- When done with a unit's actions:
  - **Click "⏭️ End Unit Turn" button**
  - Unit is marked as moved+acted
  - Select another unit to continue

### Turn Structure

#### Phase Cycle
The battle proceeds in phases:
1. **HeroTurn**: Commander abilities (not yet implemented)
2. **UnitsTurn**: Your turn - move and attack with your units
3. **EnemyTurn**: Enemy turn (AI not yet implemented - manual advance)

#### Advancing Phases
- **Click "Next Phase" button** in the header to advance
- When returning to UnitsTurn, all units reset their actions
- **Turn counter** increments when returning to HeroTurn

### Unit Information

#### Stats Display
When a unit is selected, the side panel shows:
- **Name & Class**: e.g., "Knight • Level 5"
- **HP**: Current/Max health points
- **Position**: Hex coordinates (q, r)
- **Move**: Movement range in hexes
- **Range**: Attack range in hexes
- **Status**: "○ Can Move" / "✓ Moved", "○ Can Act" / "✓ Acted"

#### Unit List
The side panel shows all units in battle:
- **Blue (Player)**: Your units
- **Red (Enemy)**: Enemy units
- **Names & HP**: Quick overview of all combatants

### Visual Indicators

#### Hex Colors
- **Dark Gray**: Normal terrain
- **Light Gray**: Hovered hex (mouse over)
- **Bright**: Selected hex
- **Green**: Valid movement destinations
- **Orange**: Valid attack targets

#### Unit Markers
- **Blue Circles**: Player units
- **Red Circles**: Enemy units
- **HP Bars**: Green → Yellow → Red based on health
- **Unit Names**: Labels on each unit

### Combat System

#### Damage Calculation
```
Base Damage = Attacker.ATK - (Defender.DEF × 0.5)
Minimum Damage = 1
```

#### Unit Death
- When HP reaches 0, unit is marked as dead
- Combat log records: "X has fallen!"
- Dead units removed from play

#### Combat Log
The side panel shows recent actions:
- "Knight attacks Orc Warrior for 12 damage!"
- "Orc Warrior has fallen!"

### Tips & Strategies

#### Movement Tips
- **Knights**: Short range (3 hexes), good for frontline
- **Archers**: Long range (4 hexes), position for flanking
- **Mages**: Medium range (3 hexes), but fragile - keep safe

#### Combat Tips
- **Archers have 4 range**: Can attack from safety
- **Knights have 1 range**: Must be adjacent to attack
- **Mages have 3 range**: Balance of mobility and reach

#### Turn Management
- Move fragile units (Archer, Mage) first to safety
- Use tanky units (Knight) to block enemies
- Focus fire: Multiple units on one enemy
- Save one unit to finish wounded enemies

### Debug Controls

#### HP Adjustment
- **-20 HP**: Quick damage for testing
- **+25 HP**: Heal or revive dead units
- These bypass normal rules for testing

#### Reset Battle
- **"Reset Battle" button**: Restart with fresh 3v3 setup
- All units restored to full HP and starting positions

### Keyboard Shortcuts (Future)
Coming soon:
- **1-9**: Select abilities
- **Space**: End turn
- **Esc**: Cancel action
- **Q/E**: Rotate unit facing

## Known Limitations

### Not Yet Implemented
- ⏸️ Abilities/spells (only basic attacks)
- ⏸️ Enemy AI (manual phase advance)
- ⏸️ Victory/defeat detection
- ⏸️ Attack animations
- ⏸️ Path visualization
- ⏸️ Status effects
- ⏸️ Commander abilities
- ⏸️ Morale system

### Current State
- ✅ Unit selection
- ✅ Movement with pathfinding
- ✅ Attack targeting
- ✅ Combat resolution
- ✅ Turn-based restrictions
- ✅ Visual highlighting
- ✅ Combat log

## Troubleshooting

### Unit Won't Move
- Check if unit already moved this turn (✓ Moved)
- Ensure you're in UnitsTurn phase
- Verify hex is within movement range (green)
- Check if path is blocked by other units

### Can't Attack
- Check if unit already attacked this turn (✓ Acted)
- Ensure enemy is within range (orange hex)
- Verify you selected a player unit (blue)
- Confirm you're in UnitsTurn phase

### Buttons Disabled
- **Move disabled**: Unit already moved or not your turn
- **Attack disabled**: Unit already acted or not your turn
- **End Turn disabled**: Not your unit selected

### Highlighting Not Showing
- Click unit first to select it
- Then click Move or Attack button
- Cancel and try again if stuck

## Performance

### Recommended Setup
- Modern browser (Chrome, Firefox, Edge)
- 60 FPS maintained with 6 units
- GPU acceleration enabled
- Hardware mouse acceleration on

### Known Issues
- None currently reported
- Hex highlighting may flicker on slow machines

## Feedback & Reporting

### What Works Well
- Smooth 60 FPS rendering
- Intuitive click-to-move interface
- Clear visual feedback
- Responsive button states

### Areas for Improvement
- Add path visualization (show route before moving)
- Animate unit movement (slide to destination)
- Show attack radius on selection
- Add sound effects
- Implement keyboard shortcuts

---

**Version**: 1.0.0-tactical  
**Last Updated**: Current session  
**Status**: ✅ Fully functional core features
