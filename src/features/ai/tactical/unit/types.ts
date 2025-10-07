
import type { Order as CommanderOrder } from '../commander/types';

export type ID = string;

export interface Hex { q: number; r: number }

export type UnitIntentKind = 'Move' | 'Attack' | 'Ability' | 'Hold' | 'Retreat' | 'Reposition';

export interface UnitIntent {
  unitId: ID;
  kind: UnitIntentKind;
  targetHex?: Hex;
  targetUnitId?: ID;
  abilityId?: ID;
  urgency: number;
}

export interface UnitBlackboard {
  myId: ID;
  pos: Hex;
  team: 'Player' | 'Enemy';
  hp: number;
  maxHp: number;
  morale: number;
  stamina: number;
  range: number;
  move: number;
  coverHexes?: Hex[];
  currentOrder?: CommanderOrder;
  lastSeenTargets: ID[];
}

export type CommanderOrderKind = CommanderOrder['kind'];
export type CommanderOrderRef = CommanderOrder;
