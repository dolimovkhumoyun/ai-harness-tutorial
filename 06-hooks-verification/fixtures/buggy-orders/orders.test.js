import { test } from "node:test";
import assert from "node:assert/strict";
import { subtotal, applyDiscount, shipping, total } from "./orders.js";

const lines = [
  { price: 1200, qty: 2 },
  { price: 350, qty: 4 },
];

test("subtotal sums price × qty", () => {
  assert.equal(subtotal(lines), 3800);
  assert.equal(subtotal([]), 0);
});

test("applyDiscount takes percent off", () => {
  assert.equal(applyDiscount(10000, 10), 9000);
  assert.equal(applyDiscount(999, 0), 999);
  assert.throws(() => applyDiscount(100, 101), RangeError);
});

test("shipping is free from 5000 cents", () => {
  assert.equal(shipping(5000), 0);
  assert.equal(shipping(4999), 499);
});

test("total combines everything", () => {
  assert.equal(total(lines), 3800 + 499);
  assert.equal(total([{ price: 6000, qty: 1 }], 10), 5400);
});
