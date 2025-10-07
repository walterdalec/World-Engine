
import type { Blackboard, Order } from './types';

export interface ScoreCard {
  name: string;
  score: number;
  build: () => Order | null;
}

export function scoreCandidates(bb: Blackboard): ScoreCard[] {
  const cards: ScoreCard[] = [
    scoreFocusFire(bb),
    scoreAdvanceLine(bb),
    scoreHold(bb),
    scoreFlank(bb),
    scoreFallback(bb),
    scoreRally(bb),
  ];
  return cards.filter((card) => !Number.isNaN(card.score)).sort((a, b) => b.score - a.score);
}

function scoreFocusFire(bb: Blackboard): ScoreCard {
  const target = pickWeakEnemyCluster(bb);
  const stance = bb.commander.stance === 'Aggressive' ? 15 : bb.commander.stance === 'Defensive' ? -10 : 0;
  const score = 60 + stance + (target ? 10 : -20);
  return {
    name: 'FocusFire',
    score,
    build: () =>
      target
        ? {
            id: nid(bb, 'focus'),
            kind: 'FocusFire',
            targetUnitId: target.units[0],
            priority: clampPriority(score),
            ttl: 6,
          }
        : null,
  };
}

function scoreAdvanceLine(bb: Blackboard): ScoreCard {
  const front = bb.objectives[0]?.hex;
  const base = bb.commander.stance === 'Aggressive' ? 70 : 40;
  return {
    name: 'AdvanceLine',
    score: front ? base : base - 20,
    build: () =>
      front
        ? {
            id: nid(bb, 'advance'),
            kind: 'AdvanceLine',
            targetHex: front,
            priority: clampPriority(base),
            ttl: 6,
          }
        : null,
  };
}

function scoreHold(bb: Blackboard): ScoreCard {
  const base = bb.commander.stance === 'Defensive' ? 75 : 35;
  return {
    name: 'Hold',
    score: base,
    build: () => ({
      id: nid(bb, 'hold'),
      kind: 'HoldPosition',
      priority: clampPriority(base),
      ttl: 6,
    }),
  };
}

function scoreFlank(bb: Blackboard): ScoreCard {
  const flankable = bb.enemyClusters.length > 0 && bb.allyClusters.length > 0;
  const stance = bb.commander.stance === 'Opportunistic' ? 15 : 0;
  const base = flankable ? 55 : 20;
  const score = base + stance;
  return {
    name: 'Flank',
    score,
    build: () =>
      flankable
        ? {
            id: nid(bb, 'flank'),
            kind: 'Flank',
            priority: clampPriority(score),
            ttl: 6,
          }
        : null,
  };
}

function scoreFallback(bb: Blackboard): ScoreCard {
  const losing = estimateLosing(bb);
  const score = losing ? 80 : 15;
  return {
    name: 'Fallback',
    score,
    build: () =>
      losing
        ? {
            id: nid(bb, 'fallback'),
            kind: 'Fallback',
            priority: clampPriority(score),
            ttl: 4,
          }
        : null,
  };
}

function scoreRally(bb: Blackboard): ScoreCard {
  const moraleLow = bb.risk < 40;
  const score = moraleLow ? 65 : 25;
  return {
    name: 'Rally',
    score,
    build: () =>
      moraleLow
        ? {
            id: nid(bb, 'rally'),
            kind: 'Rally',
            priority: clampPriority(score),
            ttl: 3,
          }
        : null,
  };
}

function pickWeakEnemyCluster(bb: Blackboard) {
  if (!bb.enemyClusters.length) return undefined;
  return [...bb.enemyClusters].sort((a, b) => a.strength - b.strength)[0];
}

function estimateLosing(bb: Blackboard) {
  const allyStrength = bb.allyClusters.reduce((sum, c) => sum + c.strength, 0);
  const enemyStrength = bb.enemyClusters.reduce((sum, c) => sum + c.strength, 0);
  return enemyStrength > allyStrength * 1.2;
}

function clampPriority(v: number) {
  return Math.max(0, Math.min(100, Math.round(v)));
}

function nid(bb: Blackboard, name: string) {
  const time = Math.round(bb.time * 1000);
  return `ord_${name}_${time}`;
}
