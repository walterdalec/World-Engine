import type { Hex } from '../v30/field';

export interface EscortUnitLite {
    id: string;
    role: string;
    pos: Hex;
}

export interface EscortPlan {
    taskId: string;
    assignedUnits: string[];
    targetPos: Hex;
    formation: 'guard' | 'advance' | 'flank';
    priority: number;
}

export interface EscortContext {
    unitsById: Record<string, any>;
    enemies: any[];
}

export function planEscort(
    task: any,
    availableUnits: EscortUnitLite[],
    anchor: Hex
): EscortPlan | null {
    if (!task || !availableUnits.length) return null;

    // Simple escort planning - assign closest units to task
    const targetPos = task.targetHex || anchor;
    const maxUnits = 3; // Maximum units per escort

    // Sort units by distance to target
    const sorted = availableUnits
        .map(unit => ({
            ...unit,
            distance: hexDist(unit.pos, targetPos)
        }))
        .sort((a, b) => a.distance - b.distance)
        .slice(0, maxUnits);

    const formation = determineFormation(task.kind);

    return {
        taskId: task.id,
        assignedUnits: sorted.map(u => u.id),
        targetPos,
        formation,
        priority: task.priority || 1
    };
}

export function tickEscort(plan: EscortPlan, context: EscortContext): EscortPlan {
    // Simple escort behavior - maintain formation around target
    const validUnits = plan.assignedUnits.filter(id =>
        context.unitsById[id] && !context.unitsById[id].isDead
    );

    return {
        ...plan,
        assignedUnits: validUnits
    };
}

function determineFormation(taskKind: string): 'guard' | 'advance' | 'flank' {
    switch (taskKind) {
        case 'Ram':
        case 'Ladder':
            return 'advance';
        case 'Sap':
        case 'Bomb':
            return 'guard';
        default:
            return 'flank';
    }
}

function hexDist(a: Hex, b: Hex): number {
    const ax = a.q;
    const ay = a.r;
    const az = -ax - ay;
    const bx = b.q;
    const by = b.r;
    const bz = -bx - by;
    return Math.max(Math.abs(ax - bx), Math.abs(ay - by), Math.abs(az - bz));
}