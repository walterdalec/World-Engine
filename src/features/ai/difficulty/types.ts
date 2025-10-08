export type DifficultyId = 'Story' | 'Normal' | 'Hard' | 'Brutal' | 'Static' | 'Adaptive' | 'Director' | 'Custom';

export interface LearningToggles {
  enabled: boolean;
  alpha: number;
  perBattleClamp: number;
  perSeasonClamp: number;
  exploration: number;
  memoryWindow: number;
  opponentBuckets: boolean;
  scenarioBuckets: boolean;
}

export interface DifficultySpec {
  id: DifficultyId;
  label: string;
  rails: { dmgMult: number; hpMult: number; aiAgg: number; reinforceTurns: number[]; btTickBudgetMs: number };
  learn: LearningToggles;
  commander: { riskBias: number; rallyCdBias: number; feintChance: number; syncWindow: number };
  description: string;
}
