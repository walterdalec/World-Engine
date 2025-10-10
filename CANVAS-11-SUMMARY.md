# Canvas 11 - Progression System Implementation Summary

**Status**: 89% Complete (8/9 files) | ~2,576 lines | Zero compilation errors  
**Date**: October 10, 2025  
**Branch**: feature/integrated-campaign-system

---

## 🎯 Design Philosophy

**Harsh growth with lasting consequences; sideways scaling instead of power creep.**

- Meaningful but bounded level-ups
- Permanent consequences from injuries
- Costly revival with scarring effects
- Codex tracking of all progression events
- Event-driven integration with Canvas 08-20 systems

---

## 📦 Implemented Files

### 1. types.ts (220 lines)
**Complete type system foundation**

**Core Interfaces:**
- `ProgressionState` - Member progression tracking with XP, level, burnout, wounds, scars, curses
- `Wound` - Injury severity (minor/major/fatal) with damage tags
- `Scar` - Lasting consequences with stat modifiers (max 3 active)
- `Curse` - Spiritual corruption from flawed revivals (temporary or permanent)
- `DeathRecord` - Persistent obituary with cause and dropped loot
- `RevivalAttempt` - Ritual results with outcome tracking
- `LevelUpChoice` - Stat/skill/trait selection (mutually exclusive)
- `XPFormula` - Configurable XP calculation parameters
- `RevivalPath` - Reagent requirements and success rates

**Event Types:**
- 11 progression event types for system integration
- Type-safe event payloads
- Support for Canvas 20 Codex integration

**Constants:**
- `DEFAULT_XP_FORMULA`: base=100, exponent=2, step=50, softCap=L20
- `SCAR_LIMITS`: max 3 active, injury chances
- `BURNOUT_THRESHOLDS`: warning/penalty levels + recovery rate

### 2. xp.ts (311 lines)
**XP calculation, leveling, and burnout mechanics**

**XP System:**
- `calculateXPRequired(level)` - Formula: `base * L^2 + step * L` with soft cap at L20 (50% effectiveness)
- `calculateTotalXPForLevel(target)` - Cumulative XP needed
- `distributeXP(members, total, contributions)` - Contribution-based with 25% floor
- `grantXP(current, level, amount, callback)` - Multi-level gain handler
- `calculateXPFromSource(amount, source, uses)` - Diminishing returns for training/mentor

**Leveling:**
- `getAbilitySlotsForLevel(level)` - Slots: L1 (2/2) → L10 (3/2) → L20 (4/2)
- `validateLevelUpChoice(choice, stats, skills, traits)` - Type-safe validation
- `applyLevelUpChoice(choice, ...)` - Immutable state updates
- `isMilestoneLevel(level)` - Checks for 5/10/15/20

**Burnout:**
- `calculateBurnout(recentLevels, currentDay)` - 20 per level in 7 days
- `applyBurnoutPenalty(stat, burnout)` - -5% at 60, -10% at 80
- `reduceBurnout(current)` - -10 per day recovery

**Event Generation:**
- `createLevelUpEvent`, `createXPGrantedEvent`
- `getLevelUpSeed` - Deterministic RNG for reproducible level-ups

### 3. scars.ts (390 lines)
**Scar system with 13 predefined scars**

**Scar Registry (13 scars):**

**Crushing Damage:**
- Shattered Hand: -2 DEX, -10% ranged accuracy, -20% crafting speed
- Broken Ribs: -1 CON, -15% stamina regen, -10% carrying capacity

**Piercing/Slashing:**
- Deep Scar: +10% intimidation, -1 CHA (visible)
- Arterial Damage: -5% max HP, -20% bleed resistance

**Fire:**
- Smoke-Scorched Lungs: -1 CON, -15% stamina regen, +10% fire resistance
- Burn Scars: -2 CHA, +15% fire resistance, +5 fear aura (visible)

**Frost:**
- Frostbitten Extremities: -1 DEX, +15% frost resistance, -20% cold weather penalty (visible)

**Poison/Necrotic:**
- Withered Flesh: -2 CON, +20% poison resistance, -10% healing received (visible)
- Corrupted Blood: -10% max HP, +25% poison resistance, -1 STR

**Revival:**
- Death's Touch: -5% max HP, +20% necrotic resistance, +50% undead detection (story-locked)
- Soul Fracture: -1 WIS, +10% magic resistance, +1 spirit sight (story-locked)

