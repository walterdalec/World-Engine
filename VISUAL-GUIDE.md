# 🎯 Quick Play Guide - Visual Reference

## Game Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                       MAIN MENU                             │
│  [Character Create] [Integrated Campaign] [Other Features]  │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                   INTEGRATED CAMPAIGN                        │
│  Day: 5 • Spring • Clear                    Gold: 500        │
├─────────────────────────────────────────────────────────────┤
│  Tabs: [World] [Party] [Factions]                          │
│                                                             │
│  🗺️ WORLD MAP                                              │
│  Position: (2, 3)                                          │
│                                                             │
│     ↖️  ⬆️  ↗️                                              │
│     ⬅️  📍  ➡️     ← Click to explore                      │
│     ↙️  ⬇️  ↘️                                              │
│                                                             │
│  Explored: 12 tiles                                        │
│                                                             │
│  [Next Day] ← Advance time                                 │
└─────────────────────────────────────────────────────────────┘
                              ↓ (30-70% chance)
┌─────────────────────────────────────────────────────────────┐
│                   🎲 RANDOM ENCOUNTER                       │
│  "Encounter: Bandits!"                                      │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                   ⚔️ TACTICAL BATTLE                        │
│  Turn: 3 • Forest • Party Level: 5                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│       🛡️                  ⚔️                  🗡️            │
│    Your Party                            Bandits            │
│                                                             │
│   HP: 75/100          VS              HP: 45/100           │
│  ████████░░  75%                    ████░░░░░░  45%        │
│                                                             │
│              [⚔️ Attack!] ← Click to fight                 │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  Quick Test Controls:                                      │
│  [🎊 Win Battle] [💀 Lose Battle] [↩️ Flee]               │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                   🎊 VICTORY!                               │
│  Gained 500 XP • Gained 250 Gold                           │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│            BACK TO CAMPAIGN (with rewards)                  │
│  Day: 5 • Spring • Clear         Gold: 750 (+250!)         │
└─────────────────────────────────────────────────────────────┘
```

## Screen Reference

### 1. Campaign Screen (World View)
```
╔═══════════════════════════════════════════════════════════╗
║ 🌍 Integrated Campaign          Day 5 • Spring • Clear    ║
║ Position: (2,3)                 Party: 3 members  💰 500  ║
╠═══════════════════════════════════════════════════════════╣
║                                                           ║
║  📍 = Current Position                                    ║
║  ⬆️⬇️⬅️➡️ = Directional Movement                           ║
║  🌲 = Forest    🏔️ = Mountain    🌊 = Ocean              ║
║  🏜️ = Desert    ❄️ = Tundra      🌿 = Grassland          ║
║                                                           ║
║  [Next Day] - Advance time, chance for encounter         ║
║                                                           ║
╠═══════════════════════════════════════════════════════════╣
║ Activity Log:                                             ║
║ [Day 5] 🗺️ Discovered Forest at (2, 3)                   ║
║ [Day 4] 🎲 Encounter: Bandits!                            ║
║ [Day 4] ⚔️ Victory! Gained 500 XP and 250 gold           ║
║ [Day 3] 🌿 Peaceful travel, party rests                   ║
╚═══════════════════════════════════════════════════════════╝
```

### 2. Battle Screen (Interactive Combat)
```
╔═══════════════════════════════════════════════════════════╗
║ ⚔️ Tactical Battle: Bandits                               ║
║ Turn: 3 • Forest • Party Level: 5                        ║
╠═══════════════════════════════════════════════════════════╣
║                                                           ║
║        🛡️              ⚔️              🗡️                 ║
║    Your Party                      Bandits                ║
║                                                           ║
║  ┌──────────────┐                ┌──────────────┐        ║
║  │ HP: 75/100   │      VS        │ HP: 45/100   │        ║
║  │ ████████░░░░ │                │ ████░░░░░░░░ │        ║
║  │    75%       │                │    45%       │        ║
║  └──────────────┘                └──────────────┘        ║
║                                                           ║
║                 [⚔️ Attack!]                              ║
║              Deal 10-30 damage                            ║
║              Take 5-20 damage                             ║
║                                                           ║
╠═══════════════════════════════════════════════════════════╣
║ Quick Test (Development Only):                           ║
║  [🎊 Win Battle] [💀 Lose Battle] [↩️ Flee]              ║
╚═══════════════════════════════════════════════════════════╝
```

## Combat Mechanics

### Damage Calculation
```
Player Attack:  10-30 damage (random)
Enemy Attack:    5-20 damage (random)
```

### HP Bar Colors
```
Green  ████████░░  > 50% HP  (Healthy)
Yellow ███░░░░░░░  25-50% HP (Wounded)
Red    █░░░░░░░░░  < 25% HP  (Critical)
```

### Battle Resolution
```
Victory:  Enemy HP = 0
  → Gain XP  (100 × Party Level)
  → Gain Gold (50 × Party Level)
  → Return to Campaign

Defeat:   Player HP = 0
  → Lose 20% Gold
  → Reduce HP to 50%
  → Return to Campaign

Flee:     Manual Exit
  → No rewards
  → No penalties
  → Return to Campaign
```

## Encounter Types & Icons

```
🗡️ Bandits    → Forest biome    → Human enemies
👹 Monsters   → Swamp biome     → Beast enemies
💀 Undead     → Graveyard biome → Undead enemies
🐺 Beasts     → Grassland biome → Animal enemies
```

## Quick Actions Reference

| Icon | Action | Where | Effect |
|------|--------|-------|--------|
| ↖️⬆️↗️⬅️➡️↙️⬇️↘️ | Move | World Map | Explore +1 tile, advance day |
| 📍 | Current Position | World Map | Shows your location |
| ⚔️ | Attack | Battle | Deal damage, take damage |
| 🎊 | Test Win | Battle | Instant victory (testing) |
| 💀 | Test Lose | Battle | Instant defeat (testing) |
| ↩️ | Flee | Battle | Escape without fighting |
| 🛡️ | Party | Battle | Your side indicator |
| 🗡️👹💀🐺 | Enemy Type | Battle | Shows encounter type |

## Pro Tips

### 💡 Exploration Strategy
- Explore in a spiral pattern to cover more area
- Track biomes to find rare encounters
- Return to base position if HP is low

### 💡 Combat Strategy
- Watch HP bars carefully
- Flee if HP drops below 30%
- Use test buttons to practice mechanics

### 💡 Resource Management
- Save gold for emergencies
- Don't fight when wounded
- Rest between encounters (auto-heal pending)

### 💡 Development Testing
- Use Win/Lose buttons to test flows quickly
- Check console (F12) for combat logs
- Try different encounter types

## Known Shortcuts (Testing)

```powershell
# F12 in browser opens DevTools
# Console shows:
🎲 Encounter: [Type]!           # Encounter triggered
⚔️ Turn X: Player dealt Y...    # Combat damage
🎊 Victory! XP: X Gold: Y       # Battle won
💀 Defeat!                       # Battle lost
```

---

**Ready to Play?**  
1. Open http://localhost:3000
2. Navigate to Integrated Campaign
3. Start exploring!

The game loop is complete and functional! 🎮✨
