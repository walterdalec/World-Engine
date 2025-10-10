/**
 * Canvas 09 - Goal Generation
 * 
 * Utility-based goal generation for faction AI
 * Goals derive from ethos + needs, scored by utility function
 */

import type {
    Faction,
    Goal,
    UtilityWeights,
    Intel,
    Army
} from './types';

// Default utility weights
export const DEFAULT_WEIGHTS: UtilityWeights = {
    value: 1.0,
    pressure: 0.8,
    ethos: 0.6,
    econ: 0.7,
    risk: -1.2,
    cost: -0.5
};

/**
 * Generate all possible goals for a faction
 */
export function generateGoals(
    faction: Faction,
    intel: Intel,
    armies: Army[],
    weights: UtilityWeights = DEFAULT_WEIGHTS
): Goal[] {
    const goals: Goal[] = [];

    // 1. Secure Heartland - garrison vulnerable border regions
    if (faction.doctrines.defensiveFocus) {
        goals.push(...generateSecureGoals(faction, intel, weights));
    }

    // 2. Expand - capture unclaimed/contested neighbor regions
    if (faction.doctrines.aggressiveExpansion && faction.regionIds.length < faction.caps.regions) {
        goals.push(...generateExpandGoals(faction, intel, weights));
    }

    // 3. Exploit - establish trade routes between tiered towns
    if (faction.doctrines.tradeOriented) {
        goals.push(...generateExploitGoals(faction, intel, weights));
    }

    // 4. Punish - raid enemy infrastructure
    if (faction.doctrines.raidingCulture && faction.stance === 'war') {
        goals.push(...generatePunishGoals(faction, intel, weights));
    }

    // 5. Escort - protect settlers/convoys to new sites
    if (faction.doctrines.settlerNation) {
        goals.push(...generateEscortGoals(faction, intel, weights));
    }

    // 6. Stabilize - hunt dens and reduce danger fields
    if (faction.doctrines.denHunters) {
        goals.push(...generateStabilizeGoals(faction, intel, weights));
    }

    // 7. Diplomacy - negotiate peace/tribute if needed
    if (faction.doctrines.diplomaticFirst || faction.treasury < 1000) {
        goals.push(...generateDiplomacyGoals(faction, intel, weights));
    }

    return goals.sort((a, b) => b.utility - a.utility);
}

/**
 * Secure Heartland goals - garrison low-tier border regions
 */
function generateSecureGoals(
    faction: Faction,
    intel: Intel,
    weights: UtilityWeights
): Goal[] {
    const goals: Goal[] = [];

    for (const regionId of faction.regionIds) {
        const regionIntel = intel.regionStates[regionId];
        if (!regionIntel) continue;

        // Identify vulnerable regions (low tier, low garrison, border)
        const isBorder = isRegionBorder(regionId, faction, intel);
        const isVulnerable = regionIntel.garrisonStrength < 50 && regionIntel.tier <= 2;

        if (isBorder && isVulnerable) {
            const borderThreat = calculateBorderThreat(regionId, faction, intel);
            const regionValue = regionIntel.tier * 100; // Higher tier = more valuable

            const utility =
                weights.value * regionValue +
                weights.pressure * borderThreat * 100 +
                weights.ethos * (faction.doctrines.defensiveFocus ? 50 : 0) -
                weights.risk * (borderThreat * 50) -
                weights.cost * 20; // Garrison cost

            goals.push({
                type: 'SecureHeartland',
                factionId: faction.id,
                utility,
                targetRegionId: regionId,
                value: regionValue,
                risk: borderThreat,
                cost: 20
            });
        }
    }

    return goals;
}

/**
 * Expand goals - capture neighbor regions
 */
function generateExpandGoals(
    faction: Faction,
    intel: Intel,
    weights: UtilityWeights
): Goal[] {
    const goals: Goal[] = [];

    // Find unclaimed/contested neighbors
    const neighbors = findNeighborRegions(faction, intel);

    for (const regionId of neighbors) {
        const regionIntel = intel.regionStates[regionId];
        if (!regionIntel) continue;

        // Skip if owned by strong ally
        if (regionIntel.owner && isAlly(faction, regionIntel.owner)) {
            continue;
        }

        const regionValue = regionIntel.tier * 150; // Value of capturing
        const defenseStrength = regionIntel.garrisonStrength;
        const captureRisk = defenseStrength / 100; // 0-1 scale

        const utility =
            weights.value * regionValue +
            weights.ethos * (faction.doctrines.aggressiveExpansion ? 80 : 0) +
            weights.econ * (regionIntel.tier * 30) -
            weights.risk * (captureRisk * 150) -
            weights.cost * 50; // Army deployment cost

        goals.push({
            type: 'Expand',
            factionId: faction.id,
            utility,
            targetRegionId: regionId,
            targetFactionId: regionIntel.owner || undefined,
            value: regionValue,
            risk: captureRisk,
            cost: 50
        });
    }

    return goals;
}

