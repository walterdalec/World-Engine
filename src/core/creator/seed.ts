/**
 * Character Creator Seed & Loadout
 * TODO #16 — Character Creator & Progression Bridge
 * 
 * Seeds initial equipment, spells, and abilities for created characters
 */

import type { CreatorInput } from './types';
import type { Unit } from '../../features/battle/types';
import { ArchetypeDefaults } from './rules';

/**
 * Seed equipment, spells, and abilities for a character
 */
export function seedLoadout(unit: Unit, input: CreatorInput): void {
    const archetype = ArchetypeDefaults[input.archetype];

    // Seed basic equipment
    seedEquipment(unit, archetype, input);

    // Seed starting abilities
    seedAbilities(unit, archetype, input);

    // Validate and filter spells
    seedSpells(unit, input);
}

/**
 * Seed starting equipment based on archetype
 */
function seedEquipment(unit: Unit, archetype: any, input: CreatorInput): void {
    if (!unit.meta) return;

    // Create basic equipment based on archetype defaults
    unit.meta.equipment = {
        weapon: createItem(archetype.defaultEquipment.weapon),
        armor: createItem(archetype.defaultEquipment.armor),
        shield: archetype.defaultEquipment.shield ? createItem(archetype.defaultEquipment.shield) : undefined
    };

    // Apply equipment preferences if specified
    if (input.equipment?.weaponType) {
        unit.meta.equipment.weapon = createItem(`${input.equipment.weaponType}_weapon`);
    }

    if (input.equipment?.armorType) {
        unit.meta.equipment.armor = createItem(`${input.equipment.armorType}_armor`);
    }

    // Calculate equipment bonuses
    updateEquipmentBonuses(unit);
}

/**
 * Seed starting abilities based on archetype
 */
function seedAbilities(unit: Unit, archetype: any, _input: CreatorInput): void {
    if (!unit.meta) return;

    // Start with archetype default abilities
    unit.skills = [...archetype.startingAbilities];

    // Add level-based abilities
    const bonusAbilities = Math.floor(unit.level / 3); // 1 bonus ability every 3 levels
    for (let i = 0; i < bonusAbilities; i++) {
        const abilityId = `level_${3 * (i + 1)}_ability`;
        if (!unit.skills.includes(abilityId)) {
            unit.skills.push(abilityId);
        }
    }
}

/**
 * Validate and seed spell selection
 */
function seedSpells(unit: Unit, input: CreatorInput): void {
    if (!unit.meta || !input.spells) return;

    // Filter spells that the character can actually cast
    const validSpells = input.spells.filter(spell =>
        canCastSpell(unit, spell, input)
    );

    unit.meta.knownSpells = validSpells.map(spell => spell.id);
}

/**
 * Check if a character can cast a specific spell
 */
function canCastSpell(unit: Unit, spell: any, _input: CreatorInput): boolean {
    if (!unit.meta?.magicMasteries || !spell.school) return false;

    const masteryRank = unit.meta.magicMasteries[spell.school] || 0;
    const requiredMastery = Math.min(4, Math.ceil((spell.level || 0) / 2) + 1);

    return masteryRank >= requiredMastery;
}

/**
 * Create a basic item definition
 */
