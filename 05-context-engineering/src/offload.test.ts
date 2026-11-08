// Run: npx tsx --test 05-context-engineering/src/offload.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { offload } from "./offload.js";

const opts = { maxChars: 100, headChars: 20, tailChars: 30 };

test("short output is unchanged", () => {
  const r = offload("hello", opts);
  assert.equal(r.text, "hello");
  assert.equal(r.truncated, false);
});

test("long output keeps head and tail", () => {
  const out = "H".repeat(20) + "x".repeat(1000) + "T".repeat(30);
  const r = offload(out, opts);
  assert.equal(r.truncated, true);
  assert.ok(r.text.includes("H".repeat(20)), "keeps head");
  assert.ok(r.text.includes("T".repeat(30)), "keeps tail");
  assert.ok(!r.text.includes("x".repeat(100)), "drops the middle");
  assert.ok(r.text.length < 300, "result is small");
});

test("says how big the original was", () => {
  const r = offload("y".repeat(5000), opts);
  assert.match(r.text, /5[,.]?000/);
});
