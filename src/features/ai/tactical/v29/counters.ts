export type PlaybookId = 'knightly_order' | 'desert_raiders' | 'siege_engineers' | 'unknown';

export interface StyleVector {
  flankRate: number;
  volleyRate: number;
  pushRate: number;
  collapseRate: number;
}

export interface CounterWeights {
  orders: Partial<Record<'FocusFire' | 'AdvanceLine' | 'Hold' | 'Flank' | 'Fallback' | 'Rally' | 'StagedAdvance', number>>;
  maneuvers: Partial<Record<'Rotate' | 'RefuseFlank' | 'StagedAdvance' | 'CollapseToAnchor', number>>;
  thresholds?: Partial<{ fallback: number; rally: number; rotate: number; advance: number }>;
}

export const CounterMatrix: Record<PlaybookId, CounterWeights> = {
  knightly_order: {
    orders: { Flank: +6, FocusFire: +2, Hold: -2 },
    maneuvers: { Rotate: +2, RefuseFlank: +1 },
  },
  desert_raiders: {
    orders: { Hold: +6, FocusFire: +3, Fallback: +2 },
    maneuvers: { RefuseFlank: +5, Rotate: +2 },
    thresholds: { rotate: 4, fallback: 10 },
  },
  siege_engineers: {
    orders: { Flank: +5, StagedAdvance: +2, FocusFire: +3 },
    maneuvers: { CollapseToAnchor: -2, Rotate: +3 },
  },
  unknown: { orders: {}, maneuvers: {} },
};

export function counterFromStyle(style: StyleVector): CounterWeights {
  const orders: CounterWeights['orders'] = {};
  const maneuvers: CounterWeights['maneuvers'] = {};

  if (style.flankRate > 0.4) {
    orders.Hold = (orders.Hold ?? 0) + 5;
    maneuvers.RefuseFlank = (maneuvers.RefuseFlank ?? 0) + 4;
  }
  if (style.volleyRate > 0.4) {
    orders.AdvanceLine = (orders.AdvanceLine ?? 0) + 4;
    orders.FocusFire = (orders.FocusFire ?? 0) + 2;
  }
  if (style.pushRate > 0.4) {
    orders.Flank = (orders.Flank ?? 0) + 4;
    maneuvers.Rotate = (maneuvers.Rotate ?? 0) + 2;
  }
  if (style.collapseRate > 0.4) {
    orders.Rally = (orders.Rally ?? 0) + 3;
    orders.AdvanceLine = (orders.AdvanceLine ?? 0) + 2;
  }

  return { orders, maneuvers };
}

type CardLike = { name: string; score: number };

export function applyCountersToScores<T extends CardLike>(cards: T[], cw: CounterWeights): T[] {
  if (!cw.orders) return cards;
  return cards.map((card) => {
    const delta = cw.orders?.[card.name as keyof CounterWeights['orders']] ?? 0;
    return { ...card, score: card.score + delta };
  });
}
