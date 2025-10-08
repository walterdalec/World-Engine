/**
 * Time & Seasons System - Strategic Layer
 * World Engine campaign progression with seasonal events and economics
 */

import type { CampaignState, Season } from './types';
import { recomputeSupply } from './world';
import { calcIncome, applyIncome, settleUpkeep, resolveDeficits } from './economy';

const SEASONS: Season[] = ['Spring', 'Summer', 'Fall', 'Winter'];

/**
 * Advance to next season and year
 */
export function nextSeason(s: CampaignState): void {
    const currentIndex = SEASONS.indexOf(s.season);
    const nextIndex = (currentIndex + 1) % SEASONS.length;

    s.season = SEASONS[nextIndex];
    s.turn += 1;

    // Advance year when returning to Spring
    if (s.season === 'Spring') {
        s.year += 1;
        s.logs.push(`[calendar] Year ${s.year} begins`);
    }

    s.logs.push(`[calendar] ${s.season} ${s.year}, Turn ${s.turn}`);
}

/**
 * Execute start-of-season events
 */
export function runSeasonStart(s: CampaignState): void {
    s.logs.push(`[season] ${s.season} ${s.year} begins`);

    // Recompute supply lines
    recomputeSupply(s);

    // Seasonal events based on World Engine lore
    switch (s.season) {
        case 'Spring':
            handleSpringEvents(s);
            break;
        case 'Summer':
            handleSummerEvents(s);
            break;
        case 'Fall':
            handleFallEvents(s);
            break;
        case 'Winter':
            handleWinterEvents(s);
            break;
    }
}

/**
 * Execute end-of-season events
 */
export function runSeasonEnd(s: CampaignState): void {
    // Economic cycle
    const income = calcIncome(s);
    applyIncome(s, income);
    settleUpkeep(s);
    resolveDeficits(s);

    // Unrest decay and garrison effects
    handleUnrestDecay(s);

    // Advance construction and recruitment
    tickBuildings(s);

    s.logs.push(`[season] ${s.season} ${s.year} ends`);
}

/**
 * Handle Spring season events (renewal, growth)
 */
function handleSpringEvents(s: CampaignState): void {
    // Spring growth bonus for farms
    for (const territory of Array.from(s.territories.values())) {
        if (territory.tags.includes('farm')) {
            const faction = s.factions.get(territory.owner);
            if (faction) {
                faction.treasury.food += 10;
                s.logs.push(`[spring] ${territory.id}: spring growth +10 food`);
            }
        }
    }

    // Morale recovery in Spring
    for (const faction of Array.from(s.factions.values())) {
        if (faction.morale !== undefined) {
            faction.morale = Math.min(100, faction.morale + 5);
        }
    }
}

/**
 * Handle Summer season events (peak activity)
 */
function handleSummerEvents(s: CampaignState): void {
    // Summer trade bonus for ports and roads
    for (const territory of Array.from(s.territories.values())) {
        if (territory.tags.includes('port') || territory.tags.includes('road')) {
            const faction = s.factions.get(territory.owner);
            if (faction) {
                faction.treasury.gold += 8;
                s.logs.push(`[summer] ${territory.id}: summer trade +8 gold`);
            }
        }
    }

    // Faster recruitment in Summer
    for (const territory of Array.from(s.territories.values())) {
        if (territory.site?.recruitQueue) {
            for (const job of territory.site.recruitQueue) {
                if (job.eta > 1) {
                    job.eta -= 1;
                    s.logs.push(`[summer] ${territory.id}: recruitment accelerated`);
                }
            }
        }
    }
}

/**
 * Handle Fall season events (harvest, preparation)
 */
function handleFallEvents(s: CampaignState): void {
    // Fall harvest bonus
    for (const territory of Array.from(s.territories.values())) {
        if (territory.tags.includes('farm') || territory.tags.includes('lumber')) {
            const faction = s.factions.get(territory.owner);
            if (faction) {
                faction.treasury.food += 15;
                faction.treasury.materials += 5;
                s.logs.push(`[fall] ${territory.id}: harvest +15 food +5 materials`);
            }
        }
    }
}

/**
 * Handle Winter season events (hardship, conservation)
 */
