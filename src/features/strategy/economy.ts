/**
 * Economy System - Strategic Layer
 * World Engine faction economics with resource management and seasonal cycles
 */

import type { CampaignState, FactionId, Treasury, Territory } from './types';

function zero(): Treasury {
    return { gold: 0, mana: 0, materials: 0, food: 0 };
}

function add(a: Treasury, b: Treasury): Treasury {
    return {
        gold: a.gold + b.gold,
        mana: a.mana + b.mana,
        materials: a.materials + b.materials,
        food: a.food + b.food
    };
}

function scale(t: Treasury, k: number): Treasury {
    return {
        gold: Math.round(t.gold * k),
        mana: Math.round(t.mana * k),
        materials: Math.round(t.materials * k),
        food: Math.round(t.food * k)
    };
}

/**
 * Calculate base income from territory tags (World Engine resources)
 */
function baseIncomeFor(t: Territory): Treasury {
    const out = zero();

    // Resource nodes
    if (t.tags.includes('mine')) out.gold += 60;
    if (t.tags.includes('crystal')) out.mana += 30;
    if (t.tags.includes('lumber')) out.materials += 30;
    if (t.tags.includes('farm')) out.food += 40;

    // Special World Engine sites
    if (t.tags.includes('capital')) {
        out.gold += 50;
        out.mana += 10;
    }
    if (t.tags.includes('shrine')) {
        out.mana += 20; // Magical sites provide mana
    }
    if (t.tags.includes('ruins')) {
        out.materials += 15; // Archaeological materials
    }
    if (t.tags.includes('port')) {
        out.gold += 25; // Trade income
    }
    if (t.tags.includes('road')) {
        out.gold += 10; // Trade route bonus
    }

    return out;
}

/**
 * Calculate faction-specific bonuses for World Engine species
 */
function getFactionBonus(territory: Territory, faction: any): number {
    if (!faction) return 1.0;

    let bonus = 1.0;

    // Species-specific bonuses based on World Engine lore
    switch (faction.species) {
        case 'sylvanborn':
            if (territory.tags.includes('lumber') || territory.tags.includes('farm')) {
                bonus += 0.2; // +20% nature resource bonus
            }
            break;
        case 'nightborn':
            if (territory.tags.includes('crystal') || territory.tags.includes('shrine')) {
                bonus += 0.15; // +15% magical resource bonus
            }
            break;
        case 'stormcaller':
            if (territory.tags.includes('port') || territory.tags.includes('mine')) {
                bonus += 0.15; // +15% trade and mining bonus
            }
            break;
        case 'human':
            if (territory.tags.includes('capital') || territory.tags.includes('road')) {
                bonus += 0.1; // +10% administrative bonus
            }
            break;
    }

    return bonus;
}

/**
 * Calculate seasonal income for all factions
 */
export function calcIncome(s: CampaignState): Record<FactionId, Treasury> {
    const out: Record<string, Treasury> = {};

    // Initialize faction treasuries
    for (const f of Array.from(s.factions.keys())) {
        out[f] = zero();
    }

    for (const t of Array.from(s.territories.values())) {
        const base = baseIncomeFor(t);
        if (base.gold + base.mana + base.materials + base.food === 0) continue;

        const faction = s.factions.get(t.owner);

        // Apply modifiers
        const unrestK = Math.max(0, 1 - t.unrest / 150); // Unrest penalty
        const supplyK = t.supply ? 1 : 0.5; // Out of supply penalty
        const siegeK = (t.site?.siege?.level || 0) > 0 ? 0.75 : 1; // Siege penalty
        const factionK = getFactionBonus(t, faction); // Species bonus

        const mult = unrestK * supplyK * siegeK * factionK;
        const eff = scale(base, mult);

        out[t.owner] = add(out[t.owner] || zero(), eff);
    }

    return out as Record<FactionId, Treasury>;
}

/**
 * Apply calculated income to faction treasuries
 */
export function applyIncome(s: CampaignState, income: Record<FactionId, Treasury>): void {
    for (const [fid, t] of Object.entries(income)) {
        const f = s.factions.get(fid as any);
        if (!f) continue;

        f.treasury.gold += t.gold;
        f.treasury.mana += t.mana;
        f.treasury.materials += t.materials;
        f.treasury.food += t.food;

        // Log significant income
        if (t.gold + t.mana + t.materials + t.food > 0) {
            s.logs.push(`[income] ${f.name}: +${t.gold}g +${t.mana}m +${t.materials}mat +${t.food}f`);
        }
    }
}

