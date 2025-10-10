# Canvas 10 - Party Framework: Implementation Summary

## ✅ Status: **COMPLETE**

Canvas 10 implements the full hero + named hirelings system with lifecycle management including hire → travel → fight → injury/death → pay/upkeep → dismissal/recruitment.

---

## 📁 Implementation Files (8 files, ~1,300 lines)

### Core Module (`src/party/`)

1. **`types.ts`** (144 lines)
   - Complete TypeScript interfaces for party system
   - BuildSpec, RecruitDef, PartyMember, PartyState
   - Morale/loyalty thresholds constants
   - Party event type definitions

2. **`api.ts`** (370 lines)
   - Public API for party management
   - Event bus integration
   - Functions: initParty, hire, dismiss, payWages, adjustMorale, processBattleResults, revive
   - Global state management with event listeners

3. **`state.ts`** (~200 lines)
   - Party state reducer and selectors
   - Functions: createPartyState, addMember, removeMember, updateMember
   - Utility functions: getAllMembers, getLivingMembers, getInjuredMembers, getLowMoraleMembers
   - Party statistics: calculateDailyUpkeep, getAverageLevel, getPartyPower

4. **`morale.ts`** (219 lines)
   - Morale and loyalty calculation system
   - Functions: adjustMorale, willDesert, isThreatening, isComplaining
   - Context-sensitive modifiers: victory, defeat, injury, death, wages, leadership
   - Morale status and emoji helpers for UI

5. **`wages.ts`** (~150 lines)
   - Upkeep tick system and debt tracking
   - Functions: payWages, calculateSeverance, getDaysWagesOverdue, getWageStatus
   - Escalating morale penalties for unpaid wages
   - Severance cost calculation based on loyalty and service time

6. **`injuries.ts`** (256 lines)
   - Post-battle injury resolution system
   - Functions: rollInjury, applyInjury, healInjury, processBattleInjuries
   - Deterministic injury rolls using seeded RNG
   - Scar generation and permanent effects
   - Revival mechanics with scaling costs

7. **`data.ts`** (247 lines)
   - Recruit definition registry (10+ templates)
   - Deterministic recruit pool generation
   - Region tier-based spawn configuration
   - Quest-locked recruits with unlock conditions

8. **`index.ts`** (~100 lines)
   - Clean public API exports
   - Type exports for integration
   - Utility function exports

---

## 🎮 Demo Page (`src/pages/PartyFrameworkDemo.tsx`)

Comprehensive testing interface with:

### Main Features
- **Party Roster Panel**: Real-time member display with morale/loyalty/status
- **Tavern Panel**: Deterministic recruit pools with detailed inspection
- **Actions Panel**: Time management, morale adjustment, combat simulation
- **Event Log**: Live party event tracking
- **Status Bar**: Gold, day, party size, daily upkeep, wage debt

### Interactive Testing
1. **Hiring System**: Click tavern recruits to view details and hire
2. **Wage Management**: Pay 1/7 day wages, accumulate debt
3. **Morale System**: Adjust morale with leadership or defeat
4. **Battle Simulation**: Easy victory, normal victory, hard defeat
5. **Injury/Death**: Test fatal wounds and revival mechanics
6. **Dismissal**: Fire members with severance calculation
7. **Day Progression**: Advance time to refresh recruit pools

---

## 🔗 Integration Points

### Canvas 08 (Time System) ✅
- Wage ticks trigger at fixed daily boundaries
- Time progression affects recruit pool refresh
- Day/season tracking for party lifecycle

### Canvas 09 (Faction AI) 🔄 Ready
- Faction reputation affects recruit availability
- Notoriety modifies hire costs and pool quality
- Regional control determines tavern locations

### Canvas 11 (Progression) 🔄 Hooks Ready
- XP distribution across party members
- Level-up triggers ability slot unlocks
- Scar system ready for persistent wound mechanics
- Revival ritual expansion points identified

### Canvas 12 (Economy) 🔄 Hooks Ready
- Hire costs and upkeep drain treasury
- Severance payments on dismissal
- Revival costs scale with level and death count

### Canvas 13 (Encounters) 🔄 Ready
- Battle seeds used for deterministic injury rolls
- Post-encounter injury resolution integrated
- Victory/defeat morale effects applied

### Canvas 17 (UI) 🔄 Components Ready
- Tavern screen with recruit list and inspection
- Party sheet with gear/skills/scars/contract tabs
- Morale meters and status badges
- Wage status alerts and desertion warnings

### Canvas 19 (Dialogue) 🔄 Event Types Ready
- Hire/dismiss bark triggers
- Level-up callouts
- Morale threshold crossing dialogue
- Death/revival dramatic moments

