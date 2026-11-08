// Run: npx tsx --test 07-evals-fundamentals/src/metrics.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { choose, passAtK, passHatK } from "./metrics.js";

const close = (a: number, b: number) => assert.ok(Math.abs(a - b) < 1e-4, `${a} ≉ ${b}`);

test("choose", () => {
  assert.equal(choose(5, 2), 10);
  assert.equal(choose(10, 3), 120);
  assert.equal(choose(3, 5), 0);
});

test("pass@k", () => {
  close(passAtK(5, 2, 1), 0.4);
  close(passAtK(5, 2, 5), 1);
  close(passAtK(10, 3, 3), 1 - 35 / 120);
  close(passAtK(3, 0, 1), 0);
});

test("pass^k", () => {
  close(passHatK(5, 2, 5), 0);
  close(passHatK(10, 10, 3), 1);
  close(passHatK(10, 7, 3), 35 / 120);
});
