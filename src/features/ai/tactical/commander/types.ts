
import type { CommanderIntent as BattleCommanderIntent } from '../../../battle/types';

export type ID = string;

export type CommanderStance = BattleCommanderIntent['stance'];
export type CommanderObjective = BattleCommanderIntent['objective'];

export type CommanderIntent = BattleCommanderIntent;

export interface CommanderBrainConfig {
  tickMs: number;
  maxSignalsPerTick: number;
}

export interface Order {
  id: ID;
  kind:
    | 'FocusFire'
    | 'AdvanceLine'
    | 'HoldPosition'
    | 'Flank'
    | 'Fallback'
    | 'Rally'
    | 'ProtectAsset'
    | 'SeizeHex';
  targetHex?: { q: number; r: number };
  targetUnitId?: ID;
  groupTag?: string;
  priority: number;
  ttl: number;
}

export interface Signal {
  id: ID;
  order: Order;
  issuedAt: number;
}

export interface Cluster {
  id: ID;
  units: ID[];
  center: { q: number; r: number };
  strength: number;
  hpAvg: number;
}

export interface Blackboard {
  enemyClusters: Cluster[];
  allyClusters: Cluster[];
  contestedHexes: { q: number; r: number }[];
  objectives: { hex: { q: number; r: number }; score: number }[];
  commander: CommanderIntent;
  risk: number;
  time: number;
}

export interface MemoryGridCfg {
  decayPerTurn: number;
  writeOn: { dmgPerHP: number; losBlocked: number; successPush: number };
  dirWeight: number;
}

export interface MemoryGridState {
  cells: Record<string, { heat: number; dir: number[] }>;
  lastUpdateTurn: number;
}

export type ScriptId = 'StdOpener' | 'OrderlyRetreat' | 'FlankProbe';

export interface ScriptCtx {
  bb: Blackboard;
  rng: () => number;
  issue: (order: Order) => void;
}
