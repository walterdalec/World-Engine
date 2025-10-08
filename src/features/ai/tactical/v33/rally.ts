export interface RallyState {
    lastRallyTurn: number;
    cooldown: number;
}

export function shouldRally(
    currentTurn: number,
    laneCollapsed: boolean,
    routingCount: number,
    shakenRatio: number
): boolean {
    // Rally if we have significant morale problems
    if (routingCount >= 2) return true;
    if (shakenRatio > 0.4) return true;
    if (laneCollapsed && shakenRatio > 0.2) return true;

    return false;
}

export function applyRally(
    units: any[],
    commanderPos: { q: number; r: number },
    radius: number,
    moraleBoost: number
): { affected: string[]; boost: number } {
    const affected: string[] = [];

    for (const unit of units) {
        if (!unit.pos) continue;

        const distance = hexDist(commanderPos, unit.pos);
        if (distance <= radius && unit.aiMorale) {
            // Apply morale boost
            const currentValue = unit.aiMorale.value || 50;
            const boostedValue = Math.min(100, currentValue + moraleBoost);

            unit.aiMorale = {
                ...unit.aiMorale,
                value: boostedValue,
                status: statusOf(boostedValue),
            };

            affected.push(unit.id);
        }
    }

    return { affected, boost: moraleBoost };
}

function hexDist(a: { q: number; r: number }, b: { q: number; r: number }): number {
    const ax = a.q;
    const ay = a.r;
    const az = -ax - ay;
    const bx = b.q;
    const by = b.r;
    const bz = -bx - by;
    return Math.max(Math.abs(ax - bx), Math.abs(ay - by), Math.abs(az - bz));
}

function statusOf(v: number): 'Steady' | 'Shaken' | 'Wavering' | 'Routing' {
    if (v < 10) return 'Routing';
    if (v < 30) return 'Wavering';
    if (v < 60) return 'Shaken';
    return 'Steady';
}