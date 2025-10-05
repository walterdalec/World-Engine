import { pointBuyRemaining, clamp } from "../features/ui/helpers";

test("pointBuyRemaining base 10s = 10", () => {
  expect(pointBuyRemaining({ A: 10, B: 10, C: 10 })).toBe(10);
});

test("pointBuyRemaining after spending", () => {
  expect(pointBuyRemaining({ A: 12, B: 11, C: 10 })).toBe(7);
});

test("clamp works correctly", () => {
  expect(clamp(3, 21, 2)).toBe(3);
  expect(clamp(3, 21, 30)).toBe(21);
});