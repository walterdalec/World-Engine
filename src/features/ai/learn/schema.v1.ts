
export interface BattleSampleV1 {
  turn: number;
  seed: number;
  commander: 'A' | 'B';
  opId?: string;
  stage?: string;
  orders: string[];
  deception: { used: boolean; kind?: string; detected?: boolean };
  deltas: { hpA: number; hpB: number; moraleA: number; moraleB: number };
  outcome?: 'win' | 'loss' | 'draw';
}

export interface FileHeader {
  schema: 'BattleSampleV1';
  gameVersion: string;
  map: string;
  ts: number;
}
