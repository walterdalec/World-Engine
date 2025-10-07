import { applyOutcomeFeedback, createFeedback, FeedbackWeights, weightScore } from './feedback';
import { addDanger, createDangerMap, DangerMap, decayDanger } from './memory';
import { createFormation, Formation } from './formations';

export interface CommanderV24State {
  feedback: FeedbackWeights;
  danger: DangerMap;
  formation: Formation;
}

export function attachV24(brain: any, anchor: { q: number; r: number }, facing: 0 | 1 | 2 | 3 | 4 | 5) {
  if (!brain.v24) {
    brain.v24 = {
      feedback: createFeedback(),
      danger: createDangerMap(),
      formation: createFormation('Line', anchor, facing),
    } as CommanderV24State;
  }

  const originalScore = brain.scoreCandidates?.bind(brain);
  brain.scoreCandidates = (bb: any) => {
    const cards = originalScore ? originalScore(bb) : [];
    return cards.map((card: any) => ({
      ...card,
      score: weightScore(card.name, card.score, brain.v24.feedback),
    }));
  };
}

export function commanderTickV24(brain: any, state: any) {
  const events = state.events?.slice(-10) ?? [];
  for (const event of events) {
    if (event.kind === 'AoeHit' && event.hex) addDanger(brain.v24.danger, event.hex, 3);
    if (event.kind === 'UnitKilled') {
      const unit = state.units.find((u: any) => u.id === event.unitId);
      if (unit?.pos) addDanger(brain.v24.danger, unit.pos, 5);
    }
    if (event.kind === 'RangedHit' && event.hex) addDanger(brain.v24.danger, event.hex, 1);
  }
  decayDanger(brain.v24.danger);
}

export function onOutcomeDelta(brain: any, delta: { dmgFor: number; dmgAgainst: number; objProgress: number }) {
  applyOutcomeFeedback(brain.v24.feedback, delta);
}
