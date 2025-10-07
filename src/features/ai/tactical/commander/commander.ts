
import type { BattleState } from '../../../battle/types';
import { createBlackboard, tickBlackboard } from './blackboard';
import { perceive } from './perception';
import { scoreCandidates } from './scoring';
import { Selector, Sequence, Condition, Action, type BTResult } from './behavior';
import { seedRng } from './rng';
import { createMemoryGrid, decay, readHeat } from './memoryGrid';
import { runScript } from './scripts';
import type { Blackboard, CommanderBrainConfig, CommanderIntent, Signal, Order, MemoryGridCfg } from './types';

export class CommanderBrain {
  private readonly config: CommanderBrainConfig;
  private readonly bb: Blackboard;
  private readonly rng = seedRng(0);
  private readonly grid = createMemoryGrid();
  private readonly gridCfg: MemoryGridCfg = {
    decayPerTurn: 0.12,
    dirWeight: 0.6,
    writeOn: { dmgPerHP: 0.25, losBlocked: 0.2, successPush: 0.4 },
  };
  private lastTickMs = 0;
  private pendingSignals: Signal[] = [];
  private openingIssued = false;

  constructor(intent: CommanderIntent, config: CommanderBrainConfig) {
    this.config = {
      tickMs: Math.max(100, config.tickMs),
      maxSignalsPerTick: Math.max(1, config.maxSignalsPerTick),
    };
    this.bb = createBlackboard(intent);
  }

  public scoreCandidates(bb: Blackboard) {
    return scoreCandidates(bb);
  }

  public tick(state: BattleState, nowMs: number): Signal[] {
    if (nowMs - this.lastTickMs < this.config.tickMs) return [];
    this.lastTickMs = nowMs;

    tickBlackboard(this.bb, this.config.tickMs / 1000);
    perceive(state, this.bb);
    decay(this.grid, this.gridCfg);
    this.maybeRunOpeningScript();

    const root = new Selector([
      new Sequence([
        new Condition(() => true),
        new Action(() => this.emitTopK(maxSignals(this.config.maxSignalsPerTick))),
      ]),
    ]);

    root.tick({ bb: this.bb, now: nowMs });
    const out = this.pendingSignals;
    this.pendingSignals = [];
    return out;
  }

  private emitTopK(limit: number): BTResult {
    const scored = this.scoreCandidates(this.bb).map((card) => ({
      card: { ...card },
      order: card.build ? card.build() : null,
    }));
    const psyche = (this as any).v27?.psyche;
    scored.forEach((entry) => {
      if (psyche) {
        const name = entry.card.name;
        const mult =
          name === "FocusFire" ? psyche.focusBias :
          name === "Flank" ? psyche.flankBias :
          name === "Hold" ? psyche.holdBias :
          name === "Fallback" ? psyche.fallbackBias : 1;
        entry.card.score *= mult;
      }
      if (!entry.order?.targetHex) return;
      entry.card.score += this.heatPenalty(entry.order.targetHex);
    });
    scored.sort((a, b) => b.card.score - a.card.score);

    let produced = 0;
    for (const entry of scored) {
      if (produced >= limit) break;
      if (!entry.order) continue;
      this.queueOrder(entry.order);
      produced += 1;
    }
    return produced > 0 ? 'success' : 'failure';
  }

  private queueOrder(order: Order) {
    this.pendingSignals.push({ id: `sig_${order.id}`, order, issuedAt: this.bb.time });
  }

  private heatPenalty(hex: { q: number; r: number }) {
    const heat = readHeat(this.grid, hex);
    return -Math.min(20, heat * 3);
  }

  private maybeRunOpeningScript() {
    if (this.openingIssued || this.bb.time > 0.1) return;
    runScript('StdOpener', {
      bb: this.bb,
      rng: this.rng,
      issue: (order) => this.queueOrder(order),
    });
    this.openingIssued = true;
  }
}

function maxSignals(value: number) {
  return Math.max(1, Math.floor(value));
}
