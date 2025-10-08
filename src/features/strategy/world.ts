/**
 * Territory Graph & Supply Lines - Strategic Layer
 * World Engine faction warfare with supply chain management
 */

import type { CampaignState, Territory } from './types';

function isCapital(t: Territory): boolean {
    return t.tags.includes('capital');
}

function isPort(t: Territory): boolean {
    return t.tags.includes('port');
}

function isShrine(t: Territory): boolean {
    return t.tags.includes('shrine');
}

/**
 * Check if route exists between two territories of same faction
 * Ports provide sea lane connections, shrines provide magical transport
 */
export function routeExists(s: CampaignState, a: string, b: string): boolean {
    const A = s.territories.get(a);
    const B = s.territories.get(b);
    if (!A || !B) return false;
    if (A.owner !== B.owner) return false;

    const owner = A.owner;
    const seen = new Set<string>([A.id]);
    const q = [A.id];

    // Precompute same-owner port and shrine lists that are not supply-cut by siege
    const ports = Array.from(s.territories.values()).filter(t =>
        t.owner === owner && isPort(t) && !(t.site?.siege?.supplyCut)
    );
    const portIds = new Set(ports.map(p => p.id));

    const shrines = Array.from(s.territories.values()).filter(t =>
        t.owner === owner && isShrine(t) && !(t.site?.siege?.supplyCut)
    );
    const shrineIds = new Set(shrines.map(s => s.id));

    while (q.length) {
        const id = q.shift()!;
        if (id === B.id) return true;
        const t = s.territories.get(id)!;

        // Normal neighbors (same owner only)
        for (const nId of t.neighbors) {
            const n = s.territories.get(nId);
            if (!n) continue;
            if (n.owner !== owner) continue;
            if (!seen.has(n.id)) {
                seen.add(n.id);
                q.push(n.id);
            }
        }

        // Port superedges: from any port → all other same-owner ports (sea lanes)
        if (portIds.has(id)) {
            for (const p of ports) {
                if (!seen.has(p.id)) {
                    seen.add(p.id);
                    q.push(p.id);
                }
            }
        }

        // Shrine superedges: magical transport network for World Engine factions
        if (shrineIds.has(id)) {
            for (const shrine of shrines) {
                if (!seen.has(shrine.id)) {
                    seen.add(shrine.id);
                    q.push(shrine.id);
                }
            }
        }
    }
    return false;
}

/**
 * Check if territory is in supply (connected to capital via friendly route)
 */
export function isInSupply(s: CampaignState, tId: string): boolean {
    const t = s.territories.get(tId);
    if (!t) return false;

    const caps = Array.from(s.territories.values()).filter(tt =>
        tt.owner === t.owner && isCapital(tt)
    );
    if (!caps.length) return false; // no capital found

    // Siege can hard-cut supply inside territory
    if (t.site?.siege?.supplyCut) return false;

    for (const c of caps) {
        if (routeExists(s, t.id, c.id)) return true;
    }
    return false;
}/**
 * Recompute supply status for all territories
 */
export function recomputeSupply(s: CampaignState): void {
    for (const t of Array.from(s.territories.values())) {
        t.supply = isInSupply(s, t.id);
    }
}/**
 * Get strategic chokepoints - territories that if captured would cut supply
 */
export function findChokepoints(s: CampaignState, factionId: string): string[] {
    const chokepoints: string[] = [];
    const faction = s.factions.get(factionId);
    if (!faction) return chokepoints;

    const ownTerritories = Array.from(s.territories.values()).filter(t => t.owner === factionId);

    for (const territory of ownTerritories) {
        // Temporarily remove this territory and check if it disconnects others
        const originalOwner = territory.owner;
        territory.owner = 'TEMP_ENEMY' as any;

        let disconnectedCount = 0;
        for (const other of ownTerritories) {
            if (other.id === territory.id) continue;
            if (!isInSupply(s, other.id)) {
                disconnectedCount++;
            }
        }

        // Restore ownership
        territory.owner = originalOwner;

        if (disconnectedCount > 0) {
            chokepoints.push(territory.id);
        }
    }

    return chokepoints;
}

/**
 * Calculate strategic value of a territory for World Engine factions
 */
export function calculateStrategicValue(s: CampaignState, territoryId: string): number {
    const territory = s.territories.get(territoryId);
    if (!territory) return 0;

    let value = 0;

    // Base resource values
    if (territory.tags.includes('mine')) value += 6;
    if (territory.tags.includes('crystal')) value += 5;
    if (territory.tags.includes('capital')) value += 10;
    if (territory.tags.includes('farm')) value += 4;
    if (territory.tags.includes('port')) value += 3;
    if (territory.tags.includes('shrine')) value += 4; // World Engine magical sites
    if (territory.tags.includes('ruins')) value += 2; // Archaeological sites
    if (territory.tags.includes('road')) value += 1;

    // Strategic position bonuses
    const neighborCount = territory.neighbors.length;
    if (neighborCount >= 4) value += 2; // Hub territory

    // Castle tier bonus
    if (territory.site) {
        value += territory.site.tier * 2;
    }

    return value;
}