function handleWinterEvents(s: CampaignState): void {
    // Winter upkeep increase
    for (const faction of Array.from(s.factions.values())) {
        const winterCost = Math.floor(faction.treasury.food * 0.1);
        faction.treasury.food -= winterCost;
        if (winterCost > 0) {
            s.logs.push(`[winter] ${faction.name}: winter costs -${winterCost} food`);
        }
    }

    // Magical sites provide warmth and protection
    for (const territory of Array.from(s.territories.values())) {
        if (territory.tags.includes('shrine') || territory.tags.includes('crystal')) {
            territory.unrest = Math.max(0, territory.unrest - 3);
            s.logs.push(`[winter] ${territory.id}: magical warmth reduces unrest -3`);
        }
    }
}

/**
 * Handle unrest decay and garrison stabilization effects
 */
function handleUnrestDecay(s: CampaignState): void {
    for (const territory of Array.from(s.territories.values())) {
        if (territory.unrest > 0) {
            const baseDecay = 5;
            const garrisonBonus = Math.min(7, territory.garrison.length);
            const capitalBonus = territory.tags.includes('capital') ? 3 : 0;

            const totalDecay = baseDecay + garrisonBonus + capitalBonus;
            territory.unrest = Math.max(0, territory.unrest - totalDecay);

            if (totalDecay > baseDecay) {
                s.logs.push(`[stability] ${territory.id}: unrest -${totalDecay} (garrison effect)`);
            }
        }
    }
}

/**
 * Advance building construction and recruitment queues
 */
function tickBuildings(s: CampaignState): void {
    for (const territory of Array.from(s.territories.values())) {
        const site = territory.site;
        if (!site) continue;

        // Advance building upgrades
        for (const upgrade of site.upgrades) {
            if (!upgrade.done && upgrade.eta > 0) {
                upgrade.eta -= 1;
                if (upgrade.eta === 0) {
                    upgrade.done = true;
                    s.logs.push(`[construction] ${territory.id}: ${upgrade.id} completed`);
                    applyBuildingEffects(s, territory.id, upgrade.id);
                }
            }
        }

        // Advance recruitment
        for (let i = site.recruitQueue.length - 1; i >= 0; i--) {
            const job = site.recruitQueue[i];
            job.eta -= 1;

            if (job.eta <= 0) {
                // Spawn new unit into garrison
                const unitId = `${job.unitType}_${territory.id}_${s.turn}`;
                territory.garrison.push(unitId);
                site.recruitQueue.splice(i, 1);

                s.logs.push(`[recruitment] ${territory.id}: ${job.unitType} recruited`);
            }
        }
    }
}

/**
 * Apply effects when buildings are completed
 */
function applyBuildingEffects(s: CampaignState, territoryId: string, buildingId: string): void {
    const territory = s.territories.get(territoryId);
    if (!territory) return;

    switch (buildingId) {
        case 'barracks':
            s.logs.push(`[building] ${territoryId}: recruitment capacity increased`);
            break;
        case 'workshop':
            s.logs.push(`[building] ${territoryId}: advanced units unlocked, materials efficiency improved`);
            break;
        case 'mage_tower':
            s.logs.push(`[building] ${territoryId}: magical units and abilities unlocked`);
            break;
        case 'granary':
            s.logs.push(`[building] ${territoryId}: food storage and stability improved`);
            break;
        case 'shrine':
            territory.tags.push('shrine');
            s.logs.push(`[building] ${territoryId}: shrine constructed, mana income increased`);
            break;
        case 'walls':
            s.logs.push(`[building] ${territoryId}: defensive walls constructed`);
            break;
    }
}

/**
 * Get seasonal modifier for various game mechanics
 */
export function getSeasonalModifier(season: Season, type: 'recruitment' | 'movement' | 'income' | 'upkeep'): number {
    switch (type) {
        case 'recruitment':
            return season === 'Summer' ? 0.8 : season === 'Winter' ? 1.2 : 1.0;
        case 'movement':
            return season === 'Winter' ? 1.5 : season === 'Summer' ? 0.9 : 1.0;
        case 'income':
            return season === 'Fall' ? 1.1 : season === 'Winter' ? 0.9 : 1.0;
        case 'upkeep':
            return season === 'Winter' ? 1.1 : 1.0;
        default:
            return 1.0;
    }
}

/**
 * Check if it's a good season for specific activities
 */
export function isGoodSeasonFor(season: Season, activity: 'war' | 'building' | 'trade' | 'magic'): boolean {
    switch (activity) {
        case 'war':
            return season === 'Summer' || season === 'Fall';
        case 'building':
            return season === 'Spring' || season === 'Summer';
        case 'trade':
            return season === 'Summer' || season === 'Fall';
        case 'magic':
            return season === 'Winter' || season === 'Spring';
        default:
            return true;
    }
}