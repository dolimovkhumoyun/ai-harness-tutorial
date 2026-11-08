// Shared settings for every module. Change the model here, once.

/**
 * DeepSeek models (via its Anthropic-compatible API, see shared/client.ts):
 *   "deepseek-flash"   DeepSeek-V4.1-Flash: cheap and fast, good for building and debugging
 *   "deepseek-v4-pro"  DeepSeek-V4-Pro: stronger, about 4x the price
 * Keep the model fixed within one experiment, or the results aren't comparable.
 */
export const MODEL = "deepseek-flash";

/**
 * USD per 1M tokens, used by your cost calculator (module 00 onwards).
 * These are DeepSeek's OFF-PEAK prices. Peak hours cost 2x, so treat computed costs as a lower bound.
 * DeepSeek caches automatically and doesn't charge for cache writes (a cache miss is billed as normal input).
 * Source: https://api-docs.deepseek.com/quick_start/pricing
 */
export const PRICING: Record<string, { input: number; output: number; cacheRead: number; cacheWrite: number }> = {
  "deepseek-flash": { input: 0.15, output: 0.6, cacheRead: 0.003, cacheWrite: 0.003 },
  "deepseek-v4-pro": { input: 0.66, output: 1.98, cacheRead: 0.022, cacheWrite: 0.022 },
};

/** Safety net: an agent loop must never run forever. */
export const MAX_TURNS = 25;