/**
 * Exploit goals - establish trade routes
 */
function generateExploitGoals(
    faction: Faction,
    intel: Intel,
    weights: UtilityWeights
): Goal[] {
    const goals: Goal[] = [];

    // Find pairs of owned tier 2+ regions for trade routes
    const tradeCities = faction.regionIds.filter(rid => {
        const r = intel.regionStates[rid];
        return r && r.tier >= 2;
    });

    for (let i = 0; i < tradeCities.length; i++) {
        for (let j = i + 1; j < tradeCities.length; j++) {
            const regionA = tradeCities[i];
            const regionB = tradeCities[j];

            const tierA = intel.regionStates[regionA]?.tier || 0;
            const tierB = intel.regionStates[regionB]?.tier || 0;
            const tradeValue = (tierA + tierB) * 25; // Gold per day

            // Calculate route danger (simplified)
            const routeDanger = calculateRouteDanger(regionA, regionB, intel);

            const utility =
                weights.value * tradeValue * 10 + // Long-term value
                weights.econ * tradeValue * 5 +
                weights.ethos * (faction.doctrines.tradeOriented ? 60 : 0) -
                weights.risk * (routeDanger * 100) -
                weights.cost * 30; // Escort cost

            goals.push({
                type: 'Exploit',
                factionId: faction.id,
                utility,
                targetRegionId: regionA,
                value: tradeValue * 10,
                risk: routeDanger,
                cost: 30
            });
        }
    }

    return goals;
}

/**
 * Punish goals - raid enemy infrastructure
 */
function generatePunishGoals(
    faction: Faction,
    intel: Intel,
    weights: UtilityWeights
): Goal[] {
    const goals: Goal[] = [];

    // Find hostile faction targets (forts, mines, towns)
    const enemies = Object.entries(faction.relations)
        .filter(([_fid, rel]) => rel.opinion < -30)
        .map(([fid]) => fid);

    for (const enemyId of enemies) {
        // Find enemy regions with valuable infrastructure
        const targetRegions = Object.entries(intel.regionStates)
            .filter(([_rid, r]) => r.owner === enemyId && r.tier >= 2)
            .map(([rid]) => rid);

        for (const regionId of targetRegions) {
            const regionIntel = intel.regionStates[regionId];
            if (!regionIntel) continue;

            const lootValue = regionIntel.tier * 80; // Gold from raid
            const defenseStrength = regionIntel.garrisonStrength;
            const raidRisk = defenseStrength / 80; // Raids less risky than sieges

            const utility =
                weights.value * lootValue +
                weights.ethos * (faction.doctrines.raidingCulture ? 70 : 0) +
                weights.pressure * -20 + // Reduces enemy pressure
                weights.econ * lootValue * 0.5 -
                weights.risk * (raidRisk * 120) -
                weights.cost * 40;

            goals.push({
                type: 'Punish',
                factionId: faction.id,
                utility,
                targetRegionId: regionId,
                targetFactionId: enemyId,
                value: lootValue,
                risk: raidRisk,
                cost: 40
            });
        }
    }

    return goals;
}

/**
 * Escort goals - protect settlers/convoys
 */
function generateEscortGoals(
    faction: Faction,
    intel: Intel,
    weights: UtilityWeights
): Goal[] {
    const goals: Goal[] = [];

    // Find suitable sites for new settlements (unclaimed tier 1 regions)
    const settlementSites = Object.entries(intel.regionStates)
        .filter(([_rid, r]) => !r.owner && r.tier === 1 && !r.contested)
        .map(([rid]) => rid);

    for (const regionId of settlementSites.slice(0, 3)) { // Limit to top 3
        const regionIntel = intel.regionStates[regionId];
        if (!regionIntel) continue;

        const settlementValue = 200; // Value of establishing new town
        const routeDanger = calculateSettlementRouteDanger(faction, regionId, intel);

        const utility =
            weights.value * settlementValue +
            weights.ethos * (faction.doctrines.settlerNation ? 90 : 0) +
            weights.econ * 100 - // Long-term economic boost
            weights.risk * (routeDanger * 100) -
            weights.cost * 60; // Settler convoy + escort cost

        goals.push({
            type: 'Escort',
            factionId: faction.id,
            utility,
            targetRegionId: regionId,
            convoyId: `convoy_${faction.id}_${regionId}`,
            value: settlementValue,
            risk: routeDanger,
            cost: 60
        });
    }

    return goals;
}