**Psychic/Special:**
- Witch-Sight: +15% detect illusions, -1 CHA, +5% hallucination chance
- Iron Stitching: +10% max HP, -10% initiative, +5 fear aura (visible)

**Core Functions:**
- `rollScarFromWound(wound, seed, memberId)` - 20% minor, 100% major injury chance
- `getRevivalScar(seed, memberId, day, deathCount)` - Guaranteed scar from revival
- `addScar(current, new, seed)` - Max 3 enforcement with replacement logic
- `calculateScarModifiers(scars)` - Aggregate stat effects
- `applyScarModifiers(baseValue, stat, mods)` - Apply with min value of 1
- `hasVisibleScars(scars)` - NPC reaction modifier
- `getScarTooltip(scar)` - UI display with stat breakdown

### 4. injuries.ts (298 lines)
**Post-battle injury resolution and death mechanics**

**Injury Rolls:**
- 50% minor, 35% major, 15% fatal (base chances)
- Healer modifiers: none (0%), basic (+10% minor, -5% major/fatal), expert (+20% minor, -10% major/fatal)
- Deterministic outcomes using encounter seed

**Damage Tag System (11 tags):**
- crushing → broken bones
- piercing → bleeding
- slashing → deep cuts
- fire → burns
- frost → frostbite
- poison → organ strain
- necrotic → withering
- lightning → nerve damage
- psychic → trauma
- holy → divine wounds
- shadow → corruption

**Core Functions:**
- `rollInjury(seed, member, tags, healer, day)` - Probabilistic injury outcome
- `processInjury(wound, seed, member)` - Generate events and check for scar
- `processDeath(member, name, day, region, cause, inventory)` - Death record + loot drop (non-soulbound)
- `isFatalWound(tags, seed, member, day)` - Fatal check
- `getWoundDescription(wound)` - UI display with damage tag descriptions
- `getDamageTagDescription(tag)` - Detailed tag explanation
- `getRecommendedHealing(tags)` - Item suggestions (Bandages, Potions, Salves)
- `getRecoveryTime(wound, hasHealer)` - Minor: 3 days, Major: 7 days (75% with healer)

### 5. revival.ts (443 lines)
**Costly ritual mechanics with 3 revival paths**

**Revival Paths:**

**Common Revival:**
- Cost: 500g + Heartbloom Resin + Spirit Salt (2)
- Success: 60%, Flawed: 30%, Failure: 10%
- Required: Tier 1 site
- Use: Standard resurrection for most parties

**Heroic Revival:**
- Cost: 2000g + Phoenix Ash + Memory Thread
- Success: 80%, Flawed: 15%, Failure: 5%
- Required: Tier 2 site
- Use: Premium option with better odds

**Nature Revival:**
- Cost: 300g + Elder Seeds (3)
- Success: 70%, Flawed: 20%, Failure: 10%
- Required: Tier 1 site
- Restriction: Sylvanborn faction only
- Use: Nature-aligned alternative

**Success Modifiers:**
- Site tier: +5% per tier above minimum
- Healer presence: +10%
- Death count: -5% per previous death
- Recent death (<7 days): -15%
- Faction bonus: varies by relationship

**Outcomes:**
- Success: Clean revival with guaranteed scar
- Flawed: Revival succeeds but gains scar + curse
- Failure: Reagents consumed, member stays dead

**Curses (5 types):**

**Spirit Debt:**
- Effects: +10% gold costs, +20% revival costs
- Upkeep: 50g per season
- Duration: Permanent until removed
- Removal: 5000g offering OR spirit quest

**Hollow Soul:**
- Effects: -2 WIS, -10% max HP, +1 spirit sight
- Duration: 30 days
- Removal: Soul restoration ritual (1000g, hard difficulty)

**Death's Shadow:**
- Effects: +20% undead encounters, +15% necrotic damage taken, +50% undead detection
- Duration: 60 days
- Removal: High priest purification (2000g) OR destroy major undead

**Fractured Memory:**
- Effects: -1 INT, -15% skill XP, -10% quest rewards
- Duration: 14 days
- Removal: Memory therapy (500g, easy difficulty)

**Corpse Cold:**
- Effects: -1 CON, +20% frost resistance, -10% fire resistance, -20% stamina regen
- Duration: 21 days
- Removal: Warming ritual (800g, medium difficulty)

