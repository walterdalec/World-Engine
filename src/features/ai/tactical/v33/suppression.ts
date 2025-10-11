import type { Hex } from '../v30/field';

export interface LaneOrder {
    unitId: string;
    targetLane: [Hex, Hex];
    suppressionType: 'covering' | 'harassing' | 'focused';
}

export function assignSuppression(
    state: any,
    shooters: any[],
    laneTarget: [Hex, Hex]
): LaneOrder[] {
    if (!shooters.length || !laneTarget) return [];

    const orders: LaneOrder[] = [];

    for (const shooter of shooters) {
        if (!shooter.pos || shooter.isDead) continue;

        const suppressionType = determineSuppression(shooter.role);

        orders.push({
            unitId: shooter.id,
            targetLane: laneTarget,
            suppressionType
        });
    }

    return orders;
}

function determineSuppression(role: string): 'covering' | 'harassing' | 'focused' {
    const roleLower = (role || '').toLowerCase();

    if (roleLower.includes('archer') || roleLower.includes('ranger')) {
        return 'focused';
    } else if (roleLower.includes('mage') || roleLower.includes('caster')) {
        return 'harassing';
    } else {
        return 'covering';
    }
}