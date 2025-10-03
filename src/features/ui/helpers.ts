export function pointBuyRemaining(stats: Record<string, number>, pool: number = 10): number {
  const used = Object.values(stats).reduce((sum: number, val: number) => sum + Math.max(0, val - 8), 0);
  return Math.max(0, pool - used);
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
