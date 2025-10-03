import type { Ability, StatusEffect } from "./types";

const burn: StatusEffect = {
    id: "burn",
    name: "Burning",
    duration: 2,
    effects: { hp: -2 }
};

const rally: StatusEffect = {
    id: "rally",
    name: "Rallied",
    duration: 2,
    effects: { spd: 2, def: 1 }
};

const root: StatusEffect = {
    id: "root",
    name: "Rooted",
    duration: 2,
    effects: { move: 0 }
};

export const ABILITIES: Record<string, Ability> = {
    // Basic melee and ranged attacks
    "basic_slash": {
        id: "basic_slash",
        name: "Slash",
        type: "skill",
        apCost: 1,
        range: 1,
        damage: { amount: 8, type: "physical" },
        shape: "single",
        cooldown: 0
    },

    "basic_shot": {
        id: "basic_shot",
        name: "Bow Shot",
        type: "skill",
        apCost: 1,
        range: 5,
        damage: { amount: 7, type: "physical" },
        shape: "single",
        cooldown: 0
    },

    // Spells - offensive
    "fireball": {
        id: "fireball",
        name: "Fireball",
        type: "spell",
        apCost: 1,
        range: 6,
        damage: { amount: 12, type: "fire" },
        shape: "blast1",
        aoeRadius: 1,
        cooldown: 2,
        description: "Hurls a blazing orb that explodes on impact"
    },

    "lightning_bolt": {
        id: "lightning_bolt",
        name: "Lightning Bolt",
        type: "spell",
        apCost: 1,
        range: 8,
        damage: { amount: 10, type: "lightning" },
        shape: "line",
        cooldown: 1,
        description: "Strikes enemies in a straight line"
    },

    "frost_nova": {
        id: "frost_nova",
        name: "Frost Nova",
        type: "spell",
        apCost: 1,
        range: 0,
        damage: { amount: 6, type: "frost" },
        shape: "blast2",
        aoeRadius: 2,
        cooldown: 3,
        description: "Freezes all nearby enemies"
    },

    // Spells - utility
    "heal": {
        id: "heal",
        name: "Heal",
        type: "spell",
        apCost: 1,
        range: 4,
        healing: 10,
        shape: "ally",
        cooldown: 1,
        description: "Restores health to an ally"
    },

    "entangle": {
        id: "entangle",
        name: "Entangle",
        type: "spell",
        apCost: 1,
        range: 5,
        shape: "single",
        cooldown: 2,
        description: "Magical vines root an enemy in place"
    },

    "teleport": {
        id: "teleport",
        name: "Teleport",
        type: "spell",
        apCost: 1,
        range: 6,
        shape: "self",
        cooldown: 4,
        description: "Instantly move to target location"
    },

    // Commander abilities (Hero-only)
    "rally": {
        id: "rally",
        name: "Rally",
        type: "command",
        apCost: 0,
        range: 0,
        shape: "ally",
        cooldown: 3,
        description: "Inspire all allies with increased speed and defense"
    },

    "meteor_strike": {
        id: "meteor_strike",
        name: "Meteor Strike",
        type: "command",
        apCost: 0,
        range: 8,
        shape: "blast2",
        aoeRadius: 2,
        cooldown: 5,
        damage: { amount: 20, type: "fire" },
        description: "Call down a devastating meteor from the heavens"
    },

    "tactical_advance": {
        id: "tactical_advance",
        name: "Tactical Advance",
        type: "command",
        apCost: 0,
        range: 0,
        shape: "ally",
        cooldown: 4,
        description: "Grant all allies an extra move action this turn"
    },

    "inspiring_presence": {
        id: "inspiring_presence",
        name: "Inspiring Presence",
        type: "command",
        apCost: 0,
        range: 0,
        shape: "ally",
        cooldown: 2,
        healing: 5,
        description: "Restore morale and health to all allies"
    }
};

// Skill sets by archetype for easy assignment
export const ARCHETYPE_SKILLS: Record<string, string[]> = {
    // Verdance archetypes
    "greenwarden": ["entangle", "heal", "basic_slash"],
    "thornknight": ["basic_slash", "rally"],
    "beastcaller": ["basic_shot", "heal"],
    "elementalist": ["fireball", "lightning_bolt"],
    "verdant_scholar": ["heal", "teleport"],
    "sylvan_archer": ["basic_shot", "entangle"],
    "grove_protector": ["basic_slash", "heal"],
    "nature_spirit": ["heal", "entangle", "frost_nova"],

    // Ashenreach archetypes  
    "ashblade": ["basic_slash", "fireball"],
    "voidcaller": ["lightning_bolt", "teleport"],
    "cindermage": ["fireball", "frost_nova"],
    "shadow_hunter": ["basic_shot", "teleport"],
    "ember_knight": ["basic_slash", "fireball"],
    "storm_rider": ["lightning_bolt", "basic_shot"],
    "void_scholar": ["teleport", "lightning_bolt"],
    "flame_warden": ["fireball", "heal"],

    // Skyvault archetypes
    "stormbreaker": ["lightning_bolt", "basic_slash"],
    "crystalguard": ["basic_slash", "heal"],
    "wind_dancer": ["basic_shot", "teleport"],
    "sky_mage": ["lightning_bolt", "frost_nova"],
    "thunder_knight": ["basic_slash", "lightning_bolt"],
    "crystal_sage": ["heal", "frost_nova"],
    "aerial_scout": ["basic_shot", "teleport"],
    "storm_caller": ["lightning_bolt", "fireball"],

    // Generic fallbacks
    "warrior": ["basic_slash"],
    "archer": ["basic_shot"],
    "mage": ["fireball", "heal"],
    "cleric": ["heal", "basic_slash"],
    "rogue": ["basic_slash", "teleport"],
    "ranger": ["basic_shot", "entangle"]
};

export const COMMANDER_ABILITIES = [
    "rally",
    "meteor_strike",
    "tactical_advance",
    "inspiring_presence"
];

export function getSkillsForArchetype(archetype: string): string[] {
    const key = archetype.toLowerCase().replace(/\s+/g, '');
    return ARCHETYPE_SKILLS[key] || ARCHETYPE_SKILLS["warrior"];
}

export function getCommanderAbilities(): string[] {
    return COMMANDER_ABILITIES;
}