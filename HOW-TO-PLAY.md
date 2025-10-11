# 🎮 How to Play - Theta Version

## Quick Start

### 1. Start the Game
```powershell
npm start
```
Opens at: http://localhost:3000

### 2. Navigate to Campaign
- Click **"Integrated Campaign"** from the main menu
- If you don't have characters, click **"Create Character"** first

### 3. Explore the World
- Use the **directional arrows** (↖️ ⬆️ ↗️ ⬅️ ➡️ ↙️ ⬇️ ↘️) to move
- Each move advances 1 day
- Watch for **biome discoveries**: Ocean, Mountain, Tundra, Desert, Grass, Forest

### 4. Random Encounters
Encounters trigger randomly:
- **Base chance**: 30% per day
- **Escalates**: +5% for each day without encounter
- **Max chance**: 70%

When an encounter triggers, you'll see:
- **Encounter type**: Bandits 🗡️, Monsters 👹, Undead 💀, or Beasts 🐺
- Automatic transition to battle screen

### 5. Battle System (Interactive Simulation)

**Battle Screen Shows:**
- Your Party HP (green/yellow/red bar)
- Enemy HP (red bar)
- Turn counter
- Terrain type

**Combat Actions:**
1. **⚔️ Attack!** - Deal damage to enemy, enemy attacks back
   - Your damage: 10-30 per turn
   - Enemy damage: 5-20 per turn
   - Battle ends when either side reaches 0 HP

2. **🎊 Win Battle (Test)** - Instant victory (for testing)
3. **💀 Lose Battle (Test)** - Instant defeat (for testing)
4. **↩️ Flee** - Escape without fighting

**Auto-Resolution:**
- Battle automatically ends when HP reaches 0
- 1-second delay before returning to campaign

### 6. Battle Results

**Victory:**
- XP Gained: `100 × Party Level`
- Gold Gained: `50 × Party Level`
- HP: No change
- Returns to campaign with rewards

**Defeat:**
- XP: 0
- Gold Lost: `20% of current gold`
- HP: Reduced to 50%
- Returns to campaign wounded

**Flee:**
- No rewards, no penalties
- Immediately return to campaign

### 7. Campaign Progression
- **View Tabs**: Switch between World, Party, Factions
- **Party Status**: Check HP, MP, gold, equipment
- **Faction AI**: Watch kingdoms compete in background
- **Weather/Seasons**: Changes affect world state

## Controls Summary

| Action | Control |
|--------|---------|
| Move | Arrow buttons in World view |
| Advance Day | "Next Day" button |
| Attack in Battle | "⚔️ Attack!" button |
| Flee Battle | "↩️ Flee" button |
| Change View | Tabs at top |
| Return to Menu | "← Menu" button |

## Tips for Playing

### Exploring
- **Explore systematically** to discover all biomes
- **Track explored tiles** (shown in bottom of World view)
- **Avoid getting lost** - position shown at top

### Combat
- **Watch HP bars** - retreat before you die
- **Turn count matters** - longer battles are riskier
- **Party level affects rewards** - level up for better loot

### Resource Management
- **Gold is finite** - losing battles costs gold
- **HP persists** - rest doesn't fully heal yet
- **Plan encounters** - can't always flee successfully

## Known Limitations (Theta Version)

### What Works
✅ Overworld exploration with procedural terrain  
✅ Random encounter system  
✅ Interactive combat simulation  
✅ HP/XP/Gold persistence  
✅ Day/season/weather progression  
✅ Party status tracking  

### What's Coming Next
⏳ **Full tactical battles** (Canvas 14 hex combat)  
⏳ **Multiple party members** (currently simulated)  
⏳ **Abilities and spells** in combat  
⏳ **Loot items** from victories  
⏳ **Level-up system** (XP tracked but not applied yet)  
⏳ **Permadeath options**  
⏳ **Save/Load campaigns**  

### Current Simplifications
- Combat is simplified (no abilities, positioning, etc.)
- Party treated as single unit
- No equipment drops
- Fixed enemy stats
- Limited enemy variety (4 types)

## Troubleshooting

### Game Won't Start
```powershell
# Clean install
rm -r node_modules, package-lock.json
npm install
npm start
```

### Battles Not Triggering
- Encounters are random (30-70% chance)
- Try advancing multiple days
- Check console for encounter rolls

### Can't Create Characters
- Navigate to "Character Create" from main menu
- Complete all required fields
- Save character before starting campaign

### HP/Gold Not Updating
- Check browser console for errors
- Battle results apply immediately after "Win/Lose"
- Flee option preserves current state

## Development Testing

### Fast Testing
```powershell
# Skip encounters, test directly
# (Use "Win/Lose" test buttons)
```

### Debug Mode
- Open browser DevTools (F12)
- Watch console for:
  - `🎲 Encounter: [Type]!` - Encounter triggered
  - `⚔️ Turn X: Player dealt Y, Enemy dealt Z` - Combat log
  - `🎊 Victory! XP: X Gold: Y` - Battle won
  - `💀 Defeat!` - Battle lost

### Testing Scenarios

**Test Victory Path:**
1. Start campaign
2. Advance days until encounter
3. Click "Attack!" repeatedly
4. Watch HP bars decrease
5. Enemy reaches 0 HP → Auto victory
6. Check XP/gold increased

**Test Defeat Path:**
1. Start campaign
2. Advance days until encounter
3. Click "Lose Battle (Test)"
4. Check HP reduced, gold reduced
5. Continue campaign wounded

**Test Exploration:**
1. Move in all directions
2. Check biome discoveries in log
3. Verify explored tiles counter increases
4. Try revisiting same location

---

## Next Steps for Development

After testing this theta version, we'll add:
1. **Canvas 14 Integration** - Real hex-based tactical combat
2. **Party System** - Multiple characters fighting together
3. **Ability System** - Skills, spells, special attacks
4. **Loot System** - Equipment drops and inventory
5. **Progression** - Level-ups and character advancement

**Current Version:** Theta Playable (Local)  
**Status:** ✅ Functional game loop working!
