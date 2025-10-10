/**
 * Canvas 11 - Progression Data Catalog
 * 
 * Content definitions for scars, curses, revival paths, and reagents
 * Designed for easy modding and expansion
 */

import type { DamageTag } from './types';

/**
 * Reagent items for revival rituals
 */
export interface ReagentItem {
    id: string;
    name: string;
    description: string;
    rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
    basePrice: number;
    sources: string[]; // Where to obtain
    tags: string[];
}

/**
 * Revival reagent catalog
 */
export const REVIVAL_REAGENTS: ReagentItem[] = [
    // Common Revival reagents
    {
        id: 'heartbloom_resin',
        name: 'Heartbloom Resin',
        description: 'Sticky sap from the rare Heartbloom tree, said to restore vitality',
        rarity: 'uncommon',
        basePrice: 150,
        sources: ['Herbalist shops', 'Forest foraging', 'Sylvanborn traders'],
        tags: ['revival', 'healing', 'nature']
    },
    {
        id: 'spirit_salt',
        name: 'Spirit Salt',
        description: 'Crystallized essence from sacred springs, anchors the soul',
        rarity: 'common',
        basePrice: 50,
        sources: ['Temple shops', 'Salt mines', 'Alchemist vendors'],
        tags: ['revival', 'spirit', 'sacred']
    },
    
    // Heroic Revival reagents
    {
        id: 'phoenix_ash',
        name: 'Phoenix Ash',
        description: 'Ash from a phoenix rebirth, holds the power of renewal',
        rarity: 'rare',
        basePrice: 800,
        sources: ['Rare merchants', 'Phoenix nests', 'High-tier quest rewards'],
        tags: ['revival', 'fire', 'legendary']
    },
    {
        id: 'memory_thread',
        name: 'Memory Thread',
        description: 'Woven from forgotten dreams, binds the soul to identity',
        rarity: 'rare',
        basePrice: 600,
        sources: ['Dream weavers', 'Mystic shops', 'Ancient libraries'],
        tags: ['revival', 'memory', 'psychic']
    },
    
    // Nature Revival reagents
    {
        id: 'elder_seeds',
        name: 'Elder Seeds',
        description: 'Seeds from the oldest trees, containing primordial life force',
        rarity: 'uncommon',
        basePrice: 80,
        sources: ['Sylvanborn groves', 'Ancient forests', 'Nature priests'],
        tags: ['revival', 'nature', 'growth']
    },
    
    // Additional reagents for future paths
    {
        id: 'moonwater',
        name: 'Moonwater',
        description: 'Water blessed under a full moon, cleanses spiritual corruption',
        rarity: 'uncommon',
        basePrice: 120,
        sources: ['Temple fountains', 'Lunar shrines', 'Night markets'],
        tags: ['healing', 'purification', 'lunar']
    },
    {
        id: 'soul_gem',
        name: 'Soul Gem',
        description: 'Crystal that can temporarily house a departing soul',
        rarity: 'epic',
        basePrice: 1500,
        sources: ['Master enchanters', 'Soul cairns', 'Legendary merchants'],
        tags: ['revival', 'soul', 'crystal']
    },
    {
        id: 'blood_lotus',
        name: 'Blood Lotus',
        description: 'Rare flower that blooms only on battlefields',
        rarity: 'rare',
        basePrice: 400,
        sources: ['Battlefields', 'War zones', 'Death cultists'],
        tags: ['healing', 'blood', 'necromantic']
    }
];

/**
 * Damage tag to injury type mappings
 */
