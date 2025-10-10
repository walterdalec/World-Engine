/**
 * Canvas 12 - Inventory Management
 * 
 * Stack management, encumbrance, equipment, and capacity tracking
 */

import type {
  Item,
  Stack,
  Inventory,
  EncumbranceLevel,
  EncumbranceState,
  Slot
} from './types';

// ============================================================================
// ENCUMBRANCE CALCULATIONS
// ============================================================================

/**
 * Encumbrance thresholds
 */
const ENCUMBRANCE_THRESHOLDS = {
  light: 0.6,      // ≤60% capacity
  normal: 0.9,     // ≤90% capacity
  heavy: 1.0,      // ≤100% capacity
  overloaded: Infinity // >100% capacity
};

/**
 * Encumbrance effects on gameplay
 */
const ENCUMBRANCE_EFFECTS = {
  light: {
    speedModifier: 1.0,
    escapeModifier: 1.1,
    staminaCost: 0.9
  },
  normal: {
    speedModifier: 1.0,
    escapeModifier: 1.0,
    staminaCost: 1.0
  },
  heavy: {
    speedModifier: 0.8,
    escapeModifier: 0.7,
    staminaCost: 1.3
  },
  overloaded: {
    speedModifier: 0.5,
    escapeModifier: 0.4,
    staminaCost: 2.0
  }
};

/**
 * Calculate encumbrance state from inventory
 */
export function calculateEncumbrance(inventory: Inventory): EncumbranceState {
  const ratio = inventory.weight / inventory.capacity;
  
  let level: EncumbranceLevel;
  if (ratio <= ENCUMBRANCE_THRESHOLDS.light) {
    level = 'light';
  } else if (ratio <= ENCUMBRANCE_THRESHOLDS.normal) {
    level = 'normal';
  } else if (ratio <= ENCUMBRANCE_THRESHOLDS.heavy) {
    level = 'heavy';
  } else {
    level = 'overloaded';
  }

  const effects = ENCUMBRANCE_EFFECTS[level];

  return {
    level,
    ratio,
    speedModifier: effects.speedModifier,
    escapeModifier: effects.escapeModifier,
    staminaCost: effects.staminaCost
  };
}

// ============================================================================
// INVENTORY OPERATIONS
// ============================================================================

/**
 * Create empty inventory
 */
export function createInventory(capacity: number = 100): Inventory {
  return {
    capacity,
    weight: 0,
    stacks: [],
    gold: 0
  };
}

/**
 * Find stack by item ID
 */
export function findStack(inventory: Inventory, itemId: string): Stack | undefined {
  return inventory.stacks.find(s => s.itemId === itemId);
}

/**
 * Calculate total weight of a stack
 */
export function getStackWeight(stack: Stack, itemData: Item): number {
  return itemData.weight * stack.qty;
}

/**
 * Calculate inventory weight from all stacks
 */
export function calculateInventoryWeight(inventory: Inventory, itemRegistry: Map<string, Item>): number {
  let weight = 0;
  for (const stack of inventory.stacks) {
    const item = itemRegistry.get(stack.itemId);
    if (item) {
      weight += getStackWeight(stack, item);
    }
  }
  return weight;
}

/**
 * Check if item can be added without exceeding capacity
 */
export function canAddItem(
  inventory: Inventory,
  itemId: string,
  qty: number,
  itemRegistry: Map<string, Item>
): boolean {
  const item = itemRegistry.get(itemId);
  if (!item) return false;

  const addedWeight = item.weight * qty;
  const newWeight = inventory.weight + addedWeight;

  return newWeight <= inventory.capacity;
}

/**
 * Add item to inventory
 * Returns updated inventory or undefined if failed
 */
