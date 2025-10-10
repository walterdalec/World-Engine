/**
 * Canvas 12 - Trade Routes & Convoys
 * 
 * Trade route evaluation, cargo contracts, and convoy missions
 */

import type {
  RouteEval,
  CargoContract,
  Stack,
  Item,
  Market,
  MarketTier
} from './types';
import type { Upkeep } from './types';
import { getBaseBuyPrice, getBaseSellPrice } from './pricing';

// ============================================================================
// ROUTE EVALUATION
// ============================================================================

/**
 * Calculate travel days based on distance and party speed
 */
export function calculateTravelDays(
  distance: number,
  baseSpeed: number = 20, // hexes per day
  speedModifier: number = 1.0 // from encumbrance
): number {
  const effectiveSpeed = baseSpeed * speedModifier;
  return Math.ceil(distance / effectiveSpeed);
}

/**
 * Calculate danger level for a route
 * Based on contested borders, bandit activity, etc.
 */
export function calculateDangerLevel(
  originRegionId: string,
  destinationRegionId: string,
  dangerMap: Map<string, number> = new Map()
): number {
  // Look up danger for route (could be from Canvas 13 encounter system)
  const routeKey = `${originRegionId}-${destinationRegionId}`;
  const danger = dangerMap.get(routeKey) ?? 0.1; // Default 10% danger
  
  return Math.min(1.0, Math.max(0, danger));
}

/**
 * Calculate risk premium (insurance cost)
 */
export function calculateRiskPremium(
  cargoValue: number,
  dangerLevel: number,
  hasInsurance: boolean = false
): number {
  if (!hasInsurance) return 0;
  
  // Insurance costs 10-30% of cargo value based on danger
  const insuranceRate = 0.1 + (dangerLevel * 0.2); // 10% to 30%
  return Math.ceil(cargoValue * insuranceRate);
}

/**
 * Evaluate trade route profitability
 */
export function evaluateRoute(
  origin: Market,
  destination: Market,
  manifest: Stack[],
  itemRegistry: Map<string, Item>,
  distance: number,
  dailyUpkeep: Upkeep,
  speedModifier: number = 1.0,
  dangerMap?: Map<string, number>,
  hasInsurance: boolean = false
): RouteEval {
  const travelDays = calculateTravelDays(distance, 20, speedModifier);
  const dangerLevel = calculateDangerLevel(origin.regionId, destination.regionId, dangerMap);
  
  // Calculate purchase cost at origin
  let buyValue = 0;
  for (const stack of manifest) {
    const item = itemRegistry.get(stack.itemId);
    if (item) {
      const buyPrice = getBaseBuyPrice(item, origin.tier);
      buyValue += buyPrice * stack.qty;
    }
  }
  
  // Calculate sell value at destination
  let sellValue = 0;
  for (const stack of manifest) {
    const item = itemRegistry.get(stack.itemId);
    if (item) {
      const sellPrice = getBaseSellPrice(item, destination.tier);
      sellValue += sellPrice * stack.qty;
    }
  }
  
  // Calculate travel costs
  const travelCost = dailyUpkeep.total * travelDays;
  
  // Calculate risk premium
  const riskPremium = calculateRiskPremium(buyValue, dangerLevel, hasInsurance);
  
  // Calculate profit
  const profit = sellValue - buyValue - travelCost - riskPremium;
  const profitPerDay = travelDays > 0 ? profit / travelDays : 0;
  
  return {
    origin: origin.regionId,
    destination: destination.regionId,
    distance,
    travelDays,
    buyValue,
    sellValue,
    travelCost,
    riskPremium,
    profit,
    profitPerDay,
    dangerLevel,
    recommended: profit > 0 && profitPerDay > dailyUpkeep.total
  };
}

/**
 * Find most profitable trade route
 */
export function findBestRoute(
  markets: Map<string, Market>,
  itemRegistry: Map<string, Item>,
  availableGold: number,
  dailyUpkeep: Upkeep,
  speedModifier: number = 1.0,
  dangerMap?: Map<string, number>
): RouteEval | undefined {
  const routes: RouteEval[] = [];
  const marketArray = Array.from(markets.values());
  
  // Evaluate all market pairs
  for (let i = 0; i < marketArray.length; i++) {
    for (let j = i + 1; j < marketArray.length; j++) {
      const origin = marketArray[i];
      const destination = marketArray[j];
      
      // Simple manifest: buy common items available at origin
      const manifest: Stack[] = [];
      let budgetRemaining = availableGold;
      
      for (const [itemId, stock] of Object.entries(origin.stock)) {
        if (stock > 0) {
          const item = itemRegistry.get(itemId);
          if (item && item.kind === 'cargo') {
            const buyPrice = getBaseBuyPrice(item, origin.tier);
            const qtyCanAfford = Math.floor(budgetRemaining / buyPrice);
            const qtyToBuy = Math.min(qtyCanAfford, stock, 10); // Max 10 per item
            
            if (qtyToBuy > 0) {
              manifest.push({ itemId, qty: qtyToBuy });
              budgetRemaining -= buyPrice * qtyToBuy;
            }
          }
        }
      }
      
      if (manifest.length > 0) {
        // Calculate distance (simplified - would use actual hex positions)
        const distance = 50; // Placeholder
        
        const route = evaluateRoute(
          origin,
          destination,
          manifest,
          itemRegistry,
          distance,
          dailyUpkeep,
          speedModifier,
          dangerMap
        );
        
        routes.push(route);
      }
    }
  }
  
  // Return most profitable route
  routes.sort((a, b) => b.profitPerDay - a.profitPerDay);
  return routes[0];
}