export const DAMAGE_TAG_MAPPINGS: Record<DamageTag, {
    primaryInjury: string;
    secondaryEffects: string[];
    recommendedTreatment: string[];
}> = {
    crushing: {
        primaryInjury: 'Broken bones and internal trauma',
        secondaryEffects: ['Reduced mobility', 'Persistent pain', 'Impaired dexterity'],
        recommendedTreatment: ['Bonesetting', 'Splints', 'Healing potion', 'Rest (3-7 days)']
    },
    piercing: {
        primaryInjury: 'Deep puncture wounds with bleeding',
        secondaryEffects: ['Blood loss', 'Infection risk', 'Organ damage'],
        recommendedTreatment: ['Pressure bandages', 'Antiseptic', 'Healing potion', 'Sutures']
    },
    slashing: {
        primaryInjury: 'Severe lacerations and tissue damage',
        secondaryEffects: ['Heavy bleeding', 'Scarring', 'Nerve damage'],
        recommendedTreatment: ['Bandages', 'Clotting powder', 'Healing salve', 'Stitches']
    },
    fire: {
        primaryInjury: 'Burns and scorched tissue',
        secondaryEffects: ['Pain', 'Infection risk', 'Fluid loss', 'Scarring'],
        recommendedTreatment: ['Cooling salve', 'Aloe extract', 'Clean water', 'Burn wraps']
    },
    frost: {
        primaryInjury: 'Frostbite and hypothermia',
        secondaryEffects: ['Numbness', 'Tissue death', 'Circulation issues'],
        recommendedTreatment: ['Warming tonic', 'Heat stones', 'Circulation potion', 'Gentle warming']
    },
    poison: {
        primaryInjury: 'Toxic poisoning and organ strain',
        secondaryEffects: ['Nausea', 'Weakness', 'Organ damage', 'Necrosis'],
        recommendedTreatment: ['Antidote', 'Cleansing potion', 'Activated charcoal', 'Detox herbs']
    },
    necrotic: {
        primaryInjury: 'Withering tissue and cell death',
        secondaryEffects: ['Corruption', 'Weakness', 'Soul damage', 'Spreading decay'],
        recommendedTreatment: ['Holy water', 'Restoration draught', 'Life essence', 'Divine magic']
    },
    lightning: {
        primaryInjury: 'Electrical burns and nerve damage',
        secondaryEffects: ['Paralysis', 'Heart arrhythmia', 'Memory loss', 'Seizures'],
        recommendedTreatment: ['Grounding crystal', 'Nerve tonic', 'Muscle relaxant', 'Heart stabilizer']
    },
    psychic: {
        primaryInjury: 'Mental trauma and psychological damage',
        secondaryEffects: ['Confusion', 'Nightmares', 'Memory gaps', 'Personality changes'],
        recommendedTreatment: ['Mind ward', 'Clarity elixir', 'Dream catchers', 'Counseling']
    },
    holy: {
        primaryInjury: 'Divine energy burns',
        secondaryEffects: ['Spiritual pain', 'Guilt manifestation', 'Aura disruption'],
        recommendedTreatment: ['Neutralizing agent', 'Balance potion', 'Shadow essence', 'Meditation']
    },
    shadow: {
        primaryInjury: 'Corrupting dark energy',
        secondaryEffects: ['Soul taint', 'Light sensitivity', 'Dark thoughts', 'Vitality drain'],
        recommendedTreatment: ['Holy water', 'Purification ritual', 'Light essence', 'Blessing']
    }
};

/**
 * Scar examples with lore
 */