export function addItem(
  inventory: Inventory,
  itemId: string,
  qty: number,
  itemRegistry: Map<string, Item>
): Inventory | undefined {
  const item = itemRegistry.get(itemId);
  if (!item) return undefined;

  // Check capacity
  if (!canAddItem(inventory, itemId, qty, itemRegistry)) {
    return undefined;
  }

  // Check if stackable
  const existingStack = findStack(inventory, itemId);
  const maxStack = item.maxStack ?? 1;

  if (item.stackable && existingStack) {
    // Add to existing stack
    const newQty = Math.min(existingStack.qty + qty, maxStack);
    const overflow = existingStack.qty + qty - newQty;

    const updatedStacks = inventory.stacks.map(s =>
      s.itemId === itemId ? { ...s, qty: newQty } : s
    );

    // If overflow, create new stack
    if (overflow > 0) {
      updatedStacks.push({ itemId, qty: overflow });
    }

    return {
      ...inventory,
      stacks: updatedStacks,
      weight: calculateInventoryWeight({ ...inventory, stacks: updatedStacks }, itemRegistry)
    };
  } else {
    // Create new stack
    const newStack: Stack = { itemId, qty };
    const updatedStacks = [...inventory.stacks, newStack];

    return {
      ...inventory,
      stacks: updatedStacks,
      weight: calculateInventoryWeight({ ...inventory, stacks: updatedStacks }, itemRegistry)
    };
  }
}

/**
 * Remove item from inventory
 * Returns updated inventory or undefined if insufficient quantity
 */
export function removeItem(
  inventory: Inventory,
  itemId: string,
  qty: number,
  itemRegistry: Map<string, Item>
): Inventory | undefined {
  const stack = findStack(inventory, itemId);
  if (!stack || stack.qty < qty) {
    return undefined;
  }

  const updatedStacks = inventory.stacks
    .map(s => {
      if (s.itemId === itemId) {
        return { ...s, qty: s.qty - qty };
      }
      return s;
    })
    .filter(s => s.qty > 0); // Remove empty stacks

  return {
    ...inventory,
    stacks: updatedStacks,
    weight: calculateInventoryWeight({ ...inventory, stacks: updatedStacks }, itemRegistry)
  };
}

/**
 * Transfer items between inventories
 */
export function transferItem(
  from: Inventory,
  to: Inventory,
  itemId: string,
  qty: number,
  itemRegistry: Map<string, Item>
): { from: Inventory; to: Inventory } | undefined {
  // Remove from source
  const updatedFrom = removeItem(from, itemId, qty, itemRegistry);
  if (!updatedFrom) return undefined;

  // Add to destination
  const updatedTo = addItem(to, itemId, qty, itemRegistry);
  if (!updatedTo) return undefined;

  return { from: updatedFrom, to: updatedTo };
}

/**
 * Get total quantity of item across all stacks
 */
export function getItemQuantity(inventory: Inventory, itemId: string): number {
  return inventory.stacks
    .filter(s => s.itemId === itemId)
    .reduce((sum, s) => sum + s.qty, 0);
}

/**
 * Check if inventory has minimum quantity of item
 */
export function hasItem(inventory: Inventory, itemId: string, minQty: number = 1): boolean {
  return getItemQuantity(inventory, itemId) >= minQty;
}

/**
 * Check if inventory has all required items
 */
export function hasItems(inventory: Inventory, required: Stack[]): boolean {
  return required.every(req => hasItem(inventory, req.itemId, req.qty));
}

/**
 * Consume multiple items (for crafting/rituals)
 * Returns updated inventory or undefined if insufficient
 */
export function consumeItems(
  inventory: Inventory,
  items: Stack[],
  itemRegistry: Map<string, Item>
): Inventory | undefined {
  // Check all items available
  if (!hasItems(inventory, items)) {
    return undefined;
  }

  // Remove each item
  let updated = inventory;
  for (const stack of items) {
    const result = removeItem(updated, stack.itemId, stack.qty, itemRegistry);
    if (!result) return undefined;
    updated = result;
  }

  return updated;
}

// ============================================================================
// EQUIPMENT MANAGEMENT
// ============================================================================

/**
 * Equipment set for a character
 */
export interface EquipmentSet {
  head?: string;
  chest?: string;
  hands?: string;
  legs?: string;
  feet?: string;
  neck?: string;
  ring?: string;
  main?: string;
  off?: string;
  twohand?: string;
  trinket?: string;
}

