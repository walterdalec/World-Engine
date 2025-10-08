export interface CmdBlackboard {
  phase: 'Hold' | 'Probe' | 'Push' | 'Collapse' | 'Withdraw';
  primaryLane: 'Left' | 'Center' | 'Right';
  secondaryLane?: 'Left' | 'Center' | 'Right';
  lastOrdersAt: number;
  lastPick?: string;
  cooldowns: Record<string, number>;
  focusTargetHex?: { q: number; r: number };
  pressure: { left: number; center: number; right: number };
}

export function createBlackboard(primary: 'Left' | 'Center' | 'Right'): CmdBlackboard {
  return {
    phase: 'Hold',
    primaryLane: primary,
    lastOrdersAt: -999,
    cooldowns: {},
    pressure: { left: 0, center: 0, right: 0 },
  };
}