### Canvas 20 (Reputation) 🔄 Ready
- Recruit unlock conditions based on faction rep
- Price modifiers for notoriety
- Quest-locked recruits with reputation gates

---

## 📊 Key Features Implemented

### 1. **Hire/Fire System**
- ✅ Tavern-based recruitment with deterministic pools
- ✅ Hire cost + first week upkeep payment upfront
- ✅ Quest-locked recruits with unlock conditions
- ✅ Region tier affects recruit quality and availability
- ✅ Dismissal with severance based on loyalty and service time

### 2. **Wage & Debt System**
- ✅ Daily upkeep per member
- ✅ Wage debt accumulation if unpaid
- ✅ Escalating morale penalties for missed wages
- ✅ Desertion thresholds at -75 morale

### 3. **Morale & Loyalty**
- ✅ Morale range: -100 to +100
- ✅ Loyalty slow-moving, affects desertion
- ✅ Victory/defeat/injury/death modifiers
- ✅ Leadership bonus from hero CHA
- ✅ Wage payment morale effects
- ✅ Thresholds: Deserting → Threatening → Unhappy → Neutral → Content → Loyal → Devoted

### 4. **Injury & Death System**
- ✅ Downed → injury roll → injured/dead/scarred
- ✅ Deterministic rolls using battle seed
- ✅ Severity levels: light/serious/critical/fatal
- ✅ Death chance scaling with difficulty
- ✅ Persistent scar effects (Canvas 11 expansion ready)
- ✅ Revival mechanics with scaling costs

### 5. **Recruit Templates**
**Warriors:**
- Marcus the Ironclad (Human Knight)
- Kira Steelheart (Human Guardian)

**Rangers:**
- Theron Swiftbow (Sylvanborn Ranger)
- Raven Nightwhisper (Nightborn Corsair)

**Mages:**
- Elara Frostweaver (Human Mystic)
- Zephyr Stormcaller (Stormcaller Chanter)

**Quest-Locked:**
- Grimjaw the Exiled (requires quest + 50 rep)
- Lyssa Moonblade (requires ancient hunter quest)

---

## 🎯 Design Patterns

### 1. **Event-Driven Architecture**
```typescript
export type PartyEvent =
  | { type: 'party/hired'; memberId: CharacterId; name: string; cost: number }
  | { type: 'party/dismissed'; memberId: CharacterId; name: string; severance: number }
  | { type: 'party/morale'; memberId: CharacterId; delta: number; reason: MoraleReason }
  | { type: 'party/wagesDue'; amount: number; days: number }
  | { type: 'party/wagesPaid'; amount: number; days: number }
  | { type: 'party/debt'; amount: number; accumulated: number }
  | { type: 'party/desert'; memberId: CharacterId; name: string; morale: number }
  | { type: 'party/injured'; memberId: CharacterId; severity: InjurySeverity }
  | { type: 'party/death'; memberId: CharacterId; name: string; cause: string }
  | { type: 'party/revived'; memberId: CharacterId; name: string; cost: number }
  | { type: 'party/levelUp'; memberId: CharacterId; newLevel: number };
```

### 2. **Deterministic Generation**
- Recruit pools: `seed ^ hash(regionId|day)` → consistent results
- Injury rolls: `seed_battle_memberId` → replay consistency
- Scar generation: seeded RNG → predictable outcomes

### 3. **Immutable State Updates**
- All state functions return new objects
- No mutations of existing party members
- Clean Redux-style reducer pattern

### 4. **Separation of Concerns**
- **api.ts**: Public interface and event emission
- **state.ts**: State management and queries
- **morale.ts**: Behavior logic
- **wages.ts**: Economic calculations
- **injuries.ts**: Combat resolution
- **data.ts**: Content definitions

---

## 📈 Statistics & Metrics

### Code Organization
- **8 files** across `src/party/` module
- **~1,300 lines** of TypeScript
- **10+ recruit templates** with unique builds
- **11 party event types** for integration
- **5 region tier configs** for scaling difficulty

### Morale System
- **7 morale thresholds**: -100 (Deserting) to +100 (Devoted)
- **10 morale adjustment reasons**: victory, defeat, injury, death, wages, etc.
- **Escalating penalties**: -5/day unpaid → -10 after 3 days → -15 after 7 days

### Injury System
- **4 injury severities**: light, serious, critical, fatal
- **Death chances**: 0% (light), 5% (serious), 15% (critical), 30% (fatal)
- **Scar chance**: 30% for injured members
- **Revival cost scaling**: level × 100 × 1.5^(death_count)