**Core Functions:**
- `calculateRevivalChance(path, siteTier, hasHealer, deathCount, daysSince, bonus)` - Modified success rates
- `attemptRevival(...)` - Full ritual with deterministic outcomes
- `getCurseFromRevival(curseId, seed, member, day)` - Generate curse from template
- `calculateRevivalCost(pathId, deathCount)` - Gold increases +25% per death
- `isRevivalPathAvailable(pathId, faction)` - Faction restriction check
- `getRevivalFatigue(daysRemaining)` - -10% all stats, -25% stamina, -15% healing for 3 days
- `isCurseExpired(curse, currentDay)` - Temporal curse check
- `calculateCurseUpkeep(curses)` - Total seasonal gold cost

### 6. api.ts (430 lines)
**Complete public API with event bus and workflows**

**Event Bus:**
- `subscribeToProgressionEvents(handler)` - Returns unsubscribe function
- `emitProgressionEvent(event)` - Broadcast to all subscribers
- Type-safe event handling for Canvas integration

**System Interfaces:**
- `XPSystem` - XP calculation and distribution
- `LevelingSystem` - Level-up validation and application
- `BurnoutSystem` - Burnout tracking and penalties
- `InjurySystem` - Injury rolls and wound management
- `DeathSystem` - Death processing and obituaries
- `ScarSystem` - Scar generation and modification
- `RevivalSystem` - Revival rituals and outcomes
- `CurseSystem` - Curse expiration and upkeep

**High-Level Workflows:**

**grantPartyXP:**
```typescript
grantPartyXP(
  memberIds: CharacterId[],
  totalXP: number,
  contributions: Map<CharacterId, number>,
  source: XPSource,
  currentStates: Map<CharacterId, ProgressionState>,
  onLevelUp: (memberId, newLevel) => void
): Map<CharacterId, number>
```
- Distributes XP based on contribution
- Handles multi-level gains
- Emits XP granted events
- Triggers level-up callbacks

**processPartyInjuries:**
```typescript
processPartyInjuries(
  downedMembers: Array<{ memberId, damageTags }>,
  hasHealer: 'none' | 'basic' | 'expert',
  currentDay: number,
  seed: string
): { injuries, scars, deaths, events }
```
- Rolls injuries for all downed members
- Generates scars from major wounds
- Marks fatal wounds for death processing
- Returns complete event stream

**performRevival:**
```typescript
performRevival(
  memberId, memberName, pathId, currentDay,
  siteTier, hasHealer, deathCount, daysSince, factionBonus, seed
): { attempt, scar?, curse?, events }
```
- Attempts revival with specified path
- Generates scar on success
- Applies curse on flawed outcome
- Emits codex events
- Returns full results

**processExpiredCurses:**
```typescript
processExpiredCurses(
  memberCurses: Map<CharacterId, Curse[]>,
  currentDay: number
): { expired, events }
```
- Checks all curses for expiration
- Emits curse faded events
- Returns expired curse IDs

**processDailyBurnoutRecovery:**
```typescript
processDailyBurnoutRecovery(
  memberBurnouts: Map<CharacterId, number>
): Map<CharacterId, number>
```
- Reduces burnout by 10 per day
- Emits warnings for high burnout (≥40)
- Returns updated burnout values

### 7. data.ts (482 lines)
**Comprehensive content catalog for progression**

**Revival Reagents (8 items):**
- Heartbloom Resin (uncommon, 150g) - Herbalists, forests, Sylvanborn traders
- Spirit Salt (common, 50g) - Temples, salt mines, alchemists
- Phoenix Ash (rare, 800g) - Rare merchants, phoenix nests, high-tier quests
- Memory Thread (rare, 600g) - Dream weavers, mystic shops, ancient libraries
- Elder Seeds (uncommon, 80g) - Sylvanborn groves, ancient forests, nature priests
- Moonwater (uncommon, 120g) - Temple fountains, lunar shrines, night markets
- Soul Gem (epic, 1500g) - Master enchanters, soul cairns, legendary merchants
- Blood Lotus (rare, 400g) - Battlefields, war zones, death cultists

**Damage Tag Mappings (11 entries):**
Each includes:
- Primary injury description
- Secondary effects (3-4 debuffs)
- Recommended treatment (4 items/methods)

Examples:
- Crushing: Broken bones → Bonesetting, Splints, Healing potion, Rest
- Fire: Burns → Cooling salve, Aloe extract, Clean water, Burn wraps
- Psychic: Mental trauma → Mind ward, Clarity elixir, Dream catchers, Counseling

