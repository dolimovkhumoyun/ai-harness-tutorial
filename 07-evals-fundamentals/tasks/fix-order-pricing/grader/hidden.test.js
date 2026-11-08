// Hidden tests: copied into the workspace only AFTER the agent finishes.
import { test } from "node:test";
import assert from "node:assert/strict";
import { subtotal, applyDiscount, shipping, total } from "./orders.js";

test("hidden: edge cases", () => {
  assert.equal(subtotal([{ price: 1, qty: 1 }]), 1);
  assert.equal(applyDiscount(1000, 100), 0);
  assert.equal(applyDiscount(333, 50), 167); // rounding
  assert.equal(shipping(0), 499);
  assert.equal(total([{ price: 2500, qty: 2 }], 0), 5000);
});