/**
 * Check if item can be equipped in slot
 */
export function canEquip(item: Item, slot: Slot): boolean {
  if (!item.slot) return false;
  
  // Two-handed weapons can go in twohand slot
  if (item.twoHanded && slot === 'twohand') return true;
  
  return item.slot === slot;
}

/**
 * Equip item from inventory
 * Returns updated equipment and inventory
 */
export function equipItem(
  equipment: EquipmentSet,
  inventory: Inventory,
  itemId: string,
  slot: Slot,
  itemRegistry: Map<string, Item>
): { equipment: EquipmentSet; inventory: Inventory } | undefined {
  const item = itemRegistry.get(itemId);
  if (!item || !canEquip(item, slot)) return undefined;

  // Check if item is in inventory
  if (!hasItem(inventory, itemId)) return undefined;

  // Handle two-handed weapons
  if (item.twoHanded) {
    // Remove current main/off/twohand
    let updatedInventory = inventory;
    const currentMain = equipment.main;
    const currentOff = equipment.off;
    const currentTwohand = equipment.twohand;

    if (currentMain) {
      updatedInventory = addItem(updatedInventory, currentMain, 1, itemRegistry) ?? updatedInventory;
    }
    if (currentOff) {
      updatedInventory = addItem(updatedInventory, currentOff, 1, itemRegistry) ?? updatedInventory;
    }
    if (currentTwohand) {
      updatedInventory = addItem(updatedInventory, currentTwohand, 1, itemRegistry) ?? updatedInventory;
    }

    // Remove item from inventory
    updatedInventory = removeItem(updatedInventory, itemId, 1, itemRegistry) ?? updatedInventory;

    return {
      equipment: { ...equipment, main: undefined, off: undefined, twohand: itemId },
      inventory: updatedInventory
    };
  }

  // Handle regular equipment
  const currentItem = equipment[slot];
  let updatedInventory = inventory;

  // Return current item to inventory
  if (currentItem) {
    updatedInventory = addItem(updatedInventory, currentItem, 1, itemRegistry) ?? updatedInventory;
  }

  // Remove new item from inventory
  updatedInventory = removeItem(updatedInventory, itemId, 1, itemRegistry) ?? updatedInventory;

  return {
    equipment: { ...equipment, [slot]: itemId },
    inventory: updatedInventory
  };
}

/**
 * Unequip item to inventory
 */
export function unequipItem(
  equipment: EquipmentSet,
  inventory: Inventory,
  slot: Slot,
  itemRegistry: Map<string, Item>
): { equipment: EquipmentSet; inventory: Inventory } | undefined {
  const itemId = equipment[slot];
  if (!itemId) return undefined;

  // Check if inventory has space
  const item = itemRegistry.get(itemId);
  if (!item) return undefined;

  if (!canAddItem(inventory, itemId, 1, itemRegistry)) {
    return undefined;
  }

  // Add to inventory
  const updatedInventory = addItem(inventory, itemId, 1, itemRegistry);
  if (!updatedInventory) return undefined;

  // Clear slot
  const updatedEquipment = { ...equipment, [slot]: undefined };

  // If unequipping two-handed, clear main/off as well
  if (slot === 'twohand') {
    updatedEquipment.main = undefined;
    updatedEquipment.off = undefined;
  }

  return {
    equipment: updatedEquipment,
    inventory: updatedInventory
  };
}

/**
 * Get all equipped items
 */
export function getEquippedItems(equipment: EquipmentSet): string[] {
  return Object.values(equipment).filter((id): id is string => id !== undefined);
}

/**
 * Calculate total equipment weight
 */
export function getEquipmentWeight(equipment: EquipmentSet, itemRegistry: Map<string, Item>): number {
  const items = getEquippedItems(equipment);
  return items.reduce((weight, itemId) => {
    const item = itemRegistry.get(itemId);
    return weight + (item?.weight ?? 0);
  }, 0);
}
