
import type { Blackboard, CommanderIntent } from './types';

export function createBlackboard(intent: CommanderIntent): Blackboard {
  return {
    enemyClusters: [],
    allyClusters: [],
    contestedHexes: [],
    objectives: [],
    commander: intent,
    risk: intent.riskTolerance,
    time: 0,
  };
}

export function tickBlackboard(bb: Blackboard, deltaSeconds: number) {
  bb.time += deltaSeconds;
  const drift = (bb.commander.riskTolerance - bb.risk) * 0.05;
  bb.risk = Math.max(0, Math.min(100, bb.risk + drift));
}