function createItem(itemId: string): any {
    const itemDatabase: Record<string, any> = {
        // Weapons
        'iron_sword': {
            id: 'iron_sword',
            name: 'Iron Sword',
            slot: 'weapon',
            type: 'sword',
            damage: 6,
            accuracy: 85,
            properties: ['melee']
        },
        'shortbow': {
            id: 'shortbow',
            name: 'Short Bow',
            slot: 'weapon',
            type: 'bow',
            damage: 5,
            accuracy: 80,
            range: 4,
            properties: ['ranged']
        },
        'oak_staff': {
            id: 'oak_staff',
            name: 'Oak Staff',
            slot: 'weapon',
            type: 'staff',
            damage: 3,
            accuracy: 90,
            magicBonus: 2,
            properties: ['magical', 'two_handed']
        },
        'ash_wand': {
            id: 'ash_wand',
            name: 'Ash Wand',
            slot: 'weapon',
            type: 'wand',
            damage: 2,
            accuracy: 95,
            magicBonus: 3,
            properties: ['magical', 'divine']
        },
        'knight_sword': {
            id: 'knight_sword',
            name: 'Knight\'s Sword',
            slot: 'weapon',
            type: 'sword',
            damage: 8,
            accuracy: 90,
            properties: ['melee', 'masterwork']
        },
        'mystic_orb': {
            id: 'mystic_orb',
            name: 'Mystic Orb',
            slot: 'weapon',
            type: 'orb',
            damage: 1,
            accuracy: 100,
            magicBonus: 4,
            properties: ['magical', 'arcane']
        },
        'guardian_staff': {
            id: 'guardian_staff',
            name: 'Guardian Staff',
            slot: 'weapon',
            type: 'staff',
            damage: 4,
            accuracy: 85,
            magicBonus: 2,
            defenseBonus: 1,
            properties: ['magical', 'protective']
        },
        'chanter_harp': {
            id: 'chanter_harp',
            name: 'Chanter\'s Harp',
            slot: 'weapon',
            type: 'instrument',
            damage: 1,
            accuracy: 100,
            magicBonus: 3,
            properties: ['magical', 'sonic']
        },
        'corsair_blade': {
            id: 'corsair_blade',
            name: 'Corsair Blade',
            slot: 'weapon',
            type: 'sword',
            damage: 5,
            accuracy: 90,
            speedBonus: 1,
            properties: ['melee', 'finesse']
        },

        // Armor
        'cloth_robes': {
            id: 'cloth_robes',
            name: 'Cloth Robes',
            slot: 'armor',
            type: 'cloth',
            defense: 1,
            magicResistance: 2,
            properties: ['light']
        },
        'leather_armor': {
            id: 'leather_armor',
            name: 'Leather Armor',
            slot: 'armor',
            type: 'leather',
            defense: 3,
            speedPenalty: 0,
            properties: ['medium']
        },
        'brigandine': {
            id: 'brigandine',
            name: 'Brigandine',
            slot: 'armor',
            type: 'mail',
            defense: 5,
            speedPenalty: 1,
            properties: ['heavy']
        },
        'plate_armor': {
            id: 'plate_armor',
            name: 'Plate Armor',
            slot: 'armor',
            type: 'plate',
            defense: 7,
            speedPenalty: 2,
            properties: ['heavy', 'masterwork']
        },
        'enchanted_robes': {
            id: 'enchanted_robes',
            name: 'Enchanted Robes',
            slot: 'armor',
            type: 'cloth',
            defense: 2,
            magicResistance: 4,
            magicBonus: 1,
            properties: ['light', 'magical']
        },
        'guardian_mail': {
            id: 'guardian_mail',
            name: 'Guardian Mail',
            slot: 'armor',
            type: 'mail',
            defense: 4,
            magicResistance: 2,
            speedPenalty: 1,
            properties: ['medium', 'protective']
        },
        'performer_garb': {
            id: 'performer_garb',
            name: 'Performer\'s Garb',
            slot: 'armor',
            type: 'cloth',
            defense: 1,
            charismaBonus: 1,
            properties: ['light', 'stylish']
        },
        'corsair_coat': {
            id: 'corsair_coat',
            name: 'Corsair Coat',
            slot: 'armor',
            type: 'leather',
            defense: 2,
            speedBonus: 1,
            properties: ['medium', 'stylish']
        },

        // Shields
        'round_shield': {
            id: 'round_shield',
            name: 'Round Shield',
            slot: 'shield',
            type: 'shield',
            defense: 2,
            blockChance: 15,
            properties: ['defensive']
        },
        'knight_shield': {
            id: 'knight_shield',
            name: 'Knight\'s Shield',
            slot: 'shield',
            type: 'shield',
            defense: 3,
            blockChance: 20,
            properties: ['defensive', 'masterwork']
        },
        'tower_shield': {
            id: 'tower_shield',
            name: 'Tower Shield',
            slot: 'shield',
            type: 'shield',
            defense: 4,
            blockChance: 25,
            speedPenalty: 1,
            properties: ['defensive', 'heavy']
        }
    };

    return itemDatabase[itemId] || {
        id: itemId,
        name: itemId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        slot: 'weapon',
        type: 'unknown',
        damage: 1,
        accuracy: 70,
        properties: []
    };
}

/**
 * Update unit stats based on equipped items
 */
function updateEquipmentBonuses(unit: Unit): void {
    if (!unit.meta?.equipment) return;

    const equipment = unit.meta.equipment;

    // Apply weapon bonuses
    if (equipment.weapon) {
        if (equipment.weapon.damage) {
            unit.stats.atk += Math.floor(equipment.weapon.damage / 2);
        }
        if (equipment.weapon.magicBonus) {
            unit.stats.mag += equipment.weapon.magicBonus;
        }
        if (equipment.weapon.speedBonus) {
            unit.stats.spd += equipment.weapon.speedBonus;
        }
        if (equipment.weapon.range) {
            unit.stats.rng = Math.max(unit.stats.rng, equipment.weapon.range);
        }
    }

    // Apply armor bonuses
    if (equipment.armor) {
        if (equipment.armor.defense) {
            unit.stats.def += equipment.armor.defense;
        }
        if (equipment.armor.magicResistance) {
            unit.stats.res += equipment.armor.magicResistance;
        }
        if (equipment.armor.speedPenalty) {
            unit.stats.spd -= equipment.armor.speedPenalty;
        }
        if (equipment.armor.speedBonus) {
            unit.stats.spd += equipment.armor.speedBonus;
        }
    }

    // Apply shield bonuses
    if (equipment.shield) {
        if (equipment.shield.defense) {
            unit.stats.def += equipment.shield.defense;
        }
        if (equipment.shield.speedPenalty) {
            unit.stats.spd -= equipment.shield.speedPenalty;
        }
    }

    // Ensure stats don't go below 0
    unit.stats.spd = Math.max(0, unit.stats.spd);
}