/**
 * Stabilize goals - hunt dens and reduce danger
 */
function generateStabilizeGoals(
    faction: Faction,
    intel: Intel,
    weights: UtilityWeights
): Goal[] {
    const goals: Goal[] = [];

    // Find dangerous regions (high danger fields)
    for (const dangerField of intel.dangerFields) {
        if (dangerField.threatLevel < 0.3) continue; // Only significant threats

        const regionIntel = intel.regionStates[dangerField.regionId];
        if (!regionIntel) continue;

        // Prioritize owned or neighbor regions
        const isOwned = faction.regionIds.includes(dangerField.regionId);
        const isNeighbor = findNeighborRegions(faction, intel).includes(dangerField.regionId);

        if (!isOwned && !isNeighbor) continue;

        const stabilityValue = dangerField.threatLevel * 100; // Safety improvement
        const combatRisk = dangerField.threatLevel * 0.8; // Den difficulty

        const utility =
            weights.value * stabilityValue +
            weights.ethos * (faction.doctrines.denHunters ? 75 : 0) +
            weights.pressure * (isOwned ? 50 : 20) -
            weights.risk * (combatRisk * 100) -
            weights.cost * 35;

        goals.push({
            type: 'Stabilize',
            factionId: faction.id,
            utility,
            targetRegionId: dangerField.regionId,
            targetPoi: dangerField.sources[0], // Target primary threat source
            value: stabilityValue,
            risk: combatRisk,
            cost: 35
        });
    }

    return goals;
}

/**
 * Diplomacy goals - negotiate peace/tribute
 */
function generateDiplomacyGoals(
    faction: Faction,
    intel: Intel,
    weights: UtilityWeights
): Goal[] {
    const goals: Goal[] = [];

    // Find hostile relations with high war exhaustion
    for (const [otherId, relation] of Object.entries(faction.relations)) {
        if (relation.opinion < -20 && relation.warExhaustion > 0.5) {
            const peaceValue = relation.warExhaustion * 150; // Value of ending war
            const negotiationCost = 50; // Diplomatic capital

            const utility =
                weights.value * peaceValue +
                weights.ethos * (faction.doctrines.diplomaticFirst ? 100 : 0) +
                weights.econ * (relation.tradeVolume * 10) - // Restore trade
                weights.cost * negotiationCost;

            goals.push({
                type: 'Diplomacy',
                factionId: faction.id,
                utility,
                targetFactionId: otherId,
                value: peaceValue,
                risk: 0.1, // Low risk
                cost: negotiationCost
            });
        }
    }

    return goals;
}

// ===== HELPER FUNCTIONS =====

function isRegionBorder(regionId: string, faction: Faction, intel: Intel): boolean {
    // Check if region has neighbors owned by other factions
    const neighbors = findRegionNeighbors(regionId, intel);
    return neighbors.some(nid => {
        const n = intel.regionStates[nid];
        return n && n.owner && n.owner !== faction.id;
    });
}

function calculateBorderThreat(regionId: string, faction: Faction, intel: Intel): number {
    // Sum garrison strength of hostile neighbors
    const neighbors = findRegionNeighbors(regionId, intel);
    let threat = 0;

    for (const nid of neighbors) {
        const n = intel.regionStates[nid];
        if (!n || !n.owner) continue;

        const relation = faction.relations[n.owner];
        if (relation && relation.opinion < 0) {
            threat += n.garrisonStrength / 100; // Normalize to 0-1 scale
        }
    }

    return Math.min(threat, 1.0);
}

function findNeighborRegions(faction: Faction, intel: Intel): string[] {
    const neighbors = new Set<string>();

    for (const regionId of faction.regionIds) {
        const regionNeighbors = findRegionNeighbors(regionId, intel);
        regionNeighbors.forEach(nid => {
            if (!faction.regionIds.includes(nid)) {
                neighbors.add(nid);
            }
        });
    }

    return Array.from(neighbors);
}

function findRegionNeighbors(_regionId: string, _intel: Intel): string[] {
    // TODO: Wire to Canvas 07 region graph
    // For now, return mock data
    return [];
}

function isAlly(faction: Faction, otherId: string): boolean {
    const relation = faction.relations[otherId];
    return relation ? relation.opinion > 50 : false;
}

function calculateRouteDanger(_regionA: string, _regionB: string, _intel: Intel): number {
    // TODO: Calculate danger along road path
    // For now, return baseline risk
    return 0.2;
}

function calculateSettlementRouteDanger(_faction: Faction, _regionId: string, _intel: Intel): number {
    // TODO: Calculate danger from faction capital to settlement site
    return 0.3;
}
