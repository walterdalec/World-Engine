import type { LaneId } from '../v30/lanes';
import { scoreHex } from '../v30/field';

export interface LaneHealth {
  casualties: number;
  lostGround: number;
  dangerAvg: number;
}

export interface LaneState {
  id: LaneId;
  health: LaneHealth;
  collapsed: boolean;
  priority: number;
}

type BattleLogState = {
  casualtiesByLane?: Partial<Record<LaneId, number>>;
  groundLossByLane?: Partial<Record<LaneId, number>>;
};

export function computeLaneHealth(brain: any, state: { logs?: BattleLogState }): LaneState[] {
  if (!brain?.v30?.lanes) return [];
  const field = brain.v30.field;
  const logs = state.logs ?? {};
  const result: LaneState[] = [];

  for (const lane of brain.v30.lanes) {
    const last = lane.goals.at(-1) ?? lane.goals.at(0);
    const score = last ? scoreHex(field, last) : { danger: 0, pull: 0 };
    const danger = score.danger;
    const casualties = logs.casualtiesByLane?.[lane.id as LaneId] ?? 0;
    const lostGround = logs.groundLossByLane?.[lane.id as LaneId] ?? 0;

    const collapsed = casualties >= 2 || (danger > 6 && lostGround > 1);
    const priority = collapsed ? -1 : 1 - Math.min(1, danger * 0.1) - lostGround * 0.1;

    result.push({
      id: lane.id as LaneId,
      health: { casualties, lostGround, dangerAvg: danger },
      collapsed,
      priority,
    });
  }

  return result.sort((a, b) => b.priority - a.priority);
}

export function reassignPrimary(brain: any, laneStates: LaneState[]): LaneId | undefined {
  if (!laneStates.length) return undefined;
  const best = laneStates[0]!;
  brain.v30.primary = best.id;
  return best.id;
}