export const SCAR_LORE: Record<string, {
    story: string;
    visibleDescription?: string;
    hiddenDescription?: string;
    commonCauses: string[];
}> = {
    'Shattered Hand': {
        story: 'Your hand was crushed beyond normal healing. The bones mended, but never quite right. You\'ve learned to compensate.',
        visibleDescription: 'Gnarled fingers with unnatural angles',
        commonCauses: ['Crushing blow from heavy weapon', 'Trapped hand in battle', 'Failed parry attempt']
    },
    'Broken Ribs': {
        story: 'Ribs cracked and healed poorly. Every deep breath reminds you of that day.',
        hiddenDescription: 'Visible only when breathing heavily',
        commonCauses: ['Blunt force trauma', 'Thrown into wall', 'Trampled in combat']
    },
    'Deep Scar': {
        story: 'A blade cut deep, leaving a vivid reminder. Some see it as a mark of survival, others as weakness.',
        visibleDescription: 'Long, raised scar across visible skin',
        commonCauses: ['Sword wound', 'Beast claws', 'Dagger strike']
    },
    'Smoke-Scorched Lungs': {
        story: 'You breathed in too much smoke and flame. Your breathing is forever labored, but at least you survived.',
        hiddenDescription: 'Chronic coughing, especially in smoke',
        commonCauses: ['Building fire', 'Dragon breath', 'Alchemical explosion']
    },
    'Burn Scars': {
        story: 'Fire left its mark on your flesh. The twisted skin tells a story of pain, but also teaches you respect for flame.',
        visibleDescription: 'Twisted, discolored skin from burns',
        commonCauses: ['Fire spell', 'Burning building', 'Forge accident']
    },
    'Frostbitten Extremities': {
        story: 'The cold took parts of you. Fingers and toes never quite warmed up again, but you gained an understanding of winter\'s bite.',
        visibleDescription: 'Blackened fingertips and toes',
        commonCauses: ['Blizzard exposure', 'Ice magic', 'Arctic expedition']
    },
    'Withered Flesh': {
        story: 'Necrotic energy aged your flesh beyond its years. Part of you died that day, but what remains is stronger.',
        visibleDescription: 'Pale, aged skin with dark veins',
        commonCauses: ['Undead attack', 'Necromantic spell', 'Death curse']
    },
    'Death\'s Touch': {
        story: 'You returned from death, but it left its mark. You bear the stigma of the underworld.',
        visibleDescription: 'Pale skin, dark circles under eyes, cold to touch',
        commonCauses: ['Successful revival', 'Near-death experience']
    },
    'Soul Fracture': {
        story: 'Part of your soul remains beyond the veil. You see things others cannot, for better or worse.',
        hiddenDescription: 'Visible only to those with spirit sight',
        commonCauses: ['Flawed revival', 'Soul magic backlash', 'Spirit possession']
    },
    'Witch-Sight': {
        story: 'Psychic trauma opened your mind to realms unseen. Reality is no longer quite solid.',
        hiddenDescription: 'Eyes occasionally glow faintly',
        commonCauses: ['Mind magic', 'Eldritch horror encounter', 'Dream realm exposure']
    },
    'Iron Stitching': {
        story: 'A desperate field surgeon saved your life with crude methods. The metal stitches remain, a testament to survival.',
        visibleDescription: 'Visible metal stitches across wound',
        commonCauses: ['Battlefield surgery', 'Desperate healing attempt', 'Makeshift medical care']
    }
};

/**
 * Curse lore and removal methods
 */
export const CURSE_LORE: Record<string, {
    story: string;
    removalMethods: Array<{
        method: string;
        cost: number;
        difficulty: 'easy' | 'medium' | 'hard' | 'extreme';
        location: string;
    }>;
    livingWithCurse: string;
}> = {
    'Spirit Debt': {
        story: 'The spirits brought you back, but they demand payment. A portion of everything you earn must be offered back.',
        removalMethods: [
            {
                method: 'Pay off the debt with a large offering',
                cost: 5000,
                difficulty: 'medium',
                location: 'Any spirit shrine'
            },
            {
                method: 'Complete a quest for the spirit realm',
                cost: 0,
                difficulty: 'hard',
                location: 'Spirit realm portal'
            }
        ],
        livingWithCurse: 'Set aside gold each season for spirit offerings. Consider it the price of a second chance.'
    },
    'Hollow Soul': {
        story: 'Part of you remains beyond the veil. You feel incomplete, less than you were.',
        removalMethods: [
            {
                method: 'Soul restoration ritual',
                cost: 1000,
                difficulty: 'hard',
                location: 'Master soul mage'
            }
        ],
        livingWithCurse: 'The curse fades with time (30 days). Use the spirit sight it grants while it lasts.'
    },
    'Death\'s Shadow': {
        story: 'You caught the attention of dark forces. The undead sense you as one of their own.',
        removalMethods: [
            {
                method: 'Purification by high priest',
                cost: 2000,
                difficulty: 'medium',
                location: 'Major temple'
            },
            {
                method: 'Destroy a major undead threat',
                cost: 0,
                difficulty: 'extreme',
                location: 'Vampire lord lair or lich tomb'
            }
        ],
        livingWithCurse: 'Use your undead detection to your advantage. Turn hunters into the hunted.'
    },
    'Fractured Memory': {
        story: 'Death scrambled your memories. You forget things you shouldn\'t, remember things that never happened.',
        removalMethods: [
            {
                method: 'Memory restoration therapy',
                cost: 500,
                difficulty: 'easy',
                location: 'Mind healers, temples'
            }
        ],
        livingWithCurse: 'Keep a journal. The curse fades in 14 days - your mind will heal.'
    },
    'Corpse Cold': {
        story: 'Death\'s chill lingers in your bones. You feel perpetually cold, though you resist actual frost.',
        removalMethods: [
            {
                method: 'Warming ritual by fire priest',
                cost: 800,
                difficulty: 'medium',
                location: 'Fire temple or forge shrine'
            }
        ],
        livingWithCurse: 'Wear warm clothes. The frost resistance is useful in winter campaigns. Fades in 21 days.'
    }
};

