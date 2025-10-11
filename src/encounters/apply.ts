/**
 * Canvas 13 - Battle Result Application
 * 
 * Applies BattleResult back to overworld state (Canvas integration)
 */

import type {
  BattleResult,
  Casualty,
  GearWear,
  RegionShift,
  ConvoyOutcome
} from './types';
import type { Stack } from '../econ/types';

// ============================================================================
// MAIN APPLICATION FUNCTION
// ============================================================================

/**
 * Apply battle result to overworld
 * 
 * Integration points:
 * - Canvas 10: Update party members (HP, injuries, deaths)
 * - Canvas 11: Apply injuries using processPartyInjuries
 * - Canvas 12: Distribute loot, update gear durability, emit price signals
 * - Canvas 20: Create rumors, update fear/notoriety
 */
export function applyBattleResult(
  result: BattleResult,
  worldState: {
    partyMembers: Map<string, PartyMember>;
    inventory: Inventory;
    gold: number;
    reputation: Map<string, number>;
    regions: Map<string, RegionState>;
  }
): BattleResultApplication {
  const changes: BattleResultApplication = {
    casualties: [],
    goldGained: result.gold + result.bonusGold,
    lootAcquired: result.loot,
    gearDamaged: [],
    reputationChanges: new Map(),
    regionChanges: []
  };
  
  // Apply casualties (deaths, injuries, HP loss)
  for (const casualty of result.casualties) {
    const member = worldState.partyMembers.get(casualty.unitId);
    if (!member) continue;
    
    if (casualty.dead) {
      changes.casualties.push({
        unitId: casualty.unitId,
        unitName: member.name,
        outcome: 'dead'
      });
      // Mark member as dead (Canvas 10)
      // Actual removal handled by game engine
    } else if (casualty.downed) {
      changes.casualties.push({
        unitId: casualty.unitId,
        unitName: member.name,
        outcome: 'downed',
        injuries: casualty.injuries
      });
      // Apply injuries using Canvas 11 injury system
      // member.injuries = casualty.injuries;
    } else {
      // Just HP loss
      changes.casualties.push({
        unitId: casualty.unitId,
        unitName: member.name,
        outcome: 'wounded',
        hpAfter: casualty.hpAfter
      });
      member.hp = casualty.hpAfter;
    }
  }
  
  // Apply gear damage
  for (const wear of result.gearWear) {
    changes.gearDamaged.push({
      itemId: wear.itemId,
      ownerId: wear.ownerId,
      durabilityLost: wear.durabilityDelta,
      broken: wear.broken ?? false
    });
    
    // Update gear durability (Canvas 12)
    // const item = findItemInInventory(worldState.inventory, wear.itemId);
    // if (item && item.durability) {
    //   item.durability.cur = Math.max(0, item.durability.cur - wear.durabilityDelta);
    //   if (wear.broken) item.durability.cur = 0;
    // }
  }
  
  // Add loot to inventory
  worldState.gold += changes.goldGained;
  
  // Distribute loot (Canvas 12)
  // for (const stack of result.loot) {
  //   addToInventory(worldState.inventory, stack);
  // }
  
  // Apply reputation changes
  if (result.reputationDelta !== 0) {
    // Would determine which faction based on enemy forces
    const factionId = 'enemy_faction'; // Stub
    const currentRep = worldState.reputation.get(factionId) ?? 0;
    worldState.reputation.set(factionId, currentRep + result.reputationDelta);
    changes.reputationChanges.set(factionId, result.reputationDelta);
  }
  
  // Apply region control shifts
  if (result.regionShift) {
    applyRegionShift(result.regionShift, worldState.regions);
    changes.regionChanges.push(result.regionShift);
  }
  
  // Apply convoy outcome
  if (result.convoyOutcome) {
    changes.convoyOutcome = result.convoyOutcome;
    // Handle convoy cargo based on outcome
    // 'protected': Deliver cargo, get payment
    // 'plundered': Lose cargo, fail contract
    // 'lost': Cargo destroyed, partial payment
    // 'abandoned': Cargo left behind, no payment
  }
  
  // Create price signals (Canvas 12)
  // if (result.winner === 'A') {
  //   emitEconomyEvent({
  //     type: 'econ/priceChange',
  //     timestamp: Date.now(),
  //     data: {
  //       regionId: result.regionShift?.regionId,
  //       modifier: { type: 'event', strength: 0.1, duration: 7 }
  //     }
  //   });
  // }
  
  // Create rumors (Canvas 20)
  if (result.notorietyDelta > 50 || result.fearDelta > 50) {
    // emitRumorEvent({
    //   type: 'rumor/battle',
    //   outcome: result.winner,
    //   notoriety: result.notorietyDelta,
    //   fear: result.fearDelta
    // });
  }
  
  return changes;
}

// ============================================================================
// REGION CONTROL APPLICATION
// ============================================================================

/**
 * Apply region control shift
 */
function applyRegionShift(
  shift: RegionShift,
  regions: Map<string, RegionState>
): void {
  const region = regions.get(shift.regionId);
  if (!region) return;
  
  // Update control percentage
  region.controlPercent = Math.max(0, Math.min(100, 
    region.controlPercent + shift.controlDelta
  ));
  
  // Change controller if threshold crossed
  if (shift.newController) {
    region.controller = shift.newController;
  }
}

// ============================================================================
// CASUALTIES PROCESSING
// ============================================================================

/**
 * Process casualties with Canvas 11 injury system
 */