### Recruit Pools
- **Tier 1**: Level 1-3, 4 recruits, 0.8× cost
- **Tier 2**: Level 3-6, 5 recruits, 1.0× cost
- **Tier 3**: Level 5-9, 6 recruits, 1.3× cost
- **Tier 4**: Level 8-12, 6 recruits, 1.6× cost
- **Tier 5**: Level 10-15, 8 recruits, 2.0× cost

---

## 🧪 Testing Instructions

### Manual Testing via Demo
1. **Launch Game**: Navigate to Main Menu
2. **Open Demo**: Click "Party Framework (Canvas 10)" card
3. **Verify Systems**:
   - ✅ Hire recruit from tavern (check gold deduction)
   - ✅ Pay wages for 1 day (verify morale boost)
   - ✅ Simulate easy victory (check morale increase)
   - ✅ Simulate hard defeat (check injuries and morale loss)
   - ✅ Test death mechanics (fatal injury → revival)
   - ✅ Dismiss member (verify severance cost)
   - ✅ Advance day (check recruit pool refresh)
   - ✅ Accumulate wage debt (watch morale penalties)

### Integration Testing
```typescript
// Example: Complete hire/wage/dismiss cycle
const hero = createHero();
initParty(hero);

const pool = getRecruitPool('region_start', 1, 'seed123', 1);
const recruit = pool[0];

hire(recruit, 1000, 1);
// Expected: gold -= (hireCost + upkeep), party.members.length++

payPartyWages(7, 1000);
// Expected: gold -= dailyUpkeep * 7, morale += wages_paid bonus

dismiss(recruit.id, 8);
// Expected: gold -= severance, party.members.length--
```

---

## 🔮 Future Expansion (Canvas 11+)

### Canvas 11 - Progression
- Full XP curve with soft caps
- Ability slot unlocks at level milestones
- Persistent scar mechanical effects
- Revival ritual requirements (not just gold)
- Character backstory quests

### Canvas 12 - Economy
- Gear vendors for recruit equipment
- Food/supply consumption during travel
- Inn costs for party rest
- Mount/cargo slot purchases

### Canvas 13 - Encounters
- Pre-battle deployment tactics
- Post-battle loot distribution
- Injury treatment items and healers
- Mercenary contracts with time limits

### Canvas 17 - UI
- Tavern rumors and recruit backstories
- Party sheet with full gear management
- Contract negotiation interface
- Morale conversation system

### Canvas 19 - Dialogue
- Recruit hire dialogue trees
- Morale threshold bark systems
- Battlefield callouts per recruit
- Dismissal farewell speeches

### Canvas 20 - Reputation
- Dynamic recruit pricing based on notoriety
- Faction-locked recruits (only hire if allied)
- Reputation-gated quest recruits
- Recruit loyalty affected by player actions

---

## 📝 Notes & Lessons Learned

### Design Decisions
1. **Hero Not Dismissible**: Player-created character is permanent party leader
2. **Upkeep Upfront**: Hire cost + first week prevents immediate desertion
3. **Morale vs Loyalty**: Short-term vs long-term satisfaction separation
4. **Deterministic Pools**: Same seed/region/day = identical recruits for testing
5. **Event-Driven**: All state changes emit events for logging and integration

### Performance Considerations
- Party size capped at 4-6 members (scales with hero titles)
- Wage calculations O(n) where n = party size
- Recruit pool generation O(m) where m = template count
- Event log limited to last 20 entries in demo

### API Design Choices
- Global state management (will integrate with gameStore in Canvas 17)
- Event listener subscription pattern for external systems
- Immutable state updates for predictable behavior
- Type-safe event payloads with discriminated unions

---

## ✅ Completion Checklist

- [x] Types and interfaces defined
- [x] Hire/dismiss mechanics implemented
- [x] Wage system with debt tracking
- [x] Morale and loyalty calculations
- [x] Injury and death resolution
- [x] Revival mechanics
- [x] Recruit pool generation
- [x] Event bus integration
- [x] Demo page with full UI
- [x] Main menu navigation
- [x] Documentation comments
- [x] Integration hooks for Canvas 11-20
- [x] Git commit and push
- [x] Zero ESLint errors in new code

---

## 🎉 Canvas 10 Complete!

**Next Steps**: Canvas 11 will expand the progression system with XP curves, ability unlocks, and persistent scar mechanical effects. The party framework is ready for full integration with the strategic campaign layer.

**Test Demo**: Launch the game and navigate to Main Menu → Party Framework (Canvas 10) to experience the complete hero + hirelings system!
