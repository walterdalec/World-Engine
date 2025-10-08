import type { CmdBlackboard } from './blackboard';

export interface PhaseInputs {
  moraleAvg: number;
  routingCount: number;
  dangerAtFront: number;
  advantage: number;
  risk: number;
}

export function nextPhase(current: CmdBlackboard['phase'], inputs: PhaseInputs): CmdBlackboard['phase'] {
  if (inputs.routingCount >= 3 || inputs.moraleAvg < 25) return 'Withdraw';
  if (inputs.dangerAtFront > 8 && inputs.advantage < 0) return 'Collapse';
  if (current === 'Hold' && inputs.advantage > 0.5 && inputs.moraleAvg > 45) return 'Probe';
  if (current === 'Probe' && (inputs.advantage > 1.5 || inputs.risk > 65)) return 'Push';
  if (current === 'Push' && (inputs.advantage < -0.5 || inputs.dangerAtFront > 7)) return 'Probe';
  if (current === 'Collapse' && (inputs.advantage > 0 || inputs.moraleAvg > 40)) return 'Hold';
  return current;
}