/**
 * Calculate and deduct upkeep costs for all units
 */
export function settleUpkeep(s: CampaignState): void {
    const perFaction: Record<string, Treasury> = {};

    for (const [_tid, t] of Array.from(s.territories.entries())) {
        if (t.garrison.length === 0) continue;

        const mult = t.supply ? 1 : 1.25; // Out-of-supply upkeep +25%
        let totalUpkeep = zero();

        // Calculate upkeep based on garrison composition
        for (const _unitId of t.garrison) {
            // For now, use average upkeep based on unit count
            // This will be replaced with actual unit data from character system
            const baseUpkeep = { gold: 12, mana: 2, materials: 3, food: 6 };
            totalUpkeep = add(totalUpkeep, baseUpkeep);
        }

        const finalUpkeep = scale(totalUpkeep, mult);
        perFaction[t.owner] = add(perFaction[t.owner] || zero(), finalUpkeep);
    }

    // Apply upkeep costs
    for (const [fid, cost] of Object.entries(perFaction)) {
        const f = s.factions.get(fid as any);
        if (!f) continue;

        f.treasury.gold -= cost.gold;
        f.treasury.mana -= cost.mana;
        f.treasury.materials -= cost.materials;
        f.treasury.food -= cost.food;

        s.logs.push(`[upkeep] ${f.name}: -${cost.gold}g -${cost.mana}m -${cost.materials}mat -${cost.food}f`);
    }
}

/**
 * Handle resource deficits and their consequences
 */
export function resolveDeficits(s: CampaignState): void {
    for (const f of Array.from(s.factions.values())) {
        // Gold deficit: unit desertions and unrest
        if (f.treasury.gold < 0) {
            const deficit = Math.abs(f.treasury.gold);
            const desertionCount = Math.ceil(deficit / 50);
            let remaining = desertionCount;

            s.logs.push(`[crisis] ${f.name} gold deficit: ${deficit}, ${desertionCount} units may desert`);

            for (const t of Array.from(s.territories.values())) {
                if (remaining <= 0) break;
                if (t.owner !== f.id) continue;

                while (remaining > 0 && t.garrison.length > 0) {
                    t.garrison.pop();
                    t.unrest = Math.min(100, t.unrest + 5);
                    remaining--;
                    s.logs.push(`[desertion] ${t.id}: unit deserted, unrest +5`);
                }
            }
            f.treasury.gold = 0; // Reset deficit after handling
        }

        // Mana deficit: magical sites become unstable
        if (f.treasury.mana < 0) {
            for (const t of Array.from(s.territories.values())) {
                if (t.owner !== f.id) continue;
                if (t.tags.includes('crystal') || t.tags.includes('shrine')) {
                    t.unrest = Math.min(100, t.unrest + 3);
                    s.logs.push(`[instability] ${t.id}: magical unrest +3 (mana shortage)`);
                }
            }
            f.treasury.mana = 0;
        }

        // Materials deficit: construction delays
        if (f.treasury.materials < 0) {
            for (const t of Array.from(s.territories.values())) {
                if (t.owner !== f.id) continue;
                const site = t.site;
                if (!site) continue;

                const upgrade = site.upgrades.find(u => !u.done && u.eta > 0);
                if (upgrade) {
                    upgrade.eta += 1;
                    s.logs.push(`[delay] ${t.id}: construction of ${upgrade.id} delayed +1 season`);
                    break;
                }
            }
            f.treasury.materials = 0;
        }

        // Food deficit: widespread unrest and morale damage
        if (f.treasury.food < 0) {
            const famine = Math.abs(f.treasury.food);
            const unrestIncrease = Math.min(15, Math.ceil(famine / 10));

            for (const t of Array.from(s.territories.values())) {
                if (t.owner === f.id) {
                    t.unrest = Math.min(100, t.unrest + unrestIncrease);
                }
            }

            if (f.morale !== undefined) {
                f.morale = Math.max(0, f.morale - Math.ceil(famine / 5));
            }

            s.logs.push(`[famine] ${f.name}: food shortage causes widespread unrest +${unrestIncrease}`);
            f.treasury.food = 0;
        }
    }
}