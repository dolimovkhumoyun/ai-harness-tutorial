// TODO(07): eval metrics. n = attempts, c = passed attempts, k = sample size.

/** Probability that at least one of k attempts passes: 1 − C(n−c, k) / C(n, k). */
export function passAtK(n: number, c: number, k: number): number {
  // TODO (careful: if n − c < k, the answer is 1)
  void n; void c; void k;
  return NaN;
}

/** Probability that all k attempts pass: C(c, k) / C(n, k). */
export function passHatK(n: number, c: number, k: number): number {
  // TODO
  void n; void c; void k;
  return NaN;
}

/** n choose k, computed as a product so it doesn't overflow for small numbers. */
export function choose(n: number, k: number): number {
  // TODO
  void n; void k;
  return NaN;
}
