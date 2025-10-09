import type { ScenarioKey } from './scenario';

export type { ScenarioKey };

export interface StyleStats { flank: number; volley: number; push: number; collapse: number }
export interface LearnableParams { planBias: Record<ScenarioKey, Record<string, number>>; styleEma: Record<ScenarioKey, StyleStats>; updatedAtTurn: number; version: string }
