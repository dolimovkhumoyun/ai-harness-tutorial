// Order pricing for a small shop. Reference solution.

/** Sum of line totals (price × qty), in cents. */
export function subtotal(lines) {
  return lines.reduce((sum, l) => sum + l.price * l.qty, 0);
}

/** Percentage discount applied to the subtotal, rounded to whole cents. */
export function applyDiscount(cents, percent) {
  if (percent < 0 || percent > 100) throw new RangeError("percent must be 0-100");
  return Math.round(cents * (1 - percent / 100));
}

/** Orders of 5000 cents or more ship free; otherwise shipping is 499 cents. */
export function shipping(cents) {
  return cents >= 5000 ? 0 : 499;
}

export function total(lines, discountPercent = 0) {
  const discounted = applyDiscount(subtotal(lines), discountPercent);
  return discounted + shipping(discounted);
}
