import { pointBuyRemaining, clamp } from "../features/ui/helpers";

test("pointBuyRemaining base 10s = 4", () => {
  // Each stat at 10 costs 2 points (10-8=2), so 3 stats * 2 = 6 points used, 10-6 = 4 remaining
  expect(pointBuyRemaining({ A: 10, B: 10, C: 10 })).toBe(4);
});

test("pointBuyRemaining after spending", () => {
  // A:12 costs 4 points (12-8=4), B:11 costs 3 points (11-8=3), C:10 costs 2 points (10-8=2)
  // Total: 4+3+2 = 9 points used, 10-9 = 1 remaining
  expect(pointBuyRemaining({ A: 12, B: 11, C: 10 })).toBe(1);
});

test("clamp works correctly", () => {
  // clamp(value, min, max) - should clamp 2 between 3 and 21, result is 3
  expect(clamp(2, 3, 21)).toBe(3);
  // clamp(value, min, max) - should clamp 30 between 3 and 21, result is 21  
  expect(clamp(30, 3, 21)).toBe(21);
});