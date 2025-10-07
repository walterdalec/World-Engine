
import type { BattleState } from '../../../battle/types';
import type { UnitIntent, UnitBlackboard } from './types';
import { firstStep } from './path';
import { enforceCohesion } from './cohesion';
import { convertRetreatToPath } from './morale';

export function executeIntent(state: BattleState, bb: UnitBlackboard, intent: UnitIntent) {
  switch (intent.kind) {
    case 'Move': {
      if (!intent.targetHex) break;
      const step = firstStep(state, bb.pos, intent.targetHex);
      const safe = enforceCohesion(state, bb, step);
      record(state, bb.myId, `Move -> (${safe.q},${safe.r})`);
      break;
    }
    case 'Attack': {
      record(state, bb.myId, `Attack -> ${intent.targetUnitId}`);
      break;
    }
    case 'Retreat': {
      const fallback = convertRetreatToPath(bb);
      executeIntent(state, bb, fallback);
      break;
    }
    case 'Ability': {
      record(state, bb.myId, `Ability -> ${intent.abilityId ?? 'unknown'}`);
      break;
    }
    case 'Hold':
    case 'Reposition':
    default: {
      record(state, bb.myId, 'Hold position');
      break;
    }
  }
}

function record(state: BattleState, unitId: string, message: string) {
  state.log.push(`[AI:${unitId}] ${message}`);
}