// ============================================================================
// CARGO CONTRACTS
// ============================================================================

/**
 * Create cargo contract
 */
export function createCargoContract(
  id: string,
  origin: string,
  destination: string,
  cargo: Stack[],
  distance: number,
  travelDays: number,
  dangerLevel: number
): CargoContract {
  // Base payment is cargo value + travel bonus
  const basePayment = 100 + (distance * 2); // 100g base + 2g per hex
  
  // Danger bonus
  const dangerBonus = Math.ceil(basePayment * dangerLevel); // Up to 100% bonus
  
  const payment = basePayment + dangerBonus;
  const bonus = Math.ceil(payment * 0.2); // 20% bonus for fast delivery
  const insurance = Math.ceil(basePayment * 0.5); // 50% refund on loss
  
  // Deadline is travel days + 50% buffer
  const deadline = travelDays + Math.ceil(travelDays * 0.5);
  
  return {
    id,
    origin,
    destination,
    cargo,
    payment,
    bonus,
    deadline,
    insurance,
    dangerLevel,
    accepted: false,
    completed: false
  };
}

/**
 * Accept cargo contract
 */
export function acceptContract(contract: CargoContract): CargoContract {
  return {
    ...contract,
    accepted: true
  };
}

/**
 * Complete cargo contract
 */
export function completeContract(
  contract: CargoContract,
  currentDay: number,
  cargoIntact: boolean
): {
  contract: CargoContract;
  payout: number;
  bonusEarned: boolean;
} {
  if (!contract.accepted) {
    return {
      contract,
      payout: 0,
      bonusEarned: false
    };
  }
  
  // Check if delivered on time
  const onTime = currentDay <= contract.deadline;
  const bonusEarned = onTime && cargoIntact;
  
  // Calculate payout
  let payout = contract.payment;
  if (bonusEarned) {
    payout += contract.bonus;
  } else if (!cargoIntact) {
    // Lost cargo, insurance refund only
    payout = contract.insurance;
  }
  
  return {
    contract: {
      ...contract,
      completed: true
    },
    payout,
    bonusEarned
  };
}

/**
 * Calculate contract late penalty
 */
export function calculateLatePenalty(
  contract: CargoContract,
  currentDay: number
): number {
  if (currentDay <= contract.deadline) return 0;
  
  const daysLate = currentDay - contract.deadline;
  const penalty = Math.min(contract.payment * 0.5, daysLate * 10); // 10g per day, max 50%
  
  return Math.ceil(penalty);
}

// ============================================================================
// CONVOY GENERATION
// ============================================================================

/**
 * Generate random cargo manifest
 */
export function generateCargoManifest(
  itemRegistry: Map<string, Item>,
  tier: MarketTier,
  seed: string
): Stack[] {
  const manifest: Stack[] = [];
  
  // Simple hash for deterministic generation
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash = hash & hash;
  }
  
  // Get cargo items
  const cargoItems = Array.from(itemRegistry.values())
    .filter(item => item.kind === 'cargo');
  
  // Generate 3-8 cargo stacks
  const stackCount = 3 + (Math.abs(hash) % 6);
  
  for (let i = 0; i < stackCount; i++) {
    const itemIndex = (hash + i) % cargoItems.length;
    const item = cargoItems[itemIndex];
    
    if (item) {
      const qty = 5 + ((hash + i * 13) % 15); // 5-20 qty
      manifest.push({ itemId: item.id, qty });
    }
  }
  
  return manifest;
}

/**
 * Generate convoy contract for a route
 */
export function generateConvoyContract(
  origin: Market,
  destination: Market,
  itemRegistry: Map<string, Item>,
  distance: number,
  travelDays: number,
  dangerLevel: number,
  seed: string
): CargoContract {
  const manifest = generateCargoManifest(itemRegistry, origin.tier, seed);
  const id = `convoy-${origin.regionId}-${destination.regionId}-${seed}`;
  
  return createCargoContract(
    id,
    origin.regionId,
    destination.regionId,
    manifest,
    distance,
    travelDays,
    dangerLevel
  );
}