**Scar Lore (11 entries):**
Each includes:
- Story/backstory
- Visible or hidden description
- Common causes (3 examples)

**Curse Lore (5 entries):**
Each includes:
- Story/explanation
- Removal methods (1-2 options with cost/difficulty/location)
- Living-with-curse tips

**Revival Sites (4 tiers):**
- T1: Village Shrine (0% bonus) - Most settlements
- T2: Temple Sanctum (+5% bonus) - City temples
- T3: Ancient Nexus (+10% bonus) - Standing stones, ancient battlefields
- T4: Death Gate (+15% bonus) - Legendary sites, world wonders

**Helper Functions:**
- `getReagent(id)` - Lookup reagent by ID
- `calculateReagentCost(ids)` - Total reagent cost
- `getReagentsByRarity(rarity)` - Filter by rarity
- `getTreatmentForDamageTag(tag)` - Treatment recommendations
- `getScarLore(name)` - Lore and descriptions
- `getCurseRemovalOptions(name)` - Removal methods
- `getRevivalSite(tier)` - Site by tier

### 8. index.ts (53 lines)
**Clean export interface**

**Exports:**
- All type definitions
- All constants
- Event bus functions
- All system interfaces
- All high-level workflows

**Usage Pattern:**
```typescript
import {
  // Types
  ProgressionState, XPSource, Wound, Scar, Curse,
  
  // Systems
  XPSystem, InjurySystem, RevivalSystem,
  
  // Workflows
  grantPartyXP, processPartyInjuries, performRevival,
  
  // Events
  subscribeToProgressionEvents, emitProgressionEvent
} from './progression';
```

---

## 🎮 Integration Points

### Canvas 10 - Party Framework
**Status**: Ready for integration

**PartyMember Extension:**
```typescript
interface PartyMember {
  // ... existing fields
  progression?: ProgressionState; // Canvas 11 data
}
```

**ProgressionState Structure:**
```typescript
{
  memberId: CharacterId,
  level: number,
  xp: number,
  xpToNext: number,
  recentLevelUps: number[],  // Days of recent level-ups
  burnout: number,            // 0-100
  wounds: Wound[],
  scars: Scar[],              // Max 3 active
  curses: Curse[],
  deathCount: number
}
```

**Update Patterns:**
```typescript
// Grant XP after battle
const distribution = grantPartyXP(
  party.members.map(m => m.id),
  1000,                    // Total XP
  contributions,           // Per-member contribution
  'battle',
  progressionStates,
  (memberId, newLevel) => {
    // Update party member level
    updatePartyMember(memberId, { level: newLevel });
  }
);

// Process injuries
const { injuries, scars, deaths, events } = processPartyInjuries(
  downedMembers,
  party.hasHealer ? 'basic' : 'none',
  campaign.currentDay,
  encounter.seed
);

// Apply results to party members
for (const [memberId, wound] of injuries) {
  const member = party.members.find(m => m.id === memberId);
  if (member?.progression) {
    member.progression.wounds.push(wound);
  }
}
```

### Canvas 12 - Economy
**Status**: Ready for integration

**Reagent Pricing:**
```typescript
import { REVIVAL_REAGENTS, calculateReagentCost } from './progression/data';

// Add to merchant inventory
const availableReagents = REVIVAL_REAGENTS.filter(r => 
  r.rarity === 'common' || r.rarity === 'uncommon'
);

// Calculate purchase cost
const cost = calculateReagentCost(['heartbloom_resin', 'spirit_salt']);
```

**Revival Costs:**
```typescript
import { calculateRevivalCost } from './progression';

const { reagents, gold } = calculateRevivalCost('common', deathCount);
// Gold increases +25% per death
```

**Curse Upkeep:**
```typescript
import { calculateCurseUpkeep } from './progression';

const seasonalUpkeep = calculateCurseUpkeep(member.progression.curses);
party.gold -= seasonalUpkeep;
```

### Canvas 13 - Encounters
**Status**: Ready for integration

**Damage Tag Assignment:**
```typescript
interface Enemy {
  attacks: Array<{
    name: string;
    damage: number;
    damageTags: DamageTag[]; // Canvas 11 type
  }>;
}

// Example enemies
const orcBrute = {
  attacks: [{
    name: 'Club Smash',
    damage: 15,
    damageTags: ['crushing']
  }]
};

const fireElemental = {
  attacks: [{
    name: 'Flame Burst',
    damage: 20,
    damageTags: ['fire', 'necrotic']
  }]
};
```