export function processBattleCasualties(
  casualties: Casualty[],
  partyMembers: Map<string, PartyMember>
): CasualtyReport {
  const report: CasualtyReport = {
    deaths: [],
    injured: [],
    wounded: []
  };
  
  for (const casualty of casualties) {
    const member = partyMembers.get(casualty.unitId);
    if (!member) continue;
    
    if (casualty.dead) {
      report.deaths.push({
        id: member.id,
        name: member.name,
        level: member.level,
        cause: 'combat'
      });
    } else if (casualty.downed && casualty.injuries) {
      report.injured.push({
        id: member.id,
        name: member.name,
        injuries: casualty.injuries,
        recoveryDays: casualty.injuries.length * 7 // Estimate
      });
    } else {
      report.wounded.push({
        id: member.id,
        name: member.name,
        hpAfter: casualty.hpAfter,
        hpLost: member.maxHp - casualty.hpAfter
      });
    }
  }
  
  return report;
}

// ============================================================================
// LOOT DISTRIBUTION
// ============================================================================

/**
 * Distribute loot to party inventory
 */
export function distributeLoot(
  loot: Stack[],
  _inventory: Inventory
): LootDistribution {
  const distribution: LootDistribution = {
    itemsAdded: [],
    overflowItems: []
  };
  
  for (const stack of loot) {
    // Check if inventory has space
    const hasSpace = true; // Stub - would check encumbrance
    
    if (hasSpace) {
      // Add to inventory (Canvas 12)
      // addToInventory(inventory, stack);
      distribution.itemsAdded.push(stack);
    } else {
      distribution.overflowItems.push(stack);
    }
  }
  
  return distribution;
}

// ============================================================================
// GEAR DURABILITY APPLICATION
// ============================================================================

/**
 * Apply gear durability damage
 */
export function applyGearDurability(
  gearWear: GearWear[],
  partyMembers: Map<string, PartyMember>
): GearDurabilityReport {
  const report: GearDurabilityReport = {
    damagedItems: [],
    brokenItems: []
  };
  
  for (const wear of gearWear) {
    const member = partyMembers.get(wear.ownerId);
    if (!member) continue;
    
    // Find item in member's gear
    // const item = member.gear[wear.itemId];
    // if (!item || !item.durability) continue;
    
    // Apply durability loss
    // item.durability.cur = Math.max(0, item.durability.cur - wear.durabilityDelta);
    
    if (wear.broken) {
      report.brokenItems.push({
        itemId: wear.itemId,
        ownerId: wear.ownerId,
        itemName: 'Unknown' // Would look up item name
      });
    } else {
      report.damagedItems.push({
        itemId: wear.itemId,
        ownerId: wear.ownerId,
        durabilityLost: wear.durabilityDelta
      });
    }
  }
  
  return report;
}

// ============================================================================
// EXPERIENCE DISTRIBUTION
// ============================================================================

/**
 * Distribute XP from battle
 */
export function distributeXP(
  xpGained: number,
  partyMembers: Map<string, PartyMember>,
  survivors: string[]
): XPDistribution {
  const distribution: XPDistribution = {
    memberGains: new Map()
  };
  
  // Divide XP equally among survivors
  const xpPerMember = Math.floor(xpGained / survivors.length);
  
  for (const memberId of survivors) {
    const member = partyMembers.get(memberId);
    if (!member) continue;
    
    // Add XP (Canvas 11 progression)
    // member.xp += xpPerMember;
    
    distribution.memberGains.set(memberId, xpPerMember);
  }
  
  return distribution;
}

// ============================================================================
// TYPE DEFINITIONS (Integration Stubs)
// ============================================================================

/**
 * Party member stub (Canvas 10)
 */
interface PartyMember {
  id: string;
  name: string;
  level: number;
  hp: number;
  maxHp: number;
  xp?: number;
  gear?: Record<string, unknown>;
  injuries?: string[];
}

/**
 * Inventory stub (Canvas 12)
 */
interface Inventory {
  capacity: number;
  weight: number;
  stacks: Stack[];
}

/**
 * Region state stub (Canvas 07)
 */
interface RegionState {
  id: string;
  controller: string;
  controlPercent: number;
}

/**
 * Battle result application summary
 */
export interface BattleResultApplication {
  casualties: Array<{
    unitId: string;
    unitName: string;
    outcome: 'dead' | 'downed' | 'wounded';
    injuries?: string[];
    hpAfter?: number;
  }>;
  goldGained: number;
  lootAcquired: Stack[];
  gearDamaged: Array<{
    itemId: string;
    ownerId: string;
    durabilityLost: number;
    broken: boolean;
  }>;
  reputationChanges: Map<string, number>;
  regionChanges: RegionShift[];
  convoyOutcome?: ConvoyOutcome;
}

/**
 * Casualty report
 */
export interface CasualtyReport {
  deaths: Array<{
    id: string;
    name: string;
    level: number;
    cause: string;
  }>;
  injured: Array<{
    id: string;
    name: string;
    injuries: string[];
    recoveryDays: number;
  }>;
  wounded: Array<{
    id: string;
    name: string;
    hpAfter: number;
    hpLost: number;
  }>;
}

/**
 * Loot distribution result
 */
export interface LootDistribution {
  itemsAdded: Stack[];
  overflowItems: Stack[];
}

/**
 * Gear durability report
 */
export interface GearDurabilityReport {
  damagedItems: Array<{
    itemId: string;
    ownerId: string;
    durabilityLost: number;
  }>;
  brokenItems: Array<{
    itemId: string;
    ownerId: string;
    itemName: string;
  }>;
}

/**
 * XP distribution result
 */
export interface XPDistribution {
  memberGains: Map<string, number>;
}