/**
 * Revival site tiers and requirements
 */
export interface RevivalSite {
    tier: number;
    name: string;
    description: string;
    locations: string[];
    requirements: string[];
    bonusChance: number;
}

export const REVIVAL_SITES: RevivalSite[] = [
    {
        tier: 1,
        name: 'Village Shrine',
        description: 'Small shrine maintained by local priests',
        locations: ['Most settlements', 'Crossroads', 'Holy sites'],
        requirements: ['Access to settlement', 'Basic ritual knowledge'],
        bonusChance: 0.0
    },
    {
        tier: 2,
        name: 'Temple Sanctum',
        description: 'Dedicated chamber in major temple with sacred relics',
        locations: ['City temples', 'Monastery sanctuaries', 'Cathedral crypts'],
        requirements: ['Temple membership or donation', 'Priest assistance'],
        bonusChance: 0.05
    },
    {
        tier: 3,
        name: 'Ancient Nexus',
        description: 'Place where the veil between life and death is thin',
        locations: ['Standing stones', 'Ancient battlefields', 'Burial mounds'],
        requirements: ['Knowledge of location', 'Ritual mastery', 'Favorable lunar phase'],
        bonusChance: 0.10
    },
    {
        tier: 4,
        name: 'Death Gate',
        description: 'Direct portal to the realm of death',
        locations: ['Legendary sites', 'World wonders', 'Forbidden places'],
        requirements: ['Epic quest completion', 'Powerful allies', 'Rare permissions'],
        bonusChance: 0.15
    }
];

/**
 * Helper function to get reagent by id
 */
export function getReagent(itemId: string): ReagentItem | undefined {
    return REVIVAL_REAGENTS.find(r => r.id === itemId);
}

/**
 * Helper function to get total reagent cost
 */
export function calculateReagentCost(reagentIds: string[]): number {
    return reagentIds.reduce((total, id) => {
        const reagent = getReagent(id);
        return total + (reagent?.basePrice || 0);
    }, 0);
}

/**
 * Helper function to get all reagents by rarity
 */
export function getReagentsByRarity(rarity: ReagentItem['rarity']): ReagentItem[] {
    return REVIVAL_REAGENTS.filter(r => r.rarity === rarity);
}

/**
 * Helper function to get damage tag treatment
 */
export function getTreatmentForDamageTag(tag: DamageTag): string[] {
    return DAMAGE_TAG_MAPPINGS[tag]?.recommendedTreatment || [];
}

/**
 * Helper function to get scar lore
 */
export function getScarLore(scarName: string): typeof SCAR_LORE[string] | undefined {
    return SCAR_LORE[scarName];
}

/**
 * Helper function to get curse removal options
 */
export function getCurseRemovalOptions(curseName: string): typeof CURSE_LORE[string]['removalMethods'] | undefined {
    return CURSE_LORE[curseName]?.removalMethods;
}

/**
 * Helper function to find nearest revival site
 */
export function getRevivalSite(tier: number): RevivalSite | undefined {
    return REVIVAL_SITES.find(s => s.tier === tier);
}