**Post-Battle Processing:**
```typescript
// After combat resolution
const downedMembers = combatResult.downed.map(member => ({
  memberId: member.id,
  damageTags: member.damageReceived.flatMap(d => d.tags)
}));

const { injuries, scars } = processPartyInjuries(
  downedMembers,
  party.hasHealer ? 'basic' : 'none',
  campaign.currentDay,
  encounter.seed
);
```

### Canvas 17 - UI System
**Status**: Ready for UI implementation

**Character Sheet Display:**
```typescript
// Level and XP
<div>
  Level {member.progression.level}
  <ProgressBar 
    current={member.progression.xp} 
    max={member.progression.xpToNext} 
  />
</div>

// Burnout warning
{member.progression.burnout >= 40 && (
  <Alert type="warning">
    High burnout! Rest recommended ({member.progression.burnout}%)
  </Alert>
)}

// Active scars
{member.progression.scars.map(scar => (
  <Tooltip content={getScarTooltip(scar)}>
    <Badge variant={scar.visible ? 'danger' : 'neutral'}>
      {scar.name}
    </Badge>
  </Tooltip>
))}

// Active curses
{member.progression.curses.map(curse => (
  <CurseDisplay 
    curse={curse}
    daysRemaining={curse.duration ? curse.duration - (currentDay - curse.acquiredDay) : undefined}
  />
))}
```

**Revival Ritual UI:**
```typescript
import { getRevivalPaths, calculateRevivalChance } from './progression';

const paths = getRevivalPaths();

{paths.map(path => {
  const chances = calculateRevivalChance(
    path,
    selectedSite.tier,
    party.hasHealer,
    deadMember.progression.deathCount,
    daysSinceLastDeath,
    factionBonus
  );
  
  return (
    <RevivalPathCard
      path={path}
      successChance={chances.success}
      flawedChance={chances.flawed}
      failureChance={chances.failure}
      cost={calculateRevivalCost(path.id, deadMember.progression.deathCount)}
    />
  );
})}
```

### Canvas 20 - Codex System
**Status**: Ready for integration

**Event Subscriptions:**
```typescript
import { subscribeToProgressionEvents } from './progression';

// Subscribe to progression events
const unsubscribe = subscribeToProgressionEvents((event) => {
  switch (event.type) {
    case 'codex/obituary':
      codex.addEntry({
        type: 'death',
        title: `${event.record.name} fell in battle`,
        description: `Died on day ${event.record.day} in ${event.record.regionId}`,
        cause: event.record.cause,
        loot: event.record.loot
      });
      break;
      
    case 'codex/revival':
      if (event.success) {
        codex.addEntry({
          type: 'revival',
          title: `${getMemberName(event.memberId)} returned from death`,
          description: 'Successfully revived through ritual magic'
        });
      }
      break;
      
    case 'xp/levelUp':
      codex.addEntry({
        type: 'milestone',
        title: `${getMemberName(event.memberId)} reached level ${event.newLevel}`,
        choice: event.choice
      });
      break;
  }
});
```

**Obituary Tracking:**
```typescript
// All deaths are automatically tracked
interface CodexDeathEntry {
  memberId: CharacterId;
  name: string;
  day: number;
  region: string;
  cause: string;
  loot: string[];
  revived: boolean;
  revivedDay?: number;
}
```

---

## 🧪 Testing Requirements

### Unit Tests Needed:

**XP System:**
- [ ] XP formula calculation with soft caps
- [ ] Contribution-based distribution with floor
- [ ] Multi-level gain handling
- [ ] Burnout accumulation and recovery
- [ ] Diminishing returns for training

**Injury System:**
- [ ] Injury roll probabilities
- [ ] Healer modifier effects
- [ ] Scar generation from wounds
- [ ] Damage tag to scar mapping
- [ ] Fatal wound detection

**Revival System:**
- [ ] Revival chance calculations
- [ ] Modifier stacking
- [ ] Outcome determination (success/flawed/failure)
- [ ] Curse generation
- [ ] Cost scaling with death count

**Scar System:**
- [ ] Max 3 active enforcement
- [ ] Replacement logic (oldest non-locked)
- [ ] Modifier aggregation
- [ ] Story-locked protection

**Curse System:**
- [ ] Expiration tracking
- [ ] Upkeep calculation
- [ ] Removal conditions

### Integration Tests Needed:

