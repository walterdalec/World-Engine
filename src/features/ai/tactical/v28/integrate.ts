
import { derivePsyche } from '../v27/psyche';
import { makeThresholds } from '../v27/thresholds';
import { PLAYBOOKS, pickFormationFromPlaybook } from './playbooks';
import type { Playbook } from './playbooks';

export interface V28Runtime {
  culture: string;
  playbook: Playbook;
}

export function attachV28(brain: any, state: any, opts: { cultureId?: string; rng?: () => number } = {}) {
  const cultureId = opts.cultureId ?? state.context?.cultureId ?? 'knightly_order';
  const playbook = PLAYBOOKS[cultureId] ?? PLAYBOOKS['knightly_order'];
  const rng = opts.rng ?? (() => Math.random());

  brain.v28 = { culture: cultureId, playbook } as V28Runtime;

  // Merge playbook order weights
  const original = brain._v28Score ?? brain.scoreCandidates.bind(brain);
  if (!brain._v28Score) brain._v28Score = original;
  brain.scoreCandidates = (bb: any) => {
    const cards = original(bb) || [];
    return cards.map((card: any) => {
      const bonus = playbook.orderWeights?.[card.name as keyof Playbook['orderWeights']] ?? 0;
      return { ...card, score: (card.score ?? 0) + bonus };
    });
  };

  // Update thresholds from psyche + playbook
  const psyche = derivePsyche(state.context?.personality);
  const base = {
    fallback: playbook.thresholds?.fallback ?? 12,
    rally: playbook.thresholds?.rally ?? 8,
    advance: playbook.thresholds?.advance ?? 2,
    rotate: playbook.thresholds?.rotate ?? 6,
  };
  brain.v27 = brain.v27 ?? {};
  brain.v27.psyche = psyche;
  brain.v27.thresholds = makeThresholds({ ...base, ...(playbook.thresholds ?? {}) }, psyche);

  // Select initial formation based on playbook preference
  if (brain.v24?.formation) {
    brain.v24.formation.kind = pickFormationFromPlaybook(playbook, rng) as any;
  }
}

export function v28Tick(brain: any, state: any) {
  if (!brain.v28) return;
  state.events.push({ t: state.time ?? 0, kind: 'Playbook', culture: brain.v28.culture, name: brain.v28.playbook.name });
}
