/**
 * Combat Logging Utility
 * Lightweight logging for action resolution
 */

export class CombatLog {
    private L: string[] = [];

    add(s: string): void {
        this.L.push(s);
    }

    dump(): string[] {
        return [...this.L];
    }

    clear(): void {
        this.L.length = 0;
    }
}

export function logEvt(kind: string, data: Record<string, any>): string {
    try {
        return JSON.stringify({ k: kind, ...data });
    } catch {
        return kind;
    }
}