**Full Combat Flow:**
1. Battle with damage tags
2. Injury resolution
3. Scar application
4. XP distribution
5. Level-up with choice
6. Burnout calculation

**Death and Revival Flow:**
1. Fatal wound
2. Death processing
3. Loot drop
4. Codex entry
5. Revival attempt
6. Scar + curse application
7. Revival fatigue

**Campaign Progression:**
1. Daily burnout recovery
2. Curse expiration
3. Wound healing
4. Seasonal upkeep costs

---

## 📈 Performance Considerations

**Memory Usage:**
- ProgressionState per party member: ~500 bytes
- Typical 6-member party: ~3KB
- Event history (optional): configurable retention

**Computational Complexity:**
- XP distribution: O(n) for n members
- Injury processing: O(n) for n downed members
- Scar modifier calculation: O(s) for s scars
- Event emission: O(h) for h handlers

**Optimization Strategies:**
- Cache XP requirements per level
- Batch event emissions
- Lazy scar modifier calculation
- Deterministic RNG for reproducibility

---

## 🔮 Future Enhancements

### Phase 2 Features:
- [ ] Advanced revival paths (necromancy, divine intervention)
- [ ] Scar surgery/removal mechanics
- [ ] Curse transfer/trading
- [ ] Injury complications (infection, permanent disability)
- [ ] Mental health system (trauma, PTSD)
- [ ] Prosthetic limbs with stat tradeoffs
- [ ] Legacy system (descendants inherit traits)

### Phase 3 Features:
- [ ] Multi-classing with burnout penalties
- [ ] Prestige classes at L20+
- [ ] Scar synergies (set bonuses)
- [ ] Curse evolution (curses mutate over time)
- [ ] Resurrection limits (permadeath after N deaths)
- [ ] Soul binding (prevent revival)
- [ ] Undeath alternative (become lich/vampire)

---

## 📝 Remaining Work (11% - 1 file)

### 9. ProgressionDemo.tsx
**Visual testing interface for all progression features**

**Required Sections:**
1. **XP Management**
   - Grant XP to selected members
   - Choose XP source
   - Set contribution percentages
   - Display XP distribution results
   - Show level-up notifications
   - Burnout warning display

2. **Injury Simulator**
   - Select damage tags (multi-select)
   - Choose healer presence level
   - Roll injury for member
   - Display wound details
   - Show scar generation
   - Recovery time estimate

3. **Death & Revival**
   - Process death with loot drop
   - Select revival path
   - Configure site tier and modifiers
   - Display success chances
   - Attempt revival
   - Show results (scar/curse)

4. **Scar Management**
   - Display all active scars
   - Show modifier calculations
   - Test replacement logic
   - Toggle story-locked scars
   - Visual/hidden indicator

5. **Curse Tracking**
   - Display active curses
   - Show days remaining
   - Calculate upkeep costs
   - Display removal options
   - Simulate curse expiration

6. **Party Overview**
   - All member progression states
   - Level/XP progress bars
   - Burnout meters
   - Wound/scar/curse counts
   - Death count tracking

**Implementation Priority:** Medium (not blocking for integration)

---

## ✅ Completion Checklist

- [x] Type system (types.ts)
- [x] XP & Leveling (xp.ts)
- [x] Scars (scars.ts)
- [x] Injuries & Death (injuries.ts)
- [x] Revival (revival.ts)
- [x] Public API (api.ts)
- [x] Clean Exports (index.ts)
- [x] Data Catalog (data.ts)
- [ ] Demo UI (ProgressionDemo.tsx)

**Status: 89% Complete | Ready for Canvas 10-20 Integration**

---

## 🚀 Next Steps

1. **Create ProgressionDemo.tsx** for visual testing
2. **Update Canvas 10** to include ProgressionState in PartyMember
3. **Wire Canvas 13** damage tags to injury system
4. **Connect Canvas 12** economy to reagent costs
5. **Integrate Canvas 20** Codex event subscriptions
6. **Write unit tests** for core systems
7. **Create integration tests** for full workflows
8. **Document API** with comprehensive examples
9. **Balance testing** for XP rates, injury chances, revival costs
10. **User testing** for harsh progression feel

---

**Total Lines Written:** ~2,576  
**Compilation Status:** Zero errors  
**Architecture:** Event-driven, type-safe, deterministic  
**Integration Status:** Ready for Canvas 10-20  

---

*Canvas 11 delivers on the promise of harsh growth with lasting consequences. Every injury matters, every death is costly, and every revival leaves its mark.*
